/**
 * Create-with-AI — prompt → `DeckSpec` → editable elements.
 *
 * The pipeline is explicit because it is the product's core promise:
 *   outline (slide plan)  →  slide structure (layout + roles)  →  content per role  →  design system
 *   →  instantiateDeck() into real text/shape/chart/table elements.
 *
 * Nothing here produces pictures of slides. When a provider is configured we ask it for the
 * *outline and copy only* (a strict JSON contract); the layout, spacing and typography stay ours,
 * which is what keeps the output on-brand and editable. Without a provider the local planner
 * writes a real structure from the prompt so the feature is never a stub.
 */
import { LAYOUTS } from '../../templates/layouts'
import type { ArtKind, DeckSpec, SlideSpec, TemplateCategory } from '../../templates/engine'
import { THEME_PRESETS } from '../../document/factory'
import { useUI } from '../../store/useUI'
import { chat, isRemoteReady, toConn } from './providers'

export interface GenerateOptions {
  slides?: number
  category?: TemplateCategory
  audience?: string
  style?: 'minimal' | 'business' | 'creative' | 'academic' | 'bold'
  lang?: 'ar' | 'en'
  tone?: string
  onStage?: (stage: string, done: number, total: number) => void
}

export interface GenerateResult {
  spec: DeckSpec
  engine: 'local' | 'provider'
  outline: string[]
}

const LAYOUT_IDS = new Set(LAYOUTS.map((l) => l.id))

export async function generateDeck(prompt: string, opts: GenerateOptions = {}): Promise<GenerateResult> {
  const topic = prompt.trim().replace(/\s+/g, ' ')
  const total = 3
  opts.onStage?.('بناء الهيكل', 0, total)

  const lang = opts.lang ?? (/[؀-ۿ]/.test(topic) ? 'ar' : 'en')
  const count = clampCount(opts.slides ?? inferCount(topic))
  const category = opts.category ?? inferCategory(topic, lang)
  const style = opts.style ?? inferStyle(topic)
  const audience = opts.audience?.trim() || (lang === 'ar' ? 'جمهور مهتم بالموضوع' : 'A general professional audience')
  const tone = opts.tone ?? (lang === 'ar' ? 'واثقة ومباشرة' : 'confident and direct')

  let outline: OutlineSlide[]
  let engine: 'local' | 'provider' = 'local'

  const ai = useUI.getState().ai
  if (isRemoteReady(toConn(ai))) {
    opts.onStage?.(ai.provider === 'aurova' ? 'نموذج Aurova' : 'استخدام المزوّد', 1, total)
    const remote = await providerOutline({ topic, count, lang, audience, tone, category })
    if (remote?.length) {
      outline = remote
      engine = 'provider'
    } else {
      outline = localOutline({ topic, count, lang, category })
    }
  } else {
    opts.onStage?.('توليد محلي', 1, total)
    outline = localOutline({ topic, count, lang, category })
  }

  opts.onStage?.('توزيع التخطيطات', 2, total)
  const slides = outline.map((item, i) => toSlideSpec(item, { i, n: outline.length, topic, lang, category }))
  const spec: DeckSpec = {
    id: `ai-${Date.now().toString(36)}`,
    title: cleanTitle(topic, lang),
    subject: subtitleFor(outline, lang, audience),
    author: 'Aurova AI',
    lang,
    dir: lang === 'ar' ? 'rtl' : 'ltr',
    themeId: themeFor(style, category),
    categories: [category],
    tags: tagsFor(topic, lang, category),
    slides,
  }
  opts.onStage?.('تم', 3, total)
  return { spec, engine, outline: outline.map((o) => o.title) }
}

function clampCount(v: number): number {
  return Math.max(4, Math.min(30, Math.round(v) || 8))
}

function inferCount(topic: string): number {
  const num = /(\d{1,2})\s*(شرائح؟|شرائح|slides?|صفحات?)/i.exec(topic)
  if (num) return Number(num[1])
  if (/\b(\d{1,2})\s*(slide|شريحة|شرائح)\b/i.test(topic)) return Number(/\b(\d{1,2})\b/.exec(topic)?.[1] ?? 8)
  if (/(مختصر|قصير|quick|short|brief|ملخص)/i.test(topic)) return 6
  if (/(مفصل|طويل|comprehensive|deep|detailed|full)/i.test(topic)) return 14
  return 9
}

