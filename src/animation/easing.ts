/**
 * Easing catalog + compilation of our JSON EasingSpec into anime.js easing values.
 *
 * Named eases reuse anime.js' standard catalog (the same set used by the major
 * tools), custom curves go through cubicBezier(), and springs through anime's
 * spring() (damped spring with solver/settling duration).
 */
import { cubicBezier, eases, spring } from 'animejs'
import type { EasingFunction } from 'animejs'
import type { EasingName, EasingSpec } from './types'

/** Our EasingName → anime.js `eases.*` key. */
const MAP: Record<EasingName, string> = {
  linear: 'linear',
  quadIn: 'inQuad', quadOut: 'outQuad', quadInOut: 'inOutQuad',
  cubicIn: 'inCubic', cubicOut: 'outCubic', cubicInOut: 'inOutCubic',
  quartIn: 'inQuart', quartOut: 'outQuart', quartInOut: 'inOutQuart',
  quintIn: 'inQuint', quintOut: 'outQuint', quintInOut: 'inOutQuint',
  sineIn: 'inSine', sineOut: 'outSine', sineInOut: 'inOutSine',
  expoIn: 'inExpo', expoOut: 'outExpo', expoInOut: 'inOutExpo',
  circIn: 'inCirc', circOut: 'outCirc', circInOut: 'inOutCirc',
  backIn: 'inBack', backOut: 'outBack', backInOut: 'inOutBack',
  elasticIn: 'inElastic', elasticOut: 'outElastic', elasticInOut: 'inOutElastic',
  bounceIn: 'inBounce', bounceOut: 'outBounce', bounceInOut: 'inOutBounce',
}

export interface EasingOption {
  id: EasingName
  /** Arabic label for the UI */
  label: string
  /** control points for the preview curve — null for non-bezier curves */
  bezier?: [number, number, number, number]
}

export const EASING_OPTIONS: EasingOption[] = [
  { id: 'linear', label: 'Linear' },
  { id: 'quadOut', label: 'Quad Out', bezier: [0.25, 0.46, 0.45, 0.94] },
  { id: 'quadIn', label: 'Quad In', bezier: [0.55, 0.085, 0.68, 0.53] },
  { id: 'quadInOut', label: 'Quad In-Out', bezier: [0.455, 0.03, 0.515, 0.955] },
  { id: 'cubicOut', label: 'Cubic Out', bezier: [0.215, 0.61, 0.355, 1] },
  { id: 'cubicIn', label: 'Cubic In', bezier: [0.55, 0.055, 0.675, 0.19] },
  { id: 'cubicInOut', label: 'Cubic In-Out', bezier: [0.645, 0.045, 0.355, 1] },
  { id: 'quartOut', label: 'Quartic Out', bezier: [0.165, 0.84, 0.44, 1] },
  { id: 'quartIn', label: 'Quartic In', bezier: [0.5, 0, 0.755, 0.05] },
  { id: 'quartInOut', label: 'Quartic In-Out', bezier: [0.77, 0, 0.175, 1] },
  { id: 'quintOut', label: 'Quintic Out', bezier: [0.23, 1, 0.32, 1] },
  { id: 'quintIn', label: 'Quintic In', bezier: [0.645, 0.045, 0.785, 0.135] },
  { id: 'quintInOut', label: 'Quintic In-Out', bezier: [0.83, 0, 0.17, 1] },
  { id: 'sineOut', label: 'Sine Out', bezier: [0.39, 0.575, 0.565, 1] },
  { id: 'sineIn', label: 'Sine In', bezier: [0.47, 0, 0.745, 0.715] },
  { id: 'sineInOut', label: 'Sine In-Out', bezier: [0.445, 0.05, 0.55, 0.95] },
  { id: 'expoOut', label: 'Expo Out', bezier: [0.19, 1, 0.22, 1] },
  { id: 'expoIn', label: 'Expo In', bezier: [0.7, 0, 0.84, 0] },
  { id: 'expoInOut', label: 'Expo In-Out', bezier: [0.87, 0, 0.13, 1] },
  { id: 'circOut', label: 'Circ Out', bezier: [0, 0.55, 0.45, 1] },
  { id: 'circIn', label: 'Circ In', bezier: [0.55, 0.055, 1, 0.45] },
  { id: 'circInOut', label: 'Circ In-Out', bezier: [0.645, 0.045, 0.355, 1] },
  { id: 'backOut', label: 'Back Out', bezier: [0.34, 1.56, 0.64, 1] },
  { id: 'backIn', label: 'Back In', bezier: [0.36, 0, 0.66, -0.56] },
  { id: 'backInOut', label: 'Back In-Out' },
  { id: 'elasticOut', label: 'Elastic Out' },
  { id: 'elasticIn', label: 'Elastic In' },
  { id: 'elasticInOut', label: 'Elastic In-Out' },
  { id: 'bounceOut', label: 'Bounce Out' },
  { id: 'bounceIn', label: 'Bounce In' },
  { id: 'bounceInOut', label: 'Bounce In-Out' },
]

export function easingLabel(spec: EasingSpec): string {
  if (spec.type === 'bezier') return 'Bezier مخصص'
  if (spec.type === 'spring') return `Spring (${Math.round(spec.stiffness ?? 170)}, ${Math.round(spec.damping ?? 16)})`
  return EASING_OPTIONS.find((o) => o.id === spec.name)?.label ?? spec.name ?? '—'
}

const namedCache: Map<EasingName, EasingFunction> = new Map()

/** Compile an EasingSpec into an anime.js EasingFunction (synchronous, cached). */
export function compileEase(spec: EasingSpec): EasingFunction {
  if (spec.type === 'bezier' && spec.bezier) {
    const [x1, y1, x2, y2] = spec.bezier
    return cubicBezier(x1, y1, x2, y2)
  }
  if (spec.type === 'spring') {
    return spring({ stiffness: spec.stiffness ?? 170, damping: spec.damping ?? 16 }) as unknown as EasingFunction
  }
  const name = spec.name ?? 'cubicOut'
  const cached = namedCache.get(name)
  if (cached) return cached
  const fn = ((eases as unknown) as Record<string, EasingFunction>)[MAP[name] ?? 'outCubic'] ?? ((t: number) => t)
  namedCache.set(name, fn)
  return fn
}

/**
 * Duration of one spring segment given the travel distance: the solver's
 * natural time scaled with distance, clamped to sane bounds.
 */
export function springSegmentDuration(stiffness: number, damping: number, dist: number): number {
  try {
    const s = spring({ stiffness: stiffness ?? 170, damping: damping ?? 16 })
    const natural = (s as unknown as { solverDuration: number }).solverDuration ?? 1200
    return Math.max(250, Math.min(3200, natural * Math.max(0.5, Math.abs(dist) / 120)))
  } catch {
    return 900
  }
}
