import { memo, useEffect, useMemo, useRef } from 'react'
import type { AssetRef, AnyElement, ChartElement, FrameElement, GradientStop, IconElement, ImageElement, LineElement, Paint, ShapeElement, SvgElement, TableElement, TextElement, TextStyle, VideoElement } from '../document/types'
import { shapePath } from '../document/shapes'
import { iconSvg } from '../lib/iconLibrary'
import { paintToCss, shadowCss, strokeCss, withAlpha } from '../lib/colors'
import { fontStack } from '../lib/fonts'
import { imageStyle } from './elementStyle'
import { TextContent } from './TextContent'
import { ChartView } from './ChartView'

export type RenderMode = 'edit' | 'thumb' | 'present'

export interface ElementViewProps {
  el: AnyElement
  mode: RenderMode
  selected?: boolean
  editing?: boolean
  asset?: AssetRef
  /** Staggered index used for entrance animation ordering in presentation mode. */
  order?: number
  onTextInput?: (html: string) => void
  onTextCommit?: () => void
  onStartEdit?: () => void
  onTableText?: (row: number, col: number, text: string) => void
  pointerEvents?: 'auto' | 'none'
}

/**
 * One renderer, three consumers (editor canvas, thumbnails, presenter). Because all three use
 * this component, a slide can never look different in the gallery than it does while editing.
 */
function ElementViewImpl({ el, mode, editing, asset, order = 0, onTextInput, onTextCommit, onStartEdit, onTableText, pointerEvents }: ElementViewProps) {
  const interactive = mode === 'edit'
  const animate = mode === 'present' && el.animation && el.animation.enter !== 'none'

  const animStyle = useMemo(() => (animate ? animationCss(el.animation!, order) : undefined), [animate, el.animation, order])

  // Position/rotation lives on the SlideView shell so both layers never fight over the transform.
  const style: React.CSSProperties = {
    width: '100%',
    height: '100%',
    opacity: el.opacity,
    mixBlendMode: el.blendMode && el.blendMode !== 'normal' ? (el.blendMode as React.CSSProperties['mixBlendMode']) : undefined,
    ...animStyle,
    pointerEvents: pointerEvents ?? (interactive ? 'auto' : 'none'),
  }

  const inner = () => {
    switch (el.kind) {
      case 'text':
        return <TextBody el={el} editing={!!editing && interactive} onInput={onTextInput} onCommit={onTextCommit} onStart={onStartEdit} mode={mode} />
      case 'image':
        return <ImageBody el={el} asset={asset} />
      case 'shape':
        return <ShapeBody el={el} mode={mode} editing={!!editing && interactive} onInput={onTextInput} onCommit={onTextCommit} onStart={onStartEdit} />
      case 'line':
        return <LineBody el={el} />
      case 'icon':
        return <IconBody el={el} />
      case 'svg':
        return <SvgBody el={el} />
      case 'table':
        return <TableBody el={el} mode={mode} editing={!!editing && interactive} onText={onTableText} />
      case 'chart':
        return <ChartBody el={el} mode={mode} />
      case 'video':
        return <VideoBody el={el} mode={mode} asset={asset} />
      case 'frame':
        return <FrameBody el={el} />
      default:
        return null
    }
  }

  return (
    <div className="el-content" data-element-id={el.id} style={style}>
      {inner()}
    </div>
  )
}

export const ElementView = memo(ElementViewImpl, (a, b) => {
  return (
    a.el === b.el &&
    a.mode === b.mode &&
    a.editing === b.editing &&
    a.selected === b.selected &&
    a.asset === b.asset &&
    a.order === b.order &&
    a.onTextInput === b.onTextInput &&
    a.onTableText === b.onTableText &&
    a.onStartEdit === b.onStartEdit
  )
})
ElementView.displayName = 'ElementView'

/* ------------------------------------------------------------------ text */

function TextBody({ el, editing, onInput, onCommit, onStart, mode }: { el: TextElement; editing: boolean; onInput?: (h: string) => void; onCommit?: () => void; onStart?: () => void; mode: RenderMode }) {
  return (
    <div
      style={{ width: '100%', height: '100%' }}
      onDoubleClick={
        mode === 'edit'
          ? (e) => {
              e.stopPropagation()
              onStart?.()
            }
          : undefined
      }
    >
      <TextContent html={el.content} font={el.font} editing={editing} onInput={onInput} onBlur={onCommit} autoFit={el.font.autoFit === 'shrink'} alignBox={{ w: el.w, h: el.h }} />
    </div>
  )
}

/* ------------------------------------------------------------------ image */