export function inferCategory(topic: string, lang: string): TemplateCategory {
  const t = topic.toLowerCase()
  const has = (words: string[]) => words.some((w) => t.includes(w))
  if (has(['pitch', 'استثمار', 'مستثمر', 'شركة ناشئة', 'startup', 'fundrais', 'تمويل'])) return 'pitch'
  if (has(['تسويق', 'marketing', 'حملة', 'campaign', 'brand', 'علامة'])) return 'marketing'
  if (has(['تعليم', 'درس', 'course', 'lesson', 'training', 'تدريب', 'ورشة'])) return 'education'
  if (has(['بحث', 'رسالة', 'thesis', 'academic', 'أكاديمي', 'paper'])) return 'academic'
  if (has(['تقرير', 'quarterly', 'report', 'مراجعة أداء', 'نتائج'])) return 'report'
  if (has(['معرض', 'portfolio', 'أعمالي', 'personal'])) return 'portfolio'
  if (has(['تصميم', 'creative', 'إبداع', 'فني'])) return 'creative'
  if (lang === 'en' && has(['minimal', 'clean'])) return 'minimal'
  return 'business'
}

function inferStyle(topic: string): GenerateOptions['style'] {
  const t = topic.toLowerCase()
  if (/( بسيط|minimal|clean|هادئ)/.test(t)) return 'minimal'
  if (/(ابداع|creative|جريء|bold|فني)/.test(t)) return 'creative'
  if (/(استثمار|pitch|business|أعمال|تقرير|quarterly)/.test(t)) return 'business'
  if (/(بحث|academic|thesis|رسالة|تعليم|education|lesson)/.test(t)) return 'academic'
  return 'business'
}

function themeFor(style: GenerateOptions['style'], category: TemplateCategory): string {
  const want: Record<string, string[]> = {
    minimal: ['paper-light', 'minimal-mono', 'mono-slate'],
    business: ['midnight-signal', 'navy-gold', 'slate-ink'],
    creative: ['sunset-clay', 'violet-pop', 'midnight-signal'],
    academic: ['paper-light', 'slate-ink', 'navy-gold'],
    bold: ['midnight-signal', 'violet-pop', 'sunset-clay'],
  }
  const preferred = want[style ?? (category === 'academic' ? 'academic' : 'business')] ?? []
  const byName = preferred.find((id) => THEME_PRESETS.some((p) => p.id === id))
  const fallback = category === 'pitch' || category === 'creative' ? 'midnight-signal' : 'paper-light'
  return byName ?? (THEME_PRESETS.some((p) => p.id === fallback) ? fallback : THEME_PRESETS[0].id)
}

export function cleanTitle(topic: string, lang: 'ar' | 'en'): string {
  let t = topic
    .replace(/^(اصنع|أنشئ|اعمل|صمم|أنشأ|create|make|build|generate)\s+(لي\s+)?(عرضًا تقديميًا|عرض تقديمي|معرض|presentation|deck|slides?)\s*(عن|لـ|about|for|on)?\s*/i, '')
    .replace(/[.!?؟]+\s*$/, '')
    .trim()
  if (!t) t = topic
  if (lang === 'ar') t = t.charAt(0).toUpperCase() + t.slice(1)
  return t.length > 64 ? `${t.slice(0, 61)}…` : t
}

function subtitleFor(outline: OutlineSlide[], lang: 'ar' | 'en', audience: string): string {
  const first = outline.find((o) => o.kind === 'content')
  const base = first ? first.takeaway ?? first.title : ''
  if (lang === 'ar') return `${base ? `${truncate(base, 90)} · ` : ''}معدّ لـ${audience}`
  return `${base ? `${truncate(base, 100)} · ` : ''}prepared for ${audience}`
}

function truncate(text: string, n: number): string {
  return text.length > n ? `${text.slice(0, n - 1)}…` : text
}

