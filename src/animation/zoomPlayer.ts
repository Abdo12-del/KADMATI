/**
 * The zoom transition player — a small, purpose-built transition runner, not a second
 * animation engine. It plays ONE thing: the dive between two full-slide layers.
 *
 * Why Web Animations API instead of the anime.js slide engine? The engine compiles
 * per-element keyframes onto registered wrapper nodes; a zoom transition is a single
 * camera move across two slide-sized layers with FLIP origin math. WAAPI gives us
 * compositor-driven transform/opacity/filter with exact durations and a finish promise,
 * in ~120 lines, with zero React re-renders mid-flight. Easing vocabulary is shared
 * with the engine (see ZOOM_EASING_ENGINE).
 *
 * Keyframes themselves are pure (`zoomKeyframePlan`) and unit-tested; this file only
 * applies them to the DOM and reports completion.
 */
import { zoomKeyframePlan, type ZoomPlanInput } from '../document/zoom'

export interface ZoomPlayInput extends ZoomPlanInput {
  /** outgoing (currently visible) slide layer — design-size box */
  fromLayer: HTMLElement
  /** incoming slide layer — design-size box, stacked above */
  toLayer: HTMLElement
  /** abort signal (unmount / user interruption) */
  signal?: AbortSignal
}

export interface ZoomPlayResult {
  finished: boolean
  reason: 'done' | 'aborted' | 'reduced-motion' | 'unsupported'
}

/**
 * Play the zoom. Resolves when the transition completes or is aborted.
 * On abort the layers are left in their FINAL state so the caller can commit
 * the navigation deterministically (no half-zoomed limbo).
 */
export function playZoomTransition(input: ZoomPlayInput): Promise<ZoomPlayResult> {
  const { fromLayer, toLayer, signal } = input
  const plan = zoomKeyframePlan(input)

  if (signal?.aborted) return Promise.resolve({ finished: false, reason: 'aborted' })
  if (prefersReducedMotion() || typeof toLayer.animate !== 'function') {
    applyFinalState(fromLayer, toLayer, plan, input.direction)
    return Promise.resolve({
      finished: true,
      reason: prefersReducedMotion() ? 'reduced-motion' : 'unsupported',
    })
  }

  fromLayer.style.willChange = 'transform, opacity, filter'
  toLayer.style.willChange = 'transform, opacity, filter'
  toLayer.style.transformOrigin = `${plan.originPx.x}px ${plan.originPx.y}px`
  // The outgoing layer scales around the same point so the dive feels directional.
  fromLayer.style.transformOrigin = `${plan.originPx.x}px ${plan.originPx.y}px`

  const timing: KeyframeAnimationOptions = {
    duration: plan.duration,
    easing: plan.easing,
    fill: 'both',
  }

  const fromAnim = fromLayer.animate(
    [
      { transform: plan.from.transform[0], opacity: plan.from.opacity[0], filter: plan.from.filter[0] },
      { transform: plan.from.transform[1], opacity: plan.from.opacity[1], filter: plan.from.filter[1] },
    ],
    timing,
  )
  const toAnim = toLayer.animate(
    [
      {
        transform: plan.to.transform[0],
        opacity: plan.to.opacity[0],
        filter: plan.to.filter[0],
        boxShadow: plan.to.boxShadow[0],
      },
      {
        transform: plan.to.transform[1],
        opacity: plan.to.opacity[1],
        filter: plan.to.filter[1],
        boxShadow: plan.to.boxShadow[1],
      },
    ],
    timing,
  )

  return new Promise<ZoomPlayResult>((resolve) => {
    let settled = false
    const cleanup = () => {
      fromLayer.style.willChange = ''
      toLayer.style.willChange = ''
      signal?.removeEventListener('abort', onAbort)
    }
    const finish = (result: ZoomPlayResult) => {
      if (settled) return
      settled = true
      try {
        fromAnim.cancel()
        toAnim.cancel()
      } catch {
        /* already finished */
      }
      applyFinalState(fromLayer, toLayer, plan, input.direction)
      cleanup()
      resolve(result)
    }
    const onAbort = () => finish({ finished: false, reason: 'aborted' })
    signal?.addEventListener('abort', onAbort, { once: true })
    // Safety net: WAAPI finish events can be dropped when the tab is hidden.
    const watchdog = window.setTimeout(() => finish({ finished: true, reason: 'done' }), plan.duration + 400)
    void toAnim.finished
      .then(() => {
        window.clearTimeout(watchdog)
        finish({ finished: true, reason: 'done' })
      })
      .catch(() => {
        window.clearTimeout(watchdog)
        finish({ finished: false, reason: 'aborted' })
      })
  })
}

/** Commit the end frame as inline style so there is no flash when animations cancel. */
function applyFinalState(
  fromLayer: HTMLElement,
  toLayer: HTMLElement,
  plan: ReturnType<typeof zoomKeyframePlan>,
  direction: 'in' | 'out',
): void {
  // After 'in': incoming owns the frame (identity), outgoing is hidden by the caller.
  // After 'out': roles swap, but the plan already encodes start/end per layer.
  void direction
  fromLayer.style.transform = plan.from.transform[1]
  fromLayer.style.opacity = String(plan.from.opacity[1])
  fromLayer.style.filter = plan.from.filter[1] === 'blur(0px)' ? '' : plan.from.filter[1]
  toLayer.style.transform = plan.to.transform[1]
  toLayer.style.opacity = String(plan.to.opacity[1])
  toLayer.style.filter = plan.to.filter[1] === 'blur(0px)' ? '' : plan.to.filter[1]
  toLayer.style.boxShadow = plan.to.boxShadow[1] === '0 0 0 rgba(0,0,0,0)' ? '' : plan.to.boxShadow[1]
}

function prefersReducedMotion(): boolean {
  try {
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  } catch {
    return false
  }
}
