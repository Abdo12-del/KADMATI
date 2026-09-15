/**
 * Layout analysis + element classification.
 *
 * Turns raw text lines (from the parser or OCR) into typed elements:
 * titles/headings (font-size clustering + boldness), lists (bullet glyphs incl.
 * Arabic), stats, quotes, key-value pairs, captions, repeated headers/footers,
 * and a reading order that respects columns and RTL. Every element carries a
 * confidence so the UI can flag uncertain inferences before generation.
 */
import { fixLine, hasArabic, stripBulletEnds } from './rtl'
import { detectTable, median } from './tables'
import type { BBox, OutlineEntry, PageLayout, PdfElement, PdfImageData, PdfPage, TextLine } from './types'

const BULLET_RE = /^([•‣▪◦●·∙◦﹅﹆]+|[*+-]|\(?\d{1,2}[.)]\s|\(?[٠-٩]{1,2}[.)]\s)/
const ORDINAL_RE = /^\(?\d{1,2}[.)]\s|\(?[٠-٩]{1,2}[.)]\s/
const KV_RE = /^([^:：]{2,42})[:：]\s*(\S.{0,120})$/
const STAT_RE = /^[+±−-]?\d{1,3}([.,]\d+)?\s*(%|٪|x|×)\.?$|^[+±−-]?\d{1,3}([.,]\d+)?\s*(K|M|B|مليون|مليار|ألف)?\.$/
const CAPTION_RE = /^(شكل|جدول|الشكل|الجدول|الرسم|البيان|figure|fig\.?|table|chart|graph)\s*[.#ـ]?\s*\d+/i
const PAGE_NUMBER_RE = /^[-–—|.\s]*([0-9]{1,4}|[٠-٩]{1,4})[-–—|.\s]*$/
const QUOTE_RE = /^[«"“”„][^»"“”]{20,}[»"“”]$/

let uidCounter = 0
function uid(prefix: string): string {
  uidCounter += 1
  return `${prefix}${uidCounter.toString(36)}`
}

export interface FontStat {
  /** Dominant body font size across the document. */
  bodySize: number
  /** Largest font size seen (title candidate). */
  maxSize: number
  /** Font families by frequency. */
  families: Array<{ name: string; count: number }>
}

/** Body size = char-count-weighted mode of rounded sizes. */
export function computeFontStats(allLines: TextLine[]): FontStat {
  const weight = new Map<number, number>()
  const fams = new Map<string, number>()
  let maxSize = 0
  for (const line of allLines) {
    const key = Math.round(line.fontSize * 2) / 2
    weight.set(key, (weight.get(key) ?? 0) + line.text.length)
    if (line.font) fams.set(line.font, (fams.get(line.font) ?? 0) + 1)
    maxSize = Math.max(maxSize, line.fontSize)
  }
  let bodySize = 11
  let bestWeight = -1
  for (const [size, w] of weight) {
    if (w > bestWeight && size >= 7) {
      bestWeight = w
      bodySize = size
    }
  }
  const families = [...fams.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
  return { bodySize, maxSize, families }
}

/** Strip bidi controls / normalize, per line, honoring RTL hints. */
export function normalizeLines(pages: TextLine[][]): TextLine[][] {
  return pages.map((lines) => lines.map((l) => ({ ...l, text: fixLine(l.text, l.rtl) })))
}

/**
 * Mark repeated headers/footers: lines in the top/bottom 8% whose normalized text
 * repeats on ≥ max(3, 40%) of pages. MUST run at document level (needs all pages).
 */
export function classifyFurniture(pages: PdfPage[]): void {
  const pageCount = pages.length
  if (pageCount < 3) return
  const threshold = Math.max(3, Math.ceil(pageCount * 0.4))
  const tally = new Map<string, number>()
  const bands = new Map<string, 'header' | 'footer'>()

  for (const page of pages) {
    const seen = new Set<string>()
    for (const line of page.elements.filter((e) => e.type === 'paragraph' || e.type === 'heading' || e.type === 'page-number')) {
      const top = page.height * 0.08
      const bottom = page.height * 0.92
      const band = line.bbox.y + line.bbox.h / 2 < top ? 'header' : line.bbox.y + line.bbox.h / 2 > bottom ? 'footer' : null
      if (!band) continue
      const key = `${band}|${line.text?.slice(0, 48) ?? ''}`
      if (seen.has(key)) continue
      seen.add(key)
      tally.set(key, (tally.get(key) ?? 0) + 1)
      bands.set(key, band)
    }
  }

  for (const page of pages) {
    for (const el of page.elements) {
      const band = el.bbox.y + el.bbox.h / 2 < page.height * 0.08 ? 'header' : el.bbox.y + el.bbox.h / 2 > page.height * 0.92 ? 'footer' : null
      if (!band) continue
      const key = `${band}|${el.text?.slice(0, 48) ?? ''}`
      if ((tally.get(key) ?? 0) >= threshold) {
        el.type = bands.get(key) ?? band
        el.confidence = Math.min(0.95, 0.55 + (tally.get(key) ?? 0) / pageCount * 0.4)
      }
    }
  }
}

function isHeadingCandidate(line: TextLine, stats: FontStat): boolean {
  const text = line.text.trim()
  if (!text || text.length > 140) return false
  if (BULLET_RE.test(text)) return false
  if (KV_RE.test(text)) return false
  const sizeRatio = line.fontSize / stats.bodySize
  return sizeRatio >= 1.24 || (line.bold && sizeRatio >= 1.06 && text.length < 90) || (line.fontSize >= stats.maxSize - 0.4 && sizeRatio >= 1.1)
}

function headingLevel(line: TextLine, stats: FontStat): number {
  const ratio = line.fontSize / stats.bodySize
  if (line.fontSize >= stats.maxSize - 0.6 && ratio >= 1.6) return 1
  if (ratio >= 1.45) return 2
  return 3
}

/** Classify one page's text lines into elements. Mutates and returns the page. */
/** Minimal page skeleton the analyzer needs (parser output before analysis). */
export interface PageSkeleton {
  index: number
  width: number
  height: number
  scanned: boolean
  thumbnail?: string
  images: PdfElement[] | PdfImageData[]
}

export function analyzePage(page: PageSkeleton, lines: TextLine[], stats: FontStat): PdfPage {
  const elements: PdfElement[] = []

  // Sort by reading order. Single column: top→bottom, x per direction. Two columns
  // (detected geometrically): finish a column before starting the next (RTL reads
  // the right column first, LTR the left).
  const mid = page.width / 2
  const colBoxes = lines.filter((l) => l.text.length > 24).map((l) => l.bbox)
  let leftCount = 0
  let rightCount = 0
  for (const b of colBoxes) (b.x + b.w / 2 < mid ? leftCount++ : rightCount++)
  const twoColumns = Math.min(leftCount, rightCount) >= 2 && colBoxes.length >= 4
  // Page direction (per page, not per document): drives which column reads first.
  const rtlPage = (() => {
    const sample = lines.map((l) => l.text).join(' ')
    const ar = (sample.match(/[\u0600-\u06FF]/g) ?? []).length
    const la = (sample.match(/[A-Za-z]/g) ?? []).length
    return ar > 0 && ar >= la
  })()
  const sortKey = (l: TextLine): [number, number, number] => {
    if (!twoColumns) return [0, l.bbox.y, l.bbox.x]
    // RTL page: right column (0) reads first; LTR page: left column (0) first
    const col = (l.bbox.x + l.bbox.w / 2 < mid) === rtlPage ? 1 : 0
    return [col, l.bbox.y, l.bbox.x]
  }
  const sorted = [...lines].sort((a, b) => {
    const ka = sortKey(a)
    const kb = sortKey(b)
    return ka[0] - kb[0] || ka[1] - kb[1] || ka[2] - kb[2]
  })

  let i = 0
  while (i < sorted.length) {
    const line = sorted[i]
    const text = line.text.trim()

    // ---- table region (before other classification — the detector needs raw rows)
    // ---- page furniture
    if (PAGE_NUMBER_RE.test(text) && (line.bbox.y + line.bbox.h / 2 < page.height * 0.08 || line.bbox.y + line.bbox.h / 2 > page.height * 0.92)) {
      elements.push(mkElement('page-number', line, { confidence: 0.9 }))
      i += 1
      continue
    }

    // ---- list: consume bullet run (RTL extraction parks the bullet at line end)
    const bulletProbe = line.rtl ? stripBulletEnds(text) : text
    const isBulletLine = (BULLET_RE.test(text) || bulletProbe !== text) && text.length < 300
    if (isBulletLine) {
      const items: string[] = []
      const bboxes: BBox[] = []
      while (i < sorted.length) {
        const raw = sorted[i].text.trim()
        const probe = sorted[i].rtl ? stripBulletEnds(raw) : raw
        const hasBullet = BULLET_RE.test(raw) || (sorted[i].rtl && probe !== raw)
        if (!hasBullet) break
        items.push(BULLET_RE.test(raw) ? raw.replace(BULLET_RE, '') : probe)
        bboxes.push(sorted[i].bbox)
        i += 1
      }
      const bbox = union(bboxes)
      elements.push({
        id: uid('e'),
        page: page.index,
        type: 'list',
        bbox,
        items,
        fontSize: line.fontSize,
        bold: line.bold,
        font: line.font,
        confidence: 0.88,
        source: line.source,
        meta: { ordered: ORDINAL_RE.test(text) },
      })
      continue
    }

    // ---- standalone page number-ish / stat line
    if (STAT_RE.test(text) && text.length <= 16) {
      elements.push(mkElement('stat', line, { confidence: 0.82 }))
      i += 1
      continue
    }

    // ---- quote
    if (QUOTE_RE.test(text)) {
      elements.push(mkElement('quote', line, { confidence: 0.85 }))
      i += 1
      continue
    }

    // ---- caption (before kv: "Figure 1: …" is a caption, not a key-value pair)
    if (CAPTION_RE.test(text)) {
      elements.push(mkElement('caption', line, { confidence: 0.85 }))
      i += 1
      continue
    }

    // ---- kv
    const kv = KV_RE.exec(text)
    if (kv && !isHeadingCandidate(line, stats)) {
      elements.push(mkElement('kv', line, { confidence: 0.8, meta: { label: kv[1].trim(), value: kv[2].trim() } }))
      i += 1
      continue
    }

    // ---- headings (consume possible wrapped continuation line)
    if (isHeadingCandidate(line, stats)) {
      const level = headingLevel(line, stats)
      let headingText = text
      const bboxParts: BBox[] = [line.bbox]
      // wrap: next line similar size, starts lowercase-ish and short gap
      const next = sorted[i + 1]
      if (next && Math.abs(next.fontSize - line.fontSize) < 0.6 && next.bbox.y - (line.bbox.y + line.bbox.h) < line.fontSize * 0.7 && next.text.trim().length > 0 && !BULLET_RE.test(next.text.trim()) && headingText.length < 80) {
        headingText += ' ' + next.text.trim()
        bboxParts.push(next.bbox)
        i += 1
      }
      i += 1
      elements.push({
        id: uid('e'),
        page: page.index,
        type: level === 1 ? 'title' : 'heading',
        bbox: union(bboxParts),
        text: headingText,
        level,
        fontSize: line.fontSize,
        bold: line.bold,
        font: line.font,
        confidence: Math.min(0.96, 0.62 + (line.fontSize / stats.bodySize - 1) * 0.25),
        source: line.source,
      })
      continue
    }

    // ---- paragraph: merge wrapped lines (similar size, tight gaps, not bullety)
    const paraLines: TextLine[] = [line]
    const paraBoxes: BBox[] = [line.bbox]
    i += 1
    while (i < sorted.length) {
      const nxt = sorted[i]
      const ntext = nxt.text.trim()
      const prev = paraLines[paraLines.length - 1]
      const sameSize = Math.abs(nxt.fontSize - prev.fontSize) < 0.8
      const tightGap = nxt.bbox.y - (prev.bbox.y + prev.bbox.h) < prev.fontSize * 0.85
      const startsNewBlock = BULLET_RE.test(ntext) || isHeadingCandidate(nxt, stats) || KV_RE.test(ntext) || CAPTION_RE.test(ntext) || QUOTE_RE.test(ntext)
      const xOverlap = overlapX(prev.bbox, nxt.bbox) > 0.5
      if (sameSize && tightGap && !startsNewBlock && xOverlap && paraLines.length < 14) {
        paraLines.push(nxt)
        paraBoxes.push(nxt.bbox)
        i += 1
      } else break
    }
    const joined = paraLines.map((l) => l.text.trim()).join(paraLines[0].rtl && paraLines.length > 1 ? ' ' : ' ')
    elements.push({
      id: uid('e'),
      page: page.index,
      type: 'paragraph',
      bbox: union(paraBoxes),
      text: joined,
      fontSize: median(paraLines.map((l) => l.fontSize)),
      bold: paraLines[0].bold,
      font: paraLines[0].font,
      confidence: paraLines.length > 1 ? 0.78 : 0.7,
      source: line.source,
    })
  }

  const full: PdfPage = {
    index: page.index,
    width: page.width,
    height: page.height,
    scanned: page.scanned,
    thumbnail: page.thumbnail,
    elements,
    tables: [],
    images: (page.images as PdfImageData[]) ?? [],
    layout: 'text',
  }

  // tables — run on paragraph-ish lines before furniture classification
  const tableCandidates = elements.filter((e) => e.type === 'paragraph' || e.type === 'kv')
  if (tableCandidates.length >= 3) {
    const pairs = tableCandidates.map((e) => ({
      element: e,
      line: {
        text: e.text ?? '',
        bbox: e.bbox,
        fontSize: e.fontSize ?? stats.bodySize,
        bold: e.bold ?? false,
        font: e.font ?? '',
        rtl: hasArabic(e.text ?? ''),
        page: page.index,
        source: e.source,
        confidence: 0.7,
      } satisfies TextLine,
    }))
    // try every contiguous window (bounded) — tables are local structures
    const consumed = new Set<string>()
    for (let start = 0; start < pairs.length - 2; start++) {
      for (let end = Math.min(pairs.length, start + 14); end > start + 2; end--) {
        const window = pairs.slice(start, end)
        if (window.some((p) => consumed.has(p.element.id))) continue
        const table = detectTable(window.map((p) => p.line), page.index, start)
        if (table && table.nCols >= 2 && table.nRows >= 3) {
          full.tables.push(table)
          for (const p of window) consumed.add(p.element.id)
          start = end - 1
          break
        }
      }
    }
    if (full.tables.length) {
      // drop paragraph elements that became tables
      const tableBoxes = full.tables.map((t) => t.bbox)
      full.elements = full.elements.filter((e) => {
        if (e.type !== 'paragraph' && e.type !== 'kv') return true
        return !tableBoxes.some((b) => insideFraction(e.bbox, b) > 0.6)
      })
    }
  }

  full.layout = classifyLayout(full)
  return full
}

/** Page layout classification used by the presentation planner. */
export function classifyLayout(page: PdfPage): PageLayout {
  const live = page.elements.filter((e) => e.type !== 'header' && e.type !== 'footer' && e.type !== 'page-number')
  const headings = live.filter((e) => e.type === 'title' || e.type === 'heading')
  const has = (t: PdfElement['type']) => live.some((e) => e.type === t)

  if (page.index === 0 && headings.length && (live.length <= 6 || (has('stat') === false && contentChars(live) < 420))) return 'cover'
  if (page.tables.length && biggestShare(page.tables.map((t) => t.bbox), page) > 0.05) return 'table'
  const bigImages = page.images.filter((im) => area(im.bbox) / (page.width * page.height) > 0.18)
  if (bigImages.length && contentChars(live) < 400) return 'image'
  if (live.filter((e) => e.type === 'stat').length >= 2) return 'stats'
  if (live.filter((e) => e.type === 'list').length >= 1 && listShare(live) > 0.5) return 'list'
  if (bigImages.length && headings.length) return 'text-image'
  if (twoColumnLikelihood(live, page) > 0.6) return 'two-column'
  if (headings.length) return 'title-content'
  return 'text'
}

function twoColumnLikelihood(elements: PdfElement[], page: PdfPage): number {
  const mid = page.width / 2
  const boxes = elements.filter((e) => e.type === 'paragraph' || e.type === 'list').map((e) => e.bbox)
  if (boxes.length < 2) return 0
  let left = 0
  let right = 0
  let spanning = 0
  for (const b of boxes) {
    const cx = b.x + b.w / 2
    if (b.w > page.width * 0.75) spanning++
    else if (b.w < page.width * 0.58 && cx < mid) left++
    else if (b.w < page.width * 0.58 && cx >= mid) right++
    else spanning++
  }
  // two narrow columns with (near) balance — even a single block per column counts
  if (left >= 1 && right >= 1 && spanning === 0) {
    const minority = Math.min(left, right)
    return 0.6 + minority / (left + right) * 0.4
  }
  const minority = Math.min(left, right)
  if (minority < 2) return 0
  return minority / (left + right + spanning * 0.5)
}

function listShare(elements: PdfElement[]): number {
  const chars = elements.reduce((s, e) => s + (e.text?.length ?? 0) + (e.items?.reduce((a, i) => a + i.length, 0) ?? 0), 0)
  if (!chars) return 0
  const listChars = elements.filter((e) => e.type === 'list').reduce((s, e) => s + (e.items?.reduce((a, i) => a + i.length, 0) ?? 0), 0)
  return listChars / chars
}

function contentChars(elements: PdfElement[]): number {
  return elements.filter((e) => e.type !== 'header' && e.type !== 'footer' && e.type !== 'page-number').reduce((s, e) => s + (e.text?.length ?? 0) + (e.items?.join(' ').length ?? 0), 0)
}

function area(b: BBox): number {
  return Math.max(0, b.w) * Math.max(0, b.h)
}

function biggestShare(boxes: BBox[], page: PdfPage): number {
  if (!boxes.length) return 0
  return Math.max(...boxes.map(area)) / (page.width * page.height)
}

function overlapX(a: BBox, b: BBox): number {
  const x0 = Math.max(a.x, b.x)
  const x1 = Math.min(a.x + a.w, b.x + b.w)
  return x1 > x0 ? (x1 - x0) / Math.min(a.w, b.w) : 0
}

function insideFraction(inner: BBox, outer: BBox): number {
  const ix = Math.max(0, Math.min(inner.x + inner.w, outer.x + outer.w) - Math.max(inner.x, outer.x))
  const iy = Math.max(0, Math.min(inner.y + inner.h, outer.y + outer.h) - Math.max(inner.y, outer.y))
  const inter = ix * iy
  const ia = area(inner) || 1
  return inter / ia
}

function union(boxes: BBox[]): BBox {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const b of boxes) {
    x0 = Math.min(x0, b.x)
    y0 = Math.min(y0, b.y)
    x1 = Math.max(x1, b.x + b.w)
    y1 = Math.max(y1, b.y + b.h)
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

function mkElement(type: PdfElement['type'], line: TextLine, extra: Partial<PdfElement> = {}): PdfElement {
  return {
    id: uid('e'),
    page: line.page,
    type,
    bbox: line.bbox,
    text: line.text,
    fontSize: line.fontSize,
    bold: line.bold,
    font: line.font,
    confidence: 0.75,
    source: line.source,
    ...extra,
  }
}

/** Document-level outline from title/heading elements. */
export function buildOutline(pages: PdfPage[]): OutlineEntry[] {
  const outline: OutlineEntry[] = []
  for (const page of pages) {
    for (const el of page.elements) {
      if ((el.type === 'title' || el.type === 'heading') && el.text) {
        outline.push({ level: el.level ?? 2, text: el.text, page: page.index, elementId: el.id })
      }
    }
  }
  return outline
}
