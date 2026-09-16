/**
 * Whiteboard Animation Hand Rig & Engine Synchronization.
 *
 * The hand is only believable when it is *where the ink is*. This module therefore
 * derives the hand pose from the engine's own data instead of inventing a separate
 * trajectory:
 *
 *  - `draw`   — the reveal of the element (its `clip` keyframes, sampled by the engine and
 *               passed in as `ctx.reveal`) IS the ink edge; the hand rides that edge and
 *               sweeps across it band by band, with pen lifts on the return strokes.
 *  - `erase`  — same edge, travelled downwards, eraser flat on the board.
 *  - text     — the ink appears unit by unit (anime.js stagger), so the hand follows the
 *               measured per-unit positions in the DOM (`ctx.units`) at `stagger` cadence;
 *               Arabic/RTL and real line breaks come out right because the positions are
 *               measured, not estimated.
 *  - `push`   — the flat palm leads, the arm trails.
 *
 * Everything it emits is a *pose*: position of the working point, an extra tilt, a
 * pressing flag and which asset the overlay should draw. The overlay owns the pixels
 * (photo-real hands, see handAssets.ts), so no drawing logic lives here — only motion.
 *
 * All coordinates are slide design px (1280×720 space).
 */

import type { ElementBaseInfo } from './engine'
import type { AnimSpec, WhiteboardHandSide, WhiteboardHandStyle } from './types'

/** Which asset the overlay should draw. */
export type HandPose = 'pen' | 'palm' | 'eraser'

export interface HandFrame {
  active: boolean
  x: number
  y: number
  /** extra tilt (deg) applied around the working point — assets ship pre-oriented */
  angle: number
  opacity: number
  style: WhiteboardHandStyle
  side: WhiteboardHandSide
  pressing: boolean
  pose: HandPose
}

export interface HandCtx {
  /** 0..1 progress of the element's own reveal wipe (authoritative for draw/erase). */
  reveal?: number
  /**
   * Positions of the animated text units in **ink order**, design px. For everyday text that
   * is the DOM order (the bidi algorithm already puts the first Arabic character on the right),
   * so a measured array is passed straight through; `from: 'end'` reverses it, which is what
   * the engine does when it builds this array.
   */
  units?: { x: number; y: number }[]
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
  pose: 'pen',
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

/* ------------------------------------------------------------------ timing */

/** ms the hand takes to fly in before the animation proper starts. */
export const HAND_ENTRY_MS = 320
/** ms the hand takes to lift and leave after the animation ends. */
export const HAND_EXIT_MS = 380

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

function easeOutCubic(t: number): number {
  const p = clamp(t, 0, 1)
  return 1 - Math.pow(1 - p, 3)
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * clamp(t, 0, 1)) - 1) / 2
}

/* ------------------------------------------------------- organic micro-motion
 * Two cheap ingredients separate "a cursor with a photo" from "a hand writing":
 * a slow tremor (breathing / muscle noise, < 1px) and wrist tilt that leads or lags
 * the stroke direction.
 */
function tremor(t: number, seed: number): number {
  return Math.sin(t * 12.9 + seed) * 0.45 + Math.cos(t * 21.7 + seed * 1.7) * 0.22
}

/** Tilt (deg) that follows the horizontal stroke direction: the wrist leads into a turn. */
function wristTilt(horizontalSpeed: number, verticalSpeed: number): number {
  return clamp(-horizontalSpeed * 9 - verticalSpeed * 3, -11, 11)
}

/* ------------------------------------------------------------- main routine */

/**
 * Computes the hand pose for one animation at local time `localT` (ms, may be negative
 * during the entry phase or > duration during the exit phase).
 * Returns null when the hand should not be on screen at all.
 */
