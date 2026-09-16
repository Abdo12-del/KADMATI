/**
 * Builds the whiteboard-hand photo assets in `public/hands/` from chroma-key sources.
 *
 * Why photos: the previous hand was ~500 lines of hand-authored SVG (gradients, nail
 * gradients, tendons…) and still read as a cartoon — the classic failure mode of
 * "realistic" vector hands. Every mature whiteboard engine we surveyed
 * (docs/WHITEBOARD_HAND.md §2) uses a photographed hand for exactly this reason.
 *
 * Pipeline per asset:
 *   1. chroma-key the flat green backdrop (soft threshold + despill)
 *   2. trim to the silhouette
 *   3. rotate the rig so the tool points at its canonical angle (pens 42° up-left, flat
 *      tools horizontal) and trim the transparent margins
 *   4. resize to the natural size and locate the *anchor* — the point that must sit
 *      exactly on the ink:
 *        · pen / pencil / chalk / palm → the nib / leading fingertip (min x+y of the matte)
 *        · eraser                      → the centre of the felt pad (bottom-row centroid)
 *      The anchor's position inside the PNG (`ax`,`ay`) is written to the manifest, so the
 *      runtime just draws the image at (pen − anchor). No per-asset calibration in the app.
 *
 * Requires `sharp` (native, not a product dependency):
 *   npm i -D sharp && npm run assets:hands && npm rm sharp
 *
 * Sources: generated photo plates, documented (with prompts) in docs/WHITEBOARD_HAND.md.
 * They live outside the repo — only the keyed/trimmed output is committed.
 */
import fs from 'node:fs'
import path from 'node:path'

const SRC_DIR = process.env.HAND_SRC ?? '.hand-src'
const OUT_DIR = 'public/hands'
const REVIEW_DIR = '.tmp-verify/hands'

/** Canonical rig: where the tool points, and how the file is fitted. */
const ASSETS = [
  // pens/pencils: tall, so they are normalised by height and drawn at `designH` design-px
  { name: 'marker-dark', file: 'marker-dark', anchor: 'nib', angle: 42, designH: 340 },
  { name: 'marker-blue', file: 'marker-light', anchor: 'nib', angle: 42, designH: 340, recolorBarrel: '#2f6bd8' },
  { name: 'pencil', file: 'pencil-light', anchor: 'nib', angle: 42, designH: 340 },
  { name: 'chalk', file: 'chalk-light', anchor: 'nib', angle: 42, designH: 330 },
  // an eraser is used flat: its working point is the centre of the felt pad, not a corner
  { name: 'eraser', file: 'eraser-light', anchor: 'felt', angle: 0, designW: 430 },
  // the flat palm is the "push" pose; wide, so it is fitted by width too
  { name: 'palm', file: 'palm-light', anchor: 'nib', angle: 0, designW: 540 },
]

const OUT_HEIGHT = 760 // natural pixels; the runtime draws at designH/W (≈2× for retina)
const QUALITY = { compressionLevel: 9, palette: true, quality: 92, effort: 8 }

let sharp
try {
  sharp = (await import('sharp')).default
} catch {
  console.error('sharp is required:  npm i -D sharp  (or set NODE_PATH to a sharp install)')
  process.exit(1)
}

/* ------------------------------------------------------------------ helpers */

const rad = (deg) => (deg * Math.PI) / 180
const norm360 = (deg) => ((deg % 360) + 360) % 360

/**
 * Chroma-key a flat green screen. Green dominance decides alpha; the colour itself is
 * desaturated toward max(r,b) so no green fringe survives on light skin or white chalk.
 */
