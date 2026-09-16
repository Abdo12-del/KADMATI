/**
 * Animation presets — pure data factories. A preset is only a starting point:
 * the result is a normal AnimSpec, fully editable in the timeline afterwards.
 *
 * Every preset MUST contain real keyframes (animHasContent) — the library and
 * the test suite both verify this, so there are no "dead" effect buttons.
 */
import { nanoid } from 'nanoid'
import type { AnimKind, AnimProp, AnimSpec, EasingName, EasingSpec, Keyframe, MotionPathSpec } from './types'
import { defaultEasing } from './types'

export function newAnimId(): string {
  return `a-${nanoid(8)}`
}

function e(name: EasingName): EasingSpec {
  return { type: 'named', name }
}

function kf(t: number, v: number, ease?: EasingSpec): Keyframe {
  return ease ? { t, v, ease } : { t, v }
}

function base(target: string, partial: Partial<AnimSpec> & { properties?: Partial<Record<AnimProp, Keyframe[]>> }): AnimSpec {
  return {
    id: newAnimId(),
    target,
    kind: 'custom',
    delay: 0,
    duration: 500,
    easing: defaultEasing(),
    repeat: 0,
    yoyo: false,
    intensity: 1,
    start: 'with',
    properties: {},
    ...partial,
  }
}

export interface PresetDef {
  id: string
  label: string
  /** english search keyword */
  kw?: string
  kind: AnimKind
  /** which directions this family supports (for the Direction inspector row) */
  directions?: readonly string[]
  make: (target: string, over?: Partial<AnimSpec>) => AnimSpec
}

const D = 56 // standard slide distance

/** Factory helper so every produced spec remembers its preset id. */
function def(id: string, label: string, kind: AnimKind, build: (t: string, o?: Partial<AnimSpec>) => Partial<AnimSpec>, extra?: { kw?: string; directions?: readonly string[] }): PresetDef {
  return {
    id,
    label,
    kind,
    kw: extra?.kw,
    directions: extra?.directions,
    make: (t, o) => {
      const spec = base(t, { ...build(t, o), ...o })
      if (!o?.presetId) spec.presetId = id
      return spec
    },
  }
}

const SLIDE_DIRS = ['left', 'right', 'top', 'bottom'] as const

