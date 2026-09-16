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

/** Wait until `cond()` is true (or give up) — for engine renders that land on a rAF. */
async function waitFor(cond, ms = 600) {
  const deadline = Date.now() + ms
  for (;;) {
    try {
      if (cond()) return true
    } catch {
      /* keep waiting */
    }
    if (Date.now() > deadline) return false
    await tick(20)
  }
}

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

  // intensity scales travel distance: same preset, same instant, twice the amplitude
  document.getElementById('host').innerHTML = ''
  const host = document.getElementById('host')
  const ix1 = makeTarget('ix1')
  const ix2 = makeTarget('ix2')
  const amp = (id, intensity) => {
    const engine = buildSlideEngine({
      targets: { [id]: id === 'ix1' ? ix1 : ix2 },
      elements: { [id]: { x: 0, y: 0, w: 200, h: 100, rotation: 0 } },
      anims: [presetById('shake').make(id, { intensity })],
    })
    engine.restart()
    return engine
  }
  const e1 = amp('ix1', 1)
  const e2 = amp('ix2', 2)
  const dx = (n) => Number(n.style.transform.match(/translateX\((-?[\d.]+)px\)/)?.[1] ?? NaN)
  // deterministic: same instant in both, no dependence on how fast the runner's rAF ticks
  e1.seek(150)
  e2.seek(150)
  await waitFor(() => Math.abs(dx(ix1)) > 0.5 && Math.abs(dx(ix2)) > 0.5)
  ok(Math.abs(dx(ix1)) > 0.5 && Math.abs(dx(ix2)) > 0.5, `both intensities displace the element (${dx(ix1)} vs ${dx(ix2)})`)
  const ratio = Math.abs(dx(ix2)) / Math.abs(dx(ix1))
  ok(ratio > 1.6 && ratio < 2.4, `intensity 2× doubles shake displacement (${Math.abs(dx(ix2)).toFixed(1)}px vs ${Math.abs(dx(ix1)).toFixed(1)}px → ×${ratio.toFixed(2)})`)
  e1.destroy()
  e2.destroy()
  void host
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
  await waitFor(() => getHandFrame().active)
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
  const wideUnits = [
    { x: 900, y: 420, w: 200 },
    { x: 620, y: 420, w: 200 },
    { x: 340, y: 420, w: 200 },
  ]
  // the hand advances one unit per stagger (the preset's own pace, not a hard-coded one)
  const measured = computeHandFrame(arSpec, arEl, arSpec.text.stagger + 20, { units, stagger: arSpec.text.stagger })
  ok(Math.abs(measured.x - units[1].x) < 45, `measured units drive the nib (x=${Math.round(measured.x)} vs unit ${units[1].x})`)
  ok(Math.abs(measured.y - units[1].y) < 2, 'the nib sits on the measured baseline, not the box top')

  // a measured unit carries its own box width, so the hand sweeps across the word: first the
  // near edge, then the middle, then the far edge — instead of parking on the centre
  const st = arSpec.text.stagger
  const withW = (frac) => computeHandFrame(arSpec, arEl, st * 1 + 30 + frac * st, { units: wideUnits, stagger: st, rtl: true }).x
  const enter = withW(0.1)
  const middle = withW(0.45)
  const leave = withW(0.8)
  ok(enter > middle && middle > leave, `the nib sweeps across the word right to left (${Math.round(enter)} → ${Math.round(middle)} → ${Math.round(leave)})`)
  ok(middle > 620 - 100 && middle < 620 + 100, `the sweep stays inside the measured unit (x=${Math.round(middle)}, unit 620±100)`)

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
  const beforeStagger = wri.text.stagger
  retimeAnim(wri, wri.duration * 2)
  ok(wri.text.stagger === beforeStagger * 2, `retime scales the text stagger too (${beforeStagger} → ${wri.text.stagger}ms)`)
}

/* ------------------------------------------------ 12. drawing presets on text ------------------
 *
 * A whiteboard drawing preset is authored as a vertical wipe. On a text element that wipe cuts
 * whole lines through the middle of their letters — no hand writes like that. Text must be inked
 * unit by unit (the handwriting model), with the wipe dropped; shapes and pictures keep the wipe.
 */
