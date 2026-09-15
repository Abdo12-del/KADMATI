/**
 * Geometry reflow — resize a whole presentation between aspect ratios.
 *
 * Layouts are authored in the 1280×720 design space. When a deck is generated as 4:3 (960×720)
 * we scale every element: horizontal geometry and font sizes by `sx`, vertical geometry by `sy`.
 * This keeps proportions believable without a second layout library — and stays fully editable.
 *
 * Pure function over the document model; the editor then treats it like any other doc.
 */
import type { AnyElement, Presentation } from '../document/types'

export const SIZE_16_9 = { w: 1280, h: 720 }
export const SIZE_4_3 = { w: 960, h: 720 }

export type Aspect = '16:9' | '4:3'

export function sizeFor(aspect: Aspect): { w: number; h: number } {
  return aspect === '4:3' ? SIZE_4_3 : SIZE_16_9
}

export function aspectOf(size: { w: number; h: number }): Aspect {
  return Math.abs(size.w / size.h - 4 / 3) < Math.abs(size.w / size.h - 16 / 9) ? '4:3' : '16:9'
}

function scaleElement(el: AnyElement, sx: number, sy: number, fs: number): AnyElement {
  const next = { ...el, x: el.x * sx, y: el.y * sy, w: Math.max(24, el.w * sx), h: Math.max(16, el.h * sy) }
  if (next.shadow) next.shadow = { ...next.shadow, x: next.shadow.x * fs, y: next.shadow.y * fs, blur: next.shadow.blur * fs }
  if (next.kind === 'text') {
    next.font = { ...next.font, fontSize: Math.max(9, Math.round(next.font.fontSize * fs)), letterSpacing: next.font.letterSpacing * fs }
  }
  if (next.kind === 'shape' && next.textStyle) {
    next.textStyle = { ...next.textStyle, fontSize: Math.max(9, Math.round(next.textStyle.fontSize * fs)) }
    if (next.radius) next.radius = next.radius.map((r) => r * fs) as typeof next.radius
  }
  if (next.kind === 'shape' || next.kind === 'image' || next.kind === 'frame' || next.kind === 'video') {
    if ('radius' in next && next.radius) next.radius = next.radius.map((r) => r * fs) as typeof next.radius
  }
  if ((next.kind === 'line' || next.kind === 'image') && 'stroke' in next && next.stroke) {
    next.stroke = { ...next.stroke, width: Math.max(0.5, next.stroke.width * fs) }
  }
  if (next.kind === 'table') {
    next.colWidths = next.colWidths.map((w) => w * sx)
    next.rowHeights = next.rowHeights.map((h) => h * sy)
    next.font = { ...next.font, fontSize: Math.max(9, Math.round(next.font.fontSize * fs)) }
    next.cellPadding = next.cellPadding * fs
    next.border = { ...next.border, width: Math.max(0.5, next.border.width * fs) }
  }
  return next
}

/**
 * Scale ONE slide from the 1280×720 authoring space to the document's size — used when a single
 * slide is (re)generated outside instantiateDeck (per-slide AI regeneration on a 4:3 document).
 */
export function scaleSlideTo(slide: { elements: AnyElement[] }, size: { w: number; h: number }): void {
  const sx = size.w / SIZE_16_9.w
  const sy = size.h / SIZE_16_9.h
  if (sx === 1 && sy === 1) return
  const fs = Math.min(sx, sy)
  slide.elements = slide.elements.map((el) => scaleElement(el, sx, sy, fs))
}

/** Scale an entire presentation to the target size (idempotent when already at it). */
export function reflowToSize(doc: Presentation, to: { w: number; h: number }): void {
  const from = doc.size
  if (from.w === to.w && from.h === to.h) return
  const sx = to.w / from.w
  const sy = to.h / from.h
  const fs = Math.min(sx, sy)
  doc.size = { ...to }
  doc.settings = {
    ...doc.settings,
    margins: {
      top: doc.settings.margins.top * sy,
      right: doc.settings.margins.right * sx,
      bottom: doc.settings.margins.bottom * sy,
      left: doc.settings.margins.left * sx,
    },
  }
  for (const slide of doc.slides) {
    slide.elements = slide.elements.map((el) => scaleElement(el, sx, sy, fs))
  }
}
