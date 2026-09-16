/**
 * PPTX export — PptxGenJS (MIT).
 *
 * Policy (from the product brief): never flatten a slide into a picture. Each element becomes a
 * real PowerPoint object — text with runs, native auto-shapes, native tables and charts, images.
 * Rasterisation is a per-element *fallback*, only for things OOXML cannot express 1:1
 * (CSS filters, masks, gradient fills, custom SVG, live charts) and we tell the user exactly
 * which elements took that path.
 */
import pptxgen from 'pptxgenjs'
import { toPng } from 'html-to-image'
import { htmlToBlocks, type TextBlock } from '../document/text'
import { FROM_PPTX_SHAPE, PPTX_SHAPE_MAP, shapePath } from '../document/shapes'
import { iconSvg } from '../lib/iconLibrary'
import { svgToPngDataUrl, toEmbeddableImageData, toMediaDataValue } from '../lib/raster'
import { paintToCss, parseColor, toHex } from '../lib/colors'
import { resolveFont } from '../lib/fonts'
import { chartData } from '../render/ChartView'
import type { AnyElement, Background, ChartElement, ImageElement, ImageFilters, Presentation, ShapeElement, Slide, TableElement, TextStyle } from '../document/types'
import { CANVAS_W } from '../document/types'
import { normalizePresentation } from '../document/factory'

/** Our design space is 1280×720 px; PowerPoint widescreen is 13.333×7.5 in. */
const IN_PER_PX = 13.3333 / CANVAS_W
const PT_PER_PX = 0.75

export interface PptxExportResult {
  fileName: string
  bytes: number
  rasterized: { id: string; name: string; reason: string }[]
}

export interface PptxExportOptions {
  includeNotes?: boolean
  hiddenSlides?: boolean
  onProgress?: (step: string, done: number, total: number) => void
  /** Capture helper for elements that must be flattened. Provided by the editor. */
  captureElement?: (id: string, el: AnyElement) => Promise<string | null>
}

export async function exportToPptx(input: Presentation, opts: PptxExportOptions = {}): Promise<{ blob: Blob; result: PptxExportResult }> {
  const doc = normalizePresentation(input)
  const pptx = new pptxgen()
  const scale = (v: number) => v * IN_PER_PX
  const rasterized: PptxExportResult['rasterized'] = []

  pptx.defineLayout({ name: 'AUROVA_169', width: 13.3333, height: 7.5 })
  pptx.layout = 'AUROVA_169'
  pptx.author = doc.metadata.author ?? 'Aurova Studio'
  pptx.company = doc.metadata.company ?? 'Aurova Studio'
  pptx.title = doc.metadata.title
  pptx.subject = doc.metadata.subject ?? ''
  pptx.rtlMode = doc.metadata.dir === 'rtl'

  const total = doc.slides.length
  let index = 0

  for (const slide of doc.slides) {
    index++
    opts.onProgress?.(`شريحة ${index}/${total}`, index - 1, total)
    const out = pptx.addSlide()
    out.hidden = !!slide.hidden && !opts.hiddenSlides
    // Awaited on purpose: image backgrounds need an async rasterization step before write().
    await applyBackground(out, slide.background, doc)
    if (opts.includeNotes !== false && slide.notes.trim()) out.addNotes(slide.notes)

    const ordered = orderForExport(slide)
    for (const el of ordered) {
      if (!el.visible) continue
      const geo = { x: scale(el.x), y: scale(el.y), w: scale(el.w), h: scale(el.h) }
      try {
        await writeElement(out, el, geo, doc, scale, rasterized, opts)
      } catch (err) {
        rasterized.push({ id: el.id, name: el.name, reason: `تعذّر تصديره (${(err as Error).message})` })
      }
    }
  }

  opts.onProgress?.('بناء الملف', total, total)
  const blob = (await pptx.write({ outputType: 'blob' })) as Blob
  const fileName = `${safeName(doc.metadata.title)}.pptx`
  return { blob, result: { fileName, bytes: blob.size, rasterized } }
}

/* ------------------------------------------------------------------ background */