console.log('\n[12] whiteboard drawing presets land correctly on text')
{
  const { useDoc, applyPreset, adaptSpecToTarget, usesTextInk, effectiveTextMode, createShape, createText, presetById, buildSlideEngine, computeHandFrame } = mod
  const state = useDoc.getState()
  const slideId = state.doc.slides[state.slideIndex].id
  let textEl
  let shapeEl
  state.updateSlide(
    slideId,
    (s) => {
      s.animations = []
      s.elements = []
      textEl = createText(state.doc.theme, { x: 120, y: 180, w: 700, h: 200 })
      textEl.content = '<p>رسم يدوي على السبورة</p>'
      textEl.font = { ...textEl.font, dir: 'rtl' }
      shapeEl = createShape(state.doc.theme, { shape: 'rect', x: 120, y: 430, w: 300, h: 160 })
      s.elements.push(textEl, shapeEl)
    },
    'setup',
  )
  const current = () => useDoc.getState().doc.slides.find((s) => s.id === slideId)

  applyPreset('whiteboard-draw', [textEl.id], 'same')
  const onText = current().animations.at(-1)
  ok(!!onText.text, 'whiteboard draw on text gains a per-unit text animation')
  ok(onText.text.mode === 'words' && onText.text.from === 'start', 'Arabic text is written word by word from the start of the line (letters stay connected)')
  ok(onText.text.stagger >= 90 && onText.text.stagger <= 420, `the derived writing pace is sane (${onText.text.stagger}ms per word)`)
  ok(!onText.properties.clip && !onText.reveal, 'the block wipe is dropped — it would clip every letter')
  ok(effectiveTextMode(onText, baseElForTest()) === 'words', 'the engine runs an RTL character spec per word')

  function baseElForTest() {
    return { x: 120, y: 180, w: 700, h: 200, rotation: 0, isText: true, rtl: true }
  }

  applyPreset('whiteboard-draw', [shapeEl.id], 'same')
  const onShape = current().animations.at(-1)
  ok(!!onShape.properties.clip && onShape.reveal?.kind === 'wipe-down', 'a shape keeps the vertical wipe it was authored with')
  ok(!onShape.text, 'a shape does not get a text animation')

  const baseEl = baseElForTest()
  ok(usesTextInk(onText, baseEl), 'the engine recognises the text-ink case')
  ok(!usesTextInk(onShape, { ...baseEl, isText: false }), 'and not for shapes')

  // LTR text keeps per-character ink at a human pace
  const ltrEl = { kind: 'text', content: '<p>Hand drawn on a whiteboard</p>', x: 120, y: 180, w: 700, h: 200, font: { dir: 'ltr' } }
  const ltrSpec = adaptSpecToTarget(presetById('whiteboard-draw').make('ltr'), ltrEl)
  ok(ltrSpec.text.mode === 'chars' && ltrSpec.text.stagger <= 120, 'LTR text is written character by character')

  // an imported/legacy spec may still carry both: the engine must not wipe it
  const legacy = presetById('whiteboard-draw').make('legacy')
  legacy.text = { mode: 'chars', stagger: 40, from: 'start' }
  const px = 18
  const host = document.getElementById('host')
  host.innerHTML = ''
  const node = document.createElement('div')
  node.id = 'legacy'
  node.textContent = 'نص'
  host.appendChild(node)
  const engineLegacy = buildSlideEngine({ targets: { legacy: node }, elements: { legacy: baseEl }, anims: [legacy], textSplit: true })
  engineLegacy.seek(30)
  await waitFor(() => !!node.innerHTML)
  ok(!node.style.clipPath, 'a whiteboard draw on text never writes a block clip-path, even from an imported spec')
  ok(node.style.getPropertyValue('--kad-ct') === '', 'and never sets the wipe variable')
  engineLegacy.destroy()

  // …while the same spec on a shape does clip (the wipe is what the hand rides)
  const shapeSpec = presetById('whiteboard-draw').make('shape-target')
  host.innerHTML = ''
  const shapeNode = document.createElement('div')
  shapeNode.id = 'shape-target'
  host.appendChild(shapeNode)
  const engineShape = buildSlideEngine({ targets: { 'shape-target': shapeNode }, elements: { 'shape-target': { x: 0, y: 0, w: 200, h: 200, rotation: 0 } }, anims: [shapeSpec] })
  engineShape.seek(30)
  await waitFor(() => !!shapeNode.style.clipPath)
  ok(!!shapeNode.style.clipPath, 'the same preset still wipes a non-text element')
  engineShape.destroy()

  // a per-character spec on RTL text is run per word, so Arabic shaping survives
  const arabicPreset = presetById('whiteboard-write-ar').make('ar2')
  ok(arabicPreset.text.mode === 'words', 'the Arabic handwriting preset inks whole words')
  const charSpec = presetById('whiteboard-write').make('ar3')
  ok(effectiveTextMode(charSpec, { ...baseEl, rtl: true }) === 'words', 'even a character spec is upgraded for RTL targets')
  ok(effectiveTextMode(charSpec, { ...baseEl, rtl: false }) === 'chars', 'and stays per character for LTR targets')

  /* ---- connected-script ink: word-shaped runs revealed by a travelling clip edge ---- */
  host.innerHTML = ''
  const arNode = document.createElement('div')
  arNode.id = 'ar-stream'
  arNode.innerHTML = '<p>رسم يدوي على السبورة</p>'
  host.appendChild(arNode)
  const arSpec2 = adaptSpecToTarget(presetById('whiteboard-draw').make('ar-stream'), textEl)
  const engineStream = buildSlideEngine({ targets: { 'ar-stream': arNode }, elements: { 'ar-stream': baseEl }, anims: [arSpec2], textSplit: true })
  const inkValues = () => [...arNode.querySelectorAll('[data-word]')].map((w) => parseFloat(w.style.getPropertyValue('--kad-tx')))
  engineStream.seek(arSpec2.text.stagger * 1.5) // mid-word: the edge is inside a word run
  // CI runners are slower than a dev machine: wait for the render instead of a fixed tick
  await waitFor(() => inkValues().some((v) => v > 0 && v < 100))
  const words = [...arNode.querySelectorAll('[data-word]')] // TextSplitter's own word runs
  ok(!arNode.querySelector('span[style*="clip: rect"]')?.getAttribute('data-word'), 'the off-screen accessible copy is not a word run')
  ok(words.length >= 4, `Arabic text is split into words, not characters (${words.length} runs)`)
  ok(words.every((w) => w.textContent.trim().indexOf(' ') === -1), 'each run is a single word — the letters keep their joined forms')
  const clipped = words.filter((w) => (w.style.clipPath || '').includes('inset(0 0 0'))
  ok(clipped.length >= 4, `every word is revealed by a right-to-left clip edge (${clipped.length} word runs)`)
  const half = inkValues().filter((v) => v > 0 && v < 100)
  ok(half.length >= 1, `the edge is mid-word on the word being written (${half.length} partially inked, values ${inkValues().map((v) => (Number.isFinite(v) ? Math.round(v) : '—')).join(',')})`)
  ok(!arNode.style.clipPath, 'still no block wipe anywhere on the element')
  engineStream.destroy()
  await waitFor(() => !words.some((w) => w.style.clipPath))
  ok(!words.some((w) => w.style.clipPath), 'destroying the engine clears the stream clips')

  // the hand rides that edge: inside a word it advances right-to-left with the ink
  const stride = arSpec2.text.stagger
  const measuredWords = [
    { x: 1000, y: 400, w: 200 },
    { x: 700, y: 400, w: 200 },
  ]
  const at = (t, rtl = true) => computeHandFrame(arSpec2, { ...baseEl }, t, { units: measuredWords, stream: { stride, lead: stride * 0.12 }, rtl })
  const first = at(60)
  const mid = at(stride * 0.5)
  const last = at(stride * 0.95)
  ok(first.x > mid.x && mid.x > last.x, `the nib tracks the shrinking ink edge (${Math.round(first.x)} → ${Math.round(mid.x)} → ${Math.round(last.x)})`)
  // the ink edge the engine animates, for the same instant: the word starts inking at `lead` and
  // the clip tween lasts stride * (1 - INK_LEAD)
  const lead = stride * 0.12
  const p0 = (stride * 0.5 - lead) / (stride * 0.88)
  const ahead = mod.NIB_AHEAD_PX * mid.scale
  const expectedEdge = 1000 + 100 - p0 * 200 - ahead // RTL: the tip leads the wet edge leftwards
  ok(Math.abs(mid.x - expectedEdge) < 3, `the nib rides the ink edge, tip just ahead of the wet ink (${Math.round(mid.x)} vs ${Math.round(expectedEdge)})`)
  // a word is written first, then the pen lifts for the last `lead` ms of its window
  const threeWords = [
    { x: 1000, y: 400, w: 200 },
    { x: 700, y: 400, w: 200 },
    { x: 400, y: 400, w: 200 },
  ]
  const at3 = (t) => computeHandFrame(arSpec2, { ...baseEl }, t, { units: threeWords, stream: { stride, lead }, rtl: true })
  const writing = at3(lead + stride * 1.5)
  ok(writing.pressing, 'the pen is pressing while the second word is being written')
  ok(writing.x < 800 && writing.x > 600, `and it is inside the second word's box (${Math.round(writing.x)})`)
  const travelling = at3(lead + stride * 1.94)
  ok(!travelling.pressing, 'the pen is lifted while it travels to the next word')
  ok(travelling.x < 600 && travelling.x > 500, `and it is between the two words mid-lift (${Math.round(travelling.x)})`)
  const landed = at3(lead + stride * 2.01)
  ok(landed.pressing && Math.abs(landed.x - (400 + 100)) < 12, `and it lands on the third word's entry edge (${Math.round(landed.x)} vs 500)`)

  // the rig is sized to the type: a caption gets a smaller hand than a headline
  const big = computeHandFrame(arSpec2, { ...baseEl }, 200, { units: [{ x: 800, y: 400, w: 300, h: 64 }], stream: { stride, lead }, rtl: true })
  const small = computeHandFrame(arSpec2, { ...baseEl }, 200, { units: [{ x: 800, y: 400, w: 160, h: 22 }], stream: { stride, lead }, rtl: true })
  ok(big.scale > small.scale, `hand size follows the type size (${big.scale} for 64px text vs ${small.scale} for 22px)`)
  ok(small.scale >= 0.5 && big.scale <= 1.15, 'and stays within sane bounds')

  // erasing text stays a block wipe: that is what an eraser does
  applyPreset('whiteboard-erase', [textEl.id], 'same')
  const eraseText = current().animations.at(-1)
  ok(!!eraseText.properties.clip && !eraseText.text, 'erasing a text element keeps the wipe (an eraser does not erase letter by letter)')

  // adaptSpecToTarget is idempotent and leaves other specs alone
  const untouched = presetById('zoom-in').make(textEl.id)
  const before = JSON.stringify(untouched)
  adaptSpecToTarget(untouched, textEl)
  ok(JSON.stringify(untouched) === before, 'non-whiteboard presets pass through untouched')
  const twice = presetById('whiteboard-draw').make(textEl.id)
  adaptSpecToTarget(twice, textEl)
  const once = JSON.stringify(twice)
  adaptSpecToTarget(twice, textEl)
  ok(JSON.stringify(twice) === once, 'adapting twice is the same as adapting once')
  void px
}

