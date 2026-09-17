/**
 * Zoom link suggestions — local heuristics, no network.
 *
 * The suggester looks for the patterns real decks use for navigation:
 *  1. agenda/contents slides whose items name other slides ("title-match"),
 *  2. cards/tiles whose heading equals another slide's title,
 *  3. explicit CTA buttons (start / next / home …).
 *
 * It returns ranked proposals; the AiTab panel (or the assistant) applies them
 * through `applyZoomBatch`, so a whole batch is a single undo step.
 */
import { canTriggerZoom, slideLabel } from '../../document/zoom'
import type { AnyElement, Presentation, Slide } from '../../document/types'

export type ZoomSuggestionReason = 'agenda' | 'title-match' | 'cta'

export interface ZoomSuggestion {
  /** slide that owns the trigger element */
  slideId: string
  elementId: string
  elementName: string
  targetSlideId: string
  targetLabel: string
  reason: ZoomSuggestionReason
  /** 0..1, sorted desc */
  confidence: number
  /** human-readable "why" (Arabic) */
  why: string
}

const AGENDA_TITLE = /(محتويات|جدول\s*(المحتويات|الأعمال)?|الأجندة|الفهرس|خارطة|نظرة\s*عامة|agenda|contents?|outline|overview|index|sommaire)/i
const CTA_NEXT = /^(التالي|تابع|أكمل|اكتشف|التفاصيل|المزيد|اقرأ\s*المزيد|عرض|next|continue|learn\s*more|details|read\s*more|discover|show)\W*$/i
const CTA_HOME = /^(الرئيسية|البداية|العودة\s*للرئيسية|home|start|back\s*to\s*start)\W*$/i

/** plain text of a restricted-HTML content string (regex strip — DOM-free, test-safe) */
export function plainText(html: string): string {
  return html
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\s*li[^>]*>/gi, '\n• ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

export function elementText(el: AnyElement): string {
  return el.kind === 'text' ? plainText(el.content) : ''
}

/** best-guess slide title: largest text element wins, then first text */
export function slideTitleText(slide: Slide): string {
  let best = ''
  let bestScore = -1
  for (const el of slide.elements) {
    if (el.kind !== 'text' || !el.visible) continue
    const t = elementText(el).split('\n')[0].trim()
    if (!t) continue
    const score = el.font.fontSize * 1000 + el.w * el.h
    if (score > bestScore) {
      bestScore = score
      best = t
    }
  }
  return best
}

function norm(s: string): string {
  return s
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .toLowerCase()
    .replace(/[^\p{L}\p{N} ]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokens(s: string): string[] {
  return norm(s).split(' ').filter((t) => t.length > 1)
}

/** 0..1 overlap of the shorter token set covered by the longer */
function overlap(a: string, b: string): number {
  const ta = tokens(a)
  const tb = new Set(tokens(b))
  if (!ta.length || !tb.size) return 0
  const hit = ta.filter((t) => tb.has(t)).length
  return hit / Math.max(ta.length, tb.size)
}

function isAgendaSlide(slide: Slide): boolean {
  if (AGENDA_TITLE.test(slideTitleText(slide))) return true
  if (slide.name && AGENDA_TITLE.test(slide.name)) return true
  return false
}

export function suggestZoomLinks(doc: Presentation, max = 12): ZoomSuggestion[] {
  const out: ZoomSuggestion[] = []
  const seen = new Set<string>() // trigger ids already proposed
  const titles = new Map<string, string>()
  for (const s of doc.slides) titles.set(s.id, slideTitleText(s))

  const propose = (slide: Slide, el: AnyElement, targetId: string, reason: ZoomSuggestionReason, confidence: number, why: string) => {
    if (seen.has(el.id) || el.zoom || targetId === slide.id) return
    seen.add(el.id)
    out.push({
      slideId: slide.id,
      elementId: el.id,
      elementName: el.name,
      targetSlideId: targetId,
      targetLabel: slideLabel(doc, targetId),
      reason,
      confidence,
      why,
    })
  }

  // pass 1 — agenda slides: every text item matched against all slide titles
  for (const slide of doc.slides) {
    if (!isAgendaSlide(slide)) continue
    for (const el of slide.elements) {
      if (el.kind !== 'text' || !el.visible || el.locked || el.zoom) continue
      const lines = elementText(el).split('\n').map((l) => l.replace(/^•\s*/, '').trim()).filter(Boolean)
      // single-item elements match on their whole text; multi-line match per line (first hit wins)
      const needles = lines.length > 1 ? lines : [elementText(el).replace(/^•\s*/, '').trim()]
      for (const needle of needles) {
        if (needle.length < 2 || needle.length > 80) continue
        const hit = bestTitleHit(doc, titles, slide.id, needle)
        if (hit) {
          propose(slide, el, hit.id, 'agenda', Math.min(0.97, hit.score + 0.08), `«${needle}» يطابق عنوان ${slideLabel(doc, hit.id)}`)
          break
        }
      }
    }
  }

  // pass 2 — any single-line text / card heading matching another slide title
  for (const slide of doc.slides) {
    for (const el of slide.elements) {
      if (!canTriggerZoom(el) || !el.visible || el.locked || el.zoom || seen.has(el.id)) continue
      if (el.kind !== 'text') continue
      const t = elementText(el).split('\n')[0].trim()
      if (t.length < 2 || t.length > 60) continue
      const hit = bestTitleHit(doc, titles, slide.id, t)
      if (hit && hit.score >= 0.72) {
        propose(slide, el, hit.id, 'title-match', hit.score, `النص يطابق عنوان ${slideLabel(doc, hit.id)}`)
      }
    }
  }

  // pass 3 — CTA buttons with deterministic targets
  doc.slides.forEach((slide, i) => {
    for (const el of slide.elements) {
      if (!canTriggerZoom(el) || !el.visible || el.locked || el.zoom || seen.has(el.id)) continue
      const label = el.kind === 'text' ? elementText(el).split('\n')[0].trim() : el.name
      if (!label) continue
      if (CTA_HOME.test(label) && i !== 0) {
        propose(slide, el, doc.slides[0].id, 'cta', 0.85, 'زر عودة للشريحة الأولى')
      } else if (CTA_NEXT.test(label) && i < doc.slides.length - 1) {
        propose(slide, el, doc.slides[i + 1].id, 'cta', 0.7, 'زر انتقال للشريحة التالية')
      }
    }
  })

  return out.sort((a, b) => b.confidence - a.confidence).slice(0, max)
}

function bestTitleHit(
  doc: Presentation,
  titles: Map<string, string>,
  skipSlideId: string,
  needle: string,
): { id: string; score: number } | null {
  const n = norm(needle)
  if (!n) return null
  let best: { id: string; score: number } | null = null
  for (const s of doc.slides) {
    if (s.id === skipSlideId) continue
    const title = titles.get(s.id) ?? ''
    if (!title) continue
    const t = norm(title)
    let score = 0
    if (n === t) score = 0.95
    else if (t.includes(n) && n.length >= 4) score = 0.85
    else if (n.includes(t) && t.length >= 4) score = 0.8
    else {
      const ov = overlap(needle, title)
      if (ov >= 0.66) score = 0.6 + ov * 0.2
    }
    if (score > 0 && (!best || score > best.score)) best = { id: s.id, score }
  }
  return best
}
