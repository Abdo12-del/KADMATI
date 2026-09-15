/**
 * PDF plan → real presentation.
 * instantiateDeck() does the layout/typography work; this module then injects
 * the *document's own* assets — extracted images replace placeholder art, and
 * detected tables fill real table elements — so the result is a native, fully
 * editable Aurova deck (PPTX export works on it like any other deck).
 */
import { instantiateDeck, type DeckSpec } from '../../templates/engine'
import { normalizePresentation } from '../../document/factory'
import type { AssetRef, Presentation } from '../../document/types'
import { mapFontFamily } from './brand'
import type { PdfImageData, PdfTableData, StructuredDocument } from './types'
import type { PresentationPlan } from './plan'

export interface BuildResult {
  doc: Presentation
  /** How many document images made it into the deck. */
  imagesInjected: number
  tablesInjected: number
}

export function buildDeck(doc: StructuredDocument, plan: PresentationPlan, imagesById: Map<string, PdfImageData>, tablesById: Map<string, PdfTableData>): BuildResult {
  const spec: DeckSpec = plan.spec
  const presentation = instantiateDeck(spec)
  const assets = presentation.assets

  // ---- identity modes: 'brand' recolors with the user's BrandKit (when one was
  // planned), 'preserve' keeps the *document's own* extracted palette/fonts.
  // Both fall back to the document identity so a preserve-like result never
  // silently becomes a full redesign.
  if (plan.brandKit) {
    const k = plan.brandKit
    presentation.theme = {
      ...presentation.theme,
      palette: { ...presentation.theme.palette, primary: k.colors.primary, secondary: k.colors.secondary, accent: k.colors.accent },
    }
    presentation.theme.fonts = {
      ...presentation.theme.fonts,
      heading: mapFontFamily(k.fonts.heading),
      body: mapFontFamily(k.fonts.body),
    }
  } else if ((plan.mode === 'brand' || plan.mode === 'preserve') && doc.brandSuggestion) {
    const b = doc.brandSuggestion
    presentation.theme = {
      ...presentation.theme,
      palette: { ...presentation.theme.palette, primary: b.primary, secondary: b.secondary, accent: b.accent },
    }
    if (b.fonts.length) {
      const heading = mapFontFamily(b.fonts[0])
      const body = mapFontFamily(b.fonts[1] ?? b.fonts[0])
      presentation.theme.fonts = { ...presentation.theme.fonts, heading, body }
    }
  }

  let imagesInjected = 0
  let tablesInjected = 0

  for (const meta of plan.meta) {
    const slide = presentation.slides[meta.slideIndex]
    if (!slide) continue

    if (meta.imageId) {
      const img = imagesById.get(meta.imageId)
      const el = slide.elements.find((e) => e.kind === 'image')
      if (img && el && el.kind === 'image' && img.dataUrl) {
        const asset: AssetRef = {
          id: `pdfimg-${img.id}`,
          name: img.caption?.slice(0, 60) ?? `صورة من ${doc.fileName}`,
          mime: dataUrlMime(img.dataUrl),
          kind: 'image',
          src: img.dataUrl,
          w: img.width,
          h: img.height,
          createdAt: Date.now(),
        }
        assets[asset.id] = asset
        el.assetId = asset.id
        el.fit = 'contain'
        imagesInjected += 1
      }
    }

    if (meta.tableId) {
      const table = tablesById.get(meta.tableId)
      const el = slide.elements.find((e) => e.kind === 'table')
      if (table && el && el.kind === 'table') {
        const cols = Math.max(2, table.nCols)
        el.cells = table.rows.map((row) => {
          const cells = Array.from({ length: cols }, (_, ci) => ({ text: row[ci] ?? '' }))
          return cells
        })
        // header row styling: bold first row when it looks like a header (short cells)
        const firstRow = el.cells[0] ?? []
        const headerish = firstRow.length > 0 && firstRow.every((c) => (c.text?.length ?? 0) < 30)
        el.header = headerish
        el.cells = el.cells.map((row, ri) => row.map((c) => (headerish && ri === 0 ? { ...c, bold: true } : c)))
        el.colWidths = Array.from({ length: cols }, () => el.w / cols)
        el.rowHeights = Array.from({ length: el.cells.length }, () => el.h / el.cells.length)
        tablesInjected += 1
      }
    }
  }

  return { doc: normalizePresentation(presentation), imagesInjected, tablesInjected }
}

function dataUrlMime(dataUrl: string): string {
  const m = /^data:([^;,]+)[^,]*/.exec(dataUrl)
  return m?.[1] ?? 'image/png'
}
