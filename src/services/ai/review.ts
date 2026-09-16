/**
 * Deck review — the "improve design" brain.
 *
 * Deliberately deterministic and local: it reads the document model and applies the rules a
 * design lead would apply (contrast, hierarchy, density, alignment, consistency, rhythm). That
 * means it works offline, it is fast enough to run on every click, and it never asks the user to
 * paste their deck into a third party. When an AI provider is configured the same issue objects
 * are enriched by the model (see `services/ai/provider.ts`), but nothing here depends on it.
 */
import { contrastRatio, isLight, relLuminance, toHex } from '../../lib/colors'
import { useDoc } from '../../store/useDoc'
import { htmlToPlainText } from '../../document/text'
import type { AnyElement, ElementRole, Presentation, Slide, TextElement } from '../../document/types'

export type Severity = 'error' | 'warn' | 'info'

export interface ReviewIssue {
  id: string
  slide: number
  severity: Severity
  /** What we found. */
  message: string
  /** What to do about it, in the designer's language. */
  hint?: string
  elementIds?: string[]
  /** A one-click fix, when the correction is safe and reversible. */
  fix?: () => void
}

export interface ReviewOptions {
  /** Only review these slides (all by default). */
  slides?: number[]
  /** Minimum WCAG ratio for normal text. */
  minContrast?: number
  /** Words per slide before we call it dense. */
  densityLimit?: number
}

export const DEFAULT_MIN_CONTRAST = 3.2
export const DEFAULT_DENSITY = 110

const DISPLAY_ROLES = new Set<ElementRole>(['stat', 'quote', 'kicker'])

