import assert from 'node:assert/strict'
import JSZip from 'jszip'
import esbuild from 'esbuild'

const { createOpenSlideFixture, importAurovaFile } = await import('../../.tmp-verify/open-slide-test.mjs')
const result = await createOpenSlideFixture()
const zip = await JSZip.loadAsync(new Uint8Array(await result.blob.arrayBuffer()))
const paths = Object.keys(zip.files)

function check(name, condition) {
  assert.ok(condition, name)
  console.log(`  ✓ ${name}`)
}

check('generates a runnable Open Slide workspace', paths.includes(`slides/${result.projectId}/index.tsx`) && paths.includes('package.json'))
check('pins the Open Slide runtime dependency', (await zip.file('package.json').async('string')).includes('"@open-slide/core": "2.0.1"'))
check('includes the Aurova round-trip document and report', paths.includes('aurova/presentation.aurova.json') && paths.includes('aurova/export-report.json'))
check('includes notes and the Open Slide page module', (await zip.file(`slides/${result.projectId}/index.tsx`).async('string')).includes('export const notes'))
check('records the Open Slide license notice', (await zip.file('THIRD_PARTY.md').async('string')).includes('MIT License'))

const sidecar = JSON.parse(await zip.file('aurova/presentation.aurova.json').async('string'))
const manifest = JSON.parse(await zip.file('aurova/assets-manifest.json').async('string'))
const imageId = Object.keys(manifest.assets)[0]
const mediaId = Object.keys(manifest.media)[0]
check('moves embedded image bytes to the ZIP and keeps an asset:// reference', sidecar.assets[imageId].src === `asset://${imageId}`)
check('moves embedded video bytes to the ZIP and keeps a media reference', sidecar.slides[0].elements.find((el) => el.id === mediaId).src === `asset://media/${mediaId}`)
const imageBytes = await zip.file(manifest.assets[imageId]).async('uint8array')
assert.deepEqual([...imageBytes], [1, 2, 3])
const videoBytes = await zip.file(manifest.media[mediaId]).async('uint8array')
assert.deepEqual([...videoBytes], [1, 2, 3, 4])
check('packages media as binary files (not data URLs)', !sidecar.assets[imageId].src.startsWith('data:') && imageBytes.length === 3)

const title = sidecar.slides[0].elements.find((el) => el.kind === 'text')
check('sanitizes rich text before the generated code can render it', !title.content.includes('onclick') && !title.content.includes('<script>'))
const hints = JSON.parse(await zip.file('aurova/render-hints.json').async('string'))
const shape = sidecar.slides[0].elements.find((el) => el.kind === 'shape')
check('exports an SVG shape path and image mask hint', Boolean(hints.paths[shape.id]?.d) && Boolean(Object.keys(hints.masks).length))
check('produces a non-empty, self-contained archive', result.blob.size > 1000 && result.slides === 1 && result.assets === 2)

for (const path of [`aurova/renderer.tsx`, `slides/${result.projectId}/index.tsx`]) {
  const source = await zip.file(path).async('string')
  await esbuild.transform(source, { loader: 'tsx', format: 'esm' })
}
await esbuild.transform(await zip.file('aurova/assets.ts').async('string'), { loader: 'ts', format: 'esm' })
check('generated renderer, slide TSX and asset imports parse as source code', true)

const archiveFile = new File([result.blob], result.fileName, { type: 'application/zip' })
const imported = await importAurovaFile(archiveFile)
check('imports the generated Open Slide ZIP back into Aurova', imported.slides.length === 1 && imported.metadata.title === 'Aurova bridge fixture')
check('restores image and video data URLs for local editing', imported.assets[imageId].src === 'data:image/png;base64,AQID' && imported.slides[0].elements.find((el) => el.id === mediaId).src === 'data:video/webm;base64,AQIDBA==')
check('assigns a fresh project id on re-import', imported.id !== sidecar.id)

console.log(`\nOpen Slide bridge: ${result.slides} slide, ${result.assets} packaged assets, ${Math.round(result.blob.size / 1024)} KiB.`)
