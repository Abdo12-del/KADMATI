/**
 * The slide animation engine — a thin adapter that compiles our JSON AnimSpec[]
 * into an anime.js Timeline and exposes a small deterministic interface:
 * play / pause / stop / restart / seek / destroy.
 *
 * Design rules:
 *  - The engine writes transform/opacity/filter/clip directly to per-element
 *    wrapper nodes (no React state, no re-renders while playing).
 *  - Keyframe segments are explicit from/to tweens placed at absolute timeline
 *    positions — seeking to any t is exact.
 *  - Motion paths are pre-sampled into linear micro-segments: seek-accurate,
 *    exportable, and the tangent gives us auto-rotate for free.
 *  - Text animations use anime's TextSplitter (words/chars/lines) + stagger.
 *  - `blur` is compiled to the CSS `filter` property and `clip` to CSS custom
 *    properties feeding a clip-path template (the old numeric `blur` tween
 *    silently wrote an unknown attribute and did nothing).
 */
import { createTimeline, stagger, TextSplitter } from 'animejs'
import type { Timeline } from 'animejs'
import { compileEase, springSegmentDuration } from './easing'
import { broadcastHandFrame, clearHandFrame, computeHandFrame } from './hand'
import { sampleMotionPath, type PathSample } from './path'
import type { AnimProp, AnimSpec, Keyframe, Pt, RevealSpec } from './types'
import { animHasContent, animSpan, normalizeKeyframes } from './types'

export interface ElementBaseInfo {
  x: number
  y: number
  w: number
  h: number
  rotation: number
}

export interface BuildCtx {
  /** elementId → wrapper DOM node (design space) */
  targets: Record<string, HTMLElement>
  /** elementId → base geometry (for motion-path centering) */
  elements: Record<string, ElementBaseInfo>
  anims: AnimSpec[]
  /** allow DOM text splitting (presenter + editor previews) */
  textSplit?: boolean
}

export interface SlideEngine {
  duration: number
  seek(t: number): void
  play(): void
  pause(): void
  stop(): void
  restart(): void
  getTime(): number
  isPlaying(): boolean
  onUpdate(cb: (t: number) => void): () => void
  destroy(): void
}

type TweenNodes = HTMLElement | HTMLElement[]

/* ------------------------------------------------------- value compilation */

/** Intensity-aware value mapping: travel/deviation scales, neutral states stay put. */
function remap(spec: AnimSpec, prop: AnimProp, v: number): number {
  const k = spec.intensity ?? 1
  if (k === 1) return v
  switch (prop) {
    case 'x':
    case 'y':
    case 'rotation':
    case 'blur':
      return v * k
    case 'scale':
      return 1 + (v - 1) * k
    default:
      return v
  }
}

function num(spec: AnimSpec, prop: AnimProp, v: number): number {
  return Math.round(remap(spec, prop, v) * 1000) / 1000
}

/** filter/blur values are strings; everything else numeric. */
function tweenValue(spec: AnimSpec, prop: AnimProp, v: number): number | string {
  const r = num(spec, prop, v)
  return prop === 'blur' ? `blur(${Math.max(0, r).toFixed(2)}px)` : r
}

/**
 * Property key anime.js actually writes. Two mappings from our model:
 *  - `blur`     → CSS `filter` (anime does not know `blur`)
 *  - `rotation` → `rotate` (anime v4 transform name; animating `rotation`
 *    silently writes nothing — a previously dead effect)
 */
function cssKey(prop: AnimProp): string {
  if (prop === 'blur') return 'filter'
  if (prop === 'rotation') return 'rotate'
  return prop
}

/* ------------------------------------------------------------- clip reveal */

const CLIP_VARS = {
  ct: '--kad-ct',
  cr: '--kad-cr',
  cb: '--kad-cb',
  cl: '--kad-cl',
  cc: '--kad-cc',
} as const

function clipVar(reveal: RevealSpec | undefined): string {
  switch (reveal?.kind) {
    case 'wipe-right':
      return CLIP_VARS.cr
    case 'wipe-left':
      return CLIP_VARS.cl
    case 'wipe-down':
      return CLIP_VARS.ct
    case 'wipe-up':
      return CLIP_VARS.cb
    case 'circle':
      return CLIP_VARS.cc
    default:
      return CLIP_VARS.cr
  }
}

function clipPct(v: number): string {
  return `${Math.max(0, Math.min(150, (1 - v) * 100)).toFixed(2)}%`
}

function circlePct(v: number): string {
  // 0 → 0% radius, 1 → 150% (covers every corner of the box)
  return `${Math.max(0, Math.min(150, v * 150)).toFixed(2)}%`
}

