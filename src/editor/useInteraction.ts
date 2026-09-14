/**
 * Editor interaction engine.
 *
 * Why hand-written instead of `react-moveable` (MIT, genuinely good): the library mutates the
 * DOM during a gesture, which fights a React single-source-of-truth document model, and it does
 * not know our canvas is a CSS-scaled *design space* (1280×720) where snapping must happen in
 * model units. ~350 lines buys pixel-exact drag/resize/rotate, Figma-style smart guides, and
 * exactly one undo entry per gesture. See RESEARCH.md §2.3.
 */
import { useCallback, useRef, useState } from 'react'
import { rectsIntersect, rotatedBounds, unionBounds, type Rect } from '../document/geometry'
import type { AnyElement, Presentation, Slide } from '../document/types'
import { useDoc } from '../store/useDoc'

export type HandleId = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'
export type GestureKind = 'drag' | 'resize' | 'rotate' | 'marquee' | null

export interface Guide {
  axis: 'x' | 'y'
  pos: number
  from: number
  to: number
  kind: 'center' | 'edge' | 'slide'
}

export interface Badge {
  x: number
  y: number
  text: string
}

interface Origin {
  x: number
  y: number
  w: number
  h: number
  rotation: number
}

interface ActiveGesture {
  kind: Exclude<GestureKind, null>
  pointerId: number
  start: { x: number; y: number }
  handle?: HandleId
  ids: string[]
  origin: Record<string, Origin>
  pivot?: { x: number; y: number }
  moved: boolean
  marquee?: Rect
}

const SNAP_TOL = 7
const MIN_SIZE = 8

export interface InteractionApi {
  guides: Guide[]
  badge: Badge | null
  marquee: Rect | null
  gestureKind: GestureKind
  onElementPointerDown: (e: React.PointerEvent, id: string) => void
  onSurfacePointerDown: (e: React.PointerEvent) => void
  onHandlePointerDown: (e: React.PointerEvent, handle: HandleId) => void
  onRotatePointerDown: (e: React.PointerEvent) => void
  onPointerMove: (e: React.PointerEvent) => void
  onPointerUp: (e: React.PointerEvent) => void
}

