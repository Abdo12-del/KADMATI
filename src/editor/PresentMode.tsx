/**
 * Presentation mode — a real presenter, not a slideshow widget:
 * fullscreen, keyboard/pointer/wheel navigation, timer with elapsed + total, speaker notes with
 * their own reading surface, per-slide transitions and per-element entrance animations, and a
 * blank/black-out key for the moments a presenter actually needs one.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, FileText, Minimize2, Moon, Play, Square } from 'lucide-react'
import { SlideView } from '../render/SlideView'
import { buildSlideEngine, type ElementBaseInfo } from '../animation/engine'
import { useDoc } from '../store/useDoc'
import { cn } from '../lib/cn'
import type { Presentation } from '../document/types'

interface PresentModeProps {
  doc: Presentation
  startAt: number
  onExit: () => void
}

const TRANSITION_CLASS: Record<string, string> = {
  fade: 'kad-t-fade',
  slide: 'kad-t-slide',
  push: 'kad-t-push',
  zoom: 'kad-t-zoom',
}

export function PresentMode({ doc, startAt, onExit }: PresentModeProps) {
  const visible = useMemo(() => doc.slides.filter((s) => !s.hidden), [doc.slides])
  const initial = Math.max(0, visible.findIndex((s) => s.id === doc.slides[startAt]?.id))
  const [index, setIndex] = useState(initial >= 0 ? initial : 0)
  const [showNotes, setShowNotes] = useState(false)
  const [blank, setBlank] = useState<null | 'black' | 'white'>(null)
  const [running, setRunning] = useState(true)
  const [elapsed, setElapsed] = useState(0)
  const [chromeVisible, setChromeVisible] = useState(true)
  const rootRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<number | null>(null)
  const slide = visible[Math.min(index, visible.length - 1)] ?? doc.slides[0]
  const dir = doc.metadata.dir === 'rtl' ? 'rtl' : 'ltr'

  /* ------------------------------------------------- engine playback (data-driven animations) */
  const animTargets = useRef(new Map<string, HTMLDivElement>())
  const registerAnim = useCallback((id: string, n: HTMLDivElement | null) => {
    if (n) animTargets.current.set(id, n)
    else animTargets.current.delete(id)
  }, [])

  useEffect(() => {
    const anims = slide?.animations
    if (!slide || !anims?.length) return
    const targets: Record<string, HTMLElement> = {}
    animTargets.current.forEach((n, id) => {
      targets[id] = n
    })
    const elements: Record<string, ElementBaseInfo> = {}
    for (const el of slide.elements) elements[el.id] = { x: el.x, y: el.y, w: el.w, h: el.h, rotation: el.rotation ?? 0 }
    const engine = buildSlideEngine({ targets, elements, anims, textSplit: true })
    engine.play()
    return () => engine.destroy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide?.id, slide?.animations])

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => Math.max(0, Math.min(visible.length - 1, i + delta)))
      setBlank(null)
    },
    [visible.length],
  )

  // Keep the editor's cursor in sync so exiting presentation leaves you where you presented.
  useEffect(() => {
    const real = doc.slides.findIndex((s) => s.id === slide?.id)
    if (real >= 0) useDoc.getState().gotoSlide(real)
  }, [slide, doc.slides])

  useEffect(() => {
    document.body.classList.add('presenting')
    const el = rootRef.current
    if (el?.requestFullscreen) el.requestFullscreen().catch(() => undefined)
    return () => {
      document.body.classList.remove('presenting')
      if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined)
    }
  }, [])

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setElapsed((v) => v + 1), 1000)
    return () => window.clearInterval(id)
  }, [running])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onExit()
          return
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
        case 'Enter':
          e.preventDefault()
          go(dir === 'rtl' && e.key === 'ArrowRight' ? -1 : 1)
          return
        case 'ArrowLeft':
        case 'PageUp':
        case 'Backspace':
          e.preventDefault()
          go(dir === 'rtl' && e.key === 'ArrowLeft' ? 1 : -1)
          return
        case 'ArrowDown':
          e.preventDefault()
          go(1)
          return
        case 'ArrowUp':
          e.preventDefault()
          go(-1)
          return
        case 'Home':
          setIndex(0)
          return
        case 'End':
          setIndex(visible.length - 1)
          return
        case 'n':
          setShowNotes((v) => !v)
          return
        case 'b':
          setBlank((v) => (v === 'black' ? null : 'black'))
          return
        case 'w':
          setBlank((v) => (v === 'white' ? null : 'white'))
          return
        case 'p':
          setRunning((v) => !v)
          return
        case 'F11':
          e.preventDefault()
          toggleFullscreen()
          return
        default:
          if (/^[0-9]$/.test(e.key)) {
            // PowerPoint behaviour: number + Enter jumps to that slide.
            const n = Number(e.key)
            if (n >= 1 && n <= visible.length) setIndex(n - 1)
          }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, onExit, dir, visible.length])

  const wake = useCallback(() => {
    setChromeVisible(true)
    if (hideTimer.current) window.clearTimeout(hideTimer.current)
    hideTimer.current = window.setTimeout(() => setChromeVisible(false), 2600)
  }, [])

  useEffect(() => {
    wake()
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current)
    }
  }, [wake])

  const scale = useMemo(() => {
    if (typeof window === 'undefined') return 1
    return Math.min(window.innerWidth / doc.size.w, window.innerHeight / doc.size.h)
  }, [doc.size.w, doc.size.h])

  if (!slide) return null
  const transition = slide.transition
  const tClass = transition.type === 'none' ? '' : (TRANSITION_CLASS[transition.type] ?? 'kad-t-fade')

  return (
    <div
      ref={rootRef}
      dir={dir}
      className={cn('fixed inset-0 z-50 select-none bg-black', blank === 'white' && 'bg-white')}
      onMouseMove={wake}
      onWheel={(e) => {
        if (Math.abs(e.deltaY) < 12) return
        go(e.deltaY > 0 ? 1 : -1)
      }}
      onClick={(e) => {
        const target = e.target as HTMLElement
        if (target.closest('[data-present-ui]')) return
        go(dir === 'rtl' ? -1 : 1)
      }}
      style={{ cursor: chromeVisible ? 'default' : 'none' }}
    >
      {blank ? <div className={cn('absolute inset-0 z-40', blank === 'black' ? 'bg-black' : 'bg-white')} /> : null}

      <div className="grid h-full w-full place-items-center overflow-hidden">
        <div
          key={slide.id}
          className={cn('relative origin-center', tClass)}
          style={{
            width: doc.size.w,
            height: doc.size.h,
            transform: `scale(${scale})`,
            animationDuration: `${transition.duration ?? 400}ms`,
          }}
        >
          <SlideView slide={slide} doc={doc} mode="present" static animRegistry={registerAnim} style={{ width: doc.size.w, height: doc.size.h, borderRadius: 0 }} />
        </div>
      </div>

      {chromeVisible && !blank ? (
        <>
          <div data-present-ui className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/70 to-transparent p-3">
            <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/10 bg-black/55 p-1 backdrop-blur-md">
              <button type="button" onClick={() => go(-1)} className="grid size-8 place-items-center rounded-full text-white/80 hover:bg-white/12" title="السابق">
                {dir === 'rtl' ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
              </button>
              <span className="min-w-[62px] text-center font-mono text-[11.5px] text-white/80">
                {index + 1} / {visible.length}
              </span>
              <button type="button" onClick={() => go(1)} className="grid size-8 place-items-center rounded-full text-white/80 hover:bg-white/12" title="التالي">
                {dir === 'rtl' ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
              </button>
            </div>
            <div data-present-ui className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/10 bg-black/55 px-1 py-1 font-mono text-[11.5px] text-white/80 backdrop-blur-md">
              <button type="button" onClick={() => setRunning((v) => !v)} className="grid size-7 place-items-center rounded-full hover:bg-white/12" title="إيقاف/تشغيل المؤقت (P)">
                {running ? <Square size={12} /> : <Play size={12} />}
              </button>
              <span className="px-1 tabular-nums">{fmt(elapsed)}</span>
              <button type="button" onClick={() => setShowNotes((v) => !v)} className={cn('grid size-7 place-items-center rounded-full hover:bg-white/12', showNotes && 'bg-white/15 text-white')} title="ملاحظات المتحدث (N)">
                <FileText size={12} />
              </button>
              <button type="button" onClick={() => setBlank('black')} className="grid size-7 place-items-center rounded-full hover:bg-white/12" title="تعتيم (B)">
                <Moon size={12} />
              </button>
              <button type="button" onClick={toggleFullscreen} className="grid size-7 place-items-center rounded-full hover:bg-white/12" title="ملء الشاشة (F11)">
                <Minimize2 size={12} />
              </button>
              <button type="button" onClick={onExit} className="ms-0.5 rounded-full bg-white/12 px-2.5 py-1 text-[11.5px] text-white hover:bg-white/20" title="خروج (Esc)">
                خروج
              </button>
            </div>
          </div>
          {index === 0 ? (
            <p className="pointer-events-none absolute inset-x-0 top-3 text-center text-[11px] text-white/45">
              ← → أو المسافة للتنقل · N للملاحظات · B للتعتيم · Esc للخروج
            </p>
          ) : null}
        </>
      ) : null}

      {showNotes ? (
        <div data-present-ui dir={dir} className="absolute inset-x-0 bottom-14 mx-auto max-w-3xl px-4">
          <div className="rounded-xl border border-white/10 bg-[#0b0b0d]/92 p-4 text-[13.5px] leading-[1.9] whitespace-pre-wrap text-white/85 shadow-2xl backdrop-blur-xl">
            {slide.notes.trim() ? slide.notes : <span className="text-white/40">لا ملاحظات لهذه الشريحة — أضفها من لوحة الملاحظات في المحرر.</span>}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function toggleFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined)
  else void document.documentElement.requestFullscreen().catch(() => undefined)
}