function clipVarValue(reveal: RevealSpec | undefined, v: number): string {
  return reveal?.kind === 'circle' ? circlePct(v) : clipPct(v)
}

function clipPathTemplate(reveal: RevealSpec | undefined): string {
  if (reveal?.kind === 'circle') return 'circle(var(--kad-cc, 0%) at 50% 50%)'
  return 'inset(var(--kad-ct, 0%) var(--kad-cr, 0%) var(--kad-cb, 0%) var(--kad-cl, 0%))'
}

function eachNode(nodes: TweenNodes, fn: (n: HTMLElement) => void): void {
  if (Array.isArray(nodes)) nodes.forEach(fn)
  else fn(nodes)
}

function applyClipBaseline(nodes: TweenNodes, spec: AnimSpec): void {
  if (!spec.properties.clip || !spec.reveal) return
  const first = spec.properties.clip[0]
  const variable = clipVar(spec.reveal)
  eachNode(nodes, (n) => {
    n.style.clipPath = clipPathTemplate(spec.reveal)
    n.style.setProperty(variable, clipVarValue(spec.reveal, first?.v ?? 0))
  })
}

function clearClipAndFilters(n: HTMLElement): void {
  n.style.clipPath = ''
  n.style.removeProperty?.(CLIP_VARS.ct)
  n.style.removeProperty?.(CLIP_VARS.cr)
  n.style.removeProperty?.(CLIP_VARS.cb)
  n.style.removeProperty?.(CLIP_VARS.cl)
  n.style.removeProperty?.(CLIP_VARS.cc)
}

/* =============================================================== build === */

export function sampleKeyframes(kfs: Keyframe[], t: number, spec: AnimSpec): number {
  if (!kfs.length) return 0
  if (t <= kfs[0].t) return kfs[0].v
  if (t >= kfs[kfs.length - 1].t) return kfs[kfs.length - 1].v
  for (let i = 0; i < kfs.length - 1; i++) {
    const a = kfs[i]
    const b = kfs[i + 1]
    if (t >= a.t && t <= b.t) {
      const p = b.t === a.t ? 1 : (t - a.t) / (b.t - a.t)
      const eased = compileEase(a.ease ?? spec.easing)(p)
      return a.v + (b.v - a.v) * eased
    }
  }
  return kfs[kfs.length - 1].v
}

export function buildSlideEngine(ctx: BuildCtx): SlideEngine {
  let userCb: ((t: number) => void) | null = null
  const hasWhiteboard = ctx.anims.some((a) => !!a.whiteboard && a.whiteboard.effect !== 'stroke')

  const updateHand = (t: number) => {
    if (!hasWhiteboard) return
    let activeFrame = null
    for (const raw of ctx.anims) {
      if (!raw.whiteboard || raw.whiteboard.effect === 'stroke') continue
      const localT = t - raw.delay
      const el = ctx.elements[raw.target]
      if (!el) continue
      const frame = computeHandFrame(raw, el, localT)
      if (frame && frame.active) {
        activeFrame = frame
        break
      }
    }
    if (activeFrame) {
      broadcastHandFrame(activeFrame)
    } else {
      clearHandFrame()
    }
  }

  const tl = createTimeline({
    autoplay: false,
    onUpdate: () => {
      updateHand(tl.currentTime)
      userCb?.(tl.currentTime)
    },
  })
  const splitters: TextSplitter[] = []
  const touchedNodes = new Set<HTMLElement>()
  const targets = ctx.targets
  let duration = 0

  for (const raw of ctx.anims) {
    const spec = normalizeSpec(raw)
    const node = targets[spec.target]
    if (!node || !animHasContent(spec)) continue
    const el = ctx.elements[spec.target]
    const center: Pt = el ? { x: el.x + el.w / 2, y: el.y + el.h / 2 } : { x: 0, y: 0 }

    // Text splitting: animate the split units with stagger.
    let nodes: TweenNodes = node
    if (spec.text && spec.text.mode !== 'text' && ctx.textSplit) {
      try {
        // chars are wrapped inside word nodes, so enabling chars keeps words too;
        // lines mode needs no per-word/per-char units
        const params =
          spec.text.mode === 'chars'
            ? { chars: true }
            : spec.text.mode === 'lines'
              ? { lines: true, words: false, chars: false }
              : undefined
        const splitter = new TextSplitter(node, params)
        splitters.push(splitter)
        const split = spec.text.mode === 'chars' ? splitter.chars : spec.text.mode === 'lines' ? splitter.lines : splitter.words
        nodes = (split as HTMLElement[]) ?? []
        if (!nodes.length) nodes = node
      } catch {
        nodes = node
      }
    }

    eachNode(nodes, (n) => {
      touchedNodes.add(n)
      n.style.willChange = 'transform, opacity, filter, clip-path'
    })
    applyClipBaseline(nodes, spec)

    const loop: boolean | number = spec.repeat === -1 ? true : spec.repeat > 0 ? spec.repeat : false
    const sub = createTimeline({ autoplay: false, loop, alternate: !!spec.yoyo })
    addSpecTweens(sub, spec, nodes, center)
    tl.sync(sub, spec.delay)
    duration = Math.max(duration, animSpan(spec))
  }

  duration = Math.round(duration)

  const engine: SlideEngine = {
    duration,
    seek(t: number) {
      try {
        const clamped = Math.max(0, Math.min(t, Math.max(1, duration)))
        tl.seek(clamped)
        updateHand(clamped)
      } catch {
        /* timeline mid-rebuild — ignore */
      }
    },
    play() {
      if (tl.currentTime >= Math.max(0, duration - 1)) tl.seek(0)
      tl.resume()
    },
    pause() {
      tl.pause()
    },
    stop() {
      tl.pause()
      tl.seek(0)
      clearHandFrame()
    },
    restart() {
      tl.seek(0)
      tl.resume()
    },
    getTime() {
      return tl.currentTime
    },
    isPlaying() {
      return !tl.paused && tl.currentTime < Math.max(0, duration - 1)
    },
    onUpdate(cb: (t: number) => void) {
      userCb = cb
      return () => {
        if (userCb === cb) userCb = null
      }
    },
    destroy() {
      clearHandFrame()
      try {
        tl.pause()
        tl.revert()
      } catch {
        /* already torn down */
      }
      for (const s of splitters) {
        try {
          s.revert()
        } catch {
          /* node gone */
        }
      }
      touchedNodes.forEach((n) => {
        n.style.transform = ''
        n.style.opacity = ''
        n.style.filter = ''
        n.style.willChange = ''
        clearClipAndFilters(n)
      })
    },
  }

  // Apply the initial (t=0) frame so entrance states are visible before play.
  engine.seek(0)
  return engine
}

