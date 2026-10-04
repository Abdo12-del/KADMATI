import type { CSSProperties, ReactElement, ReactNode } from 'react'

/**
 * Self-contained rendering adapter shipped inside exported Open Slide projects.
 * Keep this file free of Aurova-relative imports: the exporter includes it verbatim in the ZIP.
 */
const OPEN_SLIDE_WIDTH = 1920
const OPEN_SLIDE_HEIGHT = 1080

type Data = Record<string, any>
type PathHint = { d: string; w: number; h: number; strokeOnly?: boolean }
type RenderHints = {
  paths?: Record<string, PathHint>
  icons?: Record<string, string>
  masks?: Record<string, string>
}
type PageComponent = (() => ReactElement) & {
  displayName?: string
  transition?: Data
}

export function makeAurovaPage(
  doc: Data,
  slide: Data,
  assetMap: Record<string, string>,
  mediaMap: Record<string, string>,
  hints: RenderHints,
): PageComponent {
  const Page = (() => {
    const size = doc.size ?? { w: 1280, h: 720 }
    const sx = OPEN_SLIDE_WIDTH / Math.max(1, Number(size.w) || 1280)
    const sy = OPEN_SLIDE_HEIGHT / Math.max(1, Number(size.h) || 720)
    const elements: Data[] = Array.isArray(slide.elements) ? slide.elements : []
    const frameIds = new Set(elements.filter((el) => el.kind === 'frame').map((el) => el.id))
    const childrenByFrame = new Map<string, Data[]>()
    for (const el of elements) {
      if (!el.frameId || !frameIds.has(el.frameId)) continue
      const children = childrenByFrame.get(el.frameId) ?? []
      children.push(el)
      childrenByFrame.set(el.frameId, children)
    }
    const roots = elements.filter((el) => !el.frameId || !frameIds.has(el.frameId))
    const bg = slide.background ?? { type: 'solid', color: doc.theme?.palette?.background ?? '#ffffff' }
    const bgAsset = bg.type === 'image' && bg.image ? sourceForAsset(bg.image.assetId, doc, assetMap) : ''

    const renderElement = (el: Data, index: number): ReactNode => {
      if (!el || el.visible === false) return null
      const children = el.kind === 'frame' ? childrenByFrame.get(el.id) ?? [] : []
      const style: CSSProperties = {
        position: 'absolute',
        left: finite(el.x) * sx,
        top: finite(el.y) * sy,
        width: Math.max(1, finite(el.w, 1) * sx),
        height: Math.max(1, finite(el.h, 1) * sy),
        zIndex: index + 1,
        opacity: clamp(finite(el.opacity, 1), 0, 1),
        transform: el.rotation ? `rotate(${finite(el.rotation)}deg)` : undefined,
        transformOrigin: 'center',
        mixBlendMode: el.blendMode && el.blendMode !== 'normal' ? el.blendMode : undefined,
        overflow: el.kind === 'frame' ? 'hidden' : undefined,
      }
      const content = (
        <AurovaElement
          doc={doc}
          element={el}
          sx={sx}
          sy={sy}
          assetMap={assetMap}
          mediaMap={mediaMap}
          hints={hints}
        />
      )
      const linked = safeLink(el.link)
      const node = (
        <div
          key={el.id ?? index}
          data-aurova-element-id={String(el.id ?? '')}
          data-aurova-element-name={String(el.name ?? el.kind ?? '')}
          data-aurova-kind={String(el.kind ?? '')}
          style={style}
        >
          {content}
          {children.length ? (
            <div
              style={{
                position: 'absolute',
                left: -finite(el.x) * sx,
                top: -finite(el.y) * sy,
                width: OPEN_SLIDE_WIDTH,
                height: OPEN_SLIDE_HEIGHT,
                overflow: 'hidden',
                pointerEvents: 'none',
              }}
            >
              {children.map((child, childIndex) => renderElement(child, childIndex))}
            </div>
          ) : null}
        </div>
      )
      return linked ? (
        <a
          key={`link-${el.id ?? index}`}
          href={linked}
          target={linked.startsWith('http') ? '_blank' : undefined}
          rel={linked.startsWith('http') ? 'noreferrer' : undefined}
          style={{ ...style, color: 'inherit', textDecoration: 'none' }}
          data-aurova-element-id={String(el.id ?? '')}
          data-aurova-element-name={String(el.name ?? el.kind ?? '')}
          data-aurova-kind={String(el.kind ?? '')}
        >
          {content}
          {children.length ? (
            <div
              style={{
                position: 'absolute',
                left: -finite(el.x) * sx,
                top: -finite(el.y) * sy,
                width: OPEN_SLIDE_WIDTH,
                height: OPEN_SLIDE_HEIGHT,
                overflow: 'hidden',
                pointerEvents: 'none',
              }}
            >
              {children.map((child, childIndex) => renderElement(child, childIndex))}
            </div>
          ) : null}
        </a>
      ) : node
    }

    const background: CSSProperties = {
      position: 'absolute',
      inset: 0,
      width: OPEN_SLIDE_WIDTH,
      height: OPEN_SLIDE_HEIGHT,
      overflow: 'hidden',
      direction: doc.metadata?.dir === 'ltr' ? 'ltr' : 'rtl',
      background: backgroundCss(bg, doc.theme?.palette?.background ?? '#ffffff'),
      color: doc.theme?.palette?.text ?? '#111114',
      fontSynthesis: 'none',
      textRendering: 'geometricPrecision',
    }
    const backgroundImage: CSSProperties = bgAsset
      ? {
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: bg.image?.fit === 'fill' ? 'fill' : bg.image?.fit ?? 'cover',
          objectPosition: bg.image?.position ?? 'center',
          pointerEvents: 'none',
        }
      : {}
    const overlay = bg.type === 'image' && bg.image?.overlay ? paintCss(bg.image.overlay) : undefined

    return (
      <main
        data-aurova-slide-id={String(slide.id ?? '')}
        dir={doc.metadata?.dir === 'ltr' ? 'ltr' : 'rtl'}
        style={background}
      >
        {bgAsset ? <img src={bgAsset} alt="" draggable={false} style={backgroundImage} /> : null}
        {overlay ? <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: overlay, pointerEvents: 'none' }} /> : null}
        {roots.map((el, index) => renderElement(el, index))}
      </main>
    )
  }) as PageComponent

  Page.displayName = `AurovaSlide_${String(slide.id ?? 'page').replace(/[^a-zA-Z0-9_$]/g, '_')}`
  const transition = toOpenSlideTransition(slide.transition)
  if (transition) Page.transition = transition
  return Page
}

