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

let pass = 0
let fail = 0
const fails = []
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

/* ------------------------------------------------ summary */
rmSync('.tmp-verify', { recursive: true, force: true })
console.log(`\n${fail === 0 ? '✓ ALL' : '✗ FAIL'} — ${pass} passed, ${fail} failed`)
if (fail) {
  console.error(fails.join('\n'))
  process.exit(1)
}