function tagsFor(topic: string, lang: 'ar' | 'en', category: TemplateCategory): string[] {
  const stop = new Set(lang === 'ar' ? ['عن', 'الذي', 'التي', 'إلى', 'من', 'في', 'على', 'مع', 'هذا', 'هذه', 'لك', 'أن', 'او', 'أو', 'how', 'the', 'and', 'for', 'with', 'about', 'make', 'deck', 'slide', 'presentation'] : ['the', 'and', 'for', 'with', 'about'])
  const words = topic
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stop.has(w))
  const unique = Array.from(new Set(words)).slice(0, 3)
  return Array.from(new Set([...unique, category]))
}

/* ------------------------------------------------------------------ planning */

export interface OutlineSlide {
  kind: 'title' | 'agenda' | 'content' | 'stats' | 'quote' | 'comparison' | 'process' | 'timeline' | 'closing'
  title: string
  takeaways?: string[]
  stat?: { value: string; label: string }[]
  quote?: { text: string; by?: string }
  compare?: { left: { title: string; points: string[] }; right: { title: string; points: string[] } }
  steps?: string[]
  timeline?: { when: string; what: string }[]
  takeaway?: string
  image?: ArtKind
}

interface LocalInput {
  topic: string
  count: number
  lang: 'ar' | 'en'
  category: TemplateCategory
}

/**
 * A structural writer, not a text spinner: it extracts the real signals in the prompt (numbers,
 * questions, "vs", steps) and builds the deck around them, padding with genuinely useful framing
 * questions rather than filler prose.
 */
export function localOutline({ topic, count, lang, category }: LocalInput): OutlineSlide[] {
  const ar = lang === 'ar'
  const clean = cleanTitle(topic, lang)
  const signals = extractSignals(topic)
  const chapters = buildChapters(signals, clean, ar, category, count)

  const outline: OutlineSlide[] = [
    { kind: 'title', title: clean, takeaway: ar ? `لماذا يهمّ هذا الموضوع الآن — وما الذي يتغيّر إن تجاهلناه` : `Why this matters now — and what changes if we ignore it` },
    {
      kind: 'agenda',
      title: ar ? 'خريطة العرض' : 'What we will cover',
      takeaways: chapters.slice(0, Math.min(6, Math.max(3, count - 4)).valueOf()).map((c) => c.title),
    },
  ]

  const budget = Math.max(2, count - outline.length - 1)
  for (let i = 0; i < budget; i++) {
    const chapter = chapters[i % chapters.length]
    const variant = i % 5
    if (i === 0 && signals.numbers.length) {
      outline.push({
        kind: 'stats',
        title: ar ? 'الأرقام التي تغيّر النقاش' : 'The numbers that change the conversation',
        stat: signals.numbers.slice(0, 3).map((n, k) => ({ value: n, label: ar ? `المؤشر ${k + 1} في سياق ${clean}` : `Signal ${k + 1} for ${clean}` })),
        takeaway: ar ? 'لا تسرد الأرقام — اربط كل رقم بقرار يتخذه أحدهم.' : 'Tie each number to a decision someone has to make.',
      })
      continue
    }
    if (signals.vs && variant === 1) {
      const [left, right] = signals.vs
      outline.push({
        kind: 'comparison',
        title: ar ? `${left} أم ${right}؟` : `${left} or ${right}?`,
        compare: {
          left: { title: left, points: ar ? ['مناسب إذا كان Constraint الوقت حرجًا', 'تكلفة أقل في البداية', 'مخاطرة التبني أبطأ'] : ['Best when time-to-value is the constraint', 'Lower upfront cost', 'Slower adoption risk'] },
          right: { title: right, points: ar ? ['جاهز للتوسع منذ اليوم الأول', 'استثمار أعلى لكن أقل تعديلًا لاحقًا', 'يتطلب مالك قرار واضحًا'] : ['Scales from day one', 'Higher investment, less rework', 'Needs a clear decision owner'] },
        },
      })
      continue
    }
    if ((category === 'business' || category === 'report') && variant === 2) {
      outline.push({
        kind: 'process',
        title: ar ? 'كيف ننفّذ هذا' : 'How we would execute this',
        steps: ar ? ['شخّص الوضع الحالي بالأرقام', 'اختر نقطة بداية واحدة', 'قِس الأثر بعد ٣٠ يومًا', 'وسّع ما نجح فقط'] : ['Diagnose today with numbers', 'Pick one starting point', 'Measure after 30 days', 'Scale only what worked'],
      })
      continue
    }
    if (variant === 3) {
      outline.push({
        kind: 'timeline',
        title: ar ? 'المسار الزمني' : 'The path ahead',
        timeline: [
        { when: ar ? 'الآن' : 'Now', what: ar ? `حسم أولوية ${clean}` : `Decide the priority for ${clean}` },
        { when: ar ? '٩٠ يومًا' : '90 days', what: ar ? 'أول نتيجة قابلة للقياس' : 'First measurable result' },
        { when: ar ? 'الربع القادم' : 'Next quarter', what: ar ? 'توسيع النطاق' : 'Widen the scope' },
      ],
      })
      continue
    }
    outline.push({
      kind: 'content',
      title: chapter.title,
      takeaways: chapter.points,
      takeaway: chapter.why,
      image: i % 3 === 0 ? artFor(category, i) : undefined,
    })
  }

  if (category === 'pitch' || category === 'startup') {
    outline.splice(Math.min(2, outline.length), 0, {
      kind: 'quote',
      title: ar ? 'ما يقوله العملاء' : 'What customers say',
      quote: { text: ar ? `«لم نكن نبحث عن أداة جديدة، كنا نبحث عن طريقة لإنهاء هذا النقاش كل ربع.»` : `“We were not looking for another tool — we wanted to stop having this conversation every quarter.”`, by: ar ? 'مدير تشغيل، عميل مبكر' : 'Head of Operations, early customer' },
    })
  }

  const closing: OutlineSlide = {
    kind: 'closing',
    title: ar ? 'ما نطلبه الآن' : 'What we are asking for',
    takeaways: ar ? ['قرار واحد هذا الأسبوع', 'مالك وقت واضح للتجربة', 'مراجعة النتائج بعد ٣٠ يومًا'] : ['One decision this week', 'A named owner for the trial', 'Results review in 30 days'],
  }
  // Trim the middle, never the closing — the deck must always end with an ask.
  return [...outline.slice(0, Math.max(4, count) - 1), closing]
}

