/**
 * Shared animation-library actions — applying presets/bundles to one or many
 * elements with the multi-selection modes (same / simultaneous / sequence /
 * stagger). Pure store operations; used by both the Right Panel library and
 * the Animation Studio dock.
 */
import { ANIMATION_BUNDLES, presetById } from '../../animation/presets'
import type { AnimSpec } from '../../animation/types'
import type { AnyElement, Slide } from '../../document/types'
import { useDoc } from '../../store/useDoc'

export type MultiMode = 'same' | 'simultaneous' | 'sequence' | 'stagger'

export interface ApplyResult {
  ids: string[]
  count: number
}

/** Design-space defaults for motion-path presets (centred on the element). */
function motionOverrides(el: AnyElement, presetId: string): Partial<AnimSpec> {
  const cx = el.x + el.w / 2
  const cy = el.y + el.h / 2
  if (presetId === 'path-circle') return { motionPath: { kind: 'circle', radius: Math.max(60, Math.round(Math.min(el.w, el.h) * 0.9)) } }
  if (presetId === 'path-custom') {
    return {
      motionPath: {
        kind: 'svg',
        d: `M ${cx - 220} ${cy} C ${cx - 90} ${cy - 110}, ${cx + 90} ${cy + 110}, ${cx + 220} ${cy}`,
      },
    }
  }
  if (presetId === 'path-bezier') {
    return {
      motionPath: {
        kind: 'bezier',
        points: [
          { x: cx - 140, y: cy },
          { x: cx - 50, y: cy - 70 },
          { x: cx + 50, y: cy + 70 },
          { x: cx + 140, y: cy },
        ],
      },
    }
  }
  return {}
}

function makeSpec(presetId: string, target: string, el: AnyElement): AnimSpec {
  const def = presetById(presetId)
  if (!def) throw new Error(`unknown preset ${presetId}`)
  return def.make(target, motionOverrides(el, presetId))
}

/**
 * Apply a preset to several targets.
 * - same/simultaneous: every element plays together at its authored delay
 * - sequence: each starts after the previous finishes
 * - stagger: together but offset by `step` ms each
 */
export function applyPreset(presetId: string, targets: string[], mode: MultiMode = 'same', step = 120, slideIdOverride?: string): ApplyResult {
  const store = useDoc.getState()
  const slideId = slideIdOverride ?? store.doc.slides[store.slideIndex]?.id
  const slide: Slide | undefined = store.doc.slides.find((s) => s.id === slideId)
  if (!slideId || !slide || !targets.length) return { ids: [], count: 0 }
  const ids: string[] = []

  store.updateSlide(
    slideId,
    (s) => {
      const list = (s.animations ??= [])
      targets.forEach((targetId, i) => {
        const el = s.elements.find((x) => x.id === targetId)
        if (!el) return
        const spec = makeSpec(presetId, targetId, el)
        if (mode === 'sequence') {
          spec.start = i === 0 ? 'with' : 'after'
          spec.delay = i === 0 ? spec.delay : 0
        } else {
          spec.start = 'with'
          if (mode === 'stagger') spec.delay = spec.delay + i * step
        }
        list.push(spec)
        ids.push(spec.id)
      })
    },
    'تطبيق حركة',
  )
  return { ids, count: ids.length }
}

/** Apply a one-click bundle (Elegant / Dynamic / …) to each target. */
export function applyBundle(bundleId: string, targets: string[], mode: MultiMode = 'same', step = 120): ApplyResult {
  const store = useDoc.getState()
  const slideId = store.doc.slides[store.slideIndex]?.id
  const slide = store.doc.slides.find((s) => s.id === slideId)
  if (!slideId || !slide || !targets.length) return { ids: [], count: 0 }
  const bundle = ANIMATION_BUNDLES.find((b) => b.id === bundleId)
  if (!bundle) return { ids: [], count: 0 }
  const ids: string[] = []
  store.updateSlide(
    slideId,
    (s) => {
      const list = (s.animations ??= [])
      targets.forEach((targetId, i) => {
        if (!s.elements.some((x) => x.id === targetId)) return
        for (const spec of bundle.make(targetId)) {
          spec.id = spec.id // already unique
          if (mode === 'sequence') {
            spec.start = i === 0 ? 'with' : 'after'
            spec.delay = 0
          } else {
            spec.start = 'with'
            if (mode === 'stagger') spec.delay += i * step
          }
          list.push(spec)
          ids.push(spec.id)
        }
      })
    },
    'تطبيق حزمة حركة',
  )
  return { ids, count: ids.length }
}

/** Set the Morph transition on the slide you navigate INTO next (PowerPoint semantics). */
export function enableMorph(duration = 650): boolean {
  const store = useDoc.getState()
  const next = store.doc.slides[store.slideIndex + 1]
  const target = next ?? store.doc.slides[store.slideIndex]
  if (!target) return false
  store.updateSlide(target.id, (s) => void (s.transition = { ...s.transition, type: 'morph', duration }), 'انتقال Morph')
  return true
}