function AurovaElement({
  doc,
  element,
  sx,
  sy,
  assetMap,
  mediaMap,
  hints,
}: {
  doc: Data
  element: Data
  sx: number
  sy: number
  assetMap: Record<string, string>
  mediaMap: Record<string, string>
  hints: RenderHints
}): ReactElement | null {
  const el = element
  switch (el.kind) {
    case 'text':
      return <RichText html={el.content} font={el.font} sx={sx} sy={sy} />
    case 'shape':
      return <ShapeView element={el} sx={sx} sy={sy} hints={hints} />
    case 'image': {
      const src = sourceForAsset(el.assetId, doc, assetMap)
      const filters = imageFilters(el.filters)
      const crop = el.crop
      const imgStyle: CSSProperties = {
        position: 'absolute',
        width: crop?.w > 0 ? `${100 / crop.w}%` : '100%',
        height: crop?.h > 0 ? `${100 / crop.h}%` : '100%',
        left: crop?.w > 0 ? `${(-crop.x / crop.w) * 100}%` : 0,
        top: crop?.h > 0 ? `${(-crop.y / crop.h) * 100}%` : 0,
        objectFit: el.fit === 'fill' ? 'fill' : el.fit ?? 'cover',
        filter: filters || undefined,
        clipPath: hints.masks?.[el.id],
      }
      const radius = radiusCss(el.radius, sx, sy)
      const border = strokeCss(el.stroke, sx)
      return src ? (
        <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', borderRadius: radius, border }}>
          <img src={src} alt={el.name ?? ''} draggable={false} style={imgStyle} />
        </div>
      ) : <MissingMedia label="صورة غير متاحة" />
    }
    case 'line':
      return <LineView element={el} sx={sx} sy={sy} />
    case 'icon': {
      const markup = hints.icons?.[el.id]
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'grid',
            placeItems: 'center',
            background: el.background ? paintCss(el.background) : undefined,
            borderRadius: radiusCss(el.radius, sx, sy),
            boxShadow: shadowCss(el.shadow, sx, sy),
          }}
          dangerouslySetInnerHTML={markup ? { __html: markup } : undefined}
        >
          {!markup ? <span aria-label={el.icon}>{el.icon}</span> : null}
        </div>
      )
    }
    case 'svg':
      return (
        <div
          style={{ width: '100%', height: '100%', filter: shadowFilter(el.shadow, sx, sy) }}
          dangerouslySetInnerHTML={{ __html: el.markup ?? '' }}
        />
      )
    case 'table':
      return <TableView element={el} sx={sx} sy={sy} />
    case 'chart':
      return <ChartView element={el} />
    case 'video': {
      const src = mediaMap[el.id] ?? (String(el.src ?? '').startsWith('asset://') ? '' : String(el.src ?? ''))
      const poster = sourceForAsset(el.posterAssetId, doc, assetMap)
      return src ? (
        <video
          src={src}
          poster={poster || undefined}
          controls={!el.autoplay}
          autoPlay={!!el.autoplay}
          muted={!!el.muted}
          loop={!!el.loop}
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: radiusCss(el.radius, sx, sy), background: '#090b10' }}
        />
      ) : <MissingMedia label="فيديو غير متاح" />
    }
    case 'frame':
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: paintCss(el.background),
            border: strokeCss(el.stroke, sx),
            borderRadius: radiusCss(el.radius, sx, sy),
            boxShadow: shadowCss(el.shadow, sx, sy),
          }}
        />
      )
    default:
      return null
  }
}

