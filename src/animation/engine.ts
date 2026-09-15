/**
 * The slide animation engine — a thin adapter that compiles our JSON AnimSpec[]
 * into an anime.js Timeline and exposes a small deterministic interface:
 * play / pause / stop / restart / seek / destroy.
 *
 * Design rules:
 *  - The engine writes transform/opacity/blur directly to per-element wrapper
 *    nodes (no React state, no re-renders while playing).
 *  - Keyframe segments are explicit from/to tweens placed at absolute timeline
 *    positions — seeking to any t is exact (verified against anime v4).
 *  - Motion paths are pre-sampled into linear micro-segments: seek-accurate,
 *    exportable, and the tangent gives us auto-rotate for free.
 *  - Text animations use anime's TextSplitter (words/chars/lines) + stagger.
 */
import { createTimeline, stagger, TextSplitter } from 'animejs'
import type { Timeline } from 'animejs'
import { compileEase, springSegmentDuration } from './easing'
import { sampleMotionPath } from './path'
import type { AnimProp, AnimSpec, Keyframe, Pt } from './types'
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
  /** allow DOM text splitting (true in presentation mode) */
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

function propKey(p: AnimProp): string {
  return p
}

function valueFor(p: AnimProp, v: number): number | string {
  return p === 'blur' ? `blur(${Math.max(0, v)}px)` : v
}

/** Interpolated value of a keyframe list at local time t (pure, for the UI + export). */
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
  const tl = createTimeline({ autoplay: false })
  const splitters: TextSplitter[] = []
  const targets = ctx.targets
  let duration = 0

  for (const raw of ctx.anims) {
    const spec = normalizeAnim(raw)
    const node = targets[spec.target]
    if (!node || !animHasContent(spec)) continue
    const el = ctx.elements[spec.target]
    const center: Pt = el ? { x: el.x + el.w / 2, y: el.y + el.h / 2 } : { x: 0, y: 0 }

    // Text splitting (presentation only): animate the split units with stagger.
    let nodes: HTMLElement | HTMLElement[] = node
    if (spec.text && spec.text.mode !== 'text' && ctx.textSplit) {
      try {
        const splitter = new TextSplitter(node)
        splitters.push(splitter)
        nodes = (spec.text.mode === 'chars' ? splitter.chars : spec.text.mode === 'lines' ? splitter.lines : splitter.words) as HTMLElement[]
        if (!nodes.length) nodes = node
      } catch {
        nodes = node
      }
    }

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
        tl.seek(Math.max(0, Math.min(t, Math.max(1, duration))))
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
      const fn = () => cb(tl.currentTime)
      tl.onUpdate = fn
      return () => {
        if (tl.onUpdate === fn) (tl as unknown as { onUpdate?: unknown }).onUpdate = undefined
      }
    },
    destroy() {
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
      for (const n of Object.values(targets)) {
        n.style.transform = ''
        n.style.opacity = ''
        n.style.filter = ''
        n.style.willChange = ''
      }
    },
  }

  // Apply the initial (t=0) frame so entrance states are visible before play.
  engine.seek(0)
  return engine
}

function addSpecTweens(sub: Timeline, spec: AnimSpec, nodes: HTMLElement | HTMLElement[], center: Pt): void {
  const hasPath = !!spec.motionPath
  // anime v4 stagger uses 'first'/'center'/'last' (we store 'start'/'center'/'end')
  const staggerFrom = spec.text ? (spec.text.from === 'start' ? 'first' : spec.text.from === 'end' ? 'last' : 'center') : undefined
  const staggerDelay = spec.text && staggerFrom ? stagger(spec.text.stagger, { from: staggerFrom }) : undefined

  for (const [prop, kfsRaw] of Object.entries(spec.properties) as [AnimProp, Keyframe[]][]) {
    if ((prop === 'x' || prop === 'y') && hasPath) continue // motion path wins over x/y keyframes
    const kfs = normalizeKeyframes(kfsRaw ?? [], spec.duration)
    if (!kfs.length) continue

    holdAt(sub, nodes, prop, kfs[0].v, 0)
    if (kfs.length >= 2) {
      for (let i = 0; i < kfs.length - 1; i++) {
        const a = kfs[i]
        const b = kfs[i + 1]
        const segDur = b.t - a.t
        if (segDur <= 0) continue
        const segEase = a.ease ?? spec.easing
        const isSpring = segEase.type === 'spring'
        const dur = isSpring ? springSegmentDuration(segEase.stiffness ?? 170, segEase.damping ?? 16, Math.abs(b.v - a.v)) : segDur
        sub.add(
          nodes,
          {
            [propKey(prop)]: { from: a.v, to: b.v },
            duration: Math.min(dur, segDur),
            ease: compileEase(segEase),
            ...(staggerDelay !== undefined ? { delay: staggerDelay } : {}),
          },
          a.t,
        )
      }
    }
    holdAt(sub, nodes, prop, kfs[kfs.length - 1].v, spec.duration)
  }

  if (spec.motionPath) {
    const samples = sampleMotionPath(spec.motionPath, center, spec.motionPath.kind === 'svg' ? 120 : 48)
    if (samples.length >= 2) {
      const n = samples.length - 1
      const segDur = spec.duration / n
      for (let i = 0; i < n; i++) {
        sub.add(
          nodes,
          {
            x: { from: samples[i].x, to: samples[i + 1].x },
            y: { from: samples[i].y, to: samples[i + 1].y },
            ...(spec.motionPath.autoRotate ? { rotation: { from: samples[i].angle, to: samples[i + 1].angle } } : {}),
            duration: segDur,
            ease: 'linear',
            ...(staggerDelay !== undefined ? { delay: staggerDelay } : {}),
          },
          i * segDur,
        )
      }
      holdAt(sub, nodes, 'x', samples[0].x, 0)
      holdAt(sub, nodes, 'y', samples[0].y, 0)
      holdAt(sub, nodes, 'x', samples[n].x, spec.duration)
      holdAt(sub, nodes, 'y', samples[n].y, spec.duration)
    }
  }
}

function holdAt(sub: Timeline, nodes: HTMLElement | HTMLElement[], prop: AnimProp, v: number, t: number): void {
  sub.set(nodes, { [propKey(prop)]: valueFor(prop, v) }, t)
}

/** Normalized spec re-export for callers. */
function normalizeAnim(a: AnimSpec): AnimSpec {
  return normalizeKeyframesSafe(a)
}

function normalizeKeyframesSafe(a: AnimSpec): AnimSpec {
  const duration = Math.max(1, Math.round(a.duration ?? 500))
  const properties: AnimSpec['properties'] = {}
  for (const [p, kfs] of Object.entries(a.properties ?? {})) {
    if (Array.isArray(kfs) && kfs.length) properties[p as AnimProp] = normalizeKeyframes(kfs, duration)
  }
  return { ...a, duration, delay: Math.max(0, Math.round(a.delay ?? 0)), repeat: typeof a.repeat === 'number' && isFinite(a.repeat) ? Math.round(a.repeat) : 0, yoyo: !!a.yoyo, properties }
}