interface Signals {
  numbers: string[]
  years: string[]
  vs: [string, string] | null
  questions: string[]
}

function extractSignals(topic: string): Signals {
  const numberMatches = Array.from(topic.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:٪|%|x|أضعاف|million|billion|k)/gi))
  const numbers = numberMatches.map((m) => m[0].trim()).slice(0, 4)
  const years = Array.from(topic.matchAll(/20\d{2}/g)).map((m) => m[0]).slice(0, 3)
  const vsMatch = /(.+?)\s+(?:أو|vs\.?|versus|amids)\s+(.+?)(?:[.!؟?]|$)/i.exec(topic)
  const vs = vsMatch ? [truncate(vsMatch[1].trim(), 22), truncate(vsMatch[2].trim(), 22)] as [string, string] : null
  const questions = Array.from(topic.matchAll(/([^؛;.؟?]{12,90}[؟?])/g)).map((m) => m[1].trim())
  return { numbers: [...numbers, ...years], years, vs, questions }
}

interface Chapter {
  title: string
  points: string[]
  why: string
}

function buildChapters(signals: Signals, topic: string, ar: boolean, category: TemplateCategory, count: number): Chapter[] {
  const bank: Record<string, Chapter[]> = {
    ar: categoryChaptersAr(topic, category),
    en: categoryChaptersEn(topic, category),
  }
  const base = bank[ar ? 'ar' : 'en']
  const extra: Chapter[] = signals.questions.length
    ? signals.questions.slice(0, 2).map((q, i) => ({
        title: ar ? `الإجابة عن: ${truncate(q, 52)}` : `Answering: ${truncate(q, 52)}`,
        points: ar ? ['نصيغ السؤال كما يسمعه الجمهور', 'نجيب بجملة واحدة ثم بدليل', 'نختم بما يتغير عمليًا'] : ['State the question as the room hears it', 'Answer in one sentence, then evidence', 'Close with what changes in practice'],
        why: ar ? 'الأسئلة الحاضرة في الغرفة تستحق شريحة خاصة.' : 'The questions already in the room deserve their own slide.',
        _i: i,
      }))
    : []
  const withSignals: Chapter[] = signals.numbers.length
    ? [
        {
          title: ar ? `لماذا الآن: ${signals.numbers[0]}` : `Why now: ${signals.numbers[0]}`,
          points: ar
            ? [`التغيّر الذي نراه مُقاس بـ${signals.numbers.slice(0, 2).join(' و')}`, 'من يتحرك أولًا يأخذ الحيز، لا الأداة الأفضل', 'التكلفة الحقيقية هي التأجيل، لا التنفيذ']
            : [`The shift is measurable: ${signals.numbers.slice(0, 2).join(' and ')}`, 'First movers take the ground, not the best tool', `The real cost is delay, not execution`],
          why: ar ? 'التوقيت جزء من الإقناع، لا ملحق به.' : 'Timing is part of the argument, not an appendix.',
        },
      ]
    : []
  const all = [...withSignals, ...extra, ...base]
  const needed = Math.max(2, count - 3)
  const out: Chapter[] = []
  while (out.length < needed) {
    for (const chapter of all) {
      if (out.length >= needed) break
      out.push(chapter)
    }
  }
  return out
}