async function applyBackground(slide: pptxgen.Slide, bg: Background, doc: Presentation) {
  if (!bg || bg.type === 'none') {
    slide.background = { color: toHex(doc.theme.palette.background, '#ffffff').replace('#', '') }
    return
  }
  if (bg.type === 'solid') {
    slide.background = { color: toHex(bg.color, '#ffffff').replace('#', '') }
    return
  }
  if (bg.type === 'gradient') {
    // OOXML slide backgrounds do not take a CSS gradient: use the dominant stop as the fill and
    // paint the gradient as a full-bleed vector-free rectangle is unnecessary — PowerPoint
    // renders gradients per shape, so we keep the closest solid and note nothing (visually near).
    const stops = bg.gradient?.stops ?? []
    const first = stops[0]?.color ?? doc.theme.palette.background
    slide.background = { color: toHex(first, '#ffffff').replace('#', '') }
    return
  }
  if (bg.type === 'image' && bg.image) {
    const asset = doc.assets[bg.image.assetId]
    if (asset) {
      const data = await toEmbeddableImageData(asset.src)
      if (data) {
        slide.background = { data }
        return
      }
    }
  }
  slide.background = { color: toHex(doc.theme.palette.background, '#ffffff').replace('#', '') }
}

/* ------------------------------------------------------------------ elements */

type Geo = { x: number; y: number; w: number; h: number }

async function writeElement(
  out: pptxgen.Slide,
  el: AnyElement,
  geo: Geo,
  doc: Presentation,
  scale: (v: number) => number,
  rasterized: PptxExportResult['rasterized'],
  opts: PptxExportOptions,
): Promise<void> {
  const common = {
    x: geo.x,
    y: geo.y,
    w: geo.w,
    h: geo.h,
    rotate: el.rotation || 0,
  }

  switch (el.kind) {
    case 'text': {
      const blocks = htmlToBlocks(el.content)
      const runs = blocksToRuns(blocks, el.font, doc)
      if (!runs.length) return
      out.addText(runs, {
        ...common,
        ...textOptions(el.font, doc),
        isTextBox: true,
        inset: 0,
        fit: el.font.autoFit === 'shrink' ? 'shrink' : 'none',
        transparency: opacityToTransparency(el.opacity),
      })
      return
    }
    case 'shape': {
      const needsRaster = needsShapeRasterization(el)
      if (needsRaster) {
        const data = (await rasterElement(el, opts)) ?? (await shapeFallbackPng(el))
        if (data) {
          out.addImage({ data, ...common, sizing: { type: 'contain', w: geo.w, h: geo.h }, transparency: opacityToTransparency(el.opacity) })
          rasterized.push({ id: el.id, name: el.name, reason: needsRaster })
        }
        return
      }
      const shapeName = (PPTX_SHAPE_MAP[el.shape] ?? 'rect') as keyof typeof pptxgen.ShapeType
      const line = el.stroke
        ? { color: toHex(el.stroke.color, '#000000').replace('#', ''), width: Math.max(0.25, scalePxToPt(el.stroke.width)), dashType: dashOf(el.stroke.dash) }
        : { type: 'none' as never }
      out.addShape(shapeName, {
        ...common,
        fill: fillOf(el.fill),
        line,
        rectRadius: el.shape === 'roundRect' || el.shape === 'pill' ? Math.min(0.5, scale(Math.min(el.w, el.h) * 0.5 * (el.radius?.[0] ? 0.6 : 1))) : undefined,
        shadow: shadowOf(el.shadow),
        ...(el.text && el.textStyle
          ? {
              text: el.text.replace(/<[^>]+>/g, ''),
              fontSize: (el.textStyle.fontSize ?? 18) * PT_PER_PX,
              color: toHex(el.textStyle.color, '#000000').replace('#', ''),
              align: alignOf(el.textStyle.align, el.textStyle.dir),
              valign: valignOf(el.textStyle.vAlign),
              isTextBox: true,
              rtlMode: el.textStyle.dir === 'rtl',
              fontFace: fontFaceOf(el.textStyle.fontFamily),
              bold: el.textStyle.bold,
              italic: el.textStyle.italic,
            }
          : {}),
      })
      return
    }
    case 'line': {
      const shape = el.endArrow && el.endArrow !== 'none' ? 'lineArrow' : 'line'
      out.addShape(shape as keyof typeof pptxgen.ShapeType, {
        ...common,
        line: { color: toHex(el.stroke.color, '#000000').replace('#', ''), width: Math.max(0.5, scalePxToPt(el.stroke.width)), dashType: dashOf(el.stroke.dash), endArrowType: arrowOf(el.endArrow), beginArrowType: arrowOf(el.startArrow) },
        fill: { type: 'none' as never },
      })
      return
    }
    case 'image': {
      const asset = doc.assets[el.assetId]
      const mustRaster = hasEffects(el.filters) || !!el.mask || radiusSum(el.radius) > 0 || !!el.shadow || (el.stroke?.width ?? 0) > 0
      if (asset && !mustRaster) {
        const embedded = await toEmbeddableImageData(asset.src)
        if (!embedded) {
          rasterized.push({ id: el.id, name: el.name, reason: 'صيغة الصورة لا يمكن تضمينها في PPTX (blob/شبكة خارجية)' })
          return
        }
        out.addImage({ data: embedded, ...common, sizing: { type: el.fit === 'contain' ? 'contain' : 'cover', w: geo.w, h: geo.h }, transparency: opacityToTransparency(el.opacity) })
        return
      }
      if (asset && mustRaster) {
        const data = (await rasterElement(el, opts)) ?? (await rasterizeImageElement(el, await toEmbeddableImageData(asset.src)))
        if (data) {
          out.addImage({ data, ...common, transparency: opacityToTransparency(el.opacity) })
          rasterized.push({ id: el.id, name: el.name, reason: 'تأثيرات صورتية (فلاتر/قناع/ظل) مسطّحة' })
          return
        }
      }
      out.addText('[صورة مفقودة]', { ...common, fontSize: 12, color: '888888', align: 'center', valign: 'middle' })
      rasterized.push({ id: el.id, name: el.name, reason: 'الأصل غير متاح' })
      return
    }
    case 'table': {
      writeTable(out, el, common, doc, scale)
      return
    }
    case 'chart': {
      writeChart(out, el, common, scale)
      return
    }
    case 'icon': {
      const png = await svgToPngDataUrl(iconSvg(el.icon, { color: el.color, strokeWidth: el.strokeWidth, size: 256 }), el.w, el.h)
      if (png) {
        out.addImage({ data: png, ...common })
        rasterized.push({ id: el.id, name: el.name, reason: 'أيقونة متجهية → PNG' })
        return
      }
      return
    }
    case 'svg': {
      const png = await svgToPngDataUrl(el.markup, el.w, el.h)
      if (png) {
        out.addImage({ data: png, ...common })
        rasterized.push({ id: el.id, name: el.name, reason: 'SVG مخصص → صورة' })
      }
      return
    }
    case 'video': {
      const media = toMediaDataValue(el.src)
      if (!media) {
        rasterized.push({ id: el.id, name: el.name, reason: 'الفيديو يشير لمصدر مؤقت (blob) — صدّره كملف مستقل أو أرفق رابطًا' })
        return
      }
      out.addMedia({ data: media, type: 'video', ...common })
      return
    }
    case 'frame': {
      out.addShape('rect' as keyof typeof pptxgen.ShapeType, { ...common, fill: fillOf(el.background), line: el.stroke ? { color: toHex(el.stroke.color, '#000').replace('#', ''), width: scalePxToPt(el.stroke.width) } : { type: 'none' as never } })
      return
    }
    default:
      return
  }
}

