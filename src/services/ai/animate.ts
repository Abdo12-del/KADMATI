/**
 * Animation suggestions — slide structure decides the motion, never randomness.
 *
 * Uses the REAL animation engine's preset factories (`animation/presets.ts`), so every suggested
 * spec is a normal AnimSpec the user can edit in the Timeline afterwards. Mapping is by layout
 * semantics: covers get presence, statistics/timelines get staggered rises, quotes get a blur.
 */
import { presetById } from '../../animation/presets'
import type { AnimSpec } from '../../animation/types'
import type { Slide } from '../../document/types'

type Recipe = { preset: string; duration?: number; delay?: number; stagger?: number }

/** layoutId → recipe. Roles inside the layout order the stagger. */
const BY_LAYOUT: Record<string, Recipe> = {
  title: { preset: 'zoom-in', duration: 700, stagger: 180 },
  'title-centered': { preset: 'zoom-in', duration: 700, stagger: 180 },
  section: { preset: 'fade-in', duration: 600, stagger: 150 },
  statistics: { preset: 'slide-in-bottom', duration: 600, stagger: 140 },
  process: { preset: 'slide-in-bottom', duration: 550, stagger: 110 },
  timeline: { preset: 'slide-in-bottom', duration: 550, stagger: 130 },
  comparison: { preset: 'fade-in', duration: 650, stagger: 220 },
  chart: { preset: 'fade-in', duration: 700, stagger: 200 },
  table: { preset: 'fade-in', duration: 600, stagger: 160 },
  quote: { preset: 'blur-in', duration: 800, stagger: 200 },
  'image-text': { preset: 'slide-in-right', duration: 650, stagger: 160 },
  'title-content': { preset: 'slide-in-bottom', duration: 600, stagger: 140 },
  closing: { preset: 'fade-in', duration: 700, stagger: 200 },
}

/**
 * Build entrance animations for a slide's elements. Elements hidden or decorative faint
 * (gradients/backgrounds) are skipped so the motion reads clean, not busy.
 */
export function suggestSlideAnimations(slide: Slide): AnimSpec[] {
  const recipe = BY_LAYOUT[slide.layoutId] ?? BY_LAYOUT['title-content']
  const preset = presetById(recipe.preset)
  if (!preset) return []

  const targets = slide.elements
    .filter((el) => el.visible && !(el.kind === 'shape' && el.name === 'تدرّج'))
    .filter((el) => {
      // Keep the stage calm: one motion per content block, decorations pop with their group.
      if (el.role === 'decoration' && el.w >= 1200) return false
      return true
    })

  const specs: AnimSpec[] = []
  const baseStagger = recipe.stagger ?? 120
  const duration = recipe.duration ?? 600
  // Adaptive stagger: the whole choreography stays under ~2.2s no matter how many elements live
  // on the slide — an entrance performs, it does not linger.
  const stagger = targets.length > 1 ? Math.max(50, Math.min(baseStagger, (2200 - duration) / (targets.length - 1))) : baseStagger
  let delay = 0
  for (const el of targets) {
    const spec = preset.make(el.id, {
      delay,
      duration,
    })
    spec.kind = 'entrance'
    spec.start = 'with'
    specs.push(spec)
    delay += stagger
  }
  // Cap total choreography at ~2.2s — a presentation enters, it does not perform.
  return specs
}

/** Human label for the suggestion (shown in the toast). */
export function animationSummary(layoutId: string): string {
  const names: Record<string, string> = {
    title: 'Fade + Zoom',
    'title-centered': 'Fade + Zoom',
    section: 'Fade',
    statistics: 'Rise + Stagger',
    process: 'Rise + Stagger',
    timeline: 'Rise + Stagger',
    comparison: 'Fade reveal',
    chart: 'Fade + Grow',
    table: 'Fade reveal',
    quote: 'Blur in',
    'image-text': 'Slide + Stagger',
    'title-content': 'Rise + Stagger',
    closing: 'Fade',
  }
  return names[layoutId] ?? 'Rise + Stagger'
}