function categoryChaptersAr(topic: string, category: TemplateCategory): Chapter[] {
  const t = topic
  const common: Chapter[] = [
    { title: 'ما المشكلة فعلًا', points: ['نسمّي المشكلة بجملة واحدة، لا بفئة عامة', 'من يتحمّل كلفتها اليوم وكم تدفع', 'لماذا لم تُحلّ بالاجتماعات السابقة'], why: 'لا يوجد عرض جيد يبدأ بالحلول.' },
    { title: 'ما يقترحه هذا العرض', points: ['النتيجة التي نريد الوصول إليها', 'ما الذي نفعله differently — بثلاث جمل', 'ما لا نفعله حتى لا نبيع وهمًا'], why: `وضوح ${t} يبيع أكثر من التفاصيل.` },
    { title: 'كيف يعمل عمليًا', points: ['نقطة البداية والبيانات المطلوبة', 'أول أسبوع: ما الذي يحدث فعلًا', 'الحلقة التي تُبقي النتيجة حيّة'], why: 'الآلية تُزيل الخوف من التنفيذ.' },
    { title: 'المخاطر وكيف نتعامل معها', points: ['المخاطرة الأوضح وأول إنذار لها', 'خطة بديلة قابلة للتشغيل خلال أسبوع', 'ما الذي نوقفه إذا لم يعمل'], why: 'ذكر المخاطر يرفع الثقة لا يخفضها.' },
  ]
  const byCat: Partial<Record<TemplateCategory, Chapter[]>> = {
    pitch: [
      { title: 'الفرصة والسوق', points: ['حجم الفرصة بمنطق المشتري لا بمنطق المستثمر', 'لماذا الآن — القوة الدافعة الواضحة', 'من يدفع أولًا ولماذا'], why: 'الفرصة تُقاس بالقرار لا بالحجم.' },
      { title: 'نموذج الإيراد', points: ['من يدفع وكم ولمذا في كل شهر', 'أين نحن من متوسط السوق ولماذا', 'ما الذي يتغيّر عند ١٠ أضعاف'], why: 'النموذج البسيط يُفهم أسرع.' },
    ],
    marketing: [
      { title: 'الجمهور والرسالة', points: ['شخصيتان أساسيتان لا عشر شرائح', 'الرسالة التي تغيّر السلوك، لا التي تُعجب', 'القناة التي نتحمّل نتائجها'], why: `رسالة واحدة لكل ${t}.` },
      { title: 'الحملة وقنواتها', points: ['ثلاث مراحل: إثارة، اعتبار، تحويل', 'المحتوى الذي يخدم كل مرحلة', 'ما نقيسه في كل قناة'], why: 'القنوات تتغير، المراحل تبقى.' },
    ],
    education: [
      { title: 'أهداف التعلّم', points: ['ما الذي سيفعله المتعلم بعد الحصة', 'مخرجان قابلان للملاحظة', 'ما لا يشملُه الدرس اليوم'], why: 'الهدف القابل للقياس يوجّه كل نشاط.' },
      { title: 'النشاط والتقويم', points: ['تمرين قصير بعد كل مفهوم', 'سؤال خروج يقيس الفهم لا الحفظ', 'معايير واضحة للتغذية الراجعة'], why: 'التقويم جزء من التعليم لا نهاية له.' },
    ],
    academic: [
      { title: 'السؤال والمنهج', points: ['الفجوة في الأدبيات بجملة', 'المنهج ولمذا يناسب هذا السؤال', 'حدود الدراسة معلنة لا مخفية'], why: 'الصدق المنهجي يبني الثقة.' },
      { title: 'النتائج والمناقشة', points: ['النتيجة الرئيسية أولًا', 'ما يؤكد الأدبيات وما يخالفها', 'ما الذي يفتح البحث القادم'], why: 'النتيجة بلا تفسير لا تُقرأ.' },
    ],
    report: [
      { title: 'الأداء مقابل الخطة', points: ['الفجوة بين المستهدف والمُحقق', 'سبب واحد مهيمن لكل انحراف', 'ما ينفَّذ هذا الشهر'], why: 'التقرير الذي لا يغيّر قرارًا تأخير.' },
    ],
    portfolio: [
      { title: 'حالة عمل', points: ['سياق المشروع والقيود', 'قرارات التصميم ولماذا', 'النتيجة بالأرقام أو بالملاحظة'], why: 'القرار أهم من الصورة.' },
    ],
    creative: [{ title: 'الفكرة والبصمة', points: ['الصور التي نستخدمها ولماذا', 'الإيقاع: ما يتكرر وما ينكسر', 'ما نشعر به عند المشاهدة'], why: 'الاتساق مع كسر متعمَّد.' }],
  }
  return [...(byCat[category] ?? []), ...common]
}

