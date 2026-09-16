/**
 * The animation data model — pure types, no React, no DOM.
 * This model is the single source of truth for all motion in a presentation:
 * it is what gets saved, undone/Redone, copied, exported and (later) fed to AI.
 *
 * Units: ms for time, design-px (1280×720 space) for distances, degrees for angles.
 *
 * Value semantics (what makes presets portable between elements):
 *  - x / y      → RELATIVE offset from the element's base position (dx, dy)
 *  - scale      → absolute (1 = base size)
 *  - rotation   → RELATIVE delta in degrees
 *  - opacity    → absolute 0..1
 *  - blur       → absolute px (CSS filter blur)
 *  - clip       → 0..1 reveal fraction for a clip-path wipe (see RevealSpec)
 */

export type AnimProp = 'x' | 'y' | 'scale' | 'rotation' | 'opacity' | 'blur' | 'clip'

/** Properties exposed in the manual keyframe table/timeline diamonds (clip is preset-managed). */
export const MANUAL_PROPS: AnimProp[] = ['x', 'y', 'scale', 'rotation', 'opacity', 'blur']

export const ANIM_PROPS: AnimProp[] = ['x', 'y', 'scale', 'rotation', 'opacity', 'blur', 'clip']

export type EasingName =
  | 'linear'
  | 'quadIn' | 'quadOut' | 'quadInOut'
  | 'cubicIn' | 'cubicOut' | 'cubicInOut'
  | 'quartIn' | 'quartOut' | 'quartInOut'
  | 'quintIn' | 'quintOut' | 'quintInOut'
  | 'sineIn' | 'sineOut' | 'sineInOut'
  | 'expoIn' | 'expoOut' | 'expoInOut'
  | 'circIn' | 'circOut' | 'circInOut'
  | 'backIn' | 'backOut' | 'backInOut'
  | 'elasticIn' | 'elasticOut' | 'elasticInOut'
  | 'bounceIn' | 'bounceOut' | 'bounceInOut'

export interface EasingSpec {
  type: 'named' | 'bezier' | 'spring'
  /** type='named' */
  name?: EasingName
  /** type='bezier' — cubic-bezier(x1, y1, x2, y2) */
  bezier?: [number, number, number, number]
  /** type='spring' */
  stiffness?: number
  damping?: number
}

/** One keyframe. `ease` (when set) is the easing of the segment FROM this keyframe to the next. */
export interface Keyframe {
  t: number
  v: number
  ease?: EasingSpec
}

export interface Pt {
  x: number
  y: number
}

export interface MotionPathSpec {
  kind: 'bezier' | 'circle' | 'svg'
  /** bezier: 2–4 points (user-drawn on the canvas). svg: ignored. circle: ignored. */
  points?: Pt[]
  /** circle: radius around the element center */
  radius?: number
  /** svg: path data */
  d?: string
  /** orient the element along the path tangent */
  autoRotate?: boolean
}

export interface TextAnimSpec {
  mode: 'text' | 'words' | 'chars' | 'lines'
  /** ms between successive text units */
  stagger: number
  from: 'start' | 'center' | 'end'
}

/**
 * Connected-script ink (Arabic, Persian, Urdu…): the fraction of a unit's writing window the
 * pen spends travelling to the unit instead of drawing it. The engine must use the same value
 * when it schedules the per-unit reveal, otherwise hand and ink disagree (see textStream.ts).
 */
export const INK_LEAD = 0.12

/**
 * Clip-path reveal descriptor. The `clip` property runs 0 (hidden) → 1 (revealed);
 * this describes the geometry of the revealing edge.
 */
export interface RevealSpec {
  kind: 'wipe-down' | 'wipe-up' | 'wipe-left' | 'wipe-right' | 'circle'
}

export type AnimKind = 'entrance' | 'exit' | 'emphasis' | 'motion' | 'reveal' | 'whiteboard' | 'custom'

export type WhiteboardEffect = 'draw' | 'push' | 'erase' | 'stroke'
export type WhiteboardHandStyle = 'marker-dark' | 'marker-blue' | 'pencil' | 'chalk' | 'eraser'
export type WhiteboardHandSide = 'right' | 'left'

export interface WhiteboardSpec {
  effect: WhiteboardEffect
  handStyle?: WhiteboardHandStyle
  handSide?: WhiteboardHandSide
}

/** PowerPoint-style start trigger. */
export type AnimStart = 'onClick' | 'with' | 'after'

/** What happens after the animation finishes its (finite) plays. */
export type AnimEnd = 'hold' | 'revert'

