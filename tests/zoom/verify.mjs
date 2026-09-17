/**
 * Zoom navigation tests (Node, no DOM).
 *
 * Covers the zoom data model (src/document/zoom.ts), its normalization in the
 * document factory, the pure keyframe math, and the local AI suggester. The
 * harness runs the real source modules through esbuild — no re-implementation —
 * so a regression in `src/` fails here.
 *
 * Run: node tests/zoom/build.mjs && node tests/zoom/verify.mjs
 */
const Z = await import('../../.tmp-verify/zoom-test.mjs')

let passed = 0
let failed = 0
function check(name, ok, detail = '') {
  if (ok) {
    passed++
    console.log(`  ✓ ${name}`)
  } else {
    failed++
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

/* ------------------------------------------------------------------ fixtures */

let seq = 0
const el = (kind, name, extra = {}) => ({
  id: `e${++seq}`,
  kind,
  name,
  x: 100,
  y: 100,
  w: 200,
  h: 100,
  rotation: 0,
  opacity: 1,
  visible: true,
  locked: false,
  ...extra,
})
const text = (name, content, fontSize = 24, extra = {}) =>
  el('text', name, { content, font: { fontSize }, ...extra })
const shape = (name, extra = {}) => el('shape', name, { shape: 'rect', ...extra })

/** Minimal but honest Presentation: real ids, real element shapes. */
function deck() {
  const agenda1 = text('بند النتائج', '<p>النتائج المالية</p>')
  const agenda2 = text('بند الخطة', '<p>خطة العمل</p>')
  const cta = text('زر البدء', '<p>ابدأ العرض</p>')
  const s1 = { id: 's1', name: 'المحتويات', hidden: false, elements: [agenda1, agenda2, cta] }
  const s2 = {
    id: 's2',
    name: '',
    hidden: false,
    elements: [text('عنوان النتائج', '<p>النتائج المالية</p>', 48), shape('مربع')],
  }
  const s3 = {
    id: 's3',
    name: '',
    hidden: false,
    elements: [text('عنوان الخطة', '<p>خطة العمل للربع القادم</p>', 48), text('زر الرئيسية', '<p>الرئيسية</p>')],
  }
  const s4 = { id: 's4', name: 'ملحق', hidden: true, elements: [text('عنوان الملحق', '<p>ملحق</p>', 40)] }
  const doc = { size: { w: 1280, h: 720 }, slides: [s1, s2, s3, s4], theme: {}, metadata: {} }
  return { doc, s1, s2, s3, s4, agenda1, agenda2, cta }
}

/* ------------------------------------------------------------------ factory */

console.log('factory')
{
  const a = Z.newZoomId()
  const b = Z.newZoomId()
  check('newZoomId unique + zoom_ prefix', a !== b && a.startsWith('zoom_') && b.startsWith('zoom_'))

  const link = Z.createZoomLink('s9')
  check('createZoomLink target', link.target.kind === 'slide' && link.target.slideId === 's9')
  check(
    'createZoomLink defaults',
    link.transition === 'zoom' &&
      link.duration === 900 &&
      link.easing === 'easeInOut' &&
      link.origin === 'element' &&
      link.returnToSource === true &&
      link.effects.backgroundFade === true &&
      link.effects.blur === false,
    JSON.stringify(link),
  )
  const custom = Z.createZoomLink('s9', { duration: 99999, transition: 'cinematic', effects: { blur: true } })
  check('createZoomLink clamps duration', custom.duration === Z.ZOOM_DURATION_MAX, String(custom.duration))
  check('createZoomLink merges effects', custom.effects.blur === true && custom.effects.depth === true)
  check('createZoomLink tiny duration floors', Z.createZoomLink('s9', { duration: 3 }).duration === Z.ZOOM_DURATION_MIN)

  check('clampDuration NaN → 900', Z.clampDuration(NaN) === 900)
  check('clampDuration rounds', Z.clampDuration(901.6) === 902)
  check('durations catalog sane', Z.ZOOM_DURATIONS.includes(900) && Z.ZOOM_DURATION_MIN === 150 && Z.ZOOM_DURATION_MAX === 3000)
}

/* ------------------------------------------------------------------ normalize */

console.log('normalizeZoomLink')
{
  const good = { id: 'z1', target: { kind: 'slide', slideId: 's2' }, transition: 'deepZoom', duration: 901.4, easing: 'linear', origin: 'click', returnToSource: false, effects: {} }
  const n = Z.normalizeZoomLink(good)
  check('valid link kept + duration rounded', n !== null && n.duration === 901 && n.transition === 'deepZoom' && n.returnToSource === false)
  check('effects default true-leaning', n.effects.backgroundFade === true && n.effects.blur === false)

  check('missing target → null', Z.normalizeZoomLink({ id: 'x' }) === null)
  check('slide target without slideId → null', Z.normalizeZoomLink({ target: { kind: 'slide' } }) === null)
  check('unknown target kind → null', Z.normalizeZoomLink({ target: { kind: 'para', id: 'p' } }) === null)
  check('non-object → null', Z.normalizeZoomLink(null) === null && Z.normalizeZoomLink('zoom') === null && Z.normalizeZoomLink(42) === null)
  check('unknown enums fall back (no drop)', (() => {
    const r = Z.normalizeZoomLink({ target: { kind: 'slide', slideId: 's1' }, transition: 'spin', easing: 'bounce', origin: 'moon' })
    return r !== null && r.transition === 'zoom' && r.easing === 'easeInOut' && r.origin === 'element'
  })())
  check('dangling slideId is KEPT (repairable broken link)', (() => {
    const r = Z.normalizeZoomLink({ target: { kind: 'slide', slideId: 'ghost' } })
    return r !== null && r.target.slideId === 'ghost'
  })())
  check('fresh id minted when missing', (() => {
    const r = Z.normalizeZoomLink({ target: { kind: 'slide', slideId: 's1' } })
    return !!r && typeof r.id === 'string' && r.id.startsWith('zoom_')
  })())
  check('customOrigin validated', (() => {
    const ok = Z.normalizeZoomLink({ target: { kind: 'slide', slideId: 's1' }, origin: 'custom', customOrigin: { x: 10, y: 20 } })
    const bad = Z.normalizeZoomLink({ target: { kind: 'slide', slideId: 's1' }, origin: 'custom', customOrigin: { x: NaN, y: 1 } })
    return ok.customOrigin?.x === 10 && bad.customOrigin === undefined
  })())
}

/* ------------------------------------------------------------------ edges */

console.log('edges')
{
  const { doc, s2, agenda1, agenda2, cta } = deck()
  agenda1.zoom = Z.createZoomLink('s2')
  agenda2.zoom = Z.createZoomLink('s3')
  cta.zoom = Z.createZoomLink('s2') // second trigger → same target (multiple links per slide)
  s2.elements[1].zoom = Z.createZoomLink('s2') // self-target
  s2.elements[0].zoom = Z.createZoomLink('ghost') // dangling
  doc.slides[3].elements[0].zoom = Z.createZoomLink('s4') // hidden-target slide hosts a self link too

  const edges = Z.collectZoomEdges(doc)
  check('edge count', edges.length === 6, String(edges.length))
  check('edges carry relationship view', edges.every((e) => e.type === 'zoomNavigation' && e.sourceSlideId && e.triggerElementId && e.link))
  check('multiple triggers per slide', Z.zoomsFromSlide(doc, 's1').length === 3)
  check('broken edges flagged', Z.brokenZoomEdges(doc).length === 3) // self s2 + ghost + self s4
  check('ghost target → broken-target', edges.find((e) => e.triggerElementId === s2.elements[0].id).status === 'broken-target')
  check('self target → broken-target', edges.find((e) => e.triggerElementId === s2.elements[1].id).status === 'broken-target')
  check('dangling link still carries its slideId', edges.find((e) => e.triggerElementId === s2.elements[0].id).target.slideId === 'ghost')

  // section targets resolve to "unsupported", never crash
  agenda1.zoom = Z.createZoomLink('s2', { target: { kind: 'section', sectionId: 'sec1' } })
  const sec = Z.collectZoomEdges(doc).find((e) => e.triggerElementId === agenda1.id)
  check('section target → unsupported-section', sec.status === 'unsupported-section')
  check('section target unresolvable', Z.resolveZoomTarget(doc, { kind: 'section', sectionId: 'sec1' }) === null)
  agenda1.zoom = Z.createZoomLink('s2')

  // hidden slides are valid zoom targets
  cta.zoom = Z.createZoomLink('s4')
  const hiddenEdge = Z.collectZoomEdges(doc).find((e) => e.triggerElementId === cta.id)
  check('hidden target is playable', hiddenEdge.status === 'ok' && Z.resolveZoomTarget(doc, hiddenEdge.target) === 's4')
  check('incoming edges exclude broken', Z.zoomsToSlide(doc, 's2').length === 1)

  // reorder safety: edges are slideId-addressed, never index-addressed
  const before = Z.collectZoomEdges(doc).map((e) => `${e.sourceSlideId}>${e.triggerElementId}>${e.target.kind === 'slide' ? e.target.slideId : 'sec'}:${e.status}`).sort().join('|')
  doc.slides.unshift(doc.slides.pop()) // move s4 first — every index shifts
  const after = Z.collectZoomEdges(doc).map((e) => `${e.sourceSlideId}>${e.triggerElementId}>${e.target.kind === 'slide' ? e.target.slideId : 'sec'}:${e.status}`).sort().join('|')
  check('reorder keeps every edge intact', before === after)

  check('resolveZoomTarget ok', Z.resolveZoomTarget(doc, { kind: 'slide', slideId: 's3' }) === 's3')
  check('resolveZoomTarget missing → null', Z.resolveZoomTarget(doc, { kind: 'slide', slideId: 'nope' }) === null)
}

/* ------------------------------------------------------------------ labels */

console.log('labels')
{
  const { doc } = deck()
  check('label prefers slide title text', Z.slideLabel(doc, 's1') === 'شريحة 1 — النتائج المالية', Z.slideLabel(doc, 's1'))
  check('untitled slide falls back to first text', Z.slideLabel(doc, 's2').startsWith('شريحة 2 — النتائج'), Z.slideLabel(doc, 's2'))
  const named = { size: { w: 1280, h: 720 }, slides: [{ id: 'n', name: 'خاتمة', hidden: false, elements: [] }, { id: 'b', name: '', hidden: false, elements: [] }], theme: {}, metadata: {} }
  check('textless slide falls back to name', Z.slideLabel(named, 'n') === 'شريحة 1 — خاتمة', Z.slideLabel(named, 'n'))
  check('bare slide label is just the number', Z.slideLabel(named, 'b') === 'شريحة 2', Z.slideLabel(named, 'b'))
  check('missing slide label', Z.slideLabel(doc, 'ghost') === 'شريحة محذوفة')
  check('slideIndexOf', Z.slideIndexOf(doc, 's3') === 2 && Z.slideIndexOf(doc, 'ghost') === -1)
}

/* ------------------------------------------------------------------ origins + keyframe math */

console.log('plan math')
{
  const stage = { w: 1280, h: 720 }
  const trig = { x: 100, y: 100, w: 200, h: 100 }
  const o = (origin, extra = {}) => Z.resolveZoomOriginPx({ link: { origin, ...extra }, stage, trigger: trig, click: { x: 10, y: 20 } })
  const elC = o('element')
  check('element origin = trigger center', elC.x === 200 && elC.y === 150, JSON.stringify(elC))
  const ck = o('click')
  check('click origin = click point', ck.x === 10 && ck.y === 20)
  const cc = o('center')
  check('center origin = stage center', cc.x === 640 && cc.y === 360)
  const cu = o('custom', { customOrigin: { x: 5000, y: -5 } })
  check('custom origin clamped to stage', cu.x === 1280 && cu.y === 0, JSON.stringify(cu))
  check('missing trigger falls back to center', Z.resolveZoomOriginPx({ link: { origin: 'element' }, stage }).x === 640)

  const link = Z.createZoomLink('s2', { transition: 'zoom', duration: 900, easing: 'easeInOut' })
  const plan = Z.zoomKeyframePlan({ link, stage, trigger: trig, direction: 'in' })
  check('plan duration + easing passthrough', plan.duration === 900 && plan.easing === Z.ZOOM_EASING_CSS.easeInOut)
  check('incoming grows 0.62 → 1', plan.to.transform[0] === 'scale(0.62)' && plan.to.transform[1] === 'scale(1)', JSON.stringify(plan.to.transform))
  check('outgoing dollies 1 → 1.06', plan.from.transform[1] === 'scale(1.06)', JSON.stringify(plan.from.transform))
  check('default zoom fades outgoing to 0.45', plan.from.opacity[1] === 0.45 && plan.to.opacity[0] === 1)
  check('origin pinned at trigger', plan.originPx.x === 200 && plan.originPx.y === 150)

  const back = Z.zoomKeyframePlan({ link, stage, trigger: trig, direction: 'out' })
  check('return reverses the dive', back.from.transform[0] === 'scale(1.06)' && back.to.transform[1] === 'scale(0.62)')

  const cine = Z.zoomKeyframePlan({ link: Z.createZoomLink('s2', { transition: 'cinematic' }), stage, direction: 'in' })
  check('cinematic dips + shadows', cine.from.opacity[1] === 0.25 && cine.to.boxShadow[1].includes('rgba(0,0,0,0.55)'))
  const deep = Z.zoomKeyframePlan({ link: Z.createZoomLink('s2', { transition: 'deepZoom' }), stage, direction: 'in' })
  check('deepZoom starts far', deep.to.transform[0] === 'scale(0.22)')
}

/* ------------------------------------------------------------------ compatibility + groups */

console.log('triggers')
{
  const { doc, s2 } = deck()
  check('text/shape/image triggerable', Z.canTriggerZoom(text('t', '<p>x</p>')) && Z.canTriggerZoom(shape('s')) && Z.canTriggerZoom(el('image', 'i')))
  check('lines are not triggers', Z.canTriggerZoom(el('line', 'l')) === false)

  const a = shape('ga', { gid: 'g1' })
  const b = text('gb', '<p>y</p>', 16, { gid: 'g1' })
  const solo = shape('solo')
  s2.elements.push(a, b, solo)
  check('group trigger expands to members', Z.triggerGroup(s2, a.id).length === 2 && Z.triggerGroup(s2, b.id).length === 2)
  check('ungrouped trigger is itself', Z.triggerGroup(s2, solo.id).length === 1)
  check('unknown element → empty', Z.triggerGroup(s2, 'nope').length === 0)
  void doc
}

/* ------------------------------------------------------------------ factory normalization */

console.log('factory')
{
  const valid = text('v', '<p>v</p>')
  valid.zoom = { id: '', target: { kind: 'slide', slideId: 's2' }, transition: 'nope', duration: -50, easing: 'linear', origin: 'center', returnToSource: true, effects: {} }
  const out = Z.normalizeElement(valid)
  check('factory repairs link in place', out.zoom.transition === 'zoom' && out.zoom.duration === Z.ZOOM_DURATION_MIN && out.zoom.id.startsWith('zoom_'))

  const invalid = text('i', '<p>i</p>')
  invalid.zoom = { target: { kind: 'slide' } }
  check('factory strips unrepairable link', Z.normalizeElement(invalid).zoom === undefined)

  // full-document normalize keeps the doc playable AND keeps dangling links for repair
  const { doc, agenda1 } = deck()
  doc.theme = Z.createPresentation().theme
  agenda1.zoom = Z.createZoomLink('ghost')
  const norm = Z.normalizePresentation(doc)
  const kept = norm.slides[0].elements.find((e) => e.id === agenda1.id).zoom
  check('presentation normalize keeps dangling link', kept?.target.kind === 'slide' && kept.target.slideId === 'ghost')
}

/* ------------------------------------------------------------------ AI suggester */

console.log('suggester')
{
  check('plainText strips restricted html', Z.plainText('<p>أهلاً<br>بك</p>') === 'أهلاً\nبك', JSON.stringify(Z.plainText('<p>أهلاً<br>بك</p>')))
  const { doc, s1, s2, agenda1, agenda2 } = deck()
  check('slideTitleText picks largest text', Z.slideTitleText(s2) === 'النتائج المالية')
  void s1

  const sug = Z.suggestZoomLinks(doc)
  const byTrigger = new Map(sug.map((s) => [s.elementId, s]))
  check('agenda item → matching slide', byTrigger.get(agenda1.id)?.targetSlideId === 's2', JSON.stringify(byTrigger.get(agenda1.id)))
  check('partial title still matches', byTrigger.get(agenda2.id)?.targetSlideId === 's3')
  check('suggestions never self-target', sug.every((s) => s.slideId !== s.targetSlideId))
  check('sorted by confidence desc', sug.every((s, i) => i === 0 || sug[i - 1].confidence >= s.confidence))
  check('target labels human-readable', sug.every((s) => s.targetLabel.startsWith('شريحة ')))

  // CTA: «الرئيسية» on slide 3 → slide 1
  const home = sug.find((s) => s.elementId === doc.slides[2].elements[1].id)
  check('CTA home → first slide', home?.targetSlideId === 's1' && home.reason === 'cta')

  // already-linked elements are never re-proposed
  agenda1.zoom = Z.createZoomLink('s3')
  const sug2 = Z.suggestZoomLinks(doc)
  check('linked triggers skipped', sug2.every((s) => s.elementId !== agenda1.id))

  // locked / hidden triggers skipped
  agenda2.locked = true
  const sug3 = Z.suggestZoomLinks(doc)
  check('locked triggers skipped', sug3.every((s) => s.elementId !== agenda2.id))

  // gibberish deck → no suggestions (no hallucinated links)
  const empty = { size: { w: 1280, h: 720 }, slides: [{ id: 'a', name: '', hidden: false, elements: [text('x', '<p>لوريم إيبسوم دولار</p>')] }, { id: 'b', name: '', hidden: false, elements: [text('y', '<p>سيت أميت كونسيكتيتور</p>')] }], theme: {}, metadata: {} }
  check('no false positives on unrelated text', Z.suggestZoomLinks(empty).length === 0)
}

/* ------------------------------------------------------------------ summary */

console.log(`\n═══ RESULTS: ${passed} passed, ${failed} failed ═══\n`)
if (failed) process.exit(1)
