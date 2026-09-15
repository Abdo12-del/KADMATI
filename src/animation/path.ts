/**
 * Motion path math — pure, DOM-free where possible, deterministic.
 *
 * A path is sampled into N evenly-spaced points; the engine then chains linear
 * micro-tweens over the samples. That makes path following seek-accurate and
 * exportable (no per-frame function evaluation), and gives us the tangent angle
 * for auto-rotate for free.
 */
import type { MotionPathSpec, Pt } from './types'

export interface PathSample {
  x: number
  y: number
  /** tangent angle in degrees (unwrapped, continuous) */
  angle: number
}

export function cubicBezierPoint(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const c = 3 * u * t * t
  const d = t * t * t
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  }
}

function quadraticToCubic(p0: Pt, p1: Pt, p2: Pt): [Pt, Pt, Pt, Pt] {
  const c1 = { x: p0.x + (2 / 3) * (p1.x - p0.x), y: p0.y + (2 / 3) * (p1.y - p0.y) }
  const c2 = { x: p2.x + (2 / 3) * (p1.x - p2.x), y: p2.y + (2 / 3) * (p1.y - p2.y) }
  return [p0, c1, c2, p2]
}

/** Build the 4 control points of a cubic from 2–4 user points (2 = line, 3 = quadratic, 4 = cubic). */
export function pointsToCubic(points: Pt[]): [Pt, Pt, Pt, Pt] {
  if (points.length <= 2) {
    const p0 = points[0] ?? { x: 0, y: 0 }
    const p3 = points[1] ?? { x: 0, y: 0 }
    return [p0, { x: p0.x + (p3.x - p0.x) / 3, y: p0.y + (p3.y - p0.y) / 3 }, { x: p0.x + (2 * (p3.x - p0.x)) / 3, y: p0.y + (2 * (p3.y - p0.y)) / 3 }, p3]
  }
  if (points.length === 3) return quadraticToCubic(points[0], points[1], points[2])
  return [points[0], points[1], points[2], points[3]]
}

/** Sample a cubic bezier at n+1 evenly parameterised points. */
export function sampleCubic(p0: Pt, p1: Pt, p2: Pt, p3: Pt, n: number): Pt[] {
  const pts: Pt[] = []
  for (let i = 0; i <= n; i++) pts.push(cubicBezierPoint(p0, p1, p2, p3, i / n))
  return pts
}

const K = 0.5522847498

/** Sample a full circle (closed loop) around (cx,cy). */
export function sampleCircle(cx: number, cy: number, r: number, n: number): Pt[] {
  // four cubic arcs approximating the circle
  const corners = [
    { x: cx + r, y: cy },
    { x: cx, y: cy - r },
    { x: cx - r, y: cy },
    { x: cx, y: cy + r },
  ]
  const ctrls: [Pt, Pt][] = [
    [{ x: cx + r, y: cy - K * r }, { x: cx + K * r, y: cy - r }],
    [{ x: cx - K * r, y: cy - r }, { x: cx - r, y: cy - K * r }],
    [{ x: cx - r, y: cy + K * r }, { x: cx - K * r, y: cy + r }],
    [{ x: cx + K * r, y: cy + r }, { x: cx + r, y: cy + K * r }],
  ]
  const pts: Pt[] = []
  const per = Math.max(1, Math.floor(n / 4))
  for (let a = 0; a < 4; a++) {
    const seg = sampleCubic(corners[a], ctrls[a][0], ctrls[a][1], corners[(a + 1) % 4], per)
    for (let i = 0; i < seg.length; i++) {
      if (a > 0 || i > 0) pts.push(seg[i])
    }
  }
  return pts
}

/** SVG path data for a cubic through our control points (for canvas drawing). */
export function cubicToPathD(p0: Pt, p1: Pt, p2: Pt, p3: Pt): string {
  return `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`
}

export function circleToPathD(cx: number, cy: number, r: number): string {
  const k = K * r
  return [
    `M ${cx + r} ${cy}`,
    `C ${cx + r} ${cy - k}, ${cx + k} ${cy - r}, ${cx} ${cy - r}`,
    `C ${cx - k} ${cy - r}, ${cx - r} ${cy - k}, ${cx - r} ${cy}`,
    `C ${cx - r} ${cy + k}, ${cx - k} ${cy + r}, ${cx} ${cy + r}`,
    `C ${cx + k} ${cy + r}, ${cx + r} ${cy + k}, ${cx + r} ${cy}`,
  ].join(' ')
}

function withAngles(pts: Pt[]): PathSample[] {
  const out: PathSample[] = []
  let prevAngle: number | null = null
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)]
    const b = pts[Math.min(pts.length - 1, i + 1)]
    let ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
    if (prevAngle !== null) {
      // unwrap: keep the angle continuous (no 179 → -179 jumps)
      while (ang - prevAngle > 180) ang -= 360
      while (ang - prevAngle < -180) ang += 360
    }
    out.push({ x: pts[i].x, y: pts[i].y, angle: ang })
    prevAngle = ang
  }
  return out
}

/**
 * Sample a MotionPathSpec into evenly-spaced points RELATIVE to the element
 * center (the engine adds the element's center offset when building tweens).
 *
 * `center` = element center in design space. For 'svg' paths the coordinates
 * in `d` are design-space and the samples are returned relative to `center`.
 */
export function sampleMotionPath(spec: MotionPathSpec, center: Pt, n?: number): PathSample[] {
  const samples = spec.kind === 'svg' ? sampleSvgPath(spec.d ?? '', center, n ?? 120) : undefined
  if (samples) return samples
  let pts: Pt[]
  if (spec.kind === 'circle') {
    const r = Math.max(8, spec.radius ?? 80)
    pts = sampleCircle(center.x, center.y, r, n ?? 64)
  } else {
    const [p0, p1, p2, p3] = pointsToCubic(spec.points ?? [{ x: 0, y: 0 }, { x: 80, y: 0 }])
    pts = sampleCubic(p0, p1, p2, p3, n ?? 48)
  }
  const rel = pts.map((p) => ({ x: p.x - center.x, y: p.y - center.y }))
  return withAngles(rel)
}

/** Sample an SVG path (browser only — uses a detached path element). */
function sampleSvgPath(d: string, center: Pt, n: number): PathSample[] | null {
  if (typeof document === 'undefined') return null
  try {
    const ns = 'http://www.w3.org/2000/svg'
    const svg = document.createElementNS(ns, 'svg')
    const path = document.createElementNS(ns, 'path')
    path.setAttribute('d', d)
    svg.appendChild(path)
    const total = path.getTotalLength()
    if (!total || !isFinite(total)) return null
    const pts: Pt[] = []
    for (let i = 0; i <= n; i++) {
      const p = path.getPointAtLength((total * i) / n)
      pts.push({ x: p.x - center.x, y: p.y - center.y })
    }
    return withAngles(pts)
  } catch {
    return null
  }
}

/** Path data string for drawing the user's path on the canvas overlay. */
export function motionPathDrawD(spec: MotionPathSpec, center: Pt): string | null {
  if (spec.kind === 'circle') return circleToPathD(center.x, center.y, Math.max(8, spec.radius ?? 80))
  if (spec.kind === 'svg') return spec.d ?? null
  const pts = spec.points ?? []
  if (pts.length < 2) return null
  const [p0, p1, p2, p3] = pointsToCubic(pts)
  return cubicToPathD(p0, p1, p2, p3)
}