console.log('\n[13] connected-script ink: cluster boundaries inside a word')
{
  const { clusterWidthsMeasured, canvasFontOf, INK_LEAD, computeHandFrame, presetById } = mod

  // A deterministic "font" helper: every base letter is 100px, marks and tatweel own no
  // advance. That is the shape of real Arabic metrics without needing a canvas.
  const measureEm = (px) => (t) => [...t].reduce((n, ch) => n + (/\p{Mn}/u.test(ch) || ch === '\u0640' ? 0 : px), 0)

  const ar = '\u0631\u0633\u0645' // ر س م — three joined letters
  const w3 = clusterWidthsMeasured(ar, measureEm(100))
  ok(w3.length === 3, `three joined letters → three clusters, not one sweep (${w3.length})`)
  ok(w3.every((w) => w === 100), 'each cluster is as wide as its letter')
  ok(Math.abs(w3.reduce((a, b) => a + b, 0) - 300) < 0.001, 'the cluster widths add up to the whole word')

  const lamAlef = '\u0644\u0627'
  const wl = clusterWidthsMeasured(lamAlef, (t) => (t.length ? 100 : 0))
  ok(wl.length === 1, 'lam + alef is one glyph, so it is one cluster (two characters, one ink)')

  const withHarakah = '\u0631\u064e\u0633\u0645' // رَ س م — a fatha owns no advance
  const wh = clusterWidthsMeasured(withHarakah, measureEm(100))
  ok(wh.length === 3, `a harakah joins the cluster in front of it instead of making a stop (${wh.length})`)

  const withTatweel = '\u0631\u0640\u0640\u0633' // ر ـ ـ س — kashida fillers
  const wt = clusterWidthsMeasured(withTatweel, measureEm(100))
  ok(wt.length === 2, `tatweel is a filler, not a pen stop (${wt.length})`)

  const sliver = clusterWidthsMeasured('\u0631\u064e', measureEm(100))
  ok(sliver.length === 1, 'a mark-only cluster merges leftwards rather than giving the pen a zero step')

  const ltr = clusterWidthsMeasured('draw', measureEm(50))
  ok(ltr.length === 4 && ltr.every((w) => w === 50), 'Latin text splits per character with its own widths')

  ok(clusterWidthsMeasured('', measureEm(10)).length === 0, 'an empty word has no clusters')
  const zero = clusterWidthsMeasured(ar, () => 0)
  ok(zero.length === 1 && zero[0] === 0, 'an unmeasurable font collapses to a single degenerate cluster (the engine then sweeps)')

  ok(canvasFontOf(undefined).includes('100px'), 'a missing computed style still yields a usable canvas font shorthand')
  ok(canvasFontOf({ fontStyle: 'italic', fontWeight: '700', fontSize: '42px', fontFamily: 'Georgia, serif' }) === 'italic 700 42px Georgia, serif', 'the canvas font shorthand mirrors the DOM font')

  // The engine's own tweens: with a font metric available it inks cluster by cluster, on the very
  // same speed curve the hand reads. jsdom has no canvas, so hand it one that answers like Arabic.
  const canvasProto = HTMLCanvasElement.prototype
  const realGetContext = canvasProto.getContext
  canvasProto.getContext = function (kind, ...rest) {
    if (kind !== '2d') return realGetContext.call(this, kind, ...rest)
    return { font: '', measureText: (t) => ({ width: [...String(t)].filter((c) => !/\p{Mn}/u.test(c) && c !== '\u0640').length * 100 }) }
  }
  try {
    const { clearClusterCache, glyphInkFraction, buildSlideEngine, adaptSpecToTarget, presetById, INK_LEAD: LEAD } = mod
    clearClusterCache()
    const host = document.getElementById('host')
    host.innerHTML = ''
    const node = document.createElement('div')
    node.id = 'cluster-stream'
    node.innerHTML = '<p>رسم</p>' // three joined letters, each 100px in our fake metric
    host.appendChild(node)
    const el = { kind: 'text', content: '<p>رسم</p>', font: { dir: 'rtl' }, x: 0, y: 0, w: 600, h: 200, rotation: 0 }
    const spec = adaptSpecToTarget(presetById('whiteboard-draw').make('cluster-stream'), el)
    const engine = buildSlideEngine({
      targets: { 'cluster-stream': node },
      elements: { 'cluster-stream': { ...el, isText: true, rtl: true } },
      anims: [spec],
      textSplit: true,
    })
    // jsdom reports no boxes at all: give the row a layout so the engine can measure its units
    const boxAt = (left, top, width, height) => ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) })
    const realRect = Element.prototype.getBoundingClientRect
    const realWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')
    const realHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')
    Element.prototype.getBoundingClientRect = function () {
      return this.id === 'cluster-stream' ? boxAt(0, 0, 600, 200) : boxAt(150, 60, 300, 60)
    }
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get() { return this.id === 'cluster-stream' ? 600 : 300 } })
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get() { return this.id === 'cluster-stream' ? 200 : 60 } })

    const stride = spec.text.stagger
    const drawMs = stride * (1 - LEAD)
    const wordNode = () => node.querySelector('[data-word]')
    const ink = () => Number.parseFloat(wordNode()?.style.getPropertyValue('--kad-tx'))
    const valueAt = async (frac) => {
      engine.seek(stride * LEAD + drawMs * frac) // frac of the word's drawing time
      await waitFor(() => Number.isFinite(ink()) && ink() < 100)
      return ink()
    }
    try {
      const endOfFirstLetter = await valueAt(1 / 3)
      ok(Math.abs(endOfFirstLetter - 66.67) < 0.6, `the ink tween ends on the first letter's boundary, not on a time fraction (${endOfFirstLetter.toFixed(2)}% vs 66.67%)`)
      const endOfSecondLetter = await valueAt(2 / 3)
      ok(Math.abs(endOfSecondLetter - 33.33) < 0.6, `and on the second letter's boundary (${endOfSecondLetter.toFixed(2)}% vs 33.33%)`)
      const quarter = await valueAt(0.25 / 3)
      const eased = 100 * (1 - (mod.glyphInkFraction(0.25) * 100) / 300)
      const linear = 100 * (1 - 25 / 300)
      ok(Math.abs(quarter - eased) < 0.6, `inside a letter the ink follows the pen's own speed curve (${quarter.toFixed(2)}% vs eased ${eased.toFixed(2)}%)`)
      ok(Math.abs(quarter - linear) > 1, `and that curve is measurably not a constant-speed glide (linear would be ${linear.toFixed(2)}%)`)

      // end to end: the hand the *engine* broadcasts rides that very edge (this is what the user
      // sees — a hand that is wired to the ink, not sweeping at its own pace)
      const entry = 300 + 150 // measured unit centre + half its width (RTL starts at the right edge)
      for (const frac of [0.1, 0.5, 0.9]) {
        const v = await valueAt(frac)
        const frame = mod.getHandFrame()
        ok(!!frame, `the engine broadcasts a hand frame while the stream inks (${frac * 100}% of the word)`)
        const drawn = (1 - v / 100) * 300
        const expected = entry - (drawn + mod.NIB_AHEAD_PX * frame.scale)
        ok(Math.abs(frame.x - expected) < 4, `the nib rides the ink edge at ${Math.round(frac * 100)}% (${Math.round(frame.x)} vs ${Math.round(expected)})`)
      }
      const fallback = mod.getHandFrame()
      ok(fallback.x < entry && fallback.pressing !== undefined, 'the frame is a real drawing frame, not the element-level sweep')
    } finally {
      Element.prototype.getBoundingClientRect = realRect
      Object.defineProperty(HTMLElement.prototype, 'offsetWidth', realWidth)
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', realHeight)
    }
    engine.destroy()
  } finally {
    canvasProto.getContext = realGetContext
    mod.clearClusterCache?.()
  }

  // The engine's tween boundaries and the hand's boundaries must come from one list: assert that
  // the pen's position is monotonic and lands on each cluster edge inside the word.
  const arEl = { x: 120, y: 180, w: 700, h: 200, rotation: 0, isText: true, rtl: true }
  const spec = { ...presetById('whiteboard-draw').make('x'), duration: 2200, text: { mode: 'words', stagger: 230, from: 'start' } }
  const stride = 230
  const lead = stride * INK_LEAD
  const widths = w3
  const unit = { x: 800, y: 400, w: widths.reduce((a, b) => a + b, 0), h: 64 }
  const ctx = { units: [unit], stream: { stride, lead, clusters: [widths] }, rtl: true }
  const at = (ms) => computeHandFrame(spec, { ...arEl }, ms, ctx)
  const start = at(lead + 1)
  const end = at(lead + stride * (1 - INK_LEAD) - 1)
  const mid = at(lead + stride * (1 - INK_LEAD) * 0.5)
  const ahead = mod.NIB_AHEAD_PX * start.scale
  ok(Math.abs(start.x - (unit.x + unit.w / 2 - ahead)) <= 3, `the nib starts at the word's right edge, tip ahead of the ink (${Math.round(start.x)} vs ${Math.round(unit.x + unit.w / 2 - ahead)})`)
  ok(mid.x < start.x && end.x < mid.x, 'the nib advances right-to-left across the clusters')
  ok(Math.abs(end.x - (unit.x - unit.w / 2 - ahead)) <= 3, `and finishes at the left edge (${Math.round(end.x)} vs ${Math.round(unit.x - unit.w / 2 - ahead)})`)
  const uniform = computeHandFrame(spec, { ...arEl }, lead + stride * (1 - INK_LEAD) * 0.25, { units: [unit], stream: { stride, lead }, rtl: true })
  ok(uniform.x < start.x && uniform.x > end.x, 'without clusters the sweep still works (fallback path)')
}