export function useInteraction(slideRef: React.RefObject<HTMLElement | null>, slide: Slide | undefined, doc: Presentation, zoom: number): InteractionApi {
  const gesture = useRef<ActiveGesture | null>(null)
  const [guides, setGuides] = useState<Guide[]>([])
  const [badge, setBadge] = useState<Badge | null>(null)
  const [marquee, setMarquee] = useState<Rect | null>(null)
  const [gestureKind, setGestureKind] = useState<GestureKind>(null)

  const toDesign = (clientX: number, clientY: number) => {
    const rect = slideRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return { x: (clientX - rect.left) / zoom, y: (clientY - rect.top) / zoom }
  }

  /* -------------------------------------------------- snapping */

  const snapAxis = (value: number, axis: 'x' | 'y', box: Rect, ignore: Set<string>, out: Guide[]): number => {
    const tol = SNAP_TOL / zoom
    const size = axis === 'x' ? doc.size.w : doc.size.h
    const extent = axis === 'x' ? box.w : box.h
    const start = axis === 'x' ? box.x : box.y
    const end = axis === 'x' ? box.x + box.w : box.y + box.h
    const others = (slide?.elements ?? []).filter((el) => !ignore.has(el.id) && el.visible)

    type Cand = { pos: number; kind: Guide['kind']; partner: Rect | null }
    const cands: Cand[] = [
      { pos: 0, kind: 'slide', partner: null },
      { pos: size, kind: 'slide', partner: null },
      { pos: size / 2 - extent / 2, kind: 'center', partner: null },
      { pos: size / 2 + extent / 2, kind: 'center', partner: null },
    ]
    for (const el of others) {
      const b = rotatedBounds(el)
      const s = axis === 'x' ? b.x : b.y
      const e = axis === 'x' ? b.x + b.w : b.y + b.h
      const mid = s + (e - s) / 2
      cands.push(
        { pos: s, kind: 'edge', partner: b },
        { pos: e, kind: 'edge', partner: b },
        { pos: mid - extent / 2, kind: 'center', partner: b },
        { pos: mid + extent / 2, kind: 'center', partner: b },
        { pos: mid - (e - s) / 2, kind: 'center', partner: b },
      )
    }
    if (doc.settings.snapToGrid) {
      const g = doc.settings.gridSize
      for (let m = 0; m <= Math.ceil(size / g); m++) cands.push({ pos: m * g, kind: 'edge', partner: null })
    }

    let best: { delta: number; cand: Cand } | null = null
    for (const cand of cands) {
      const delta = cand.pos - value
      if (Math.abs(delta) <= tol && (!best || Math.abs(delta) < Math.abs(best.delta))) best = { delta, cand }
    }
    if (!best) return value
    const snapped = best.cand.pos
    const overlap = others.some((el) => {
      const b = rotatedBounds(el)
      const s = axis === 'x' ? b.x : b.y
      const e = axis === 'x' ? b.x + b.w : b.y + b.h
      return start < e && s < end
    })
    out.push({
      axis,
      pos: snapped,
      from: overlap ? Math.min(start, snapped) : 0,
      to: overlap ? Math.max(end, snapped) : size,
      kind: best.cand.kind,
    })
    return snapped
  }

  /* -------------------------------------------------- gesture start */

  const begin = (kind: Exclude<GestureKind, null>, e: React.PointerEvent, ids: string[], extra: Partial<ActiveGesture> = {}) => {
    const store = useDoc.getState()
    if (!slide) return
    const origin: Record<string, Origin> = {}
    const collect = (el: AnyElement) => {
      origin[el.id] = { x: el.x, y: el.y, w: el.w, h: el.h, rotation: el.rotation }
    }
    for (const el of slide.elements) if (ids.includes(el.id)) collect(el)

    let workingIds = ids
    if (kind === 'drag' && e.altKey) {
      store.duplicateSelected()
      workingIds = useDoc.getState().selection
      const fresh = useDoc.getState().doc.slides[useDoc.getState().slideIndex]
      for (const el of fresh?.elements ?? []) if (workingIds.includes(el.id) && !origin[el.id]) collect(el)
    }

    store.beginTransaction()
    store.setGesture(kind)
    gesture.current = { kind, pointerId: e.pointerId, start: toDesign(e.clientX, e.clientY), ids: workingIds, origin, moved: false, ...extra }
    setGestureKind(kind)
    try {
      ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
    } catch {
      /* capture is a nicety */
    }
  }

  const onElementPointerDown = (e: React.PointerEvent, id: string) => {
    if (e.button !== 0) return
    const store = useDoc.getState()
    if (store.editingId) store.stopEditing()
    const el = slide?.elements.find((x) => x.id === id)
    if (!el) return
    const current = store.selection
    const expandable = el.gid ? (slide?.elements ?? []).filter((x) => x.gid === el.gid).map((x) => x.id) : [id]
    let ids: string[]
    if (e.shiftKey) ids = Array.from(new Set(current.includes(id) ? current.filter((x) => x !== id) : [...current, ...expandable]))
    else ids = current.length > 1 && current.includes(id) ? current : expandable
    store.select(ids)
    if (!ids.length || el.locked) return
    begin('drag', e, ids)
  }

  const onSurfacePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    const store = useDoc.getState()
    if (store.editingId) store.stopEditing()
    if (!e.shiftKey) store.clearSelection()
    const start = toDesign(e.clientX, e.clientY)
    gesture.current = { kind: 'marquee', pointerId: e.pointerId, start, ids: [], origin: {}, moved: false, marquee: { x: start.x, y: start.y, w: 0, h: 0 } }
    setGestureKind('marquee')
    try {
      ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
    } catch {
      /* noop */
    }
  }

  const onHandlePointerDown = (e: React.PointerEvent, handle: HandleId) => {
    e.stopPropagation()
    const ids = useDoc.getState().selection
    if (ids.length !== 1) return
    begin('resize', e, ids, { handle })
  }

  const onRotatePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    const ids = useDoc.getState().selection
    if (!ids.length) return
    const box = unionBounds((slide?.elements ?? []).filter((el) => ids.includes(el.id)).map(rotatedBounds))
    if (!box) return
    begin('rotate', e, ids, { pivot: { x: box.x + box.w / 2, y: box.y + box.h / 2 } })
  }

  /* -------------------------------------------------- gesture move */

  const onPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current
    if (!g || !slide) return
    const p = toDesign(e.clientX, e.clientY)
    const dx = p.x - g.start.x
    const dy = p.y - g.start.y
    if (!g.moved) {
      if (Math.hypot(dx * zoom, dy * zoom) < 2 && g.kind !== 'rotate') return
      g.moved = true
    }
    const store = useDoc.getState()
    const next: Guide[] = []

    if (g.kind === 'drag') {
      const origins = Object.entries(g.origin)
      const moving = origins.map(([, o]) => ({ x: o.x + dx, y: o.y + dy, w: o.w, h: o.h }))
      const box = unionBounds(moving) ?? { x: 0, y: 0, w: 0, h: 0 }
      const ignore = new Set(g.ids)
      let sx = dx
      let sy = dy
      if (!e.shiftKey) {
        const snappedX = snapAxis(box.x, 'x', box, ignore, next)
        const snappedY = snapAxis(box.y, 'y', box, ignore, next)
        if (snappedX !== box.x) sx += snappedX - box.x
        if (snappedY !== box.y) sy += snappedY - box.y
        // If the free edge is a better match than the leading edge, prefer the trailing snap.
        const trailX = snapAxis(box.x + box.w, 'x', box, ignore, [])
        const trailY = snapAxis(box.y + box.h, 'y', box, ignore, [])
        if (trailX !== box.x + box.w && Math.abs(trailX - (box.x + box.w)) < Math.abs(snappedX - box.x)) sx += trailX - (box.x + box.w)
        if (trailY !== box.y + box.h && Math.abs(trailY - (box.y + box.h)) < Math.abs(snappedY - box.y)) sy += trailY - (box.y + box.h)
      } else if (doc.settings.snapToGrid) {
        const grid = doc.settings.gridSize
        sx = Math.round((box.x + dx) / grid) * grid - box.x
        sy = Math.round((box.y + dy) / grid) * grid - box.y
      }
      const map: Record<string, { x: number; y: number }> = {}
      for (const [id, o] of origins) map[id] = { x: o.x + sx, y: o.y + sy }
      // Children of a moved frame travel with it.
      for (const el of slide.elements) {
        if (el.frameId && map[el.frameId] && !map[el.id]) map[el.id] = { x: el.x + sx, y: el.y + sy }
      }
      store.setPositions(map, { history: false })
      setGuides(next)
      const first = g.origin[g.ids[0]]
      if (first) setBadge({ x: first.x + sx, y: first.y + sy, text: `${Math.round(first.x + sx)}, ${Math.round(first.y + sy)}` })
    } else if (g.kind === 'resize') {
      const id = g.ids[0]
      const o = g.origin[id]
      if (!o || !g.handle) return
      const local = rotateDelta(dx, dy, o.rotation)
      let box = applyResize(o, g.handle, local.x, local.y, e.shiftKey, e.altKey)
      if (doc.settings.smartGuides) {
        const ignore = new Set([id])
        const movingEdge = edgeOf(g.handle)
        const snapped = { ...box }
        if (movingEdge.includes('l')) snapped.x = snapAxis(box.x, 'x', box, ignore, next)
        if (movingEdge.includes('r')) snapped.w = Math.max(MIN_SIZE, snapAxis(box.x + box.w, 'x', box, ignore, next) - box.x)
        if (movingEdge.includes('t')) snapped.y = snapAxis(box.y, 'y', box, ignore, next)
        if (movingEdge.includes('b')) snapped.h = Math.max(MIN_SIZE, snapAxis(box.y + box.h, 'y', box, ignore, next) - box.y)
        box = snapped
      }
      store.setGeometry(id, { x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.w), h: Math.round(box.h) })
      setGuides(next)
      setBadge({ x: box.x, y: box.y, text: `${Math.round(box.w)} × ${Math.round(box.h)}` })
    } else if (g.kind === 'rotate') {
      const id = g.ids[0]
      const o = g.origin[id]
      if (!o || !g.pivot) return
      const a0 = Math.atan2(g.start.y - g.pivot.y, g.start.x - g.pivot.x)
      const a1 = Math.atan2(p.y - g.pivot.y, p.x - g.pivot.x)
      let deg = o.rotation + ((a1 - a0) * 180) / Math.PI
      if (e.shiftKey) deg = Math.round(deg / 15) * 15
      store.setGeometry(id, { rotation: normalizeAngle(deg) })
      setBadge({ x: o.x, y: o.y, text: `${Math.round(normalizeAngle(deg))}°` })
    } else if (g.kind === 'marquee') {
      const r: Rect = { x: Math.min(g.start.x, p.x), y: Math.min(g.start.y, p.y), w: Math.abs(p.x - g.start.x), h: Math.abs(p.y - g.start.y) }
      setMarquee(r)
      const hit = (slide.elements ?? []).filter((el) => el.visible && !el.locked && rectsIntersect(r, { x: el.x, y: el.y, w: el.w, h: el.h })).map((el) => el.id)
      store.select(hit, { additive: e.shiftKey })
    }
  }

  /* -------------------------------------------------- gesture end */

  const onPointerUp = useCallback(() => {
    const g = gesture.current
    const store = useDoc.getState()
    gesture.current = null
    setGuides([])
    setBadge(null)
    setMarquee(null)
    setGestureKind(null)
    store.setGesture(null)
    if (!g) return
    if (g.kind === 'marquee' || !g.moved) {
      // Nothing was changed: drop the snapshot so the undo stack is untouched.
      useDoc.temporal.getState().resume()
      useDoc.setState({ snapshot: null })
      return
    }
    const label = g.kind === 'drag' ? 'تحريك العنصر' : g.kind === 'resize' ? 'تغيير المقاس' : g.kind === 'rotate' ? 'تدوير العنصر' : 'تعديل'
    store.endTransaction(label)
  }, [])

  return {
    guides,
    badge,
    marquee,
    gestureKind,
    onElementPointerDown,
    onSurfacePointerDown,
    onHandlePointerDown,
    onRotatePointerDown,
    onPointerMove,
    onPointerUp,
  }
}