export function reviewDeck(doc: Presentation, opts: ReviewOptions = {}): ReviewIssue[] {
  const issues: ReviewIssue[] = []
  const minContrastValue = opts.minContrast ?? DEFAULT_MIN_CONTRAST
  const densityLimit = opts.densityLimit ?? DEFAULT_DENSITY
  const indices = opts.slides ?? doc.slides.map((_, i) => i)
  const seen = new Set<string>()
  const push = (issue: ReviewIssue) => {
    if (seen.has(issue.id)) return
    seen.add(issue.id)
    issues.push(issue)
  }

  for (const index of indices) {
    const slide = doc.slides[index]
    if (!slide) continue
    const bg = effectiveBackground(slide, doc)

    const texts = slide.elements.filter((el): el is TextElement => el.kind === 'text' && el.visible)
    const title = texts.find((el) => el.role === 'title') ?? null
    // Hierarchy is about *body* copy. Display type — stat numbers, pull quotes, kickers — is meant
    // to be big, so counting it here would flag a hundred correct slides.
    const bodies = texts.filter(
      (el) => el !== title && !DISPLAY_ROLES.has(el.role ?? 'body') && el.font.fontSize <= (title?.font.fontSize ?? 1e9) * 1.6,
    )

    // 1 — contrast, per text element
    for (const el of texts) {
      const ratio = contrastRatio(el.font.color, bg)
      const large = el.font.fontSize >= 30 || (el.font.fontSize >= 24 && el.font.bold)
      const floor = large ? minContrastValue - 0.7 : minContrastValue
      if (Number.isFinite(ratio) && ratio < floor) {
        push({
          id: `contrast-${el.id}`,
          slide: index,
          severity: ratio < floor - 1.2 ? 'error' : 'warn',
          message: `تباين النص ${ratio.toFixed(1)}:1 أقل من الموصى به (${floor.toFixed(1)}:1) في «${el.name}».`,
          hint: 'اضغط إصلاح لتبديل لون النص تلقائيًا إلى الفاتح أو الداكن حسب الخلفية.',
          elementIds: [el.id],
          fix: () => fixText(index, el.id, { color: relLuminance(bg) < 0.45 ? '#FFFFFF' : '#101820' }, 'تحسين تباين النص'),
        })
      }
    }

    // 2 — hierarchy: a title must read as a title
    if (title && bodies.length) {
      const maxBody = Math.max(...bodies.map((el) => el.font.fontSize))
      if (title.font.fontSize < maxBody * 1.35) {
        push({
          id: `hierarchy-${title.id}`,
          slide: index,
          severity: 'warn',
          message: 'العنوان لا يتفارق بما يكفي عن النص — التسلسل الهرمي غير واضح.',
          hint: `اجعل حجم العنوان ≈ ${Math.round(maxBody * 1.7)}px أو أكثر.`,
          elementIds: [title.id],
          fix: () => fixText(index, title.id, { fontSize: Math.round(maxBody * 1.7), bold: true }, 'تعزيز التسلسل الهرمي'),
        })
      }
    }

    // 3 — density
    const words = slide.elements.reduce((n, el) => n + (el.kind === 'text' ? countWords(htmlToPlainText(el.content)) : 0), 0)
    if (words > densityLimit) {
      push({
        id: `density-${slide.id}`,
        slide: index,
        severity: words > densityLimit * 1.6 ? 'error' : 'warn',
        message: `${words} كلمة في شريحة واحدة — الجمهور سيقرأ بدل أن يسمعك.`,
        hint: 'قسّمها على شريحتين، أو حوّل الجمل إلى نقاط.',
        fix: () => splitToBullets(index),
      })
    }

    // 4 — off-canvas / overlap with safe margin
    const off = slide.elements.filter((el) => el.x < -2 || el.y < -2 || el.x + el.w > doc.size.w + 2 || el.y + el.h > doc.size.h + 2)
    if (off.length) {
      push({
        id: `off-${slide.id}`,
        slide: index,
        severity: 'warn',
        message: `${off.length} عنصر خارج حدود الشريحة وسيُقص عند العرض أو التصدير.`,
        elementIds: off.map((el) => el.id),
        fix: () => bringInside(index, off),
      })
    }

    // 5 — stray duplicates stacked on top of each other
    const dupes = findExactOverlaps(slide.elements)
    if (dupes.length) {
      push({
        id: `dupe-${slide.id}`,
        slide: index,
        severity: 'info',
        message: `${dupes.length} عنصر متطابق في الموقع والحجم — غالبًا بقايا تكرار.`,
        elementIds: dupes.map((el) => el.id),
        fix: () => removeIds(index, dupes.map((el) => el.id)),
      })
    }

    // 6 — alignment drift: same-role starts that are 1-14px apart (visually "off" but hard to see)
    const drift = alignmentDrift(slide.elements)
    if (drift.length) {
      push({
        id: `align-${slide.id}`,
        slide: index,
        severity: 'info',
        message: `${drift.length} عنصر غير محاذى تمامًا للعناصر المجاورة.`,
        elementIds: drift.map((el) => el.id),
        fix: () => snapToNearest(index, drift),
      })
    }
  }

  // 7 — deck-wide consistency
  const families = new Set<string>()
  const colors = new Map<string, number>()
  for (const slide of doc.slides) {
    for (const el of slide.elements) {
      if (el.kind !== 'text') continue
      families.add(el.font.fontFamily)
      colors.set(el.font.color, (colors.get(el.font.color) ?? 0) + 1)
    }
  }
  const themeFamilies = new Set([doc.theme.fonts.body, doc.theme.fonts.heading, doc.theme.fonts.mono])
  const foreign = [...families].filter((f) => !themeFamilies.has(f))
  if (foreign.length) {
    push({
      id: 'family-drift',
      slide: doc.slides.findIndex((s) => s.elements.some((el) => el.kind === 'text' && foreign.includes(el.font.fontFamily))),
      severity: 'warn',
      message: `خطوط خارج السمة: ${foreign.join('، ')} — العرض يبدو غير موحد.`,
      fix: () => resetFamilies(),
    })
  }
  const strayColors = [...colors.keys()].filter((c) => !inPalette(c, doc)).length
  if (strayColors >= 4) {
    push({
      id: 'color-drift',
      slide: 0,
      severity: 'info',
      message: `${strayColors} لونًا خارج لوحة العلامة — قلّل الألوان لتقوية الهوية.`,
    })
  }
  const noTitle = doc.slides.filter((s, i) => i > 0 && !s.elements.some((el) => el.kind === 'text' && el.role === 'title') && s.elements.length > 1)
  if (noTitle.length > doc.slides.length * 0.4 && noTitle.length > 1) {
    push({
      id: 'no-titles',
      slide: doc.slides.indexOf(noTitle[0]),
      severity: 'info',
      message: 'أغلب الشرائح بلا عنوان — يصعب على الجمهور متابعة الخيط.',
    })
  }
  if (doc.slides.length > 1) {
    const sizes = doc.slides.map((s) => s.elements.length)
    const max = Math.max(...sizes)
    const min = Math.min(...sizes)
    if (max > 14 && min < 3) {
      push({
        id: 'rhythm',
        slide: doc.slides.findIndex((s) => s.elements.length === max),
        severity: 'info',
        message: 'تذبذب كبير في كثافة الشرائح (بين عنصرين وأربعة عشر) — إعادة توزيع تحسّن الإيقاع.',
      })
    }
  }

  return issues
}

