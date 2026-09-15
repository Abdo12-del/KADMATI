/**
 * Geometric table detection from extracted text lines.
 *
 * After the parser splits baseline runs into cell-sized segments, a native PDF
 * table looks like: visual rows (same y) holding ≥2 cells whose x-starts recur
 * across rows. We cluster columns from those x positions, group rows by y,
 * measure alignment rate, and only keep grids that clear a credibility bar —
 * with a confidence score attached.
 *
 * (Ruled tables with vector lines and merged cells are upgraded further by the
 * optional Docling/TableFormer service — see PDF_ANALYSIS_RESEARCH.md §5.)
 */
import type { BBox, PdfTableData, TextLine } from './types'

const BULLET_RE = /^([•‣▪◦●·∙]+|[-–—]|\(?\d{1,2}[.)]|[٠-٩]{1,2}[.)]|[a-zA-Z][.)])\s+/

interface Row {
  cells: TextLine[]
  y: number
}

/** Cluster values with a tolerance → cluster means. */
function cluster(values: number[], tolerance: number): number[] {
  const sorted = [...values].sort((a, b) => a - b)
  const groups: number[][] = []
  for (const v of sorted) {
    const last = groups[groups.length - 1]
    if (last && Math.abs(v - last[last.length - 1]) <= tolerance) last.push(v)
    else groups.push([v])
  }
  return groups.map((g) => g.reduce((s, v) => s + v, 0) / g.length)
}

export function detectTable(lines: TextLine[], page: number, index: number): PdfTableData | null {
  if (lines.length < 4) return null
  const bodySize = median(lines.map((l) => l.fontSize))
  const colTol = Math.max(6, bodySize * 0.9)

  // ---- group into visual rows by y proximity
  const byY = [...lines].sort((a, b) => a.bbox.y - b.bbox.y || a.bbox.x - b.bbox.x)
  const rows: Row[] = []
  for (const line of byY) {
    const last = rows[rows.length - 1]
    if (last && Math.abs(line.bbox.y - last.y) <= Math.max(2, bodySize * 0.6)) {
      last.cells.push(line)
      last.y = (last.y + line.bbox.y) / 2
    } else {
      rows.push({ cells: [line], y: line.bbox.y })
    }
  }

  // ---- rows must hold ≥2 cells; trim lone-cell rows at the edges (titles/captions)
  let start = 0
  let end = rows.length
  while (start < end && rows[start].cells.length < 2) start++
  while (end > start + 1 && rows[end - 1].cells.length < 2) end--
  const gridRows = rows.slice(start, end).filter((r) => r.cells.length >= 2)
  if (gridRows.length < 3) return null

  // ---- columns from cell x-starts
  const anchors = cluster(gridRows.flatMap((r) => r.cells.map((c) => c.bbox.x)), colTol)
  if (anchors.length < 2 || anchors.length > 12) return null

  const columnOf = (x: number): number => {
    let best = -1
    let dist = Infinity
    anchors.forEach((a, i) => {
      const d = Math.abs(a - x)
      if (d <= colTol && d < dist) {
        dist = d
        best = i
      }
    })
    return best
  }

  // ---- build the grid + measure alignment
  const grid: string[][] = gridRows.map(() => anchors.map(() => ''))
  let hits = 0
  let total = 0
  gridRows.forEach((row, ri) => {
    for (const cell of row.cells) {
      const ci = columnOf(cell.bbox.x)
      total += 1
      if (ci >= 0) {
        hits += 1
        grid[ri][ci] = (grid[ri][ci] ? grid[ri][ci] + ' ' : '') + cell.text.replace(BULLET_RE, '').trim()
      }
    }
  })
  const alignmentRate = total ? hits / total : 0
  if (alignmentRate < 0.85) return null

  // ---- credibility: enough filled cells spread over the grid
  const filled = grid.flat().filter((c) => c.trim()).length
  if (filled < anchors.length * 2) return null
  const topHeavy = grid.slice(1).every((r) => r.some((c) => c.trim()))
  if (!topHeavy) return null

  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const row of gridRows) {
    for (const cell of row.cells) {
      x0 = Math.min(x0, cell.bbox.x)
      y0 = Math.min(y0, cell.bbox.y)
      x1 = Math.max(x1, cell.bbox.x + cell.bbox.w)
      y1 = Math.max(y1, cell.bbox.y + cell.bbox.h)
    }
  }
  const bbox: BBox = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }

  return {
    id: `t${page}_${index}`,
    page,
    bbox,
    rows: grid,
    nRows: grid.length,
    nCols: anchors.length,
    confidence: Math.min(0.97, 0.55 + alignmentRate * 0.42),
  }
}

export function median(values: number[]): number {
  if (!values.length) return 0
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}
