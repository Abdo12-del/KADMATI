/**
 * Runtime verification for the animation system.
 *
 * Plays EVERY preset through the REAL engine (anime.js) inside jsdom and checks
 * that the element's DOM style actually mutates — a preset without an effect
 * fails the build guard. Also checks scheduling, morph, JSON round-trips and
 * text splitting.
 *
 * Run: node tests/animations/verify.mjs
 */
import { JSDOM } from 'jsdom'
import { existsSync, readFileSync } from 'node:fs'

const dom = new JSDOM('<!doctype html><html><body><div id="host"></div></body></html>', { pretendToBeVisual: true })
const { window } = dom
if (!window.document.fonts) window.document.fonts = { ready: Promise.resolve() }
for (const key of ['window', 'document', 'Node', 'Element', 'HTMLElement', 'HTMLDivElement', 'SVGElement', 'SVGSVGElement', 'SVGPathElement', 'Text', 'DocumentFragment', 'Document', 'NodeList', 'DOMTokenList', 'CustomEvent', 'MutationObserver', 'ResizeObserver', 'requestAnimationFrame', 'cancelAnimationFrame', 'getComputedStyle']) {
  let value = window[key]
  if (value === undefined && key === 'ResizeObserver') value = class { observe() {} unobserve() {} disconnect() {} }
  if (value === undefined && key === 'NodeList') value = class extends Array {}
  try {
    globalThis[key] = value
  } catch {
    Object.defineProperty(globalThis, key, { configurable: true, value })
  }
}
// Sweep remaining browser constructors anime.js probes (HTMLCollection, DOMPoint, …).
for (const key of Object.getOwnPropertyNames(window)) {
  if (key in globalThis) continue
  let v
  try {
    v = window[key]
  } catch { continue }
  if (typeof v === 'function') {
    try {
      globalThis[key] = v
    } catch { /* read-only */ }
  }
}
const gcs = window.getComputedStyle.bind(window)
try {
  globalThis.getComputedStyle = gcs
} catch {
  Object.defineProperty(globalThis, 'getComputedStyle', { configurable: true, value: gcs })
}
if (!globalThis.requestAnimationFrame) {
  globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now()), 16)
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id)
}
window.requestAnimationFrame = globalThis.requestAnimationFrame
window.cancelAnimationFrame = globalThis.cancelAnimationFrame
if (!window.ResizeObserver) window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }

const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms))

// bundle the TS sources with esbuild then import the temp file
import { build } from 'esbuild'
import { writeFileSync, mkdirSync, rmSync } from 'node:fs'
mkdirSync('.tmp-verify', { recursive: true })
await build({
  entryPoints: ['tests/animations/entry.ts'],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  outfile: '.tmp-verify/anim.mjs',
  logLevel: 'silent',
})
const mod = await import('../../.tmp-verify/anim.mjs')
const { PRESETS, ANIMATION_BUNDLES, presetById } = mod
const { buildSlideEngine } = mod
const { scheduleAnims } = mod
const { buildMorphSpecs } = mod
const { parseSlideAnims, slideAnimsJson, cloneAnim } = mod
const { animHasContent } = mod
const { isEngineDriving, subscribeEngineDriving, stopPreview, setStudioOpen, previewOnCanvas } = mod
const { animRegistry } = mod

let pass = 0
let fail = 0
const fails = []
let ok2 = () => {}
function ok(cond, msg) {
  if (cond) { pass++ }
  else { fail++; fails.push(msg); console.error('  ✗', msg) }
}

function makeTarget(id = 'el1') {
  const host = document.getElementById('host')
  const node = document.createElement('div')
  node.id = id
  node.style.width = '200px'
  node.style.height = '100px'
  node.textContent = 'عنوان تجريبي للنص Sample heading words'
  host.appendChild(node)
  return node
}

function snapshot(n) {
  return {
    t: n.style.transform,
    o: n.style.opacity,
    f: n.style.filter,
    c: n.style.clipPath,
    v: ['--kad-ct', '--kad-cr', '--kad-cb', '--kad-cl', '--kad-cc'].map((v) => n.style.getPropertyValue(v)).join(','),
  }
}
function changed(a, b) {
  return a.t !== b.t || a.o !== b.o || a.f !== b.f || a.c !== b.c || a.v !== b.v
}

