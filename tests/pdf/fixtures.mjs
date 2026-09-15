/**
 * Test PDF fixtures generator (Node, dev-only).
 * Builds real PDFs covering the 8 scenarios from PDF_ANALYSIS_RESEARCH.md §7:
 * EN simple, FR, tables, Arabic (shaped via pdfkit+fontkit), AR+EN mixed,
 * scanned (image-only), embedded images, complex two-column design.
 */
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const OUT = '/tmp/pdf-fixtures'
fs.mkdirSync(OUT, { recursive: true })

/* ---------------------------------------------------------------- raw PDF builder */
class PdfBuilder {
  constructor() {
    this.objects = [] // [{id, body}]
  }
  add(body) {
    this.objects.push(body)
    return this.objects.length // 1-based id
  }
  build({ root = 1 } = {}) {
    const infoId = this.add('<< /Producer (KADMATI fixtures) >>')
    let out = '%PDF-1.4\n'
    const offsets = [0]
    this.objects.forEach((body, i) => {
      offsets.push(Buffer.byteLength(out, 'latin1'))
      out += `${i + 1} 0 obj\n${body}\nendobj\n`
    })
    const catalogId = this.objects.length + 1
    offsets.push(Buffer.byteLength(out, 'latin1'))
    out += `${catalogId} 0 obj\n<< /Type /Catalog /Pages ${root} 0 R >>\nendobj\n`
    const xrefPos = Buffer.byteLength(out, 'latin1')
    const count = this.objects.length + 1
    out += `xref\n0 ${count + 1}\n0000000000 65535 f \n`
    for (let i = 1; i <= count; i++) out += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
    out += `trailer\n<< /Size ${count + 1} /Root ${catalogId} 0 R /Info ${infoId} 0 R >>\nstartxref\n${xrefPos}\n%%EOF`
    return Buffer.from(out, 'latin1')
  }
}

function textStream(content) {
  return `BT ${content} ET`
}

function makePage(content, fontRefs, width = 612, height = 792) {
  const kids = Array.isArray(content) ? content : [content]
  return kids
}

