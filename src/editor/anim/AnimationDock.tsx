/**
 * The Animation dock — the "Mini After Effects" surface:
 *  - transport (play/pause/restart/loop) + scrubbable ruler
 *  - per-animation track with draggable clips (delay/duration) and keyframe diamonds
 *  - inspector: presets, duration/delay/repeat/yoyo, easing (named / visual bezier / spring),
 *    per-property keyframe table, motion path (user-drawn), text-split animation
 *  - JSON export/import and an in-app performance benchmark
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Braces,
  ChevronDown,
  Gauge,
  Pause,
  Play,
  Plus,
  Repeat,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
  Zap,
} from 'lucide-react'
import { buildSlideEngine, sampleKeyframes, type ElementBaseInfo, type SlideEngine } from '../../animation/engine'
import { EASING_OPTIONS, easingLabel } from '../../animation/easing'
import { presetById, PRESET_GROUPS } from '../../animation/presets'
import { cloneAnim, parseSlideAnims, slideAnimsJson } from '../../animation/serialize'
import type { AnimProp, AnimSpec, EasingSpec, Keyframe } from '../../animation/types'
import { animSpan } from '../../animation/types'
import { cn } from '../../lib/cn'
import { toast, useUI } from '../../store/useUI'
import { useCurrentSlide, useDoc } from '../../store/useDoc'
import { EasingEditor } from './EasingEditor'
import { runPerfTest, type PerfReport } from './perf'
import { animRegistry } from './registry'

const TRACK_COLORS = ['#818cf8', '#f59e0b', '#34d399', '#f472b6', '#38bdf8', '#a78bfa', '#fb7185', '#facc15']
const TRACK_H = 36
const RULER_H = 24

function defaultValueFor(p: AnimProp): number {
  return p === 'scale' ? 1 : p === 'opacity' ? 1 : 0
}

function stepFor(p: AnimProp): number {
  return p === 'scale' || p === 'opacity' ? 0.05 : p === 'rotation' ? 5 : 1
}

const PROP_LABELS: Record<AnimProp, string> = {
  x: 'X (px)',
  y: 'Y (px)',
  scale: 'Scale',
  rotation: 'Rotation (°)',
  opacity: 'Opacity',
  blur: 'Blur (px)',
}

export function AnimationDock() {
  const slide = useCurrentSlide()
  const selection = useDoc((s) => s.selection)
  const selElId = selection[0] ?? null
  const anims = slide?.animations

  const [selAnimId, setSelAnimId] = useState<string | null>(null)
  const [selProp, setSelProp] = useState<AnimProp>('opacity')
  const [pxPerMs, setPxPerMs] = useState(0.3)
  const [playing, setPlaying] = useState(false)
  const [loop, setLoop] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [jsonOpen, setJsonOpen] = useState(false)
  const [loadText, setLoadText] = useState('')
  const [perfOpen, setPerfOpen] = useState(false)
  const [drawing, setDrawing] = useState(false)

  const engineRef = useRef<SlideEngine | null>(null)
  const playheadRef = useRef<HTMLDivElement | null>(null)
  const timeRef = useRef<HTMLSpanElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const lastT = useRef(0)
  const loopRef = useRef(false)
  const pxRef = useRef(pxPerMs)
  loopRef.current = loop
  pxRef.current = pxPerMs

  const animDuration = useMemo(() => {
    let d = 0
    for (const a of anims ?? []) d = Math.max(d, animSpan(a))
    return Math.max(1000, d)
  }, [anims])

  const selAnim = useMemo(() => anims?.find((a) => a.id === selAnimId) ?? null, [anims, selAnimId])
  const targetEl = useMemo(() => (selAnim ? slide?.elements.find((el) => el.id === selAnim.target) : undefined), [selAnim, slide])
  const kfs: Keyframe[] | undefined = selAnim ? selAnim.properties[selProp] : undefined

  /* ------------------------------------------------------------ doc mutation */

  const mutateAnim = (id: string, fn: (a: AnimSpec) => void, label = 'تعديل الحركة') => {
    if (!slide) return
    useDoc.getState().updateSlide(
      slide.id,
      (s) => {
        const a = s.animations?.find((x) => x.id === id)
        if (a) fn(a)
      },
      label,
    )
  }

  const mutateAnims = (fn: (list: AnimSpec[]) => void, label = 'تعديل الحركات') => {
    if (!slide) return
    useDoc.getState().updateSlide(
      slide.id,
      (s) => {
        const list = s.animations ?? (s.animations = [])
        fn(list)
      },
      label,
    )
  }

  /* ------------------------------------------------------------ engine lifecycle */

  useEffect(() => {
    if (!anims?.length) {
      engineRef.current?.destroy()
      engineRef.current = null
      setPlaying(false)
      return
    }
    if (!slide) return
    const targets = animRegistry.all()
    const elements: Record<string, ElementBaseInfo> = {}
    for (const el of slide.elements) elements[el.id] = { x: el.x, y: el.y, w: el.w, h: el.h, rotation: el.rotation ?? 0 }
    const engine = buildSlideEngine({ targets, elements, anims, textSplit: false })
    engineRef.current = engine
    engine.seek(lastT.current)
    movePlayhead(lastT.current)
    const off = engine.onUpdate((t) => {
      if (loopRef.current && t >= engine.duration - 1) {
        engine.seek(0)
        return
      }
      movePlayhead(t)
    })
    setPlaying(false)
    return () => {
      off()
      engine.destroy()
      if (engineRef.current === engine) engineRef.current = null
      setPlaying(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anims, slide?.id])

  function movePlayhead(t: number) {
    if (playheadRef.current) playheadRef.current.style.transform = `translateX(${t * pxRef.current}px)`
    if (timeRef.current) timeRef.current.textContent = `${(t / 1000).toFixed(2)}s`
  }

  /* ------------------------------------------------------------ transport */

  const doPlay = () => {
    const e = engineRef.current
    if (!e) return
    e.play()
    setPlaying(true)
  }
  const doPause = () => {
    engineRef.current?.pause()
    setPlaying(false)
  }
  const doStop = () => {
    lastT.current = 0
    engineRef.current?.stop()
    movePlayhead(0)
    setPlaying(false)
  }
  const doRestart = () => {
    lastT.current = 0
    engineRef.current?.restart()
    setPlaying(true)
  }

  const scrubTo = (clientX: number) => {
    const el = contentRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const scroll = el.parentElement?.scrollLeft ?? 0
    const t = Math.max(0, Math.min(animDuration, (clientX - rect.left + scroll - 0) / pxPerMs))
    lastT.current = t
    engineRef.current?.seek(t)
    movePlayhead(t)
  }

  const onLanePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-clip],[data-kf]')) return
    doPause()
    scrubTo(e.clientX)
    const move = (ev: PointerEvent) => scrubTo(ev.clientX)
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  /* ------------------------------------------------------------ clip drag (delay/duration) */

  const dragClip = (e: React.PointerEvent, anim: AnimSpec, mode: 'delay' | 'duration') => {
    e.stopPropagation()
    e.preventDefault()
    setSelAnimId(anim.id)
    const startX = e.clientX
    const startDelay = anim.delay
    const startDur = anim.duration
    useDoc.getState().beginTransaction()
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / pxPerMs
      if (mode === 'delay') {
        const nd = Math.max(0, Math.round((startDelay + dx) / 25) * 25)
        mutateAnim(anim.id, (a) => {
          a.delay = nd
        }, 'تحريك بداية الحركة')
      } else {
        const nd = Math.max(100, Math.round((startDur + dx) / 25) * 25)
        mutateAnim(anim.id, (a) => {
          a.duration = nd
          for (const list of Object.values(a.properties)) if (list) for (const k of list) if (k.t > nd) k.t = nd
        }, 'تعديل مدة الحركة')
      }
    }
    const up = () => {
      useDoc.getState().endTransaction()
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  /* ------------------------------------------------------------ keyframes */

  const dragKf = (e: React.PointerEvent, anim: AnimSpec, index: number) => {
    e.stopPropagation()
    e.preventDefault()
    const start = anim.properties[selProp]?.[index]
    if (!start) return
    const startX = e.clientX
    const startT = start.t
    useDoc.getState().beginTransaction()
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / pxPerMs
      const nt = Math.max(0, Math.min(anim.duration, Math.round((startT + dx) / 10) * 10))
      mutateAnim(anim.id, (a) => {
        const list = a.properties[selProp]
        if (list?.[index]) list[index].t = nt
      }, 'تحريك Keyframe')
    }
    const up = () => {
      useDoc.getState().endTransaction()
      mutateAnim(anim.id, (a) => {
        const list = a.properties[selProp]
        if (list) list.sort((p, q) => p.t - q.t)
      })
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const addKf = (anim: AnimSpec, localT: number) => {
    const t = Math.max(0, Math.min(anim.duration, Math.round(localT)))
    const list = anim.properties[selProp]
    if (!list?.length) {
      const def = defaultValueFor(selProp)
      mutateAnim(anim.id, (a) => {
        a.properties[selProp] = [{ t: 0, v: def }, { t: Math.max(1, t), v: def }]
      }, 'إضافة Keyframes')
      return
    }
    const v = Math.round(sampleKeyframes(list, t, anim) * 100) / 100
    mutateAnim(anim.id, (a) => {
      const l = a.properties[selProp] ?? (a.properties[selProp] = [])
      l.push({ t, v })
      l.sort((p, q) => p.t - q.t)
    }, 'إضافة Keyframe')
  }

  const deleteKf = (anim: AnimSpec, index: number) => {
    const list = anim.properties[selProp]
    if (!list || list.length <= 2) return
    mutateAnim(anim.id, (a) => {
      a.properties[selProp]?.splice(index, 1)
    }, 'حذف Keyframe')
  }

  const addKfAtPlayhead = () => {
    if (!selAnim) return
    addKf(selAnim, lastT.current - selAnim.delay)
  }

  /* ------------------------------------------------------------ presets & add/remove */

  const addPreset = (presetId: string) => {
    setMenuOpen(false)
    if (!slide?.elements.length) return
    const target = selElId && slide.elements.some((el) => el.id === selElId) ? selElId : slide.elements[0].id
    const el = slide.elements.find((x) => x.id === target)
    const def = presetById(presetId)
    if (!el || !def) return
    const over: Partial<AnimSpec> = {}
    if (def.kind === 'motion') {
      const cx = el.x + el.w / 2
      const cy = el.y + el.h / 2
      over.motionPath =
        presetId === 'path-circle'
          ? { kind: 'circle', radius: 90 }
          : { kind: 'bezier', points: [{ x: cx - 140, y: cy }, { x: cx - 50, y: cy - 70 }, { x: cx + 50, y: cy + 70 }, { x: cx + 140, y: cy }] }
    }
    const spec = def.make(target, over)
    mutateAnims((list) => {
      list.push(spec)
    }, 'إضافة حركة')
    setSelAnimId(spec.id)
    if (spec.properties.opacity?.length) setSelProp('opacity')
  }

  const removeAnim = (id: string) => {
    mutateAnims((list) => {
      const i = list.findIndex((a) => a.id === id)
      if (i >= 0) list.splice(i, 1)
    }, 'حذف الحركة')
    if (selAnimId === id) setSelAnimId(null)
  }

  const duplicateAnim = (a: AnimSpec) => {
    const clone = cloneAnim(a, a.target)
    mutateAnims((list) => {
      list.push(clone)
    }, 'نسخ الحركة')
    setSelAnimId(clone.id)
  }

  /* ------------------------------------------------------------ motion path drawing (canvas events) */

  const startDraw = () => {
    if (!selAnim) return
    setDrawing(true)
    useUI.getState().toast({ kind: 'info', title: 'رسم مسار الحركة', body: 'انقر على اللوحة: 4 نقاط لـ Bezier (أو نقر مزدوج عند نقطتين/ثلاث). Esc للإلغاء.' })
    window.dispatchEvent(new CustomEvent('kadmati:anim-draw', { detail: { animId: selAnim.id } }))
  }

  useEffect(() => {
    const done = (ev: Event) => {
      const d = (ev as CustomEvent).detail as { animId?: string; points?: { x: number; y: number }[] }
      setDrawing(false)
      if (d.animId && d.points && d.points.length >= 2) {
        mutateAnim(d.animId, (a) => {
          a.motionPath = { kind: 'bezier', points: d.points, autoRotate: a.motionPath?.autoRotate ?? false }
        }, 'رسم مسار حركة')
      }
    }
    const cancel = () => setDrawing(false)
    window.addEventListener('kadmati:anim-draw-done', done)
    window.addEventListener('kadmati:anim-draw-cancel', cancel)
    return () => {
      window.removeEventListener('kadmati:anim-draw-done', done)
      window.removeEventListener('kadmati:anim-draw-cancel', cancel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide?.id])

  /* ------------------------------------------------------------ JSON */

  const jsonText = slide ? slideAnimsJson(slide) : '[]'
  const applyJson = () => {
    const res = parseSlideAnims(loadText)
    if (!res.ok) {
      toast({ kind: 'error', title: 'تعذر تحميل JSON', body: res.error })
      return
    }
    mutateAnims(
      (list) => {
        list.length = 0
        list.push(...res.anims)
      },
      'تحميل JSON',
    )
    toast({ kind: 'success', title: `تم تحميل ${res.anims.length} حركة` })
    setJsonOpen(false)
    setLoadText('')
  }

  /* ------------------------------------------------------------ render */

  if (!slide) return null
  const list = anims ?? []
  const laneWidth = (animDuration + 800) * pxPerMs
  const tickStep = pxPerMs >= 0.5 ? 100 : pxPerMs >= 0.18 ? 250 : 500
  const ticks: number[] = []
  for (let t = 0; t <= animDuration; t += tickStep) ticks.push(t)

  return (
    <div className="glass aur-hairline-t flex h-[248px] shrink-0 flex-col border-t border-ink-800/70">
      {/* transport */}
      <div className="flex h-11 shrink-0 items-center gap-1.5 border-b border-ink-800 px-2.5" dir="rtl">
        {/* dock tabs — الأنيميشن هنا؛ البقية ينقلون إلى اللوحة المرتبطة */}
        <div className="me-1 flex shrink-0 items-center gap-0.5 rounded-lg bg-ink-900/70 p-0.5">
          <span className="rounded-md bg-signal/20 px-2.5 py-1 text-[11px] font-semibold text-signal-soft shadow-[inset_0_0_0_1px_rgba(79,125,255,0.35)]">
            الأنيميشن
          </span>
          <button
            type="button"
            onClick={() => useUI.getState().setRightPanel('transition')}
            className="rounded-md px-2.5 py-1 text-[11px] font-medium text-ink-400 transition-colors hover:bg-ink-800 hover:text-ink-100"
          >
            نقل الشرائح
          </button>
          <button
            type="button"
            onClick={() => useUI.getState().setLeftPanel('templates')}
            className="rounded-md px-2.5 py-1 text-[11px] font-medium text-ink-400 transition-colors hover:bg-ink-800 hover:text-ink-100"
          >
            القالب
          </button>
          <button
            type="button"
            onClick={() => useUI.getState().setRightPanel('design')}
            className="rounded-md px-2.5 py-1 text-[11px] font-medium text-ink-400 transition-colors hover:bg-ink-800 hover:text-ink-100"
          >
            الإعدادات
          </button>
        </div>
        <button type="button" onClick={playing ? doPause : doPlay} className="aur-fill glow-blue grid size-8 place-items-center rounded-lg text-white transition-all hover:brightness-110 active:scale-95" title={playing ? 'إيقاف مؤقت' : 'تشغيل'}>
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button type="button" onClick={doRestart} className="grid size-8 place-items-center rounded-lg border border-ink-700 text-ink-300 hover:bg-ink-800" title="إعادة تشغيل">
          <RotateCcw size={13} />
        </button>
        <button type="button" onClick={doStop} className="grid size-8 place-items-center rounded-lg border border-ink-700 text-ink-300 hover:bg-ink-800" title="إيقاف عند البداية">
          <SquareIcon />
        </button>
        <button type="button" onClick={() => setLoop((v) => !v)} className={cn('grid size-8 place-items-center rounded-lg border', loop ? 'border-signal/60 bg-signal-dim text-signal-soft' : 'border-ink-700 text-ink-400 hover:bg-ink-800')} title="تكرار (Loop)">
          <Repeat size={13} />
        </button>
        <span className="ms-1 font-mono text-[11.5px] tabular-nums text-ink-300" dir="ltr">
          <span ref={timeRef}>0.00s</span> / {(animDuration / 1000).toFixed(2)}s
        </span>
        <span className="mx-1 h-5 w-px bg-ink-800" />
        <div className="relative">
          <button
            type="button"
            disabled={!slide.elements.length}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-3 py-1.5 text-[12px] font-semibold text-ink-100 hover:bg-ink-700 disabled:opacity-40"
          >
            <Plus size={13} /> حركة جديدة <ChevronDown size={12} />
          </button>
          {menuOpen ? (
            <div className="absolute start-0 top-9 z-40 max-h-72 w-60 overflow-y-auto rounded-xl border border-ink-700 bg-ink-900 p-1.5 shadow-2xl">
              {PRESET_GROUPS.map((g) => (
                <div key={g.title} className="mb-1">
                  <p className="px-2 py-1 text-[10px] font-bold tracking-wide text-ink-500">{g.title}</p>
                  {g.items.map((p) => (
                    <button key={p.id} type="button" onClick={() => addPreset(p.id)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-start text-[12px] text-ink-200 hover:bg-ink-750">
                      <Sparkles size={11} className="shrink-0 text-signal" />
                      {p.label}
                    </button>
                  ))}
                </div>
              ))}
              {selElId ? (
                <p className="px-2 py-1 text-[10px] text-ink-500">ستُضاف إلى: {slide.elements.find((el) => el.id === selElId)?.name ?? selElId}</p>
              ) : (
                <p className="px-2 py-1 text-[10px] text-warn">سيُنشأ على أول عنصر (حدد عنصرًا لتوجيهها)</p>
              )}
            </div>
          ) : null}
        </div>
        <span className="flex-1" />
        <button type="button" onClick={() => setPxPerMs((z) => Math.max(0.05, z / 1.4))} className="rounded-lg border border-ink-700 px-2 py-1 text-[13px] text-ink-300 hover:bg-ink-800" title="تصغير">
          −
        </button>
        <button type="button" onClick={() => setPxPerMs((z) => Math.min(2, z * 1.4))} className="rounded-lg border border-ink-700 px-2 py-1 text-[13px] text-ink-300 hover:bg-ink-800" title="تكبير">
          +
        </button>
        <span className="mx-1 h-5 w-px bg-ink-800" />
        <button type="button" onClick={() => setJsonOpen(true)} className="flex items-center gap-1.5 rounded-lg border border-ink-700 px-2.5 py-1.5 text-[12px] text-ink-300 hover:bg-ink-800" title="JSON الحركات">
          <Braces size={13} /> JSON
        </button>
        <button type="button" onClick={() => setPerfOpen(true)} className="flex items-center gap-1.5 rounded-lg border border-ink-700 px-2.5 py-1.5 text-[12px] text-ink-300 hover:bg-ink-800" title="اختبار الأداء">
          <Gauge size={13} /> Performance
        </button>
        <button type="button" onClick={() => useUI.getState().setAnimDock(false)} className="grid size-8 place-items-center rounded-lg text-ink-400 hover:bg-ink-800" title="إغلاق شريط الحركة">
          <X size={14} />
        </button>
      </div>

      {/* timeline + inspector */}
      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col" dir="ltr">
          {/* ruler */}
          <div className="flex shrink-0" style={{ height: RULER_H }}>
            <div className="w-[150px] shrink-0 border-b border-e border-ink-800 bg-ink-900/50" />
            <div className="relative flex-1 cursor-ew-resize border-b border-ink-800 bg-ink-900/30" onPointerDown={onLanePointerDown}>
              {ticks.map((t) => (
                <div key={t} className="absolute top-0 h-full" style={{ left: t * pxPerMs }}>
                  <div className="h-2 w-px bg-ink-600" />
                  <span className="ms-1 font-mono text-[9px] text-ink-500">{(t / 1000).toFixed(tickStep < 1000 ? 2 : 1)}s</span>
                </div>
              ))}
            </div>
          </div>
          {/* tracks */}
          <div className="flex min-h-0 flex-1">
            <div className="w-[150px] shrink-0 overflow-hidden border-e border-ink-800 bg-ink-900/50">
              {list.map((a, i) => {
                const el = slide.elements.find((x) => x.id === a.target)
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelAnimId(a.id)}
                    className={cn('flex w-full items-center gap-2 border-b border-ink-800/60 px-2 text-start', selAnimId === a.id && 'bg-ink-800/60')}
                    style={{ height: TRACK_H }}
                  >
                    <span className="size-2 shrink-0 rounded-full" style={{ background: TRACK_COLORS[i % TRACK_COLORS.length] }} />
                    <span className="truncate text-[11px] text-ink-300">{el?.name ?? el?.kind ?? '—'}</span>
                  </button>
                )
              })}
              {!list.length ? <p className="px-3 py-2 text-[11px] text-ink-500" dir="rtl">لا توجد حركات في هذه الشريحة</p> : null}
            </div>
            <div className="relative flex-1 overflow-x-auto overflow-y-hidden">
              <div ref={contentRef} className="relative h-full" style={{ width: laneWidth }} onPointerDown={onLanePointerDown}>
                {list.map((a, i) => {
                  const color = TRACK_COLORS[i % TRACK_COLORS.length]
                  const selected = selAnimId === a.id
                  const pathOn = !!a.motionPath
                  return (
                    <div key={a.id} className="absolute inset-x-0 border-b border-ink-800/60" style={{ top: i * TRACK_H, height: TRACK_H }} onDoubleClick={(e) => { if ((e.target as HTMLElement).closest('[data-clip]')) { const rect = contentRef.current!.getBoundingClientRect(); const t = (e.clientX - rect.left + (contentRef.current!.parentElement?.scrollLeft ?? 0)) / pxPerMs - a.delay; if (t >= 0 && t <= a.duration) addKf(a, t) } }}>
                      <div
                        data-clip
                        className={cn('absolute bottom-1 top-1 cursor-grab rounded-md border active:cursor-grabbing', selected ? 'shadow-lg' : 'opacity-90')}
                        style={{ left: a.delay * pxPerMs, width: Math.max(a.duration * pxPerMs, 10), background: `${color}2e`, borderColor: selected ? color : `${color}66`, boxShadow: selected ? `0 0 0 1px ${color}88` : undefined }}
                        onPointerDown={(e) => dragClip(e, a, 'delay')}
                        onClick={() => setSelAnimId(a.id)}
                      >
                        <span className="pointer-events-none absolute inset-y-0 start-1.5 flex items-center gap-1 truncate px-0.5 font-mono text-[9.5px]" style={{ color }}>
                          {pathOn ? '◈' : ''} {a.name ?? a.kind}
                        </span>
                        <div
                          className="absolute bottom-0 end-0 top-0 w-2 cursor-ew-resize rounded-e-md"
                          style={{ background: selected ? `${color}55` : 'transparent' }}
                          onPointerDown={(e) => dragClip(e, a, 'duration')}
                          title="المدة"
                        />
                      </div>
                      {selected &&
                        kfs?.map((k, ki) => (
                          <div
                            key={ki}
                            data-kf
                            className="absolute top-1/2 z-10 size-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 cursor-ew-resize border border-ink-950 bg-amber-300 hover:scale-125"
                            style={{ left: (a.delay + k.t) * pxPerMs }}
                            onPointerDown={(e) => dragKf(e, a, ki)}
                            onDoubleClick={() => deleteKf(a, ki)}
                            title={`Keyframe: t=${k.t}ms — نقر مزدوج للحذف`}
                          />
                        ))}
                    </div>
                  )
                })}
                {/* playhead */}
                <div ref={playheadRef} className="pointer-events-none absolute bottom-0 top-0 z-20 w-px bg-rose-400" style={{ transform: 'translateX(0px)' }}>
                  <div className="-ms-[5px] size-2.5 rounded-b-sm bg-rose-400" />
                </div>
              </div>
            </div>
          </div>
          {/* property tabs */}
          <div className="flex h-8 shrink-0 items-center gap-1 border-t border-ink-800 px-2" dir="rtl">
            <span className="me-1 text-[10.5px] text-ink-500">الخاصية:</span>
            {(['x', 'y', 'scale', 'rotation', 'opacity', 'blur'] as AnimProp[]).map((p) => (
              <button
                key={p}
                type="button"
                disabled={!!selAnim?.motionPath && (p === 'x' || p === 'y')}
                onClick={() => setSelProp(p)}
                className={cn('rounded-md px-2 py-0.5 text-[11px]', selProp === p ? 'bg-signal-dim text-signal-soft' : 'text-ink-400 hover:bg-ink-800', !!selAnim?.motionPath && (p === 'x' || p === 'y') && 'opacity-40')}
              >
                {PROP_LABELS[p]}
              </button>
            ))}
            {selAnim?.motionPath ? <span className="ms-2 text-[10px] text-warn">المسار يتحكم في X/Y</span> : null}
          </div>
        </div>

        {/* inspector */}
        <div className="w-[290px] shrink-0 overflow-y-auto border-s border-ink-800 bg-ink-900/40 p-3" dir="rtl">
          {!selAnim ? (
            <div className="text-[12px] leading-relaxed text-ink-400">
              <p className="mb-2 font-semibold text-ink-200">مفتش الحركة</p>
              <p>• اختر Clip من الـ Timeline لعرض خصائصه.</p>
              <p>• نقر مزدوج على المسار = إضافة Keyframe عند الخاصية المحددة.</p>
              <p>• اسحب جسم الـ Clip لتغيير التوقيت، وحافته اليمنى لتغيير المدة.</p>
              <p>• «حركة جديدة» تضيف Preset للعنصر المحدد.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              <div className="flex items-center gap-2">
                <input
                  value={selAnim.name ?? ''}
                  onChange={(e) => mutateAnim(selAnim.id, (a) => void (a.name = e.target.value))}
                  className="w-full rounded-md border border-ink-700 bg-ink-950 px-2 py-1 text-[12px] text-ink-100 outline-none focus:border-signal/60"
                  placeholder="اسم الحركة"
                />
                <button type="button" onClick={() => removeAnim(selAnim.id)} className="grid size-7 shrink-0 place-items-center rounded-md border border-ink-700 text-ink-400 hover:bg-signal-dim hover:text-signal-soft" title="حذف">
                  <Trash2 size={13} />
                </button>
                <button type="button" onClick={() => duplicateAnim(selAnim)} className="grid size-7 shrink-0 place-items-center rounded-md border border-ink-700 text-ink-400 hover:bg-ink-750" title="نسخ">
                  <Zap size={13} />
                </button>
              </div>

              {/* re-apply preset */}
              <label className="block">
                <span className="mb-1 block text-[10.5px] text-ink-500">إعادة تطبيق Preset</span>
                <select
                  value=""
                  onChange={(e) => {
                    const def = presetById(e.target.value)
                    if (def) mutateAnim(selAnim.id, (a) => Object.assign(a, def.make(a.target, a)), 'تطبيق Preset')
                  }}
                  className="w-full rounded-md border border-ink-700 bg-ink-950 px-2 py-1 text-[11.5px] text-ink-200 outline-none"
                >
                  <option value="">— اختر —</option>
                  {PRESET_GROUPS.map((g) => (
                    <optgroup key={g.title} label={g.title}>
                      {g.items.map((p) => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>

              {/* timing */}
              <div className="grid grid-cols-2 gap-2">
                <NumField label="المدة (ms)" value={selAnim.duration} step={50} min={100} onChange={(v) => mutateAnim(selAnim.id, (a) => { a.duration = v; for (const list of Object.values(a.properties)) if (list) for (const k of list) if (k.t > v) k.t = v })} />
                <NumField label="التأخير (ms)" value={selAnim.delay} step={50} min={0} onChange={(v) => mutateAnim(selAnim.id, (a) => void (a.delay = v))} />
                <label className="block">
                  <span className="mb-1 block text-[10.5px] text-ink-500">التكرار</span>
                  <select
                    value={String(selAnim.repeat)}
                    onChange={(e) => mutateAnim(selAnim.id, (a) => void (a.repeat = Number(e.target.value)))}
                    className="w-full rounded-md border border-ink-700 bg-ink-950 px-2 py-1 text-[11.5px] text-ink-200 outline-none"
                  >
                    <option value="0">مرة واحدة</option>
                    <option value="1">مرتان</option>
                    <option value="2">ثلاث مرات</option>
                    <option value="-1">∞ (مستمر)</option>
                  </select>
                </label>
                <label className="mt-4 flex items-center gap-2 text-[11.5px] text-ink-300">
                  <input type="checkbox" checked={selAnim.yoyo} onChange={(e) => mutateAnim(selAnim.id, (a) => void (a.yoyo = e.target.checked))} className="accent-signal" />
                  Yoyo (ذهاب/عودة)
                </label>
              </div>

              {/* easing */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[10.5px] text-ink-500">Easing — {easingLabel(selAnim.easing)}</span>
                  <select
                    value={selAnim.easing.type}
                    onChange={(e) => {
                      const type = e.target.value as EasingSpec['type']
                      mutateAnim(selAnim.id, (a) => {
                        a.easing = type === 'bezier' ? { type: 'bezier', bezier: [0.22, 1, 0.36, 1] } : type === 'spring' ? { type: 'spring', stiffness: 170, damping: 16 } : { type: 'named', name: 'cubicOut' }
                      })
                    }}
                    className="rounded-md border border-ink-700 bg-ink-950 px-1.5 py-0.5 text-[10.5px] text-ink-300 outline-none"
                  >
                    <option value="named">Named</option>
                    <option value="bezier">Bezier</option>
                    <option value="spring">Spring</option>
                  </select>
                </div>
                {selAnim.easing.type === 'named' ? (
                  <select
                    value={selAnim.easing.name ?? 'cubicOut'}
                    onChange={(e) => mutateAnim(selAnim.id, (a) => void (a.easing = { type: 'named', name: e.target.value as never }))}
                    className="w-full rounded-md border border-ink-700 bg-ink-950 px-2 py-1 text-[11.5px] text-ink-200 outline-none"
                  >
                    {EASING_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </select>
                ) : null}
                {selAnim.easing.type === 'bezier' ? (
                  <EasingEditor
                    value={selAnim.easing.bezier ?? [0.22, 1, 0.36, 1]}
                    onChange={(b) => mutateAnim(selAnim.id, (a) => void (a.easing = { type: 'bezier', bezier: b }))}
                  />
                ) : null}
                {selAnim.easing.type === 'spring' ? (
                  <div className="space-y-2">
                    <label className="block">
                      <span className="mb-1 flex justify-between text-[10.5px] text-ink-500"><span>Stiffness</span><span>{selAnim.easing.stiffness ?? 170}</span></span>
                      <input type="range" min={30} max={400} value={selAnim.easing.stiffness ?? 170} onChange={(e) => mutateAnim(selAnim.id, (a) => void (a.easing = { ...a.easing, stiffness: Number(e.target.value) }))} className="w-full accent-signal" />
                    </label>
                    <label className="block">
                      <span className="mb-1 flex justify-between text-[10.5px] text-ink-500"><span>Damping</span><span>{selAnim.easing.damping ?? 16}</span></span>
                      <input type="range" min={4} max={40} value={selAnim.easing.damping ?? 16} onChange={(e) => mutateAnim(selAnim.id, (a) => void (a.easing = { ...a.easing, damping: Number(e.target.value) }))} className="w-full accent-signal" />
                    </label>
                  </div>
                ) : null}
              </div>

              {/* keyframes */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[10.5px] text-ink-500">Keyframes — {PROP_LABELS[selProp]}</span>
                  <button type="button" onClick={addKfAtPlayhead} className="flex items-center gap-1 rounded-md border border-ink-700 px-2 py-0.5 text-[10.5px] text-ink-300 hover:bg-ink-750">
                    <Plus size={11} /> عند المؤشر
                  </button>
                </div>
                {kfs?.length ? (
                  <div className="space-y-1">
                    {kfs.map((k, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <input type="number" value={k.t} step={10} min={0} max={selAnim.duration} onChange={(e) => mutateAnim(selAnim.id, (a) => { const l = a.properties[selProp]; if (l?.[i]) l[i].t = clampNum(e, a.duration, 0) })} className="w-[70px] rounded-md border border-ink-700 bg-ink-950 px-1.5 py-0.5 font-mono text-[11px] text-ink-200 outline-none" />
                        <span className="text-[10px] text-ink-500">ms</span>
                        <input type="number" value={k.v} step={stepFor(selProp)} onChange={(e) => mutateAnim(selAnim.id, (a) => { const l = a.properties[selProp]; if (l?.[i]) l[i].v = clampNum(e) })} className="w-[70px] rounded-md border border-ink-700 bg-ink-950 px-1.5 py-0.5 font-mono text-[11px] text-ink-200 outline-none" />
                        <button type="button" disabled={kfs.length <= 2} onClick={() => deleteKf(selAnim, i)} className="text-[11px] text-ink-500 hover:text-signal-soft disabled:opacity-30" title="حذف">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10.5px] text-ink-500">لا keyframes لهذه الخاصية — أضفها من هنا أو بنقر مزدوج على الـ Timeline.</p>
                )}
              </div>

              {/* motion path */}
              <div>
                <label className="flex items-center gap-2 text-[11.5px] text-ink-200">
                  <input
                    type="checkbox"
                    checked={!!selAnim.motionPath}
                    onChange={(e) =>
                      mutateAnim(selAnim.id, (a) => {
                        if (e.target.checked) a.motionPath = { kind: 'bezier', points: undefined, autoRotate: false }
                        else a.motionPath = undefined
                      })
                    }
                    className="accent-signal"
                  />
                  Motion Path (مسار حركة)
                </label>
                {selAnim.motionPath ? (
                  <div className="mt-2 space-y-2">
                    <select
                      value={selAnim.motionPath.kind}
                      onChange={(e) => mutateAnim(selAnim.id, (a) => { if (a.motionPath) a.motionPath = { ...a.motionPath, kind: e.target.value as never } })}
                      className="w-full rounded-md border border-ink-700 bg-ink-950 px-2 py-1 text-[11.5px] text-ink-200 outline-none"
                    >
                      <option value="bezier">Bezier (نقاط)</option>
                      <option value="circle">دائرة</option>
                      <option value="svg">مسار SVG (d)</option>
                    </select>
                    {selAnim.motionPath.kind === 'bezier' ? (
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={startDraw} className={cn('rounded-md px-2.5 py-1 text-[11px] font-semibold', drawing ? 'bg-warn/20 text-warn' : 'bg-ink-750 text-ink-100 hover:bg-ink-700')}>
                          {drawing ? '… جارٍ الرسم' : 'رسم على اللوحة'}
                        </button>
                        <span className="text-[10px] text-ink-500">{selAnim.motionPath.points?.length ?? 0} نقاط</span>
                      </div>
                    ) : null}
                    {selAnim.motionPath.kind === 'circle' ? (
                      <NumField label="نصف القطر (px)" value={selAnim.motionPath.radius ?? 80} step={10} min={8} onChange={(v) => mutateAnim(selAnim.id, (a) => { if (a.motionPath) a.motionPath.radius = v })} />
                    ) : null}
                    {selAnim.motionPath.kind === 'svg' ? (
                      <textarea
                        value={selAnim.motionPath.d ?? ''}
                        onChange={(e) => mutateAnim(selAnim.id, (a) => { if (a.motionPath) a.motionPath.d = e.target.value })}
                        placeholder="M 100 100 C 200 0, 400 200, 500 100"
                        dir="ltr"
                        className="h-16 w-full rounded-md border border-ink-700 bg-ink-950 px-2 py-1 font-mono text-[10.5px] text-ink-200 outline-none"
                      />
                    ) : null}
                    <label className="flex items-center gap-2 text-[11px] text-ink-300">
                      <input
                        type="checkbox"
                        checked={!!selAnim.motionPath.autoRotate}
                        onChange={(e) => mutateAnim(selAnim.id, (a) => { if (a.motionPath) a.motionPath.autoRotate = e.target.checked })}
                        className="accent-signal"
                      />
                      Auto-Rotate (توجيه مع المماس)
                    </label>
                  </div>
                ) : null}
              </div>

              {/* text animation */}
              {targetEl?.kind === 'text' ? (
                <div>
                  <label className="flex items-center gap-2 text-[11.5px] text-ink-200">
                    <input
                      type="checkbox"
                      checked={!!selAnim.text}
                      onChange={(e) =>
                        mutateAnim(selAnim.id, (a) => {
                          if (e.target.checked) a.text = { mode: 'words', stagger: 60, from: 'start' }
                          else a.text = undefined
                        })
                      }
                      className="accent-signal"
                    />
                    Text Animation (تقسيم النص)
                  </label>
                  {selAnim.text ? (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <label className="block">
                        <span className="mb-1 block text-[10.5px] text-ink-500">Animate by</span>
                        <select value={selAnim.text.mode} onChange={(e) => mutateAnim(selAnim.id, (a) => { if (a.text) a.text.mode = e.target.value as never })} className="w-full rounded-md border border-ink-700 bg-ink-950 px-2 py-1 text-[11.5px] text-ink-200 outline-none">
                          <option value="text">النص كاملًا</option>
                          <option value="words">كلمات</option>
                          <option value="chars">حروف</option>
                          <option value="lines">أسطر</option>
                        </select>
                      </label>
                      <NumField label="Stagger (ms)" value={selAnim.text.stagger} step={10} min={0} onChange={(v) => mutateAnim(selAnim.id, (a) => { if (a.text) a.text.stagger = v })} />
                      <label className="block">
                        <span className="mb-1 block text-[10.5px] text-ink-500">من</span>
                        <select value={selAnim.text.from} onChange={(e) => mutateAnim(selAnim.id, (a) => { if (a.text) a.text.from = e.target.value as never })} className="w-full rounded-md border border-ink-700 bg-ink-950 px-2 py-1 text-[11.5px] text-ink-200 outline-none">
                          <option value="start">البداية</option>
                          <option value="center">الوسط</option>
                          <option value="end">النهاية</option>
                        </select>
                      </label>
                    </div>
                  ) : null}
                  <p className="mt-1 text-[10px] text-ink-500">معاينة التقطيع (كلمات/حروف) في وضع العرض — في المحرر تُشغَّل الحركة على العنصر كاملًا.</p>
                </div>
              ) : null}

              <p className="border-t border-ink-800 pt-2 text-[10px] leading-relaxed text-ink-500">
                العنصر المستهدف: <span className="text-ink-300">{targetEl?.name ?? targetEl?.kind ?? 'غير موجود'}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* JSON modal */}
      {jsonOpen ? (
        <Modal title="JSON الحركات — الشريحة الحالية" onClose={() => setJsonOpen(false)}>
          <textarea readOnly value={jsonText} dir="ltr" className="h-52 w-full rounded-lg border border-ink-700 bg-ink-950 p-2.5 font-mono text-[11px] leading-relaxed text-ink-200 outline-none" />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(jsonText)
                toast({ kind: 'success', title: 'نُسخ JSON' })
              }}
              className="rounded-lg bg-ink-750 px-3 py-1.5 text-[12px] text-ink-100 hover:bg-ink-700"
            >
              نسخ
            </button>
          </div>
          <div className="mt-4 border-t border-ink-800 pt-3">
            <h4 className="mb-2 text-[12px] font-semibold text-ink-200">تحميل من JSON (يستبدل حركات الشريحة)</h4>
            <textarea
              value={loadText}
              onChange={(e) => setLoadText(e.target.value)}
              dir="ltr"
              placeholder='[ { "target": "…", "duration": 2000, "properties": { "x": [{"t":0,"v":100},{"t":2000,"v":500}] } } ]'
              className="h-28 w-full rounded-lg border border-ink-700 bg-ink-950 p-2.5 font-mono text-[11px] text-ink-200 outline-none"
            />
            <div className="mt-2 flex justify-end">
              <button type="button" onClick={applyJson} className="aur-fill rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white hover:brightness-110">
                تطبيق
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {/* perf modal */}
      {perfOpen ? <PerfModal onClose={() => setPerfOpen(false)} /> : null}
    </div>
  )
}

/* ================================================================ sub-components */

function clampNum(e: React.ChangeEvent<HTMLInputElement>, max = Number.MAX_SAFE_INTEGER, min = Number.MIN_SAFE_INTEGER): number {
  const v = parseFloat(e.target.value)
  if (!isFinite(v)) return min < 0 ? 0 : 0
  return Math.max(min, Math.min(max, v))
}

function NumField({ label, value, step, min, onChange }: { label: string; value: number; step: number; min: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10.5px] text-ink-500">{label}</span>
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        onChange={(e) => {
          const v = parseFloat(e.target.value)
          if (isFinite(v)) onChange(Math.max(min, v))
        }}
        className="w-full rounded-md border border-ink-700 bg-ink-950 px-2 py-1 font-mono text-[11.5px] text-ink-200 outline-none focus:border-signal/60"
      />
    </label>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/60 p-6" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl border border-ink-700 bg-ink-900 p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[13px] font-bold text-ink-100">{title}</h3>
          <button type="button" onClick={onClose} className="grid size-7 place-items-center rounded-md text-ink-400 hover:bg-ink-750">
            <X size={14} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function SquareIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
      <rect x="1.5" y="1.5" width="9" height="9" rx="1.5" />
    </svg>
  )
}

/* ---------------------------------------------------------------- perf modal */

function PerfModal({ onClose }: { onClose: () => void }) {
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [reports, setReports] = useState<PerfReport[]>([])

  const run = async (slides: number, speed: number) => {
    setRunning(true)
    setProgress(0)
    try {
      const rep = await runPerfTest({ slides, elements: 30, speed, onProgress: (p) => setProgress((p.slide / p.total) * 100) })
      setReports((r) => [rep, ...r].slice(0, 4))
    } catch (err) {
      toast({ kind: 'error', title: 'فشل الاختبار', body: String(err) })
    }
    setRunning(false)
  }

  return (
    <Modal title="اختبار الأداء — 50+ شريحة × 20–50 عنصرًا متحركًا" onClose={onClose}>
      <p className="mb-3 text-[11.5px] leading-relaxed text-ink-400">
        يولّد العرض اصطناعيًا خلف الشاشة (شريحة واحدة حية في DOM في كل لحظة — كما يعمل المحرر)، يشغّل كل حركاته عبر المحرك الحقيقي، ويقيس الـ FPS الفعلي.
      </p>
      <div className="flex items-center gap-2">
        <button type="button" disabled={running} onClick={() => void run(10, 1)} className="rounded-lg border border-ink-700 px-3 py-1.5 text-[12px] text-ink-200 hover:bg-ink-750 disabled:opacity-40">
          سريع: 10 شرائح × 30 عنصرًا
        </button>
        <button type="button" disabled={running} onClick={() => void run(50, 0.4)} className="aur-fill rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white hover:brightness-110 disabled:opacity-40">
          كامل: 50 شريحة × 30 عنصرًا
        </button>
        {running ? <span className="text-[11px] text-ink-400">جارٍ التشغيل… {Math.round(progress)}%</span> : null}
      </div>
      {running ? (
        <div className="mt-3 h-1.5 overflow-hidden rounded bg-ink-800">
          <div className="h-full bg-signal transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      ) : null}
      {reports.length ? (
        <div className="mt-4 overflow-hidden rounded-lg border border-ink-800">
          <table className="w-full text-[11px]">
            <thead className="bg-ink-950 text-ink-400">
              <tr>
                <th className="px-2 py-1.5 text-start">الاختبار</th>
                <th className="px-2 py-1.5 text-start">الثواني</th>
                <th className="px-2 py-1.5 text-start">متوسط FPS</th>
                <th className="px-2 py-1.5 text-start">أدنى FPS</th>
                <th className="px-2 py-1.5 text-start">P10</th>
                <th className="px-2 py-1.5 text-start">أطر متساقطة</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r, i) => (
                <tr key={i} className="border-t border-ink-800 text-ink-200">
                  <td className="px-2 py-1.5 font-mono">{r.label}</td>
                  <td className="px-2 py-1.5 font-mono">{r.seconds.toFixed(1)}s</td>
                  <td className={cn('px-2 py-1.5 font-mono', r.avgFps >= 55 ? 'text-emerald-400' : r.avgFps >= 40 ? 'text-warn' : 'text-signal')}>{r.avgFps.toFixed(1)}</td>
                  <td className="px-2 py-1.5 font-mono">{r.minFps.toFixed(0)}</td>
                  <td className="px-2 py-1.5 font-mono">{r.p10Fps.toFixed(0)}</td>
                  <td className="px-2 py-1.5 font-mono">{r.dropped}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <p className="mt-3 text-[10.5px] leading-relaxed text-ink-500">
        الهدف: 60fps (متوسط ≥55). الـ FPS الأدنى/P10 يكشف عن spikes. الاختبار يعتمد على جهازك — الأرقام المرجعية توثَّق في ANIMATION_ARCHITECTURE.md §14.
      </p>
    </Modal>
  )
}