function addSpecTweens(sub: Timeline, spec: AnimSpec, nodes: TweenNodes, center: Pt): void {
  const hasPath = !!spec.motionPath
  // anime v4 stagger uses 'first'/'center'/'last' (we store 'start'/'center'/'end')
  const staggerFrom = spec.text ? (spec.text.from === 'start' ? 'first' : spec.text.from === 'end' ? 'last' : 'center') : undefined
  const staggerDelay = spec.text && staggerFrom ? stagger(spec.text.stagger, { from: staggerFrom }) : undefined
  const staggerOpt: Record<string, any> = staggerDelay !== undefined ? { delay: staggerDelay } : {}

  for (const [prop, kfsRaw] of Object.entries(spec.properties) as [AnimProp, Keyframe[]][]) {
    if ((prop === 'x' || prop === 'y') && hasPath) continue // motion path wins over x/y
    const kfs = normalizeKeyframes(kfsRaw ?? [], spec.duration)
    if (!kfs.length) continue

    if (prop === 'clip') {
      addClipTweens(sub, spec, nodes, kfs, staggerOpt)
      continue
    }

    holdAt(sub, nodes, spec, prop, kfs[0].v, 0, staggerOpt)
    if (kfs.length >= 2) {
      for (let i = 0; i < kfs.length - 1; i++) {
        const a = kfs[i]
        const b = kfs[i + 1]
        const segDur = b.t - a.t
        if (segDur <= 0) continue
        const segEase = a.ease ?? spec.easing
        const isSpring = segEase.type === 'spring'
        const dist = Math.abs(num(spec, prop, b.v) - num(spec, prop, a.v))
        const dur = isSpring ? springSegmentDuration(segEase.stiffness ?? 170, segEase.damping ?? 16, dist) : segDur
        sub.add(
          nodes,
          {
            [cssKey(prop)]: { from: tweenValue(spec, prop, a.v), to: tweenValue(spec, prop, b.v) },
            duration: Math.min(dur, segDur),
            ease: compileEase(segEase),
            ...staggerOpt,
          },
          a.t,
        )
      }
    }
    holdAt(sub, nodes, spec, prop, kfs[kfs.length - 1].v, spec.duration, staggerOpt)
  }

  if (spec.motionPath) {
    addMotionPathTweens(sub, spec, nodes, center, staggerOpt)
  }

  // end: revert — one frame after the final keyframe, snap back to neutral state
  if (spec.end === 'revert' && spec.repeat <= 0 && !hasPath) {
    const t = spec.duration + 16
    const revertProps: Record<string, string | number> = {}
    for (const prop of ['x', 'y', 'rotation', 'scale', 'opacity', 'blur'] as AnimProp[]) {
      if (spec.properties[prop]) revertProps[cssKey(prop)] = prop === 'blur' ? 'blur(0px)' : prop === 'scale' || prop === 'opacity' ? 1 : 0
    }
    if (spec.properties.clip && spec.reveal) {
      const variable = clipVar(spec.reveal)
      revertProps[variable] = spec.reveal.kind === 'circle' ? '150%' : '0%'
    }
    const out: Record<string, string | number> = {}
    for (const [p, v] of Object.entries(revertProps)) out[p === 'blur' ? 'filter' : p] = v
    if (Object.keys(out).length) sub.set(nodes, out, t)
  }
}