/* ------------------------------------------------------------------ helpers */

function effectiveBackground(slide: Slide, doc: Presentation): string {
  const bg = slide.background
  if (!bg || bg.type === 'none') return doc.theme.palette.background
  if (bg.type === 'solid' && bg.color) return bg.color
  if (bg.type === 'gradient') {
    const stops = bg.gradient?.stops ?? []
    const c = stops.length > 1 ? stops[Math.floor(stops.length / 2)].color : stops[0]?.color
    return c ?? doc.theme.palette.background
  }
  if (bg.type === 'pattern' && bg.patternColor) return bg.patternColor
  if (bg.type === 'image') return doc.theme.palette.text === '#FFFFFF' || relLuminance(doc.theme.palette.background) < 0.4 ? doc.theme.palette.background : '#FFFFFF'
  return doc.theme.palette.background
}

function countWords(text: string): number {
  const clean = text.replace(/[\u064B-\u0652\u0670]/g, '').trim()
  return clean ? clean.split(/[\s\u200B]+/).filter(Boolean).length : 0
}

function inPalette(color: string, doc: Presentation): boolean {
  // Translucent colors are decorative tints, not palette decisions.
  if (color.toLowerCase().startsWith('rgba')) return true
  const values = Object.values(doc.theme.palette).filter((v): v is string => typeof v === 'string')
  const target = toHex(color, '')
  if (!target) return false
  return values.some((v) => toHex(v, '').toLowerCase() === target.toLowerCase())
}

/* ------------------------------------------------------------------ one-click fixes
 * Every fix runs through the document store, so undo/redo keeps working exactly like a manual edit.
 */

function fixText(slideIndex: number, elementId: string, patch: Partial<TextElement['font']>, label: string) {
  const { doc, updateSlide } = useDoc.getState()
  const slide = doc.slides[slideIndex]
  if (!slide) return
  updateSlide(
    slide.id,
    (s) => {
      const el = s.elements.find((item) => item.id === elementId)
      if (!el || el.kind !== 'text') return
      el.font = { ...el.font, ...patch }
    },
    label,
  )
}

function eachSlide(slideIndex: number, label: string, fn: (slide: Slide) => void) {
  const { doc, updateSlide } = useDoc.getState()
  const slide = doc.slides[slideIndex]
  if (!slide) return
  updateSlide(slide.id, fn, label)
}