export function computeHandFrame(spec: AnimSpec, el: ElementBaseInfo, localT: number, ctx: HandCtx = {}): HandFrame | null {
  const wb = spec.whiteboard
  if (!wb || wb.effect === 'stroke') return null

  const style: WhiteboardHandStyle = wb.handStyle ?? (wb.effect === 'erase' ? 'eraser' : 'marker-dark')
  const side: WhiteboardHandSide = wb.handSide ?? 'right'
  const duration = Math.max(200, spec.duration)
  const isRight = side === 'right'
  const pose: HandPose = style === 'eraser' ? 'eraser' : wb.effect === 'push' ? 'palm' : 'pen'

  const padX = 12
  const padY = 10
  const wSpan = Math.max(30, el.w - padX * 2)
  const hSpan = Math.max(20, el.h - padY * 2)

  /* ---------------------------------------------------------------- entry */
  if (localT < 0) {
    if (localT < -HAND_ENTRY_MS) return null
    const p = clamp(1 + localT / HAND_ENTRY_MS, 0, 1)
    const eased = easeOutCubic(p)
    // fly in from below-outside, aiming at the first ink position
    const start = firstPoint(wb.effect, el, ctx, isRight)
    const fromX = isRight ? el.x + el.w * 0.6 : el.x + el.w * 0.4
    const fromY = el.y + el.h + 150
    const x = start.x + (fromX - start.x) * (1 - eased)
    const y = start.y + (fromY - start.y) * (1 - eased)
    return frame({ x, y, angle: (isRight ? -6 : 6) * (1 - eased), opacity: Math.pow(eased, 0.8), style, side, pressing: false, pose })
  }

  /* --------------------------------------------------------------- active */
  if (localT <= duration) {
    const p = clamp(localT / duration, 0, 1)

    if (wb.effect === 'draw') {
      if (spec.text) {
        const units = ctx.units?.length ? ctx.units : estimatedUnits(spec, el)
        return textFrame(spec, style, side, pose, localT, units)
      }

      // The ink edge is the element's own reveal; when the engine did not hand us one
      // (e.g. a hand-written spec without clip keyframes) fall back to a human pace.
      const reveal = clamp(ctx.reveal ?? easeInOutSine(p), 0, 1)
      const bands = clamp(Math.round(el.h / 46), 2, 9)
      const sweep = reveal * bands
      const bandIdx = Math.min(bands - 1, Math.floor(sweep))
      const inBand = clamp(sweep - bandIdx, 0, 1)
      const forward = bandIdx % 2 === 0 ? isRight : !isRight

      // 84% of the band draws the stroke, the rest is the lifted return stroke.
      const drawing = inBand < 0.84
      const dashP = drawing ? inBand / 0.84 : 1
      const backP = drawing ? 0 : (inBand - 0.84) / 0.16
      const u = drawing ? dashP : 1 - backP * 0.98
      const xNorm = forward ? u : 1 - u

      const lineY = el.y + padY + reveal * hSpan
      const speedX = drawing ? forward ? 1 : -1 : -0.6
      const lift = drawing ? 0 : Math.sin(backP * Math.PI) * 16

      const t = localT / 1000
      const x = el.x + padX + xNorm * wSpan + tremor(t, 0.4)
      const y = lineY - lift + tremor(t, 2.1) + (drawing ? Math.sin(inBand * Math.PI) * 1.5 : 0)
      const angle = wristTilt(speedX, 0) + tremor(t, 5.3) * 0.6
      return frame({ x, y, angle, opacity: 1, style, side, pressing: drawing, pose })
    }

    if (wb.effect === 'push') {
      // Three phases: approach (0-0.22), contact & push (0.22-0.82), follow-through.
      const palmRest = { x: el.x + el.w * 0.5, y: el.y + el.h * 0.55 }
      if (p < 0.22) {
        const a = easeOutCubic(p / 0.22)
        const off = 190
        return frame({
          x: palmRest.x + (isRight ? off : -off) * (1 - a),
          y: palmRest.y + (1 - a) * 40,
          angle: (isRight ? 8 : -8) * (1 - a),
          opacity: Math.pow(a, 0.7),
          style,
          side,
          pressing: false,
          pose,
        })
      }
      if (p < 0.82) {
        const q = easeInOutSine((p - 0.22) / 0.6)
        const slide = 150 * (1 - q)
        const t = localT / 1000
        return frame({
          x: palmRest.x + (isRight ? slide : -slide) + tremor(t, 1.2),
          y: palmRest.y + Math.sin(q * Math.PI) * 4 + tremor(t, 3.3),
          angle: (isRight ? -4 : 4) * q + tremor(t, 7.1) * 0.5,
          opacity: 1,
          style,
          side,
          pressing: true,
          pose,
        })
      }
      const f = (p - 0.82) / 0.18
      return frame({
        x: palmRest.x + (isRight ? 1 : -1) * f * 40,
        y: palmRest.y + f * 26,
        angle: (isRight ? -6 : 6) * (1 - f),
        opacity: 1 - Math.pow(f, 2) * 0.55,
        style,
        side,
        pressing: f < 0.4,
        pose,
      })
    }

    if (wb.effect === 'erase') {
      // The eraser rides the shrinking reveal: the ink edge travels down the element.
      const reveal = clamp(ctx.reveal ?? 1 - p, 0, 1)
      const gone = 1 - reveal
      const lineY = el.y + padY + gone * hSpan
      const scrub = Math.sin(p * Math.PI * 2 * 3.2)
      const x = el.x + el.w * 0.5 + scrub * (el.w * 0.3)
      const t = localT / 1000
      return frame({
        x: x + tremor(t, 0.9),
        y: lineY + tremor(t, 4.4) * 1.4,
        angle: scrub * 4 + tremor(t, 6.6) * 0.5,
        opacity: 1,
        style: 'eraser',
        side,
        pressing: true,
        pose: 'eraser',
      })
    }
  }

  /* ----------------------------------------------------------------- exit */
  if (localT > duration && localT <= duration + HAND_EXIT_MS) {
    const e = (localT - duration) / HAND_EXIT_MS
    const l = lastPoint(wb.effect, el, ctx, isRight)
    const out = easeOutCubic(e)
    return frame({
      x: l.x + (isRight ? 1 : -1) * out * 150,
      y: l.y + out * 170 - Math.sin(clamp(e * 3, 0, 1) * Math.PI * 0.5) * 18,
      angle: (isRight ? -8 : 8) * (1 - out * 0.4),
      opacity: 1 - Math.pow(clamp((e - 0.55) / 0.45, 0, 1), 2),
      style,
      side,
      pressing: false,
      pose,
    })
  }

  return null
}

