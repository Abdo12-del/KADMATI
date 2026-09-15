/**
 * Presentation scheduling — turns the per-spec `start` trigger
 * (onClick / with / after) into absolute delays and click groups, the way
 * PowerPoint's animation pane does.
 *
 *  - onClick  → starts a new click group (advance on click/space/arrows)
 *  - after    → starts after the previous animation finishes (+ its own delay)
 *  - with     → starts together with the click group (+ its own delay)
 *
 * Infinite repeats are ignored when computing group end times, so a looping
 * emphasis never blocks later animations.
 */
import type { AnimSpec } from './types'
import { finiteSpan } from './types'

export interface ScheduledAnim {
  spec: AnimSpec
  /** absolute delay to feed the engine */
  absDelay: number
  /** click group index (0 = plays immediately on slide enter) */
  group: number
}

export interface Schedule {
  items: ScheduledAnim[]
  /** start time of each click group (ms) */
  groupStarts: number[]
  /** end time of each click group (ms; Infinity when the group contains an infinitely looping anim) */
  groupEnds: number[]
}

export function scheduleAnims(raw: AnimSpec[]): Schedule {
  const items: ScheduledAnim[] = []
  const groupStarts: number[] = [0]
  const groupEnds: number[] = [0]
  const groupInfinite: boolean[] = [false]
  let group = 0
  let groupBase = 0
  let groupEnd = 0 // finite end — infinite anims never block later groups
  let finiteEnd = 0

  raw.forEach((spec, i) => {
    const start = spec.start ?? 'with'
    const delay = Math.max(0, spec.delay)
    let abs: number
    if (start === 'onClick' && i > 0) {
      group += 1
      groupBase = finiteEnd
      groupStarts.push(groupBase)
      groupEnds.push(finiteEnd)
      groupInfinite.push(false)
      groupEnd = finiteEnd
      abs = groupBase + delay
    } else if (start === 'after') {
      abs = finiteEnd + delay
    } else {
      // with previous (or the first animation)
      abs = groupBase + delay
    }
    if (spec.repeat === -1) {
      groupInfinite[group] = true
    } else {
      const end = abs + finiteSpan(spec)
      groupEnd = Math.max(groupEnd, end)
      finiteEnd = Math.max(finiteEnd, end)
    }
    groupEnds[group] = groupInfinite[group] ? Infinity : groupEnd
    items.push({ spec: { ...spec, delay: Math.round(abs) }, absDelay: Math.round(abs), group })
  })

  return {
    items,
    groupStarts: groupStarts.map(Math.round),
    groupEnds: groupEnds.map((e) => (e === Infinity ? Infinity : Math.round(e))),
  }
}

/** Continuous (editor/quick-preview) scheduling: click groups collapse, delays kept as authored. */
export function continuousSpecs(raw: AnimSpec[]): AnimSpec[] {
  return raw.map((s) => ({ ...s }))
}