/* ------------------------------------------------------------------ math */

export function normalizeAngle(deg: number): number {
  let d = deg % 360
  if (d > 180) d -= 360
  if (d < -180) d += 360
  return Math.round(d * 10) / 10
}

function rotateDelta(dx: number, dy: number, deg: number) {
  const rad = (-deg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  return { x: dx * cos - dy * sin, y: dx * sin + dy * cos }
}

function edgeOf(handle: HandleId): string {
  return handle
    .replace(/w/g, 'l')
    .replace(/e/g, 'r')
    .replace(/n/g, 't')
    .replace(/s/g, 'b')
}

export function applyResize(o: Origin, handle: HandleId, dx: number, dy: number, keepRatio: boolean, fromCenter: boolean): Rect {
  let left = o.x
  let top = o.y
  let right = o.x + o.w
  let bottom = o.y + o.h
  if (handle.includes('w')) left = Math.min(o.x + dx, right - MIN_SIZE)
  if (handle.includes('e')) right = Math.max(o.x + o.w + dx, left + MIN_SIZE)
  if (handle.includes('n')) top = Math.min(o.y + dy, bottom - MIN_SIZE)
  if (handle.includes('s')) bottom = Math.max(o.y + o.h + dy, top + MIN_SIZE)
  if (handle === 'n' || handle === 's') {
    left = o.x
    right = o.x + o.w
  }
  if (handle === 'e' || handle === 'w') {
    top = o.y
    bottom = o.y + o.h
  }
  let w = right - left
  let h = bottom - top
  if (keepRatio && handle.length === 2) {
    const ratio = o.w / Math.max(1, o.h)
    if (Math.abs(w) / ratio > Math.abs(h)) h = w / ratio
    else w = h * ratio
    if (handle.includes('n')) top = bottom - h
    else bottom = top + h
    if (handle.includes('w')) left = right - w
    else right = left + w
    w = right - left
    h = bottom - top
  }
  const out = { x: left, y: top, w: Math.max(MIN_SIZE, w), h: Math.max(MIN_SIZE, h) }
  if (fromCenter) {
    return { x: o.x + o.w / 2 - out.w / 2, y: o.y + o.h / 2 - out.h / 2, w: out.w, h: out.h }
  }
  return out
}

export function selectionBoundsOf(slide: Slide | undefined, ids: string[]): Rect | null {
  if (!slide || !ids.length) return null
  return unionBounds(slide.elements.filter((el) => ids.includes(el.id)).map(rotatedBounds))
}

