/**
 * Aurova Model — dataset builder.
 *
 * Turns what the product already knows into supervised examples for fine-tuning:
 *
 *   1. Gold outlines  — every template/demo deck is reversed into (topic, category, count) →
 *      {"slides":[...]} in the exact schema `providerOutline` expects. These are human-authored,
 *      on-brand, RTL-correct: the highest-quality signal we have.
 *   2. Planner outlines — the deterministic local planner (`localOutline`) is run over a large
 *      topic bank × categories × counts × languages. It encodes our editorial rules (title = idea,
 *      2–4 bullets, closing with an ask), so the model learns the *shape* even on unseen topics.
 *      Marked `source: "planner"` so they can be down-weighted or replaced by teacher outputs later.
 *   3. Rewrite pairs — (text, op) → rewritten text, produced by `localRewrite` and filtered by the
 *      same `acceptable()` gate the editor applies to model output.
 *   4. Review examples — deck outlines with injected content defects → issue lists, teaching the
 *      content-review task (`reviewContentWithModel`).
 *
 * Output: JSONL in OpenAI chat format (system/user/assistant) under model/data/, split
 * train/valid, plus a stats file. Run with `npm run model:dataset`.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { TEMPLATES } from '../src/templates/catalog'
import { DEMO_DECKS } from '../src/demo/decks'
import type { DeckSpec, SlideSpec, TemplateCategory } from '../src/templates/engine'
import { DESIGN_HINTS_RULE, cleanTitle, inferCategory, localOutline, type OutlineSlide } from '../src/services/ai/generate'
import { acceptable, localRewrite, type RefineOp } from '../src/services/ai/refine'
import { createPresentation, createText } from '../src/document/factory'
import type { TextElement } from '../src/document/types'
import { TOPICS } from './topics'

type Msg = { role: 'system' | 'user' | 'assistant'; content: string }
interface Example {
  task: 'outline' | 'rewrite' | 'review'
  source: 'gold' | 'planner' | 'synthetic'
  lang: 'ar' | 'en'
  messages: Msg[]
}

const OUT = 'model/data/'
mkdirSync(OUT, { recursive: true })

/* ------------------------------------------------------------------ prompts (must match the app) */

function outlineSystem(lang: 'ar' | 'en', tone: string, audience: string, count: number): string {
  return [
    'أنت مخرج عروض تقديمية. أعد JSON فقط، دون شرح أو علامات تنسيق.',
    'الشكل: {"slides":[{"kind":"title|agenda|content|stats|quote|comparison|process|timeline|closing","title":"...","takeaways":["..."]}]}',
    `اللغة: ${lang === 'ar' ? 'العربية الفصحى الحديثة بلغة مهنية مباشرة' : 'English'}.`,
    `النبرة: ${tone}. الجمهور: ${audience}. عدد الشرائح: ${count}.`,
    'قواعد: عنوان كل شريحة فكرة لا تسمية قسم؛ نقاط ٢–٤ قصيرة؛ لا حشو ولا إحصاءات مختلقة؛ ضع شريحة title أولًا وشريحة closing أخيرة.',
    DESIGN_HINTS_RULE,
  ].join('\n')
}
const REWRITE_SYSTEM = (tone: string) => `أنت محرر عروض تقديمية. أعد النص المعدّل فقط دون شرح أو تنسيق. النبرة: ${tone}.`
const REWRITE_INSTR: Record<RefineOp, string> = {
  improve: 'حسّن الصياغة مع الحفاظ على المعنى والطول التقريبي.',
  shorten: 'اختصر إلى النصف تقريبًا مع إبقاء الأرقام والاستنتاجات.',
  formal: 'أعد الصياغة بنبرة رسمية مهنية.',
  title: 'اقترح عنوانًا من ٤ إلى ٧ كلمات يلخص الفكرة.',
}
const REVIEW_SYSTEM = (lang: 'ar' | 'en') =>
  [
    'أنت مراجع محتوى عروض تقديمية. أعد JSON فقط بالشكل:',
    '{"issues":[{"slide":<index>,"severity":"warn|info","message":"...","hint":"..."}]}',
    `اللغة: ${lang === 'ar' ? 'العربية' : 'English'}. أقصى ٨ ملاحظات، الأهم أولًا.`,
    'ركّز على: عنوان لا يحمل فكرة، حشو، ادّعاء بلا دليل، ترتيب غير منطقي، نقاط متكررة، خاتمة بلا طلب واضح.',
    'لا تعلّق على الألوان أو الخطوط أو التخطيط — يُفحص ذلك محليًا.',
  ].join('\n')

