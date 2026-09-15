/**
 * PDF parsing (browser) — built on Mozilla pdf.js (Apache-2.0).
 *
 * What we extract per page, all with geometry:
 *  - text items → merged lines {text, bbox, fontSize, bold, font, rtl}
 *  - embedded images via the operator list (transform stack → placement bbox),
 *    converted to data URLs when canvas is available
 *  - a rendered thumbnail for the structure inspector
 *  - scanned-page detection (no text layer) → routed to the optional OCR path
 *
 * This is the only DOM/pdf.js-dependent module; every other stage is pure and
 * runs in tests without a browser.
 */
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import type { BBox, PdfImageData, PdfPage, ParseProgress, TextLine } from './types'
import { hasArabic } from './rtl'

export interface ParseOptions {
  maxPages?: number
  /** Render page thumbnails (browser). Default true. */
  thumbnails?: boolean
  /** Extract embedded images as data URLs (browser). Default true. */
  extractImages?: boolean
  onProgress?: (p: ParseProgress) => void
}

interface Frag {
  str: string
  x: number
  y: number
  w: number
  size: number
  font: string
  rtl: boolean
}

export interface ParseResult {
  pages: Array<Omit<PdfPage, 'elements' | 'tables' | 'images' | 'layout'> & { images: PdfImageData[] }>
  allLines: TextLine[][]
}

type PdfJsModule = typeof import('pdfjs-dist')

let pdfjsPromise: Promise<PdfJsModule> | null = null

async function loadPdfjs(): Promise<PdfJsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      // Node (tests/harness): use the legacy build with its fake worker.
      if (typeof window === 'undefined') {
        return (await import('pdfjs-dist/legacy/build/pdf.mjs')) as PdfJsModule
      }
      const mod = await import('pdfjs-dist')
      const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
      mod.GlobalWorkerOptions.workerSrc = workerUrl
      return mod
    })()
  }
  return pdfjsPromise
}

/** Load a PDF document proxy (also used by the OCR path to re-render pages). */
export async function loadPdfDocument(data: ArrayBuffer): Promise<PDFDocumentProxy> {
  const pdfjs = await loadPdfjs()
  // Standard-14 fonts and CMaps come from the version-pinned CDN; text extraction
  // works without them, rendering of non-embedded-font pages needs them online.
  const CDN = 'https://unpkg.com/pdfjs-dist@6.3.289'
  const isNode = typeof window === 'undefined'
  return pdfjs.getDocument({
    data: new Uint8Array(data),
    standardFontDataUrl: isNode ? 'node_modules/pdfjs-dist/standard_fonts/' : `${CDN}/standard_fonts/`,
    cMapUrl: isNode ? 'node_modules/pdfjs-dist/cmaps/' : `${CDN}/cmaps/`,
    cMapPacked: true,
    ...(isNode ? { useWorkerFetch: false as const, isEvalSupported: false as const } : {}),
  }).promise
}

/** Render one page to a fresh canvas at the given scale (thumbnails / OCR input). */
export async function renderPageToCanvas(page: PDFPageProxy, scale: number, background = '#ffffff'): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(viewport.width)
  canvas.height = Math.ceil(viewport.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('no ctx')
  ctx.fillStyle = background
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  await page.render({ canvas, canvasContext: ctx, viewport }).promise
  return canvas
}