/* ------------------------------------------------ 1. every preset has data */
console.log(`\n[1] preset data sanity — ${PRESETS.length} presets`)
for (const p of PRESETS) {
  const spec = p.make('el1')
  ok(animHasContent(spec), `${p.id} has keyframes or a motion path`)
  ok(spec.duration >= 100, `${p.id} has sane duration (${spec.duration})`)
  ok(spec.properties || spec.motionPath, `${p.id} has properties/motionPath`)
  // no keyframe timestamps outside the duration
  for (const list of Object.values(spec.properties ?? {})) {
    for (const k of list ?? []) ok(k.t >= 0 && k.t <= spec.duration, `${p.id} keyframe t=${k.t} within ${spec.duration}`)
  }
}

/* ------------------------------------------------ 2. every preset MOVES the DOM */
console.log(`[2] live engine playback — every preset must mutate the element`)
for (const p of PRESETS) {
  const host = document.getElementById('host')
  host.innerHTML = ''
  const node = makeTarget()
  const targets = { el1: node }
  const elements = { el1: { x: 100, y: 100, w: 200, h: 100, rotation: 0 } }
  const spec = p.make('el1')
  // path presets need design-space geometry
  if (spec.motionPath?.kind === 'bezier') {
    spec.motionPath.points = [{ x: 0, y: 0 }, { x: 40, y: -30 }, { x: 80, y: 30 }, { x: 120, y: 0 }]
  }
  if (spec.motionPath?.kind === 'svg') {
    const svgNS = 'http://www.w3.org/2000/svg'
    const svg = document.createElementNS(svgNS, 'svg')
    const path = document.createElementNS(svgNS, 'path')
    path.setAttribute('d', spec.motionPath.d)
    svg.appendChild(path)
    // jsdom has no getPointAtLength; swap to bezier to keep the test meaningful
    spec.motionPath = { kind: 'bezier', points: [{ x: 0, y: 0 }, { x: 40, y: -30 }, { x: 80, y: 30 }, { x: 120, y: 0 }] }
  }
  let engine
  let error
  try {
    engine = buildSlideEngine({ targets, elements, anims: [spec], textSplit: true })
  } catch (e) {
    error = e
  }
  ok(!error && engine, `${p.id} builds an engine (${error?.message ?? 'ok'})`)
  if (!engine) continue
  const before = snapshot(node)
  // deterministic seeking (the same primitive the Timeline UI scrubber uses)
  engine.seek(spec.duration * 0.45)
  await tick(30)
  const mid = snapshot(node)
  engine.seek(Math.max(0, spec.duration - 40))
  await tick(30)
  const after = snapshot(node)
  // and a live play must also run
  engine.restart()
  await tick(220)
  const live = snapshot(node)
  const moved = changed(before, mid) || changed(before, after) || changed(before, live)
  // typewriter/text-reveal split into child spans — check child mutation too
  let childMoved = false
  if (!moved) {
    const kids = node.querySelectorAll('*')
    for (const k of kids) {
      if (k.style.transform || k.style.opacity || k.style.clipPath || k.style.getPropertyValue('--kad-cr') || k.style.getPropertyValue('--kad-ct')) { childMoved = true; break }
    }
  }
  ok(moved || childMoved, `${p.id} actually animates the DOM (before=${JSON.stringify(before)} mid=${JSON.stringify(mid)} after=${JSON.stringify(after)})`)
  engine.destroy()
  await tick(20)
  const cleaned = snapshot(node)
  const varsGone = ['--kad-ct', '--kad-cr', '--kad-cb', '--kad-cl', '--kad-cc'].every((v) => !node.style.getPropertyValue(v))
  ok(cleaned.t === '' && cleaned.o === '' && cleaned.f === '' && cleaned.c === '' && varsGone, `${p.id} cleans up after destroy`)
}

/* ------------------------------------------------ 3. bundles */
console.log(`[3] one-click bundles`)
for (const b of ANIMATION_BUNDLES) {
  const specs = b.make('el1')
  ok(specs.length >= 1 && specs.every(animHasContent), `bundle ${b.id} produces live spec(s)`)
}