const TONES_AR = ['واثقة ومباشرة', 'رسمية', 'ودّية', 'مكثّفة']
const TONES_EN = ['confident and direct', 'formal', 'friendly', 'punchy']
const AUD_AR = ['إدارة عليا', 'مستثمرون', 'طلاب جامعيون', 'عملاء محتملون', 'فريق داخلي', 'جمهور عام']
const AUD_EN = ['executive leadership', 'investors', 'university students', 'prospective customers', 'an internal team', 'a general audience']

/* ------------------------------------------------------------------ helpers */

const rnd = mulberry32(20260916)
function mulberry32(a: number) {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]
const isAr = (s: string) => /[\u0600-\u06FF]/.test(s)
const strip = (v: string | string[] | undefined): string[] => (Array.isArray(v) ? v : v ? [v] : []).flatMap((x) => x.split('\n')).map((x) => x.replace(/^[✓✗•\-–]\s*/, '').trim()).filter(Boolean)

/** Serialise an outline exactly as we want the model to emit it (compact, stable key order). */
function outlineJson(slides: OutlineSlide[]): string {
  return JSON.stringify({
    slides: slides.map((s) => {
      const o: Record<string, unknown> = { kind: s.kind, title: s.title }
      if (s.takeaways?.length) o.takeaways = s.takeaways
      if (s.stat?.length) o.stat = s.stat
      if (s.quote) o.quote = s.quote
      if (s.steps?.length) o.steps = s.steps
      if (s.compare) o.compare = s.compare
      if (s.timeline?.length) o.timeline = s.timeline
      if (s.takeaway) o.takeaway = s.takeaway
      if (s.layout) o.layout = s.layout
      if (s.image) o.image = s.image
      if (s.bg) o.bg = s.bg
      if (s.notes) o.notes = s.notes
      return o
    }),
  })
}

/* ------------------------------------------------------------------ 1. gold: reverse decks */

const LAYOUT_TO_KIND: Record<string, OutlineSlide['kind']> = {
  title: 'title',
  'title-centered': 'title',
  section: 'content',
  'title-content': 'content',
  'two-columns': 'comparison',
  'image-text': 'content',
  'full-image': 'content',
  chart: 'stats',
  table: 'content',
  statistics: 'stats',
  quote: 'quote',
  process: 'process',
  timeline: 'timeline',
  comparison: 'comparison',
  closing: 'closing',
}

function slideToOutline(s: SlideSpec, i: number, n: number): OutlineSlide | null {
  const base = slideToOutlineBase(s, i, n)
  if (!base) return null
  // Design hints come straight from the human-authored spec: this is what v3 learns from.
  const hints: Partial<OutlineSlide> = { layout: s.layout }
  if (s.image) hints.image = s.image
  if (s.bg && s.bg !== 'default') hints.bg = s.bg
  if (s.notes) hints.notes = s.notes.slice(0, 400)
  const sub = strip(s.content?.subtitle)[0]
  if (sub && base.kind !== 'title') hints.takeaway = sub
  return { ...base, ...hints }
}