function RichText({ html, font, sx, sy }: { html: string; font: Data; sx: number; sy: number }): ReactElement {
  const style: CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: font?.vAlign === 'start' ? 'flex-start' : font?.vAlign === 'end' ? 'flex-end' : 'center',
    overflow: 'hidden',
    fontFamily: fontFamily(font?.fontFamily),
    fontSize: Math.max(1, finite(font?.fontSize, 24) * sy),
    fontWeight: font?.bold ? 700 : 400,
    fontStyle: font?.italic ? 'italic' : 'normal',
    textDecoration: [font?.underline ? 'underline' : '', font?.strike ? 'line-through' : ''].filter(Boolean).join(' ') || undefined,
    color: font?.color ?? '#111114',
    textAlign: textAlign(font?.align, font?.dir),
    direction: font?.dir === 'ltr' ? 'ltr' : 'rtl',
    lineHeight: finite(font?.lineHeight, 1.4),
    letterSpacing: font?.letterSpacing ? finite(font.letterSpacing) * sx : undefined,
    textTransform: font?.transform && font.transform !== 'none' ? font.transform : undefined,
    whiteSpace: font?.wrap === false ? 'pre' : 'pre-wrap',
    overflowWrap: 'break-word',
    wordBreak: 'normal',
  }
  return <div style={style} dangerouslySetInnerHTML={{ __html: String(html ?? '') }} />
}

function ShapeView({ element, sx, sy, hints }: { element: Data; sx: number; sy: number; hints: RenderHints }): ReactElement {
  const el = element
  const hint = hints.paths?.[el.id]
  const path = hint?.d ?? ''
  const viewBox = hint ? `0 0 ${Math.max(1, hint.w)} ${Math.max(1, hint.h)}` : '0 0 100 100'
  const id = svgId(el.id)
  const paint = svgPaint(el.fill, `${id}-fill`)
  const stroke = el.stroke && finite(el.stroke.width) > 0 ? el.stroke : undefined
  const strokeWidth = stroke ? Math.max(0.2, finite(stroke.width) * ((sx + sy) / 2)) : 0
  const padding = Math.max(6, finite(el.h) * 0.08) * sy
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', filter: shadowFilter(el.shadow, sx, sy) }}>
      <svg width="100%" height="100%" viewBox={viewBox} preserveAspectRatio="none" aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        {paint.defs}
        {path ? (
          <path
            d={path}
            fill={hint?.strokeOnly ? 'none' : paint.fill}
            fillRule={el.shape === 'donut' ? 'evenodd' : 'nonzero'}
            stroke={stroke?.color}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray(stroke?.dash, strokeWidth)}
            strokeLinecap={stroke?.cap ?? 'butt'}
            strokeLinejoin="round"
          />
        ) : (
          <rect x="0" y="0" width="100" height="100" fill={paint.fill} stroke={stroke?.color} strokeWidth={strokeWidth} />
        )}
      </svg>
      {el.text !== undefined && el.textStyle ? (
        <div style={{ position: 'absolute', inset: 0, padding, overflow: 'hidden' }}>
          <RichText html={el.text} font={el.textStyle} sx={sx} sy={sy} />
        </div>
      ) : null}
    </div>
  )
}

