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
import { handAsset, handDrawHeight } from './handAssets'
import { INK_LEAD, NIB_AHEAD_PX } from './types'
import { glyphInkFraction } from './glyphClusters'
import type { AnimSpec, WhiteboardHandSide, WhiteboardHandStyle } from './types'

/** Which asset the overlay should draw. */
export type HandPose = 'pen' | 'palm' | 'eraser'

export interface HandFrame {
  active: boolean
  x: number
  y: number
  /** extra tilt (deg) applied around the working point — assets ship pre-oriented */
  angle: number
  /** 1 = the asset's authored size; smaller when the ink is smaller than the rig was designed for */
  scale: number
  opacity: number
  style: WhiteboardHandStyle
  side: WhiteboardHandSide
  pressing: boolean
  pose: HandPose
}

/** The height the hand rig is authored at (design px) — the reference for `scale`. */
const BASE_HAND_H = handDrawHeight(handAsset('marker-dark'))

/** Hand size for a text run: ~5.5× the line, so a caption gets a smaller hand than a headline. */
function scaleForText(unitHeight: number | undefined): number {
  if (!unitHeight || !isFinite(unitHeight)) return 1
  return Math.round(Math.min(1.15, Math.max(0.5, (unitHeight * 5.5) / BASE_HAND_H)) * 1000) / 1000
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
  units?: { x: number; y: number; w?: number; h?: number }[]
  /**
   * ms between inked units, when it differs from `spec.text.stagger` — e.g. an RTL spec authored
   * per character is run per word (see `effectiveTextMode`), so the hand must advance per word too.
   */
  stagger?: number
  /** paragraph direction of the target text (decides which side a unit is written from) */
  rtl?: boolean
  /**
   * Connected-script ink: the units are revealed by a clip edge travelling across each unit,
   * `stride` ms per unit with `lead` ms of pen travel before a unit starts being drawn. When
   * present, the hand follows that edge instead of sweeping unit by unit.
   */
  stream?: {
    stride: number
    lead: number
    /** per-unit cluster widths (design px) — the pieces a pen draws inside one unit */
    clusters?: number[][]
  }
}