function addClipTweens(sub: Timeline, spec: AnimSpec, nodes: TweenNodes, kfs: Keyframe[], staggerOpt: Record<string, any>): void {
  const reveal = spec.reveal ?? { kind: 'wipe-right' as const }
  const variable = clipVar(reveal)
  const val = (v: number) => clipVarValue(reveal, v)
  sub.set(nodes, { [variable]: val(kfs[0].v) }, 0)
  for (let i = 0; i < kfs.length - 1; i++) {
    const a = kfs[i]
    const b = kfs[i + 1]
    const segDur = b.t - a.t
    if (segDur <= 0) continue
    sub.add(
      nodes,
      {
        [variable]: { from: val(a.v), to: val(b.v) },
        duration: segDur,
        ease: compileEase(a.ease ?? spec.easing),
        ...staggerOpt,
      },
      a.t,
    )
  }
  sub.set(nodes, { [variable]: val(kfs[kfs.length - 1].v) }, spec.duration)
}

function addMotionPathTweens(sub: Timeline, spec: AnimSpec, nodes: TweenNodes, center: Pt, staggerOpt: Record<string, any>): void {
  const mp = spec.motionPath!
  const samples: PathSample[] = sampleMotionPath(mp, center, mp.kind === 'svg' ? 120 : 48)
  if (samples.length < 2) return
  const n = samples.length - 1
  const segDur = spec.duration / n
  const k = spec.intensity ?? 1
  const sx = (p: PathSample) => Math.round(p.x * k * 100) / 100
  const sy = (p: PathSample) => Math.round(p.y * k * 100) / 100
  for (let i = 0; i < n; i++) {
    sub.add(
      nodes,
      {
        x: { from: sx(samples[i]), to: sx(samples[i + 1]) },
        y: { from: sy(samples[i]), to: sy(samples[i + 1]) },
        ...(mp.autoRotate ? { rotate: { from: samples[i].angle, to: samples[i + 1].angle } } : {}),
        duration: segDur,
        ease: 'linear',
        ...staggerOpt,
      },
      i * segDur,
    )
  }
  sub.set(nodes, { x: sx(samples[0]), y: sy(samples[0]) }, 0)
  sub.set(nodes, { x: sx(samples[n]), y: sy(samples[n]) }, spec.duration)
}

function holdAt(sub: Timeline, nodes: TweenNodes, spec: AnimSpec, prop: AnimProp, v: number, t: number, staggerOpt: Record<string, any>): void {
  sub.set(nodes, { [cssKey(prop)]: tweenValue(spec, prop, v) }, t)
  // stagger groups also need an explicit pre-start hold (anime delays leave base inline style otherwise)
  if (t === 0 && Object.keys(staggerOpt).length) {
    sub.set(nodes, { [cssKey(prop)]: tweenValue(spec, prop, v) }, 0)
  }
}

/** Local defensive normalizer (kept here so the engine has zero UI coupling). */
function normalizeSpec(a: AnimSpec): AnimSpec {
  const duration = Math.max(1, Math.round(a.duration ?? 500))
  const properties: AnimSpec['properties'] = {}
  for (const [p, kfs] of Object.entries(a.properties ?? {})) {
    if (Array.isArray(kfs) && kfs.length) properties[p as AnimProp] = normalizeKeyframes(kfs, duration)
  }
  return {
    ...a,
    duration,
    delay: Math.max(0, Math.round(a.delay ?? 0)),
    repeat: typeof a.repeat === 'number' && isFinite(a.repeat) ? Math.round(a.repeat) : 0,
    yoyo: !!a.yoyo,
    intensity: typeof a.intensity === 'number' && a.intensity > 0 ? a.intensity : 1,
    properties,
  }
}