function LineView({ element, sx, sy }: { element: Data; sx: number; sy: number }): ReactElement {
  const el = element
  const width = Math.max(1, finite(el.w) * sx)
  const height = Math.max(1, finite(el.h) * sy)
  const mid = height / 2
  const curve = finite(el.curvature) * sy
  const d = curve ? `M0 ${mid} Q${width / 2} ${mid - curve * Math.max(0.2, width * 0.16)} ${width} ${mid}` : `M0 ${mid} L${width} ${mid}`
  const stroke = el.stroke ?? { color: '#111114', width: 2, dash: 'solid', cap: 'round' }
  const lineWidth = Math.max(0.5, finite(stroke.width, 2) * ((sx + sy) / 2))
  const markerId = `${svgId(el.id)}-arrow`
  const hasArrow = (el.startArrow && el.startArrow !== 'none') || (el.endArrow && el.endArrow !== 'none')
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
      {hasArrow ? (
        <defs>
          <marker id={markerId} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
            <path d="M0 0 L8 4 L0 8 Z" fill={stroke.color} />
          </marker>
        </defs>
      ) : null}
      <path
        d={d}
        fill="none"
        stroke={stroke.color}
        strokeWidth={lineWidth}
        strokeDasharray={dashArray(stroke.dash, lineWidth)}
        strokeLinecap={stroke.cap ?? 'round'}
        markerStart={el.startArrow && el.startArrow !== 'none' ? `url(#${markerId})` : undefined}
        markerEnd={el.endArrow && el.endArrow !== 'none' ? `url(#${markerId})` : undefined}
      />
    </svg>
  )
}

function TableView({ element, sx, sy }: { element: Data; sx: number; sy: number }): ReactElement {
  const el = element
  const rows: Data[][] = Array.isArray(el.cells) ? el.cells : []
  const cols = Math.max(1, ...rows.map((row) => Array.isArray(row) ? row.length : 0))
  const columns = Array.isArray(el.colWidths) && el.colWidths.length ? el.colWidths : Array.from({ length: cols }, () => 1)
  const rowHeights = Array.isArray(el.rowHeights) && el.rowHeights.length ? el.rowHeights : rows.map(() => 1)
  const font = el.font ?? {}
  return (
    <div style={{ width: '100%', height: '100%', display: 'grid', gridTemplateColumns: columns.map((v: number) => `${Math.max(0.01, finite(v, 1))}fr`).join(' '), gridTemplateRows: rowHeights.map((v: number) => `${Math.max(0.01, finite(v, 1))}fr`).join(' '), border: strokeCss(el.border, sx) }}>
      {rows.flatMap((row, r) => Array.from({ length: cols }, (_, c) => {
        const cell = row?.[c] ?? { text: '' }
        const header = !!el.header && r === 0
        const fill = cell.fill ?? (header ? (el.font?.color ? 'rgba(79,125,255,.18)' : 'rgba(0,0,0,.07)') : el.striped && r % 2 ? 'rgba(0,0,0,.035)' : 'transparent')
        const cellFont = {
          ...font,
          bold: cell.bold ?? header ?? font.bold,
          color: cell.color ?? font.color ?? '#111114',
          align: cell.align ?? font.align ?? 'start',
          vAlign: 'center',
        }
        const style: CSSProperties = {
          minWidth: 0,
          minHeight: 0,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          padding: Math.max(0, finite(el.cellPadding, 6) * ((sx + sy) / 2)),
          background: fill,
          borderInlineStart: c ? `${Math.max(0.3, finite(el.border?.width, 1) * sx)}px solid ${el.border?.color ?? '#d7dce2'}` : undefined,
          borderTop: r ? `${Math.max(0.3, finite(el.border?.width, 1) * sy)}px solid ${el.border?.color ?? '#d7dce2'}` : undefined,
        }
        return (
          <div key={`${r}-${c}`} style={style}>
            <RichText html={escapeHtml(String(cell.text ?? ''))} font={cellFont} sx={sx} sy={sy} />
          </div>
        )
      }))}
    </div>
  )
}

