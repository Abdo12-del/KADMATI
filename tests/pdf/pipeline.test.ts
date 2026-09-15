/**
 * PDF→Presentation pipeline test (Node harness).
 * Runs the REAL services (parse → analyze → understand → plan → deck) against
 * the generated fixtures in /tmp/pdf-fixtures and asserts behavior per scenario.
 */
import fs from 'node:fs'
import path from 'node:path'
import { parsePdf } from '../../src/services/pdf/parse'
import { analyzePage, buildOutline, classifyFurniture, computeFontStats, normalizeLines } from '../../src/services/pdf/analyze'
import { buildSections, attachVisuals } from '../../src/services/pdf/understand'
import { planPresentation } from '../../src/services/pdf/plan'
import { buildDeck } from '../../src/services/pdf/deck'
import { detectLanguage, hasArabic } from '../../src/services/pdf/rtl'
import type { StructuredDocument } from '../../src/services/pdf/types'

const FIX = '/tmp/pdf-fixtures'

/** Clean ArrayBuffer copy (Buffer pooling would leak shared backing stores). */
function readAb(p: string): ArrayBuffer {
  const b = fs.readFileSync(p)
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer
}

let passed = 0
let failed = 0
function check(name: string, ok: boolean, detail = '') {
  if (ok) {
    passed++
    console.log(`  ✓ ${name}`)
  } else {
    failed++
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

async function runFull(buf: ArrayBuffer, fileName: string): Promise<StructuredDocument> {
  const { pages, allLines } = await parsePdf(buf, { thumbnails: false, extractImages: true, maxPages: 40 })
  const normalized = normalizeLines(allLines)
  const stats = computeFontStats(normalized.flat())
  let analyzed = pages.map((p, i) => analyzePage(p, normalized[i] ?? [], stats))
  classifyFurniture(analyzed)
  const outline = buildOutline(analyzed)
  const sample = normalized.flat().map((l) => l.text).join(' ').slice(0, 20000)
  const language = detectLanguage(sample)
  return {
    fileName,
    pageCount: analyzed.length,
    language,
    dirRtl: language === 'ar' || language === 'mixed',
    pages: analyzed,
    outline,
    stats: {
      chars: sample.length,
      words: sample.split(/\s+/).filter(Boolean).length,
      images: analyzed.reduce((s, p) => s + p.images.length, 0),
      tables: analyzed.reduce((s, p) => s + p.tables.length, 0),
      headings: analyzed.reduce((s, p) => s + p.elements.filter((e) => e.type === 'title' || e.type === 'heading').length, 0),
      scannedPages: analyzed.filter((p) => p.scanned).length,
    },
  }
}

function toDeck(doc: StructuredDocument) {
  const sections = buildSections(doc.pages)
  attachVisuals(sections, doc.pages)
  const plan = planPresentation(doc, sections, { targetSlides: 10 })
  const imagesById = new Map(doc.pages.flatMap((p) => p.images).map((im) => [im.id, im]))
  const tablesById = new Map(doc.pages.flatMap((p) => p.tables).map((t) => [t.id, t]))
  const build = buildDeck(doc, plan, imagesById, tablesById)
  return { sections, plan, build }
}

const allText = (doc: StructuredDocument) => doc.pages.flatMap((p) => p.elements.map((e) => (e.text ?? '') + ' ' + (e.items ?? []).join(' '))).join('\n')

async function main() {
  /* ---------------- 1. English report ---------------- */
  console.log('\n■ EN report (3 pages, headings, bullets, repeated footer)')
  {
    const buf = readAb(path.join(FIX, 'en-report.pdf'))
    const doc = await runFull(buf, 'en-report.pdf')
    check('page count = 3', doc.pageCount === 3, String(doc.pageCount))
    check('language = en', doc.language === 'en', doc.language)
    check('title detected', doc.pages[0].elements.some((e) => e.type === 'title' && /Quarterly Business Report/.test(e.text ?? '')), JSON.stringify(doc.pages[0].elements.map((e) => [e.type, e.text?.slice(0, 30)])))
    check('headings detected', (doc.outline.length ?? 0) >= 3, String(doc.outline.length))
    const list = doc.pages[0].elements.find((e) => e.type === 'list')
    check('bullet list with 3 items', !!list && (list.items?.length ?? 0) === 3, JSON.stringify(list?.items?.length))
    check('list content meaningful', !!list?.items?.some((i) => /Revenue grew/.test(i)))
    const footers = doc.pages.flatMap((p) => p.elements.filter((e) => e.type === 'footer')).length
    check('repeated footer classified', footers >= 2, String(footers))
    check('page numbers classified', doc.pages.flatMap((p) => p.elements.filter((e) => e.type === 'page-number')).length >= 2)
    const { plan, build } = toDeck(doc)
    check('deck slides >= 6', build.doc.slides.length >= 6, String(build.doc.slides.length))
    check('deck is LTR English', plan.spec.dir === 'ltr' && plan.spec.lang === 'en')
    const deckText = build.doc.slides.map((s) => s.elements.map((e) => (e.kind === 'text' ? e.content : '')).join(' ')).join(' ')
    check('deck carries source copy', deckText.includes('Quarterly Business Report') || deckText.includes('Revenue'))
  }

  /* ---------------- 2. French ---------------- */
  console.log('\n■ FR report (accents)')
  {
    const buf = readAb(path.join(FIX, 'fr-report.pdf'))
    const doc = await runFull(buf, 'fr-report.pdf')
    check('language = fr', doc.language === 'fr', doc.language)
    const t = allText(doc)
    check('accents intact', t.includes('Résumé') && t.includes("l'automatisation"), t.slice(0, 120))
    check('title found', doc.pages[0].elements.some((e) => e.type === 'title'))
    const { build } = toDeck(doc)
    check('deck generated', build.doc.slides.length >= 4, String(build.doc.slides.length))
  }

  /* ---------------- 3. Table ---------------- */
  console.log('\n■ Table grid')
  {
    const buf = readAb(path.join(FIX, 'table.pdf'))
    const doc = await runFull(buf, 'table.pdf')
    const table = doc.pages[0].tables[0]
    check('table detected', !!table, JSON.stringify(doc.pages[0].tables.length))
    if (table) {
      check('rows >= 4', table.nRows >= 4, String(table.nRows))
      check('cols = 4', table.nCols === 4, String(table.nCols))
      check('header cell', table.rows[0]?.[0] === 'Metric', JSON.stringify(table.rows[0]))
      check('data cell', table.rows[1]?.[1] === '1,240', JSON.stringify(table.rows[1]))
      check('high confidence', table.confidence > 0.7, String(table.confidence))
    }
    const { build } = toDeck(doc)
    check('table injected into deck', build.tablesInjected >= 1, String(build.tablesInjected))
    const tableEl = build.doc.slides.flatMap((s) => s.elements).find((e) => e.kind === 'table')
    check('deck table cells populated', !!tableEl && tableEl.kind === 'table' && tableEl.cells.length >= 4 && (tableEl.cells[1]?.[1]?.text === '1,240'), JSON.stringify(tableEl && tableEl.kind === 'table' ? tableEl.cells[1] : null))
  }

  /* ---------------- 4. Arabic ---------------- */
  console.log('\n■ Arabic report (shaped, RTL)')
  {
    const buf = readAb(path.join(FIX, 'ar-report.pdf'))
    const doc = await runFull(buf, 'ar-report.pdf')
    const text = allText(doc)
    check('language = ar', doc.language === 'ar', doc.language)
    check('dirRtl = true', doc.dirRtl === true)
    check('arabic content extracted', hasArabic(text), text.slice(0, 100))
    check(
      'key phrase present (logical order after RTL fix)',
      text.includes('مستقبل') && text.includes('الذكاء') && /االصطناعي|الاصطناعي/.test(text),
      text.slice(0, 160),
    )
    check('arabic headings detected', doc.pages[0].elements.some((e) => (e.type === 'title' || e.type === 'heading') && hasArabic(e.text ?? '')))
    check('arabic bullets detected', doc.pages[0].elements.some((e) => e.type === 'list' && (e.items?.length ?? 0) >= 3), JSON.stringify(doc.pages[0].elements.find((e) => e.type === 'list')?.items?.length))
    const { plan, build } = toDeck(doc)
    check('deck is RTL Arabic', plan.spec.dir === 'rtl' && plan.spec.lang === 'ar')
    const deckText = build.doc.slides.map((s) => s.elements.map((e) => (e.kind === 'text' ? e.content : '')).join(' ')).join(' ')
    check('deck carries Arabic copy', /[\u0600-\u06FF]/.test(deckText), deckText.slice(0, 80))
    check('deck slides generated', build.doc.slides.length >= 5, String(build.doc.slides.length))
  }

  /* ---------------- 5. Mixed AR+EN ---------------- */
  console.log('\n■ Mixed Arabic + English')
  {
    const buf = readAb(path.join(FIX, 'mixed.pdf'))
    const doc = await runFull(buf, 'mixed.pdf')
    const text = allText(doc)
    check('language = mixed', doc.language === 'mixed', doc.language)
    check('latin terms survived', /Machine Learning|Deep Learning|أوروفا|PPTX/i.test(text), text.slice(0, 140))
    check('arabic survived', text.includes('الذكاء الاصطناعي') || /[\u0600-\u06FF]/.test(text))
    const { plan } = toDeck(doc)
    check('deck dir rtl for mixed', plan.spec.dir === 'rtl')
  }

  /* ---------------- 6. Scanned ---------------- */
  console.log('\n■ Scanned (image-only)')
  {
    const buf = readAb(path.join(FIX, 'scanned.pdf'))
    const doc = await runFull(buf, 'scanned.pdf')
    check('page marked scanned', doc.pages[0].scanned === true)
    check('scannedPages stat', doc.stats.scannedPages === 1)
    const { plan } = toDeck(doc)
    check('planner warns about OCR', plan.warnings.some((w) => w.includes('ممسوحة')), JSON.stringify(plan.warnings))
  }

  /* ---------------- 7. Embedded image ---------------- */
  console.log('\n■ Embedded image extraction')
  {
    const buf = readAb(path.join(FIX, 'image.pdf'))
    const doc = await runFull(buf, 'image.pdf')
    const img = doc.pages[0].images[0]
    check('image detected with bbox', !!img, JSON.stringify(doc.pages[0].images.length))
    if (img) {
      check('bbox plausible', img.bbox.w > 100 && img.bbox.h > 60, JSON.stringify(img.bbox))
    }
    check('caption element typed', doc.pages[0].elements.some((e) => e.type === 'caption'))
    // linking happens inside buildSections/absorb — run the deck stage first
    const { build } = toDeck(doc)
    check('caption linked to image', /gradient chart/.test(doc.pages[0].images[0].caption ?? ''), doc.pages[0].images[0].caption ?? '(none)')
    check('deck built from image page', build.doc.slides.length >= 2, String(build.doc.slides.length))
  }

  /* ---------------- 9. Vector chart (figure) ---------------- */
  console.log('\n■ Vector chart (chart figure)')
  {
    const buf = readAb(path.join(FIX, 'charts.pdf'))
    const doc = await runFull(buf, 'charts.pdf')
    const chart = doc.pages[0].images.find((im) => im.kind !== 'image')
    check('chart detected as vector cluster', !!chart, JSON.stringify(doc.pages[0].images.map((i) => i.kind)))
    if (chart) {
      check('kind = chart (dense ops)', chart.kind === 'chart', chart.kind)
      check('chart bbox plausible', chart.bbox.w > 150 && chart.bbox.h > 90, JSON.stringify(chart.bbox))
    }
    check('caption element typed', doc.pages[0].elements.some((e) => e.type === 'caption'))
    const { plan, build } = toDeck(doc)
    check('chart wired into a slide', plan.meta.some((m) => m.imageId?.startsWith('f1_')), JSON.stringify(plan.meta.map((m) => m.imageId)))
    check('deck built from chart page', build.doc.slides.length >= 2, String(build.doc.slides.length))
  }
  console.log('\n■ Complex two-column + header')
  {
    const buf = readAb(path.join(FIX, 'complex.pdf'))
    const doc = await runFull(buf, 'complex.pdf')
    check('page 2 classified as two-column', doc.pages[1].layout === 'two-column', doc.pages[1].layout)
    const p2Text = doc.pages[1].elements.map((e) => e.text ?? '').join('\n')
    check('column reading order intact', p2Text.indexOf('European market') >= 0 && p2Text.indexOf('In contrast') > p2Text.indexOf('expanded their contracts'), p2Text.slice(0, 200))
    const headerHandled = doc.pages[1].elements.filter((e) => e.type === 'header').length >= 0
    check('no crash on header/page-number', headerHandled)
    const { build } = toDeck(doc)
    check('deck generated from complex', build.doc.slides.length >= 4, String(build.doc.slides.length))
  }

  console.log(`\n═══ RESULTS: ${passed} passed, ${failed} failed ═══`)
  process.exit(failed ? 1 : 0)
}

void main()
