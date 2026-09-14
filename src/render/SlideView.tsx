import { memo, useCallback, type CSSProperties } from 'react'
import type { AnyElement, Paint, Presentation, Slide } from '../document/types'
import { backgroundToCss, paintToCss } from '../lib/colors'
import { ElementView, type RenderMode } from './ElementView'

/**
 * Renders one slide at *design scale* (1280×720 logical px). The parent applies zoom as a CSS
 * transform, so zooming never re-lays-out slide content — that is what keeps a 50-slide deck
 * smooth. Frames are real containers here: children are offset into the frame box and clipped.
 */

export interface SlideViewProps {
  slide: Slide
  doc: Presentation
  mode: RenderMode
  editingId?: string | null
  selection?: string[]
  onTextInput?: (id: string, html: string) => void
  onTextCommit?: () => void
  onStartEdit?: (id: string) => void
  onTableText?: (id: string, row: number, col: number, text: string) => void
  onElementPointerDown?: (e: React.PointerEvent, id: string) => void
  style?: CSSProperties
  showHidden?: boolean
  /** Frameless render for thumbnails: skip per-element pointer plumbing entirely. */
  static?: boolean
}

function SlideViewImpl({ slide, doc, mode, editingId, selection, onTextInput, onTextCommit, onStartEdit, onTableText, onElementPointerDown, style, showHidden, static: isStatic }: SlideViewProps) {
  const bg = slide.background
  const backgroundAsset = bg.type === 'image' && bg.image ? doc.assets[bg.image.assetId] : undefined
  const overlay: Paint | undefined = bg.type === 'image' ? bg.image?.overlay : undefined

  const handleText = useCallback((id: string) => (html: string) => onTextInput?.(id, html), [onTextInput])

  const childrenByFrame = new Map<string, AnyElement[]>()
  const roots: AnyElement[] = []
  for (const el of slide.elements) {
    if (el.frameId && slide.elements.some((f) => f.id === el.frameId && f.kind === 'frame')) {
      const list = childrenByFrame.get(el.frameId) ?? []
      list.push(el)
      childrenByFrame.set(el.frameId, list)
    } else roots.push(el)
  }

  const renderEl = (el: AnyElement, index: number) => {
    if (!el.visible && !showHidden) return null
    const kids = el.kind === 'frame' ? (childrenByFrame.get(el.id) ?? []) : null
    return (
      <ElementShell
        key={el.id}
        el={el}
        doc={doc}
        mode={mode}
        index={index}
        editing={editingId === el.id}
        selected={selection?.includes(el.id)}
        onTextInput={handleText(el.id)}
        onTextCommit={onTextCommit}
        onStartEdit={onStartEdit ? () => onStartEdit(el.id) : undefined}
        onTableText={onTableText ? (r: number, c: number, t: string) => onTableText(el.id, r, c, t) : undefined}
        onElementPointerDown={isStatic ? undefined : onElementPointerDown}
      >
        {kids ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              transform: `translate(${-el.x}px, ${-el.y}px)`,
              pointerEvents: mode === 'edit' ? 'auto' : 'none',
            }}
          >
            {kids.map((k, ki) => renderEl(k, index + ki + 1))}
          </div>
        ) : null}
      </ElementShell>
    )
  }

  return (
    <div className="slide-root" data-slide-root data-slide-id={slide.id} style={{ width: doc.size.w, height: doc.size.h, background: backgroundToCss(slide.background), ...style }}>
      {backgroundAsset ? (
        <img
          src={backgroundAsset.src}
          alt=""
          draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: bg.image?.fit ?? 'cover', objectPosition: bg.image?.position ?? 'center', pointerEvents: 'none' }}
        />
      ) : null}
      {overlay ? <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: paintToCss(overlay) }} /> : null}
      {roots.map(renderEl)}
    </div>
  )
}

function ElementShell({
  el,
  doc,
  mode,
  index,
  editing,
  selected,
  onTextInput,
  onTextCommit,
  onStartEdit,
  onTableText,
  onElementPointerDown,
  children,
}: {
  el: AnyElement
  doc: Presentation
  mode: RenderMode
  index: number
  editing: boolean
  selected?: boolean
  onTextInput: (html: string) => void
  onTextCommit?: () => void
  onStartEdit?: () => void
  onTableText?: (r: number, c: number, t: string) => void
  onElementPointerDown?: (e: React.PointerEvent, id: string) => void
  children?: React.ReactNode
}) {
  const asset = el.kind === 'image' ? doc.assets[el.assetId] : el.kind === 'video' ? doc.assets[el.posterAssetId ?? ''] : undefined
  return (
    <div
      data-element-shell={el.id}
      style={{
        position: 'absolute',
        left: el.x,
        top: el.y,
        width: el.w,
        height: el.h,
        transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
        transformOrigin: 'center',
        opacity: el.visible ? undefined : 0.28,
        cursor: mode === 'edit' ? (el.locked ? 'default' : 'move') : undefined,
        pointerEvents: el.kind === 'frame' ? 'none' : undefined,
      }}
      onPointerDown={
        mode === 'edit' && onElementPointerDown
          ? (e) => {
              if (editing) return
              e.stopPropagation()
              onElementPointerDown(e, el.id)
            }
          : undefined
      }
      data-selected={selected || undefined}
    >
      {el.kind === 'frame' ? (
        <>
          <ElementView
            el={el}
            asset={asset}
            mode={mode}
            editing={editing}
            selected={selected}
            order={index}
            onTextInput={onTextInput}
            onTextCommit={onTextCommit}
            onStartEdit={onStartEdit}
            onTableText={onTableText}
            pointerEvents="none"
          />
          {children}
        </>
      ) : (
        <>
          <ElementView
            el={el}
            asset={asset}
            mode={mode}
            editing={editing}
            selected={selected}
            order={index}
            onTextInput={onTextInput}
            onTextCommit={onTextCommit}
            onStartEdit={onStartEdit}
            onTableText={onTableText}
          />
          {children}
        </>
      )}
    </div>
  )
}

export const SlideView = memo(SlideViewImpl, (a, b) => a.slide === b.slide && a.doc === b.doc && a.mode === b.mode && a.editingId === b.editingId && a.selection === b.selection && a.static === b.static && a.onTextInput === b.onTextInput && a.onElementPointerDown === b.onElementPointerDown && styleEq(a.style, b.style))

function styleEq(a?: CSSProperties, b?: CSSProperties) {
  if (a === b) return true
  if (!a || !b) return false
  return JSON.stringify(a) === JSON.stringify(b)
}
