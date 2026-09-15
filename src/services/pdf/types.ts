/**
 * PDF import — shared types.
 * One schema for every stage of the pipeline (parse → analyze → understand → plan),
 * and the same schema a future Docling microservice would return, so the client
 * never changes when analysis quality is upgraded server-side.
 */

export interface BBox {
  x: number
  y: number
  w: number
  h: number
}

export type PdfElementType =
  | 'title' // document/section title (top-level heading)
  | 'heading' // section heading (level 2/3)
  | 'paragraph'
  | 'list'
  | 'image'
  | 'table'
  | 'caption'
  | 'header' // repeated page header (furniture)
  | 'footer' // repeated page footer (furniture)
  | 'quote'
  | 'kv' // "label: value"
  | 'stat' // big number / percentage / KPI
  | 'page-number'

export interface PdfElement {
  id: string
  page: number
  type: PdfElementType
  bbox: BBox
  text?: string
  /** Heading depth: 1 = document title, 2 = section, 3 = subsection. */
  level?: number
  /** For list elements. */
  items?: string[]
  fontSize?: number
  bold?: boolean
  font?: string
  /** 0..1 — every inference carries how sure we are. */
  confidence: number
  source: 'native' | 'ocr'
  meta?: Record<string, unknown>
}

export interface PdfTableData {
  id: string
  page: number
  bbox: BBox
  rows: string[][]
  nRows: number
  nCols: number
  confidence: number
}

export interface PdfImageData {
  id: string
  page: number
  bbox: BBox
  width: number
  height: number
  dataUrl?: string
  caption?: string
  /**
   * 'image'  = embedded raster XObject (original bytes recoverable)
   * 'figure' = vector-drawing cluster (sparse)
   * 'chart'  = vector-drawing cluster dense enough to be a chart/diagram —
   *            kept as a figure (pixels cropped from the rendered page in the
   *            browser); original series data is not recoverable.
   */
  kind: 'image' | 'figure' | 'chart'
}

export interface PdfPage {
  index: number // 0-based
  width: number
  height: number
  scanned: boolean
  /** Layout classification, used by the planner. */
  layout: PageLayout
  elements: PdfElement[]
  tables: PdfTableData[]
  images: PdfImageData[]
  thumbnail?: string
}

export type PageLayout =
  | 'cover'
  | 'title-content'
  | 'two-column'
  | 'text-image'
  | 'list'
  | 'table'
  | 'image'
  | 'stats'
  | 'text'

export interface OutlineEntry {
  level: number
  text: string
  page: number
  elementId: string
}

export interface BrandSuggestion {
  /** Extracted/accent colors as hex. */
  primary: string
  secondary: string
  accent: string
  /** Most frequent font families in the document. */
  fonts: string[]
}

export interface StructuredDocument {
  fileName: string
  pageCount: number
  language: 'ar' | 'en' | 'fr' | 'mixed'
  dirRtl: boolean
  pages: PdfPage[]
  outline: OutlineEntry[]
  brandSuggestion?: BrandSuggestion
  stats: {
    chars: number
    words: number
    images: number
    tables: number
    headings: number
    scannedPages: number
  }
}

/** A merged line of text with geometry — the unit everything else is built from. */
export interface TextLine {
  text: string
  bbox: BBox
  fontSize: number
  bold: boolean
  font: string
  rtl: boolean
  page: number
  source: 'native' | 'ocr'
  confidence: number
}

export interface ParseProgress {
  stage: 'parse' | 'ocr' | 'analyze' | 'plan' | 'build'
  done: number
  total: number
  message?: string
}
