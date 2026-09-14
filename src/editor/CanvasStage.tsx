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

  const interaction = useInteraction(slideRef, slide, doc, zoom)

  useEffect(() => {
    const node = slideRef.current?.querySelector<HTMLElement>('[data-slide-root]') ?? slideRef.current
    registerSlideNode(node)
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
    const payload = e.dataTransfer.getData('application/x-kadmati')
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
      style={{ background: 'radial-gradient(120% 120% at 50% 0%, #14141a 0%, #0c0c0e 60%)' }}
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
              />
            ) : null}
            {gridOn ? <div className="grid-overlay pointer-events-none absolute inset-0" style={{ ['--grid-size' as string]: `${doc.settings.gridSize}px` }} /> : null}
            {showMargins ? (
              <div
                className="pointer-events-none absolute border border-dashed border-[rgba(255,90,54,0.28)]"
                style={{ left: m.left, top: m.top, right: m.right, bottom: m.bottom }}
              />
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
