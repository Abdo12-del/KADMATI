/**
 * Whiteboard Animation Hand Rig & Engine Synchronization.
 * 
 * Provides realistic hand trajectory that mimics actual human writing/drawing:
 * - Natural curved strokes, not straight zigzags
 * - Variable speed: slow at curves, fast on straights
 * - Pen lifts between lines with arc motion
 * - Wrist rotation follows writing direction
 * - Pressure variation and subtle human jitter
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

// Human-like easing: ease in-out with slight overshoot for natural motion
function humanEase(t: number): number {
  // Cubic in-out with subtle sine for organic feel
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

/**
 * Computes realistic hand trajectory for whiteboard animations.
 * The hand follows natural writing patterns:
 * - Draw: boustrophedon with curved strokes, pen lifts
 * - Write: char-by-char with varying speed
 * - Push: arc entry, firm push, follow-through
 * - Erase: overlapping scrubbing with pressure variation
 */
export function computeHandFrame(spec: AnimSpec, el: ElementBaseInfo, localT: number): HandFrame | null {
  const wb = spec.whiteboard
  if (!wb || wb.effect === 'stroke') return null

  const style: WhiteboardHandStyle = wb.handStyle ?? (wb.effect === 'erase' ? 'eraser' : 'marker-dark')
  const side: WhiteboardHandSide = wb.handSide ?? 'right'
  const duration = Math.max(200, spec.duration)
  const isRight = side === 'right'

  // Pre-roll: hand enters from off-screen with natural arc
  if (localT < 0) {
    const entryDuration = 280
    if (localT < -entryDuration) return null
    const p = 1 + localT / entryDuration // 0 -> 1
    const eased = easeOutBack(clamp(p, 0, 1))
    
    // Arc entry: hand comes from bottom-right (or bottom-left for left hand) with curve
    const startX = isRight ? el.x + el.w * 0.15 : el.x + el.w * 0.85
    const startY = el.y + el.h * 0.1
    const offX = isRight ? 140 : -140
    const offY = 160
    
    // Bezier-like arc entry
    const arcX = offX * (1 - eased) * (1 - eased)
    const arcY = offY * (1 - eased) + Math.sin((1 - eased) * Math.PI) * 20
    
    return {
      active: true,
      x: startX + arcX,
      y: startY + arcY,
      angle: (isRight ? -22 : 22) * eased + Math.sin(p * Math.PI) * 5,
      opacity: Math.pow(eased, 0.7),
      style,
      side,
      pressing: false,
    }
  }

  // Active drawing phase
  if (localT <= duration) {
    const p = clamp(localT / duration, 0, 1)
    const easedP = humanEase(p)

    if (wb.effect === 'draw') {
      // Check if this is text handwriting mode
      const isTextWriting = !!spec.text && (spec.text.mode === 'chars' || spec.text.mode === 'words')
      const isRTL = spec.text?.from === 'end'

      if (isTextWriting) {
        // Realistic handwriting: char-by-char with natural rhythm
        const stagger = spec.text?.stagger ?? 55
        const estimatedChars = Math.max(8, Math.min(120, Math.floor(duration / Math.max(20, stagger))))
        const charProgress = easedP * estimatedChars
        const charIdx = Math.floor(charProgress)
        const inChar = charProgress - charIdx

        // Writing direction: LTR (start) or RTL (end)
        const writingDir = isRTL ? -1 : 1
        const charsPerLine = Math.max(6, Math.floor(el.w / 22)) // avg char width ~22px in design space
        const lineIdx = Math.floor(charIdx / charsPerLine)
        const charInLine = charIdx % charsPerLine
        const charPosInLine = charInLine + inChar

        // Natural handwriting has slight up-down for baseline
        const baselineWobble = Math.sin(charPosInLine * 0.8) * 1.2 + Math.cos(charPosInLine * 1.3) * 0.6
        
        // Position calculation
        const padX = 12
        const padY = 10
        const usableW = Math.max(30, el.w - padX * 2)
        const lineHeight = Math.max(20, el.h / Math.max(1, Math.ceil(estimatedChars / charsPerLine)))
        
        let x: number
        if (isRTL) {
          x = el.x + el.w - padX - (charPosInLine / charsPerLine) * usableW
        } else {
          x = el.x + padX + (charPosInLine / charsPerLine) * usableW
        }
        let y = el.y + padY + lineIdx * lineHeight + lineHeight * 0.5 + baselineWobble

        // Realistic writing dynamics
        const time = p * estimatedChars * 0.5
        // Pen pauses slightly at end of words (simulate thinking)
        const isWordBoundary = charInLine > 0 && charInLine % 5 === 0 && inChar < 0.2
        const pauseOffset = isWordBoundary ? Math.sin(inChar * Math.PI * 5) * 0.5 : 0

        // Hand tremor - more pronounced in handwriting
        const tremorX = Math.sin(time * 11.3) * 0.6 + Math.cos(time * 17.8) * 0.3
        const tremorY = Math.cos(time * 13.5) * 0.5 + Math.sin(time * 19.2) * 0.25
        const breathing = Math.sin(p * Math.PI * 1.5) * 0.8

        // Pressure varies with writing - heavier on downstrokes
        const pressurePhase = charPosInLine * 0.7
        const pressure = 0.4 + Math.sin(pressurePhase) * 0.3 + Math.cos(pressurePhase * 1.5) * 0.15
        const pressureY = pressure * 1.2

        x += tremorX + pauseOffset
        y += tremorY + breathing + pressureY

        // Rotation: follows writing direction, tilts with cursive flow
        const baseAngle = isRight ? -16 : 16
        const writingAngle = writingDir * 3
        const cursiveTilt = Math.sin(charPosInLine * 0.5) * 3 * writingDir
        const naturalWobble = Math.sin(time * 2.8) * 1.8 + Math.cos(time * 5.5) * 1
        const angle = baseAngle + writingAngle + cursiveTilt + naturalWobble

        // Pen lift between words (brief)
        const isLifting = isWordBoundary && inChar < 0.15
        const liftY = isLifting ? -6 * Math.sin((inChar / 0.15) * Math.PI) : 0

        return {
          active: true,
          x: Math.round(x * 10) / 10,
          y: Math.round((y + liftY) * 10) / 10,
          angle: Math.round(angle * 10) / 10,
          opacity: 1,
          style,
          side,
          pressing: !isLifting,
        }
      } else {
        // Realistic drawing for non-text elements (images, shapes)
        // Determine lines based on element height - more lines for taller elements
        const lines = Math.max(2, Math.min(9, Math.round(el.h / 28)))
        const totalProgress = easedP * lines
        const lineIdx = Math.min(lines - 1, Math.floor(totalProgress))
        const inLineRaw = totalProgress - lineIdx
        
        // Natural writing speed variation: slower at line start/end, faster in middle
        const inLine = inLineRaw < 0.15 
          ? inLineRaw * inLineRaw * 4.44
          : inLineRaw > 0.85
          ? 1 - Math.pow(1 - inLineRaw, 2) * 2.5
          : inLineRaw

        const isEven = lineIdx % 2 === 0
        const direction = isRight ? (isEven ? 1 : -1) : (isEven ? -1 : 1)
        const u = direction === 1 ? inLine : 1 - inLine

        const padX = 10
        const padY = 8
        const wSpan = Math.max(20, el.w - padX * 2)
        const hSpan = Math.max(16, el.h - padY * 2)
        const lineHeight = hSpan / lines

        let x = el.x + padX + u * wSpan
        let y = el.y + padY + lineIdx * lineHeight + inLine * lineHeight * 0.7

        const time = p * lines * 2
        const curveY = Math.sin(u * Math.PI * 1.2) * 4 * (direction === 1 ? 1 : -1)
        const tremorX = Math.sin(time * 12.7) * 0.8 + Math.cos(time * 19.3) * 0.4
        const tremorY = Math.cos(time * 14.2) * 0.6 + Math.sin(time * 22.1) * 0.3
        const breathing = Math.sin(p * Math.PI * 2 * 0.8) * 1.2

        const pressure = 0.5 + Math.sin(u * Math.PI * 3) * 0.3 + Math.sin(time * 5) * 0.15
        const pressureY = pressure * 1.5

        x += tremorX
        y += curveY + tremorY + breathing + pressureY

        const baseAngle = isRight ? -18 : 18
        const dirAngle = direction * 6
        const curveAngle = Math.sin(u * Math.PI) * 4 * direction
        const naturalWobble = Math.sin(time * 3.5) * 2.5 + Math.cos(time * 7.2) * 1.2
        const angle = baseAngle + dirAngle + curveAngle + naturalWobble

        const isLifting = (inLineRaw < 0.08 || inLineRaw > 0.92) && lines > 1
        const liftY = isLifting ? -8 * Math.sin((inLineRaw < 0.5 ? inLineRaw : 1 - inLineRaw) * Math.PI * 12.5) : 0

        return {
          active: true,
          x: Math.round((x) * 10) / 10,
          y: Math.round((y + liftY) * 10) / 10,
          angle: Math.round(angle * 10) / 10,
          opacity: 1,
          style,
          side,
          pressing: !isLifting,
        }
      }
    }

    if (wb.effect === 'push') {
      // Realistic push: hand enters from side, makes contact, pushes with follow-through
      // Three phases: approach (0-0.2), contact & push (0.2-0.8), follow-through (0.8-1)
      
      let x, y, angle, pressing
      
      if (p < 0.2) {
        // Approach phase - hand moves in from off-screen
        const approachP = p / 0.2
        const eased = easeOutBack(approachP)
        const startOffset = 200
        const targetX = isRight ? el.x + el.w + 5 : el.x - 5
        x = isRight ? targetX + startOffset * (1 - eased) : targetX - startOffset * (1 - eased)
        y = el.y + el.h * 0.5 + Math.sin(approachP * Math.PI) * 8
        angle = (isRight ? -8 : 8) + Math.sin(approachP * Math.PI) * 4
        pressing = false
      } else if (p < 0.85) {
        // Push phase - hand in contact, pushing element
        const pushP = (p - 0.2) / 0.65
        const eased = humanEase(pushP)
        // Element moves from offset to final position, hand follows its edge
        const pushDistance = 120 * (1 - eased)
        const targetEdgeX = isRight ? el.x + el.w + pushDistance * 0.3 : el.x - pushDistance * 0.3
        x = targetEdgeX + (isRight ? 8 : -8)
        // Slight vertical variation as if pushing with effort
        y = el.y + el.h * 0.5 + Math.sin(pushP * Math.PI * 2) * 2
        angle = (isRight ? -6 : 6) + Math.sin(pushP * Math.PI * 3) * 2.5
        pressing = true
      } else {
        // Follow-through - hand continues slightly past, then settles
        const followP = (p - 0.85) / 0.15
        x = isRight ? el.x + el.w + 8 + followP * 15 : el.x - 8 - followP * 15
        y = el.y + el.h * 0.5 + followP * 10
        angle = (isRight ? -12 : 12) * (1 - followP * 0.5)
        pressing = followP < 0.5
      }

      return {
        active: true,
        x: Math.round(x),
        y: Math.round(y),
        angle,
        opacity: 1,
        style,
        side,
        pressing,
      }
    }

    if (wb.effect === 'erase') {
      // Realistic erasing: overlapping scrubbing strokes with varying pressure
      const scrubLines = Math.max(3, Math.round(el.h / 35))
      const scrubProgress = p * scrubLines
      const lineIdx = Math.floor(scrubProgress)
      const inLine = scrubProgress - lineIdx

      // Scrubbing motion: fast back-and-forth
      const scrubFreq = 3.5 // scrubs per line
      const scrubPhase = inLine * scrubFreq * Math.PI * 2
      const scrubX = Math.sin(scrubPhase) * (el.w * 0.42)
      
      // Add secondary wobble for realism
      const wobbleX = Math.cos(scrubPhase * 1.7) * el.w * 0.08
      const wobbleY = Math.sin(scrubPhase * 2.3) * 3

      const baseX = el.x + el.w / 2
      const baseY = el.y + (lineIdx + inLine) * (el.h / scrubLines)

      const x = baseX + scrubX + wobbleX
      const y = baseY + wobbleY

      // Angle varies with scrub direction - hand tilts into scrub
      const scrubDir = Math.cos(scrubPhase)
      const angle = scrubDir * 12 + Math.sin(scrubProgress * 2) * 3

      // Pressure varies - harder in middle of scrub, lighter at edges
      const pressure = 0.3 + Math.abs(Math.sin(scrubPhase)) * 0.7
      const pressing = pressure > 0.4

      return {
        active: true,
        x: Math.round(x),
        y: Math.round(y),
        angle,
        opacity: 1,
        style: 'eraser',
        side,
        pressing,
      }
    }
  }

  // Post-roll: hand lifts and exits with natural arc
  const exitDuration = 320
  if (localT > duration && localT <= duration + exitDuration) {
    const exitP = (localT - duration) / exitDuration

    // Lift up slightly first, then arc out
    const liftPhase = exitP < 0.3 ? exitP / 0.3 : 1
    const arcPhase = exitP < 0.3 ? 0 : (exitP - 0.3) / 0.7

    const lastX = isRight ? el.x + el.w * 0.85 : el.x + el.w * 0.15
    const lastY = el.y + el.h * 0.85

    const liftY = -25 * Math.sin(liftPhase * Math.PI * 0.5)
    const arcX = (isRight ? 1 : -1) * arcPhase * 110
    const arcY = arcPhase * 140 + Math.sin(arcPhase * Math.PI) * 15

    // Fade out in last 40%
    const opacity = exitP > 0.6 ? 1 - (exitP - 0.6) / 0.4 : 1

    return {
      active: true,
      x: lastX + arcX,
      y: lastY + liftY + arcY,
      angle: (isRight ? -18 : 18) * (1 - arcPhase) + arcPhase * (isRight ? -28 : 28),
      opacity: Math.max(0, opacity),
      style,
      side,
      pressing: false,
    }
  }

  return null
}
