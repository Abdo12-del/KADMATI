import type { AnyElement, Presentation, Slide } from './types'
import { CANVAS_H, CANVAS_W } from './types'

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface Box extends Rect {
  right: number
  bottom: number
  cx: number
  cy: number
}

export function toBox(r: Rect): Box {
  return { ...r, right: r.x + r.w, bottom: r.y + r.h, cx: r.x + r.w / 2, cy: r.y + r.h / 2 }
}

/** Axis-aligned bounds of a rotated element (used for selection outlines & guides). */
export function rotatedBounds(el: AnyElement): Rect {
  if (!el.rotation) return { x: el.x, y: el.y, w: el.w, h: el.h }
  const rad = (el.rotation * Math.PI) / 180
  const cos = Math.abs(Math.cos(rad))
  const sin = Math.abs(Math.sin(rad))
  const w = el.w * cos + el.h * sin
  const h = el.w * sin + el.h * cos
  return { x: el.x + el.w / 2 - w / 2, y: el.y + el.h / 2 - h / 2, w, h }
}

export function selectionBounds(slide: Slide, ids: string[]): Rect | null {
  const els = slide.elements.filter((e) => ids.includes(e.id))
  if (!els.length) return null
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const e of els) {
    const b = rotatedBounds(e)
    minX = Math.min(minX, b.x)
    minY = Math.min(minY, b.y)
    maxX = Math.max(maxX, b.x + b.w)
    maxY = Math.max(maxY, b.y + b.h)
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

export function unionBounds(rects: Rect[]): Rect | null {
  if (!rects.length) return null
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const r of rects) {
    minX = Math.min(minX, r.x)
    minY = Math.min(minY, r.y)
    maxX = Math.max(maxX, r.x + r.w)
    maxY = Math.max(maxY, r.y + r.h)
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

export function rectsIntersect(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
}

export function pointInRect(px: number, py: number, r: Rect, pad = 0): boolean {
  return px >= r.x - pad && px <= r.x + r.w + pad && py >= r.y - pad && py <= r.y + r.h + pad
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

export function round(v: number, digits = 0): number {
  const f = 10 ** digits
  return Math.round(v * f) / f
}

/** Rotate a pointer offset around a box centre — used for resize with `rotation`. */
export function rotateVector(dx: number, dy: number, deg: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  return { x: dx * cos - dy * sin, y: dx * sin + dy * cos }
}

export type AlignEdge = 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom'

export function alignRects(target: Rect[], edge: AlignEdge, anchor: Rect): Rect[] {
  return target.map((r) => {
    switch (edge) {
      case 'left':
        return { ...r, x: anchor.x }
      case 'right':
        return { ...r, x: anchor.x + anchor.w - r.w }
      case 'hcenter':
        return { ...r, x: anchor.x + (anchor.w - r.w) / 2 }
      case 'top':
        return { ...r, y: anchor.y }
      case 'bottom':
        return { ...r, y: anchor.y + anchor.h - r.h }
      case 'vcenter':
        return { ...r, y: anchor.y + (anchor.h - r.h) / 2 }
    }
  })
}

export interface Distributed {
  offset: number
  size: number
}

/** Equal-spacing distribution along an axis, edges pinned to the bounds. */
export function distribute(items: { start: number; size: number }[], totalStart: number, totalSize: number): Distributed[] {
  if (items.length < 3) return items.map((i) => ({ offset: i.start, size: i.size }))
  const used = items.reduce((s, i) => s + i.size, 0)
  const gap = (totalSize - used) / (items.length - 1)
  let cursor = totalStart
  return items.map((i) => {
    const out = { offset: cursor, size: i.size }
    cursor += i.size + gap
    return out
  })
}

/** Convert a canvas-space point to design units given a zoom + origin offset. */
export function screenToDesign(client: { x: number; y: number }, rect: DOMRect, zoom: number): { x: number; y: number } {
  return {
    x: (client.x - rect.left) / zoom,
    y: (client.y - rect.top) / zoom,
  }
}

export function designToCanvas(p: { x: number; y: number }, rect: DOMRect, zoom: number): { x: number; y: number } {
  return { x: p.x * zoom + rect.left, y: p.y * zoom + rect.top }
}

export function fitScale(w: number, h: number, availW: number, availH: number, pad = 0.94): number {
  return Math.min((availW * pad) / w, (availH * pad) / h)
}

export function slideAspect(p: Pick<Presentation, 'size'>): number {
  return p.size.w / p.size.h
}

export function defaultSize(): { w: number; h: number } {
  return { w: CANVAS_W, h: CANVAS_H }
}

/** Nearest grid multiple. */
export function snapValue(v: number, grid: number): number {
  return Math.round(v / grid) * grid
}