export const PRESETS: PresetDef[] = [
  /* ============================================================ ENTRANCE */
  def('fade-in', 'Fade In', 'entrance', () => ({
    name: 'Fade In', duration: 600,
    properties: { opacity: [kf(0, 0, e('cubicOut')), kf(600, 1)] },
  }), { kw: 'fade appear تلاشي ظهور' }),

  def('slide-in-left', 'Slide In → (يمين→يسار)', 'entrance', () => ({
    name: 'Slide In', duration: 700,
    properties: { x: [kf(0, -D, e('cubicOut')), kf(700, 0)], opacity: [kf(0, 0, e('cubicOut')), kf(700, 1)] },
  }), { kw: 'slide left انزلاق يسار', directions: SLIDE_DIRS }),
  def('slide-in-right', 'Slide In ← (يسار→يمين)', 'entrance', () => ({
    name: 'Slide In', duration: 700,
    properties: { x: [kf(0, D, e('cubicOut')), kf(700, 0)], opacity: [kf(0, 0, e('cubicOut')), kf(700, 1)] },
  }), { kw: 'slide right انزلاق يمين', directions: SLIDE_DIRS }),
  def('slide-in-top', 'Slide In ↓ (من الأعلى)', 'entrance', () => ({
    name: 'Slide In', duration: 700,
    properties: { y: [kf(0, -D, e('cubicOut')), kf(700, 0)], opacity: [kf(0, 0, e('cubicOut')), kf(700, 1)] },
  }), { kw: 'slide up top انزلاق أعلى', directions: SLIDE_DIRS }),
  def('slide-in-bottom', 'Slide In ↑ (من الأسفل)', 'entrance', () => ({
    name: 'Slide In', duration: 700,
    properties: { y: [kf(0, D, e('cubicOut')), kf(700, 0)], opacity: [kf(0, 0, e('cubicOut')), kf(700, 1)] },
  }), { kw: 'slide down bottom انزلاق أسفل', directions: SLIDE_DIRS }),

  def('zoom-in', 'Zoom In', 'entrance', () => ({
    name: 'Zoom In', duration: 600,
    properties: { scale: [kf(0, 0.6, e('backOut')), kf(600, 1)], opacity: [kf(0, 0, e('cubicOut')), kf(600, 1)] },
  }), { kw: 'zoom تكبير' }),
  def('zoom-out-in', 'Zoom Out (دخول)', 'entrance', () => ({
    name: 'Zoom Out', duration: 650,
    properties: { scale: [kf(0, 1.7, e('cubicOut')), kf(650, 1)], opacity: [kf(0, 0, e('cubicOut')), kf(650, 1)] },
  }), { kw: 'zoom out دخول تكبير' }),
  def('scale-in', 'Scale In', 'entrance', () => ({
    name: 'Scale In', duration: 500,
    properties: { scale: [kf(0, 0.2, e('backOut')), kf(500, 1)], opacity: [kf(0, 0, e('cubicOut')), kf(500, 1)] },
  }), { kw: 'scale توسع' }),
  def('bounce-in', 'Bounce In', 'entrance', () => ({
    name: 'Bounce In', duration: 900,
    properties: { y: [kf(0, D, e('bounceOut')), kf(900, 0)], opacity: [kf(0, 0, e('cubicOut')), kf(250, 1)] },
  }), { kw: 'bounce ارتداد' }),
  def('rotate-in', 'Rotate In', 'entrance', () => ({
    name: 'Rotate In', duration: 900,
    properties: {
      rotation: [kf(0, -200, e('backOut')), kf(900, 0)],
      scale: [kf(0, 0.2, e('backOut')), kf(900, 1)],
      opacity: [kf(0, 0, e('cubicOut')), kf(500, 1)],
    },
  }), { kw: 'rotate دوران' }),
  def('blur-in', 'Blur In', 'entrance', () => ({
    name: 'Blur In', duration: 700,
    properties: { blur: [kf(0, 12, e('cubicOut')), kf(700, 0)], opacity: [kf(0, 0, e('cubicOut')), kf(700, 1)] },
  }), { kw: 'blur ضباب' }),
  def('rise', 'Rise', 'entrance', () => ({
    name: 'Rise', duration: 600,
    properties: { y: [kf(0, 24, e('cubicOut')), kf(600, 0)], opacity: [kf(0, 0, e('cubicOut')), kf(600, 1)] },
  }), { kw: 'rise صعود' }),
  def('typewriter', 'Typewriter', 'entrance', () => ({
    name: 'Typewriter', duration: 1200, text: { mode: 'chars', stagger: 40, from: 'start' },
    properties: { opacity: [kf(0, 0, e('linear')), kf(80, 1)] },
  }), { kw: 'typewriter كتابة نص' }),

  /* ================================================================ EXIT */
  def('fade-out', 'Fade Out', 'exit', () => ({
    name: 'Fade Out', duration: 500,
    properties: { opacity: [kf(0, 1, e('cubicIn')), kf(500, 0)] },
  }), { kw: 'fade out تلاشي خروج' }),
  def('slide-out-left', 'Slide Out ← (لليمين)', 'exit', () => ({
    name: 'Slide Out', duration: 600,
    properties: { x: [kf(0, 0, e('cubicIn')), kf(600, -D)], opacity: [kf(0, 1, e('cubicIn')), kf(600, 0)] },
  }), { kw: 'slide out خروج انزلاق', directions: SLIDE_DIRS }),
  def('slide-out-right', 'Slide Out → (لليسار)', 'exit', () => ({
    name: 'Slide Out', duration: 600,
    properties: { x: [kf(0, 0, e('cubicIn')), kf(600, D)], opacity: [kf(0, 1, e('cubicIn')), kf(600, 0)] },
  }), { kw: 'slide out خروج انزلاق', directions: SLIDE_DIRS }),
  def('slide-out-top', 'Slide Out ↑ (للأعلى)', 'exit', () => ({
    name: 'Slide Out', duration: 600,
    properties: { y: [kf(0, 0, e('cubicIn')), kf(600, -D)], opacity: [kf(0, 1, e('cubicIn')), kf(600, 0)] },
  }), { kw: 'slide out خروج أعلى', directions: SLIDE_DIRS }),
  def('slide-out-bottom', 'Slide Out ↓ (للأسفل)', 'exit', () => ({
    name: 'Slide Out', duration: 600,
    properties: { y: [kf(0, 0, e('cubicIn')), kf(600, D)], opacity: [kf(0, 1, e('cubicIn')), kf(600, 0)] },
  }), { kw: 'slide out خروج أسفل', directions: SLIDE_DIRS }),
  def('drop', 'Drop', 'exit', () => ({
    name: 'Drop', duration: 600,
    properties: { y: [kf(0, 0, e('quartIn')), kf(600, 120)], opacity: [kf(0, 1, e('cubicIn')), kf(600, 0)] },
  }), { kw: 'drop سقوط' }),
  def('zoom-out', 'Zoom Out', 'exit', () => ({
    name: 'Zoom Out', duration: 500,
    properties: { scale: [kf(0, 1, e('cubicIn')), kf(500, 1.5)], opacity: [kf(0, 1, e('cubicIn')), kf(500, 0)] },
  }), { kw: 'zoom out تكبير خروج' }),
  def('scale-out', 'Scale Out', 'exit', () => ({
    name: 'Scale Out', duration: 500,
    properties: { scale: [kf(0, 1, e('backIn')), kf(500, 0.25)], opacity: [kf(0, 1, e('cubicIn')), kf(500, 0)] },
  }), { kw: 'scale تصغر خروج' }),
  def('rotate-out', 'Rotate Out', 'exit', () => ({
    name: 'Rotate Out', duration: 700,
    properties: {
      rotation: [kf(0, 0, e('cubicIn')), kf(700, 160)],
      scale: [kf(0, 1, e('backIn')), kf(700, 0.2)],
      opacity: [kf(0, 1, e('cubicIn')), kf(700, 0)],
    },
  }), { kw: 'rotate out دوران خروج' }),
  def('blur-out', 'Blur Out', 'exit', () => ({
    name: 'Blur Out', duration: 500,
    properties: { blur: [kf(0, 0, e('cubicIn')), kf(500, 12)], opacity: [kf(0, 1, e('cubicIn')), kf(500, 0)] },
  }), { kw: 'blur ضباب خروج' }),

  /* =========================================================== EMPHASIS */
  def('pulse', 'Pulse', 'emphasis', () => ({
    name: 'Pulse', duration: 700, repeat: 1,
    properties: { scale: [kf(0, 1, e('sineInOut')), kf(350, 1.08, e('sineInOut')), kf(700, 1)] },
  }), { kw: 'pulse نبض' }),
  def('bounce', 'Bounce', 'emphasis', () => ({
    name: 'Bounce', duration: 700,
    properties: { y: [kf(0, 0, e('cubicIn')), kf(350, -18, e('bounceOut')), kf(700, 0)] },
  }), { kw: 'bounce ارتداد تأكيد' }),
  def('shake', 'Shake', 'emphasis', () => ({
    name: 'Shake', duration: 600,
    properties: { x: [kf(0, 0, e('linear')), kf(120, -10, e('linear')), kf(300, 8, e('linear')), kf(480, -5, e('linear')), kf(600, 0)] },
  }), { kw: 'shake اهتزاز' }),
  def('swing', 'Swing', 'emphasis', () => ({
    name: 'Swing', duration: 1200,
    properties: { rotation: [kf(0, 0, e('sineInOut')), kf(300, 8, e('sineInOut')), kf(700, -6, e('sineInOut')), kf(1000, 4, e('sineInOut')), kf(1200, 0)] },
  }), { kw: 'swing تأرجح' }),
  def('float', 'Float', 'emphasis', () => ({
    name: 'Float', duration: 2000, repeat: -1,
    properties: { y: [kf(0, 0, e('sineInOut')), kf(1000, -14, e('sineInOut')), kf(2000, 0)] },
  }), { kw: 'float طوفان' }),
  def('grow', 'Grow', 'emphasis', () => ({
    name: 'Grow', duration: 650,
    properties: { scale: [kf(0, 1, e('cubicOut')), kf(350, 1.22, e('cubicOut')), kf(650, 1, e('cubicInOut'))] },
  }), { kw: 'grow نمو تكبير' }),
  def('shrink', 'Shrink', 'emphasis', () => ({
    name: 'Shrink', duration: 650,
    properties: { scale: [kf(0, 1, e('cubicInOut')), kf(350, 0.8, e('cubicOut')), kf(650, 1, e('cubicOut'))] },
  }), { kw: 'shrink تصغر' }),
  def('rotate-emphasis', 'Rotate (دوران)', 'emphasis', () => ({
    name: 'Rotate', duration: 1000, easing: e('sineInOut'),
    properties: { rotation: [kf(0, 0, e('linear')), kf(1000, 360)] },
  }), { kw: 'rotate spin لف دوران' }),
  def('glow', 'Glow', 'emphasis', () => ({
    name: 'Glow', duration: 900, repeat: 1,
    properties: { blur: [kf(0, 0, e('sineInOut')), kf(450, 8, e('sineInOut')), kf(900, 0)] },
  }), { kw: 'glow توهج ضباب' }),
  def('flash', 'Flash', 'emphasis', () => ({
    name: 'Flash', duration: 700,
    properties: { opacity: [kf(0, 1, e('linear')), kf(175, 0.15, e('linear')), kf(350, 1, e('linear')), kf(525, 0.15, e('linear')), kf(700, 1)] },
  }), { kw: 'flash وميض' }),
  def('tada', 'Tada', 'emphasis', () => ({
    name: 'Tada', duration: 900,
    properties: {
      scale: [kf(0, 1, e('linear')), kf(120, 0.92, e('linear')), kf(300, 1.1, e('linear')), kf(520, 0.96, e('linear')), kf(720, 1.04, e('linear')), kf(900, 1)],
      rotation: [kf(0, 0, e('linear')), kf(120, -3, e('linear')), kf(300, 3, e('linear')), kf(520, -3, e('linear')), kf(720, 3, e('linear')), kf(900, 0)],
    },
  }), { kw: 'tada احتفال' }),
  def('wobble', 'Wobble', 'emphasis', () => ({
    name: 'Wobble', duration: 800,
    properties: {
      x: [kf(0, 0, e('linear')), kf(160, -16, e('linear')), kf(340, 12, e('linear')), kf(520, -7, e('linear')), kf(700, 4, e('linear')), kf(800, 0)],
      rotation: [kf(0, 0, e('linear')), kf(160, 5, e('linear')), kf(340, -4, e('linear')), kf(520, 3, e('linear')), kf(700, -2, e('linear')), kf(800, 0)],
    },
  }), { kw: 'wobble تمايل' }),
  def('heartbeat', 'Heartbeat', 'emphasis', () => ({
    name: 'Heartbeat', duration: 850, repeat: 1,
    properties: { scale: [kf(0, 1, e('cubicOut')), kf(170, 1.14, e('cubicOut')), kf(340, 1), kf(510, 1.1, e('cubicOut')), kf(850, 1)] },
  }), { kw: 'heartbeat قلب نبض' }),

  /* ============================================================= REVEALS */
  def('reveal-right', 'Reveal (مسح لليمين)', 'reveal', () => ({
    name: 'Reveal', kind: 'reveal', duration: 750, reveal: { kind: 'wipe-right' },
    properties: { clip: [kf(0, 0, e('cubicOut')), kf(750, 1)] },
  }), { kw: 'reveal mask wipe مسح كشف', directions: SLIDE_DIRS }),
  def('reveal-left', 'Reveal (مسح لليسار)', 'reveal', () => ({
    name: 'Reveal', kind: 'reveal', duration: 750, reveal: { kind: 'wipe-left' },
    properties: { clip: [kf(0, 0, e('cubicOut')), kf(750, 1)] },
  }), { kw: 'reveal mask wipe مسح كشف', directions: SLIDE_DIRS }),
  def('reveal-down', 'Reveal (مسح للأسفل)', 'reveal', () => ({
    name: 'Reveal', kind: 'reveal', duration: 750, reveal: { kind: 'wipe-down' },
    properties: { clip: [kf(0, 0, e('cubicOut')), kf(750, 1)] },
  }), { kw: 'reveal mask wipe مسح كشف', directions: SLIDE_DIRS }),
  def('reveal-up', 'Reveal (مسح للأعلى)', 'reveal', () => ({
    name: 'Reveal', kind: 'reveal', duration: 750, reveal: { kind: 'wipe-up' },
    properties: { clip: [kf(0, 0, e('cubicOut')), kf(750, 1)] },
  }), { kw: 'reveal mask wipe مسح كشف', directions: SLIDE_DIRS }),
  def('mask-reveal', 'Mask Reveal (دائري)', 'reveal', () => ({
    name: 'Mask Reveal', kind: 'reveal', duration: 850, reveal: { kind: 'circle' },
    properties: { clip: [kf(0, 0, e('cubicOut')), kf(850, 1)] },
  }), { kw: 'mask circle دائري قناع كشف' }),
  def('text-reveal', 'Text Reveal (سطرًا سطرًا)', 'reveal', () => ({
    name: 'Text Reveal', kind: 'reveal', duration: 900, reveal: { kind: 'wipe-up' },
    text: { mode: 'lines', stagger: 130, from: 'start' },
    properties: { clip: [kf(0, 0, e('cubicOut')), kf(220, 1)] },
  }), { kw: 'text reveal نص سطر كشف' }),

  /* ============================================================== MOTION */
  def('path-bezier', 'Motion Path (Bezier)', 'motion', (_t, o) => {
    // design-space control points (UI regenerates these centred on the element)
    const motionPath: MotionPathSpec = o?.motionPath ?? { kind: 'bezier', points: [{ x: 500, y: 360 }, { x: 600, y: 290 }, { x: 680, y: 430 }, { x: 780, y: 360 }] }
    return { name: 'Motion Path', duration: 1600, easing: e('sineInOut'), properties: {}, motionPath }
  }, { kw: 'path motion مسار حركة' }),
  def('path-circle', 'Motion Path (دائرة)', 'motion', (_t, o) => ({
    name: 'Motion Path Circle', duration: 2000, easing: e('linear'), properties: {},
    motionPath: o?.motionPath ?? { kind: 'circle', radius: 80 },
  }), { kw: 'circle path دائرة مسار' }),
  def('path-custom', 'Custom Path (SVG)', 'motion', (_t, o) => ({
    name: 'Custom Path', duration: 2200, easing: e('sineInOut'), properties: {},
    motionPath: o?.motionPath ?? { kind: 'svg', d: 'M 0 360 C 320 200, 960 520, 1280 360' },
  }), { kw: 'custom svg path مسار مخصص' }),

  /* ========================================================== WHITEBOARD - Realistic hand drawing */
  def('whiteboard-draw', 'Whiteboard Draw (رسم واقعي)', 'whiteboard', () => ({
    name: 'Whiteboard Draw', duration: 2200, reveal: { kind: 'wipe-down' },
    whiteboard: { effect: 'draw', handStyle: 'marker-dark', handSide: 'right' },
    properties: {
      // Realistic drawing: top-to-bottom reveal matching hand's vertical progress
      // with variable speed (ease-in-out) simulating human drawing rhythm
      clip: [
        kf(0, 0, e('cubicOut')),
        kf(400, 0.12, e('sineInOut')),
        kf(900, 0.38, e('sineInOut')),
        kf(1400, 0.65, e('sineInOut')),
        kf(1850, 0.88, e('sineInOut')),
        kf(2200, 1, e('cubicOut')),
      ],
      opacity: [kf(0, 0, e('linear')), kf(80, 1)],
      // Subtle scale pulse as if ink pressure varies
      scale: [
        kf(0, 0.998, e('linear')),
        kf(600, 1.002, e('sineInOut')),
        kf(1200, 0.999, e('sineInOut')),
        kf(2200, 1, e('cubicOut')),
      ],
    },
  }), { kw: 'whiteboard hand draw scribe doodly رسم سبورة يد قلم ماركر واقعي' }),

  def('whiteboard-draw-pencil', 'Pencil Sketch (رسم بالقلم الرصاص)', 'whiteboard', () => ({
    name: 'Pencil Sketch', duration: 2600, reveal: { kind: 'wipe-down' },
    whiteboard: { effect: 'draw', handStyle: 'pencil', handSide: 'right' },
    properties: {
      clip: [
        kf(0, 0, e('cubicOut')),
        kf(500, 0.15, e('sineInOut')),
        kf(1100, 0.42, e('sineInOut')),
        kf(1700, 0.72, e('sineInOut')),
        kf(2200, 0.92, e('sineInOut')),
        kf(2600, 1, e('cubicOut')),
      ],
      opacity: [kf(0, 0, e('linear')), kf(100, 1)],
      rotation: [
        kf(0, -0.5, e('sineInOut')),
        kf(800, 0.4, e('sineInOut')),
        kf(1600, -0.3, e('sineInOut')),
        kf(2600, 0),
      ],
    },
  }), { kw: 'pencil sketch رسم قلم رصاص تخطيط' }),

  def('whiteboard-draw-chalk', 'Chalk Draw (رسم بالطباشير)', 'whiteboard', () => ({
    name: 'Chalk Draw', duration: 2000, reveal: { kind: 'wipe-down' },
    whiteboard: { effect: 'draw', handStyle: 'chalk', handSide: 'right' },
    properties: {
      clip: [
        kf(0, 0, e('quadOut')),
        kf(600, 0.3, e('sineInOut')),
        kf(1200, 0.62, e('sineInOut')),
        kf(2000, 1, e('cubicOut')),
      ],
      opacity: [kf(0, 0, e('linear')), kf(60, 1)],
    },
  }), { kw: 'chalk طباشير رسم سبورة' }),

  def('whiteboard-push', 'Whiteboard Push (دفع واقعي)', 'whiteboard', () => ({
    name: 'Whiteboard Push', duration: 1100,
    whiteboard: { effect: 'push', handStyle: 'marker-dark', handSide: 'right' },
    properties: {
      x: [kf(0, 220, e('backOut')), kf(900, -6, e('cubicOut')), kf(1100, 0, e('sineInOut'))],
      opacity: [kf(0, 0, e('linear')), kf(150, 1)],
      scale: [kf(0, 0.96, e('backOut')), kf(900, 1.02, e('cubicOut')), kf(1100, 1)],
    },
  }), { kw: 'whiteboard push hand slide انزلاق دفع يد واقعي' }),

  def('whiteboard-erase', 'Whiteboard Erase (مسح واقعي)', 'whiteboard', () => ({
    name: 'Whiteboard Erase', duration: 1600, reveal: { kind: 'wipe-down' },
    whiteboard: { effect: 'erase', handStyle: 'eraser', handSide: 'right' },
    properties: {
      clip: [
        kf(0, 1, e('linear')),
        kf(400, 0.75, e('sineInOut')),
        kf(900, 0.45, e('sineInOut')),
        kf(1300, 0.15, e('sineInOut')),
        kf(1600, 0, e('cubicIn')),
      ],
      opacity: [kf(0, 1, e('linear')), kf(1400, 1, e('linear')), kf(1600, 0)],
      // Slight shake as eraser scrubs
      x: [
        kf(0, 0, e('linear')),
        kf(200, -1.5, e('sineInOut')),
        kf(400, 1.2, e('sineInOut')),
        kf(700, -1, e('sineInOut')),
        kf(1000, 0.8, e('sineInOut')),
        kf(1600, 0),
      ],
    },
  }), { kw: 'whiteboard erase duster sponge ممحاة مسح سبورة واقعي' }),

  def('whiteboard-stroke', 'Sketch Draw (تخطيط احترافي)', 'whiteboard', () => ({
    name: 'Sketch Draw', duration: 1400, reveal: { kind: 'circle' },
    whiteboard: { effect: 'stroke' },
    properties: {
      clip: [kf(0, 0, e('cubicOut')), kf(1400, 1, e('cubicOut'))],
      opacity: [kf(0, 0, e('linear')), kf(80, 1)],
      scale: [kf(0, 0.92, e('backOut')), kf(1400, 1, e('cubicOut'))],
    },
  }), { kw: 'whiteboard stroke sketch outline رسم خطوط احترافي' }),

  def('whiteboard-write', 'Handwriting (كتابة يدوية واقعية)', 'whiteboard', () => ({
    name: 'Handwriting', duration: 2400,
    text: { mode: 'chars', stagger: 55, from: 'start' },
    whiteboard: { effect: 'draw', handStyle: 'marker-dark', handSide: 'right' },
    properties: {
      opacity: [kf(0, 0, e('linear')), kf(80, 1)],
      // Subtle vertical bounce per character as hand writes
      y: [
        kf(0, 2, e('sineInOut')),
        kf(600, -1, e('sineInOut')),
        kf(1200, 1.5, e('sineInOut')),
        kf(2400, 0, e('cubicOut')),
      ],
    },
  }), { kw: 'whiteboard write text handwriting كتابة يد قلم خط واقعي' }),

  def('whiteboard-write-ar', 'كتابة عربية (يد واقعية)', 'whiteboard', () => ({
    name: 'كتابة عربية', duration: 2800,
    // RTL text is stored in writing order (first character on the right), so the ink order is
    // `start` — this is also what makes the hand start at the right edge of the line. The unit is
    // a *word*: splitting Arabic into characters would break the letter connections (isolated
    // forms), see effectiveTextMode() in the engine.
    text: { mode: 'words', stagger: 230, from: 'start' },
    whiteboard: { effect: 'draw', handStyle: 'marker-blue', handSide: 'right' },
    properties: {
      opacity: [kf(0, 0, e('linear')), kf(90, 1)],
    },
  }), { kw: 'arabic كتابة عربية خط يد RTL يمين لليسار' }),

  def('whiteboard-write-pencil', 'كتابة بالقلم الرصاص', 'whiteboard', () => ({
    name: 'Pencil Writing', duration: 2200,
    text: { mode: 'chars', stagger: 45, from: 'start' },
    whiteboard: { effect: 'draw', handStyle: 'pencil', handSide: 'right' },
    properties: {
      opacity: [kf(0, 0, e('linear')), kf(70, 1)],
    },
  }), { kw: 'pencil writing كتابة قلم رصاص' }),
]

