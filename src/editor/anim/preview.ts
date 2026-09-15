/**
 * Quick on-canvas preview — plays slide animations once, directly over the
 * editor canvas, without opening the Animation Studio dock. Used by the
 * animation library (Right Panel) and contextual actions.
 *
 * The dock owns its own long-lived engine; this singleton owns one-shot plays
 * and always cleans the DOM (transforms/filters/clip/split spans) afterwards.
 */
import { buildSlideEngine, type ElementBaseInfo, type SlideEngine } from '../../animation/engine'
import type { AnimSpec } from '../../animation/types'
import { animHasContent } from '../../animation/types'
import type { Slide } from '../../document/types'
import { animRegistry } from './registry'

let active: SlideEngine | null = null
let stopTimer: number | undefined

/** When the studio dock is open it owns the canvas — previews route to it. */
let studioOpen = false
export function setStudioOpen(open: boolean): void {
  studioOpen = open
  if (open) clear()
}

function clear() {
  if (stopTimer) window.clearTimeout(stopTimer)
  if (active) {
    active.destroy()
    active = null
  }
}

/**
 * Play `anims` (defaults to the slide's own list) once on the canvas.
 * `onlyIds` restricts playback to specific animations.
 */
export function previewOnCanvas(slide: Slide, opts: { anims?: AnimSpec[]; onlyIds?: string[] } = {}): void {
  if (typeof document === 'undefined') return
  if (studioOpen) {
    // the dock owns a live engine on the same wrappers — ask it to replay
    window.dispatchEvent(new CustomEvent('kadmati:anim-preview', { detail: { onlyIds: opts.onlyIds ?? null } }))
    return
  }
  clear()
  const list = (opts.anims ?? slide.animations ?? []).filter((a) => {
    if (!animHasContent(a)) return false
    if (opts.onlyIds && !opts.onlyIds.includes(a.id)) return false
    return true
  })
  if (!list.length) return
  const targets = animRegistry.all()
  if (!list.some((a) => targets[a.target])) return
  const elements: Record<string, ElementBaseInfo> = {}
  for (const el of slide.elements) elements[el.id] = { x: el.x, y: el.y, w: el.w, h: el.h, rotation: el.rotation ?? 0 }

  let engine: SlideEngine
  try {
    engine = buildSlideEngine({ targets, elements, anims: list, textSplit: true })
  } catch (err) {
    console.warn('preview failed', err)
    return
  }
  active = engine
  engine.restart()
  const cap = Math.max(3000, engine.duration + 1200)
  stopTimer = window.setTimeout(() => {
    if (active === engine) {
      engine.destroy()
      active = null
    }
  }, cap)
}

export function stopPreview(): void {
  clear()
}