export async function parsePdf(data: ArrayBuffer, opts: ParseOptions = {}): Promise<ParseResult> {
  const { maxPages = 60, thumbnails = true, extractImages = true, onProgress } = opts
  const { OPS } = await loadPdfjs()
  const doc = await loadPdfDocument(data)
  const pageCount = Math.min(doc.numPages, maxPages)
  const hasDom = typeof document !== 'undefined'

  const pages: ParseResult['pages'] = []
  const allLines: TextLine[][] = []

  for (let p = 1; p <= pageCount; p++) {
    onProgress?.({ stage: 'parse', done: p, total: pageCount, message: `تحليل الصفحة ${p} من ${pageCount}` })
    const page = await doc.getPage(p)
    const viewport = page.getViewport({ scale: 1 })
    const H = viewport.height
    const W = viewport.width

    // ---- text → lines
    const tc = await page.getTextContent()
    const rawItems = (tc.items as Array<{ str?: string; dir?: string; width?: number; height?: number; transform?: number[]; fontName?: string; hasEOL?: boolean }>).filter((it) => typeof it.str === 'string' && it.str.trim().length > 0)

    const frags: Frag[] = rawItems.map((it) => {
      const tr = it.transform ?? [1, 0, 0, 1, 0, 0]
      const size = Math.hypot(tr[1], tr[3]) || Math.abs(tr[3]) || 10
      const x = tr[4]
      const yTop = H - tr[5] - size
      const rtl = it.dir === 'rtl' || hasArabic(it.str ?? '')
      return { str: it.str ?? '', x, y: yTop, w: it.width ?? size * (it.str?.length ?? 1) * 0.5, size, font: fontLabel(tc.styles, it.fontName), rtl }
    })

    const lines = buildLines(frags, p)
    allLines.push(lines)
    const chars = lines.reduce((s, l) => s + l.text.length, 0)
    const scanned = chars < 32

    // ---- images
    const images: PdfImageData[] = []
    if (extractImages && !scanned) {
      try {
        images.push(...(await extractPageImages(OPS, page, p, W, H)))
      } catch {
        // image extraction is best-effort; bboxes from transforms already recorded
      }
    }

    // ---- thumbnail (+ pixel crops for visuals pdf.js can't hand us as objects:
    // vector figures/charts are cropped from the rendered page into real assets)
    let thumbnail: string | undefined
    if (thumbnails && hasDom) {
      try {
        thumbnail = (await renderPageToCanvas(page, Math.min(1.2, 640 / Math.max(W, H)))).toDataURL('image/jpeg', 0.72)
      } catch {
        thumbnail = undefined
      }
      if (extractImages && !scanned && images.some((im) => !im.dataUrl)) {
        try {
          const sc = Math.min(1.6, 1100 / Math.max(W, H))
          const canvas = await renderPageToCanvas(page, sc)
          for (const im of images) {
            if (im.dataUrl) continue
            im.dataUrl = cropRegionDataUrl(canvas, im.bbox, sc)
          }
        } catch {
          // cropping is best-effort; bbox+caption still flow through
        }
      }
    }

    pages.push({ index: p - 1, width: W, height: H, scanned, thumbnail, images })
  }

  return { pages, allLines }
}

function fontLabel(styles: Record<string, { fontFamily?: string }> | undefined, fontName?: string): string {
  if (!fontName) return ''
  return styles?.[fontName]?.fontFamily ?? fontName
}

/** Merge fragments into lines by baseline proximity, then into word-spaced strings. */
function buildLines(frags: Frag[], page: number): TextLine[] {
  if (!frags.length) return []
  const sorted = [...frags].sort((a, b) => a.y - b.y || a.x - b.x)
  const groups: Frag[][] = []
  for (const f of sorted) {
    const g = groups[groups.length - 1]
    if (g) {
      const ref = g[0]
      const tol = Math.max(1.6, Math.min(ref.size, f.size) * 0.45)
      if (Math.abs(f.y - ref.y) <= tol) {
        g.push(f)
        continue
      }
    }
    groups.push([f])
  }

  return groups.flatMap((group) => {
    const rtl = group.filter((f) => f.rtl).length >= group.length / 2
    const ordered = [...group].sort((a, b) => a.x - b.x)
    const size = median(ordered.map((f) => f.size))
    // Split segments at large x-gaps: table cells and multi-column layouts share
    // a baseline, and pdf.js hands them over as one run — a column/cell gap is
    // always much larger than a word space.
    const segGap = Math.max(12, size * 1.4)
    const segments: Frag[][] = [[ordered[0]]]
    for (let i = 1; i < ordered.length; i++) {
      const f = ordered[i]
      const prev = segments[segments.length - 1][segments[segments.length - 1].length - 1]
      if (f.x - (prev.x + prev.w) > segGap) segments.push([f])
      else segments[segments.length - 1].push(f)
    }

    return segments.map((seg) => {
      let text = ''
      let prev: Frag | null = null
      for (const f of seg) {
        if (prev) {
          const gap = f.x - (prev.x + prev.w)
          const bulletBoundary = /[•‣▪◦●·∙]$/.test(text) // bullet glyph is its own token
          if ((gap > Math.max(0.8, f.size * 0.16) || bulletBoundary) && !/\s$/.test(text) && !/^\s/.test(f.str)) text += ' '
        }
        text += f.str
        prev = f
      }
      const x0 = Math.min(...seg.map((f) => f.x))
      const x1 = Math.max(...seg.map((f) => f.x + f.w))
      const y0 = Math.min(...seg.map((f) => f.y))
      const segSize = median(seg.map((f) => f.size))
      const fonts = seg.map((f) => f.font)
      const bold = seg.some((f) => /bold|black|heavy|[-,_]bd\b/i.test(f.font))
      return {
        text: text.replace(/\s+/g, ' ').trim(),
        bbox: { x: x0, y: y0, w: Math.max(1, x1 - x0), h: segSize * 1.35 },
        fontSize: segSize,
        bold,
        font: mode(fonts),
        rtl,
        page,
        source: 'native' as const,
        confidence: 0.95,
      }
    })
  }).filter((l) => l.text.length > 0)
}

