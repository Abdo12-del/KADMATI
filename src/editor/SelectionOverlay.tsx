import { memo, type CSSProperties } from 'react'
import { Lock, Spline } from 'lucide-react'
import { rotatedBounds } from '../document/geometry'
import type { AnyElement, Presentation, Slide } from '../document/types'
import type { HandleId, Guide } from './useInteraction'
import { useUI } from '../store/useUI'

/**
 * Screen-space overlay: selection, handles, smart guides, live badges.
 * Everything is drawn in `design × zoom` px so handle hit-targets stay 8px at any zoom.
 */

const HANDLES: HandleId[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

export interface OverlayProps {
  slide: Slide
  doc: Presentation
  selection: string[]
  zoom: number
  guides: Guide[]
  badge: { x: number; y: number; text: string } | null
  marquee: { x: number; y: number; w: number; h: number } | null
  gesture: string | null
  onHandleDown: (e: React.PointerEvent, h: HandleId) => void
  onRotateDown: (e: React.PointerEvent) => void
}

export const SelectionOverlay = memo(function SelectionOverlay({ slide, doc, selection, zoom, guides, badge, marquee, gesture, onHandleDown, onRotateDown }: OverlayProps) {
  const els = slide.elements.filter((e) => selection.includes(e.id))
  const single = els.length === 1 ? els[0] : null
  const bounds = union(els)
  const px = (v: number) => v * zoom
  const active = gesture && gesture !== 'marquee'
  const setRightPanel = useUI((s) => s.setRightPanel)

  const openAnimate = (e: React.PointerEvent) => {
    e.stopPropagation()
    setRightPanel('animate')
  }

  return (
    <div className="pointer-events-none absolute inset-0" style={{ width: px(doc.size.w), height: px(doc.size.h) }}>
      {/* per-element outlines */}
      {els.map((el) => (
        <ElementOutline key={el.id} el={el} zoom={zoom} strong={!!single} />
      ))}

      {/* handles */}
      {single && !single.locked ? (
        <>
          {HANDLES.map((h) => {
            const p = cornerOf(single, h)
            return (
              <button
                key={h}
                type="button"
                data-handle={h}
                onPointerDown={(e) => onHandleDown(e, h)}
                className="pointer-events-auto absolute size-[9px] rounded-[2px] border border-signal bg-white shadow-[0_1px_2px_rgba(0,0,0,0.45)] transition-transform hover:scale-125"
                style={{
                  left: px(p.x) - 4.5,
                  top: px(p.y) - 4.5,
                  cursor: handleCursor(h, single.rotation),
                }}
              />
            )
          })}
          <RotateHandle x={px(single.x + single.w / 2)} yTop={px(single.y)} onDown={onRotateDown} />
        </>
      ) : null}

      {els.length > 1 && bounds && !bounds.locked ? <MultiHandles bounds={bounds} zoom={zoom} onDown={onHandleDown} locked={false} /> : null}

      {/* smart guides */}
      {active
        ? guides.map((g, i) =>
            g.axis === 'x' ? (
              <span key={`gx${i}`} className="absolute bg-signal" style={{ left: px(g.pos), top: px(g.from) - 0.5, width: 1, height: Math.max(2, px(g.to - g.from)) }} />
            ) : (
              <span key={`gy${i}`} className="absolute bg-signal" style={{ top: px(g.pos), left: px(g.from) - 0.5, height: 1, width: Math.max(2, px(g.to - g.from)) }} />
            ),
          )
        : null}

      {/* marquee */}
      {marquee ? (
        <div
          className="absolute rounded-[2px] border border-signal/80 bg-signal/10"
          style={{ left: px(marquee.x), top: px(marquee.y), width: px(marquee.w), height: px(marquee.h) }}
        />
      ) : null}

      {/* quick Animate action — opens the effect library for the current selection.
          For a single element it is offset left of the top-center rotate handle. */}
      {bounds && els.length && !els.every((e) => e.locked) ? (
        <button
          type="button"
          onPointerDown={openAnimate}
          className="pointer-events-auto absolute z-10 flex items-center gap-1 whitespace-nowrap rounded-full border border-signal/50 bg-ink-1000/92 px-2 py-0.5 text-[10.5px] font-semibold text-signal-soft shadow-lg transition-transform hover:scale-105"
          style={
            single
              ? { left: px(bounds.x), top: px(bounds.y) - 26, transform: 'translateY(-100%)' }
              : { left: px(bounds.x + bounds.w / 2), top: px(bounds.y) - 26, transform: 'translateX(-50%)' }
          }
          title="إضافة حركة إلى التحديد"
        >
          <Spline size={11} /> حركة{els.length > 1 ? ` (${els.length})` : ''}
        </button>
      ) : null}

      {/* live badge */}
      {badge ? (
        <div
          className="absolute rounded-md border border-ink-600 bg-ink-1000/92 px-1.5 py-0.5 font-mono text-[10.5px] tabular-nums text-signal-soft"
          style={{ left: px(badge.x), top: px(badge.y) - 26, transform: 'translateX(-50%)' }}
        >
          {badge.text}
        </div>
      ) : null}

      {single?.locked ? (
        <div className="absolute flex items-center gap-1 rounded-md border border-ink-600 bg-ink-1000/90 px-1.5 py-0.5 text-[10.5px] text-ink-200" style={{ left: px(single.x), top: px(single.y) - 24 }}>
          <Lock className="size-3" />
          مقفل
        </div>
      ) : null}
    </div>
  )
})

function ElementOutline({ el, zoom, strong }: { el: AnyElement; zoom: number; strong: boolean }) {
  const b = rotatedBounds(el)
  const style: CSSProperties = {
    position: 'absolute',
    left: b.x * zoom,
    top: b.y * zoom,
    width: b.w * zoom,
    height: b.h * zoom,
  }
  if (!strong) {
    return <div style={{ ...style, boxShadow: 'inset 0 0 0 1px rgba(255,90,54,0.55)' }} />
  }
  return (
    <div
      style={{
        position: 'absolute',
        left: el.x * zoom,
        top: el.y * zoom,
        width: el.w * zoom,
        height: el.h * zoom,
        transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
        transformOrigin: 'center',
        boxShadow: 'inset 0 0 0 1.5px var(--color-signal)',
      }}
    />
  )
}

function RotateHandle({ x, yTop, onDown }: { x: number; yTop: number; onDown: (e: React.PointerEvent) => void }) {
  return (
    <>
      <span className="absolute w-px bg-signal/70" style={{ left: x, top: yTop - 20, height: 20 }} />
      <button
        type="button"
        onPointerDown={onDown}
        className="pointer-events-auto absolute size-[11px] rounded-full border border-signal bg-white transition-transform hover:scale-125"
        style={{ left: x - 5.5, top: yTop - 26, cursor: 'grab' }}
        aria-label="تدوير"
      />
    </>
  )
}

function MultiHandles({ bounds, zoom, onDown, locked }: { bounds: { x: number; y: number; w: number; h: number }; zoom: number; onDown: (e: React.PointerEvent, h: HandleId) => void; locked: boolean }) {
  if (locked) return null
  return (
    <>
      {(['nw', 'ne', 'se', 'sw'] as HandleId[]).map((h) => {
        const p = cornerOfRect(bounds, h)
        return (
          <button
            key={h}
            type="button"
            onPointerDown={(e) => onDown(e, h)}
            className="pointer-events-auto absolute size-[8px] rounded-[2px] border border-signal/80 bg-white/90"
            style={{ left: p.x * zoom - 4, top: p.y * zoom - 4, cursor: handleCursor(h, 0) }}
          />
        )
      })}
    </>
  )
}

/* ------------------------------------------------------------------ geometry */

function cornerOf(el: AnyElement, handle: HandleId): { x: number; y: number } {
  const cx = el.x + el.w / 2
  const cy = el.y + el.h / 2
  const local = {
    nw: { x: -el.w / 2, y: -el.h / 2 },
    n: { x: 0, y: -el.h / 2 },
    ne: { x: el.w / 2, y: -el.h / 2 },
    e: { x: el.w / 2, y: 0 },
    se: { x: el.w / 2, y: el.h / 2 },
    s: { x: 0, y: el.h / 2 },
    sw: { x: -el.w / 2, y: el.h / 2 },
    w: { x: -el.w / 2, y: 0 },
  }[handle]
  if (!el.rotation) return { x: cx + local.x, y: cy + local.y }
  const rad = (el.rotation * Math.PI) / 180
  return { x: cx + local.x * Math.cos(rad) - local.y * Math.sin(rad), y: cy + local.x * Math.sin(rad) + local.y * Math.cos(rad) }
}

function cornerOfRect(r: { x: number; y: number; w: number; h: number }, handle: HandleId) {
  const map: Record<HandleId, { x: number; y: number }> = {
    nw: { x: r.x, y: r.y },
    n: { x: r.x + r.w / 2, y: r.y },
    ne: { x: r.x + r.w, y: r.y },
    e: { x: r.x + r.w, y: r.y + r.h / 2 },
    se: { x: r.x + r.w, y: r.y + r.h },
    s: { x: r.x + r.w / 2, y: r.y + r.h },
    sw: { x: r.x, y: r.y + r.h },
    w: { x: r.x, y: r.y + r.h / 2 },
  }
  return map[handle]
}

function union(els: AnyElement[]) {
  if (!els.length) return null
  const rects = els.map(rotatedBounds)
  let x = Infinity
  let y = Infinity
  let X = -Infinity
  let Y = -Infinity
  for (const r of rects) {
    x = Math.min(x, r.x)
    y = Math.min(y, r.y)
    X = Math.max(X, r.x + r.w)
    Y = Math.max(Y, r.y + r.h)
  }
  return { x, y, w: X - x, h: Y - y, locked: els.every((e) => e.locked) }
}

function handleCursor(handle: HandleId, rotation: number): string {
  const base: Record<HandleId, number> = { n: 0, ne: 45, e: 90, se: 135, s: 180, sw: 225, w: 270, nw: 315 }
  const deg = (base[handle] + rotation + 90) % 180
  if (deg < 22.5 || deg >= 157.5) return 'ns-resize'
  if (deg < 67.5) return 'nesw-resize'
  if (deg < 112.5) return 'ew-resize'
  return 'nwse-resize'
}
