/**
 * OCR adapter — optional path for scanned pages (no text layer).
 *
 * Browser backend: tesseract.js (Apache-2.0) with ara+eng / fra+eng combos,
 * loaded lazily only when the user asks for it (the wasm + traineddata download
 * is too heavy to be on the critical path).
 * Production upgrade path: the same interface is served by Surya/PaddleOCR in
 * the Docling microservice (see PDF_ANALYSIS_RESEARCH.md §5.1).
 */
import type { TextLine } from './types'
import { hasArabic } from './rtl'

export type OcrLangs = 'ara+eng' | 'fra+eng' | 'eng'

export interface OcrProgress {
  status: string
  progress: number
}

export interface OcrBackend {
  id: 'tesseract'
  run(canvas: HTMLCanvasElement, langs: OcrLangs, onProgress?: (p: OcrProgress) => void): Promise<TextLine[]>
}

let cached: OcrBackend | null = null

export function getOcrBackend(): OcrBackend {
  if (!cached) cached = { id: 'tesseract', run }
  return cached
}

/** Run OCR on a rendered page canvas; returns merged text lines with bboxes. */
async function run(canvas: HTMLCanvasElement, langs: OcrLangs, onProgress?: (p: OcrProgress) => void): Promise<TextLine[]> {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker(langs, 1, {
    logger: (m: { status: string; progress: number }) => onProgress?.({ status: m.status, progress: m.progress }),
  })
  try {
    const { data } = await worker.recognize(canvas)
    const lines: TextLine[] = []
    const rawLines = (data as unknown as { lines?: Array<{ text: string; bbox: BBoxIn; confidence: number }> }).lines ?? groupWordsToLines((data as unknown as { words?: Array<{ text: string; bbox: BBoxIn; confidence: number }> }) ?? {})
    for (const line of rawLines) {
      const text = (line.text ?? '').replace(/\s+/g, ' ').trim()
      if (!text) continue
      const b = line.bbox
      const fontSize = Math.max(8, (b.y1 - b.y0) * 0.8)
      lines.push({
        text,
        bbox: { x: b.x0, y: b.y0, w: b.x1 - b.x0, h: b.y1 - b.y0 },
        fontSize,
        bold: false,
        font: 'ocr',
        rtl: hasArabic(text),
        page: -1,
        source: 'ocr',
        confidence: Math.min(0.72, ((line.confidence ?? 60) / 100) * 0.8),
      })
    }
    return lines
  } finally {
    await worker.terminate()
  }
}

interface BBoxIn {
  x0: number
  y0: number
  x1: number
  y1: number
}

/** Fallback when tesseract.js gives words but no lines. */
function groupWordsToLines(data: { words?: Array<{ text: string; bbox: BBoxIn; confidence: number }> }): Array<{ text: string; bbox: BBoxIn; confidence: number }> {
  const words = data.words ?? []
  if (!words.length) return []
  const sorted = [...words].sort((a, b) => a.bbox.y0 - b.bbox.y0)
  const out: Array<{ text: string; bbox: BBoxIn; confidence: number }> = []
  let current: typeof words = []
  let refY = 0
  const flush = () => {
    if (!current.length) return
    const x0 = Math.min(...current.map((w) => w.bbox.x0))
    const y0 = Math.min(...current.map((w) => w.bbox.y0))
    const x1 = Math.max(...current.map((w) => w.bbox.x1))
    const y1 = Math.max(...current.map((w) => w.bbox.y1))
    out.push({ text: current.map((w) => w.text).join(' '), bbox: { x0, y0, x1, y1 }, confidence: current.reduce((s, w) => s + w.confidence, 0) / current.length })
    current = []
  }
  for (const w of sorted) {
    if (current.length && Math.abs(w.bbox.y0 - refY) > (w.bbox.y1 - w.bbox.y0) * 0.7) flush()
    current.push(w)
    refY = w.bbox.y0
  }
  flush()
  return out
}