function ImageBody({ el, asset }: { el: ImageElement; asset?: AssetRef }) {
  const style = imageStyle(el)
  const stroke = el.stroke && el.stroke.width ? strokeCss(el.stroke) : undefined
  if (!asset) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: 'repeating-linear-gradient(45deg,#eef0f3 0 10px,#e6e9ee 10px 20px)', borderRadius: (el.radius ?? [0, 0, 0, 0])[0], color: '#8b909a', fontSize: 16 }}>
        <span>صورة مفقودة</span>
      </div>
    )
  }
  return (
    <div style={{ width: '100%', height: '100%', border: stroke, borderRadius: (el.radius ?? [0, 0, 0, 0])[0] ? `${(el.radius ?? [0, 0, 0, 0])[0]}px` : undefined, overflow: el.mask ? 'hidden' : undefined, clipPath: el.mask ? undefined : undefined, boxShadow: el.shadow && !el.mask ? shadowCss(el.shadow) : undefined }}>
      <img src={asset.src} alt={el.name} draggable={false} style={style} />
    </div>
  )
}

/* ------------------------------------------------------------------ shape */

function svgPaint(paint: Paint | undefined, id: string): { fill: string; defs: string } {
  if (!paint || paint.type === 'none') return { fill: 'none', defs: '' }
  if (paint.type === 'solid') return { fill: paint.color, defs: '' }
  const stops = paint.type === 'gradient' ? paint.stops : []
  const stopTags = stops.map((s: GradientStop) => `<stop offset="${s.pos}%" stop-color="${s.color}"/>`).join('')
  if (paint.type === 'pattern') {
    return { fill: `url(#${id}-pat)`, defs: `<pattern id="${id}-pat" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="12" height="12" fill="${paint.background}"/><rect width="6" height="2" y="5" fill="${paint.color}"/></pattern>` }
  }
  const angle = ((paint.angle ?? 90) % 360) * (Math.PI / 180)
  const x1 = 0.5 - Math.cos(angle) / 2
  const y1 = 0.5 - Math.sin(angle) / 2
  const x2 = 0.5 + Math.cos(angle) / 2
  const y2 = 0.5 + Math.sin(angle) / 2
  const grad =
    paint.kind === 'radial'
      ? `<radialGradient id="${id}">${stopTags}</radialGradient>`
      : `<linearGradient id="${id}" x1="${x1.toFixed(3)}" y1="${y1.toFixed(3)}" x2="${x2.toFixed(3)}" y2="${y2.toFixed(3)}">${stopTags}</linearGradient>`
  return { fill: `url(#${id})`, defs: grad }
}

function ShapeBody({ el, mode, editing, onInput, onCommit, onStart }: { el: ShapeElement; mode: RenderMode; editing: boolean; onInput?: (h: string) => void; onCommit?: () => void; onStart?: () => void }) {
  const { d } = shapePath(el.shape, el.w, el.h, el.radius, el.adj)
  const paint = svgPaint(el.fill, `${el.id}-f`)
  const shadow = el.shadow
  const dropFilter = shadow ? `drop-shadow(${shadow.x}px ${shadow.y}px ${Math.max(0.1, shadow.blur / 2)}px ${withAlpha(shadow.color, Math.min(1, 0.85))})` : undefined
  const defsMarkup = paint.defs || null
  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative', filter: dropFilter }}
      onDoubleClick={
        mode === 'edit'
          ? (e) => {
              e.stopPropagation()
              onStart?.()
            }
          : undefined
      }
    >
      <svg width={el.w} height={el.h} viewBox={`0 0 ${el.w} ${el.h}`} style={{ position: 'absolute', inset: 0, overflow: 'visible' }} aria-hidden>
        {defsMarkup ? <defs dangerouslySetInnerHTML={{ __html: defsMarkup }} /> : null}
        <path
          d={d}
          fill={paint.fill}
          fillRule={el.shape === 'donut' ? 'evenodd' : 'nonzero'}
          stroke={el.stroke && el.stroke.width ? el.stroke.color : undefined}
          strokeWidth={el.stroke?.width}
          strokeDasharray={dashOf(el.stroke?.dash, el.stroke?.width)}
          strokeLinecap={el.stroke?.cap ?? 'butt'}
          strokeLinejoin="round"
        />
      </svg>
      {el.text !== undefined && el.textStyle ? (
        <div style={{ position: 'absolute', inset: 0, padding: Math.min(24, Math.max(6, el.h * 0.08)) }}>
          <TextContent html={el.text} font={el.textStyle} editing={editing} onInput={onInput} onBlur={onCommit} />
        </div>
      ) : null}
    </div>
  )
}

function dashOf(dash: string | undefined, width = 1): string | undefined {
  if (dash === 'dashed') return `${width * 4} ${width * 3}`
  if (dash === 'dotted') return `0.1 ${width * 2.6}`
  return undefined
}