/* -------------------------------------------------------------- text frame */

function textFrame(spec: AnimSpec, style: WhiteboardHandStyle, side: WhiteboardHandSide, pose: HandPose, localT: number, units: { x: number; y: number }[]): HandFrame {
  const stagger = Math.max(20, spec.text?.stagger ?? 55)
  const n = units.length
  // Ink appears per unit every `stagger` ms (each unit fades in over ~80 ms), so the nib is
  // on whichever unit is being inked right now.
  const order = clamp(Math.max(0, localT - 30) / stagger, 0, n - 1)
  const i0 = Math.floor(order)
  const i1 = Math.min(n - 1, i0 + 1)
  const f = easeInOutSine(order - i0)
  const a = units[i0]
  const b = units[i1]
  const x = a.x + (b.x - a.x) * f
  const y = a.y + (b.y - a.y) * f
  const dx = b.x - a.x
  const t = localT / 1000
  return frame({
    x: x + tremor(t, 0.7),
    y: y + tremor(t, 3.9) + Math.sin(order * 0.9) * 0.5,
    angle: wristTilt(Math.sign(dx) * 0.8, 0) + tremor(t, 8.2) * 0.7,
    opacity: 1,
    style,
    side,
    pressing: true,
    pose,
  })
}

/**
 * Fallback ink grid for text animations whose DOM units could not be measured (jsdom, or a
 * renderer that does not split text). Text is written the same way on every line — left to
 * right, or right to left for RTL — so the grid is line-major with a pen lift between lines;
 * the wrap width is estimated from the element box.
 */
function estimatedUnits(spec: AnimSpec, el: ElementBaseInfo): { x: number; y: number }[] {
  const stagger = Math.max(20, spec.text?.stagger ?? 55)
  const count = clamp(Math.round(spec.duration / stagger), 4, 160)
  const padX = 16
  const usable = Math.max(40, el.w - padX * 2)
  const perLine = Math.max(4, Math.floor(usable / 26))
  const lines = Math.max(1, Math.ceil(count / perLine))
  const lineH = el.h / lines
  const rtl = el.rtl === true
  const out: { x: number; y: number }[] = []
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / perLine)
    const col = i % perLine
    const u = col / perLine
    out.push({ x: el.x + padX + (rtl ? 1 - u : u) * usable, y: el.y + lineH * (row + 0.72) })
  }
  return out
}

/* ------------------------------------------------------------ entry anchors */

function firstPoint(effect: string, el: ElementBaseInfo, ctx: HandCtx, isRight: boolean): { x: number; y: number } {
  if (ctx.units?.length) return ctx.units[0]
  const padX = 12
  const padY = 10
  if (effect === 'erase') return { x: el.x + el.w * 0.5, y: el.y + padY }
  if (effect === 'push') return { x: el.x + el.w * 0.5, y: el.y + el.h * 0.55 }
  return { x: isRight ? el.x + padX : el.x + el.w - padX, y: el.y + padY + 8 }
}

function lastPoint(effect: string, el: ElementBaseInfo, ctx: HandCtx, isRight: boolean): { x: number; y: number } {
  if (ctx.units?.length) return ctx.units[ctx.units.length - 1]
  const padX = 12
  const padY = 10
  if (effect === 'erase') return { x: el.x + el.w * 0.5, y: el.y + el.h - padY }
  if (effect === 'push') return { x: el.x + el.w * 0.5, y: el.y + el.h * 0.55 }
  return { x: isRight ? el.x + el.w - padX : el.x + padX, y: el.y + el.h - padY }
}

/* ----------------------------------------------------------------- helpers */

function frame(f: Omit<HandFrame, 'active'> & { active?: boolean }): HandFrame {
  return {
    active: true,
    x: Math.round(f.x * 100) / 100,
    y: Math.round(f.y * 100) / 100,
    angle: Math.round(f.angle * 100) / 100,
    opacity: Math.round(clamp(f.opacity, 0, 1) * 1000) / 1000,
    style: f.style,
    side: f.side,
    pressing: f.pressing,
    pose: f.pose,
  }
}