function splitToBullets(slideIndex: number) {
  eachSlide(slideIndex, 'تحويل النص إلى نقاط', (slide) => {
    const target = slide.elements.find((el) => el.kind === 'text' && (el.role === 'body' || el.role === 'list'))
    if (!target || target.kind !== 'text') return
    const parts = htmlToPlainText(target.content)
      .split(/(?<=[.،؛؟!])\s+/)
      .map((p) => p.trim())
      .filter((p) => p.split(/\s+/).length > 2)
    if (parts.length < 2) return
    target.content = `<ul>${parts.map((p) => `<li>${escape(p)}</li>`).join('')}</ul>`
  })
}

function bringInside(slideIndex: number, elements: AnyElement[]) {
  const { doc } = useDoc.getState()
  const slide = doc.slides[slideIndex]
  if (!slide) return
  const { w: W, h: H } = doc.size
  const ids = new Set(elements.map((el) => el.id))
  const dx = Math.min(...elements.map((el) => el.x))
  const dy = Math.min(...elements.map((el) => el.y))
  const right = Math.max(...elements.map((el) => el.x + el.w))
  const bottom = Math.max(...elements.map((el) => el.y + el.h))
  const shiftX = dx < 0 ? -dx + 40 : right > W ? W - right - 40 : 0
  const shiftY = dy < 0 ? -dy + 40 : bottom > H ? H - bottom - 40 : 0
  if (!shiftX && !shiftY) return
  eachSlide(slideIndex, 'إعادة العناصر إلى داخل الشريحة', (s) => {
    for (const el of s.elements) {
      if (!ids.has(el.id)) continue
      el.x = Math.max(20, Math.min(W - el.w - 20, el.x + shiftX))
      el.y = Math.max(20, Math.min(H - el.h - 20, el.y + shiftY))
    }
  })
}

function snapToNearest(slideIndex: number, elements: AnyElement[]) {
  const ids = new Set(elements.map((el) => el.id))
  const anchor = Math.round(Math.min(...elements.map((el) => el.x)))
  eachSlide(slideIndex, 'محاذاة دقيقة', (s) => {
    for (const el of s.elements) if (ids.has(el.id)) el.x = anchor
  })
}

function removeIds(slideIndex: number, ids: string[]) {
  const set = new Set(ids)
  eachSlide(slideIndex, 'إزالة العناصر المكررة', (s) => {
    s.elements = s.elements.filter((el) => !set.has(el.id))
  })
}

function resetFamilies() {
  useDoc.getState().mutate((d) => {
    for (const slide of d.slides) {
      for (const el of slide.elements) {
        if (el.kind !== 'text') continue
        el.font.fontFamily = el.role === 'title' || el.role === 'stat' ? d.theme.fonts.heading : d.theme.fonts.body
      }
    }
  }, 'توحيد الخطوط مع السمة')
}

function escape(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Two elements painting the same box with the same content are almost always leftovers. */
function findExactOverlaps(elements: AnyElement[]): AnyElement[] {
  const seen = new Map<string, AnyElement>()
  const dupes: AnyElement[] = []
  for (const el of elements) {
    if (!el.visible || el.kind === 'frame' || el.locked) continue
    const key = `${el.kind}|${Math.round(el.x)}|${Math.round(el.y)}|${Math.round(el.w)}|${Math.round(el.h)}`
    const prior = seen.get(key)
    if (prior && prior.id !== el.id && sameContent(prior, el)) dupes.push(el)
    else seen.set(key, el)
  }
  return dupes
}

function sameContent(a: AnyElement, b: AnyElement): boolean {
  if (a.kind === 'text' && b.kind === 'text') return htmlToPlainText(a.content) === htmlToPlainText(b.content)
  if (a.kind === 'image' && b.kind === 'image') return a.assetId === b.assetId
  if (a.kind === 'shape' && b.kind === 'shape') return a.shape === b.shape && a.text === b.text
  return a.kind === b.kind
}

/**
 * Same-role left edges that sit 1–16px apart: too small to notice individually, loud as a group.
 * That is exactly the drift a designer fixes last and the audience feels first.
 */
function alignmentDrift(elements: AnyElement[]): AnyElement[] {
  const groups = new Map<string, AnyElement[]>()
  for (const el of elements) {
    if (el.locked || el.kind === 'frame' || !el.visible) continue
    const key = el.kind === 'text' ? `text:${el.role ?? 'body'}` : 'box'
    const list = groups.get(key) ?? []
    list.push(el)
    groups.set(key, list)
  }
  const drifted: AnyElement[] = []
  for (const list of groups.values()) {
    if (list.length < 2) continue
    const sorted = list.map((el) => el.x).sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]
    for (const el of list) {
      const d = Math.abs(el.x - median)
      if (d > 0.5 && d < 16) drifted.push(el)
    }
  }
  return drifted
}