/* ------------------------------------------------------------------ line */

function LineBody({ el }: { el: LineElement }) {
  const w = Math.max(1, el.w)
  const h = Math.max(1, el.h)
  const vb = Math.max(h, 24)
  const cy = vb / 2
  const curve = el.curvature
  const d = curve ? `M0 ${cy} Q${w / 2} ${cy - curve * Math.max(24, w * 0.16)} ${w} ${cy}` : `M0 ${cy} L${w} ${cy}`
  const sw = Math.max(1, el.stroke.width)
  const head = (kind: string | undefined, x: number, dir: 1 | -1) => {
    if (!kind || kind === 'none') return null
    const s = sw * (kind === 'oval' ? 2.6 : 4)
    if (kind === 'oval') return <ellipse cx={x} cy={cy} rx={s * 0.5} ry={s * 0.34} fill={el.stroke.color} />
    if (kind === 'diamond') {
      return <path d={`M${x} ${cy - s * 0.42} L${x + dir * s * 0.8} ${cy} L${x} ${cy + s * 0.42} L${x - dir * s * 0.8} ${cy} Z`} fill={el.stroke.color} />
    }
    if (kind === 'triangle') {
      return <path d={`M${x} ${cy} L${x + dir * s} ${cy - s * 0.5} L${x + dir * s} ${cy + s * 0.5} Z`} fill={el.stroke.color} />
    }
    return <path d={`M${x} ${cy} l${dir * s * 0.9} ${-s * 0.45} M${x} ${cy} l${dir * s * 0.9} ${s * 0.45}`} fill="none" stroke={el.stroke.color} strokeWidth={sw * 1.1} strokeLinecap="round" />
  }
  return (
    <svg width={w} height={vb} viewBox={`0 0 ${w} ${vb}`} style={{ position: 'absolute', top: (h - vb) / 2, left: 0, overflow: 'visible' }}>
      <path d={d} fill="none" stroke={el.stroke.color} strokeWidth={sw} strokeDasharray={dashOf(el.stroke.dash, sw)} strokeLinecap={el.stroke.cap ?? 'round'} />
      {head(el.startArrow, 0, 1)}
      {head(el.endArrow, w, -1)}
    </svg>
  )
}

/* ------------------------------------------------------------------ icon */

function IconBody({ el }: { el: IconElement }) {
  const markup = iconSvg(el.icon, { color: el.color, strokeWidth: el.strokeWidth, size: Math.min(el.w, el.h) })
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'grid',
        placeItems: 'center',
        background: el.background ? paintToCss(el.background) : undefined,
        borderRadius: el.radius ? `${el.radius[0]}px` : undefined,
        boxShadow: shadowCss(el.shadow),
      }}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  )
}

/* ------------------------------------------------------------------ svg */

function SvgBody({ el }: { el: SvgElement }) {
  const safe = useMemo(() => sanitizeSvg(el.markup), [el.markup])
  return <div style={{ width: '100%', height: '100%', boxShadow: shadowCss(el.shadow) }} dangerouslySetInnerHTML={{ __html: safe }} />
}

function sanitizeSvg(markup: string): string {
  let out = markup
  if (!/<svg/i.test(out)) out = `<svg viewBox="0 0 100 100" width="100%" height="100%">${out}</svg>`
  out = out.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\son\w+="[^"]*"/gi, '')
  out = out.replace(/<svg([^>]*)>/i, (_m, attrs: string) => `<svg${addIfMissing(attrs, 'preserveAspectRatio', 'xMidYMid meet')} style="width:100%;height:100%">`)
  return out
}

function addIfMissing(attrs: string, name: string, value: string): string {
  return attrs.includes(name) ? attrs : `${attrs} ${name}="${value}"`
}

/* ------------------------------------------------------------------ table */