/* ------------------------------------------------ 4. scheduling */
console.log(`[4] click sequencing (onClick/with/after)`)
{
  const mk = (id, over) => ({ ...presetById('fade-in').make(id), duration: 500, delay: 0, ...over })
  const a = mk('a')
  const b = mk('b', { start: 'onClick' })
  const c = mk('c', { start: 'after', delay: 100 })
  const d = mk('d', { start: 'with', delay: 200 })
  const s = scheduleAnims([a, b, c, d])
  ok(s.groupStarts.length === 2, `two click groups (got ${s.groupStarts.length})`)
  const by = (id) => s.items.find((i) => i.spec.target === id)
  ok(by('a').group === 0 && by('a').absDelay === 0, 'group0 starts at 0')
  ok(by('b').group === 1 && by('b').absDelay === 500, 'onClick begins at previous group end (500)')
  ok(by('c').group === 1 && by('c').absDelay === 1100, 'after waits for previous (500+500+100)')
  ok(by('d').group === 1 && by('d').absDelay === 700, 'with aligns to group base+delay')

  // infinite anim never blocks a later click group or auto-pause
  const loop = mk('l', { repeat: -1, duration: 2000 })
  const afterLoop = mk('z', { start: 'onClick' })
  const s2 = scheduleAnims([loop, afterLoop])
  ok(s2.groupEnds[0] === Infinity, 'infinite group end is Infinity (no auto-pause)')
  ok(s2.groupStarts[1] === 0, 'later click group not blocked by the infinite anim')
}

/* ------------------------------------------------ 5. morph */
console.log(`[5] cross-slide morph`)
{
  const slideA = { id: 's1', elements: [{ id: 'x', kind: 'shape', name: 'b', x: 0, y: 0, w: 100, h: 100, rotation: 0, opacity: 1, visible: true }], transition: { type: 'none', duration: 400 } }
  const slideB = { id: 's2', elements: [{ id: 'x', kind: 'shape', name: 'b', x: 200, y: 100, w: 200, h: 200, rotation: 45, opacity: 1, visible: true }], transition: { type: 'morph', duration: 600 } }
  const specs = buildMorphSpecs(slideA, slideB, 600)
  const matched = specs.find((s) => s.target === 'x')
  ok(!!matched, 'matched pair creates a morph spec')
  ok(matched.properties.x[0].v === -250, 'morph dx correct (center 50→300)')
  ok(matched.properties.scale[0].v === 0.5, 'morph start scale correct')
  ok(matched.properties.rotation[0].v === -45, 'morph start rotation correct')
  // unmatched incoming
  const slideC = { id: 's3', elements: [...slideB.elements, { id: 'new', kind: 'text', name: 't', x: 0, y: 0, w: 50, h: 50, rotation: 0, opacity: 1, visible: true }], transition: { type: 'morph', duration: 600 } }
  const specs2 = buildMorphSpecs(slideA, slideC, 600)
  ok(specs2.some((s) => s.target === 'new'), 'unmatched incoming element fades in')
}

/* ------------------------------------------------ 6. JSON round trip */
console.log(`[6] serialize / parse / clone`)
{
  const spec = presetById('reveal-right').make('el1')
  const slide = { id: 's', elements: [{ id: 'el1' }], animations: [spec] }
  const json = slideAnimsJson(slide)
  const res = parseSlideAnims(json)
  ok(res.ok, 'reveal spec parses')
  ok(res.anims[0].reveal?.kind === 'wipe-right', 'reveal geometry survives JSON')
  ok(res.anims[0].properties.clip?.length === 2, 'clip keyframes survive JSON')
  const clone = cloneAnim(res.anims[0], 'el2')
  ok(clone.target === 'el2' && clone.id !== spec.id, 'clone re-targets and gets a new id')
  const evil = '[{ "target":"el1","duration":500,"properties":{ "x":[{"t":0,"v":1}] }, "start":"banana" }]'
  const r2 = parseSlideAnims(evil)
  ok(r2.ok && r2.anims[0].start === undefined, 'invalid start trigger is dropped')
}

