/**
 * Quick on-canvas preview — plays slide animations once, directly over the
 * editor canvas, without opening the Animation Studio dock. Used by the
 * animation library (Right Panel) and contextual actions.
 *
 * The dock owns its own long-lived engine; this singleton owns one-shot plays
 * and always cleans the DOM (transforms/filters/clip/split spans) afterwards.
 */
import { baseInfo, buildSlideEngine, type ElementBaseInfo, type SlideEngine } from '../../animation/engine'
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
  notify()
}

function clear() {
  if (stopTimer) window.clearTimeout(stopTimer)
  if (active) {
    active.destroy()
    active = null
  }
  notify()
}

/* ------------------------------------------------------- "engine is driving" broadcast
 *
 * While the engine animates an element it writes transform/opacity/filter straight to the
 * per-element wrapper node — React never sees it. The selection overlay, meanwhile, is drawn
 * from the document model (`el.x/y/w/h/rotation`), which the animation does not touch. The two
 * therefore disagree: the element sits where the motion put it and the frame with the eight
 * resize handles stays at the model rect, so it looks parked *beside* the element.
 *
 * Rather than chase the live matrix inside the overlay (it would need a per-frame React
 * update, which the whole design avoids), we do what every motion tool does: while the engine
 * owns the canvas, the edit chrome is not drawn at all.
 */
type Listener = (driving: boolean) => void
const listeners = new Set<Listener>()

/** True when playback or the studio dock is displacing elements on the canvas. */
export function isEngineDriving(): boolean {
  return !!active || studioOpen
}

export function subscribeEngineDriving(listener: Listener): () => void {
  listeners.add(listener)
  listener(isEngineDriving())
  return () => {
    listeners.delete(listener)
  }
}

function notify() {
  const driving = isEngineDriving()
  for (const listener of listeners) listener(driving)
}

/**
 * Play `anims` (defaults to the slide's own list) once on the canvas.
 * `onlyIds` restricts playback to specific animations.
 */
export function previewOnCanvas(slide: Slide, opts: { anims?: AnimSpec[]; onlyIds?: string[] } = {}): void {
  if (typeof document === 'undefined') return
  if (studioOpen) {
    // the dock owns a live engine on the same wrappers — ask it to replay
    window.dispatchEvent(new CustomEvent('aurova:anim-preview', { detail: { onlyIds: opts.onlyIds ?? null } }))
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
  for (const el of slide.elements) elements[el.id] = baseInfo(el)

  let engine: SlideEngine
  try {
    engine = buildSlideEngine({ targets, elements, anims: list, textSplit: true })
  } catch (err) {
    console.warn('preview failed', err)
    return
  }
  active = engine
  engine.restart()
  notify()
  const cap = Math.max(3000, engine.duration + 1200)
  stopTimer = window.setTimeout(() => {
    if (active === engine) {
      engine.destroy()
      active = null
    }
    notify()
  }, cap)
}

export function stopPreview(): void {
  clear()
}