async function key(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const px = data
  const { width, height } = info
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i]
    const g = px[i + 1]
    const b = px[i + 2]
    const d = g - Math.max(r, b)
    if (d <= 4) continue
    px[i + 1] = Math.min(g, Math.max(r, b) + 10)
    const a = d >= 48 ? 0 : Math.round(255 * (1 - (d - 4) / 44))
    if (a < px[i + 3]) px[i + 3] = a
  }
  return sharp(Buffer.from(px.buffer, px.byteOffset, px.byteLength), { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer()
}

/** Opaque matte geometry: the anchor point, the alpha centroid, and the silhouette box. */
async function analyse(buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height } = info
  let sx = 0
  let sy = 0
  let n = 0
  let minX = width
  let minY = height
  let maxX = 0
  let maxY = 0
  let bestSum = Infinity
  let anchor = { x: 0, y: 0 }
  let leftmost = { x: Infinity, y: 0 }
  const bottomRow = []
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = data[(y * width + x) * 4 + 3]
      if (a < 160) continue
      sx += x
      sy += y
      n++
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
      if (x + y < bestSum) {
        bestSum = x + y
        anchor = { x, y }
      }
      if (x < leftmost.x || (x === leftmost.x && y < leftmost.y)) leftmost = { x, y }
      if (y > maxY - 3) bottomRow.push(x)
    }
  }
  // centre of the felt pad = middle of the matte's bottom rows
  const felt = { x: bottomRow.length ? bottomRow.reduce((a, b) => a + b, 0) / bottomRow.length : anchor.x, y: maxY }

  // principal axis of the pad (PCA over the bottom band): an eraser is used flat, so the
  // pad's long axis — not the arm direction — is what has to end up horizontal.
  const band = Math.max(4, Math.round((maxY - minY) * 0.14))
  let n2 = 0
  let mx = 0
  let my = 0
  for (let y = Math.max(minY, maxY - band); y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (data[(y * width + x) * 4 + 3] < 160) continue
      mx += x
      my += y
      n2++
    }
  }
  mx /= Math.max(1, n2)
  my /= Math.max(1, n2)
  let sxx = 0
  let sxy = 0
  let syy = 0
  for (let y = Math.max(minY, maxY - band); y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (data[(y * width + x) * 4 + 3] < 160) continue
      const dx = x - mx
      const dy = y - my
      sxx += dx * dx
      sxy += dx * dy
      syy += dy * dy
    }
  }
  const theta = 0.5 * Math.atan2(2 * sxy, sxx - syy) // image space (y down)
  const feltAngle = (-theta * 180) / Math.PI // maths convention (y up)
  return { width, height, centroid: { x: sx / n, y: sy / n }, anchor, leftmost, felt, feltAngle, box: { minX, minY, maxX, maxY } }
}

