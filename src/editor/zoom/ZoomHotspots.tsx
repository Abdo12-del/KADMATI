/**
 * Zoom hotspots — the clickable layer of Zoom Navigation in present/preview modes.
 *
 * The render path (`SlideView`) stays untouched: hotspots are absolutely-positioned,
 * transparent <button>s drawn OVER trigger elements from model geometry (× viewport
 * scale, like SelectionOverlay). That gives us, for free:
 *  - keyboard access (Tab + Enter/Space work natively),
 *  - visible focus rings for a11y,
 *  - hover affordance without touching slide pixels,
 *  - zero interference with text selection, videos or hyperlinks (only trigger rects
 *    are covered, and only where a zoom is playable).
 */
import { memo } from 'react'
import type { AnyElement, Presentation, Slide } from '../../document/types'
import { resolveZoomTarget, slideLabel } from '../../document/zoom'
import { cn } from '../../lib/cn'

export interface ZoomHotspotsProps {
  doc: Presentation
  slide: Slide
  /** viewport scale (screen px per design px) */
  scale: number
  disabled?: boolean
  onActivate: (el: AnyElement, point: { x: number; y: number }) => void
}

export const ZoomHotspots = memo(function ZoomHotspots({ doc, slide, scale, disabled, onActivate }: ZoomHotspotsProps) {
  const triggers = slide.elements.filter((el) => {
    if (!el.visible || !el.zoom) return false
    const targetId = resolveZoomTarget(doc, el.zoom.target)
    // unplayable (dangling/section) or self-pointing links get no hotspot —
    // the editor surfaces them in the inspector and the navigation map instead
    return !!targetId && targetId !== slide.id
  })
  if (!triggers.length || disabled) return null

  return (
    <div className="kad-zoom-hotspots" data-zoom-layer aria-label="روابط التنقل">
      {triggers.map((el) => {
        const targetId = resolveZoomTarget(doc, el.zoom!.target)!
        const label = slideLabel(doc, targetId)
        return (
          <button
            key={el.id}
            type="button"
            data-zoom-hotspot={el.id}
            title={label}
            aria-label={`زوم إلى ${label}`}
            className={cn('kad-zoom-hotspot')}
            style={{
              left: el.x * scale,
              top: el.y * scale,
              width: Math.max(8, el.w * scale),
              height: Math.max(8, el.h * scale),
              transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
            }}
            onClick={(e) => {
              e.stopPropagation()
              const rect = (e.currentTarget.parentElement as HTMLElement | null)?.getBoundingClientRect()
              const px = rect ? (e.clientX - rect.left) / scale : el.x + el.w / 2
              const py = rect ? (e.clientY - rect.top) / scale : el.y + el.h / 2
              onActivate(el, { x: px, y: py })
            }}
            onKeyDown={(e) => {
              // Buttons already fire onClick for Enter/Space — stop it reaching the
              // presenter's global advance handler.
              if (e.key === 'Enter' || e.key === ' ') e.stopPropagation()
            }}
          >
            <span className="kad-zoom-hotspot-ring" aria-hidden />
          </button>
        )
      })}
    </div>
  )
})
