/**
 * Offscreen slide renderer.
 *
 * `captureSlides` (PNG/JPG/ZIP/PDF) and the dashboard thumbnails both need "this slide, as a DOM
 * node, right now" without the editor being mounted. Instead of a second renderer they mount the
 * *same* `SlideView` into a detached container — one renderer, so an export can never drift from
 * the canvas.
 */
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { SlideView } from '../render/SlideView'
import type { Presentation } from '../document/types'
import { CANVAS_H, CANVAS_W } from '../document/types'

const POOL_SIZE = 2

interface Slot {
  host: HTMLDivElement
  root: Root
}

let pool: Slot[] = []
let fontsWarmed = false

function acquire(): Slot {
  if (!pool.length) {
    const host = document.createElement('div')
    host.setAttribute('data-offscreen', '')
    host.style.cssText = 'position:fixed;left:-100000px;top:0;pointer-events:none;overflow:hidden;contain:strict'
    document.body.appendChild(host)
    pool.push({ host, root: createRoot(host) })
  }
  return pool[pool.length - 1]
}

async function warmFonts(): Promise<void> {
  if (fontsWarmed) return
  fontsWarmed = true
  if (!document.fonts) return
  try {
    await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))])
  } catch {
    /* Font loading API unavailable — the render still works with fallbacks. */
  }
}

/**
 * Render `index` of `doc` at `width × height` and hand back the element.
 * The caller owns the returned node's lifetime only for the paint; `release()` clears the slot.
 */
export async function renderSlideNode(doc: Presentation, index: number, width: number, height: number): Promise<{ node: HTMLElement; release: () => void }> {
  await warmFonts()
  const slot = acquire()
  const slide = doc.slides[Math.max(0, Math.min(doc.slides.length - 1, index))]
  const scale = width / (doc.size.w || CANVAS_W)
  slot.root.render(
    createElement(
      'div',
      { style: { width, height, position: 'relative', overflow: 'hidden' } },
      createElement(
        'div',
        {
          style: {
            width: doc.size.w,
            height: doc.size.h,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            inset: 0,
          },
        },
        createElement(SlideView, { slide, doc, mode: 'present' as const, static: true, style: { width: doc.size.w, height: doc.size.h } }),
      ),
    ),
  )
  // Two frames: React commits, then the browser paints, then html-to-image can serialize it.
  await raf(slot.host)
  await raf(slot.host)
  const node = slot.host.firstElementChild as HTMLElement | null
  if (!node) throw new Error('offscreen render produced no node')
  // Height guard: the container must report the requested box or PNG ends up cropped.
  node.style.width = `${Math.round(width)}px`
  node.style.height = `${Math.round(height || (doc.size.h || CANVAS_H) * scale)}px`
  return {
    node,
    release: () => {
      try {
        slot.root.render(null)
      } catch {
        /* already unmounted */
      }
      if (pool.length > POOL_SIZE) {
        pool = pool.filter((s) => s !== slot)
        slot.root.unmount()
        slot.host.remove()
      }
    },
  }
}

function raf(anchor: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    // Reading layout inside the frame guarantees styles were applied before we serialize.
    void anchor.offsetHeight
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}

/** Convenience for the exporter's `renderSlide(index, w, h)` contract. */
export function makeRenderSlide(doc: Presentation, scale = 1) {
  return async (index: number, width: number, height: number): Promise<HTMLElement> => {
    const { node } = await renderSlideNode(doc, index, width * scale, height * scale)
    return node
  }
}

/** Unmount everything (used on teardown / hot reload so React roots do not leak). */
export function disposeOffscreen() {
  for (const slot of pool) {
    try {
      slot.root.unmount()
    } catch {
      /* ignore */
    }
    slot.host.remove()
  }
  pool = []
}
