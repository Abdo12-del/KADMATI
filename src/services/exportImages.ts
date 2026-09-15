/**
 * Image & PDF export.
 *
 * • PNG/JPG come from the *same DOM* the editor paints (html-to-image, MIT) — what you design is
 *   what you get, fonts and all.
 * • PDF is built by hand as a minimal PDF-1.4 container that embeds those JPEGs with DCTDecode.
 *   It is intentionally dependency-free and lossless-with-respect-to-the-render. A vector PDF
 *   (selectable text) is planned via the print path in Phase 4+; the layout below is already
 *   paginated per slide so swapping the page writer does not change the UI.
 */
import JSZip from 'jszip'
import { toJpeg, toPng } from 'html-to-image'
import type { Presentation } from '../document/types'
import { fileNameSafe } from '../lib/cn'

export type RasterFormat = 'png' | 'jpg'

export interface RasterOptions {
  scale?: number
  quality?: number
  format?: RasterFormat
  /** Which slides to export; defaults to all visible ones. */
  slideIds?: string[]
  onProgress?: (done: number, total: number, label: string) => void
  /** Renders one slide to a detached element. Provided by the app (uses the shared renderer). */
  renderSlide: (index: number, width: number, height: number) => Promise<HTMLElement>
  dispose?: () => void
}

export interface CapturedSlide {
  index: number
  dataUrl: string
  blob: Blob
  width: number
  height: number
}

export async function captureSlides(doc: Presentation, opts: RasterOptions): Promise<CapturedSlide[]> {
  const scale = opts.scale ?? 2
  const quality = opts.quality ?? 0.92
  const wanted = opts.slideIds ? doc.slides.filter((s) => opts.slideIds!.includes(s.id)) : doc.slides.filter((s) => !s.hidden)
  const out: CapturedSlide[] = []
  let i = 0
  for (const slide of wanted) {
    const index = doc.slides.indexOf(slide)
    i++
    opts.onProgress?.(i, wanted.length, `شريحة ${index + 1}`)
    const node = await opts.renderSlide(index, doc.size.w, doc.size.h)
    const dataUrl =
      opts.format === 'jpg'
        ? await toJpeg(node, { quality, pixelRatio: scale, backgroundColor: '#ffffff', cacheBust: true })
        : await toPng(node, { pixelRatio: scale, cacheBust: true, backgroundColor: '#ffffff' })
    const blob = await (await fetch(dataUrl)).blob()
    out.push({ index, dataUrl, blob, width: doc.size.w * scale, height: doc.size.h * scale })
    node.remove()
  }
  opts.dispose?.()
  return out
}

export async function exportImagesZip(doc: Presentation, opts: RasterOptions & { format?: RasterFormat }): Promise<{ blob: Blob; fileName: string }> {
  const shots = await captureSlides(doc, opts)
  const zip = new JSZip()
  const base = fileNameSafe(doc.metadata.title)
  shots.forEach((shot, i) => {
    const n = String(i + 1).padStart(2, '0')
    zip.file(`${base}/${n}.${opts.format === 'jpg' ? 'jpg' : 'png'}`, shot.blob)
  })
  zip.file(
    `${base}/manifest.json`,
    JSON.stringify(
      {
        title: doc.metadata.title,
        slides: shots.length,
        size: { w: doc.size.w, h: doc.size.h },
        scale: opts.scale ?? 2,
        exportedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  )
  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/zip', compression: 'STORE' })
  return { blob, fileName: `${base}-images.zip` }
}

/* ------------------------------------------------------------------ PDF */

export async function exportPdf(doc: Presentation, opts: RasterOptions & { format?: RasterFormat }): Promise<{ blob: Blob; fileName: string }> {
  const shots = await captureSlides(doc, { ...opts, format: 'jpg' })
  const pages = await Promise.all(
    shots.map(async (shot) => ({ bytes: await jpegBytes(shot.dataUrl), width: shot.width, height: shot.height })),
  )
  const blob = buildPdf(pages, doc.size.w, doc.size.h, doc.metadata.title)
  return { blob, fileName: `${fileNameSafe(doc.metadata.title)}.pdf` }
}

async function jpegBytes(dataUrl: string): Promise<Uint8Array> {
  const res = await fetch(dataUrl)
  const buf = await res.arrayBuffer()
  return new Uint8Array(buf)
}

/** Minimal, valid PDF 1.4 with one DCTDecode image per page. */
export function buildPdf(pages: { bytes: Uint8Array; width: number; height: number }[], designW: number, designH: number, title = 'AUROVA'): Blob {
  void title
  const enc = new TextEncoder()
  const chunks: (Uint8Array | string)[] = []
  const offsets: number[] = []
  let lastId = 0
  let length = 0
  const push = (v: Uint8Array | string) => {
    chunks.push(v)
    length += typeof v === 'string' ? enc.encode(v).length : v.length
  }
  const obj = (id: number, body: string | (string | Uint8Array)[]) => {
    offsets[id] = length
    lastId = Math.max(lastId, id)
    push(`${id} 0 obj\n`)
    if (typeof body === 'string') push(body)
    else for (const part of body) push(part)
    push('\nendobj\n')
  }

  const pageCount = pages.length
  const kids = pages.map((_, i) => `${4 + i * 3} 0 R`).join(' ')

  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')
  obj(1, `<< /Type /Catalog /Pages 2 0 R >>`)
  obj(2, `<< /Type /Pages /Kids [${kids}] /Count ${pageCount} >>`)
  obj(3, `<< /Producer (Aurova Studio) /Title (${pdfString(title)}) >>`)

  pages.forEach((page, i) => {
    const pageId = 4 + i * 3
    const contentId = pageId + 1
    const imageId = pageId + 2
    const w = points(designW)
    const h = points(designH)
    obj(pageId, `<< /Type /Page /Parent 2 0 R /Resources << /XObject << /Im${i} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`)
    const stream = `q ${w} 0 0 ${h} 0 0 cm /Im${i} Do Q`
    obj(contentId, [`<< /Length ${stream.length} >>\nstream\n`, enc.encode(stream), `\nendstream`])
    const header = `<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.bytes.length} >>\nstream\n`
    obj(imageId, [enc.encode(header), page.bytes, enc.encode('\nendstream')])
  })

  const count = lastId + 1
  let xref = `xref\n0 ${count}\n0000000000 65535 f \n`
  for (let i = 1; i < count; i++) {
    xref += `${String(offsets[i] ?? 0).padStart(10, '0')} 00000 n \n`
  }
  const xrefOffset = length
  push(xref)
  push(`trailer\n<< /Size ${count} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`)

  const blobParts: BlobPart[] = chunks.map((c) => (typeof c === 'string' ? (enc.encode(c) as BlobPart) : (c as BlobPart)))
  return new Blob(blobParts, { type: 'application/pdf' })
}

function pdfString(value: string): string {
  const safe = value.replace(/[\\()]/g, '')
  const ascii = [...safe].map((ch) => (ch.charCodeAt(0) < 128 ? ch : '?')).join('')
  return `(${ascii.slice(0, 120)})`
}

/** Design px → PDF points at 96dpi (72pt per inch). */
function points(px: number): number {
  return Math.round(px * 0.75 * 100) / 100
}
