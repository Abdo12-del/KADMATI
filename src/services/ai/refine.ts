/**
 * Element- and slide-level refinement.
 *
 * Two engines, one contract:
 * • deterministic local pass (always available, offline, instant, never destructive);
 * • optional provider pass — if the user configured an endpoint in Settings we ask it for a
 *   rewrite, then validate it (length, no markdown, script match) and fall back to local when the
 *   answer is junk. Generated text becomes real text elements, never images.
 */
import { useDoc } from '../../store/useDoc'
import { useUI } from '../../store/useUI'
import { htmlToPlainText, plainToHtml, sanitizeHtml } from '../../document/text'
import { LAYOUTS, buildLayout, type LayoutDef } from '../../templates/layouts'
import { unionBounds } from '../../document/geometry'
import type { AnyElement, Presentation, Slide, TextElement } from '../../document/types'
import { resolveProvider } from './provider'

export type RefineOp = 'improve' | 'shorten' | 'formal' | 'title' | 'expand' | 'grammar' | 'friendly'

export interface RefineResult {
  changed: boolean
  title: string
  detail: string
}

export async function rewriteText(elementId: string, op: RefineOp): Promise<RefineResult> {
  const { doc, slideIndex, updateElement } = useDoc.getState()
  const slide = doc.slides[slideIndex]
  const el = slide?.elements.find((item) => item.id === elementId)
  if (!el || el.kind !== 'text') return { changed: false, title: 'حدّد نصًا', detail: 'اختر عنصر نص في الشريحة ثم أعد المحاولة.' }

  const source = htmlToPlainText(el.content)
  const ai = useUI.getState().ai
  let next = localRewrite(source, op, el, doc)
  let engine = 'محلي'

  if (ai.endpoint && (ai.provider === 'custom' || ai.provider === 'ollama')) {
    const remote = await providerRewrite(source, op, ai)
    if (remote && acceptable(source, remote, op)) {
      next = remote
      engine = ai.model || 'المزوّد'
    }
  }

  if (!next || next === source) {
    if (op === 'expand' || op === 'friendly') {
      return { changed: false, title: 'يحتاج مزوّد ذكاء', detail: 'التوسيع وتغيير النبرة يعملان مع Ollama أو مزوّد خارجي — اضبطهما من إعدادات الذكاء.' }
    }
    return { changed: false, title: 'لا تغيير مطلوب', detail: 'النص بالفعل في شكل جيد.' }
  }

  const html = op === 'title' ? plainToHtml(next) : wrapLike(el.content, next)
  updateElement(elementId, { content: sanitizeHtml(html) } as Partial<TextElement>, `تحسين النص · ${engine}`)
  return {
    changed: true,
    title: LABELS[op],
    detail: `${engine === 'محلي' ? 'صياغة محلية' : `صياغة عبر ${engine}`} · ${wordCount(next)} كلمة`,
  }
}

