import type { Radii, ShapeId } from './types'

/**
 * Shape geometry library. Every shape is expressed as an SVG path in the element's own
 * box (w × h), which means: one renderer for screen, and a matching preset name for
 * PowerPoint so exported shapes stay *real* editable auto-shapes instead of pictures.
 */

const n = (v: number) => Math.round(v * 100) / 100

function polygon(points: [number, number][]): string {
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${n(x)} ${n(y)}`).join(' ') + ' Z'
}

function starPath(w: number, h: number, points: number, inner: number): string {
  const cx = w / 2
  const cy = h / 2
  const rx = w / 2
  const ry = h / 2
  const out: [number, number][] = []
  for (let i = 0; i < points * 2; i++) {
    const a = (Math.PI / points) * i - Math.PI / 2
    const k = i % 2 === 0 ? 1 : inner
    out.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k])
  }
  return polygon(out)
}

export function roundedRectPath(w: number, h: number, r: Radii | number | undefined): string {
  const radii: Radii = typeof r === 'number' ? [r, r, r, r] : (r ?? [0, 0, 0, 0])
  const max = Math.min(w, h) / 2
  const [tl, tr, br, bl] = radii.map((v) => Math.max(0, Math.min(v ?? 0, max)))
  if (!tl && !tr && !br && !bl) return `M0 0 H${n(w)} V${n(h)} H0 Z`
  return [
    `M${n(tl)} 0`,
    `H${n(w - tr)}`,
    tr ? `A${n(tr)} ${n(tr)} 0 0 1 ${n(w)} ${n(tr)}` : '',
    `V${n(h - br)}`,
    br ? `A${n(br)} ${n(br)} 0 0 1 ${n(w - br)} ${n(h)}` : '',
    `H${n(bl)}`,
    bl ? `A${n(bl)} ${n(bl)} 0 0 1 0 ${n(h - bl)}` : '',
    `V${n(tl)}`,
    tl ? `A${n(tl)} ${n(tl)} 0 0 1 ${n(tl)} 0` : '',
    'Z',
  ]
    .filter(Boolean)
    .join(' ')
}

export interface ShapePath {
  d: string
  /** Shapes that must be drawn as a stroke instead of a fill. */
  strokeOnly?: boolean
}

export function shapePath(shape: ShapeId, w: number, h: number, radius?: Radii | number, adj: Record<string, number> = {}): ShapePath {
  const W = Math.max(1, w)
  const H = Math.max(1, h)
  switch (shape) {
    case 'rect':
      return { d: roundedRectPath(W, H, 0) }
    case 'roundRect':
      return { d: roundedRectPath(W, H, radius ?? adj.radius ?? Math.min(W, H) * 0.12) }
    case 'pill':
      return { d: roundedRectPath(W, H, Math.min(W, H) / 2) }
    case 'circle':
    case 'ellipse': {
      const rx = W / 2
      const ry = H / 2
      return { d: `M${n(rx)} 0 A${n(rx)} ${n(ry)} 0 1 1 ${n(rx)} ${n(H)} A${n(rx)} ${n(ry)} 0 1 1 ${n(rx)} 0 Z` }
    }
    case 'triangle':
      return { d: polygon([[W / 2, 0], [W, H], [0, H]]) }
    case 'rightTriangle':
      return { d: polygon([[0, 0], [W, H], [0, H]]) }
    case 'diamond':
      return { d: polygon([[W / 2, 0], [W, H / 2], [W / 2, H], [0, H / 2]]) }
    case 'pentagon':
      return { d: starPath(W, H, 5, 1) }
    case 'hexagon': {
      const q = W * 0.25
      return { d: polygon([[q, 0], [W - q, 0], [W, H / 2], [W - q, H], [q, H], [0, H / 2]]) }
    }
    case 'octagon': {
      const c = Math.min(W, H) * 0.29
      return {
        d: polygon([[c, 0], [W - c, 0], [W, c], [W, H - c], [W - c, H], [c, H], [0, H - c], [0, c]]),
      }
    }
    case 'star':
      return { d: starPath(W, H, adj.points ?? 5, adj.inner ?? 0.42) }
    case 'parallelogram': {
      const o = Math.min(W, H) * 0.3
      return { d: polygon([[o, 0], [W, 0], [W - o, H], [0, H]]) }
    }
    case 'trapezoid': {
      const o = Math.min(W, H) * 0.25
      return { d: polygon([[o, 0], [W - o, 0], [W, H], [0, H]]) }
    }
    case 'chevron': {
      const o = Math.min(W, H) * 0.5
      return { d: polygon([[0, 0], [W - o, 0], [W, H / 2], [W - o, H], [0, H], [o, H / 2]]) }
    }
    case 'arrowRight':
    case 'arrowLeft':
    case 'arrowUp':
    case 'arrowDown': {
      const shaft = (adj.shaft ?? 0.5) * (shape === 'arrowUp' || shape === 'arrowDown' ? W : H)
      const head = (adj.head ?? 0.55) * (shape === 'arrowUp' || shape === 'arrowDown' ? W : H)
      let pts: [number, number][]
      if (shape === 'arrowRight') {
        const t = (H - shaft) / 2
        pts = [[0, t], [W * 0.62, t], [W * 0.62, (H - head) / 2], [W, H / 2], [W * 0.62, (H + head) / 2], [W * 0.62, H - t], [0, H - t]]
      } else if (shape === 'arrowLeft') {
        const t = (H - shaft) / 2
        pts = [[W, t], [W * 0.38, t], [W * 0.38, (H - head) / 2], [0, H / 2], [W * 0.38, (H + head) / 2], [W * 0.38, H - t], [W, H - t]]
      } else if (shape === 'arrowDown') {
        const t = (W - shaft) / 2
        pts = [[t, 0], [t, H * 0.62], [(W - head) / 2, H * 0.62], [W / 2, H], [(W + head) / 2, H * 0.62], [W - t, H * 0.62], [W - t, 0]]
      } else {
        const t = (W - shaft) / 2
        pts = [[t, H], [t, H * 0.38], [(W - head) / 2, H * 0.38], [W / 2, 0], [(W + head) / 2, H * 0.38], [W - t, H * 0.38], [W - t, H]]
      }
      return { d: polygon(pts) }
    }
    case 'plate':
      return { d: polygon([[0, 0], [W, 0], [W, H * 0.7], [W / 2, H], [0, H * 0.7]]) }
    case 'speech': {
      const r = Math.min(W, H) * 0.16
      const tailH = H * 0.22
      return {
        d: `M${n(r)} 0 H${n(W - r)} A${n(r)} ${n(r)} 0 0 1 ${n(W)} ${n(r)} V${n(H - tailH - r)} A${n(r)} ${n(r)} 0 0 1 ${n(W - r)} ${n(H - tailH)} H${n(W * 0.36)} L${n(W * 0.24)} ${n(H)} L${n(W * 0.26)} ${n(H - tailH)} H${n(r)} A${n(r)} ${n(r)} 0 0 1 0 ${n(H - tailH - r)} V${n(r)} A${n(r)} ${n(r)} 0 0 1 ${n(r)} 0 Z`,
      }
    }
    case 'cloud': {
      const cx = W * 0.32
      const cy = H * 0.62
      return {
        d: `M${n(W * 0.24)} ${n(H * 0.86)} A${n(H * 0.26)} ${n(H * 0.26)} 0 0 1 ${n(W * 0.22)} ${n(H * 0.36)} A${n(H * 0.3)} ${n(H * 0.3)} 0 0 1 ${n(W * 0.52)} ${n(H * 0.2)} A${n(H * 0.28)} ${n(H * 0.28)} 0 0 1 ${n(W * 0.78)} ${n(H * 0.38)} A${n(H * 0.24)} ${n(H * 0.24)} 0 0 1 ${n(W * 0.76)} ${n(H * 0.86)} Z M${n(cx)} ${n(cy)} h0`,
      }
    }
    case 'heart':
      return {
        d: `M${n(W / 2)} ${n(H * 0.94)} C${n(W * 0.06)} ${n(H * 0.6)} ${n(W * 0.06)} ${n(H * 0.16)} ${n(W * 0.32)} ${n(H * 0.14)} C${n(W * 0.44)} ${n(H * 0.13)} ${n(W * 0.5)} ${n(H * 0.24)} ${n(W * 0.5)} ${n(H * 0.3)} C${n(W * 0.5)} ${n(H * 0.24)} ${n(W * 0.56)} ${n(H * 0.13)} ${n(W * 0.68)} ${n(H * 0.14)} C${n(W * 0.94)} ${n(H * 0.16)} ${n(W * 0.94)} ${n(H * 0.6)} ${n(W / 2)} ${n(H * 0.94)} Z`,
      }
    case 'donut': {
      const t = Math.min(W, H) * (0.5 - (adj.thickness ?? 0.28))
      const outer = `M${n(W / 2)} 0 A${n(W / 2)} ${n(H / 2)} 0 1 1 ${n(W / 2 - 0.01)} 0 Z`
      const inner = `M${n(W / 2)} ${n(t)} A${n(W / 2 - t)} ${n(H / 2 - t)} 0 1 0 ${n(W / 2 - 0.01)} ${n(t)} Z`
      return { d: `${outer} ${inner}` }
    }
    case 'semiEllipse':
      return { d: `M0 ${n(H)} A${n(W / 2)} ${n(H)} 0 0 1 ${n(W)} ${n(H)} Z` }
    case 'cross': {
      const t = Math.min(W, H) * 0.3
      return { d: polygon([[W / 2 - t, 0], [W / 2 + t, 0], [W / 2 + t, H / 2 - t], [W, H / 2 - t], [W, H / 2 + t], [W / 2 + t, H / 2 + t], [W / 2 + t, H], [W / 2 - t, H], [W / 2 - t, H / 2 + t], [0, H / 2 + t], [0, H / 2 - t], [W / 2 - t, H / 2 - t]]) }
    }
    case 'lightning':
      return { d: polygon([[W * 0.58, 0], [W * 0.12, H * 0.56], [W * 0.44, H * 0.56], [W * 0.36, H], [W * 0.88, H * 0.4], [W * 0.54, H * 0.4]]) }
    case 'sun': {
      const r = Math.min(W, H) * 0.26
      const cx = W / 2
      const cy = H / 2
      let d = `M${n(cx)} ${n(cy - r)} A${n(r)} ${n(r)} 0 1 1 ${n(cx - 0.01)} ${n(cy - r)} Z`
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI / 4) * i
        const x1 = cx + Math.cos(a) * r * 1.35
        const y1 = cy + Math.sin(a) * r * 1.35
        const x2 = cx + Math.cos(a) * r * 1.85
        const y2 = cy + Math.sin(a) * r * 1.85
        d += ` M${n(x1)} ${n(y1)} L${n(x2)} ${n(y2)}`
      }
      return { d, strokeOnly: false }
    }
    case 'moon': {
      const r = Math.min(W, H) / 2
      return { d: `M${n(W * 0.62)} ${n(H * 0.06)} A${n(r)} ${n(r)} 0 1 0 ${n(W * 0.94)} ${n(H * 0.62)} A${n(r * 0.86)} ${n(r * 0.86)} 0 0 1 ${n(W * 0.62)} ${n(H * 0.06)} Z` }
    }
    case 'blob':
      return {
        d: `M${n(W * 0.5)} ${n(H * 0.02)} C${n(W * 0.78)} 0 ${n(W)} ${n(H * 0.2)} ${n(W * 0.98)} ${n(H * 0.5)} C${n(W * 0.96)} ${n(H * 0.82)} ${n(W * 0.72)} ${n(H)} ${n(W * 0.44)} ${n(H * 0.98)} C${n(W * 0.16)} ${n(H * 0.96)} 0 ${n(H * 0.74)} ${n(W * 0.03)} ${n(H * 0.46)} C${n(W * 0.06)} ${n(H * 0.18)} ${n(W * 0.22)} ${n(H * 0.04)} ${n(W * 0.5)} ${n(H * 0.02)} Z`,
      }
    default:
      return { d: roundedRectPath(W, H, radius ?? 0) }
  }
}

export interface ShapeDef {
  id: ShapeId
  label: string
  group: 'basic' | 'arrows' | 'callouts' | 'organic' | 'lines'
  /** Text label inside the picker preview. */
  short?: string
}

export const SHAPE_LIBRARY: ShapeDef[] = [
  { id: 'rect', label: 'مستطيل', group: 'basic', short: '▭' },
  { id: 'roundRect', label: 'مستطيل دائري', group: 'basic', short: '▢' },
  { id: 'pill', label: 'كبسولة', group: 'basic', short: '⬭' },
  { id: 'circle', label: 'دائرة', group: 'basic', short: '◯' },
  { id: 'ellipse', label: 'قطع ناقص', group: 'basic', short: '⬭' },
  { id: 'triangle', label: 'مثلث', group: 'basic', short: '△' },
  { id: 'rightTriangle', label: 'مثلث قائم', group: 'basic', short: '◺' },
  { id: 'diamond', label: 'معين', group: 'basic', short: '◇' },
  { id: 'pentagon', label: 'خماسي', group: 'basic', short: '⬠' },
  { id: 'hexagon', label: 'سداسي', group: 'basic', short: '⬡' },
  { id: 'octagon', label: 'ثماني', group: 'basic', short: '⯃' },
  { id: 'star', label: 'نجمة', group: 'basic', short: '★' },
  { id: 'parallelogram', label: 'متوازي أضلاع', group: 'basic', short: '▱' },
  { id: 'trapezoid', label: 'شبه منحرف', group: 'basic', short: '⏢' },
  { id: 'arrowRight', label: 'سهم يمين', group: 'arrows', short: '→' },
  { id: 'arrowLeft', label: 'سهم يسار', group: 'arrows', short: '←' },
  { id: 'arrowUp', label: 'سهم أعلى', group: 'arrows', short: '↑' },
  { id: 'arrowDown', label: 'سهم أسفل', group: 'arrows', short: '↓' },
  { id: 'chevron', label: 'إزاحة', group: 'arrows', short: '⟩' },
  { id: 'plate', label: 'لوحة', group: 'callouts', short: '⎔' },
  { id: 'speech', label: 'فقاعة', group: 'callouts', short: '💬' },
  { id: 'donut', label: 'حلقة', group: 'organic', short: '◎' },
  { id: 'semiEllipse', label: 'نصف دائرة', group: 'organic', short: '◠' },
  { id: 'cross', label: 'زائد', group: 'organic', short: '✚' },
  { id: 'cloud', label: 'سحابة', group: 'organic', short: '☁' },
  { id: 'heart', label: 'قلب', group: 'organic', short: '♥' },
  { id: 'lightning', label: 'برق', group: 'organic', short: '⚡' },
  { id: 'sun', label: 'شمس', group: 'organic', short: '☀' },
  { id: 'moon', label: 'قمر', group: 'organic', short: '☾' },
  { id: 'blob', label: 'حقل عضوي', group: 'organic', short: '⬤' },
]

export const SHAPES_BY_GROUP = SHAPE_LIBRARY.reduce<Record<string, ShapeDef[]>>((acc, s) => {
  ;(acc[s.group] ||= []).push(s)
  return acc
}, {})

/**
 * PowerPoint auto-shape names (OOXML `prst`). Mapping our ids to these keeps shapes
 * *editable* after export instead of flattening them to pictures.
 */
export const PPTX_SHAPE_MAP: Partial<Record<ShapeId, string>> = {
  rect: 'rect',
  roundRect: 'roundRect',
  pill: 'roundRect',
  circle: 'ellipse',
  ellipse: 'ellipse',
  triangle: 'triangle',
  rightTriangle: 'rtTriangle',
  diamond: 'diamond',
  pentagon: 'pentagon',
  hexagon: 'hexagon',
  octagon: 'octagon',
  star: 'star5Point',
  parallelogram: 'parallelogram',
  trapezoid: 'trapezoid',
  arrowRight: 'rightArrow',
  arrowLeft: 'leftArrow',
  arrowUp: 'upArrow',
  arrowDown: 'downArrow',
  chevron: 'chevron',
  plate: 'homePlate',
  speech: 'wedgeRectCallout',
  donut: 'donut',
  cross: 'plus',
  cloud: 'cloud',
  heart: 'heart',
  lightning: 'lightningBolt',
  sun: 'sun',
  moon: 'moon',
  blob: 'ellipse',
}

/** pptxtojson `shapType` → our ids (import path). */
export const FROM_PPTX_SHAPE: Record<string, ShapeId> = {
  rect: 'rect',
  round1Rect: 'roundRect',
  round2SameRect: 'roundRect',
  snip1Rect: 'roundRect',
  ellipse: 'ellipse',
  triangle: 'triangle',
  rtTriangle: 'rightTriangle',
  diamond: 'diamond',
  pentagon: 'pentagon',
  hexagon: 'hexagon',
  octagon: 'octagon',
  star5: 'star',
  star5Point: 'star',
  star4Point: 'cross',
  parallelogram: 'parallelogram',
  trapezoid: 'trapezoid',
  rightArrow: 'arrowRight',
  leftArrow: 'arrowLeft',
  upArrow: 'arrowUp',
  downArrow: 'arrowDown',
  chevron: 'chevron',
  homePlate: 'plate',
  wedgeRectCallout: 'speech',
  wedgeRoundRectCallout: 'speech',
  donut: 'donut',
  plus: 'cross',
  cloud: 'cloud',
  heart: 'heart',
  lightningBolt: 'lightning',
  sun: 'sun',
  moon: 'moon',
  chord: 'semiEllipse',
  pie: 'semiEllipse',
  blockArc: 'donut',
}

/** Mask shapes for images — reuse the geometry, no separate renderer. */
export function maskToClipPath(shape: string, inset: number, w: number, h: number): string {
  const iw = Math.max(1, w - inset * 2)
  const ih = Math.max(1, h - inset * 2)
  switch (shape) {
    case 'circle':
      return `circle(${n(Math.min(iw, ih) / 2)} at ${n(w / 2)} ${n(h / 2)})`
    case 'ellipse':
      return `ellipse(${n(iw / 2)} ${n(ih / 2)} at ${n(w / 2)} ${n(h / 2)})`
    case 'triangle':
      return 'polygon(50% 0%, 100% 100%, 0% 100%)'
    case 'diamond':
      return 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
    case 'pentagon':
      return 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)'
    case 'hexagon':
      return 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
    case 'star':
      return 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
    case 'blob':
      return 'polygon(28% 6%, 64% 0%, 92% 24%, 100% 62%, 74% 96%, 34% 100%, 4% 74%, 0% 32%)'
    default:
      return `inset(${n(inset)}px round 0px)`
  }
}