function ChartView({ element }: { element: Data }): ReactElement {
  const el = element
  const width = 1000
  const height = 600
  const left = 82
  const right = 34
  const top = 40
  const bottom = 78
  const chartW = width - left - right
  const chartH = height - top - bottom
  const cats: string[] = Array.isArray(el.categories) ? el.categories : []
  const series: Data[] = Array.isArray(el.series) ? el.series : []
  const colors: string[] = Array.isArray(el.colors) && el.colors.length ? el.colors : ['#3E7CB1', '#E8734A', '#16324F', '#3ECF8E']
  const values = series.flatMap((s) => Array.isArray(s.values) ? s.values.map((v: number) => Math.max(0, finite(v))) : [])
  const max = Math.max(1, ...values)
  const categoryCount = Math.max(1, cats.length)
  const nodes: ReactNode[] = []
  for (let i = 0; i <= 4; i++) {
    const y = top + (chartH * i) / 4
    nodes.push(<line key={`grid-${i}`} x1={left} y1={y} x2={left + chartW} y2={y} stroke="rgba(110,125,145,.22)" />)
  }

  if (el.chart === 'pie' || el.chart === 'donut') {
    const nums: number[] = Array.isArray(series[0]?.values) ? series[0].values.map((v: number) => Math.max(0, finite(v))) : []
    const sum = nums.reduce((a, b) => a + b, 0) || 1
    let angle = -Math.PI / 2
    const cx = width / 2
    const cy = height / 2
    const r = Math.min(width, height) * 0.34
    const inner = el.chart === 'donut' ? r * 0.55 : 0
    nums.forEach((value, i) => {
      const next = angle + (Math.PI * 2 * value) / sum
      nodes.push(<path key={`slice-${i}`} d={arcPath(cx, cy, r, inner, angle, next)} fill={colors[i % colors.length]} stroke="white" strokeWidth="4" />)
      angle = next
    })
  } else if (el.chart === 'line' || el.chart === 'area') {
    series.forEach((s, si) => {
      const vals: number[] = Array.isArray(s.values) ? s.values.map((v: number) => finite(v)) : []
      const points = vals.map((v, i) => [left + (vals.length <= 1 ? chartW / 2 : (i / (vals.length - 1)) * chartW), top + chartH - (Math.max(0, v) / max) * chartH])
      const path = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ')
      if (el.chart === 'area' && points.length) nodes.push(<path key={`area-${si}`} d={`${path} L${points.at(-1)?.[0]} ${top + chartH} L${points[0][0]} ${top + chartH} Z`} fill={colors[si % colors.length]} fillOpacity=".14" />)
      nodes.push(<path key={`line-${si}`} d={path} fill="none" stroke={s.color ?? colors[si % colors.length]} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />)
      points.forEach(([x, y], i) => nodes.push(<circle key={`point-${si}-${i}`} cx={x} cy={y} r="9" fill={s.color ?? colors[si % colors.length]} />))
    })
  } else if (el.chart === 'radar') {
    const count = Math.max(3, categoryCount)
    const cx = width / 2
    const cy = height / 2
    const r = Math.min(chartW, chartH) * 0.38
    for (let ring = 1; ring <= 4; ring++) {
      const points = Array.from({ length: count }, (_, i) => polar(cx, cy, r * ring / 4, -Math.PI / 2 + (i * Math.PI * 2) / count))
      nodes.push(<polygon key={`ring-${ring}`} points={points.map((p) => p.join(',')).join(' ')} fill="none" stroke="rgba(110,125,145,.25)" />)
    }
    series.forEach((s, si) => {
      const vals: number[] = Array.isArray(s.values) ? s.values : []
      const points = Array.from({ length: count }, (_, i) => polar(cx, cy, (Math.max(0, finite(vals[i])) / max) * r, -Math.PI / 2 + (i * Math.PI * 2) / count))
      nodes.push(<polygon key={`radar-${si}`} points={points.map((p) => p.join(',')).join(' ')} fill={colors[si % colors.length]} fillOpacity=".22" stroke={colors[si % colors.length]} strokeWidth="5" />)
    })
  } else if (el.chart === 'scatter') {
    series.forEach((s, si) => {
      const vals: number[] = Array.isArray(s.values) ? s.values : []
      vals.forEach((v, i) => nodes.push(<circle key={`scatter-${si}-${i}`} cx={left + (vals.length <= 1 ? chartW / 2 : (i / (vals.length - 1)) * chartW)} cy={top + chartH - (Math.max(0, finite(v)) / max) * chartH} r="13" fill={s.color ?? colors[si % colors.length]} fillOpacity=".82" />))
    })
  } else {
    const horizontal = el.chart === 'barH'
    const group = chartW / categoryCount
    const item = group * 0.72 / Math.max(1, series.length)
    series.forEach((s, si) => {
      const vals: number[] = Array.isArray(s.values) ? s.values : []
      vals.forEach((v, i) => {
        if (horizontal) {
          const barH = chartH / categoryCount * 0.68 / Math.max(1, series.length)
          const y = top + i * (chartH / categoryCount) + si * barH
          nodes.push(<rect key={`bar-${si}-${i}`} x={left} y={y} width={(Math.max(0, finite(v)) / max) * chartW} height={barH * 0.88} rx="5" fill={s.color ?? colors[si % colors.length]} />)
        } else {
          const x = left + i * group + group * 0.14 + si * item
          const barH = (Math.max(0, finite(v)) / max) * chartH
          nodes.push(<rect key={`bar-${si}-${i}`} x={x} y={top + chartH - barH} width={item * 0.82} height={barH} rx="5" fill={s.color ?? colors[si % colors.length]} />)
        }
      })
    })
  }

  cats.forEach((label, i) => {
    const x = left + (i + 0.5) * (chartW / categoryCount)
    nodes.push(<text key={`label-${i}`} x={x} y={height - 27} textAnchor="middle" fontSize="23" fill="#64748b">{String(label).slice(0, 18)}</text>)
  })
  return <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={el.name ?? 'chart'}>{nodes}</svg>
}

