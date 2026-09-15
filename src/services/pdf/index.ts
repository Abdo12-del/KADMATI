/**
 * PDF → StructuredDocument orchestrator.
 * Wires: parse (pdf.js) → normalize → font stats → per-page analysis → outline
 * → brand suggestion → aggregate stats. Pure stages are separated so the
 * future Docling microservice can replace the parse+analyze part while
 * understand/plan/deck stay identical.
 */
import { analyzePage, buildOutline, classifyFurniture, computeFontStats, normalizeLines } from './analyze'
import { detectLanguage } from './rtl'
import { extractBrand } from './brand'
import { parsePdf } from './parse'
import type { BrandSuggestion, ParseProgress, StructuredDocument } from './types'

export interface AnalyzeOptions {
  maxPages?: number
  thumbnails?: boolean
  extractImages?: boolean
  onProgress?: (p: ParseProgress) => void
}

export interface AnalyzeResult {
  structured: StructuredDocument
  fontFamilies: Array<{ name: string; count: number }>
}

export async function analyzePdf(data: ArrayBuffer, fileName: string, opts: AnalyzeOptions = {}): Promise<AnalyzeResult> {
  const { structured, fontFamilies } = await runPipeline(data, fileName, opts)
  return { structured, fontFamilies }
}

async function runPipeline(data: ArrayBuffer, fileName: string, opts: AnalyzeOptions): Promise<AnalyzeResult> {
  const { pages, allLines } = await parsePdf(data, opts)

  opts.onProgress?.({ stage: 'analyze', done: 0, total: pages.length, message: 'تصنيف العناصر' })
  const normalized = normalizeLines(allLines)
  const flat = normalized.flat()
  const stats = computeFontStats(flat)

  let analyzed = pages.map((page, i) => analyzePage(page, normalized[i] ?? [], stats))
  // furniture (headers/footers) is a cross-page decision
  const before = analyzed.reduce((n, p) => n + p.elements.length, 0)
  classifyFurniture(analyzed)
  analyzed = analyzed.map((p) => ({ ...p, elements: p.elements.filter((e) => e.type !== 'header' || (e.text?.length ?? 0) < 200) }))
  void before

  opts.onProgress?.({ stage: 'analyze', done: pages.length, total: pages.length, message: 'فهم البنية' })
  const outline = buildOutline(analyzed)

  const sample = flat.map((l) => l.text).join(' ').slice(0, 20000)
  const language = detectLanguage(sample)
  const dirRtl = language === 'ar' || language === 'mixed'

  let brandSuggestion: BrandSuggestion | undefined
  try {
    const images = analyzed.flatMap((p) => p.images)
    brandSuggestion = await extractBrand(images, stats)
    if (!brandSuggestion.fonts.length && stats.families.length) {
      brandSuggestion = { ...brandSuggestion, fonts: stats.families.slice(0, 2).map((f) => f.name) }
    }
  } catch {
    brandSuggestion = undefined
  }

  const chars = flat.reduce((s, l) => s + l.text.length, 0)
  const words = flat.reduce((s, l) => s + l.text.split(/\s+/).filter(Boolean).length, 0)

  const structured: StructuredDocument = {
    fileName,
    pageCount: analyzed.length,
    language,
    dirRtl,
    pages: analyzed,
    outline,
    brandSuggestion,
    stats: {
      chars,
      words,
      images: analyzed.reduce((s, p) => s + p.images.length, 0),
      tables: analyzed.reduce((s, p) => s + p.tables.length, 0),
      headings: analyzed.reduce((s, p) => s + p.elements.filter((e) => e.type === 'title' || e.type === 'heading').length, 0),
      scannedPages: analyzed.filter((p) => p.scanned).length,
    },
  }

  return { structured, fontFamilies: stats.families }
}

export { buildSections, attachVisuals } from './understand'
export { planPresentation } from './plan'
export { buildDeck } from './deck'
export { getOcrBackend } from './ocr'
export { loadPdfDocument, renderPageToCanvas } from './parse'
export { mapFontFamily } from './brand'
export type { SectionContent, SlideArchetype } from './understand'
export type { PresentationPlan, PlanOptions } from './plan'
export type { BuildResult } from './deck'
export type { OcrLangs, OcrProgress } from './ocr'
export type * from './types'