export function presetById(id: string): PresetDef | undefined {
  return PRESETS.find((p) => p.id === id)
}

/** Directional preset family → the preset id for a given direction, if any. */
export function directionalPresetId(presetId: string | undefined, direction: string): string | null {
  if (!presetId) return null
  if (presetId.startsWith('slide-in-')) return `slide-in-${direction}`
  if (presetId.startsWith('slide-out-')) return `slide-out-${direction}`
  if (presetId.startsWith('reveal-')) {
    const map: Record<string, string> = { right: 'reveal-right', left: 'reveal-left', top: 'reveal-down', bottom: 'reveal-up' }
    return map[direction] ?? null
  }
  return null
}

export interface PresetGroup {
  id: AnimKind | 'presets'
  title: string
  items: PresetDef[]
}

export const PRESET_GROUPS: PresetGroup[] = [
  { id: 'whiteboard', title: 'وايت بورد (Whiteboard)', items: PRESETS.filter((p) => p.kind === 'whiteboard') },
  { id: 'entrance', title: 'دخول (Entrance)', items: PRESETS.filter((p) => p.kind === 'entrance') },
  { id: 'exit', title: 'خروج (Exit)', items: PRESETS.filter((p) => p.kind === 'exit') },
  { id: 'emphasis', title: 'تأكيد (Emphasis)', items: PRESETS.filter((p) => p.kind === 'emphasis') },
  { id: 'reveal', title: 'كشف (Reveal)', items: PRESETS.filter((p) => p.kind === 'reveal') },
  { id: 'motion', title: 'حركة مسار (Motion)', items: PRESETS.filter((p) => p.kind === 'motion') },
]