function TableBody({ el, mode, editing, onText }: { el: TableElement; mode: RenderMode; editing: boolean; onText?: (r: number, c: number, t: string) => void }) {
  const pad = el.cellPadding
  const rows = el.cells.length
  const cols = el.cells[0]?.length ?? 0
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex' }}>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: el.colWidths.map((w) => `${(w * 100).toFixed(3)}fr`).join(' '), gridTemplateRows: el.rowHeights.map((h) => `${(h * 100).toFixed(3)}fr`).join(' '), borderCollapse: 'collapse' }}>
        {Array.from({ length: rows }).flatMap((_, r) =>
          Array.from({ length: cols }).map((_, c) => {
            const cell = el.cells[r]?.[c]
            if (!cell) return <div key={`${r}-${c}`} />
            const isHeader = el.header && r === 0
            const font: TextStyle = { ...el.font, bold: cell.bold ?? isHeader, color: cell.color ?? el.font.color, align: cell.align ?? el.font.align, vAlign: 'center' }
            return (
              <div
                key={`${r}-${c}`}
                style={{
                  padding: pad,
                  background: cell.fill ?? (el.striped && r % 2 === 0 && !isHeader ? 'rgba(0,0,0,0.025)' : undefined),
                  borderTop: r === 0 ? undefined : `${el.border.width}px solid ${el.border.color}`,
                  borderInlineStart: c === 0 ? undefined : `${el.border.width}px solid ${el.border.color}`,
                  fontWeight: font.bold ? 700 : undefined,
                  display: 'flex',
                  alignItems: 'center',
                  minHeight: 0,
                  overflow: 'hidden',
                }}
              >
                <TableCellText key={`cell-${r}-${c}`} text={cell.text} font={font} editing={editing && mode === 'edit'} onCommit={(t) => onText?.(r, c, t)} />
              </div>
            )
          }),
        )}
      </div>
    </div>
  )
}

function TableCellText({ text, font, editing, onCommit }: { text: string; font: TextStyle; editing: boolean; onCommit: (t: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const node = ref.current
    if (node && !editing && node.innerText !== (text ?? '')) node.innerText = text ?? ''
  }, [text, editing])
  return (
    <div
      ref={ref}
      contentEditable={editing || undefined}
      suppressContentEditableWarning
      dir={font.dir}
      style={{ ...textStyleForCell(font), width: '100%' }}
      onBlur={() => {
        if (ref.current && ref.current.innerText !== text) onCommit(ref.current.innerText)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          ;(e.target as HTMLDivElement).blur()
        }
        e.stopPropagation()
      }}
      onMouseDown={(e) => {
        if (!editing) e.stopPropagation()
      }}
    />
  )
}

function textStyleForCell(font: TextStyle): React.CSSProperties {
  return {
    fontFamily: fontStack(font.fontFamily),
    fontSize: font.fontSize,
    fontWeight: font.bold ? 700 : undefined,
    color: font.color,
    textAlign: font.align === 'start' ? (font.dir === 'rtl' ? 'right' : 'left') : font.align === 'end' ? (font.dir === 'rtl' ? 'left' : 'right') : font.align,
    lineHeight: font.lineHeight,
  }
}

/* ------------------------------------------------------------------ chart */

function ChartBody({ el, mode }: { el: ChartElement; mode: RenderMode }) {
  return <ChartView el={el} compact={mode === 'thumb'} />
}

/* ------------------------------------------------------------------ video */

function VideoBody({ el, mode, asset }: { el: VideoElement; mode: RenderMode; asset?: AssetRef }) {
  const poster = asset?.src
  return (
    <div style={{ width: '100%', height: '100%', background: '#0b0b0d', borderRadius: `${el.radius[0]}px`, overflow: 'hidden', position: 'relative', boxShadow: shadowCss(el.shadow) }}>
      {mode === 'present' ? (
        <video src={el.src} poster={poster} autoPlay={el.autoplay} muted={el.muted} loop={el.loop} controls={!el.autoplay} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      ) : (
        <>
          {poster ? <img src={poster} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75 }} /> : null}
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: 999, background: 'rgba(255,255,255,0.9)', display: 'grid', placeItems: 'center' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="#111114">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          <div style={{ position: 'absolute', inset: 'auto 12px 12px auto', fontSize: 12, color: '#fff', background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: 6 }}>فيديو</div>
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ frame */

function FrameBody({ el }: { el: FrameElement }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: paintToCss(el.background),
        border: el.stroke && el.stroke.width ? strokeCss(el.stroke) : undefined,
        borderRadius: `${el.radius[0]}px`,
        boxShadow: shadowCss(el.shadow),
      }}
    />
  )
}

/* ------------------------------------------------------------------ utils */

export function animationCss(anim: NonNullable<AnyElement['animation']>, order: number): React.CSSProperties {
  const delay = (anim.delay ?? 0) + order * 90
  const dur = anim.duration ?? 500
  const dir = anim.direction ?? 'bottom'
  const from = dir === 'left' ? 'translateX(-40px)' : dir === 'right' ? 'translateX(40px)' : dir === 'top' ? 'translateY(-32px)' : 'translateY(32px)'
  const map: Record<string, string> = {
    fade: 'kad-fade',
    appear: 'kad-fade',
    slide: 'kad-slide',
    zoom: 'kad-zoom',
    scale: 'kad-zoom',
  }
  return {
    animation: `${map[anim.enter] ?? 'kad-fade'} ${dur}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms both`,
    ['--kad-from' as string]: from,
  }
}
