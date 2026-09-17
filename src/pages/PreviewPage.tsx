/**
 * Read-only deck preview from the library: keyboard/click navigation, notes on demand, and a
 * direct jump into the editor. Route: /preview/:id.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Copy, Pencil, Undo2, X } from 'lucide-react'
import { SlidePreview } from '../components/SlidePreview'
import { SlideView } from '../render/SlideView'
import { ZoomHotspots } from '../editor/zoom/ZoomHotspots'
import { playZoomTransition } from '../animation/zoomPlayer'
import { resolveZoomTarget, slideLabel, type ZoomLink } from '../document/zoom'
import { useLibrary } from '../store/useLibrary'
import { useDoc } from '../store/useDoc'
import { Button } from '../components/ui'
import { requestOpenProject } from '../services/openDeck'
import { cn } from '../lib/cn'
import type { AnyElement, Presentation } from '../document/types'

interface PreviewFlight {
  fromIndex: number
  toIndex: number
  link: ZoomLink
  trigger: { x: number; y: number; w: number; h: number }
  click?: { x: number; y: number }
  direction: 'in' | 'out'
}

export function PreviewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [doc, setDoc] = useState<Presentation | null>(null)
  const [index, setIndex] = useState(0)
  const [notes, setNotes] = useState(false)
  // zoom navigation preview: same flight runtime as PresentMode (index-based; all slides visible here)
  const [flight, setFlight] = useState<PreviewFlight | null>(null)
  const [zoomBack, setZoomBack] = useState<{ index: number; link: ZoomLink }[]>([])
  const stageWrapRef = useRef<HTMLDivElement>(null)
  const fromLayerRef = useRef<HTMLDivElement>(null)
  const toLayerRef = useRef<HTMLDivElement>(null)
  const [stageW, setStageW] = useState(0)

  useLayoutEffect(() => {
    const el = stageWrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setStageW(el.clientWidth))
    ro.observe(el)
    setStageW(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    let alive = true
    if (!id) return
    void useLibrary.getState().openDoc(id).then((loaded) => {
      if (alive) setDoc(loaded)
    })
    return () => {
      alive = false
    }
  }, [id])

  const rtl = doc?.metadata.dir !== 'ltr'
  const slide = useMemo(() => doc?.slides[index], [doc, index])
  const slideScale = doc && stageW > 0 ? stageW / doc.size.w : 0
  const lastBack = zoomBack[zoomBack.length - 1]

  const goLinear = useCallback(
    (i: number) => {
      if (flight) return
      setZoomBack([])
      setIndex(i)
    },
    [flight],
  )

  const goBack = useCallback(() => {
    if (flight || !doc || !lastBack) return
    const to = doc.slides[lastBack.index]
    if (!to) {
      setZoomBack((s) => s.slice(0, -1))
      return
    }
    setFlight({
      fromIndex: index,
      toIndex: lastBack.index,
      link: lastBack.link,
      trigger: { x: 0, y: 0, w: doc.size.w, h: doc.size.h },
      direction: 'out',
    })
    setZoomBack((s) => s.slice(0, -1))
  }, [flight, doc, index, lastBack])

  const activateZoom = useCallback(
    (el: AnyElement, point: { x: number; y: number }) => {
      if (!doc || flight || !el.zoom || !slide) return
      const link = el.zoom
      const targetId = resolveZoomTarget(doc, link.target)
      if (!targetId || targetId === slide.id) return
      const toIndex = doc.slides.findIndex((s) => s.id === targetId)
      if (toIndex < 0) return
      if (link.returnToSource) setZoomBack((s) => [...s, { index, link }])
      else setZoomBack([])
      setFlight({ fromIndex: index, toIndex, link, trigger: { x: el.x, y: el.y, w: el.w, h: el.h }, click: point, direction: 'in' })
    },
    [doc, flight, index, slide],
  )

  // run the zoom flight once both layers mount (same pattern as PresentMode)
  useEffect(() => {
    if (!flight) return
    const fromLayer = fromLayerRef.current
    const toLayer = toLayerRef.current
    if (!doc || !fromLayer || !toLayer) {
      // layers unavailable (e.g. zero width) — commit the jump instantly
      setIndex(flight.toIndex)
      setFlight(null)
      return
    }
    const controller = new AbortController()
    const commit = () => {
      setIndex(flight.toIndex)
      setFlight(null)
    }
    const run = window.setTimeout(() => {
      void playZoomTransition({
        link: flight.link,
        stage: { w: doc.size.w, h: doc.size.h },
        trigger: flight.trigger,
        click: flight.click,
        direction: flight.direction,
        fromLayer,
        toLayer,
        signal: controller.signal,
      }).then(() => commit())
    }, 60)
    return () => {
      controller.abort()
      window.clearTimeout(run)
    }
  }, [flight, doc])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') navigate(-1)
      if (e.key === 'Backspace') {
        e.preventDefault()
        goBack()
        return
      }
      if (e.key === 'ArrowRight') goLinear(Math.max(0, index - 1))
      if (e.key === 'ArrowLeft') goLinear(doc ? Math.min(doc.slides.length - 1, index + 1) : 0)
      if (e.key === 'n') setNotes((v) => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate, doc, index, goLinear, goBack])

  if (!doc) {
    return (
      <div className="grid h-full place-items-center bg-ink-950 text-[13px] text-ink-400">تُحمَّل الشرائح…</div>
    )
  }
  if (!slide) {
    return (
      <div className="grid h-full place-items-center gap-3 bg-ink-950 text-center">
        <p className="text-[13px] text-ink-400">لا شرائح في هذا العرض.</p>
        <Link to="/app" className="text-[13px] text-signal-soft underline">العودة للمكتبة</Link>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-ink-1000">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-ink-800/80 px-3">
        <Link to="/app" className="grid size-8 place-items-center rounded-lg border border-ink-800 text-ink-300 transition-colors hover:bg-ink-900" title="إغلاق">
          <X size={14} />
        </Link>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-ink-50">{doc.metadata.title}</p>
          <p className="text-[11px] text-ink-500">{doc.slides.length} شريحة · معاينة فقط</p>
        </div>
        <div className="ms-auto flex items-center gap-1.5">
          <Button size="sm" variant={notes ? 'surface' : 'ghost'} onClick={() => setNotes((v) => !v)}>
            ملاحظات
          </Button>
          <Button
            size="sm"
            variant="subtle"
            onClick={() => requestOpenProject({ doc })}
            title="يبقي هذا العرض كما هو ويفتح نسخة يمكنك التعديل عليها بحرية"
          >
            <Copy size={12} /> نسخة للتعديل
          </Button>
          <Button size="sm" variant="primary" onClick={() => { useDoc.getState().load(doc, id); navigate(`/edit/${id}`) }} title="تحرير هذا العرض نفسه (الحفظ التلقائي يسري عليه)">
            <Pencil size={12} /> تحرير هذا العرض
          </Button>
        </div>
      </header>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center p-4"
        style={{
          background:
            'radial-gradient(90% 80% at 50% 0%, rgba(79,125,255,0.10) 0%, transparent 55%), radial-gradient(80% 70% at 50% 110%, rgba(139,92,246,0.08) 0%, transparent 60%), #070b16',
        }}
      >
        <button type="button" onClick={() => goLinear(Math.max(0, index - 1))} disabled={index === 0 || !!flight} className="absolute start-3 z-10 grid size-10 place-items-center rounded-full border border-ink-700 bg-ink-900/80 text-ink-100 transition-colors hover:bg-ink-800 disabled:opacity-30" title="السابق">
          {rtl ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        <div ref={stageWrapRef} className="relative w-full max-w-5xl overflow-hidden rounded-xl shadow-float glow-aur">
          {flight && doc.slides[flight.fromIndex] && doc.slides[flight.toIndex] && slideScale > 0 ? (
            <div className="relative w-full" style={{ height: doc.size.h * slideScale }}>
              <div className="absolute left-0 top-0 origin-top-left" style={{ width: doc.size.w, height: doc.size.h, transform: `scale(${slideScale})` }}>
                <div ref={fromLayerRef} className="absolute inset-0">
                  <SlideView slide={doc.slides[flight.fromIndex]} doc={doc} mode="present" static style={{ width: doc.size.w, height: doc.size.h, position: 'absolute', inset: 0 }} />
                </div>
              </div>
              <div className="absolute left-0 top-0 origin-top-left" style={{ width: doc.size.w, height: doc.size.h, transform: `scale(${slideScale})` }}>
                <div ref={toLayerRef} className="absolute inset-0">
                  <SlideView slide={doc.slides[flight.toIndex]} doc={doc} mode="present" static style={{ width: doc.size.w, height: doc.size.h, position: 'absolute', inset: 0 }} />
                </div>
              </div>
            </div>
          ) : (
            <>
              <SlidePreview doc={doc} index={index} className="rounded-xl" />
              {slideScale > 0 ? (
                <ZoomHotspots doc={doc} slide={slide} scale={slideScale} onActivate={activateZoom} />
              ) : null}
            </>
          )}
          {lastBack ? (
            <button
              type="button"
              onClick={goBack}
              className="absolute bottom-3 start-3 z-10 flex items-center gap-1.5 rounded-full border border-ink-700 bg-ink-950/85 px-3 py-1.5 text-[12px] text-ink-100 backdrop-blur transition-colors hover:bg-ink-800"
              title={`عودة بالزوم إلى ${slideLabel(doc, doc.slides[lastBack.index].id)} (Backspace)`}
            >
              <Undo2 size={13} /> عودة بالزوم
            </button>
          ) : null}
        </div>
        <button type="button" onClick={() => goLinear(Math.min(doc.slides.length - 1, index + 1))} disabled={index === doc.slides.length - 1 || !!flight} className="absolute end-3 z-10 grid size-10 place-items-center rounded-full border border-ink-700 bg-ink-900/80 text-ink-100 transition-colors hover:bg-ink-800 disabled:opacity-30" title="التالي">
          {rtl ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      <div className={cn('shrink-0 border-t border-ink-800/80 px-4 transition-[height]', notes ? 'h-36 py-3' : 'h-16')}>
        <div className="mx-auto flex h-full max-w-4xl gap-4">
          <div className="panel-x min-h-0 flex-1 overflow-y-auto">
            {notes ? (
              <p className="whitespace-pre-wrap text-[12.5px] leading-[1.9] text-ink-300">
                {slide.notes.trim() || <span className="text-ink-600">لا ملاحظات لهذه الشريحة.</span>}
              </p>
            ) : (
              <div className="flex h-full items-end gap-1 overflow-x-auto pb-1">
                {doc.slides.map((s, i) => (
                  <button key={s.id} type="button" onClick={() => goLinear(i)} className={cn('w-16 shrink-0 overflow-hidden rounded border transition-colors', i === index ? 'border-signal' : 'border-ink-800 hover:border-ink-600')}>
                    <SlidePreview doc={doc} index={i} />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="hidden w-40 shrink-0 flex-col justify-end gap-1 text-[11px] text-ink-500 sm:flex">
            <span>شريحة {index + 1} من {doc.slides.length}</span>
            <span>{slide.elements.length} عنصر</span>
            <span>← → للتنقل · N للملاحظات</span>
          </div>
        </div>
      </div>
    </div>
  )
}