/** Extract embedded images AND vector-figure/chart regions via the operator list. */
async function extractPageImages(OPS: Record<string, number>, page: PDFPageProxy, pageIndex: number, pageW: number, pageH: number): Promise<PdfImageData[]> {
  const ops = await page.getOperatorList()
  const fnArray = ops.fnArray
  const argsArray = ops.argsArray

  const images: PdfImageData[] = []
  let ctm: number[] = [1, 0, 0, 1, 0, 0]
  const stack: number[][] = []

  // ---- vector-figure tracking: cluster consecutive path paints (bars, axes,
  // gridlines, boxes). Text and state ops don't break a cluster (charts carry
  // labels); a large spatial gap does. Dense clusters become kind:'chart'.
  const PAINT_PATH = new Set([OPS.fill, OPS.eoFill, OPS.stroke, OPS.closeStroke, OPS.fillStroke, OPS.eoFillStroke, OPS.closeFillStroke])
  let pathBox: { x0: number; y0: number; x1: number; y1: number } | null = null
  let cur: { n: number; bbox: BBox } | null = null
  const runs: Array<{ n: number; bbox: BBox }> = []
  const toPageXY = (x: number, y: number): [number, number] => [ctm[0] * x + ctm[2] * y + ctm[4], ctm[1] * x + ctm[3] * y + ctm[5]]
  const growPath = (px: number, py: number) => {
    if (!pathBox) pathBox = { x0: px, y0: py, x1: px, y1: py }
    else {
      pathBox.x0 = Math.min(pathBox.x0, px)
      pathBox.y0 = Math.min(pathBox.y0, py)
      pathBox.x1 = Math.max(pathBox.x1, px)
      pathBox.y1 = Math.max(pathBox.y1, py)
    }
  }
  const nearBox = (a: BBox, b: BBox, tol: number): boolean =>
    a.x - tol <= b.x + b.w && b.x - tol <= a.x + a.w && a.y - tol <= b.y + b.h && b.y - tol <= a.y + a.h
  const mergeBox = (a: BBox, b: BBox): BBox => {
    const x0 = Math.min(a.x, b.x)
    const y0 = Math.min(a.y, b.y)
    const x1 = Math.max(a.x + a.w, b.x + b.w)
    const y1 = Math.max(a.y + a.h, b.y + b.h)
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
  }
  const flushPath = () => {
    if (!pathBox) return
    const b: BBox = { x: pathBox.x0, y: pathBox.y0, w: pathBox.x1 - pathBox.x0, h: pathBox.y1 - pathBox.y0 }
    pathBox = null
    if (cur && nearBox(b, cur.bbox, 40)) {
      cur.bbox = mergeBox(cur.bbox, b)
      cur.n += 1
    } else {
      if (cur) runs.push(cur)
      cur = { n: 1, bbox: b }
    }
  }

  const mul = (m: number[], t: number[]): number[] => [
    m[0] * t[0] + m[2] * t[1],
    m[1] * t[0] + m[3] * t[1],
    m[0] * t[2] + m[2] * t[3],
    m[1] * t[2] + m[3] * t[3],
    m[0] * t[4] + m[2] * t[5] + m[4],
    m[1] * t[4] + m[3] * t[5] + m[5],
  ]

  for (let i = 0; i < fnArray.length; i++) {
    const fn = fnArray[i]
    const args = argsArray[i]
    if (fn === OPS.save) {
      stack.push([...ctm])
    } else if (fn === OPS.restore) {
      ctm = stack.pop() ?? ctm
    } else if (fn === OPS.transform) {
      ctm = mul(ctm, args as number[])
    } else if (fn === OPS.constructPath) {
      // pdf.js v6 folds the paint into constructPath itself:
      //   args = [paintOp, pathData, minMax: [minX,minY,maxX,maxY] (path space)]
      // older builds: args = [segmentOps, flatCoords] + separate fill/stroke fns.
      try {
        const paint = args[0]
        const minMax = args[2] as ArrayLike<number> | undefined
        if (minMax && minMax.length >= 4) {
          for (const [u, v] of [[minMax[0], minMax[1]], [minMax[2], minMax[3]]] as Array<[number, number]>) {
            const [px, py] = toPageXY(u, v)
            if (Number.isFinite(px) && Number.isFinite(py)) growPath(px, py)
          }
        } else {
          const coords = args[1] as ArrayLike<number> | undefined
          if (coords && coords.length >= 2) {
            for (let k = 0; k + 1 < coords.length; k += 2) {
              const [px, py] = toPageXY(coords[k], coords[k + 1])
              if (Number.isFinite(px) && Number.isFinite(py)) growPath(px, py)
            }
          }
        }
        if (typeof paint === 'number' && PAINT_PATH.has(paint)) flushPath()
      } catch {
        // path tracking is best-effort only
      }
    } else if (PAINT_PATH.has(fn)) {
      flushPath()
    } else if (fn === OPS.paintImageXObject || fn === OPS.paintImageXObjectRepeat || fn === OPS.paintInlineImageXObject ) {
      flushPath()
      // unit square → page space
      const corners = [pt(0, 0), pt(1, 0), pt(1, 1), pt(0, 1)].map(([u, v]) => ({
        x: ctm[0] * u + ctm[2] * v + ctm[4],
        y: ctm[1] * u + ctm[3] * v + ctm[5],
      }))
      const xs = corners.map((c) => c.x)
      const ys = corners.map((c) => c.y)
      const x0 = Math.min(...xs)
      const x1 = Math.max(...xs)
      const y0 = Math.min(...ys)
      const y1 = Math.max(...ys)
      // PDF space is bottom-up → flip
      const bbox: BBox = { x: x0, y: pageH - y1, w: x1 - x0, h: y1 - y0 }
      if (bbox.w < 18 || bbox.h < 18 || bbox.w > pageW * 1.05 || bbox.h > pageH * 1.05) continue // tiny sprites / full-bleed oddities kept out

      let objId = ''
      let width = 0
      let height = 0
      let dataUrl: string | undefined
      try {
        if (fn === OPS.paintInlineImageXObject) {
          const img = args[0] as { width: number; height: number }
          width = img.width
          height = img.height
        } else {
          objId = String(args[0])
          const obj = await fetchImageObject(page, objId)
          width = obj?.width ?? 0
          height = obj?.height ?? 0
          dataUrl = await objectToDataUrl(obj)
        }
      } catch {
        // object not retrievable — keep bbox-only image
      }
      images.push({
        id: `i${pageIndex}_${images.length}`,
        page: pageIndex - 1,
        bbox,
        width: width || Math.round(bbox.w),
        height: height || Math.round(bbox.h),
        dataUrl,
        kind: 'image',
      })
    }
  }
  if (cur) runs.push(cur)

  // merge pass: re-join clusters split by interleaved text labels, then keep
  // only regions that look like real figures (dense, sizeable, not a page frame,
  // not duplicating an extracted raster)
  let merged = true
  while (merged) {
    merged = false
    outer: for (let a = 0; a < runs.length; a++) {
      for (let b = a + 1; b < runs.length; b++) {
        if (nearBox(runs[a].bbox, runs[b].bbox, 22)) {
          runs[a] = { n: runs[a].n + runs[b].n, bbox: mergeBox(runs[a].bbox, runs[b].bbox) }
          runs.splice(b, 1)
          merged = true
          break outer
        }
      }
    }
  }
  const pageArea = pageW * pageH
  for (const r of runs) {
    const area = r.bbox.w * r.bbox.h
    if (r.n < 10 || r.bbox.w < 60 || r.bbox.h < 45) continue
    if (area < pageArea * 0.035) continue
    if (r.bbox.w > pageW * 0.94 && r.bbox.h > pageH * 0.94) continue
    if (images.some((im) => im.kind === 'image' && overlapArea(im.bbox, r.bbox) > 0.6 * area)) continue
    images.push({
      id: `f${pageIndex}_${images.length}`,
      page: pageIndex - 1,
      bbox: r.bbox,
      width: Math.round(r.bbox.w),
      height: Math.round(r.bbox.h),
      kind: r.n >= 24 ? 'chart' : 'figure',
    })
  }
  return images
}

