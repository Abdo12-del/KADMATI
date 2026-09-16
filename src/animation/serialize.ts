/**
 * JSON serialization for slide animations — save/load/copy/export.
 * Accepts a bare array or `{ "animations": [...] }`; validates and normalizes
 * on the way in so a pasted blob can never poison the document.
 */
import type { Slide } from '../document/types'
import { newAnimId } from './presets'
import type { AnimProp, AnimSpec, Keyframe } from './types'
import { animHasContent } from './types'

const PROPS: AnimProp[] = ['x', 'y', 'scale', 'rotation', 'opacity', 'blur', 'clip']

export function slideAnimsJson(slide: Slide): string {
  return JSON.stringify(slide.animations ?? [], null, 2)
}

export type ParseResult = { ok: true; anims: AnimSpec[] } | { ok: false; error: string }

function sanitizeKeyframes(v: unknown, duration: number): Keyframe[] | undefined {
  if (!Array.isArray(v)) return undefined
  const out: Keyframe[] = []
  for (const k of v) {
    if (!k || typeof k.t !== 'number' || typeof k.v !== 'number' || !isFinite(k.t) || !isFinite(k.v)) continue
    const kf: Keyframe = { t: Math.max(0, Math.min(duration, k.t)), v: k.v }
    if (k.ease && typeof k.ease === 'object' && (k.ease.type === 'named' || k.ease.type === 'bezier' || k.ease.type === 'spring')) {
      kf.ease = k.ease
    }
    out.push(kf)
  }
  return out.sort((a, b) => a.t - b.t).length ? out : undefined
}

function sanitizeAnim(v: unknown): AnimSpec | null {
  if (!v || typeof v !== 'object') return null
  const a = v as Partial<AnimSpec>
  if (typeof a.target !== 'string' || !a.target) return null
  const duration = typeof a.duration === 'number' && isFinite(a.duration) ? Math.max(1, a.duration) : 500
  const properties: AnimSpec['properties'] = {}
  for (const p of PROPS) {
    const kfs = sanitizeKeyframes((a.properties as Record<string, unknown> | undefined)?.[p], duration)
    if (kfs) properties[p] = kfs
  }
  const kind =
    a.kind === 'entrance' || a.kind === 'exit' || a.kind === 'emphasis' || a.kind === 'motion' || a.kind === 'reveal' || a.kind === 'whiteboard' || a.kind === 'custom'
      ? a.kind
      : 'custom'
  const spec: AnimSpec = {
    id: typeof a.id === 'string' && a.id ? a.id : newAnimId(),
    target: a.target,
    kind,
    name: typeof a.name === 'string' ? a.name : undefined,
    presetId: typeof a.presetId === 'string' ? a.presetId : undefined,
    delay: typeof a.delay === 'number' && isFinite(a.delay) ? Math.max(0, a.delay) : 0,
    duration,
    easing:
      a.easing && (a.easing.type === 'named' || a.easing.type === 'bezier' || a.easing.type === 'spring')
        ? a.easing
        : { type: 'named', name: 'cubicOut' },
    repeat: typeof a.repeat === 'number' && isFinite(a.repeat) ? Math.round(a.repeat) : 0,
    yoyo: !!a.yoyo,
    start: a.start === 'onClick' || a.start === 'with' || a.start === 'after' ? a.start : undefined,
    end: a.end === 'hold' || a.end === 'revert' ? a.end : undefined,
    intensity: typeof a.intensity === 'number' && isFinite(a.intensity) && a.intensity > 0 ? a.intensity : 1,
    properties,
  }
  if (a.reveal && typeof a.reveal === 'object' && ['wipe-down', 'wipe-up', 'wipe-left', 'wipe-right', 'circle'].includes(a.reveal.kind)) {
    spec.reveal = { kind: a.reveal.kind }
  }
  if (a.whiteboard && typeof a.whiteboard === 'object' && ['draw', 'push', 'erase', 'stroke'].includes((a.whiteboard as any).effect)) {
    spec.whiteboard = {
      effect: (a.whiteboard as any).effect,
      handStyle: ['marker-dark', 'marker-blue', 'pencil', 'chalk', 'eraser'].includes((a.whiteboard as any).handStyle) ? (a.whiteboard as any).handStyle : 'marker-dark',
      handTone: ['default', 'pale', 'sleeve'].includes((a.whiteboard as any).handTone) ? (a.whiteboard as any).handTone : 'default',
      handSide: (a.whiteboard as any).handSide === 'left' ? 'left' : 'right',
    }
  }
  if (a.motionPath && typeof a.motionPath === 'object' && (a.motionPath.kind === 'bezier' || a.motionPath.kind === 'circle' || a.motionPath.kind === 'svg')) {
    spec.motionPath = a.motionPath
  }
  if (a.text && typeof a.text === 'object' && (a.text.mode === 'text' || a.text.mode === 'words' || a.text.mode === 'chars' || a.text.mode === 'lines')) {
    spec.text = { mode: a.text.mode, stagger: typeof a.text.stagger === 'number' ? Math.max(0, a.text.stagger) : 40, from: a.text.from === 'center' || a.text.from === 'end' ? a.text.from : 'start' }
  }
  if (!animHasContent(spec)) return null
  return spec
}

export function parseSlideAnims(text: string): ParseResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'JSON غير صالح' }
  }
  const arr = Array.isArray(raw) ? raw : (raw as { animations?: unknown })?.animations
  if (!Array.isArray(arr)) return { ok: false, error: 'المصفوفة غير موجودة (أدخل مصفوفة AnimSpec أو {animations:[…]})' }
  const anims: AnimSpec[] = []
  for (const item of arr) {
    const spec = sanitizeAnim(item)
    if (spec) anims.push(spec)
  }
  // de-duplicate ids
  const seen = new Set<string>()
  for (const a of anims) {
    while (seen.has(a.id)) a.id = newAnimId()
    seen.add(a.id)
  }
  return { ok: true, anims }
}

/** Deep-clone an animation for copy/apply-to. */
export function cloneAnim(a: AnimSpec, target: string): AnimSpec {
  const clone: AnimSpec = JSON.parse(JSON.stringify(a))
  clone.id = newAnimId()
  clone.target = target
  return clone
}
