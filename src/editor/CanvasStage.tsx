import { useCallback, useEffect, useRef, useState } from 'react'
import { SelectionOverlay } from './SelectionOverlay'
import { useInteraction } from './useInteraction'
import { SlideView } from '../render/SlideView'
import { useCurrentSlide, useDoc } from '../store/useDoc'
import { registerSlideNode } from '../store/autosave'
import { createAsset, createText } from '../document/factory'
import { fileToDataUrl } from '../store/storage'
import { toast, useUI } from '../store/useUI'
import { importPptxFile } from '../services/importPptx'
import { LAYOUTS } from '../templates/layouts'
import { cn } from '../lib/cn'
import { animRegistry } from './anim/registry'
import { stopPreview } from './anim/preview'
import { cubicToPathD, motionPathDrawD, pointsToCubic } from '../animation/path'
import type { LayoutDef } from '../templates/layouts'

/**
 * The workspace: a zoomed, pannable viewport around one live slide.
 * Zoom is a CSS transform on the design-space slide, so scaling never re-lays-out content while
 * every element keeps exact model coordinates.
 */
export function CanvasStage() {
  const doc = useDoc((s) => s.doc)
  const zoom = useDoc((s) => s.zoom)
  const setZoom = useDoc((s) => s.setZoom)
  const fitZoom = useDoc((s) => s.fitZoom)
  const selection = useDoc((s) => s.selection)
  const editingId = useDoc((s) => s.editingId)
  const tool = useDoc((s) => s.tool)
  const slide = useCurrentSlide()

  const slideRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const dropPoint = useRef<{ x: number; y: number } | null>(null)
  const spacePanning = useRef(false)
  const [dropping, setDropping] = useState(false)
  const [draw, setDraw] = useState<{ animId: string; points: { x: number; y: number }[] } | null>(null)
  const [motionGuides, setMotionGuides] = useState(false)

  // The animation dock asks us to show/hide the motion-path guides overlay.
  useEffect(() => {
    const on = () => setMotionGuides(true)
    const off = () => setMotionGuides(false)
    window.addEventListener('aurova:anim-visible', on)
    window.addEventListener('aurova:anim-hidden', off)
    return () => {
      window.removeEventListener('aurova:anim-visible', on)
      window.removeEventListener('aurova:anim-hidden', off)
    }
  }, [])
  const registerAnim = useCallback((id: string, n: HTMLDivElement | null) => animRegistry.register(id, n), [])

  const interaction = useInteraction(slideRef, slide, doc, zoom)

  useEffect(() => {
    const node = slideRef.current?.querySelector<HTMLElement>('[data-slide-root]') ?? slideRef.current
    registerSlideNode(node)
    stopPreview()
    return () => registerSlideNode(null)
  }, [slide])

  useEffect(() => {
    const measure = () => {
      const el = viewportRef.current
      if (el) fitZoom(el.clientWidth, el.clientHeight)
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (viewportRef.current) ro.observe(viewportRef.current)
    return () => ro.disconnect()
  }, [fitZoom])

  // ⌘/ctrl + wheel zooms at the pointer; plain wheel scrolls the workspace.
  useEffect(() => {
    const node = viewportRef.current
    if (!node) return
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      e.preventDefault()
      setZoom(clamp(zoom * (1 - e.deltaY * 0.0022), 0.08, 4))
    }
    node.addEventListener('wheel', onWheel, { passive: false })
    return () => node.removeEventListener('wheel', onWheel)
  }, [zoom, setZoom])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isTyping(e.target)) spacePanning.current = true
    }
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') spacePanning.current = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  const pointOf = useCallback(
    (client: { clientX: number; clientY: number }) => {
      const rect = slideRef.current?.getBoundingClientRect()
      if (!rect) return { x: 0, y: 0 }
      return { x: (client.clientX - rect.left) / zoom, y: (client.clientY - rect.top) / zoom }
    },
    [zoom],
  )

  /* ------------------------------------------------ motion path drawing (from the animation dock) */
  const cancelDraw = useCallback(() => {
    setDraw(null)
    window.dispatchEvent(new Event('aurova:anim-draw-cancel'))
  }, [])

  useEffect(() => {
    const start = (e: Event) => {
      const d = (e as CustomEvent).detail as { animId?: string }
      if (d?.animId) setDraw({ animId: d.animId, points: [] })
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelDraw()
    }
    window.addEventListener('aurova:anim-draw', start)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('aurova:anim-draw', start)
      window.removeEventListener('keydown', onKey)
    }
  }, [cancelDraw])

  const finishDraw = useCallback(() => {
    setDraw((cur) => {
      if (cur && cur.points.length >= 2) {
        window.dispatchEvent(new CustomEvent('aurova:anim-draw-done', { detail: { animId: cur.animId, points: cur.points } }))
      }
      return null
    })
  }, [])

  const onDrawPointerDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setDraw((cur) => {
        if (!cur) return cur
        const pt = pointOf(e)
        const next = [...cur.points, { x: Math.round(pt.x), y: Math.round(pt.y) }]
        if (next.length >= 4) {
          window.dispatchEvent(new CustomEvent('aurova:anim-draw-done', { detail: { animId: cur.animId, points: next } }))
          return null
        }
        return { ...cur, points: next }
      })
    },
    [pointOf],
  )

  const onTextInput = useCallback(
    (id: string, html: string) => {
      const el = slide?.elements.find((e) => e.id === id)
      if (!el) return
      if (el.kind === 'text') useDoc.getState().updateElementText(id, html)
      else if (el.kind === 'shape') useDoc.getState().updateElement(id, { text: stripTags(html) }, 'نص داخل الشكل')
    },
    [slide],
  )

  const onTableText = useCallback(
    (id: string, row: number, col: number, text: string) => {
      const el = slide?.elements.find((e) => e.id === id)
      if (!el || el.kind !== 'table') return
      const cells = el.cells.map((r, ri) => r.map((c, ci) => (ri === row && ci === col ? { ...c, text } : c)))
      useDoc.getState().updateElement(id, { cells }, 'تحرير الخلية')
    },
    [slide],
  )

  const startEdit = useCallback(
    (id: string) => {
      const el = slide?.elements.find((e) => e.id === id)
      if (!el || el.locked) return
      useDoc.getState().startEditing(id)
    },
    [slide],
  )

  const stopEdit = useCallback(() => useDoc.getState().stopEditing(), [])

  const surfaceDown = (e: React.PointerEvent) => {
    const store = useDoc.getState()
    if (e.button === 1) return
    if (store.tool !== 'select') {
      insertFromTool(store.tool, pointOf(e))
      return
    }
    interaction.onSurfacePointerDown(e)
  }

  const insertFromTool = (t: string, at: { x: number; y: number }) => {
    const store = useDoc.getState()
    if (t === 'text') store.insertText('body')
    else if (t === 'shape') store.insertShape(store.pendingShape, at)
    else if (t === 'icon') store.insertIcon(store.pendingIcon)
    else if (t === 'chart') store.insertChart(store.pendingChart)
    else if (t === 'table') store.insertTable()
    else if (t === 'line') store.insertLine()
    else if (t === 'frame') store.insertFrame()
    store.setTool('select')
  }

  const onDoubleClick = (e: React.MouseEvent) => {
    if (editingId || tool !== 'select') return
    if ((e.target as HTMLElement).closest('[data-element-shell]')) return
    const pt = pointOf(e)
    const el = createText(doc.theme, { role: 'body', x: Math.round(pt.x - 210), y: Math.round(pt.y - 44), w: 420, h: 88, text: '' })
    const id = useDoc.getState().addElement(el)
    useDoc.getState().startEditing(id)
  }

  /* ------------------------------------------------------- drops: files & palette items */

  const ingestFile = async (file: File) => {
    const store = useDoc.getState()
    if (file.type.startsWith('image/')) {
      const media = await fileToDataUrl(file, { maxSide: 2200 })
      const asset = createAsset({ name: file.name, mime: file.type, kind: 'image', src: media.src, w: media.w, h: media.h, bytes: media.bytes })
      store.insertImage(asset)
      const at = dropPoint.current
      const id = useDoc.getState().selection[0]
      if (at && id) {
        const el = slide?.elements.find((e) => e.id === id)
        if (el) store.setGeometry(id, { x: Math.round(at.x - el.w / 2), y: Math.round(at.y - el.h / 2) })
      }
      useUI.getState().toast({ kind: 'success', title: 'أُضيفت الصورة إلى الشريحة' })
      return
    }
    if (file.type.startsWith('video/')) {
      if (file.size > 12_000_000) {
        toast({ kind: 'error', title: 'الملف كبير على التخزين المحلي', body: 'الحد ١٢ ميغابايت في النسخة المحلية. استخدم رابط فيديو بدلًا من الرفع.' })
        return
      }
      const media = await fileToDataUrl(file)
      const asset = createAsset({ name: file.name, mime: file.type, kind: 'video', src: media.src })
      store.addAsset(asset)
      store.insertVideo(asset)
      return
    }
    if (/pptx?$/i.test(file.name) || file.type.includes('presentation')) {
      void importPptxFile(file)
      return
    }
    toast({ kind: 'error', title: 'صيغة غير مدعومة', body: 'اسحب صورًا أو فيديو أو ملف PPTX إلى مساحة العمل.' })
  }

  const applyDropPayload = (data: { kind?: string; shape?: string; icon?: string; id?: string; role?: string; text?: string }, at: { x: number; y: number }) => {
    const store = useDoc.getState()
    switch (data.kind) {
      case 'shape':
        if (data.shape) store.insertShape(data.shape as never, at)
        break
      case 'icon':
        if (data.icon) store.insertIcon(data.icon)
        break
      case 'layout': {
        const layout = LAYOUTS.find((l) => l.id === data.id) as LayoutDef | undefined
        if (layout) store.applyLayout(layout)
        break
      }
      case 'text':
        store.insertText((data.role as never) ?? 'body', data.text)
        break
      case 'asset':
        if (data.id) {
          const asset = doc.assets[data.id]
          if (asset) store.insertImage(asset)
        }
        break
      default:
        break
    }
  }

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDropping(false)
    const at = pointOf(e)
    dropPoint.current = at
    const files = Array.from(e.dataTransfer.files ?? [])
    if (files.length) {
      for (const file of files) await ingestFile(file)
      return
    }
    const payload = e.dataTransfer.getData('application/x-aurova')
    if (!payload) return
    try {
      applyDropPayload(JSON.parse(payload), at)
    } catch {
      /* foreign drag payload — ignore */
    }
  }

  const gridOn = doc.settings.gridVisible
  const showMargins = gridOn && doc.settings.margins.top > 0
  const m = doc.settings.margins

  return (
    <div
      ref={viewportRef}
      className={cn('relative min-h-0 flex-1 overflow-auto', editingId && 'text-editing')}
      style={{
        background:
          'radial-gradient(120% 70% at 50% -8%, rgba(79,125,255,0.13) 0%, transparent 58%), radial-gradient(90% 70% at 50% 112%, rgba(139,92,246,0.10) 0%, transparent 60%), radial-gradient(60% 50% at 85% 100%, rgba(47,212,246,0.05), transparent 70%), #070b16',
      }}
      onPointerDown={surfaceDown}
      onPointerMove={interaction.onPointerMove}
      onPointerUp={interaction.onPointerUp}
      onPointerCancel={interaction.onPointerUp}
      onDragOver={(e) => {
        e.preventDefault()
        dropPoint.current = pointOf(e)
        if (!dropping) setDropping(true)
      }}
      onDragLeave={() => setDropping(false)}
      onDrop={(e) => void onDrop(e)}
      onDoubleClick={onDoubleClick}
    >
      <div className="flex min-h-full min-w-full items-center justify-center p-10">
        <div className={cn('relative', dropping && 'ring-2 ring-signal/70')} style={{ width: doc.size.w * zoom, height: doc.size.h * zoom }}>
          <div
            ref={slideRef}
            className="relative bg-white"
            style={{ width: doc.size.w, height: doc.size.h, transform: `scale(${zoom})`, transformOrigin: 'top left', boxShadow: '0 30px 80px -30px rgba(0,0,0,0.9), 0 2px 0 rgba(255,255,255,0.04)' }}
          >
            {slide ? (
              <SlideView
                slide={slide}
                doc={doc}
                mode="edit"
                selection={selection}
                editingId={editingId}
                onTextInput={onTextInput}
                onTextCommit={stopEdit}
                onStartEdit={startEdit}
                onTableText={onTableText}
                onElementPointerDown={interaction.onElementPointerDown}
                animRegistry={registerAnim}
              />
            ) : null}
            {gridOn ? <div className="grid-overlay pointer-events-none absolute inset-0" style={{ ['--grid-size' as string]: `${doc.settings.gridSize}px` }} /> : null}
            {showMargins ? (
              <div
                className="pointer-events-none absolute border border-dashed border-[rgba(255,90,54,0.28)]"
                style={{ left: m.left, top: m.top, right: m.right, bottom: m.bottom }}
              />
            ) : null}

            {draw ? (
              <svg
                className="absolute inset-0 z-30 cursor-crosshair"
                style={{ width: doc.size.w, height: doc.size.h }}
                viewBox={`0 0 ${doc.size.w} ${doc.size.h}`}
                onPointerDown={onDrawPointerDown}
                onDoubleClick={finishDraw}
              >
                <rect x={0} y={0} width={doc.size.w} height={doc.size.h} fill="transparent" />
                {draw.points.length >= 2 ? (
                  (() => {
                    const [p0, p1, p2, p3] = pointsToCubic(draw.points)
                    return <path d={cubicToPathD(p0, p1, p2, p3)} fill="none" stroke="#34d399" strokeWidth={2.5} opacity={0.85} />
                  })()
                ) : null}
                {draw.points.length >= 2 ? <polyline points={draw.points.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="6 5" opacity={0.6} /> : null}
                {draw.points.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={7} fill="#f59e0b" stroke="#0c0c0e" strokeWidth={2.5} />
                ))}
                <g>
                  <rect x={doc.size.w / 2 - 215} y={12} width={430} height={34} rx={8} fill="rgba(12,12,14,0.85)" />
                  <text x={doc.size.w / 2} y={34} textAnchor="middle" fill="#f5d7a1" fontSize={15}>
                    انقر 2–4 نقاط · نقر مزدوج للإنهاء · Esc للإلغاء
                  </text>
                </g>
              </svg>
            ) : null}

            {/* motion-path guides (shown while the animation studio is open) */}
            {motionGuides && !draw && slide ? (
              <svg className="pointer-events-none absolute inset-0 z-20" style={{ width: doc.size.w, height: doc.size.h }} viewBox={`0 0 ${doc.size.w} ${doc.size.h}`}>
                {slide.animations?.map((a, ai) => {
                  if (!a.motionPath) return null
                  const el = slide.elements.find((x) => x.id === a.target)
                  if (!el) return null
                  const center = { x: el.x + el.w / 2, y: el.y + el.h / 2 }
                  const d = motionPathDrawD(a.motionPath, center)
                  if (!d) return null
                  const color = ['#818cf8', '#f59e0b', '#34d399', '#f472b6', '#38bdf8', '#a78bfa'][ai % 6]
                  return (
                    <g key={a.id}>
                      <path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeDasharray="9 7" opacity={0.75} />
                      <circle cx={center.x} cy={center.y} r={5} fill={color} stroke="#0c0c0e" strokeWidth={2} />
                    </g>
                  )
                })}
              </svg>
            ) : null}
          </div>

          {slide ? (
            <SelectionOverlay
              slide={slide}
              doc={doc}
              selection={selection}
              zoom={zoom}
              guides={interaction.guides}
              badge={interaction.badge}
              marquee={interaction.marquee}
              gesture={interaction.gestureKind}
              onHandleDown={interaction.onHandlePointerDown}
              onRotateDown={interaction.onRotatePointerDown}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ helpers */

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
}