const LABELS: Record<RefineOp, string> = {
  improve: 'حُسِّنت الصياغة',
  shorten: 'اختُصر النص',
  formal: 'أُعيد بصياغة رسمية',
  title: 'عنوان مقترح',
  expand: 'وُسِّع النص',
  grammar: 'صُحِّحت القواعد',
  friendly: 'صارت النبرة ودّية',
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

function acceptable(source: string, next: string, op: RefineOp): boolean {
  const trimmed = next.trim()
  if (!trimmed || trimmed.length < 3) return false
  if (/```|^[#*-]\s/m.test(trimmed)) return false
  if (op === 'shorten' && wordCount(trimmed) > wordCount(source)) return false
  if (op === 'title' && wordCount(trimmed) > 12) return false
  if (op === 'expand' && wordCount(trimmed) <= wordCount(source)) return false
  if (op === 'grammar' && wordCount(trimmed) > wordCount(source) * 1.6) return false
  if (op !== 'expand' && wordCount(trimmed) > Math.max(8, wordCount(source) * 3)) return false
  return true
}

/** Keep the paragraph/list structure the element already had; only the words change. */
function wrapLike(previousHtml: string, text: string): string {
  const isList = /<ul|<ol/i.test(previousHtml)
  const lines = text.split(/\n+/).map((l) => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean)
  if (isList && lines.length > 1) return `<ul>${lines.map((l) => `<li>${l}</li>`).join('')}</ul>`
  return lines.map((l) => `<p>${l}</p>`).join('')
}

/* ------------------------------------------------------------------ local engine */

const FILLERS = [
  'في الحقيقة،',
  'الحقيقة أن',
  'من الجدير بالذكر أن',
  'الجدير بالذكر أن',
  'لا شك أن',
  'بدون شك،',
  'بشكل عام،',
  'عموما،',
  'في نهاية المطاف',
  'إلى حد كبير',
  'في الوقت الذي',
  'it should be noted that',
  'in fact,',
  'as a matter of fact,',
  'needless to say,',
  'at the end of the day',
]

const WEAK = [
  [/\bجدًا\b/g, ''],
  [/\bكثيرًا\b/g, ''],
  [/\bكبيرًا جدًا\b/g, ''],
  [/\bvery\s+/gi, ''],
  [/\breally\s+/gi, ''],
  [/\bquite\s+/gi, ''],
  [/\bbasically\s+/gi, ''],
  [/\bactually\s+/gi, ''],
]

const FORMAL: [RegExp, string][] = [
  [/بسبب\s/g, 'نتيجةً لـ '],
  [/يعني\s/g, 'أي '],
  [/كثير من/g, 'عدد كبير من'],
  [/نحسّن/g, 'نطوّر'],
  [/نقدر على/g, 'نستطيع '],
  [/شيء/g, 'عنصر'],
  [/الأشياء/g, 'العناصر'],
  [/جيد/g, 'فعّال'],
  [/قوي/g, 'متين'],
  [/speed up/gi, 'accelerate'],
  [/a lot of/gi, 'substantial'],
  [/get\b/gi, 'obtain'],
  [/kids/gi, 'children'],
]

export function localRewrite(source: string, op: RefineOp, el: TextElement, doc: Presentation): string {
  let text = source.replace(/\s+/g, ' ').trim()

  // Provider-only ops: the local engine refuses to fake them with filler prose.
  if (op === 'expand' || op === 'friendly') return source

  if (op === 'title') {
    const first = text.split(/[.!؟]\s/)[0] ?? text
    const clipped = first.split(/\s+/).slice(0, 7).join(' ')
    const clean = clipped.replace(/[.,:؛،]+$/, '').replace(/^[-•*]\s*/, '')
    return titleCase(clean, doc.metadata.dir)
  }

  for (const filler of FILLERS) {
    if (text.toLowerCase().includes(filler.toLowerCase())) text = text.replace(new RegExp(filler.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '')
  }

  if (op === 'shorten') {
    text = trimToCore(text, Math.max(6, Math.round(wordCount(text) * 0.6)))
  }

  if (op === 'formal') {
    for (const [re, to] of FORMAL) text = text.replace(re, to)
    text = text.replace(/\s{2,}/g, ' ').replace(/!+/g, '.')
  }

  if (op === 'improve' || op === 'grammar') {
    for (const [re] of WEAK) text = text.replace(re, ' ')
    text = text.replace(/\s{2,}/g, ' ').replace(/\s+([.,:؛،؟!])/g, '$1').trim()
    // A body block that starts lowercase after a period reads as a fragment — open it properly.
    text = text.charAt(0).toUpperCase() + text.slice(1)
    if (el.role === 'body' && wordCount(text) > 18) text = tighten(text)
    text = ensureTerminator(text, el.role === 'title')
  }

  if (op === 'grammar') {
    // Common Arabic orthography slips that are safe to fix mechanically.
    text = text
      .replace(/\bان شاء\b/g, 'إن شاء')
      .replace(/\bانا\b/g, 'أنا')
      .replace(/\bان\s+ال/g, 'إن ال')
      .replace(/\bلان\b/g, 'لأن')
      .replace(/\s{2,}/g, ' ')
      .trim()
  }

  return text.replace(/\s+/g, ' ').trim()
}

/** Keep the sentence that carries the number or the verb, drop trailing commentary. */
function trimToCore(text: string, budget: number): string {
  const sentences = text.split(/(?<=[.!؟])\s+/).filter(Boolean)
  if (sentences.length <= 1) {
    const words = text.split(/\s+/)
    return words.length <= budget ? text : `${words.slice(0, budget).join(' ')}…`
  }
  const scored = sentences.map((sentence, i) => ({
    sentence,
    score: (/\d/.test(sentence) ? 2 : 0) + (i === 0 ? 1.5 : 0) + Math.min(1.5, sentence.split(/\s+/).length / 14) - (/\b(أيضًا|كذلك|بالإضافة إلى|also|furthermore)\b/i.test(sentence) ? 1 : 0),
  }))
  const picked: string[] = []
  let words = 0
  for (const item of scored.sort((a, b) => b.score - a.score)) {
    const count = item.sentence.split(/\s+/).length
    if (words + count > budget && picked.length) continue
    picked.push(item.sentence)
    words += count
  }
  const order = new Map(sentences.map((s, i) => [s, i]))
  return picked.sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0)).join(' ')
}

function tighten(text: string): string {
  return text
    .replace(/\bالذي\s+يقوم\s+بـ\b/g, 'الذي ')
    .replace(/\bالتي\s+تقوم\s+بـ\b/g, 'التي ')
    .replace(/\bقام\s+بـ\b/g, '')
    .replace(/\bتمت\s+عملية\b/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function ensureTerminator(text: string, isTitle: boolean): string {
  if (isTitle) return text.replace(/[.]+$/, '')
  if (/[.!?؟۔]$/.test(text)) return text
  return `${text}.`
}

function titleCase(text: string, dir: 'rtl' | 'ltr'): string {
  if (dir === 'ltr') {
    const small = new Set(['a', 'an', 'the', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with'])
    return text
      .split(/\s+/)
      .map((word, i) => (i > 0 && small.has(word.toLowerCase()) ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1)))
      .join(' ')
  }
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/* ------------------------------------------------------------------ provider pass */

async function providerRewrite(source: string, op: RefineOp, ai: ReturnType<typeof useUI.getState>['ai']): Promise<string | null> {
  const instructions: Record<RefineOp, string> = {
    improve: 'حسّن الصياغة مع الحفاظ على المعنى والطول التقريبي.',
    shorten: 'اختصر إلى النصف تقريبًا مع إبقاء الأرقام والاستنتاجات.',
    formal: 'أعد الصياغة بنبرة رسمية مهنية.',
    title: 'اقترح عنوانًا من ٤ إلى ٧ كلمات يلخص الفكرة.',
    expand: 'وسّع النص بجملة أو جملتين مفيدتين دون حشو، مع الحفاظ على الأسلوب.',
    grammar: 'صحح الأخطاء الإملائية والنحوية وعلامات الترقيم فقط، دون تغيير المعنى.',
    friendly: 'أعد الصياغة بنبرة ودّية قريبة دون فقدان الاحترافية.',
  }
  const resolved = await resolveProvider(ai)
  if (!resolved.provider) return null
  const result = await resolved.provider.generateJSON({
    system: 'أنت محرر عروض تقديمية. أعد JSON فقط بالشكل {"text":"النص المعدّل"} دون شرح أو تنسيق داخل النص.',
    user: `${instructions[op]}\n\nالنص:\n${source}`,
    jsonSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] },
    temperature: 0.4,
    timeoutMs: 25000,
  })
  const text = (result?.data as { text?: unknown } | null)?.text
  return typeof text === 'string' ? text.trim() : null
}

/* ------------------------------------------------------------------ slide-level ops */

export interface SlideFixReport {
  changed: number
  notes: string[]
}

/**
 * "Improve design" for one slide: snap to the theme margin, give body text a readable measure,
 * equalise the vertical rhythm, and lift the hierarchy if the title is timid. All edits go through
 * the store, so one ⌘Z undoes the whole pass.
 */
export function improveSlideDesign(slide: Slide): number {
  const { updateSlide, doc } = useDoc.getState()
  const theme = doc.theme
  let changed = 0
  const margin = theme.spacing

  updateSlide(
    slide.id,
    (s) => {
      const box = unionBounds(s.elements.map((el) => ({ x: el.x, y: el.y, w: el.w, h: el.h })))
      if (!box) return
      const texts = s.elements.filter((el): el is TextElement => el.kind === 'text')
      const title = texts.find((el) => el.role === 'title')
      const bodies = texts.filter((el) => el !== title)

      // Left edge onto the theme margin (RTL-aware: the visual edge is the same number, we only
      // normalise the geometric one).
      const edge = Math.round(box.x)
      if (Math.abs(edge - margin) > 6) {
        const shift = margin - edge
        for (const el of s.elements) {
          if (el.kind === 'image' || el.kind === 'frame') continue
          el.x += shift
          changed++
        }
      }

      if (title) {
        const maxSize = Math.max(0, ...bodies.map((el) => el.font.fontSize))
        if (maxSize && title.font.fontSize < maxSize * 1.8) {
          title.font.fontSize = Math.round(Math.max(title.font.fontSize, maxSize * 1.8))
          title.font.bold = true
          title.font.lineHeight = 1.14
          changed++
        }
      }

      // Body measure: no line longer than ~68 characters.
      for (const el of bodies) {
        const ideal = Math.min(doc.size.w - margin * 2, Math.round(el.font.fontSize * 26))
        if (el.w > ideal + 24) {
          el.w = ideal
          changed++
        }
        if (el.font.fontSize < 20) {
          el.font.fontSize = 20
          changed++
        }
        if (el.font.lineHeight < 1.35) {
          el.font.lineHeight = 1.45
          changed++
        }
      }

      // Vertical rhythm: equal gaps between stacked body blocks.
      const stacked = [...bodies].sort((a, b) => a.y - b.y)
      if (stacked.length >= 3) {
        const top = Math.min(...stacked.map((el) => el.y))
        const bottom = Math.max(...stacked.map((el) => el.y + el.h))
        const totalH = stacked.reduce((n, el) => n + el.h, 0)
        const gap = Math.max(8, (bottom - top - totalH) / (stacked.length - 1))
        let cursor = top
        for (const el of stacked) {
          const next = Math.round(cursor)
          if (Math.abs(el.y - next) > 1.5) {
            el.y = next
            changed++
          }
          cursor += el.h + gap
        }
      }
      void changed
    },
    'تحسين تصميم الشريحة',
  )
  return changed
}

/** Re-space the slide so the content block sits optically centred with equal margins. */
export function balanceSlide(slide: Slide): string {
  const { updateSlide, doc } = useDoc.getState()
  let note = 'الشريحة متوازنة بالفعل.'
  updateSlide(
    slide.id,
    (s) => {
      const items = s.elements.filter((el) => el.kind !== 'frame')
      if (items.length < 2) return
      const box = unionBounds(items.map((el) => ({ x: el.x, y: el.y, w: el.w, h: el.h })))
      if (!box) return
      const targetTop = Math.round((doc.size.h - box.h) / 2)
      const dy = targetTop - Math.round(box.y)
      if (Math.abs(dy) > 8) {
        for (const el of s.elements) el.y += dy
        note = `أُعيد التوازن رأسيًا بمقدار ${Math.abs(dy)}px.`
      }
    },
    'توازن الشريحة',
  )
  return note
}

/**
 * Layout suggestion: pick the layout whose *slots* match what this slide actually holds —
 * non-destructive, because applying a layout keeps every element's content and only re-slots it.
 */
/** Layout suggestion with the reason shown to the user — it must be explainable, not magic. */
export function suggestLayout(slide: Slide, doc: Presentation): { layout: LayoutDef; reason: string } | null {
  const elements: AnyElement[] = slide.elements
  if (!elements.length) return null
  const texts = elements.filter((el): el is TextElement => el.kind === 'text')
  const images = elements.filter((el) => el.kind === 'image')
  const charts = elements.filter((el) => el.kind === 'chart')
  const tables = elements.filter((el) => el.kind === 'table')
  const words = texts.reduce((n, el) => n + wordCount(htmlToPlainText(el.content)), 0)

  const wants = new Set<string>()
  if (images.length >= 1 && texts.length <= 3 && words < 70) wants.add('image-text')
  if (images.length >= 2) wants.add('two-columns')
  if (charts.length + tables.length > 0) wants.add(tables.length ? 'table' : 'chart')
  if (texts.some((el) => el.role === 'quote')) wants.add('quote')
  const stats = texts.filter((el) => el.role === 'stat')
  if (stats.length >= 2) wants.add('statistics')
  if (words > 150) wants.add('title-content')
  if (texts.length === 1 && texts[0].role === 'title') wants.add('section')
  if (slide === doc.slides[doc.slides.length - 1] && words < 40) wants.add('closing')
  if (/\d{4}|المرحلة|مرحلة|خط زمني|timeline|phase/i.test(texts.map((el) => el.content).join(' '))) wants.add('timeline')
  if (/مقارنة|versus|vs\.?|قبل\s+وبعد/i.test(texts.map((el) => el.content).join(' '))) wants.add('comparison')
  if (/عملية|خطوات|process|steps|منهجية/i.test(texts.map((el) => el.content).join(' '))) wants.add('process')

  wants.delete(slide.layoutId)
  for (const id of wants) {
    const layout = LAYOUTS.find((l) => l.id === id)
    if (layout && layout.roles.length) return { layout, reason: reasonFor(id, { images: images.length, words, stats: stats.length, charts: charts.length, tables: tables.length }) }
  }
  return null
}

function reasonFor(id: string, f: { images: number; words: number; stats: number; charts: number; tables: number }): string {
  const parts: string[] = []
  if (f.images) parts.push(`${f.images} صورة`)
  if (f.stats) parts.push(`${f.stats} رقم`)
  if (f.charts) parts.push('مخطط')
  if (f.tables) parts.push('جدول')
  parts.push(`${f.words} كلمة`)
  return `لأن المحتوى يحتوي ${parts.join('، ')} — «${id}» يخدم هذا المزيج أفضل من التخطيط الحالي.`
}

/** Preview what a layout would do, without touching the document. */
export function previewLayout(layoutId: string): LayoutDef | null {
  return LAYOUTS.find((l) => l.id === layoutId) ?? null
}

export function buildLayoutPreview(layout: LayoutDef, theme: Presentation['theme']) {
  return buildLayout(layout, theme)
}
