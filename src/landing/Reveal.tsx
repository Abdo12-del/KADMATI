/**
 * Scroll-reveal wrapper for the landing page: adds `.is-visible` once the
 * block enters the viewport, letting the CSS transition do the work.
 * Content is never hidden from the accessibility tree — only visual opacity.
 */
import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '../lib/cn'

interface RevealProps {
  children: ReactNode
  className?: string
  /** Transition delay, e.g. '120ms' — used to stagger grids. */
  delay?: string
}

export function Reveal({ children, className, delay }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-visible')
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            io.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} className={cn('slf-reveal', className)} style={delay ? { transitionDelay: delay } : undefined}>
      {children}
    </div>
  )
}