function slideToOutlineBase(s: SlideSpec, i: number, n: number): OutlineSlide | null {
  const c = s.content ?? {}
  const kind = i === 0 ? 'title' : i === n - 1 ? 'closing' : LAYOUT_TO_KIND[s.layout] ?? 'content'
  const title = strip(c.title)[0]
  if (!title) return null
  const body = strip(c.body)
  switch (kind) {
    case 'title':
      return { kind, title, takeaways: strip(c.subtitle).slice(0, 1) }
    case 'stats': {
      const values = strip(c.stat)
      if (!values.length) return { kind: 'content', title, takeaways: body.slice(0, 4) }
      return { kind, title, stat: values.map((v, k) => ({ value: v, label: body[k] ?? '' })) }
    }
    case 'quote': {
      const text = strip(c.quote)[0] ?? body[0]
      return text ? { kind, title, quote: { text, by: strip(c.footer)[0]?.replace(/^[—-]\s*/, '') } } : null
    }
    case 'process':
      return { kind, title, steps: (body.length ? body : ['تشخيص', 'تجربة', 'توسيع', 'قياس']).slice(0, 5) }
    case 'comparison': {
      const halves = (Array.isArray(c.body) ? c.body : [c.body ?? '']).map((h) => strip(h))
      if (halves.length >= 2 && halves[0].length && halves[1].length) {
        return { kind, title, compare: { left: { title: halves[0][0], points: halves[0].slice(0, 3) }, right: { title: halves[1][0], points: halves[1].slice(0, 3) } } }
      }
      return { kind: 'content', title, takeaways: body.slice(0, 4) }
    }
    case 'timeline':
      return { kind, title, timeline: body.slice(0, 5).map((what, k) => ({ when: `${k + 1}`, what })) }
    case 'closing':
      return { kind, title, takeaways: body.slice(0, 3) }
    default:
      return { kind: 'content', title, takeaways: body.slice(0, 4) }
  }
}

function deckToExamples(deck: DeckSpec, category: TemplateCategory): Example[] {
  const slides = deck.slides.map((s, i) => slideToOutline(s, i, deck.slides.length)).filter((x): x is OutlineSlide => !!x)
  if (slides.length < 3) return []
  const lang: 'ar' | 'en' = deck.lang === 'en' || !isAr(deck.title) ? 'en' : 'ar'
  const ar = lang === 'ar'
  const subject = deck.subject ?? deck.title
  // Several phrasings of the same request → same gold answer (teaches robustness to prompt wording).
  const prompts = ar
    ? [`الموضوع: ${subject}`, `الموضوع: اصنع عرضًا تقديميًا عن ${subject}`, `الموضوع: ${subject} — ${deck.tags?.slice(0, 2).join('، ') ?? ''}`.trim()]
    : [`الموضوع: ${subject}`, `الموضوع: create a presentation about ${subject}`]
  return prompts.map((p) => ({
    task: 'outline',
    source: 'gold',
    lang,
    messages: [
      { role: 'system', content: outlineSystem(lang, pick(ar ? TONES_AR : TONES_EN), pick(ar ? AUD_AR : AUD_EN), slides.length) },
      { role: 'user', content: `${p}\nالفئة: ${category}` },
      { role: 'assistant', content: outlineJson(slides) },
    ],
  }))
}

/* ------------------------------------------------------------------ 2. planner outlines */

function plannerExamples(): Example[] {
  const out: Example[] = []
  for (const topic of TOPICS) {
    const lang: 'ar' | 'en' = isAr(topic) ? 'ar' : 'en'
    const ar = lang === 'ar'
    const category = inferCategory(topic, lang)
    for (const count of [6, 9, 12]) {
      if (rnd() < 0.35) continue // thin out: ~2 counts per topic
      const slides = localOutline({ topic, count, lang, category })
      out.push({
        task: 'outline',
        source: 'planner',
        lang,
        messages: [
          { role: 'system', content: outlineSystem(lang, pick(ar ? TONES_AR : TONES_EN), pick(ar ? AUD_AR : AUD_EN), count) },
          { role: 'user', content: `الموضوع: ${topic}\nالفئة: ${category}` },
          { role: 'assistant', content: outlineJson(slides) },
        ],
      })
    }
  }
  return out
}

/* ------------------------------------------------------------------ 3. rewrite pairs */