function overlapArea(a: BBox, b: BBox): number {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
  return w > 0 && h > 0 ? w * h : 0
}

function pt(u: number, v: number): [number, number] {
  return [u, v]
}

/** Crop a bbox (page space, top-down) from a rendered page canvas → data URL. */
function cropRegionDataUrl(canvas: HTMLCanvasElement, bbox: BBox, scale: number): string | undefined {
  const sx = Math.max(0, Math.floor(bbox.x * scale) - 2)
  const sy = Math.max(0, Math.floor(bbox.y * scale) - 2)
  const sw = Math.min(canvas.width - sx, Math.ceil(bbox.w * scale) + 4)
  const sh = Math.min(canvas.height - sy, Math.ceil(bbox.h * scale) + 4)
  if (sw < 8 || sh < 8) return undefined
  const out = document.createElement('canvas')
  out.width = sw
  out.height = sh
  const ctx = out.getContext('2d')
  if (!ctx) return undefined
  ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh)
  return out.toDataURL('image/png')
}

async function fetchImageObject(page: unknown, objId: string): Promise<{ width: number; height: number; data?: unknown; bitmap?: unknown } | null> {
  const objs = (page as { objs?: { get(id: string, cb?: (d: unknown) => void): unknown } }).objs
  const commonObjs = (page as { commonObjs?: { get(id: string, cb?: (d: unknown) => void): unknown } }).commonObjs
  const target: 'common' | 'page' = objId.startsWith('g_') ? 'common' : 'page'
  const src = target === 'common' ? commonObjs : objs
  if (!src) return null
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), 4000)
    try {
      src.get(objId, (data: unknown) => {
        clearTimeout(timer)
        resolve((data ?? null) as { width: number; height: number } | null)
      })
    } catch {
      clearTimeout(timer)
      resolve(null)
    }
  })
}