function MissingMedia({ label }: { label: string }): ReactElement {
  return <div style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%', color: '#9aa4b2', background: 'rgba(148,163,184,.08)', fontSize: 18 }}>{label}</div>
}

function backgroundCss(bg: Data, fallback: string): string {
  if (!bg || bg.type === 'none') return fallback
  if (bg.type === 'solid') return bg.color ?? fallback
  if (bg.type === 'gradient' && bg.gradient) return paintCss({ type: 'gradient', ...bg.gradient })
  if (bg.type === 'pattern') return patternCss(bg.pattern ?? 'diagonal', bg.patternColor ?? '#fff', bg.color ?? fallback)
  return bg.color ?? fallback
}

function paintCss(paint: Data): string {
  if (!paint || paint.type === 'none') return 'transparent'
  if (paint.type === 'solid') return paint.color ?? 'transparent'
  if (paint.type === 'pattern') return patternCss(paint.pattern ?? 'diagonal', paint.color ?? '#fff', paint.background ?? 'transparent')
  const stops = (paint.stops ?? []).map((stop: Data) => `${stop.color} ${clamp(finite(stop.pos), 0, 100)}%`).join(', ')
  return paint.kind === 'radial' ? `radial-gradient(circle, ${stops})` : `linear-gradient(${finite(paint.angle, 90)}deg, ${stops})`
}

function patternCss(pattern: string, foreground: string, background: string): string {
  if (pattern === 'dots') return `radial-gradient(${foreground} 1.5px, transparent 1.6px) 0 0 / 14px 14px, ${background}`
  if (pattern === 'grid') return `linear-gradient(${foreground} 1px, transparent 1px) 0 0 / 26px 26px, linear-gradient(90deg, ${foreground} 1px, transparent 1px) 0 0 / 26px 26px, ${background}`
  if (pattern === 'cross') return `repeating-linear-gradient(45deg, ${foreground} 0 1px, transparent 1px 9px), ${background}`
  return `repeating-linear-gradient(135deg, ${foreground} 0 2px, transparent 2px 10px), ${background}`
}