function rewriteExamples(): Example[] {
  const doc = createPresentation({ title: 'dataset' })
  const el: TextElement = createText(doc.theme, { role: 'body' })
  const out: Example[] = []
  const seen = new Set<string>()
  const texts: string[] = []
  for (const deck of [...TEMPLATES, ...DEMO_DECKS]) {
    for (const s of deck.slides) {
      for (const v of Object.values(s.content ?? {})) for (const t of strip(v as string | string[])) if (t.split(/\s+/).length >= 4) texts.push(t)
      if (s.notes) texts.push(s.notes)
    }
  }
  for (const text of texts) {
    // `title` is left to the teacher pass: the local heuristic only truncates, which is not a target worth learning.
    for (const op of ['improve', 'shorten', 'formal'] as RefineOp[]) {
      const next = localRewrite(text, op, el, doc)
      if (!next || next === text || !acceptable(text, next, op)) continue
      const key = `${op}|${text}`
      if (seen.has(key)) continue
      seen.add(key)
      const ar = isAr(text)
      out.push({
        task: 'rewrite',
        source: 'planner',
        lang: ar ? 'ar' : 'en',
        messages: [
          { role: 'system', content: REWRITE_SYSTEM(pick(ar ? TONES_AR : TONES_EN)) },
          { role: 'user', content: `${REWRITE_INSTR[op]}\n\nالنص:\n${text}` },
          { role: 'assistant', content: next },
        ],
      })
    }
  }
  return out
}

/* ------------------------------------------------------------------ 4. review examples */

function reviewExamples(golden: { deck: DeckSpec; slides: OutlineSlide[] }[]): Example[] {
  const out: Example[] = []
  for (const { deck, slides } of golden) {
    const ar = isAr(deck.title)
    const lang: 'ar' | 'en' = ar ? 'ar' : 'en'
    // Inject defects with known fixes so the target labels are exact.
    const texts = slides.map((s) => [s.title, ...(s.takeaways ?? s.steps ?? s.stat?.map((x) => x.label) ?? [])])
    const issues: { slide: number; severity: 'warn' | 'info'; message: string; hint: string }[] = []
    const idx = slides.map((_, i) => i).filter((i) => i > 0 && i < slides.length - 1)
    if (idx.length >= 2) {
      const a = pick(idx)
      texts[a][0] = ar ? pick(['مقدمة', 'نظرة عامة', 'التحليل', 'الخلفية']) : pick(['Introduction', 'Overview', 'Analysis', 'Background'])
      issues.push({ slide: a, severity: 'warn', message: ar ? 'العنوان تسمية قسم لا فكرة.' : 'The title labels a section instead of stating an idea.', hint: ar ? 'صِغه كجملة تحمل الاستنتاج الذي تريد أن يخرج به الجمهور.' : 'Rewrite it as the sentence you want the audience to remember.' })
      const b = pick(idx.filter((i) => i !== a)) ?? a
      texts[b].push(ar ? 'نمو بنسبة ٣٠٠٪ خلال شهر واحد' : '300% growth in a single month')
      issues.push({ slide: b, severity: 'warn', message: ar ? 'ادّعاء رقمي بلا مصدر أو سياق.' : 'A numeric claim without a source or context.', hint: ar ? 'أضف المصدر والفترة والمقارنة، أو احذفه.' : 'Add the source, period and baseline — or drop it.' })
      const c = pick(idx)
      if (texts[c].length > 1) {
        texts[c].push(texts[c][1])
        issues.push({ slide: c, severity: 'info', message: ar ? 'نقطة مكررة في الشريحة.' : 'A bullet repeats another on the same slide.', hint: ar ? 'ادمج النقطتين أو احذف إحداهما.' : 'Merge or remove the duplicate.' })
      }
      if (rnd() < 0.5) {
        const last = slides.length - 1
        texts[last] = [texts[last][0]]
        issues.push({ slide: last, severity: 'warn', message: ar ? 'الخاتمة بلا طلب واضح من الجمهور.' : 'The closing slide makes no clear ask.', hint: ar ? 'اختم بقرار أو خطوة تالية محددة.' : 'End with a specific decision or next step.' })
      }
    }
    issues.sort((x, y) => (x.severity === y.severity ? x.slide - y.slide : x.severity === 'warn' ? -1 : 1))
    out.push({
      task: 'review',
      source: 'synthetic',
      lang,
      messages: [
        { role: 'system', content: REVIEW_SYSTEM(lang) },
        { role: 'user', content: JSON.stringify({ title: deck.title, slides: texts.map((t, index) => ({ index, texts: t })) }) },
        { role: 'assistant', content: JSON.stringify({ issues }) },
      ],
    })
    // A clean copy → empty issue list, so the model learns to say "nothing" too.
    out.push({
      task: 'review',
      source: 'synthetic',
      lang,
      messages: [
        { role: 'system', content: REVIEW_SYSTEM(lang) },
        { role: 'user', content: JSON.stringify({ title: deck.title, slides: slides.map((s, index) => ({ index, texts: [s.title, ...(s.takeaways ?? s.steps ?? [])] })) }) },
        { role: 'assistant', content: JSON.stringify({ issues: [] }) },
      ],
    })
  }
  return out
}

