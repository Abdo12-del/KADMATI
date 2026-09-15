/**
 * Animation presets — pure data factories. A preset is only a starting point:
 * the result is a normal AnimSpec, fully editable in the timeline afterwards.
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
    properties: {},
    ...partial,
  }
}

export interface PresetDef {
  id: string
  label: string
  kind: AnimKind
  make: (target: string, over?: Partial<AnimSpec>) => AnimSpec
}

const D = 56 // standard slide distance

export const PRESETS: PresetDef[] = [
  /* ------------------------------------------------------------- entrance */
  {
    id: 'fade-in', label: 'Fade In', kind: 'entrance',
    make: (t, o) => base(t, { name: 'Fade In', kind: 'entrance', duration: 600, properties: { opacity: [kf(0, 0, e('cubicOut')), kf(600, 1)] }, ...o }),
  },
  {
    id: 'slide-in-left', label: 'Slide In (يمين→يسار)', kind: 'entrance',
    make: (t, o) => base(t, { name: 'Slide In', kind: 'entrance', duration: 700, properties: { x: [kf(0, -D, e('cubicOut')), kf(700, 0)], opacity: [kf(0, 0, e('cubicOut')), kf(700, 1)] }, ...o }),
  },
  {
    id: 'slide-in-right', label: 'Slide In (يسار→يمين)', kind: 'entrance',
    make: (t, o) => base(t, { name: 'Slide In', kind: 'entrance', duration: 700, properties: { x: [kf(0, D, e('cubicOut')), kf(700, 0)], opacity: [kf(0, 0, e('cubicOut')), kf(700, 1)] }, ...o }),
  },
  {
    id: 'slide-in-top', label: 'Slide In (من الأعلى)', kind: 'entrance',
    make: (t, o) => base(t, { name: 'Slide In', kind: 'entrance', duration: 700, properties: { y: [kf(0, -D, e('cubicOut')), kf(700, 0)], opacity: [kf(0, 0, e('cubicOut')), kf(700, 1)] }, ...o }),
  },
  {
    id: 'slide-in-bottom', label: 'Slide In (من الأسفل)', kind: 'entrance',
    make: (t, o) => base(t, { name: 'Slide In', kind: 'entrance', duration: 700, properties: { y: [kf(0, D, e('cubicOut')), kf(700, 0)], opacity: [kf(0, 0, e('cubicOut')), kf(700, 1)] }, ...o }),
  },
  {
    id: 'zoom-in', label: 'Zoom In', kind: 'entrance',
    make: (t, o) => base(t, { name: 'Zoom In', kind: 'entrance', duration: 600, properties: { scale: [kf(0, 0.6, e('backOut')), kf(600, 1)], opacity: [kf(0, 0, e('cubicOut')), kf(600, 1)] }, ...o }),
  },
  {
    id: 'scale-in', label: 'Scale In', kind: 'entrance',
    make: (t, o) => base(t, { name: 'Scale In', kind: 'entrance', duration: 500, properties: { scale: [kf(0, 0.2, e('backOut')), kf(500, 1)], opacity: [kf(0, 0, e('cubicOut')), kf(500, 1)] }, ...o }),
  },
  {
    id: 'rise', label: 'Rise', kind: 'entrance',
    make: (t, o) => base(t, { name: 'Rise', kind: 'entrance', duration: 600, properties: { y: [kf(0, 24, e('cubicOut')), kf(600, 0)], opacity: [kf(0, 0, e('cubicOut')), kf(600, 1)] }, ...o }),
  },
  {
    id: 'bounce-in', label: 'Bounce In', kind: 'entrance',
    make: (t, o) => base(t, { name: 'Bounce In', kind: 'entrance', duration: 900, properties: { y: [kf(0, D, e('bounceOut')), kf(900, 0)], opacity: [kf(0, 0, e('cubicOut')), kf(250, 1)] }, ...o }),
  },
  {
    id: 'blur-in', label: 'Blur In', kind: 'entrance',
    make: (t, o) => base(t, { name: 'Blur In', kind: 'entrance', duration: 700, properties: { blur: [kf(0, 12, e('cubicOut')), kf(700, 0)], opacity: [kf(0, 0, e('cubicOut')), kf(700, 1)] }, ...o }),
  },
  {
    id: 'typewriter', label: 'Typewriter', kind: 'entrance',
    make: (t, o) => base(t, { name: 'Typewriter', kind: 'entrance', duration: 1200, text: { mode: 'chars', stagger: 40, from: 'start' }, properties: { opacity: [kf(0, 0, e('linear')), kf(80, 1)] }, ...o }),
  },

  /* --------------------------------------------------------------- exit */
  {
    id: 'fade-out', label: 'Fade Out', kind: 'exit',
    make: (t, o) => base(t, { name: 'Fade Out', kind: 'exit', duration: 500, properties: { opacity: [kf(0, 1, e('cubicIn')), kf(500, 0)] }, ...o }),
  },
  {
    id: 'slide-out-left', label: 'Slide Out (لليمين)', kind: 'exit',
    make: (t, o) => base(t, { name: 'Slide Out', kind: 'exit', duration: 600, properties: { x: [kf(0, 0, e('cubicIn')), kf(600, -D)], opacity: [kf(0, 1, e('cubicIn')), kf(600, 0)] }, ...o }),
  },
  {
    id: 'slide-out-right', label: 'Slide Out (لليسار)', kind: 'exit',
    make: (t, o) => base(t, { name: 'Slide Out', kind: 'exit', duration: 600, properties: { x: [kf(0, 0, e('cubicIn')), kf(600, D)], opacity: [kf(0, 1, e('cubicIn')), kf(600, 0)] }, ...o }),
  },
  {
    id: 'drop', label: 'Drop', kind: 'exit',
    make: (t, o) => base(t, { name: 'Drop', kind: 'exit', duration: 600, properties: { y: [kf(0, 0, e('quartIn')), kf(600, 120)], opacity: [kf(0, 1, e('cubicIn')), kf(600, 0)] }, ...o }),
  },
  {
    id: 'zoom-out', label: 'Zoom Out', kind: 'exit',
    make: (t, o) => base(t, { name: 'Zoom Out', kind: 'exit', duration: 500, properties: { scale: [kf(0, 1, e('cubicIn')), kf(500, 1.5)], opacity: [kf(0, 1, e('cubicIn')), kf(500, 0)] }, ...o }),
  },
  {
    id: 'scale-out', label: 'Scale Out', kind: 'exit',
    make: (t, o) => base(t, { name: 'Scale Out', kind: 'exit', duration: 500, properties: { scale: [kf(0, 1, e('backIn')), kf(500, 0.25)], opacity: [kf(0, 1, e('cubicIn')), kf(500, 0)] }, ...o }),
  },
  {
    id: 'blur-out', label: 'Blur Out', kind: 'exit',
    make: (t, o) => base(t, { name: 'Blur Out', kind: 'exit', duration: 500, properties: { blur: [kf(0, 0, e('cubicIn')), kf(500, 12)], opacity: [kf(0, 1, e('cubicIn')), kf(500, 0)] }, ...o }),
  },

  /* ----------------------------------------------------------- emphasis */
  {
    id: 'pulse', label: 'Pulse', kind: 'emphasis',
    make: (t, o) => base(t, { name: 'Pulse', kind: 'emphasis', duration: 700, repeat: 2, properties: { scale: [kf(0, 1, e('sineInOut')), kf(350, 1.08, e('sineInOut')), kf(700, 1)] }, ...o }),
  },
  {
    id: 'shake', label: 'Shake', kind: 'emphasis',
    make: (t, o) => base(t, { name: 'Shake', kind: 'emphasis', duration: 600, properties: { x: [kf(0, 0, e('linear')), kf(120, -10, e('linear')), kf(300, 8, e('linear')), kf(480, -5, e('linear')), kf(600, 0)] }, ...o }),
  },
  {
    id: 'float', label: 'Float', kind: 'emphasis',
    make: (t, o) => base(t, { name: 'Float', kind: 'emphasis', duration: 2000, repeat: -1, properties: { y: [kf(0, 0, e('sineInOut')), kf(1000, -14, e('sineInOut')), kf(2000, 0)] }, ...o }),
  },
  {
    id: 'swing', label: 'Swing', kind: 'emphasis',
    make: (t, o) => base(t, { name: 'Swing', kind: 'emphasis', duration: 1200, properties: { rotation: [kf(0, 0, e('sineInOut')), kf(300, 8, e('sineInOut')), kf(700, -6, e('sineInOut')), kf(1000, 4, e('sineInOut')), kf(1200, 0)] }, ...o }),
  },
  {
    id: 'glow', label: 'Glow', kind: 'emphasis',
    make: (t, o) => base(t, { name: 'Glow', kind: 'emphasis', duration: 900, repeat: 2, properties: { blur: [kf(0, 0, e('sineInOut')), kf(450, 8, e('sineInOut')), kf(900, 0)] }, ...o }),
  },
  {
    id: 'bounce', label: 'Bounce', kind: 'emphasis',
    make: (t, o) => base(t, { name: 'Bounce', kind: 'emphasis', duration: 700, properties: { y: [kf(0, 0, e('cubicIn')), kf(350, -18, e('bounceOut')), kf(700, 0)] }, ...o }),
  },

  /* ------------------------------------------------------------- motion */
  {
    id: 'path-bezier', label: 'Motion Path (Bezier)', kind: 'motion',
    make: (t, o) => {
      const motionPath: MotionPathSpec = o?.motionPath ?? { kind: 'bezier', points: [{ x: -120, y: 0 }, { x: -40, y: -60 }, { x: 40, y: 60 }, { x: 120, y: 0 }] }
      return base(t, { name: 'Motion Path', kind: 'motion', duration: 1600, easing: e('sineInOut'), properties: {}, ...o, motionPath })
    },
  },
  {
    id: 'path-circle', label: 'Motion Path (دائرة)', kind: 'motion',
    make: (t, o) => base(t, { name: 'Motion Path Circle', kind: 'motion', duration: 2000, easing: e('linear'), motionPath: o?.motionPath ?? { kind: 'circle', radius: 80 }, properties: {}, ...o }),
  },
]

export function presetById(id: string): PresetDef | undefined {
  return PRESETS.find((p) => p.id === id)
}

export interface PresetGroup {
  title: string
  items: PresetDef[]
}

export const PRESET_GROUPS: PresetGroup[] = [
  { title: 'دخول (Entrance)', items: PRESETS.filter((p) => p.kind === 'entrance') },
  { title: 'خروج (Exit)', items: PRESETS.filter((p) => p.kind === 'exit') },
  { title: 'تأكيد (Emphasis)', items: PRESETS.filter((p) => p.kind === 'emphasis') },
  { title: 'حركة مسار (Motion)', items: PRESETS.filter((p) => p.kind === 'motion') },
]