function svgPaint(paint: Data, id: string): { fill: string; defs: ReactNode } {
  if (!paint || paint.type === 'none') return { fill: 'none', defs: null }
  if (paint.type === 'solid') return { fill: paint.color ?? 'none', defs: null }
  if (paint.type === 'pattern') {
    return {
      fill: `url(#${id})`,
      defs: (
        <pattern id={id} width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="12" height="12" fill={paint.background ?? 'transparent'} />
          <path d="M0 0 V12" stroke={paint.color ?? '#000'} strokeWidth="4" />
        </pattern>
      ),
    }
  }
  const stops = (paint.stops ?? []).map((stop: Data, i: number) => (
    <stop key={i} offset={`${clamp(finite(stop.pos), 0, 100)}%`} stopColor={stop.color ?? '#000'} />
  ))
  if (paint.kind === 'radial') {
    return { fill: `url(#${id})`, defs: <radialGradient id={id}>{stops}</radialGradient> }
  }
  const angle = (finite(paint.angle, 90) * Math.PI) / 180
  const x1 = 0.5 - Math.cos(angle) / 2
  const y1 = 0.5 - Math.sin(angle) / 2
  const x2 = 0.5 + Math.cos(angle) / 2
  const y2 = 0.5 + Math.sin(angle) / 2
  return { fill: `url(#${id})`, defs: <linearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2}>{stops}</linearGradient> }
}

function imageFilters(filters: Data): string {
  if (!filters) return ''
  const parts: string[] = []
  if (finite(filters.brightness, 100) !== 100) parts.push(`brightness(${finite(filters.brightness, 100)}%)`)
  if (finite(filters.contrast, 100) !== 100) parts.push(`contrast(${finite(filters.contrast, 100)}%)`)
  if (finite(filters.saturation, 100) !== 100) parts.push(`saturate(${finite(filters.saturation, 100)}%)`)
  if (finite(filters.grayscale)) parts.push(`grayscale(${finite(filters.grayscale)}%)`)
  if (finite(filters.sepia)) parts.push(`sepia(${finite(filters.sepia)}%)`)
  if (finite(filters.hueRotate)) parts.push(`hue-rotate(${finite(filters.hueRotate)}deg)`)
  if (finite(filters.blur)) parts.push(`blur(${finite(filters.blur) * 0.5}px)`)
  return parts.join(' ')
}

function strokeCss(stroke: Data, scale: number): string | undefined {
  if (!stroke || finite(stroke.width) <= 0) return undefined
  const width = Math.max(0.25, finite(stroke.width) * scale)
  const style = stroke.dash === 'dashed' ? 'dashed' : stroke.dash === 'dotted' ? 'dotted' : 'solid'
  return `${width}px ${style} ${stroke.color ?? '#111114'}`
}

function shadowCss(shadow: Data, sx: number, sy: number): string | undefined {
  if (!shadow) return undefined
  return `${finite(shadow.x) * sx}px ${finite(shadow.y) * sy}px ${finite(shadow.blur) * ((sx + sy) / 2)}px ${finite(shadow.spread) * ((sx + sy) / 2)}px ${shadow.color ?? 'rgba(0,0,0,.2)'}`
}

function shadowFilter(shadow: Data, sx: number, sy: number): string | undefined {
  if (!shadow) return undefined
  return `drop-shadow(${finite(shadow.x) * sx}px ${finite(shadow.y) * sy}px ${Math.max(0.5, finite(shadow.blur) * ((sx + sy) / 4))}px ${shadow.color ?? 'rgba(0,0,0,.2)'})`
}

function radiusCss(radius: number[] | undefined, sx: number, sy: number): string | undefined {
  if (!Array.isArray(radius) || !radius.some((v) => finite(v) > 0)) return undefined
  return radius.map((v, i) => `${Math.max(0, finite(v) * (i % 2 ? sx : sy))}px`).join(' ')
}

function dashArray(dash: string | undefined, width: number): string | undefined {
  if (dash === 'dashed') return `${width * 4} ${width * 3}`
  if (dash === 'dotted') return `0.1 ${width * 2.6}`
  return undefined
}

function textAlign(align: string | undefined, dir: string | undefined): CSSProperties['textAlign'] {
  if (align === 'center' || align === 'justify') return align
  if (align === 'end') return dir === 'rtl' ? 'left' : 'right'
  return dir === 'rtl' ? 'right' : 'left'
}