/* ------------------------------------------------------------------ 5. user feedback (opt-in export from the app) */

interface FeedbackRecord {
  prompt: string
  lang: 'ar' | 'en'
  category: string
  engine: 'local' | 'provider'
  generated: { slides: { layout: string; title: string; points: string[] }[] }
  edited?: { slides: { layout: string; title: string; points: string[] }[] }
  rating?: 'up' | 'down'
}

function snapshotToOutline(snap: FeedbackRecord['generated']): OutlineSlide[] {
  return snap.slides
    .map((s, i): OutlineSlide | null => {
      if (!s.title) return null
      const kind: OutlineSlide['kind'] = i === 0 ? 'title' : i === snap.slides.length - 1 ? 'closing' : LAYOUT_TO_KIND[s.layout] ?? 'content'
      if (kind === 'stats') return { kind: 'content', title: s.title, takeaways: s.points.slice(0, 4) }
      if (kind === 'quote') return s.points[0] ? { kind, title: s.title, quote: { text: s.points[0] } } : null
      if (kind === 'process') return { kind, title: s.title, steps: s.points.slice(0, 5) }
      if (kind === 'comparison' || kind === 'timeline') return { kind: 'content', title: s.title, takeaways: s.points.slice(0, 4) }
      return { kind, title: s.title, takeaways: s.points.slice(0, kind === 'title' ? 1 : 4) }
    })
    .filter((x): x is OutlineSlide => !!x)
}

/**
 * Two products from each feedback record:
 *  • SFT: the *edited* deck (or an 👍 unedited one) is a gold-quality target.
 *  • DPO: (generated, edited) → (rejected, chosen) when the user materially changed it, or when 👎.
 */
function feedbackExamples(): { sft: Example[]; dpo: { prompt: Msg[]; chosen: string; rejected: string; meta: Record<string, unknown> }[] } {
  const file = 'model/data/feedback.jsonl'
  const sft: Example[] = []
  const dpo: { prompt: Msg[]; chosen: string; rejected: string; meta: Record<string, unknown> }[] = []
  if (!existsSync(file)) return { sft, dpo }
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue
    let r: FeedbackRecord
    try {
      r = JSON.parse(line)
    } catch {
      continue
    }
    const gen = snapshotToOutline(r.generated)
    const ed = r.edited ? snapshotToOutline(r.edited) : null
    if (gen.length < 3) continue
    const ar = r.lang === 'ar'
    const prompt: Msg[] = [
      { role: 'system', content: outlineSystem(r.lang, pick(ar ? TONES_AR : TONES_EN), pick(ar ? AUD_AR : AUD_EN), (ed ?? gen).length) },
      { role: 'user', content: `الموضوع: ${r.prompt}\nالفئة: ${r.category}` },
    ]
    const changed = ed && outlineJson(ed) !== outlineJson(gen)
    const target = changed ? ed : r.rating === 'up' ? gen : null
    if (target && target.length >= 3) sft.push({ task: 'outline', source: 'gold', lang: r.lang, messages: [...prompt, { role: 'assistant', content: outlineJson(target) }] })
    if (changed && ed.length >= 3) dpo.push({ prompt, chosen: outlineJson(ed), rejected: outlineJson(gen), meta: { engine: r.engine, rating: r.rating ?? null } })
  }
  return { sft, dpo }
}

