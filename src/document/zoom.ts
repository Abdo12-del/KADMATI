/**
 * Zoom Navigation — the data model and the pure transition math.
 *
 * A zoom is a *navigation relationship*, not an element animation:
 *   source slide → trigger element → target slide
 *
 * Storage: `ZoomLink` lives ON the trigger element (`ElementBase.zoom`), next to the
 * existing `link` field. That single decision buys us, for free:
 *  - undo/redo (the doc is the history unit),
 *  - copy/paste/duplicate (the link travels with its element, with a fresh element id),
 *  - reorder safety (targets are addressed by slideId, never by index),
 *  - deletion semantics (deleting the trigger deletes the link; deleting the target
 *    leaves a detectable dangling link we surface as "broken" instead of crashing).
 *
 * The `type: 'zoomNavigation'` relationship view requested by the product spec is
 * derived on demand by `collectZoomEdges()` — no parallel registry that can desync.
 *
 * This file is pure: no React, no DOM, no store. Everything in it is unit-testable.
 */
import type { AnyElement, Presentation, Slide } from './types'

/* ------------------------------------------------------------------ types */

/** Which slide (or, in the future, section) a zoom leads to. */
export type ZoomTarget = { kind: 'slide'; slideId: string } | { kind: 'section'; sectionId: string }

export type ZoomTransition = 'zoom' | 'zoomFade' | 'deepZoom' | 'cinematic'

export type ZoomEasing = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'cubic' | 'smooth'

export type ZoomOrigin = 'center' | 'element' | 'click' | 'custom'

export interface ZoomEffects {
  /** fade the outgoing slide while diving in */
  backgroundFade: boolean
  /** push the outgoing slide back (scale it up as the camera dives past it) */
  depth: boolean
  /** blur the outgoing slide at the peak of the dive */
  blur: boolean
  /** scale the outgoing slide (combined with depth for the dolly feel) */
  scale: boolean
  /** soft drop shadow on the incoming slide card */
  softShadow: boolean
}

export interface ZoomLink {
  /** stable id for the relationship (survives element duplication via fresh ids) */
  id: string
  target: ZoomTarget
  transition: ZoomTransition
  /** ms */
  duration: number
  easing: ZoomEasing
  origin: ZoomOrigin
  /** design-px point, used when origin === 'custom' (or resolved 'click') */
  customOrigin?: { x: number; y: number }
  /** zoom back out to the source when the visitor goes back */
  returnToSource: boolean
  effects: ZoomEffects
}

/**
 * The relationship view: source slide + trigger element + target slide.
 * `status` tells the UI/runtime whether the edge is playable.
 */
export interface ZoomEdge {
  type: 'zoomNavigation'
  id: string
  sourceSlideId: string
  triggerElementId: string
  target: ZoomTarget
  link: ZoomLink
  status: 'ok' | 'broken-target' | 'unsupported-section'
}

/* ------------------------------------------------------------------ catalogs (UI + validation share these) */

export const ZOOM_DURATIONS = [300, 500, 700, 900, 1200] as const
export const ZOOM_DURATION_MIN = 150
export const ZOOM_DURATION_MAX = 3000

export const ZOOM_TRANSITIONS: { id: ZoomTransition; label: string; hint: string }[] = [
  { id: 'zoom', label: 'تكبير (Zoom)', hint: 'غوص نظيف نحو الشريحة' },
  { id: 'zoomFade', label: 'تكبير + تلاشٍ', hint: 'أنعم — تلاشي أثناء الغوص' },
  { id: 'deepZoom', label: 'غوص عميق', hint: 'من بعيد — للقفزات الكبيرة' },
  { id: 'cinematic', label: 'سينمائي', hint: 'عمق + تمويه + ظل — باعتدال' },
]

export const ZOOM_EASINGS: { id: ZoomEasing; label: string }[] = [
  { id: 'linear', label: 'خطي (Linear)' },
  { id: 'easeIn', label: 'تسارع (Ease In)' },
  { id: 'easeOut', label: 'تباطؤ (Ease Out)' },
  { id: 'easeInOut', label: 'ناعم (Ease In-Out)' },
  { id: 'cubic', label: 'مكعب (Cubic)' },
  { id: 'smooth', label: 'حريري (Smooth)' },
]

