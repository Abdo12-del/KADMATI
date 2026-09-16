/**
 * Whiteboard Animation Hand Rig & Engine Synchronization.
 *
 * Provides realistic vector hand assets (marker, chalk, pencil, eraser)
 * and trajectory computation that synchronizes the pen tip coordinates (x, y)
 * directly with the drawing/pushing/erasing of elements on the canvas.
 */
import type { ElementBaseInfo } from './engine'
import type { AnimSpec, WhiteboardHandSide, WhiteboardHandStyle } from './types'

export interface HandFrame {
  active: boolean
  x: number
  y: number
  angle: number
  opacity: number
  style: WhiteboardHandStyle
  side: WhiteboardHandSide
  pressing: boolean
}

const DEFAULT_FRAME: HandFrame = {
  active: false,
  x: 0,
  y: 0,
  angle: 0,
  opacity: 0,
  style: 'marker-dark',
  side: 'right',
  pressing: false,
}

let currentFrame: HandFrame = { ...DEFAULT_FRAME }
type HandListener = (frame: HandFrame) => void
const listeners = new Set<HandListener>()

export function getHandFrame(): HandFrame {
  return currentFrame
}

export function subscribeHandFrame(listener: HandListener): () => void {
  listeners.add(listener)
  listener(currentFrame)
  return () => {
    listeners.delete(listener)
  }
}

export function broadcastHandFrame(frame: HandFrame): void {
  currentFrame = frame
  for (const l of listeners) l(frame)
}

export function clearHandFrame(): void {
  if (!currentFrame.active) return
  currentFrame = { ...DEFAULT_FRAME }
  for (const l of listeners) l(currentFrame)
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

/**
 * Computes the exact hand tip position and angle at `localT` (ms within spec duration).
 */
export function computeHandFrame(spec: AnimSpec, el: ElementBaseInfo, localT: number): HandFrame | null {
  const wb = spec.whiteboard
  if (!wb || wb.effect === 'stroke') return null

  const style: WhiteboardHandStyle = wb.handStyle ?? (wb.effect === 'erase' ? 'eraser' : 'marker-dark')
  const side: WhiteboardHandSide = wb.handSide ?? 'right'
  const duration = Math.max(100, spec.duration)
  const isRight = side === 'right'

  // Pre-roll entrance (160ms before drawing begins)
  if (localT < 0) {
    if (localT < -160) return null
    const entryP = 1 + localT / 160
    const startX = isRight ? el.x + 8 : el.x + el.w - 8
    const startY = el.y + 8
    return {
      active: true,
      x: startX + (isRight ? 120 : -120) * (1 - entryP),
      y: startY + 140 * (1 - entryP),
      angle: (isRight ? -18 : 18) * entryP,
      opacity: entryP,
      style,
      side,
      pressing: false,
    }
  }

  // Active drawing / pushing / erasing phase
  if (localT <= duration) {
    const p = clamp(localT / duration, 0, 1)

    if (wb.effect === 'draw') {
      const lines = Math.max(3, Math.min(8, Math.round(el.h / 32)))
      const lineProg = p * lines
      const lineIdx = Math.min(lines - 1, Math.floor(lineProg))
      const inLine = lineProg - lineIdx
      const isEven = lineIdx % 2 === 0
      const u = isRight ? (isEven ? inLine : 1 - inLine) : (isEven ? 1 - inLine : inLine)

      const startPad = 6
      const wSpan = Math.max(12, el.w - startPad * 2)
      const hSpan = Math.max(12, el.h - startPad * 2)

      const x = el.x + startPad + u * wSpan
      const y = el.y + startPad + (lineIdx + inLine) * (hSpan / lines)
      const jitterX = Math.sin(p * Math.PI * 2 * lines * 3) * 2.5
      const jitterY = Math.cos(p * Math.PI * 2 * lines * 3) * 1.8
      const angle = (isRight ? -14 : 14) + Math.sin(p * 25) * 3.5

      return {
        active: true,
        x: Math.round((x + jitterX) * 10) / 10,
        y: Math.round((y + jitterY) * 10) / 10,
        angle,
        opacity: 1,
        style,
        side,
        pressing: true,
      }
    }

    if (wb.effect === 'push') {
      // Element translates from offset towards destination
      const remainingDist = (1 - p) * 180
      const targetEdgeX = isRight ? el.x + remainingDist + el.w : el.x - remainingDist
      const targetY = el.y + el.h / 2
      const angle = (isRight ? -5 : 5) + Math.sin(p * 6) * 2

      return {
        active: true,
        x: Math.round(targetEdgeX),
        y: Math.round(targetY),
        angle,
        opacity: 1,
        style,
        side,
        pressing: true,
      }
    }

    if (wb.effect === 'erase') {
      const scrubFreq = 14
      const sweep = Math.sin(p * Math.PI * 2 * scrubFreq)
      const x = el.x + el.w / 2 + sweep * (el.w * 0.42)
      const y = el.y + p * el.h
      const angle = sweep * 8

      return {
        active: true,
        x: Math.round(x),
        y: Math.round(y),
        angle,
        opacity: 1,
        style: 'eraser',
        side,
        pressing: true,
      }
    }
  }

  // Post-roll exit (200ms after completion)
  const exitDuration = 220
  if (localT > duration && localT <= duration + exitDuration) {
    const exitP = (localT - duration) / exitDuration
    const lastX = isRight ? el.x + el.w : el.x
    const lastY = el.y + el.h
    return {
      active: true,
      x: lastX + (isRight ? 1 : -1) * exitP * 90,
      y: lastY + exitP * 130,
      angle: (isRight ? -22 : 22) * (1 - exitP),
      opacity: Math.max(0, 1 - exitP),
      style,
      side,
      pressing: false,
    }
  }

  return null
}