/* ============================================================ BUNDLES (one-click combos) */

export interface BundleDef {
  id: string
  label: string
  description: string
  /** returns one or more specs (usually one merged entrance) */
  make: (target: string) => AnimSpec[]
}

export const ANIMATION_BUNDLES: BundleDef[] = [
  {
    id: 'bundle-whiteboard', label: 'Whiteboard Story (واقعي)', description: 'رسم واقعي باليد + ماركر',
    make: (t) => [base(t, {
      name: 'Whiteboard Story', presetId: 'bundle-whiteboard', kind: 'whiteboard', duration: 2400,
      reveal: { kind: 'wipe-down' },
      whiteboard: { effect: 'draw', handStyle: 'marker-dark', handSide: 'right' },
      properties: {
        clip: [
          kf(0, 0, e('cubicOut')),
          kf(500, 0.18, e('sineInOut')),
          kf(1100, 0.45, e('sineInOut')),
          kf(1700, 0.78, e('sineInOut')),
          kf(2400, 1, e('cubicOut')),
        ],
        opacity: [kf(0, 0, e('linear')), kf(80, 1)],
        scale: [kf(0, 0.998, e('linear')), kf(2400, 1, e('cubicOut'))],
      },
    })],
  },
  {
    id: 'bundle-elegant', label: 'Elegant', description: 'Fade + Rise',
    make: (t) => [base(t, {
      name: 'Elegant', presetId: 'bundle-elegant', kind: 'entrance', duration: 750,
      properties: { opacity: [kf(0, 0, e('cubicOut')), kf(750, 1)], y: [kf(0, 26, e('cubicOut')), kf(750, 0)] },
    })],
  },
  {
    id: 'bundle-dynamic', label: 'Dynamic', description: 'Slide + Scale',
    make: (t) => [base(t, {
      name: 'Dynamic', presetId: 'bundle-dynamic', kind: 'entrance', duration: 700,
      properties: {
        opacity: [kf(0, 0, e('cubicOut')), kf(700, 1)],
        x: [kf(0, 44, e('cubicOut')), kf(700, 0)],
        scale: [kf(0, 0.82, e('backOut')), kf(700, 1)],
      },
    })],
  },
  {
    id: 'bundle-presentation', label: 'Presentation', description: 'Fade + Slide',
    make: (t) => [base(t, {
      name: 'Presentation', presetId: 'bundle-presentation', kind: 'entrance', duration: 650,
      properties: {
        opacity: [kf(0, 0, e('quadOut')), kf(650, 1)],
        y: [kf(0, 34, e('quadOut')), kf(650, 0)],
      },
    })],
  },
  {
    id: 'bundle-cinematic', label: 'Cinematic', description: 'Blur + Zoom',
    make: (t) => [base(t, {
      name: 'Cinematic', presetId: 'bundle-cinematic', kind: 'entrance', duration: 950,
      properties: {
        opacity: [kf(0, 0, e('cubicOut')), kf(950, 1)],
        blur: [kf(0, 16, e('cubicOut')), kf(950, 0)],
        scale: [kf(0, 1.18, e('cubicOut')), kf(950, 1)],
      },
    })],
  },
]