export const ZOOM_ORIGINS: { id: ZoomOrigin; label: string; hint: string }[] = [
  { id: 'element', label: 'مركز العنصر', hint: 'الزوم يبدأ من البطاقة المضغوطة (موصى به)' },
  { id: 'center', label: 'مركز الشريحة', hint: 'غوص متماثل من الوسط' },
  { id: 'click', label: 'موضع النقر', hint: 'من النقطة التي ضغطها المشاهد' },
  { id: 'custom', label: 'مخصص', hint: 'نقطة ثابتة تُحدد بالإحداثيات' },
]

/** WAAPI/CSS easing string for each zoom easing (mirrors the engine's named curves). */
export const ZOOM_EASING_CSS: Record<ZoomEasing, string> = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
  easeOut: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
  easeInOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
  cubic: 'cubic-bezier(0.77, 0, 0.175, 1)',
  smooth: 'cubic-bezier(0.445, 0.05, 0.55, 0.95)',
}

/** Zoom easing → the animation engine's EasingName (shared vocabulary, one feel). */
export const ZOOM_EASING_ENGINE: Record<ZoomEasing, string> = {
  linear: 'linear',
  easeIn: 'cubicIn',
  easeOut: 'cubicOut',
  easeInOut: 'cubicInOut',
  cubic: 'quartInOut',
  smooth: 'sineInOut',
}

/* ------------------------------------------------------------------ factory + normalize */

let zoomSeq = 0