function fontFamily(name: string | undefined): string {
  const families: Record<string, string> = {
    tajawal: "'Tajawal', 'IBM Plex Sans Arabic', system-ui, sans-serif",
    'plex-arabic': "'IBM Plex Sans Arabic', 'Tajawal', system-ui, sans-serif",
    cairo: "'Cairo', 'Tajawal', sans-serif",
    readex: "'Readex Pro', 'Tajawal', sans-serif",
    'noto-kufi': "'Noto Kufi Arabic', 'Tajawal', sans-serif",
    amiri: "'Amiri', 'Traditional Arabic', serif",
    inter: "'Inter', system-ui, sans-serif",
    grotesk: "'Space Grotesk', 'Inter', sans-serif",
    playfair: "'Playfair Display', Georgia, serif",
    lora: "'Lora', Georgia, serif",
    jetbrains: "'JetBrains Mono', ui-monospace, monospace",
  }
  return families[name ?? ''] ?? (name ? `${name}, sans-serif` : 'system-ui, sans-serif')
}

function sourceForAsset(id: string | undefined, doc: Data, assetMap: Record<string, string>): string {
  if (!id) return ''
  return assetMap[id] ?? (String(doc.assets?.[id]?.src ?? '').startsWith('asset://') ? '' : String(doc.assets?.[id]?.src ?? ''))
}

function safeLink(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const probe = value.replace(/[\u0000-\u0020]/g, '').toLowerCase()
  if (!probe || /^(javascript|data|vbscript|file):/.test(probe)) return undefined
  if (/^(https?|mailto|tel):/.test(probe) || probe.startsWith('#') || probe.startsWith('/') || !probe.includes(':')) return value
  return undefined
}

function finite(value: unknown, fallback = 0): number {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function svgId(value: unknown): string {
  return String(value ?? 'item').replace(/[^a-zA-Z0-9_-]/g, '-') || 'item'
}

function polar(cx: number, cy: number, radius: number, angle: number): [number, number] {
  return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]
}

function arcPath(cx: number, cy: number, outer: number, inner: number, start: number, end: number): string {
  const first = polar(cx, cy, outer, start)
  const last = polar(cx, cy, outer, end)
  const large = end - start > Math.PI ? 1 : 0
  if (inner <= 0) return `M${cx} ${cy} L${first[0]} ${first[1]} A${outer} ${outer} 0 ${large} 1 ${last[0]} ${last[1]} Z`
  const innerEnd = polar(cx, cy, inner, end)
  const innerStart = polar(cx, cy, inner, start)
  return `M${first[0]} ${first[1]} A${outer} ${outer} 0 ${large} 1 ${last[0]} ${last[1]} L${innerEnd[0]} ${innerEnd[1]} A${inner} ${inner} 0 ${large} 0 ${innerStart[0]} ${innerStart[1]} Z`
}

function toOpenSlideTransition(transition: Data | undefined): Data | undefined {
  if (!transition || transition.type === 'none') return undefined
  const duration = clamp(finite(transition.duration, 400), 100, 3000)
  const direction = transition.direction ?? 'left'
  if (transition.type === 'morph') {
    return { duration, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', enter: { keyframes: [{ opacity: 0 }, { opacity: 1 }] } }
  }
  if (transition.type === 'fade') {
    return {
      duration,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      enter: { keyframes: [{ opacity: 0 }, { opacity: 1 }] },
      exit: { keyframes: [{ opacity: 1 }, { opacity: 0 }] },
    }
  }
  if (transition.type === 'zoom') {
    return {
      duration,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      enter: { keyframes: [{ opacity: 0, transform: 'scale(.92)' }, { opacity: 1, transform: 'scale(1)' }] },
      exit: { keyframes: [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.04)' }] },
    }
  }
  const horizontal = direction === 'left' || direction === 'right'
  const sign = direction === 'left' || direction === 'up' ? 1 : -1
  const offset = horizontal ? `${sign * 100}%` : `${sign * 100}%`
  const from = horizontal ? `translateX(${offset})` : `translateY(${offset})`
  const to = horizontal ? `translateX(${-sign * 100}%)` : `translateY(${-sign * 100}%)`
  return {
    duration,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    enter: { keyframes: [{ transform: from }, { transform: 'translate(0, 0)' }] },
    exit: { keyframes: [{ transform: 'translate(0, 0)' }, { transform: to }] },
  }
}
