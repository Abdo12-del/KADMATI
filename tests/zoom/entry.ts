/** Everything the zoom-navigation tests need, re-exported from one bundle-able entry. */
export {
  brokenZoomEdges,
  canTriggerZoom,
  clampDuration,
  collectZoomEdges,
  createZoomLink,
  defaultZoomEffects,
  newZoomId,
  normalizeZoomLink,
  resolveZoomOriginPx,
  resolveZoomTarget,
  slideIndexOf,
  slideLabel,
  triggerGroup,
  ZOOM_DURATION_MAX,
  ZOOM_DURATION_MIN,
  ZOOM_DURATIONS,
  ZOOM_EASING_CSS,
  zoomKeyframePlan,
  zoomsFromSlide,
  zoomsToSlide,
} from '../../src/document/zoom'
export { cloneElement, createPresentation, normalizeElement, normalizePresentation } from '../../src/document/factory'
export { elementText, plainText, slideTitleText, suggestZoomLinks } from '../../src/services/ai/zoomSuggest'