/** Simple single-font, single-page doc. ops(text ops) receive helper fns. */
function simpleDoc(pagesContent, { fonts = { F1: 'Helvetica', F2: 'Helvetica-Bold' }, width = 612, height = 792 } = {}) {
  const b = new PdfBuilder()
  const fontIds = {}
  for (const [key, base] of Object.entries(fonts)) {
    fontIds[key] = b.add(`<< /Type /Font /Subtype /Type1 /BaseFont /${base} /Encoding /WinAnsiEncoding >>`)
  }
  const fontDict = Object.entries(fontIds).map(([k, id]) => `/${k} ${id} 0 R`).join(' ')
  const pageIds = []
  const pagesId = b.add('<< >>') // placeholder for Pages
  for (const content of pagesContent) {
    const contentId = b.objects.length + 2 // page takes +1, its content stream takes +2
    const pageId = b.add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << ${fontDict} >> >> /Contents ${contentId} 0 R >>`)
    b.add(`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`)
    pageIds.push(pageId)
  }
  // rewrite Pages object
  b.objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`
  return b.build({ root: pagesId })
}

const T = (font, size, x, y, text) => `/${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${text.replace(/([()\\])/g, '\\$1')}) Tj `

/* ---------------------------------------------------------------- EN fixture: 3 pages, headings/bullets/footer/table image */
function enFixture() {
  // constant footer text (furniture) + a standalone page number on its own baseline
  const footer = (page) => T('F1', 8, 240, 24, 'Confidential - Internal Use') + T('F1', 8, 560, 6, `${page}`)
  const p1 = textStream(
    T('F2', 26, 72, 700, 'Quarterly Business Report') +
      T('F1', 12, 72, 660, 'Prepared by the strategy team for the executive committee.') +
      T('F2', 15, 72, 600, 'Executive summary') +
      T('F1', 11, 72, 570, 'The company delivered strong results this quarter despite a challenging market.') +
      T('F1', 11, 72, 554, 'Growth was driven by the new product line and expanding enterprise accounts.') +
      T('F2', 15, 72, 510, 'Key highlights') +
      T('F1', 11, 84, 480, '-') + T('F1', 11, 84, 464, '-') + T('F1', 11, 84, 448, '-') +
      T('F1', 11, 96, 480, 'Revenue grew 18% year over year, reaching an all-time high.') +
      T('F1', 11, 96, 464, 'Customer retention improved to 94% after the onboarding redesign.') +
      T('F1', 11, 96, 448, 'Operating costs fell by 6% following the infrastructure migration.') +
      footer(1),
  )
  const p2 = textStream(
    T('F2', 15, 72, 700, 'Detailed results') +
      T('F1', 11, 72, 670, 'Every region contributed positively to the quarter. The details below break down') +
      T('F1', 11, 72, 654, 'performance by segment and highlight the main risks for the next quarter.') +
      T('F1', 11, 72, 620, 'Product revenue doubled after the March launch, while services remained stable.') +
      T('F1', 11, 72, 604, 'The enterprise pipeline is the strongest it has been in two years.') +
      footer(2),
  )
  const p3 = textStream(
    T('F2', 15, 72, 700, 'Outlook') +
      T('F1', 11, 72, 670, 'We expect moderate growth next quarter with continued investment in R&D.') +
      T('F1', 11, 72, 654, 'Hiring plans focus on engineering and customer success teams.') +
      footer(3),
  )
  return simpleDoc([p1, p2, p3])
}

/* ---------------------------------------------------------------- FR fixture */
function frFixture() {
  const p1 = textStream(
    T('F2', 24, 72, 700, 'Rapport annuel 2026') +
      T('F1', 12, 72, 660, 'Résumé exécutif du département financier.') +
      T('F2', 14, 72, 620, 'Points clés') +
      T('F1', 11, 72, 590, "Le chiffre d'affaires a augmenté de 12% malgré un marché difficile.") +
      T('F1', 11, 72, 574, "Les dépenses opérationnelles ont diminué grâce à l'automatisation.") +
      T('F1', 11, 72, 558, 'La satisfaction client atteint un niveau record de 96%.'),
  )
  return simpleDoc([p1])
}

/* ---------------------------------------------------------------- table fixture (geometric grid) */
function tableFixture() {
  const cols = [72, 240, 340, 460]
  const rows = [
    ['Metric', 'Q1', 'Q2', 'Change'],
    ['Revenue', '1,240', '1,380', '+11%'],
    ['Customers', '320', '368', '+15%'],
    ['Churn', '4.2%', '3.1%', '-1.1pt'],
    ['NPS', '48', '56', '+8'],
  ]
  let content = T('F2', 16, 72, 700, 'Key metrics')
  rows.forEach((row, ri) => {
    const y = 640 - ri * 22
    row.forEach((cell, ci) => {
      content += T(ri === 0 ? 'F2' : 'F1', 11, cols[ci], y, cell)
    })
  })
  content += T('F1', 11, 72, 500, 'The table above summarizes the performance of each business unit this year.')
  return simpleDoc([textStream(content)])
}

/* ---------------------------------------------------------------- image fixture (embedded RGB XObject) */
function imageFixture() {
  const W = 240
  const H = 140
  const rgb = Buffer.alloc(W * H * 3)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 3
      rgb[i] = Math.round((x / W) * 255)
      rgb[i + 1] = Math.round((y / H) * 160)
      rgb[i + 2] = 200 - Math.round((x / W) * 160)
    }
  }
  const compressed = zlib.deflateSync(rgb)
  const b = new PdfBuilder()
  const fontId = b.add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>')
  const xobject = b.add(
    `<< /Type /XObject /Subtype /Image /Width ${W} /Height ${H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${compressed.length} >>\nstream\n`,
    )
  // write stream manually
  const pagesId = b.add('<< >>')
  const content = `q 240 0 0 140 72 400 cm /Im1 Do Q BT /F1 12 Tf 1 0 0 1 72 560 Tm (Figure 1: gradient chart preview) Tj BT /F1 16 Tf 1 0 0 1 72 720 Tm (Report with visuals) Tj ET`
  const contentId = b.add(`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`)
  const pageId = b.add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> /XObject << /Im1 ${xobject} 0 R >> >> /Contents ${contentId} 0 R >>`)
  b.objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageId} 0 R] /Count 1 >>`
  // rebuild the image object body with its stream payload
  b.objects[xobject - 1] =
    `<< /Type /XObject /Subtype /Image /Width ${W} /Height ${H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${compressed.length} >>\nstream\n` +
    compressed.toString('latin1') +
    '\nendstream'
  return b.build({ root: pagesId })
}

/* ---------------------------------------------------------------- scanned fixture (image-only page) */
function scannedFixture() {
  const W = 480
  const H = 640
  const gray = Buffer.alloc(W * H)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) gray[y * W + x] = ((x * 7 + y * 3) % 5) + 220
  // dark "text-like" bars
  for (let k = 0; k < 24; k++) {
    const y = 60 + k * 22
    const len = 120 + ((k * 53) % 240)
    for (let yy = y; yy < y + 9 && yy < H; yy++) for (let xx = 40; xx < 40 + len && xx < W; xx++) gray[yy * W + xx] = 30
  }
  const compressed = zlib.deflateSync(gray)
  const b = new PdfBuilder()
  const xobject = b.add('<< >>')
  const pagesId = b.add('<< >>')
  const content = `q 480 0 0 640 66 76 cm /Im1 Do Q`
  const contentId = b.add(`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`)
  const pageId = b.add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /XObject << /Im1 ${xobject} 0 R >> >> /Contents ${contentId} 0 R >>`)
  b.objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageId} 0 R] /Count 1 >>`
  b.objects[xobject - 1] =
    `<< /Type /XObject /Subtype /Image /Width ${W} /Height ${H} /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode /Length ${compressed.length} >>\nstream\n` +
    compressed.toString('latin1') +
    '\nendstream'
  return b.build({ root: pagesId })
}