async function objectToDataUrl(obj: { width: number; height: number; data?: unknown; bitmap?: unknown } | null): Promise<string | undefined> {
  if (!obj || typeof document === 'undefined') return undefined
  const canvas = document.createElement('canvas')
  canvas.width = obj.width
  canvas.height = obj.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return undefined
  try {
    if (obj.bitmap) {
      ctx.drawImage(obj.bitmap as CanvasImageSource, 0, 0)
    } else if (obj.data instanceof Uint8ClampedArray || obj.data instanceof Uint8Array) {
      const rgba = toRgba(obj.data, obj.width, obj.height)
      const imageData = ctx.createImageData(obj.width, obj.height)
      imageData.data.set(rgba)
      ctx.putImageData(imageData, 0, 0)
    } else {
      return undefined
    }
    return canvas.toDataURL('image/png')
  } catch {
    return undefined
  }
}

function toRgba(data: Uint8ClampedArray | Uint8Array, w: number, h: number): Uint8ClampedArray {
  // pdf.js hands us RGB or RGBA buffers (kind 1=RGB_24BPP, 2=RGBA_32BPP); we sniff by length.
  const out = new Uint8ClampedArray(w * h * 4)
  if (data.length >= w * h * 4) {
    out.set(data.subarray(0, w * h * 4))
    return out
  }
  for (let i = 0, j = 0; i < w * h; i++, j += 3) {
    out[i * 4] = data[j]
    out[i * 4 + 1] = data[j + 1]
    out[i * 4 + 2] = data[j + 2]
    out[i * 4 + 3] = 255
  }
  return out
}


function median(values: number[]): number {
  if (!values.length) return 0
  const s = [...values].sort((a, b) => a - b)
  return s[Math.floor(s.length / 2)]
}

function mode(values: string[]): string {
  const m = new Map<string, number>()
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1)
  let best = ''
  let n = -1
  for (const [k, c] of m) {
    if (c > n) {
      n = c
      best = k
    }
  }
  return best
}