export function newZoomId(): string {
  zoomSeq += 1
  return `zoom_${Date.now().toString(36)}_${zoomSeq.toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export function defaultZoomEffects(): ZoomEffects {
  return { backgroundFade: true, depth: true, blur: false, scale: true, softShadow: true }
}

export function createZoomLink(targetSlideId: string, over: Partial<ZoomLink> = {}): ZoomLink {
  return {
    id: over.id ?? newZoomId(),
    target: over.target ?? { kind: 'slide', slideId: targetSlideId },
    transition: over.transition ?? 'zoom',
    duration: clampDuration(over.duration ?? 900),
    easing: over.easing ?? 'easeInOut',
    origin: over.origin ?? 'element',
    customOrigin: over.customOrigin,
    returnToSource: over.returnToSource ?? true,
    effects: { ...defaultZoomEffects(), ...(over.effects ?? {}) },
  }
}

/**
 * Defensive pass for loaded/imported documents. Repairs shapes and clamps values;
 * NEVER drops a dangling targetSlideId — that is a *broken link* the UI must surface,
 * not corrupt data to silently delete.
 */
export function normalizeZoomLink(raw: unknown): ZoomLink | null {
  if (!raw || typeof raw !== 'object') return null
  const z = raw as Partial<ZoomLink>
  const target = z.target as ZoomTarget | undefined
  if (!target || (target.kind !== 'slide' && target.kind !== 'section')) return null
  if (target.kind === 'slide' && typeof target.slideId !== 'string') return null
  if (target.kind === 'section' && typeof (target as { sectionId?: unknown }).sectionId !== 'string') return null
  const pick = <T extends string>(v: unknown, ids: readonly T[], fallback: T): T =>
    ids.includes(v as T) ? (v as T) : fallback
  const fx = (z.effects ?? {}) as Partial<ZoomEffects>
  const customOrigin =
    z.customOrigin && isFinite(z.customOrigin.x) && isFinite(z.customOrigin.y)
      ? { x: z.customOrigin.x, y: z.customOrigin.y }
      : undefined
  return {
    id: typeof z.id === 'string' && z.id ? z.id : newZoomId(),
    target: target.kind === 'slide' ? { kind: 'slide', slideId: target.slideId } : { kind: 'section', sectionId: (target as { sectionId: string }).sectionId },
    transition: pick(z.transition, ZOOM_TRANSITIONS.map((t) => t.id), 'zoom'),
    duration: clampDuration(z.duration ?? 900),
    easing: pick(z.easing, ZOOM_EASINGS.map((e) => e.id), 'easeInOut'),
    origin: pick(z.origin, ZOOM_ORIGINS.map((o) => o.id), 'element'),
    customOrigin,
    returnToSource: z.returnToSource !== false,
    effects: {
      backgroundFade: fx.backgroundFade !== false,
      depth: fx.depth !== false,
      blur: fx.blur === true,
      scale: fx.scale !== false,
      softShadow: fx.softShadow !== false,
    },
  }
}

export function clampDuration(v: number): number {
  if (!isFinite(v)) return 900
  return Math.max(ZOOM_DURATION_MIN, Math.min(ZOOM_DURATION_MAX, Math.round(v)))
}

/* ------------------------------------------------------------------ queries */

export function zoomOf(el: AnyElement | undefined | null): ZoomLink | undefined {
  return el?.zoom
}

/** Resolve a zoom target to a concrete slide id, or null when unplayable. */
export function resolveZoomTarget(doc: Presentation, target: ZoomTarget): string | null {
  if (target.kind === 'section') {
    // No sections system exists yet (by design — see §8 of the spec). The type is
    // forward-compatible; resolution lands the day sections do.
    return null
  }
  return doc.slides.some((s) => s.id === target.slideId) ? target.slideId : null
}

/** Every zoom relationship in the deck, with its playability status. */
export function collectZoomEdges(doc: Presentation): ZoomEdge[] {
  const edges: ZoomEdge[] = []
  for (const slide of doc.slides) {
    for (const el of slide.elements) {
      const link = el.zoom
      if (!link) continue
      const target = link.target
      let status: ZoomEdge['status'] = 'ok'
      if (target.kind === 'section') status = 'unsupported-section'
      else if (!doc.slides.some((s) => s.id === target.slideId)) status = 'broken-target'
      // A zoom pointing at its own slide is a no-op — flag it so the UI can warn.
      if (status === 'ok' && target.kind === 'slide' && target.slideId === slide.id) status = 'broken-target'
      edges.push({
        type: 'zoomNavigation',
        id: link.id,
        sourceSlideId: slide.id,
        triggerElementId: el.id,
        target: link.target,
        link,
        status,
      })
    }
  }
  return edges
}

/** Outgoing zooms of one slide (for the inspector / timeline / map). */
export function zoomsFromSlide(doc: Presentation, slideId: string): ZoomEdge[] {
  return collectZoomEdges(doc).filter((e) => e.sourceSlideId === slideId)
}

/** Incoming zooms of one slide (for the map). */
export function zoomsToSlide(doc: Presentation, slideId: string): ZoomEdge[] {
  return collectZoomEdges(doc).filter(
    (e) => e.status === 'ok' && e.target.kind === 'slide' && e.target.slideId === slideId,
  )
}

export function brokenZoomEdges(doc: Presentation): ZoomEdge[] {
  return collectZoomEdges(doc).filter((e) => e.status !== 'ok')
}

/** Human label: "شريحة 4 — AI Features" (Arabic UI, 1-based number). */
export function slideLabel(doc: Presentation, slideId: string): string {
  const i = doc.slides.findIndex((s) => s.id === slideId)
  if (i < 0) return 'شريحة محذوفة'
  const slide = doc.slides[i]
  const title = slideTitleText(slide) || slide.name
  return title ? `شريحة ${i + 1} — ${title}` : `شريحة ${i + 1}`
}

export function slideIndexOf(doc: Presentation, slideId: string): number {
  return doc.slides.findIndex((s) => s.id === slideId)
}

function slideTitleText(slide: Slide): string {
  const pick = (role: string) =>
    slide.elements.find((el) => el.kind === 'text' && el.role === role) as
      | { content?: string }
      | undefined
  const raw = pick('title')?.content ?? (slide.elements.find((el) => el.kind === 'text') as { content?: string } | undefined)?.content ?? ''
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 42)
}

/* ------------------------------------------------------------------ transition math (pure, tested) */

/**
 * Keyframe plan for one zoom transition between two full-slide layers.
 * Everything is transform/opacity/filter on composited layers — no layout work per frame.
 *
 * - `from` (outgoing): scales UP slightly as the camera dives past it (dolly feel),
 *   optionally fading/blurring.
 * - `to` (incoming): starts small, pinned at the origin point, and grows to full size.
 *   With `transform-origin` at the origin, scaling alone keeps that point fixed (FLIP).
 */
export interface ZoomKeyframePlan {
  from: { transform: [string, string]; opacity: [number, number]; filter: [string, string] }
  to: { transform: [string, string]; opacity: [number, number]; filter: [string, string]; boxShadow: [string, string] }
  /** transform-origin for the incoming layer, design px */
  originPx: { x: number; y: number }
  duration: number
  easing: string
}

export interface ZoomPlanInput {
  link: ZoomLink
  /** design-space size of the stage */
  stage: { w: number; h: number }
  /** trigger element rect in design px (for 'element' origin) */
  trigger?: { x: number; y: number; w: number; h: number }
  /** click point in design px (for 'click' origin) */
  click?: { x: number; y: number }
  /** 'in' = dive to target, 'out' = return to source */
  direction: 'in' | 'out'
}

const TRANSITION_PARAMS: Record<ZoomTransition, { from: number; to: number; peak: number }> = {
  zoom: { from: 0.62, to: 1, peak: 1.06 },
  zoomFade: { from: 0.55, to: 1, peak: 1.05 },
  deepZoom: { from: 0.22, to: 1, peak: 1.22 },
  cinematic: { from: 0.42, to: 1, peak: 1.12 },
}

export function resolveZoomOriginPx(input: Omit<ZoomPlanInput, 'direction' | 'link'> & { link: Pick<ZoomLink, 'origin' | 'customOrigin'> }): { x: number; y: number } {
  const { link, stage, trigger, click } = input
  if (link.origin === 'element' && trigger) {
    return { x: trigger.x + trigger.w / 2, y: trigger.y + trigger.h / 2 }
  }
  if (link.origin === 'click' && click) {
    return { x: clamp(click.x, 0, stage.w), y: clamp(click.y, 0, stage.h) }
  }
  if (link.origin === 'custom' && link.customOrigin) {
    return { x: clamp(link.customOrigin.x, 0, stage.w), y: clamp(link.customOrigin.y, 0, stage.h) }
  }
  return { x: stage.w / 2, y: stage.h / 2 }
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

export function zoomKeyframePlan(input: ZoomPlanInput): ZoomKeyframePlan {
  const { link, stage } = input
  const params = TRANSITION_PARAMS[link.transition]
  const originPx = resolveZoomOriginPx(input)
  const fx = link.effects
  const peak = fx.depth && fx.scale ? params.peak : fx.scale ? 1 + (params.peak - 1) * 0.5 : 1
  const fadeFrom = fx.backgroundFade ? (link.transition === 'cinematic' ? 0.25 : 0.45) : 1
  const fadeTo = link.transition === 'zoomFade' || link.transition === 'cinematic' ? 0 : 1
  const blurPeak = fx.blur || link.transition === 'cinematic' ? (link.transition === 'deepZoom' ? 10 : 6) : 0
  const shadowOn = fx.softShadow && link.transition !== 'zoom'
    ? '0 30px 90px -20px rgba(0,0,0,0.55)'
    : '0 0 0 rgba(0,0,0,0)'

  if (input.direction === 'out') {
    // Return: the current slide shrinks back toward the origin while the source
    // settles from its pushed-back state to rest.
    return {
      from: {
        transform: [`scale(${peak})`, 'scale(1)'],
        opacity: [fadeFrom, 1],
        filter: [`blur(${blurPeak}px)`, 'blur(0px)'],
      },
      to: {
        transform: ['scale(1)', `scale(${params.from})`],
        opacity: [1, fadeTo],
        filter: ['blur(0px)', `blur(${blurPeak / 2}px)`],
        boxShadow: [shadowOn, '0 0 0 rgba(0,0,0,0)'],
      },
      originPx,
      duration: link.duration,
      easing: ZOOM_EASING_CSS[link.easing],
    }
  }

  void stage
  return {
    from: {
      transform: ['scale(1)', `scale(${peak})`],
      opacity: [1, fadeFrom],
      filter: ['blur(0px)', `blur(${blurPeak}px)`],
    },
    to: {
      transform: [`scale(${params.from})`, 'scale(1)'],
      opacity: [fadeTo, 1],
      filter: [`blur(${blurPeak / 2}px)`, 'blur(0px)'],
      boxShadow: ['0 0 0 rgba(0,0,0,0)', shadowOn],
    },
    originPx,
    duration: link.duration,
    easing: ZOOM_EASING_CSS[link.easing],
  }
}

/* ------------------------------------------------------------------ compatibility */

const COMPATIBLE_KINDS = new Set(['text', 'image', 'shape', 'icon', 'svg', 'table', 'chart', 'video', 'frame'])

/** Every element kind can trigger a zoom except raw connectors (`line`). */
export function canTriggerZoom(el: AnyElement): boolean {
  return COMPATIBLE_KINDS.has(el.kind)
}

/** Elements that behave as one trigger (same gid group, or the element itself). */
export function triggerGroup(slide: Slide, elementId: string): AnyElement[] {
  const el = slide.elements.find((e) => e.id === elementId)
  if (!el) return []
  if (!el.gid) return [el]
  return slide.elements.filter((e) => e.gid === el.gid)
}