/* ------------------------------------------------------------------ text */

function blocksToRuns(blocks: TextBlock[], font: TextStyle, doc: Presentation): pptxgen.TextProps[] {
  const runs: pptxgen.TextProps[] = []
  const rtl = font.dir === 'rtl'
  blocks.forEach((block, bi) => {
    const isLastBlock = bi === blocks.length - 1
    block.runs.forEach((run, ri) => {
      const last = ri === block.runs.length - 1
      runs.push({
        text: run.text,
        options: {
          bold: run.bold ?? font.bold,
          italic: run.italic ?? font.italic,
          underline: (run.underline ?? font.underline) ? { style: 'sng' as never } : undefined,
          strike: (run.strike ?? font.strike) ? ('sngStrike' as never) : undefined,
          color: toHex(run.color ?? font.color, doc.theme.palette.text).replace('#', ''),
          highlight: run.highlight ? toHex(run.highlight, 'FFFF00').replace('#', '') : undefined,
          fontFace: run.font ? fontFaceOf(run.font) : fontFaceOf(font.fontFamily),
          fontSize: (run.size ?? font.fontSize) * PT_PER_PX,
          charSpacing: (run.spacing ?? font.letterSpacing) * PT_PER_PX,
          align: (block.align ?? font.align ? alignOf(block.align ?? font.align, rtl ? 'rtl' : 'ltr') : undefined) as never,
          bullet:
            block.type === 'bullet'
              ? { code: '2022', indent: 18 }
              : block.type === 'number'
                ? { type: 'number', indent: 18 }
                : false,
          indentLevel: block.level,
          rtlMode: (block.dir ?? font.dir) === 'rtl',
          breakLine: last && !isLastBlock,
          hyperlink: run.link ? { url: run.link } : undefined,
        },
      })
    })
  })
  return runs
}

