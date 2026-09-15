/**
 * Cross-slide Morph transition (PowerPoint-Morph style), implemented on top of
 * the same JSON engine — no special renderer.
 *
 * Elements are matched by stable id (duplicate-slide / copy keeps ids), with a
 * name+kind fallback. For every matched pair the incoming element animates
 * from the outgoing element's geometry (position delta, scale, rotation,
 * opacity). Unmatched incoming elements fade/scale in while unmatched outgoing
 * elements fade out. Outgoing targets are prefixed with `old:` so they can
 * share one engine build against two SlideView registries.
 */
import type { AnyElement, Slide } from '../document/types'
import { newAnimId } from './presets'
import type { AnimSpec } from './types'

export const MORPH_OLD_PREFIX = 'old:'

function center(el: AnyElement) {
  return { x: el.x + el.w / 2, y: el.y + el.h / 2, w: el.w, h: el.h, r: el.rotation ?? 0, o: el.opacity ?? 1 }
}

function matchPair(prev: AnyElement[], next: AnyElement[]): Map<string, AnyElement> {
  const map = new Map<string, AnyElement>()
  const byId = new Map(prev.map((el) => [el.id, el]))
  const used = new Set<string>()
  for (const n of next) {
    const byIdEl = byId.get(n.id)
    if (byIdEl) {
      map.set(n.id, byIdEl)
      used.add(byIdEl.id)
      continue
    }
    const fallback = prev.find((p) => !used.has(p.id) && p.kind === n.kind && p.name && p.name === n.name)
    if (fallback) {
      map.set(n.id, fallback)
      used.add(fallback.id)
    }
  }
  return map
}

export function buildMorphSpecs(prev: Slide, next: Slide, duration = 650): AnimSpec[] {
  const specs: AnimSpec[] = []
  const d = Math.max(200, duration)
  const matches = matchPair(prev.elements, next.elements)
  const matchedOld = new Set<string>()

  for (const n of next.elements) {
    if (!n.visible) continue
    const old = matches.get(n.id)
    if (old) {
      matchedOld.add(old.id)
      const a = center(old)
      const b = center(n)
      const dx = a.x - b.x
      const dy = a.y - b.y
      const s = Math.max(0.2, Math.min(5, Math.sqrt((a.w / Math.max(1, b.w)) * (a.h / Math.max(1, b.h)))))
      const dr = a.r - b.r
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(s - 1) < 0.01 && Math.abs(dr) < 0.5 && Math.abs(a.o - b.o) < 0.01) continue
      specs.push({
        id: newAnimId(),
        target: n.id,
        kind: 'custom',
        name: 'Morph',
        presetId: 'morph',
        delay: 0,
        duration: d,
        easing: { type: 'named', name: 'cubicOut' },
        repeat: 0,
        yoyo: false,
        intensity: 1,
        properties: {
          x: [{ t: 0, v: dx }, { t: d, v: 0 }],
          y: [{ t: 0, v: dy }, { t: d, v: 0 }],
          scale: [{ t: 0, v: s }, { t: d, v: 1 }],
          rotation: [{ t: 0, v: dr }, { t: d, v: 0 }],
          opacity: [{ t: 0, v: a.o }, { t: d, v: b.o }],
        },
      })
    } else {
      // unmatched incoming — gentle reveal during the second half
      specs.push({
        id: newAnimId(),
        target: n.id,
        kind: 'custom',
        name: 'Morph Fade',
        presetId: 'morph',
        delay: Math.round(d * 0.3),
        duration: Math.round(d * 0.7),
        easing: { type: 'named', name: 'cubicOut' },
        repeat: 0,
        yoyo: false,
        intensity: 1,
        properties: {
          opacity: [{ t: 0, v: 0 }, { t: Math.round(d * 0.7), v: n.opacity ?? 1 }],
          scale: [{ t: 0, v: 0.985 }, { t: Math.round(d * 0.7), v: 1 }],
        },
      })
    }
  }

  // unmatched outgoing elements fade away (target nodes are prefixed registries)
  for (const o of prev.elements) {
    if (!o.visible || matchedOld.has(o.id)) continue
    specs.push({
      id: newAnimId(),
      target: `${MORPH_OLD_PREFIX}${o.id}`,
      kind: 'custom',
      name: 'Morph Out',
      presetId: 'morph',
      delay: 0,
      duration: Math.round(d * 0.6),
      easing: { type: 'named', name: 'quadIn' },
      repeat: 0,
      yoyo: false,
      intensity: 1,
      properties: {
        opacity: [{ t: 0, v: o.opacity ?? 1 }, { t: Math.round(d * 0.6), v: 0 }],
        scale: [{ t: 0, v: 1 }, { t: Math.round(d * 0.6), v: 1.03 }],
      },
    })
  }

  return specs
}