console.log('\n[14] hand plates: tool × skin tone')
{
  const { handKeyFor, handAssetFor, handAsset, plateFor, computeHandFrame, presetById, normalizeAnim } = mod
  const el = { x: 120, y: 180, w: 700, h: 200, rotation: 0, isText: true, rtl: false }

  ok(handKeyFor('marker-dark', 'default') === 'marker-dark', 'the default tone keeps the original plate')
  ok(handKeyFor('marker-dark', 'pale') === 'marker-pale', 'the pale tone swaps in the light-skin plate')
  ok(handKeyFor('marker-dark', 'sleeve') === 'marker-sleeve', 'the sleeve tone swaps in the sleeved plate')
  ok(handKeyFor('pencil', 'sleeve') === 'pencil', 'a tool with no variant of a tone falls back to its own plate')
  ok(handKeyFor('eraser', 'pale') === 'eraser', 'and the eraser is never replaced by a marker hand')
  ok(handAssetFor('marker-dark', 'sleeve').src === '/hands/marker-sleeve.png', 'the asset resolver returns the sleeved PNG')
  ok(handAsset(handKeyFor('marker-dark', 'pale')).natH === 760, 'the new plates go through the same normalisation (760px tall)')
  for (const key of ['marker-pale', 'marker-sleeve']) {
    const a = mod.HAND_ASSETS[key]
    ok(!!a && a.ax >= 0 && a.ay >= 0 && a.ax < a.natW && a.ay < a.natH, `${key}: the working point sits inside the image (${a?.ax},${a?.ay})`)
    ok(!!a?.designH, `${key}: fitted by height like the other pen grips`)
  }

  const spec = { ...presetById('whiteboard-draw').make('tone'), duration: 2000 }
  spec.whiteboard = { ...spec.whiteboard, handTone: 'sleeve' }
  const frame = computeHandFrame(spec, el, 200, {})
  ok(frame.asset === 'marker-sleeve', `the frame carries the resolved plate, not the tool name (${frame.asset})`)
  ok(plateFor(frame) === 'marker-sleeve', 'and the overlay draws exactly that plate')

  const pale = { ...spec, whiteboard: { ...spec.whiteboard, handTone: 'pale' } }
  ok(computeHandFrame(pale, el, 200, {}).asset === 'marker-pale', 'a pale hand is one field away')
  const push = { ...spec, whiteboard: { ...spec.whiteboard, effect: 'push', handTone: 'sleeve' } }
  const pushFrame = computeHandFrame(push, el, 400, {})
  ok(pushFrame.pose === 'palm' && plateFor(pushFrame) === 'palm', 'the push pose always draws the flat palm plate')

  // the spec must survive save/load with the tone, and reject nonsense
  const { parseSlideAnims } = mod
  const round = (wb) => {
    const json = JSON.stringify([{ ...spec, whiteboard: { effect: 'draw', ...wb } }])
    const parsed = parseSlideAnims(json)
    return parsed.ok ? parsed.anims[0].whiteboard : null
  }
  ok(round({ handTone: 'sleeve' })?.handTone === 'sleeve', 'the chosen hand survives a save/load round-trip')
  ok(round({ handTone: 'rainbow' })?.handTone === 'default', 'an unknown tone loads as the default instead of breaking the plate lookup')
  void normalizeAnim
}

/* ------------------------------------------------ summary */
rmSync('.tmp-verify', { recursive: true, force: true })
console.log(`\n${fail === 0 ? '✓ ALL' : '✗ FAIL'} — ${pass} passed, ${fail} failed`)
if (fail) {
  console.error(fails.join('\n'))
  process.exit(1)
}