function categoryChaptersEn(topic: string, category: TemplateCategory): Chapter[] {
  const common: Chapter[] = [
    { title: 'The actual problem', points: ['Name it in one sentence, not a category', 'Who pays for it today, and how much', 'Why previous meetings did not solve it'], why: 'No good deck starts with the solution.' },
    { title: 'What we propose', points: ['The outcome we are driving at', 'What we do differently — in three lines', 'What we explicitly do not do'], why: `Clarity about ${topic} beats detail.` },
    { title: 'How it works', points: ['Starting point and required inputs', 'What happens in week one', 'The loop that keeps the result alive'], why: 'Mechanics remove execution fear.' },
    { title: 'Risks and mitigations', points: ['The obvious risk and its early signal', 'A fallback that runs within a week', 'What we stop if it does not work'], why: 'Naming risk raises confidence.' },
  ]
  const byCat: Partial<Record<TemplateCategory, Chapter[]>> = {
    pitch: [
      { title: 'Market and timing', points: ['Opportunity sized by buyer decisions', 'The force that makes now different', 'Who moves first and why'], why: 'Opportunity is measured in decisions.' },
      { title: 'Business model', points: ['Who pays, how much, every month', 'Where we sit versus category norms', 'What changes at 10× volume'], why: 'Simple models get understood.' },
    ],
    marketing: [
      { title: 'Audience and message', points: ['Two personas, not ten segments', 'The message that changes behavior', 'The channel we will own results for'], why: 'One message per audience.' },
      { title: 'Campaign motion', points: ['Three phases: trigger, consider, convert', 'Content that serves each phase', 'The one metric per channel'], why: 'Channels change, phases persist.' },
    ],
    education: [
      { title: 'Learning objectives', points: ['What learners will do afterwards', 'Two observable outcomes', 'What today’s lesson excludes'], why: 'Measurable goals drive activities.' },
      { title: 'Practice and assessment', points: ['A short task after each concept', 'An exit question testing understanding', 'Transparent feedback criteria'], why: 'Assessment is teaching, not an ending.' },
    ],
    academic: [
      { title: 'Question and method', points: ['The gap in the literature, in one line', 'Method and why it fits the question', 'Limitations stated, not hidden'], why: 'Methodological honesty builds trust.' },
      { title: 'Results and discussion', points: ['Headline result first', 'Where it confirms and where it contradicts', 'What it opens for next research'], why: 'Results without interpretation go unread.' },
    ],
    report: [{ title: 'Plan versus actual', points: ['The gap, quantified', 'One dominant cause per deviation', 'What we execute this month'], why: 'A report that changes nothing is a delay.' }],
    portfolio: [{ title: 'Case study', points: ['Context and constraints', 'Design decisions and why', 'Outcome, measured or observed'], why: 'Decisions matter more than screenshots.' }],
    creative: [{ title: 'Idea and signature', points: ['The images we use and why', 'Rhythm: what repeats, what breaks', 'What it should feel like'], why: 'Consistency with deliberate breaks.' },],
  }
  return [...(byCat[category] ?? []), ...common]
}

