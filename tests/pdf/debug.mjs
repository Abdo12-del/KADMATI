/** Debug: dump extracted lines/items for tricky fixtures. */
import fs from 'node:fs'
import { parsePdf } from '../../src/services/pdf/parse'

function readAb(p) {
  const b = fs.readFileSync(p)
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)
}

const which = process.argv[2] ?? 'ar'

if (which === 'ar' || which === 'all') {
  const { allLines } = await parsePdf(readAb('/tmp/pdf-fixtures/ar-report.pdf'), { thumbnails: false, extractImages: false })
  console.log('=== AR lines ===')
  for (const l of allLines[0]) console.log(JSON.stringify({ t: l.text.slice(0, 60), x: Math.round(l.bbox.x), y: Math.round(l.bbox.y), size: l.fontSize }))
}
if (which === 'en' || which === 'all') {
  const { allLines } = await parsePdf(readAb('/tmp/pdf-fixtures/en-report.pdf'), { thumbnails: false, extractImages: false })
  console.log('=== EN lines p1 ===')
  for (const l of allLines[0]) console.log(JSON.stringify({ t: l.text.slice(0, 70), x: Math.round(l.bbox.x), y: Math.round(l.bbox.y), size: l.fontSize }))
}
if (which === 'table' || which === 'all') {
  const { allLines } = await parsePdf(readAb('/tmp/pdf-fixtures/table.pdf'), { thumbnails: false, extractImages: false })
  console.log('=== TABLE lines ===')
  for (const l of allLines[0]) console.log(JSON.stringify({ t: l.text, x: Math.round(l.bbox.x), w: Math.round(l.bbox.w), y: Math.round(l.bbox.y) }))
}
if (which === 'img' || which === 'all') {
  const { allLines } = await parsePdf(readAb('/tmp/pdf-fixtures/image.pdf'), { thumbnails: false, extractImages: false })
  console.log('=== IMG lines ===')
  for (const l of allLines[0]) console.log(JSON.stringify({ t: l.text, size: l.fontSize }))
}
if (which === 'complex' || which === 'all') {
  const { allLines } = await parsePdf(readAb('/tmp/pdf-fixtures/complex.pdf'), { thumbnails: false, extractImages: false })
  console.log('=== COMPLEX p2 lines ===')
  for (const l of allLines[1]) console.log(JSON.stringify({ t: l.text.slice(0, 50), x: Math.round(l.bbox.x), y: Math.round(l.bbox.y), len: l.text.length }))
}