void isLight

/* ------------------------------------------------------------------ model pass (optional) */

import { useUI } from '../../store/useUI'
import { chat, isRemoteReady, toConn } from './providers'

/**
 * Content review by the configured model (Aurova Model or a third-party provider). The
 * deterministic pass above covers design; this one covers the words: weak titles, filler,
 * missing evidence, ordering. Returns [] when no provider is ready or the call fails, so the
 * UI can always fall back to the local list alone.
 */
export async function reviewContentWithModel(doc: Presentation, opts: { slides?: number[]; lang?: 'ar' | 'en' } = {}): Promise<ReviewIssue[]> {
  const ai = useUI.getState().ai
  const conn = toConn(ai)
  if (!isRemoteReady(conn)) return []
  const indices = opts.slides ?? doc.slides.map((_, i) => i)
  const outline = indices
    .map((i) => {
      const slide = doc.slides[i]
      if (!slide) return null
      const texts = slide.elements
        .filter((el): el is TextElement => el.kind === 'text')
        .map((el) => htmlToPlainText(el.content).trim())
        .filter(Boolean)
      return { index: i, texts: texts.slice(0, 8).map((t) => t.slice(0, 220)) }
    })
    .filter((x): x is { index: number; texts: string[] } => !!x && x.texts.length > 0)
  if (!outline.length) return []
  const lang = opts.lang ?? (/[؀-ۿ]/.test(outline.map((o) => o.texts.join(' ')).join(' ')) ? 'ar' : 'en')
  const system = [
    'أنت مراجع محتوى عروض تقديمية. أعد JSON فقط بالشكل:',
    '{"issues":[{"slide":<index>,"severity":"warn|info","message":"...","hint":"..."}]}',
    `اللغة: ${lang === 'ar' ? 'العربية' : 'English'}. أقصى ٨ ملاحظات، الأهم أولًا.`,
    'ركّز على: عنوان لا يحمل فكرة، حشو، ادّعاء بلا دليل، ترتيب غير منطقي، نقاط متكررة، خاتمة بلا طلب واضح.',
    'لا تعلّق على الألوان أو الخطوط أو التخطيط — يُفحص ذلك محليًا.',
  ].join('\n')
  const raw = await chat(conn, { system, user: JSON.stringify({ title: doc.metadata.title, slides: outline }), temperature: 0.3, json: true, timeoutMs: 25000 })
  if (!raw) return []
  let parsed: { issues?: { slide?: number; severity?: string; message?: string; hint?: string }[] } = {}
  try {
    parsed = JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, ''))
  } catch {
    return []
  }
  const valid = new Set(indices)
  return (parsed.issues ?? [])
    .filter((x) => typeof x.slide === 'number' && valid.has(x.slide) && x.message)
    .slice(0, 8)
    .map((x, n) => ({
      id: `model-${x.slide}-${n}`,
      slide: x.slide as number,
      severity: (x.severity === 'warn' ? 'warn' : 'info') as Severity,
      message: String(x.message).trim(),
      hint: x.hint ? String(x.hint).trim() : undefined,
    }))
}
