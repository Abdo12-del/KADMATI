/**
 * Migration: legacy per-element `animation` (CSS-class entrance specs) → the
 * new data-driven `slide.animations`. Runs inside normalizePresentation(), so
 * old documents keep working through the new engine without data loss.
 */
import type { AnimationSpec, Slide } from '../document/types'
import { presetById, type PresetDef } from './presets'
import type { AnimSpec } from './types'

const ENTER_TO_PRESET: Record<string, string> = {
  fade: 'fade-in',
  appear: 'fade-in',
  slide: 'slide-in-bottom',
  zoom: 'zoom-in',
  scale: 'zoom-in',
}

const DIR_TO_SLIDE_PRESET: Record<string, string> = {
  left: 'slide-in-left',
  right: 'slide-in-right',
  top: 'slide-in-top',
  bottom: 'slide-in-bottom',
}

export function legacyToAnim(legacy: AnimationSpec, target: string, staggerIndex: number): AnimSpec {
  const def: PresetDef | undefined = legacy.enter === 'slide' ? presetById(DIR_TO_SLIDE_PRESET[legacy.direction ?? 'bottom'] ?? 'slide-in-bottom') : presetById(ENTER_TO_PRESET[legacy.enter] ?? 'fade-in')
  if (!def) return presetById('fade-in')!.make(target)
  return def.make(target, {
    delay: (legacy.delay ?? 0) + staggerIndex * 90, // same stagger the old CSS path used
    duration: legacy.duration ?? 500,
  })
}

/**
 * Mutates the slide in place (callers normalize into a fresh document):
 * converts every legacy element.animation into a slide-level AnimSpec and
 * removes the legacy field.
 */
export function migrateSlideAnimations(slide: Slide): void {
  let migrated = 0
  let staggerIndex = 0
  for (const el of slide.elements) {
    const legacy = (el as { animation?: AnimationSpec }).animation
    if (!legacy || legacy.enter === 'none') continue
    const spec = legacyToAnim(legacy, el.id, staggerIndex)
    staggerIndex += 1
    if (!slide.animations) slide.animations = []
    slide.animations.push(spec)
    delete (el as { animation?: AnimationSpec }).animation
    migrated += 1
  }
  void migrated
}