/* ---------------------------------------------------------------- complex fixture (two-column + header) */
function complexFixture() {
  const header = (page) => T('F1', 9, 250, 758, 'Annual Strategy Document 2026') + T('F1', 9, 560, 40, `${page}`)
  const left = (y, text, bold = false) => T(bold ? 'F2' : 'F1', 10.5, 60, y, text)
  const right = (y, text) => T('F1', 10.5, 375, y, text)
  let p2 = T('F2', 18, 60, 700, 'Market analysis')
  const leftLines = [
    'The European market grew steadily this',
    'year with demand concentrated in the',
    'enterprise segment. Mid-market deals',
    'slowed while strategic accounts',
    'expanded their contracts.',
  ]
  leftLines.forEach((t, i) => p2 += left(660 - i * 16, t))
  const rightLines = [
    'In contrast, the regional market showed',
    'resilience with double-digit growth in',
    'services. Partnerships signed this year',
    'opened two new channels, and the localized',
    'tiers outperformed expectations.',
  ]
  rightLines.forEach((t, i) => p2 += right(660 - i * 16, t))
  p2 += header(2)
  let p1 = T('F2', 24, 60, 700, 'Strategy 2026') + T('F1', 11, 60, 664, 'Full-year operating plan and market outlook.') + header(1)
  return simpleDoc([p1, p2])
}

/* ---------------------------------------------------------------- Arabic fixtures (pdfkit + Vazirmatn via fontkit shaping) */
async function arabicFixtures() {
  const PDFDocument = (await import('pdfkit')).default
  const fontDir = 'node_modules/vazirmatn/fonts/ttf'
  const regular = path.join(fontDir, 'Vazirmatn-Regular.ttf')
  const bold = path.join(fontDir, 'Vazirmatn-Bold.ttf')
  if (!fs.existsSync(regular)) throw new Error('vazirmatn TTF not found')

  const make = (fileName, draw) =>
    new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margins: { top: 64, bottom: 64, left: 64, right: 64 }, info: { Title: fileName } })
      const chunks = []
      doc.on('data', (c) => chunks.push(c))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)
      draw(doc)
      doc.end()
    })

  const ar = await make('ar.pdf', (doc) => {
    doc.font(bold).fontSize(26).text('مستقبل الذكاء الاصطناعي')
    doc.moveDown(0.5).font(regular).fontSize(12).text('تقرير شامل عن أثر الذكاء الاصطناعي على الشركات الحديثة واقتصاد المعرفة.')
    doc.moveDown(1).fontSize(15).fillColor('#1a3a6b').text('المحاور الرئيسية')
    doc.moveDown(0.3).fontSize(11).fillColor('#222')
    doc.text('• تطور نماذج التعلم العميق خلال السنوات الخمس الأخيرة.')
    doc.text('• أتمتة العمليات اليومية وتوفير تكاليف تشغيلية كبيرة.')
    doc.text('• تحليل البيانات الضخمة ودعم قرارات الإدارة بالأرقام.')
    doc.moveDown(1).fontSize(15).fillColor('#1a3a6b').text('التحديات')
    doc.moveDown(0.3).fontSize(11).fillColor('#222')
    doc.text('يواجه قطاع الذكاء الاصطناعي تحديات في الخصوصية وجودة البيانات. تحتاج المؤسسات إلى استراتيجية واضحة للتدريب والحوكمة قبل التوسع في التطبيقات.')
  })

  const mixed = await make('mixed.pdf', (doc) => {
    doc.font(bold).fontSize(24).text('الذكاء الاصطناعي و Machine Learning')
    doc.moveDown(0.5).font(regular).fontSize(12)
    doc.text('يستخدم نظام KADMATI نماذج Deep Learning لتحليل المستندات واستخراج الجداول والصور تلقائيًا.')
    doc.text('يمكن للفريق الهندسي مراجعة النتائج وتصديرها بصيغة PPTX أو PDF خلال دقائق.')
  })

  return { ar, mixed }
}

/* ---------------------------------------------------------------- write all */
const files = {
  'en-report.pdf': enFixture(),
  'fr-report.pdf': frFixture(),
  'table.pdf': tableFixture(),
  'image.pdf': imageFixture(),
  'scanned.pdf': scannedFixture(),
  'complex.pdf': complexFixture(),
}
for (const [name, buf] of Object.entries(files)) fs.writeFileSync(path.join(OUT, name), buf)

const { ar, mixed } = await arabicFixtures()
fs.writeFileSync(path.join(OUT, 'ar-report.pdf'), ar)
fs.writeFileSync(path.join(OUT, 'mixed.pdf'), mixed)

console.log('fixtures written to', OUT, '->', fs.readdirSync(OUT).join(', '))