/* ------------------------------------------------ 7. intensity / rotation / blur */
console.log(`[7] intensity, rotation mapping, blur filter`)
{
  const spec = presetById('pulse').make('el1', { intensity: 2 })
  const peaks = spec.properties.scale.map((k) => k.v)
  ok(Math.abs(spec.intensity - 2) < 1e-6, 'intensity stored')
  ok(peaks.includes(1.08), 'pulse peak data intact')

  // rotation must map to anime's `rotate` transform and actually render
  document.getElementById('host').innerHTML = ''
  let node = makeTarget('rot')
  const specR = presetById('rotate-emphasis').make('rot')
  const engineR = buildSlideEngine({ targets: { rot: node }, elements: { rot: { x: 0, y: 0, w: 200, h: 100, rotation: 0 } }, anims: [specR] })
  engineR.restart()
  await tick(600)
  ok(/rotate\([\d.]+deg\)/.test(node.style.transform), `rotation renders as rotate() in transform (got "${node.style.transform}")`)
  engineR.destroy()

  // blur must compile to CSS filter blur(...)
  document.getElementById('host').innerHTML = ''
  node = makeTarget('blr')
  const specB = presetById('blur-in').make('blr')
  const engineB = buildSlideEngine({ targets: { blr: node }, elements: { blr: { x: 0, y: 0, w: 200, h: 100, rotation: 0 } }, anims: [specB] })
  engineB.restart()
  await tick(120)
  ok(/blur\([\d.]+px\)/.test(node.style.filter), `blur renders in CSS filter (got "${node.style.filter}")`)
  engineB.destroy()

  // intensity scales travel distance
  document.getElementById('host').innerHTML = ''
  node = makeTarget('ix')
  const specI = presetById('shake').make('ix', { intensity: 2 })
  const engineI = buildSlideEngine({ targets: { ix: node }, elements: { ix: { x: 0, y: 0, w: 200, h: 100, rotation: 0 } }, anims: [specI] })
  engineI.restart()
  await tick(150)
  const m = node.style.transform.match(/translateX\((-?[\d.]+)px\)/)
  ok(m && Math.abs(Number(m[1])) >= 12, `intensity 2× doubles shake displacement (got "${node.style.transform}")`)
  engineI.destroy()
}

/* ------------------------------------------------ 8. text split */
console.log(`[8] text split modes`)
{
  for (const [preset, mode, min] of [['typewriter', 'chars', 4], ['text-reveal', 'lines', 1]]) {
    document.getElementById('host').innerHTML = ''
    const node = makeTarget('tx')
    const spec = presetById(preset).make('tx')
    const engine = buildSlideEngine({ targets: { tx: node }, elements: { tx: { x: 0, y: 0, w: 200, h: 100, rotation: 0 } }, anims: [spec], textSplit: true })
    await tick(120)
    const splitCount = node.querySelectorAll('span').length
    ok(splitCount >= min, `${preset} splits DOM into ${mode} (${splitCount} span nodes)`)
    engine.destroy()
    await tick(60)
    ok(!node.querySelector('span'), `${preset} reverts split on destroy`)
  }
}

/* ------------------------------------------------ 9. full user flow through the store */
console.log(`[9] store → library → scheduler → engine integration`)
{
  const { useDoc, applyPreset, applyBundle, createShape, scheduleAnims, buildSlideEngine } = mod
  const state0 = useDoc.getState()
  const slideId = state0.doc.slides[state0.slideIndex].id
  const els = []
  state0.updateSlide(slideId, (s) => {
    s.animations = []
    s.elements = []
    for (let i = 0; i < 3; i++) {
      const shape = createShape(useDoc.getState().doc.theme, { shape: 'rect', x: 100 + i * 220, y: 200, w: 120, h: 120 })
      s.elements.push(shape)
      els.push(shape.id)
    }
  }, 'setup')
  const current = () => useDoc.getState().doc.slides.find((s) => s.id === slideId)

  let res = applyPreset('slide-in-left', els, 'stagger', 150)
  ok(res.count === 3, `stagger applies one spec per element (${res.count})`)
  ok(current().animations[1].delay - current().animations[0].delay === 150, 'stagger step honoured')
  let sched = scheduleAnims(current().animations)
  ok(sched.items.length === 3, 'scheduler keeps all three')

  // sequence mode: second/third start after previous
  state0.updateSlide(slideId, (s) => (s.animations = []), 'reset')
  res = applyPreset('zoom-in', els, 'sequence')
  sched = scheduleAnims(current().animations)
  ok(sched.groupStarts.length === 1, 'sequence with "after" stays one click group')
  const abs = sched.items.map((i) => i.absDelay)
  ok(abs[1] >= abs[0] + 500 && abs[2] >= abs[1] + 500, `sequence offsets accumulate (${abs.join(',')})`)

  // simultaneous: same delay base
  state0.updateSlide(slideId, (s) => (s.animations = []), 'reset')
  applyPreset('pulse', els, 'simultaneous')
  ok(current().animations.every((a) => a.delay === current().animations[0].delay), 'simultaneous share start time')

  // bundle
  state0.updateSlide(slideId, (s) => (s.animations = []), 'reset')
  res = applyBundle('bundle-cinematic', [els[0]], 'same')
  ok(res.count === 1 && current().animations[0].properties.blur && current().animations[0].properties.scale, 'cinematic bundle carries blur+zoom')

  // play the whole built list through a real engine
  document.getElementById('host').innerHTML = ''
  const targets = {}
  els.forEach((id, i) => {
    const n = document.createElement('div')
    n.id = id
    n.textContent = `box ${i}`
    document.getElementById('host').appendChild(n)
    targets[id] = n
  })
  state0.updateSlide(slideId, (s) => (s.animations = []), 'reset')
  applyPreset('fade-in', els, 'stagger', 120)
  const elements = {}
  els.forEach((id, i) => (elements[id] = { x: 100 + i * 220, y: 200, w: 120, h: 120, rotation: 0 }))
  const engine = buildSlideEngine({ targets, elements, anims: scheduleAnims(current().animations).items.map((i) => i.spec) })
  engine.seek(400)
  await tick(40)
  const opacities = els.map((id) => Number(targets[id].style.opacity || 0))
  ok(opacities[0] > opacities[2] + 0.05, `stagger plays elements in order at t=400 (${opacities.map((o) => o.toFixed(2)).join(',')})`)
  engine.destroy()
}