function artFor(category: TemplateCategory, i: number): ArtKind {
  const pool: ArtKind[] = ['aurora', 'grid', 'waves', 'city', 'lab', 'product', 'paper', 'portrait']
  const byCat: Partial<Record<TemplateCategory, ArtKind>> = {
    pitch: 'aurora',
    startup: 'aurora',
    business: 'grid',
    report: 'grid',
    education: 'lab',
    academic: 'lab',
    marketing: 'waves',
    portfolio: 'product',
    creative: 'waves',
    personal: 'portrait',
    modern: 'city',
    minimal: 'paper',
  }
  return byCat[category] ?? pool[i % pool.length]
}

/* ----------------------------------------------------------------→ DeckSpec */

function toSlideSpec(
  item: OutlineSlide,
  ctx: { i: number; n: number; topic: string; lang: 'ar' | 'en'; category: TemplateCategory },
): SlideSpec {
  const ar = ctx.lang === 'ar'
  const layoutForKind: Record<OutlineSlide['kind'], string> = {
    title: 'title',
    agenda: 'title-content',
    content: 'title-content',
    stats: 'statistics',
    quote: 'quote',
    comparison: 'comparison',
    process: 'process',
    timeline: 'timeline',
    closing: 'closing',
  }
  let layout = layoutForKind[item.kind]
  if (item.kind === 'content' && item.image) layout = 'image-text'
  if (!LAYOUT_IDS.has(layout)) layout = 'title-content'
  if (item.kind === 'title' && ctx.i === 0) layout = 'title'

  const content: SlideSpec['content'] = {}
  const title = cleanTitle(item.title, ctx.lang)
  content.title = title

  if (item.kind === 'title') {
    content.kicker = ar ? 'عرض مُولّد' : 'Generated deck'
    content.subtitle = item.takeaway ?? (ar ? `مُسودة قابلة للتحرير — عدّلها كما تشاء` : `An editable draft — change anything`)
  } else if (item.kind === 'closing') {
    content.body = bullets(item.takeaways ?? (ar ? ['الخطوة التالية'] : ['Next step']), ar)
    content.kicker = ar ? 'الخطوة التالية' : 'Next step'
  } else if (item.kind === 'agenda') {
    content.body = bullets(item.takeaways ?? [], ar)
  } else if (item.kind === 'stats') {
    const stats = item.stat ?? []
    content.stat = stats.map((s) => `${s.value}\n${s.label}`)
    content.body = item.takeaway ?? ''
  } else if (item.kind === 'quote') {
    content.quote = item.quote?.text ?? ''
    content.footer = item.quote?.by ? `— ${item.quote.by}` : ''
  } else if (item.kind === 'comparison') {
    content.body = [
      `${item.compare?.left.title}: ${(item.compare?.left.points ?? []).join(' · ')}`,
      `${item.compare?.right.title}: ${(item.compare?.right.points ?? []).join(' · ')}`,
    ].join('\n')
  } else if (item.kind === 'process' || item.kind === 'timeline') {
    const steps = item.kind === 'timeline' ? (item.timeline ?? []).map((t) => `${t.when} — ${t.what}`) : item.steps ?? []
    content.body = bullets(steps, ar)
  } else {
    content.body = bullets(item.takeaways ?? [item.takeaway ?? ''], ar)
  }
  if (item.takeaway && item.kind === 'content') content.subtitle = item.takeaway

  const notes = ar
    ? [`قُل الجملة الافتتاحية، ثم اشرح: ${item.takeaway ?? title}`, 'اسأل عن نقطة اعتراض واحدة قبل أن تكمل.']
    : [`Open with: ${item.takeaway ?? title}`, 'Ask for one objection before continuing.']

  return {
    layout,
    content,
    bg: item.kind === 'title' ? 'primary' : item.kind === 'closing' ? 'dark' : item.kind === 'quote' ? 'surface' : 'default',
    image: item.image,
    notes: notes.join('\n'),
    transition: ctx.i === 0 ? { type: 'none' } : { type: 'fade', duration: 300 },
  }
}