const DEFAULT_FRAME: HandFrame = {
  active: false,
  x: 0,
  y: 0,
  angle: 0,
  scale: 1,
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
        if (ctx.units?.length && ctx.stream) {
          return streamFrame(style, side, pose, localT, ctx.units, ctx.stream, ctx.rtl ?? el.rtl === true)
        }
        const units = ctx.units?.length ? ctx.units : estimatedUnits(spec, el, ctx.stagger)
        return textFrame(spec, style, side, pose, localT, units, ctx.stagger, ctx.rtl ?? el.rtl)
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

/**
 * The ink edge of a text stream — used for connected scripts, where the ink travels across each
 * unit instead of being switched on unit by unit (see `textStream` in engine.ts).
 *
 * The window of one unit is exactly what the engine schedules: the ink tween starts at
 * `lead + i * stride` and lasts `stride * (1 - INK_LEAD)`, and the pen spends the remaining
 * `lead` ms lifting off the unit it just finished and landing on the next one's entry edge.
 * Writing and travelling share the same clock, so the nib rides the ink edge the whole way.
 */
function streamFrame(
  style: WhiteboardHandStyle,
  side: WhiteboardHandSide,
  pose: HandPose,
  localT: number,
  units: { x: number; y: number; w?: number; h?: number }[],
  stream: { stride: number; lead: number; clusters?: number[][] },
  rtl: boolean,
): HandFrame {
  const n = units.length
  const dir = rtl ? -1 : 1 // writing direction along the line
  const { stride, lead } = stream
  // the ink tween's length — the pen draws for exactly this long, then lifts
  const drawMs = Math.max(1, stride * (1 - INK_LEAD))
  const u0 = Math.max(0, localT - lead) // time since the first unit's ink began
  const raw = Math.floor(u0 / stride)
  const i = clamp(raw, 0, n - 1) // the unit whose window we are inside of
  const w = u0 - raw * stride // time into that window
  const u = units[i]
  const box = u.w ?? 0
  const half = box / 2
  const handScale = scaleForText(u.h)
  // the tip sits slightly ahead of the wet edge, scaled with the rig: the ink trails the nib
  const ahead = NIB_AHEAD_PX * handScale
  /** The edge of the unit where the script starts (its right edge in RTL). */
  const entry = u.x + (rtl ? half : -half)
  /** The edge it ends at. */
  const exit = entry + dir * box
  const travel = raw === i && w > drawMs && i < n - 1

  let x: number
  let y: number
  if (w <= drawMs || i >= n - 1) {
    // drawing (or holding the last stroke while the pen has nowhere left to go)
    const p = clamp(w / drawMs, 0, 1)
    const widths = stream.clusters?.[i]
    const total = widths?.reduce((a, b) => a + b, 0) ?? 0
    if (widths?.length && total > 0 && box > 0) {
      // Inside the unit the ink advances cluster by cluster — the same boundaries and the same
      // in-glyph speed profile the engine tweens, so the nib rides the edge of the glyph that is
      // actually being drawn instead of gliding at an average speed.
      let cum = 0
      let drawn = 0
      for (let k = 0; k < widths.length; k++) {
        const cw = widths[k]
        // index, not value: two clusters of the same width must not look like the last one
        if (p <= (cum + cw) / total || k === widths.length - 1) {
          const q = clamp((p * total - cum) / cw, 0, 1)
          drawn = cum + glyphInkFraction(q) * cw
          break
        }
        cum += cw
      }
      // the ink the pen has already laid, measured from the unit's start edge (right, for RTL)
      x = entry + dir * (drawn + ahead)
    } else {
      x = entry + dir * (p * box + ahead)
    }
    y = u.y
  } else {
    // pen lift: leave this unit's exit edge and land on the next unit's entry edge
    const next = units[i + 1]
    const nextEntry = next.x + (rtl ? (next.w ?? 0) / 2 : -(next.w ?? 0) / 2)
    const g = easeInOutSine(clamp((w - drawMs) / Math.max(1, lead), 0, 1))
    x = exit + dir * ahead + (nextEntry + dir * ahead - (exit + dir * ahead)) * g
    y = u.y + (next.y - u.y) * g
  }

  const t = localT / 1000
  return frame({
    x: x + tremor(t, 0.7),
    y: y + tremor(t, 3.9) + Math.sin(i * 0.6) * 0.4,
    angle: wristTilt(dir * 0.9, 0) + tremor(t, 8.2) * 0.7,
    scale: scaleForText(units[i]?.h ?? units[units.length - 1]?.h),
    opacity: 1,
    style,
    side,
    pressing: !travel,
    pose,
  })
}

function textFrame(
  spec: AnimSpec,
  style: WhiteboardHandStyle,
  side: WhiteboardHandSide,
  pose: HandPose,
  localT: number,
  units: { x: number; y: number; w?: number; h?: number }[],
  staggerOverride?: number,
  rtlHint?: boolean,
): HandFrame {
  const stagger = Math.max(20, staggerOverride ?? spec.text?.stagger ?? 55)
  const n = units.length
  // Ink appears per unit every `stagger` ms, so the nib is on whichever unit is being inked now.
  const order = clamp(Math.max(0, localT - 30) / stagger, 0, n - 1)
  const i = Math.floor(order)
  const f = order - i
  const u = units[i]
  const next = units[Math.min(n - 1, i + 1)]

  // Writing direction: how the ink order travels along the line (RTL text is stored right-first,
  // so a line of Arabic is written right-to-left). Falls back to the element's paragraph direction.
  const travel = next.x - u.x
  const dir = Math.abs(travel) > 1 ? Math.sign(travel) : rtlHint || spec.text?.from === 'end' ? -1 : 1

  let x: number
  let y: number
  if (u.w && u.w > 4) {
    // The unit's box is known (measured from the DOM): sweep across it, from the edge the pen
    // arrives at to the edge it leaves by, then hop to the next unit in the rest of the window.
    const half = u.w / 2
    const sweep = u.x - dir * half + dir * 2 * half * clamp(f / 0.86, 0, 1)
    const from = { x: sweep, y: u.y }
    const hopP = f < 0.86 ? 0 : (f - 0.86) / 0.14
    const targetX = next.w && next.w > 4 ? next.x - dir * (next.w / 2) : next.x
    x = from.x + (targetX - from.x) * hopP
    y = u.y + (next.y - u.y) * hopP
  } else {
    // No measured width (estimated grid): travel between unit centres.
    const g = easeInOutSine(f)
    x = u.x + (next.x - u.x) * g
    y = u.y + (next.y - u.y) * g
  }

  const t = localT / 1000
  return frame({
    x: x + tremor(t, 0.7),
    y: y + tremor(t, 3.9) + Math.sin(order * 0.9) * 0.5,
    angle: wristTilt(dir * 0.8, 0) + tremor(t, 8.2) * 0.7,
    scale: scaleForText(units[Math.min(i, units.length - 1)]?.h),
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
function estimatedUnits(spec: AnimSpec, el: ElementBaseInfo, staggerOverride?: number): { x: number; y: number; w: number }[] {
  const stagger = Math.max(20, staggerOverride ?? spec.text?.stagger ?? 55)
  const count = clamp(Math.round(spec.duration / stagger), 4, 160)
  const padX = 16
  const usable = Math.max(40, el.w - padX * 2)
  const perLine = Math.max(4, Math.floor(usable / 26))
  const lines = Math.max(1, Math.ceil(count / perLine))
  const lineH = el.h / lines
  const rtl = el.rtl === true
  const slot = usable / perLine
  const out: { x: number; y: number; w: number }[] = []
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / perLine)
    const col = i % perLine
    const u = col / perLine
    out.push({ x: el.x + padX + (rtl ? 1 - u : u) * usable, y: el.y + lineH * (row + 0.72), w: slot })
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

function frame(f: Omit<HandFrame, 'active' | 'scale'> & { active?: boolean; scale?: number }): HandFrame {
  return {
    active: true,
    x: Math.round(f.x * 100) / 100,
    y: Math.round(f.y * 100) / 100,
    angle: Math.round(f.angle * 100) / 100,
    scale: f.scale ?? 1,
    opacity: Math.round(clamp(f.opacity, 0, 1) * 1000) / 1000,
    style: f.style,
    side: f.side,
    pressing: f.pressing,
    pose: f.pose,
  }
}