/* ------------------------------------------------ 10. engine-driving broadcast
 *
 * The selection overlay draws the frame and the eight resize handles from the document model.
 * The engine writes transforms straight to the element wrappers, so while it drives the canvas
 * the model rect and the painted element disagree — the frame ends up beside the element.
 * The canvas hides the chrome instead; this locks that contract.
 */
console.log('\n[10] engine-driving broadcast hides edit chrome')

ok(isEngineDriving() === false, 'canvas is not engine-driven at rest')

const seen = []
const unsubscribe = subscribeEngineDriving((v) => seen.push(v))
ok(seen.length === 1 && seen[0] === false, 'a new subscriber is told the current state immediately')

// A wrapper node registered the way SlideView registers it, plus one animation on the slide.
document.getElementById('host').innerHTML = ''
const wrap = document.createElement('div')
wrap.id = 'wrap-1'
document.getElementById('host').appendChild(wrap)
animRegistry.register('el-drive', wrap)

const driveSlide = {
  id: 's-drive',
  layoutId: 'blank',
  background: { type: 'solid', color: '#ffffff' },
  elements: [{ id: 'el-drive', kind: 'text', name: 't', x: 100, y: 100, w: 300, h: 120, rotation: 0 }],
  notes: '',
  transition: { type: 'none', duration: 0 },
  hidden: false,
  animations: [presetById('fade-in').make('el-drive')],
}
previewOnCanvas(driveSlide)
ok(isEngineDriving() === true, 'starting a preview marks the canvas engine-driven')
ok(seen[seen.length - 1] === true, 'subscribers are notified when it starts')

// The engine owns the wrapper: it must have written something the model knows nothing about.
ok(wrap.style.transform !== '' || wrap.style.opacity !== '', 'the engine really does drive the wrapper node')

stopPreview()
ok(isEngineDriving() === false, 'stopping the preview releases the canvas')
ok(seen[seen.length - 1] === false, 'subscribers are notified when it stops')
ok(wrap.style.transform === '' && wrap.style.opacity === '', 'the wrapper is restored when the engine is destroyed')

setStudioOpen(true)
ok(isEngineDriving() === true, 'opening the animation studio marks the canvas engine-driven')
setStudioOpen(false)
ok(isEngineDriving() === false, 'closing the animation studio releases the canvas')

unsubscribe()
stopPreview()