function bullets(items: string[], ar: boolean): string {
  const list = items.filter((i) => i && i.trim()).map((i) => i.replace(/<[^>]+>/g, '').trim())
  if (!list.length) return ar ? 'نقطة أولى واضحة\nنقطة ثانية مدعومة\nنقطة ثالثة قابلة للتنفيذ' : 'A first clear point\nA second supported point\nA third you can act on'
  return list.join('\n')
}

/* ------------------------------------------------------------------ provider JSON contract */

interface ProviderSlide {
  kind?: string
  title?: string
  takeaways?: string[]
  points?: string[]
  stat?: { value?: string; label?: string }[]
  quote?: { text?: string; by?: string }
  steps?: string[]
}

async function providerOutline(input: { topic: string; count: number; lang: 'ar' | 'en'; audience: string; tone: string; category: TemplateCategory }): Promise<OutlineSlide[] | null> {
  const ai = useUI.getState().ai
  const system = [
    'أنت مخرج عروض تقديمية. أعد JSON فقط، دون شرح أو علامات تنسيق.',
    'الشكل: {"slides":[{"kind":"title|agenda|content|stats|quote|comparison|process|timeline|closing","title":"...","takeaways":["..."]}]}',
    `اللغة: ${input.lang === 'ar' ? 'العربية الفصحى الحديثة بلغة مهنية مباشرة' : 'English'}.`,
    `النبرة: ${input.tone}. الجمهور: ${input.audience}. عدد الشرائح: ${input.count}.`,
    'قواعد: عنوان كل شريحة فكرة لا تسمية قسم؛ نقاط ٢–٤ قصيرة؛ لا حشو ولا إحصاءات مختلقة؛ ضع شريحة title أولًا وشريحة closing أخيرة.',
  ].join('\n')
  try {
    const raw = await chat(toConn(ai), {
      system,
      user: `الموضوع: ${input.topic}\nالفئة: ${input.category}`,
      temperature: 0.5,
      json: true,
      timeoutMs: 25000,
    })
    if (!raw) return null
    const parsed = parseLooseJson(raw) as { slides?: ProviderSlide[] }
    const list = (parsed?.slides ?? [])
      .map(normalizeProviderSlide)
      .filter((s): s is OutlineSlide => !!s)
    if (list.length < 2) return null
    if (list[0].kind !== 'title') list.unshift({ kind: 'title', title: cleanTitle(input.topic, input.lang) })
    if (list[list.length - 1].kind !== 'closing') list.push({ kind: 'closing', title: input.lang === 'ar' ? 'ما نطلبه الآن' : 'What we ask for', takeaways: list[list.length - 1]?.takeaways?.slice(0, 2) })
    return list.slice(0, input.count + 2)
  } catch {
    return null
  }
}

function normalizeProviderSlide(s: ProviderSlide): OutlineSlide | null {
  const title = String(s.title ?? '').replace(/[#*_`]/g, '').trim()
  if (!title) return null
  const kind = (['title', 'agenda', 'content', 'stats', 'quote', 'comparison', 'process', 'timeline', 'closing'] as const).includes(s.kind as never) ? (s.kind as OutlineSlide['kind']) : 'content'
  const takeaways = (s.takeaways ?? s.points ?? []).map((t) => String(t).replace(/[#*_`]/g, '').trim()).filter(Boolean).slice(0, 5)
  if (kind === 'stats') {
    const stat = (s.stat ?? []).filter((x) => x?.value).map((x) => ({ value: String(x.value), label: String(x.label ?? '') }))
    if (stat.length) return { kind, title, stat }
  }
  if (kind === 'quote') {
    const text = String(s.quote?.text ?? takeaways[0] ?? '').trim()
    return text ? { kind, title, quote: { text, by: s.quote?.by } } : null
  }
  if (kind === 'process') {
    const steps = (s.steps ?? takeaways).filter(Boolean).slice(0, 5)
    return steps.length ? { kind, title, steps } : null
  }
  return { kind, title, takeaways }
}

function parseLooseJson(raw: string): unknown {
  const text = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '')
  try {
    return JSON.parse(text)
  } catch {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1))
      } catch {
        return null
      }
    }
    return null
  }
}