/* ------------------------------------------------------------------ main */

const golden: { deck: DeckSpec; slides: OutlineSlide[] }[] = []
const examples: Example[] = []
for (const t of TEMPLATES) {
  examples.push(...deckToExamples(t, t.category))
  golden.push({ deck: t, slides: t.slides.map((s, i) => slideToOutline(s, i, t.slides.length)).filter((x): x is OutlineSlide => !!x) })
}
for (const d of DEMO_DECKS) {
  const cat = d.categories?.[0] ?? inferCategory(d.title, isAr(d.title) ? 'ar' : 'en')
  examples.push(...deckToExamples(d, cat))
  golden.push({ deck: d, slides: d.slides.map((s, i) => slideToOutline(s, i, d.slides.length)).filter((x): x is OutlineSlide => !!x) })
}
examples.push(...plannerExamples())
examples.push(...rewriteExamples())
examples.push(...reviewExamples(golden))
const fb = feedbackExamples()
examples.push(...fb.sft)
if (fb.dpo.length) writeFileSync(`${OUT}dpo.jsonl`, fb.dpo.map((x) => JSON.stringify(x)).join('\n') + '\n')

// sanity: every assistant JSON parses, every title cleaned
let bad = 0
for (const ex of examples) {
  const a = ex.messages[2].content
  if (ex.task !== 'rewrite') {
    try {
      JSON.parse(a)
    } catch {
      bad++
    }
  }
  if (ex.task === 'outline') {
    const first = (JSON.parse(a) as { slides: OutlineSlide[] }).slides
    if (first[0].kind !== 'title' || first[first.length - 1].kind !== 'closing') {
      bad++
      console.error('bad frame', ex.source, first[0].kind, first[first.length - 1].kind, first[first.length - 1].title)
    }
    for (const s of first) s.title = cleanTitle(s.title, ex.lang)
  }
}
if (bad) throw new Error(`${bad} malformed examples`)

// deterministic shuffle + split
for (let i = examples.length - 1; i > 0; i--) {
  const j = Math.floor(rnd() * (i + 1))
  ;[examples[i], examples[j]] = [examples[j], examples[i]]
}
const validN = Math.max(20, Math.floor(examples.length * 0.08))
const valid = examples.slice(0, validN)
const train = examples.slice(validN)
const line = (e: Example) => JSON.stringify({ messages: e.messages, meta: { task: e.task, source: e.source, lang: e.lang } })
writeFileSync(`${OUT}train.jsonl`, train.map(line).join('\n') + '\n')
writeFileSync(`${OUT}valid.jsonl`, valid.map(line).join('\n') + '\n')

const count = (k: keyof Example, v: string) => examples.filter((e) => e[k] === v).length
const stats = {
  total: examples.length,
  train: train.length,
  valid: valid.length,
  byTask: { outline: count('task', 'outline'), rewrite: count('task', 'rewrite'), review: count('task', 'review') },
  bySource: { gold: count('source', 'gold'), planner: count('source', 'planner'), synthetic: count('source', 'synthetic') },
  byLang: { ar: count('lang', 'ar'), en: count('lang', 'en') },
  topics: TOPICS.length,
  goldDecks: golden.length,
  feedback: { sft: fb.sft.length, dpo: fb.dpo.length },
}
writeFileSync(`${OUT}stats.json`, JSON.stringify(stats, null, 2))
console.log('Aurova dataset →', OUT)
console.table(stats.byTask)
console.log(stats)