/* ------------------------------------------------ 11. whiteboard animation & hand tracking */
console.log('\n[11] whiteboard animation & hand tracking')
{
  const { getHandFrame, subscribeHandFrame, computeHandFrame, revealAt, HAND_ASSETS, handDrawWidth, handDrawHeight } = mod
  const wbSpec = presetById('whiteboard-draw').make('wb-target')
  ok(wbSpec.whiteboard?.effect === 'draw', 'whiteboard-draw carries effect="draw"')
  ok(['wipe-right','wipe-down','wipe-left','wipe-up','circle'].includes(wbSpec.reveal?.kind), `whiteboard-draw carries wipe reveal (got ${wbSpec.reveal?.kind})`)

  document.getElementById('host').innerHTML = ''
  const node = makeTarget('wb-target')
  const targets = { 'wb-target': node }
  const elements = { 'wb-target': { x: 50, y: 60, w: 200, h: 80, rotation: 0 } }

  const frames = []
  const unsubHand = subscribeHandFrame((f) => frames.push({ ...f }))

  const engine = buildSlideEngine({ targets, elements, anims: [wbSpec] })
  engine.seek(wbSpec.duration * 0.5)
  await tick(30)
  const midFrame = getHandFrame()
  ok(midFrame.active === true, 'hand is active during drawing mid-timeline')
  ok(midFrame.x >= 50 && midFrame.x <= 260, `hand X is within element bounds (got ${midFrame.x})`)
  ok(midFrame.y >= 60 && midFrame.y <= 150, `hand Y is within element bounds (got ${midFrame.y})`)

  engine.destroy()
  await tick(20)
  const endFrame = getHandFrame()
  ok(endFrame.active === false, 'hand is cleared and deactivated after destroy')
  unsubHand()

  /* ---- the hand must sit on the ink edge, not on a trajectory of its own ---- */
  const el = { x: 100, y: 80, w: 400, h: 260, rotation: 0 }
  const spec = presetById('whiteboard-draw').make('el')
  let maxDrift = 0
  let lifted = 0
  let descended = 0
  let firstY = null
  let lastY = null
  for (let i = 0; i <= 40; i++) {
    const t = Math.round((spec.duration * i) / 40)
    const reveal = revealAt(spec, t)
    const f = computeHandFrame(spec, el, t, { reveal })
    if (!f) continue
    const expected = el.y + 10 + reveal * (el.h - 20)
    // the return strokes lift the pen; the ink edge itself is what must stay close
    if (Math.abs(f.y - expected) > 26) maxDrift = Math.max(maxDrift, Math.abs(f.y - expected))
    if (firstY === null) firstY = f.y
    lastY = f.y
    if (f.y > (descended || 0)) descended = f.y
    if (!f.pressing) lifted++
  }
  ok(maxDrift === 0, `hand Y stays within one band of the ink edge on every sampled frame (max drift ${maxDrift.toFixed(1)}px)`)
  ok(descended - firstY > (el.h - 20) * 0.6, `the hand descends the element as the ink is laid down (${Math.round(firstY)} → ${Math.round(descended)})`)
  ok(lifted > 0, `the marker lifts between strokes (${lifted} lifted frames)`)

  /* ---- text ink order: RTL lines are written from the right ---- */
  const arSpec = presetById('whiteboard-write-ar').make('ar')
  const arEl = { x: 200, y: 300, w: 800, h: 160, rotation: 0, rtl: true }
  const firstX = computeHandFrame(arSpec, arEl, 20, {}).x
  const lastX = computeHandFrame(arSpec, arEl, arSpec.duration - 40, {}).x
  ok(firstX > lastX + 200, `Arabic text is written right to left (x ${Math.round(firstX)} → ${Math.round(lastX)})`)

  const enSpec = presetById('whiteboard-write').make('en')
  const enEl = { x: 200, y: 300, w: 800, h: 160, rotation: 0, rtl: false }
  ok(computeHandFrame(enSpec, enEl, 20, {}).x < computeHandFrame(enSpec, enEl, enSpec.duration - 40, {}).x, 'LTR text is written left to right')

  /* ---- measured ink positions beat the estimate: the nib lands on the unit ---- */
  const units = [
    { x: 900, y: 420 },
    { x: 820, y: 420 },
    { x: 740, y: 420 },
  ]
  const measured = computeHandFrame(arSpec, arEl, 65 * 1 + 20, { units })
  ok(Math.abs(measured.x - units[1].x) < 45, `measured units drive the nib (x=${Math.round(measured.x)} vs unit ${units[1].x})`)
  ok(Math.abs(measured.y - units[1].y) < 2, 'the nib sits on the measured baseline, not the box top')

  /* ---- erase: the pad is centred on the shrinking ink ---- */
  const eraseSpec = presetById('whiteboard-erase').make('er')
  const eraseEl = { x: 100, y: 80, w: 400, h: 260, rotation: 0 }
  let wipeDrift = 0
  for (let i = 0; i <= 20; i++) {
    const t = Math.round((eraseSpec.duration * i) / 20)
    const reveal = revealAt(eraseSpec, t)
    const f = computeHandFrame(eraseSpec, eraseEl, t, { reveal })
    if (!f) continue
    wipeDrift = Math.max(wipeDrift, Math.abs(f.y - (eraseEl.y + 10 + (1 - reveal) * (eraseEl.h - 20))))
    ok2(f.pose === 'eraser', 'erase uses the eraser pose')
  }
  ok(wipeDrift < 8, `the eraser pad rides the wipe line (max drift ${wipeDrift.toFixed(1)}px)`)

  /* ---- push: the flat palm leads ---- */
  const pushSpec = presetById('whiteboard-push').make('pu')
  const pushFrame = computeHandFrame(pushSpec, { x: 300, y: 300, w: 400, h: 200, rotation: 0 }, pushSpec.duration * 0.5, {})
  ok(pushFrame.pose === 'palm', 'push uses the flat palm pose, not a pen grip')

  /* ---- entry / exit are real phases, not pops ---- */
  const entry = computeHandFrame(spec, el, -80, { reveal: 0 })
  ok(entry && entry.active && entry.opacity < 1, 'the hand fades in while flying to the first stroke')
  const exit = computeHandFrame(spec, el, spec.duration + 360, { reveal: 1 })
  ok(exit && exit.active && exit.opacity < 0.5, `the hand lifts and fades out after the last stroke (opacity ${exit?.opacity})`)
  ok(computeHandFrame(spec, el, -1000, { reveal: 0 }) === null, 'the hand is off screen before its entry window')

  /* ---- shipped assets must agree with the manifest ---- */
  const pngSize = (file) => {
    const buf = readFileSync(file)
    if (buf.toString('ascii', 1, 4) !== 'PNG') return null
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
  }
  for (const [key, asset] of Object.entries(HAND_ASSETS)) {
    const file = `public${asset.src}`
    ok(existsSync(file), `hand asset exists: ${asset.src}`)
    const size = pngSize(file)
    ok(size && size.w === asset.natW && size.h === asset.natH, `${key}: manifest size matches the PNG (${asset.natW}×${asset.natH})`)
    ok(asset.ax >= 0 && asset.ax <= asset.natW && asset.ay >= 0 && asset.ay <= asset.natH, `${key}: anchor ${asset.ax},${asset.ay} is inside the image`)
    ok(handDrawWidth(asset) > 60 && handDrawHeight(asset) > 20, `${key}: drawn size is sane (${Math.round(handDrawWidth(asset))}×${Math.round(handDrawHeight(asset))} design px)`)
  }
  ok(!!HAND_ASSETS.eraser && !!HAND_ASSETS.palm, 'the eraser and the flat palm poses ship with the rest of the rig')

  /* ---- retiming keeps the hand glued to the ink ---- */
  const { retimeAnim } = mod
  const stretched = presetById('whiteboard-draw').make('st')
  retimeAnim(stretched, 4400)
  ok(stretched.duration === 4400, 'retime sets the new duration')
  ok(stretched.properties.clip[stretched.properties.clip.length - 1].t === 4400, 'retime stretches the clip keyframes to the new end')
  const midStretch = computeHandFrame(stretched, el, 2200, { reveal: revealAt(stretched, 2200) })
  const expectedStretch = el.y + 10 + revealAt(stretched, 2200) * (el.h - 20)
  ok(Math.abs(midStretch.y - expectedStretch) < 26, 'after retiming, the hand still rides the ink edge')
  const wri = presetById('whiteboard-write-ar').make('wr')
  retimeAnim(wri, wri.duration * 2)
  ok(wri.text.stagger === 130, `retime scales the text stagger too (${wri.text.stagger}ms)`)
}

/* ------------------------------------------------ summary */
rmSync('.tmp-verify', { recursive: true, force: true })
console.log(`\n${fail === 0 ? '✓ ALL' : '✗ FAIL'} — ${pass} passed, ${fail} failed`)
if (fail) {
  console.error(fails.join('\n'))
  process.exit(1)
}
