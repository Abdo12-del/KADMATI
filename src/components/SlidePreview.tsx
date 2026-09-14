/**
 * Fits a real slide into any box by measuring the box and scaling the design — used by the landing
 * hero, template covers and deck cards. One component, so a thumbnail is never a different
 * rendering than the canvas.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { SlideView } from '../render/SlideView'
import { cn } from '../lib/cn'
import type { Presentation } from '../document/types'

export function SlidePreview({
  doc,
  index = 0,
  className,
  showHidden,
}: {
  doc: Presentation
  index?: number
  className?: string
  showHidden?: boolean
}) {
  const host = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const slide = doc.slides[Math.min(index, doc.slides.length - 1)]

  useLayoutEffect(() => {
    const el = host.current
    if (!el) return
    const apply = () => setWidth(el.clientWidth)
    apply()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', apply)
      return () => window.removeEventListener('resize', apply)
    }
    const ro = new ResizeObserver(apply)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // A second pass after mount keeps late-loading webfonts from leaving a stale scale.
  useEffect(() => {
    if (!width) return
    const id = window.setTimeout(() => setWidth(host.current?.clientWidth ?? width), 220)
    return () => window.clearTimeout(id)
  }, [width])

  const scale = width && doc.size.w ? width / doc.size.w : 0
  const height = doc.size.h * scale

  return (
    <div ref={host} className={cn('relative w-full overflow-hidden bg-ink-950', className)} style={{ height: height || undefined, aspectRatio: height ? undefined : `${doc.size.w} / ${doc.size.h}` }}>
      {slide && scale ? (
        <div className="absolute inset-0 origin-top-left" style={{ width: doc.size.w, height: doc.size.h, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <SlideView slide={slide} doc={doc} mode="thumb" static showHidden={showHidden} />
        </div>
      ) : null}
    </div>
  )
}
