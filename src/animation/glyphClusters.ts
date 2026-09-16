/**
 * Word → clusters: the units a pen actually draws in a connected script.
 *
 * Arabic is written joined, so the *glyph* is the truth, not the code point: "لا" is two
 * characters but one glyph, and a harakah is a character that owns no advance at all. Inking a
 * word by characters would both slice glyphs and lie about where the pen is.
 *
 * Shaping stays in the browser: the cluster widths come from the canvas `measureText`, which uses
 * the very same shaper that laid the text out in the DOM (`getComputedStyle` gives us the font).
 * The width of cluster k is the difference between the measured widths of the first k+1 characters
 * and the first k — those prefixes telescope, so the cluster widths always add up to the width of
 * the whole word, even though an individual prefix reshapes its last letter.
 *
 * Everything here is failure-tolerant: no canvas, no `Intl.Segmenter`, an unmeasurable font — the
 * functions answer `null`/`[]` and the engine falls back to a single sweep across the word.
 */

/** A cluster's ink can never be thinner than this (design px) — thinner ones merge leftwards. */
const MIN_CLUSTER_PX = 1.5

/** Unicode: a combining mark (harakah) belongs to the cluster in front of it. */
const MARK_RX = /[\p{Mn}\p{Me}]/u
/** Arabic tatweel: a joining filler, not a mark and not a separate stroke. */
const TATWEEL = '\u0640'
/** lam + one of the alef family: always one glyph, even though it is two characters. */
const LIGATURES = new Set(['\u0644\u0622', '\u0644\u0623', '\u0644\u0625', '\u0644\u0627'])

/* ------------------------------------------------------------------ shaping */

type Segmenter = { segment(input: string): Iterable<{ segment: string }> }

/** Grapheme segmentation when the runtime has it (keeps emoji/diacritic runs together). */
function segmenter(): Segmenter | null {
  const Intl_ = (globalThis as { Intl?: { Segmenter?: new (locale?: string, opts?: { granularity: string }) => Segmenter } }).Intl
  if (!Intl_?.Segmenter) return null
  try {
    return new Intl_.Segmenter('ar', { granularity: 'grapheme' })
  } catch {
    return null
  }
}

/**
 * Group a word into clusters, then measure each one by differencing prefix widths.
 *
 * Exposed with an injected `measure` so the grouping logic is testable (and usable) without a
 * canvas — that is what the test suite exercises.
 */
export function clusterWidthsMeasured(word: string, measure: (s: string) => number, minPx = MIN_CLUSTER_PX): number[] {
  if (!word) return []
  // 1. code-point units: a base character plus every mark that follows it; ligatures glued.
  const units: string[] = []
  const segment = segmenter()
  const pieces = segment ? [...segment.segment(word)].map((s) => s.segment) : [...word]
  for (const piece of pieces) {
    const chars = [...piece]
    for (let i = 0; i < chars.length; i++) {
      const c = chars[i]
      const next = chars[i + 1]
      if (next && LIGATURES.has(c + next)) {
        const last = units.length - 1
        // a preceding lam may already have been consumed by the pair
        if (last >= 0 && units[last] === c) units[last] = c + next
        else units.push(c + next)
        i++
        continue
      }
      // a harakah owns no advance, and a tatweel is a joining filler: both belong to the
      // cluster in front of them, so the pen never stops on a sliver
      if ((MARK_RX.test(c) || c === TATWEEL) && units.length) {
        units[units.length - 1] += c
        continue
      }
      units.push(c)
    }
  }
  if (!units.length) return []

  // 2. widths by differencing the measured prefixes (they telescope to the word's width).
  const widths: number[] = []
  let consumed = ''
  let prev = measure('') || 0
  for (const unit of units) {
    consumed += unit
    const next = measure(consumed)
    widths.push(Math.max(0, next - prev))
    prev = next
  }

  // 3. a mark-only cluster (or an unmeasurable sliver) merges into its neighbour, so the pen
  //    never gets a zero-length step to land on.
  const merged: number[] = []
  for (const w of widths) {
    if (w < minPx && merged.length) merged[merged.length - 1] += w
    else merged.push(w)
  }
  return merged
}

/** Per-font measurement caches: shaping is not cheap and a slide animates the same words twice. */
const widthCache = new Map<string, number[] | null>()

let canvasCtx: CanvasRenderingContext2D | null | undefined

function measuringContext(): CanvasRenderingContext2D | null {
  if (canvasCtx !== undefined) return canvasCtx
  try {
    const canvas = document.createElement('canvas')
    canvasCtx = canvas.getContext('2d')
  } catch {
    canvasCtx = null
  }
  return canvasCtx
}

/**
 * Cluster widths (in design px) for one rendered word node, or null when it cannot be measured.
 * `nodeWidth` (the width the DOM actually gave the word) rescales the measurement, which absorbs
 * letter-spacing and font fallbacks.
 */
export function clusterWidthsFor(word: string, font: string, nodeWidth: number): number[] | null {
  const text = word.trim()
  if (!text) return null
  const ctx = measuringContext()
  if (!ctx) return null
  const key = `${font}|${text}`
  let widths = widthCache.get(key)
  if (widths === undefined) {
    try {
      ctx.font = font
      widths = clusterWidthsMeasured(text, (s) => ctx.measureText(s).width, (MIN_CLUSTER_PX * 400) / 100)
    } catch {
      widths = null
    }
    widthCache.set(key, widths)
  }
  if (!widths?.length) return null
  const total = widths.reduce((a, b) => a + b, 0)
  if (!total) return null
  const k = nodeWidth > 0 ? nodeWidth / total : 1
  return widths.map((w) => w * k)
}

/** Font shorthand for canvas measuring, from an element's computed style. */
export function canvasFontOf(style: CSSStyleDeclaration | undefined): string {
  if (!style) return '400 100px sans-serif'
  return `${style.fontStyle || 'normal'} ${style.fontWeight || '400'} ${style.fontSize || '100px'} ${style.fontFamily || 'sans-serif'}`
}

/** Drop every measurement cache — fonts can change while a deck is edited, and a canvas that
 *  was unavailable earlier must not poison later measurements. */
export function clearClusterCache(): void {
  widthCache.clear()
  canvasCtx = undefined
}

/* ------------------------------------------------------------------ motion */

/**
 * How much of a cluster is inked after `within` (0..1) of that cluster's own drawing time.
 *
 * A pen does not cross a letter at a constant speed: it eases out of a join, runs through the
 * stroke and eases into the next one. Blending half `inOutSine` into a linear ramp keeps that
 * breath while staying close enough to linear that a monoline script never looks stuttery.
 *
 * The engine hands this very function to the tween and the hand calls it directly, so the nib
 * and the ink share one curve by construction rather than by two matching constants.
 */
export function glyphInkFraction(within: number): number {
  const t = within < 0 ? 0 : within > 1 ? 1 : within
  const sine = (1 - Math.cos(Math.PI * t)) / 2
  return 0.5 * t + 0.5 * sine
}