/** Push a dark, near-neutral barrel toward a marker colour while keeping its shading. */
async function recolorBarrel(buf, geo, hex) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const px = data
  const { width, height } = info
  const target = {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  }
  // The barrel is the dark object between the nib and the hand: a band along the pen axis.
  const ax = geo.anchor.x
  const ay = geo.anchor.y
  const dx = Math.cos(rad(-42))
  const dy = -Math.sin(rad(-42))
  const len = width * 0.75
  const halfWidth = width * 0.075
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      if (px[i + 3] < 200) continue
      const vx = x - ax
      const vy = y - ay
      const along = vx * dx + vy * dy
      if (along < 0 || along > len) continue
      const across = Math.abs(-vx * dy + vy * dx)
      if (across > halfWidth) continue
      const r = px[i]
      const g = px[i + 1]
      const b = px[i + 2]
      const lum = 0.299 * r + 0.587 * g + 0.114 * b
      const neutral = Math.max(r, g, b) - Math.min(r, g, b) < 42
      if (!neutral || lum > 132) continue
      const k = lum / 70 // 0 at black, ~1.9 at the barrel's highlight
      px[i] = Math.min(255, target.r * k * 1.05)
      px[i + 1] = Math.min(255, target.g * k * 1.05)
      px[i + 2] = Math.min(255, target.b * k * 1.05)
    }
  }
  return sharp(Buffer.from(px.buffer, px.byteOffset, px.byteLength), { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer()
}

/**
 * Rotate so the tool points at `angle` (deg above the leftward horizontal), trim the
 * transparent margins, then fit to the natural size. The shipped PNG is *not* cropped to
 * the anchor: instead the anchor's position inside the image is measured and published in
 * the manifest (`ax`,`ay`) — that is what lets a flat tool like the eraser sit with its pad
 * centred on the ink while the hand stays above the wipe line.
 */
async function normalise(buf, geo, spec) {
  let rotate
  if (spec.anchor === 'felt') {
    // flat tool: make the pad's long axis horizontal
    rotate = -geo.feltAngle
    while (rotate > 90) rotate -= 180
    while (rotate < -90) rotate += 180
  } else {
    const dir = { x: geo.anchor.x - geo.centroid.x, y: geo.anchor.y - geo.centroid.y }
    const current = (Math.atan2(-dir.y, dir.x) * 180) / Math.PI // maths convention (y up)
    const target = 180 - spec.angle // "up-left by angle°"
    rotate = norm360(current - target)
    if (rotate > 180) rotate -= 360
  }

  const rotated = await sharp(buf).rotate(rotate, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
  const resized = await sharp(await sharp(rotated).trim({ threshold: 1 }).png().toBuffer())
    .resize(spec.designW ? { width: OUT_HEIGHT } : { height: OUT_HEIGHT })
    .sharpen({ sigma: 0.6 })
    .png(QUALITY)
    .toBuffer()

  const meta = await sharp(resized).metadata()
  const check = await analyse(resized)
  const anchor = spec.anchor === 'felt' ? check.felt : check.anchor
  return { buffer: resized, meta, rotate, check, ax: Math.round(anchor.x), ay: Math.round(anchor.y) }
}

/* --------------------------------------------------------------------- run */

if (!fs.existsSync(SRC_DIR)) {
  console.error(`missing source plates in ${SRC_DIR} — see docs/WHITEBOARD_HAND.md §4 for the prompts`)
  process.exit(1)
}
fs.mkdirSync(OUT_DIR, { recursive: true })
fs.mkdirSync(REVIEW_DIR, { recursive: true })

const manifest = []
for (const spec of ASSETS) {
  const input = `${SRC_DIR}/${spec.file}.png`
  if (!fs.existsSync(input)) {
    console.error(`missing ${input} — skipped`)
    continue
  }
  let buf = await key(input)
  buf = await sharp(buf).trim({ threshold: 1 }).png().toBuffer()
  const geo = await analyse(buf)
  if (spec.recolorBarrel) {
    buf = await recolorBarrel(buf, geo, spec.recolorBarrel)
    buf = await sharp(buf).png().toBuffer()
  }
  const built = await normalise(buf, geo, spec)
  fs.writeFileSync(path.join(OUT_DIR, `${spec.name}.png`), built.buffer)
  fs.writeFileSync(path.join(REVIEW_DIR, `${spec.name}.png`), built.buffer)
  const drawW = spec.designW ?? (spec.designH * built.meta.width) / built.meta.height
  const drawH = spec.designH ?? (spec.designW * built.meta.height) / built.meta.width
  manifest.push({ name: spec.name, w: built.meta.width, h: built.meta.height, drawW, drawH, ax: built.ax, ay: built.ay, kb: Math.round(built.buffer.length / 1024) })
  console.log(
    `${spec.name.padEnd(12)} ${String(built.meta.width).padStart(4)}×${String(built.meta.height).padStart(3)}  ` +
      `${String(Math.round(built.buffer.length / 1024)).padStart(4)}kB  rotate=${built.rotate.toFixed(1)}°  ` +
      `anchor=(${built.ax},${built.ay})  box=${built.check.box.minX},${built.check.box.minY}..${built.check.box.maxX},${built.check.box.maxY}`,
  )
}

// Manifest for the runtime: natural size + the design-space size to draw at.
const styles = {
  'marker-dark': 'marker-dark',
  'marker-blue': 'marker-blue',
  pencil: 'pencil',
  chalk: 'chalk',
  eraser: 'eraser',
  palm: 'palm',
}
const entries = manifest
  .map((m) => {
    const spec = ASSETS.find((a) => a.name === m.name)
    const fit = spec.designH ? `designH: ${spec.designH}` : `designW: ${spec.designW}`
    return `  '${m.name}': { src: '/hands/${m.name}.png', natW: ${m.w}, natH: ${m.h}, ax: ${m.ax}, ay: ${m.ay}, ${fit} },`
  })
  .join('\n')
const ts = `/**
 * GENERATED by scripts/build-hand-assets.mjs — do not edit by hand.
 *
 * Whiteboard hand photo assets. \`natW\`/\`natH\` are the PNG's real pixels; \`ax\`/\`ay\`
 * is where the *working point* (marker nib, pencil point, chalk end, centre of the eraser
 * pad, fingertips of the flat palm) sits inside those pixels; \`designH\`/\`designW\` is the
 * size to draw in slide design px (1280×720 space) — ~2× oversampling for retina and for
 * video export. The runtime draws the image at (pen − anchor).
 */
export interface HandAsset {
  src: string
  natW: number
  natH: number
  /** working point inside the PNG (natural px) */
  ax: number
  ay: number
  /** draw at this height (design px) — pens, pencils, chalk */
  designH?: number
  /** draw at this width (design px) — eraser, flat palm */
  designW?: number
}

export const HAND_ASSETS: Record<string, HandAsset> = {
${entries}
}

/** Copy from the surveyed engines: one main hand, one off hand (docs/WHITEBOARD_HAND.md §2). */
export type HandAssetKey = 'marker-dark' | 'marker-blue' | 'pencil' | 'chalk' | 'eraser' | 'palm'

export function handAsset(key: HandAssetKey): HandAsset {
  return HAND_ASSETS[key] ?? HAND_ASSETS['marker-dark']
}

/** Design-space width of an asset once drawn. */
export function handDrawWidth(a: HandAsset): number {
  return a.designH ? (a.designH * a.natW) / a.natH : (a.designW as number)
}

/** Design-space height of an asset once drawn. */
export function handDrawHeight(a: HandAsset): number {
  return a.designW ? (a.designW * a.natH) / a.natW : (a.designH as number)
}
`
fs.writeFileSync('src/animation/handAssets.ts', ts)

/* ------------------------------------------------------------- review sheets
 * Two sheets are written to .tmp-verify/hands/ so the rig can be eyeballed without a
 * browser: one board per tool (size + nib alignment) and one hand travelling along a
 * fake writing path (the motion the engine actually produces).
 */
const SLIDE_W = 1280
const SLIDE_H = 720
const PANEL_W = Math.floor(1600 / 3) // 3 panels across
const PANEL_H = Math.round((PANEL_W * SLIDE_H) / SLIDE_W)
const k = PANEL_W / SLIDE_W

const href = (name) => `data:image/png;base64,${fs.readFileSync(path.join(REVIEW_DIR, `${name}.png`)).toString('base64')}`
const img = (m, x, y) => {
  const w = m.drawW ?? (m.drawH * m.w) / m.h
  const h = m.drawH ?? (m.drawW * m.h) / m.w
  const k = h / m.h // natural px → design px
  return `<image x="${(x - m.ax * k).toFixed(1)}" y="${(y - m.ay * k).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" href="${href(m.name)}"/>`
}
const board = (inner) =>
  `<rect width="${SLIDE_W}" height="${SLIDE_H}" fill="#fff"/>
   <text x="120" y="170" font-family="Arial, Helvetica" font-size="62" fill="#111">Whiteboard title</text>
   <line x1="120" y1="205" x2="880" y2="205" stroke="#e2e6ee" stroke-width="4"/>
   <text x="120" y="292" font-family="Arial, Helvetica" font-size="34" fill="#6b7280">second line of the story being drawn</text>${inner}`
const panel = (i, label, inner) => {
  const ox = (i % 3) * PANEL_W
  const oy = Math.floor(i / 3) * PANEL_H
  return `<g transform="translate(${ox},${oy})">
  <rect width="${PANEL_W}" height="${PANEL_H}" fill="#fff" stroke="#c9ced8"/>
  <g transform="scale(${k})">${inner}</g>
  <text x="8" y="15" font-family="monospace" font-size="12" fill="#374151">${label}</text>
 </g>`
}

let sheet = ''
manifest.forEach((m, i) => {
  const x = 470
  const y = 330
  const inner = board(
    `${img(m, x, y)}
     <g transform="translate(${x},${y})">
       <line x1="0" y1="0" x2="-200" y2="-180" stroke="#0a0" stroke-width="2.5" stroke-dasharray="10 7" opacity="0.45"/>
       <circle cx="0" cy="0" r="7" fill="none" stroke="#e11" stroke-width="3"/>
     </g>`,
  )
  sheet += panel(i, `${m.name}  ${m.w}×${m.h} → ${Math.round(m.drawW ?? 0)}×${Math.round(m.drawH ?? 0)} design px`, inner)
})
fs.writeFileSync(
  path.join(REVIEW_DIR, 'sheet.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${PANEL_W * 3}" height="${PANEL_H * 2}"><rect width="100%" height="100%" fill="#eef1f6"/>${sheet}</svg>`,
)

// Trail: the marker writing along a wavy line, and the eraser wiping — the poses the
// motion engine produces (see src/animation/hand.ts).
const marker = manifest.find((m) => m.name === 'marker-dark')
const eraser = manifest.find((m) => m.name === 'eraser')
let trail = ''
const dots = []
for (let i = 0; i < 6; i++) {
  const p = i / 5
  const x = 300 + p * 640
  const y = 430 + Math.sin(p * Math.PI * 1.6) * 34
  dots.push({ x, y })
}
dots.forEach((d, i) => {
  trail += `<circle cx="${d.x}" cy="${d.y}" r="4" fill="#ef4444"/>`
  trail += img(marker, d.x, d.y)
})
trail = panel(0, 'marker trail — nib on every dot (6 poses)', board(trail))
let wipe = ''
for (let i = 0; i < 4; i++) {
  const x = 360 + i * 190
  const y = 420 + Math.sin(i * 2.2) * 26
  wipe += `<circle cx="${x}" cy="${y}" r="4" fill="#ef4444"/>`
  wipe += img(eraser, x, y)
}
wipe = panel(1, 'eraser — felt pad centred on every dot', board(wipe))
const palm = manifest.find((m) => m.name === 'palm')
let push = ''
for (let i = 0; i < 4; i++) push += img(palm, 300 + i * 160 + 420, 470)
push = panel(2, 'palm (push pose) — fingertips lead, arm trails', board(push))
fs.writeFileSync(
  path.join(REVIEW_DIR, 'trail.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${PANEL_W * 3}" height="${PANEL_H}"><rect width="100%" height="100%" fill="#eef1f6"/>${trail}${wipe}${push}</svg>`,
)
console.log('\nreview →', REVIEW_DIR + '/sheet.svg , ' + REVIEW_DIR + '/trail.svg')
