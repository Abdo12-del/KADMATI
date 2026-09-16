/**
 * The pen path of a shaped run, read from the glyphs themselves.
 *
 * A clip edge only knows *how far* the ink has advanced; it cannot know *where inside the letter*
 * the pen is. So we rasterise the run once, offscreen, and record — for every column — where the
 * ink actually sits (its mean height) and how much of it there is. The nib then travels along that
 * path instead of gliding on a straight rule at the baseline, and the wrist tilts with the local
 * slope: the letter's own shape drives the hand, which is what a drawn-glyph pipeline gives you
 * and a plain mask cannot.
 *
 * Everything degrades gracefully: no canvas (jsdom, SSR) or an unmeasurable run → `null`, and the
 * caller keeps the straight rule.
 */

export interface InkProfile {
  /** how many columns were sampled across the run */
  n: number
  /** mean ink height per column, in *raster* px relative to the run's pen line (NaN = empty column) */
  mid: number[]
  /** inked fraction of each column, 0..1 (a dot is thin: the pen still passes through it) */
  mass: number[]
  /** the raster's width in px (mid/mass are indexed over `n` columns of this width) */
  width: number
}

/** Cache keyed by font + text: the same slide animates the same words twice. */
const profileCache = new Map<string, InkProfile | null>()
let scratch: HTMLCanvasElement | null | undefined

function scratchCanvas(): HTMLCanvasElement | null {
  if (scratch !== undefined) return scratch
  try {
    scratch = document.createElement('canvas')
  } catch {
    scratch = null
  }
  return scratch
}

/** Drop the cached profiles (fonts can change while a deck is edited). */
export function clearInkProfileCache(): void {
  profileCache.clear()
}

/** Where the pen line sits inside a text run's box — the same 82% the engine uses for `unit.y`. */
export const PEN_LINE_FRAC = 0.82

/**
 * Build the profile of one run. `boxW`/`boxH` are the run's box in whatever px space the caller
 * measures in (the engine passes design px); the returned `mid` is in the *same* space, so callers
 * can add it straight to a pen line.
 */
export function inkProfileFor(text: string, font: string, boxW: number, boxH: number): InkProfile | null {
  const run = text.replace(/\s+/g, ' ').trim()
  if (!run || !(boxW > 0) || !(boxH > 0)) return null
  const key = `${font}|${run}|${Math.round(boxW)}x${Math.round(boxH)}`
  const cached = profileCache.get(key)
  if (cached !== undefined) return cached

  let profile: InkProfile | null = null
  const canvas = scratchCanvas()
  const ctx = canvas?.getContext?.('2d', { willReadFrequently: true }) as CanvasRenderingContext2D | null
  if (canvas && ctx) {
    try {
      const w = Math.max(8, Math.min(600, Math.round(boxW)))
      const h = Math.max(8, Math.min(400, Math.round(boxH * 1.5))) // room for ascenders/descenders
      canvas.width = w
      canvas.height = h
      ctx.clearRect(0, 0, w, h)
      ctx.font = font
      ctx.textBaseline = 'alphabetic'
      ctx.direction = 'inherit'
      ctx.fillStyle = '#000'
      // draw the run as the DOM draws it: RTL text lands right-aligned inside the measured width
      ctx.fillText(run, 0, boxH * PEN_LINE_FRAC)
      const img = ctx.getImageData(0, 0, w, h).data
      const mid: number[] = new Array(w).fill(Number.NaN)
      const mass: number[] = new Array(w).fill(0)
      const penLine = boxH * PEN_LINE_FRAC
      for (let x = 0; x < w; x++) {
        let sum = 0
        let count = 0
        for (let y = 0; y < h; y++) {
          const a = img[(y * w + x) * 4 + 3]
          if (a > 40) {
            sum += y
            count++
          }
        }
        if (count) {
          // mean height relative to the pen line, rescaled from raster px to the caller's px space
          mid[x] = ((sum / count - penLine) * boxW) / w
          mass[x] = Math.min(1, count / h)
        }
      }
      profile = { n: w, mid, mass, width: boxW }
    } catch {
      profile = null
    }
  }
  profileCache.set(key, profile)
  return profile
}

/**
 * The pen's height at `frac` (0..1 of the run already inked, measured from the edge the script
 * starts at) — the one piece of the profile the hand really needs, and the piece worth testing on
 * its own.
 *
 * Empty columns (the gap between «ب» and «ي», the thin tail of «ر») carry the last known height
 * instead of snapping the pen back to the baseline, and the neighbours are averaged so the pen
 * does not jitter column to column.
 */
export function inkHeightAt(profile: InkProfile, frac: number, rtl: boolean): number | null {
  const { n, mid } = profile
  if (!n) return null
  const p = frac < 0 ? 0 : frac > 1 ? 1 : frac
  // RTL runs start inking at their right edge, which is the last raster column
  const col = Math.round(rtl ? (1 - p) * (n - 1) : p * (n - 1))
  const dir = rtl ? -1 : 1
  for (let step = 0; step < n; step++) {
    const i = col + step * dir // walk forwards in the writing direction first
    const j = col - step * dir
    const pick = Number.isFinite(mid[i]) ? i : Number.isFinite(mid[j]) ? j : -1
    if (pick < 0) continue
    let sum = 0
    let count = 0
    for (let k = Math.max(0, pick - 2); k <= Math.min(n - 1, pick + 2); k++) {
      if (!Number.isFinite(mid[k])) continue
      // weight the centre column highest so the average stays honest at letter boundaries
      sum += mid[k] * (k === pick ? 2 : 1)
      count += k === pick ? 2 : 1
    }
    if (!count) continue
    return sum / count
  }
  return null
}

/** Local slope (px of height per px of travel) around `frac`, for the wrist tilt. */
export function inkSlopeAt(profile: InkProfile, frac: number, rtl: boolean, span = 0.06): number {
  const a = inkHeightAt(profile, frac - span, rtl)
  const b = inkHeightAt(profile, frac + span, rtl)
  if (a === null || b === null) return 0
  const dx = ((span * 2 * profile.width) || 1) * (rtl ? -1 : 1)
  return (b - a) / dx
}