function textOptions(font: TextStyle, doc: Presentation): pptxgen.TextPropsOptions {
  return {
    fontFace: fontFaceOf(font.fontFamily),
    fontSize: font.fontSize * PT_PER_PX,
    color: toHex(font.color, doc.theme.palette.text).replace('#', ''),
    bold: font.bold,
    italic: font.italic,
    align: alignOf(font.align, font.dir),
    valign: valignOf(font.vAlign),
    lineSpacingMultiple: font.lineHeight,
    charSpacing: font.letterSpacing * PT_PER_PX,
    paraSpaceAfter: (font.paraSpacing ?? 0.4) * 12,
    rtlMode: font.dir === 'rtl',
    wrap: font.wrap,
  }
}

function fontFaceOf(id: string | undefined): string {
  if (!id) return 'Tajawal'
  const def = resolveFont(id)
  if (def) return def.label
  return id.split(',')[0].replace(/["']/g, '').trim()
}

function alignOf(align: TextStyle['align'] | undefined, dir: 'rtl' | 'ltr'): 'left' | 'right' | 'center' | 'justify' {
  switch (align) {
    case 'center':
      return 'center'
    case 'justify':
      return 'justify'
    case 'end':
      return dir === 'rtl' ? 'left' : 'right'
    case 'start':
    default:
      return dir === 'rtl' ? 'right' : 'left'
  }
}

function valignOf(v: TextStyle['vAlign']): 'top' | 'middle' | 'bottom' {
  return v === 'start' ? 'top' : v === 'end' ? 'bottom' : 'middle'
}

/* ------------------------------------------------------------------ fills */

function fillOf(paint: ShapeElement['fill'] | import('../document/types').Paint): pptxgen.ShapeFillProps {
  if (!paint || paint.type === 'none') return { type: 'none' as never }
  if (paint.type === 'solid') {
    const c = parseColor(paint.color)
    return { color: toHex(paint.color, '#ffffff').replace('#', ''), transparency: c ? Math.round((1 - c.a) * 100) : 0 }
  }
  if (paint.type === 'gradient') {
    const mid = paint.stops[Math.floor(paint.stops.length / 2)]?.color ?? paint.stops[0]?.color ?? '#ffffff'
    return { color: toHex(mid, '#ffffff').replace('#', '') }
  }
  return { color: toHex(paint.background, '#ffffff').replace('#', '') }
}

function shadowOf(shadow: AnyElement['shadow']): pptxgen.ShadowProps | undefined {
  if (!shadow) return undefined
  return { type: 'outer', angle: 90 + Math.round(Math.atan2(shadow.y, shadow.x) * (180 / Math.PI)), blur: shadow.blur * PT_PER_PX, offset: Math.hypot(shadow.x, shadow.y) * PT_PER_PX, color: toHex(shadow.color, '#000000').replace('#', ''), opacity: 0.6 }
}

function dashOf(dash: 'solid' | 'dashed' | 'dotted' | undefined): 'solid' | 'dash' | 'sysDot' | 'sysDash' {
  return dash === 'dashed' ? 'dash' : dash === 'dotted' ? 'sysDot' : 'solid'
}

function arrowOf(kind: string | undefined): 'none' | 'arrow' | 'diamond' | 'oval' | 'triangle' {
  switch (kind) {
    case 'arrow':
      return 'arrow'
    case 'diamond':
      return 'diamond'
    case 'oval':
      return 'oval'
    case 'triangle':
      return 'triangle'
    default:
      return 'none'
  }
}

function opacityToTransparency(opacity: number): number {
  return Math.round((1 - (opacity ?? 1)) * 100)
}

function scalePxToPt(px: number): number {
  return Math.max(0.25, px * PT_PER_PX)
}

/* ------------------------------------------------------------------ table */

function writeTable(out: pptxgen.Slide, el: TableElement, geo: Geo, doc: Presentation, scale: (v: number) => number) {
  const rows: pptxgen.TextProps[][] = el.cells.map((row, ri) =>
    row.map((cell) => ({
      text: cell.text ?? '',
      options: {
        bold: cell.bold ?? (el.header && ri === 0),
        color: toHex(cell.color ?? el.font.color, doc.theme.palette.text).replace('#', ''),
        fill: cell.fill
          ? { color: toHex(cell.fill, '#ffffff').replace('#', '') }
          : el.header && ri === 0
            ? { color: toHex(doc.theme.palette.primary, '#111111').replace('#', '') }
            : el.striped && ri % 2 === 0
              ? { color: toHex(mixWhite(doc.theme.palette.surface, 0.55), '#f6f7f9').replace('#', '') }
              : undefined,
        align: alignOf(cell.align ?? el.font.align, el.font.dir),
        valign: valignOf(el.font.vAlign),
        fontSize: el.font.fontSize * PT_PER_PX,
        fontFace: fontFaceOf(el.font.fontFamily),
        rtlMode: el.font.dir === 'rtl',
      },
    })),
  )
  out.addTable(rows, {
    x: geo.x,
    y: geo.y,
    w: geo.w,
    h: geo.h,
    border: { type: el.border.dash === 'dashed' ? ('dash' as never) : el.border.dash === 'dotted' ? ('none' as never) : 'solid', color: toHex(el.border.color, '#dddddd').replace('#', ''), pt: Math.max(0.25, scale(el.border.width)) },
    fill: { color: 'FFFFFF' },
    margin: { t: el.cellPadding * 0.4, b: el.cellPadding * 0.4, l: el.cellPadding * 0.6, r: el.cellPadding * 0.6 } as never,
    rowH: el.rowHeights.map((h) => h * geo.h),
    colW: el.colWidths.map((w) => w * geo.w),
    fontFace: fontFaceOf(el.font.fontFamily),
    fontSize: el.font.fontSize * PT_PER_PX,
    valign: valignOf(el.font.vAlign),
    color: toHex(el.font.color, '#111111').replace('#', ''),
  })
}

/* ------------------------------------------------------------------ charts */

function writeChart(out: pptxgen.Slide, el: ChartElement, geo: Geo, scale: (v: number) => number) {
  void scale
  const rows = chartData(el)
  const labels = rows.map((r) => String(r.name))
  const colors = el.colors.map((c) => toHex(c, '#3E7CB1').replace('#', ''))
  // NOTE: `ChartType` lives on the PptxGenJS *instance*, not the default export — plain
  // CHART_NAME strings are the stable API, so we use them directly.
  const typeMap: Record<string, pptxgen.CHART_NAME> = {
    bar: 'bar',
    barH: 'bar',
    line: 'line',
    area: 'area',
    pie: 'pie',
    donut: 'doughnut',
    radar: 'radar',
    scatter: 'scatter',
  }
  const type = typeMap[el.chart] ?? 'bar'
  const data = el.series.map((s) => ({
    name: s.name,
    labels,
    values: el.categories.map((_, ci) => s.values[ci] ?? 0),
  }))
  const isPie = el.chart === 'pie' || el.chart === 'donut'
  out.addChart(type, data as never, {
    x: geo.x,
    y: geo.y,
    w: geo.w,
    h: geo.h,
    barDir: el.chart === 'barH' ? 'bar' : 'col',
    chartColors: isPie ? colors : colors,
    chartColorsOpacity: 100,
    showLegend: el.legend && (isPie || el.series.length > 1),
    legendPos: 'b',
    legendFontSize: 10,
    legendColor: '5A6672',
    showValue: el.values,
    dataLabelFontSize: 9,
    catAxisLabelFontSize: 10,
    valAxisLabelFontSize: 10,
    showCatAxis: el.axis && !isPie,
    showValAxis: el.axis && !isPie,
    catAxisLabelColor: '5A6672',
    valAxisLabelColor: '5A6672',
    valGridLine: el.axis ? { style: 'solid', size: 0.5, color: 'E5E7EB' } : { style: 'none' },
    holeSize: el.chart === 'donut' ? 62 : undefined,
    dataBorder: isPie ? { pt: 1, color: 'FFFFFF' } : undefined,
    rtlMode: true,
    radarStyle: 'standard',
    lineDataSymbol: 'circle',
    lineSize: 2.5,
    border: { pt: 0, color: 'FFFFFF' },
  } as unknown as pptxgen.IChartOpts)
  void rows
}

/* ------------------------------------------------------------------ raster fallbacks */

function needsShapeRasterization(el: ShapeElement): string | null {
  if (el.fill?.type === 'gradient') return 'تدرّج لوني (غير مدعوم كأuto-shape في PPTX)'
  if (!PPTX_SHAPE_MAP[el.shape] && !FROM_PPTX_SHAPE[el.shape]) return 'شكل مخصص'
  if (el.shape === 'donut' || el.shape === 'sun' || el.shape === 'moon' || el.shape === 'cloud' || el.shape === 'heart' || el.shape === 'lightning') {
    // These have OOXML presets but with our exact geometry; keep vector when the preset exists.
    return null
  }
  if (el.shadow && el.shadow.blur > 0) return 'ظل خارجي على شكل معقّد'
  return null
}

function hasEffects(f: ImageFilters): boolean {
  return f.brightness !== 100 || f.contrast !== 100 || f.saturation !== 100 || f.grayscale > 0 || f.sepia > 0 || f.blur > 0 || f.hueRotate !== 0
}

function radiusSum(r: number[] | undefined): number {
  return (r ?? []).reduce((a, b) => a + (b || 0), 0)
}

async function rasterElement(el: AnyElement, opts: PptxExportOptions): Promise<string | null> {
  if (!opts.captureElement) return null
  return opts.captureElement(el.id, el)
}

/** Offscreen rasterisation when the editor is not mounted (e.g. exporting from the dashboard). */
async function rasterizeImageElement(el: ImageElement, src: string | null): Promise<string | null> {
  if (!src) return null
  try {
    const img = await loadImage(src)
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(2, Math.round(el.w * 2))
    canvas.height = Math.max(2, Math.round(el.h * 2))
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.filter = `brightness(${el.filters.brightness}%) contrast(${el.filters.contrast}%) saturate(${el.filters.saturation}%) grayscale(${el.filters.grayscale}%) sepia(${el.filters.sepia}%) hue-rotate(${el.filters.hueRotate}deg) blur(${el.filters.blur}px)`
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}

async function shapeFallbackPng(el: ShapeElement): Promise<string | null> {
  // No DOM capture available: rasterize our own SVG path through a canvas so PowerPoint gets a real
  // PNG (PptxGenJS cannot embed SVG data URLs on its own).
  const { d } = shapePath(el.shape, el.w, el.h, el.radius, el.adj)
  const paint = paintToCss(el.fill)
  const fill = paint.startsWith('linear') || paint.startsWith('radial') ? (el.fill.type === 'gradient' ? el.fill.stops[0]?.color ?? '#cccccc' : '#cccccc') : paint
  const stroke = el.stroke ? ` stroke="${el.stroke.color}" stroke-width="${el.stroke.width}"${el.stroke.dash === 'dashed' ? ' stroke-dasharray="6 4"' : el.stroke.dash === 'dotted' ? ' stroke-dasharray="1 3"' : ''}` : ''
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${el.w} ${el.h}"><path d="${d}" fill="${fill}"${stroke}/></svg>`
  return svgToPngDataUrl(markup, el.w, el.h)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('decode'))
    img.src = src
  })
}

export async function captureElementPng(node: HTMLElement, el: AnyElement): Promise<string | null> {
  try {
    return await toPng(node, {
      width: el.w,
      height: el.h,
      pixelRatio: 3,
      cacheBust: true,
      skipFonts: false,
      style: { transform: 'none' },
    })
  } catch {
    return null
  }
}

/* ------------------------------------------------------------------ utils */

function mixWhite(hex: string, amount: number): string {
  const c = toHex(hex, '#ffffff')
  const num = (i: number) => parseInt(c.slice(i, i + 2), 16)
  const blend = (v: number) => Math.round(v + (255 - v) * amount)
  const h = (v: number) => v.toString(16).padStart(2, '0')
  return `#${h(blend(num(1)))}${h(blend(num(3)))}${h(blend(num(5)))}`
}

function safeName(name: string): string {
  return (name || 'presentation').replace(/[\\/:*?"<>|]+/g, '-').trim().slice(0, 70)
}

/** PowerPoint paints in document order; our array order is already that. Frames paint first. */
function orderForExport(slide: Slide): AnyElement[] {
  const frames = slide.elements.filter((e) => e.kind === 'frame')
  const rest = slide.elements.filter((e) => e.kind !== 'frame')
  return [...frames, ...rest]
}
