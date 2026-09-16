/**
 * Shared animation-library actions — applying presets/bundles to one or many
 * elements with the multi-selection modes (same / simultaneous / sequence /
 * stagger). Pure store operations; used by both the Right Panel library and
 * the Animation Studio dock.
 */
import { ANIMATION_BUNDLES, presetById } from '../../animation/presets'
import type { AnimSpec } from '../../animation/types'
import type { AnyElement, Slide } from '../../document/types'
import { countWords, textElementPlainText } from '../../document/text'
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

/**
 * Whiteboard "hand drawing" presets reveal an element through a vertical wipe: the ink edge
 * travels down the box. That is exactly right for a shape or a picture, but on a **text**
 * element it reads as a block of paper being uncovered — whole lines get clipped through the
 * middle of their letters, and no hand writes like that.
 *
 * So a drawing preset aimed at text is converted to the ink model text is written with: the
 * words fade in one after another (`text` + stagger, applied per split unit by the engine)
 * and the hand follows the measured positions of those units. The wipe keyframes are dropped
 * with it — they would otherwise clip every unit again.
 *
 * Erasing text is untouched: wiping a whole block away is what an eraser does.
 */
export function adaptSpecToTarget(spec: AnimSpec, el: AnyElement): AnimSpec {
  if (el.kind !== 'text') return spec
  if (spec.whiteboard?.effect !== 'draw' || spec.text) return spec

  const plain = textElementPlainText(el).trim()
  const rtl = el.font?.dir === 'rtl'
  // Arabic (and any connected script) cannot be split per character — the letters would come
  // out in their isolated forms — so RTL text is written word by word.
  const units = rtl ? countWords(plain) || 1 : plain.length || Math.round(el.w / 24)
  const budget = spec.duration * 0.8
  const stagger = rtl
    ? Math.max(90, Math.min(420, Math.round(budget / Math.max(1, units))))
    : Math.max(18, Math.min(120, Math.round(budget / Math.max(1, Math.min(240, units)))))
  delete spec.properties.clip
  delete spec.reveal
  spec.text = { mode: rtl ? 'words' : 'chars', stagger, from: 'start' }
  return spec
}

function makeSpec(presetId: string, target: string, el: AnyElement): AnimSpec {
  const def = presetById(presetId)
  if (!def) throw new Error(`unknown preset ${presetId}`)
  return adaptSpecToTarget(def.make(target, motionOverrides(el, presetId)), el)
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
        const el = s.elements.find((x) => x.id === targetId)
        if (!el) return
        for (const spec of bundle.make(targetId)) {
          adaptSpecToTarget(spec, el) // a whiteboard draw on text is written, not wiped
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