export interface AnimSpec {
  id: string
  /** element id within the slide */
  target: string
  kind: AnimKind
  name?: string
  /** preset this was created from (enables Direction re-application) */
  presetId?: string
  /** start offset, ms */
  delay: number
  /** ms */
  duration: number
  /** default easing for segments without their own */
  easing: EasingSpec
  /** 0 = once, n = n+1 plays, -1 = infinite */
  repeat: number
  /** alternate direction on each repeat */
  yoyo: boolean
  /** when the animation starts relative to the previous one (presentation playback) */
  start?: AnimStart
  /** end state: hold the final frame or return to the neutral element state */
  end?: AnimEnd
  /** multiplies travel distances/deviations: x/y/rotation/blur × intensity, scale deviations around 1 × intensity */
  intensity?: number
  /** per-property keyframes, t in [0, duration] */
  properties: Partial<Record<AnimProp, Keyframe[]>>
  /** takes precedence over x/y keyframes when set */
  motionPath?: MotionPathSpec
  /** clip-path reveal geometry when properties.clip is present */
  reveal?: RevealSpec
  /** whiteboard hand-drawing animation parameters */
  whiteboard?: WhiteboardSpec
  /** text-split animation (text elements) */
  text?: TextAnimSpec
}

/** The default easing everywhere: a gentle, professional deceleration. */
export function defaultEasing(): EasingSpec {
  return { type: 'named', name: 'cubicOut' }
}

export function isNamedEasing(v: unknown): v is EasingSpec {
  const e = v as EasingSpec | null
  return !!e && (e.type === 'named' || e.type === 'bezier' || e.type === 'spring')
}

/** Sort keyframes by t and clamp into [0, duration]. Returns a new array. */
export function normalizeKeyframes(kfs: Keyframe[], duration: number): Keyframe[] {
  const d = Math.max(1, duration)
  return [...kfs]
    .sort((a, b) => a.t - b.t)
    .map((k) => ({ ...k, t: Math.max(0, Math.min(d, Math.round(k.t))) }))
}

/** Normalize one AnimSpec (defensive, used by factory + JSON import). */
export function normalizeAnim(a: AnimSpec): AnimSpec {
  const duration = Math.max(1, Math.round(a.duration ?? 500))
  const properties: AnimSpec['properties'] = {}
  for (const [p, kfs] of Object.entries(a.properties ?? {})) {
    if (Array.isArray(kfs) && kfs.length) {
      properties[p as AnimProp] = normalizeKeyframes(kfs, duration)
    }
  }
  return {
    ...a,
    duration,
    delay: Math.max(0, Math.round(a.delay ?? 0)),
    repeat: typeof a.repeat === 'number' && isFinite(a.repeat) ? Math.round(a.repeat) : 0,
    yoyo: !!a.yoyo,
    intensity: typeof a.intensity === 'number' && isFinite(a.intensity) && a.intensity > 0 ? a.intensity : 1,
    start: a.start === 'onClick' || a.start === 'after' ? a.start : a.start === 'with' ? 'with' : undefined,
    end: a.end === 'revert' ? 'revert' : undefined,
    easing: isNamedEasing(a.easing) ? a.easing : defaultEasing(),
    properties,
    whiteboard: a.whiteboard,
    reveal: a.reveal,
    motionPath: a.motionPath,
    text: a.text,
    presetId: a.presetId,
    name: a.name,
    kind: a.kind,
    target: a.target,
    id: a.id,
  }
}

/**
 * Retime an animation in place: every keyframe and the text stagger scale with the new
 * duration, so a 2.2 s whiteboard draw stretched to 5 s still draws at the same *relative*
 * pace. Without this, stretching a clip just piles the keyframes at the end of the old
 * window and leaves the element (and the hand) parked for the rest of the timeline.
 */
export function retimeAnim(a: AnimSpec, duration: number): void {
  const from = Math.max(1, a.duration)
  const to = Math.max(100, Math.round(duration))
  if (to === from) return
  const k = to / from
  for (const list of Object.values(a.properties)) {
    if (!list) continue
    for (const kf of list) kf.t = Math.max(0, Math.min(to, Math.round(kf.t * k)))
  }
  if (a.text) a.text = { ...a.text, stagger: Math.max(10, Math.round(a.text.stagger * k)) }
  a.duration = to
}

/** Does this spec actually animate anything? */
export function animHasContent(a: AnimSpec): boolean {
  if (a.motionPath) return true
  return Object.values(a.properties ?? {}).some((kfs) => (kfs?.length ?? 0) >= 1)
}

/** Duration of one play ignoring infinite repeats. */
export function finiteSpan(a: AnimSpec): number {
  const plays = a.repeat > 0 ? a.repeat + 1 : 1
  return a.duration * plays
}

/** Effective total time the spec occupies on the (finite) timeline. */
export function animSpan(a: AnimSpec): number {
  return a.delay + finiteSpan(a)
}
