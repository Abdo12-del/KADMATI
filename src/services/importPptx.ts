/**
 * PPTX import — `pptxtojson` (MIT) parses the OOXML package; this module normalises its output
 * into the KADMATI document model, reusing the same element renderers as the editor.
 *
 * Fidelity policy: everything representable becomes a real editable element (text, image, shape,
 * table, chart, background, notes, transitions). Anything that cannot be expressed faithfully is
 * still *kept* — as a picture, or recorded in the import report and in `doc.raw.lost` — never
 * silently dropped and never a crash.
 */
import JSZip from 'jszip'
import { parse } from 'pptxtojson'
import type { Chart, Diagram, Element as PptxElement, Fill, Group, Image, Math as PptxMath, Shape, Table, Text } from 'pptxtojson'
import {
  createAsset,
  createChart,
  createImage,
  createLine,
  createPresentation,
  createShape,
  createSlide,
  createSvg,
  createTable,
  createText,
  newId,
} from '../document/factory'
import { FROM_PPTX_SHAPE } from '../document/shapes'
import { escapeHtml, sanitizeHtml } from '../document/text'
import { toHex } from '../lib/colors'
import { CANVAS_W, defaultTransition, type AnyElement, type ShapeId, type AssetRef, type Background, type ChartKind, type Presentation, type ShapeElement, type Slide, type TableCell, type Theme, type TextStyle } from '../document/types'

export interface ImportReport {
  slides: number
  elements: number
  approximated: string[]
  themeColors: string[]
  fonts: string[]
}

export interface ImportResult {
  doc: Presentation
  report: ImportReport
}

interface Ctx {
  scale: number
  assets: Record<string, AssetRef>
  approximated: string[]
  theme: Theme
  slideIndex: number
}

/** pptxtojson reports geometry in px for a 960-wide page; we normalise to design units. */
const EMU_PER_PX = 9525
const PT_PER_PX = 0.75

export async function importPptx(
  file: File,
  onProgress?: (label: string, done: number, total: number) => void,
): Promise<ImportResult> {
  onProgress?.('قراءة الملف', 0, 4)
  const buffer = await normalizePptxPackage(await file.arrayBuffer())
  onProgress?.('فك ترميز العرض', 1, 4)
  const parsed = await parse(buffer, { imageMode: 'base64', videoMode: 'none', audioMode: 'none' })
  onProgress?.('تحويل العناصر', 2, 4)

  const srcW = parsed.size?.width || 960
  const theme = themeFromParsed(parsed.themeColors ?? [], parsed.usedFonts ?? [])
  const ctx: Ctx = { scale: CANVAS_W / srcW, assets: {}, approximated: [], theme, slideIndex: 0 }

  const slides: Slide[] = (parsed.slides ?? []).map((raw, index) => {
    ctx.slideIndex = index
    const slide = createSlide({ id: newId('sl'), layoutId: 'imported' })
    slide.background = mapBackground(raw.fill, ctx)
    if (raw.note) slide.notes = String(raw.note).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    const transition = raw.transition
    if (transition?.type) {
      slide.transition = {
        ...defaultTransition(),
        type: normalizeTransition(transition.type),
        duration: clamp(50, 3000, Math.round((transition.duration || 400) / 10) * 10),
      }
    }
    const list = [...(raw.layoutElements ?? []), ...(raw.elements ?? [])]
      .filter((el) => el && typeof el === 'object' && 'type' in el)
      .sort((a, b) => orderOf(a) - orderOf(b))
    const out: AnyElement[] = []
    for (const el of list) {
      const mapped = mapElement(el, ctx)
      if (mapped) out.push(...mapped)
    }
    slide.elements = out
    return slide
  })

  onProgress?.('بناء المستند', 3, 4)
  const textProbe = slides
    .slice(0, 2)
    .flatMap((s) => s.elements)
    .map((el) => (el.kind === 'text' ? el.content : ''))
    .join(' ')
  const dir = detectDir(textProbe)
  const title = file.name.replace(/\.pptx?$/i, '').trim() || 'عرض مستورد'

  const doc = createPresentation({
    id: newId('p'),
    title,
    theme,
    slides: slides.length ? slides : [createSlide()],
    assets: ctx.assets,
    metadata: {
      title,
      tags: ['مستورد من PowerPoint'],
      dir,
      lang: dir === 'rtl' ? 'ar' : 'en',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      trashedAt: null,
    },
    raw: {
      importedFrom: file.name,
      sourceSize: parsed.size,
      lost: Array.from(new Set(ctx.approximated)),
    },
  })

  onProgress?.('تم الاستيراد', 4, 4)
  return {
    doc,
    report: {
      slides: doc.slides.length,
      elements: doc.slides.reduce((n, s) => n + s.elements.length, 0),
      approximated: Array.from(new Set(ctx.approximated)),
      themeColors: parsed.themeColors ?? [],
      fonts: parsed.usedFonts ?? [],
    },
  }
}

/**
 * Some generators (including our own PPTX exporter) write *absolute* relationship targets such as
 * `Target="/ppt/charts/chart1.xml"`. PowerPoint accepts that, but consumers that resolve the path
 * relative to the part break on it. Rewriting them to proper relative paths costs one pass over
 * the `.rels` parts and makes round-trips work.
 */
async function normalizePptxPackage(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  try {
    const zip = await JSZip.loadAsync(buffer)
    let changed = false

    // PptxGenJS caches category labels as `multiLvlStrRef`; the chart reader understands `strRef`.
    // A single-level cache is equivalent, so unwrap it (keeps exported charts round-tripable).
    for (const name of Object.keys(zip.files)) {
      if (!/^ppt\/charts\/chart\d+\.xml$/.test(name)) continue
      const entry = zip.file(name)
      if (!entry) continue
      const xml = await entry.async('string')
      if (!xml.includes('multiLvlStr')) continue
      const next = xml
        .replace(/<c:multiLvlStrRef>/g, '<c:strRef>')
        .replace(/<\/c:multiLvlStrRef>/g, '</c:strRef>')
        .replace(/<c:multiLvlStrCache>/g, '<c:strCache>')
        .replace(/<\/c:multiLvlStrCache>/g, '</c:strCache>')
        .replace(/<c:lvl>/g, '')
        .replace(/<\/c:lvl>/g, '')
      if (next !== xml) {
        zip.file(name, next)
        changed = true
      }
    }
    const names = Object.keys(zip.files).filter((name) => /^ppt\/(slides|notesSlides|handouts|slideLayouts|slideMasters|notesMasters)\/_rels\/[^/]+\.rels$/.test(name))
    for (const name of names) {
      const entry = zip.file(name)
      if (!entry) continue
      const xml = await entry.async('string')
      if (!xml.includes('Target="/ppt/')) continue
      const dir = name.replace(/_rels\/[^/]+\.rels$/, '').replace(/\/$/, '')
      const depth = dir.split('/').length - 1
      const next = xml.replace(/Target="(\/ppt\/[^"]+)"/g, (_m, target: string) => `Target="${'../'.repeat(depth)}${target.slice('/ppt/'.length)}"`)
      if (next !== xml) {
        zip.file(name, next)
        changed = true
      }
    }
    if (!changed) return buffer
    return (await zip.generateAsync({ type: 'arraybuffer', compression: 'STORE' })) as ArrayBuffer
  } catch {
    return buffer
  }
}

function orderOf(el: PptxElement): number {
  const o = (el as { order?: number }).order
  return typeof o === 'number' ? o : 0
}

function clamp(min: number, max: number, v: number): number {
  return Math.min(max, Math.max(min, v))
}

/* ------------------------------------------------------------------ theme & colors */

const FALLBACK_FONTS = /calibri|arial|times|garamond|cambria|georgia|helvetica|tahoma|verdana/i

function themeFromParsed(colors: string[], fonts: string[]): Theme {
  const clean = colors.filter(Boolean)
  const arabicFonts = fonts.filter((f) => /tajawal|cairo|amiri|kufi|naskh|scheherazade|readex|arabic|thuluth/i.test(f))
  const hasArabic = arabicFonts.length > 0
  const body = arabicFonts[0] ?? (hasArabic ? 'tajawal' : fonts.find((f) => !FALLBACK_FONTS.test(f)) ?? 'inter')
  const heading = arabicFonts.find((f) => /kufi|amiri|display/i.test(f)) ?? body
  return {
    id: 'imported',
    name: 'نمط من PowerPoint',
    palette: {
      primary: toHex(clean[0], '#16324F'),
      secondary: toHex(clean[2], '#3E7CB1'),
      accent: toHex(clean[5], '#E8734A'),
      background: '#FFFFFF',
      surface: toHex(clean[1], '#F4F6F8'),
      text: '#101820',
      textMuted: '#5A6672',
      onPrimary: '#FFFFFF',
      success: toHex(clean[3], '#1F9D6B'),
      warning: toHex(clean[4], '#D68910'),
    },
    fonts: { heading: fontIdFor(heading), body: fontIdFor(body), mono: 'jetbrains' },
    radius: 6,
    spacing: 72,
    headingWeight: 700,
    headingTransform: 'none',
    style: 'flat',
  }
}

/** Keep the imported typeface when we ship it, otherwise fall back to the Arabic-safe stacks. */
function fontIdFor(name: string): string {
  const n = name.toLowerCase()
  if (/tajawal/.test(n)) return 'tajawal'
  if (/cairo/.test(n)) return 'cairo'
  if (/amiri/.test(n)) return 'amiri'
  if (/readex/.test(n)) return 'readex'
  if (/plex/i.test(n)) return 'ibm-plex'
  if (/inter/.test(n)) return 'inter'
  return n.includes('arab') || n.includes('kufi') || n.includes('naskh') ? 'tajawal' : 'inter'
}

function detectDir(text: string): 'rtl' | 'ltr' {
  const arabic = (text.match(/[؀-ۿ]/g) ?? []).length
  const latin = (text.match(/[A-Za-z]/g) ?? []).length
  return arabic > latin ? 'rtl' : 'ltr'
}

function normalizeTransition(type: string): Slide['transition']['type'] {
  const t = String(type).toLowerCase()
  if (t.includes('fade') || t.includes('dissolve')) return 'fade'
  if (t.includes('push') || t.includes('cover') || t.includes('wipe') || t.includes('strip')) return 'push'
  if (t.includes('zoom') || t.includes('grow') || t.includes('pivot')) return 'zoom'
  if (t.includes('split') || t.includes('strike') || t.includes('fly') || t.includes('slide') || t.includes('wheel') || t.includes('venetian')) return 'slide'
  return 'none'
}

/* ------------------------------------------------------------------ geometry & paints */

interface Geo {
  x: number
  y: number
  w: number
  h: number
  rotation: number
}

function geoOf(el: { left?: number; top?: number; width?: number; height?: number; rotate?: number }, ctx: Ctx): Geo {
  const s = ctx.scale
  return {
    x: Math.round((Number(el.left) || 0) * s),
    y: Math.round((Number(el.top) || 0) * s),
    w: Math.max(4, Math.round((Number(el.width) || 120) * s)),
    h: Math.max(4, Math.round((Number(el.height) || 40) * s)),
    rotation: 0,
  }
}

function ensureDataUrl(src: string, mime = 'image/png'): string {
  if (!src) return src
  if (src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('http')) return src
  return `data:${mime};base64,${src}`
}

function mimeFromData(src: string): string {
  const m = /^data:([^;,]+)/.exec(src)
  return m ? m[1] : 'image/png'
}

function paintOf(fill: Fill | undefined, ctx: Ctx): ShapeElement['fill'] {
  if (!fill || !fill.type) return { type: 'none' }
  if (fill.type === 'color') {
    const value = fill.value
    if (typeof value !== 'string') return { type: 'none' }
    const opacity = (fill as unknown as { opacity?: number }).opacity
    const color = toHex(value, ctx.theme.palette.surface)
    if (typeof opacity === 'number' && opacity < 1) {
      const a = Math.round(clamp(0, 1, opacity) * 255)
        .toString(16)
        .padStart(2, '0')
      return { type: 'solid', color: `${color}${a}` }
    }
    return { type: 'solid', color }
  }
  if (fill.type === 'gradient') {
    const raw = fill.value as unknown as { colors?: { pos: string; color: string }[]; rot?: number; path?: string }
    const stops = (raw.colors ?? []).map((s) => ({ pos: pctOf(s.pos), color: toHex(s.color, '#ffffff') }))
    if (!stops.length) return { type: 'solid', color: ctx.theme.palette.primary }
    if (stops.length === 1) stops.push({ pos: 100, color: stops[0].color })
    return {
      type: 'gradient',
      kind: raw.path === 'circle' ? 'radial' : 'linear',
      angle: Math.round(normalizeAngle(raw.rot) % 360),
      stops,
    }
  }
  if (fill.type === 'pattern') {
    const raw = fill.value as unknown as { foregroundColor?: string; backgroundColor?: string; type?: string }
    const diagonal = /dk|dn|up|down|diag|horiz|vert/i.test(String(raw.type ?? ''))
    return {
      type: 'pattern',
      color: toHex(raw.foregroundColor, ctx.theme.palette.primary),
      background: toHex(raw.backgroundColor, '#ffffff'),
      pattern: diagonal ? 'diagonal' : 'dots',
    }
  }
  if (fill.type === 'image') {
    const raw = fill.value as unknown as { base64?: string }
    if (raw.base64) {
      const src = ensureDataUrl(raw.base64)
      const asset = createAsset({ name: 'fill', mime: mimeFromData(src), kind: 'image', src })
      ctx.assets[asset.id] = asset
      return { type: 'solid', color: toHex(ctx.theme.palette.surface, '#ffffff') }
    }
  }
  return { type: 'none' }
}

function pctOf(pos: string | number | undefined): number {
  const v = Number(pos)
  if (!Number.isFinite(v)) return 0
  if (v <= 1) return Math.round(v * 100)
  if (v <= 100000) return Math.round((v / 100000) * 100)
  return Math.round(clamp(0, 100, v))
}

function normalizeAngle(rot: number | undefined): number {
  const v = Number(rot)
  if (!Number.isFinite(v)) return 0
  // OOXML rotation is in 60000ths of a degree
  const deg = Math.abs(v) > 360 ? v / 60000 : v
  return ((deg % 360) + 360) % 360
}

function strokeOf(el: { borderColor?: string; borderWidth?: number; borderType?: string }, ctx: Ctx): ShapeElement['stroke'] {
  const width = Number(el.borderWidth) || 0
  if (!width) return undefined
  const type = String(el.borderType ?? 'solid')
  return {
    color: toHex(el.borderColor, ctx.theme.palette.text),
    width: Math.max(0.5, Math.round((width / PT_PER_PX) * 10) / 10),
    dash: type === 'dashed' ? 'dashed' : type === 'dotted' ? 'dotted' : 'solid',
  }
}

function shadowOf(shadow: { h?: number; v?: number; blur?: number; color?: string } | undefined) {
  if (!shadow) return undefined
  const px = (v: number) => Math.round((v / EMU_PER_PX) * 10) / 10
  return {
    x: px(Number(shadow.h) || 0),
    y: px(Number(shadow.v) || 0),
    blur: Math.max(2, px(Number(shadow.blur) || 40000)),
    spread: 0,
    color: toHex(shadow.color, 'rgba(15,23,42,0.28)'),
  }
}

/* ------------------------------------------------------------------ element mapping */

function mapBackground(fill: Fill | undefined, ctx: Ctx): Background {
  const paint = paintOf(fill, ctx)
  if (paint.type === 'gradient') return { type: 'gradient', color: '#ffffff', gradient: { angle: paint.angle, stops: paint.stops, kind: paint.kind } }
  if (paint.type === 'pattern') return { type: 'pattern', color: paint.color, patternColor: paint.background, pattern: paint.pattern }
  if (paint.type === 'solid') return { type: 'solid', color: paint.color }
  if (fill?.type === 'image') {
    const raw = fill.value as unknown as { base64?: string }
    const src = ensureDataUrl(String(raw.base64 ?? ''))
    if (src) {
      const asset = createAsset({ name: 'slide-background', mime: mimeFromData(src), kind: 'image', src })
      ctx.assets[asset.id] = asset
      return { type: 'image', color: ctx.theme.palette.background, image: { assetId: asset.id, fit: 'cover' } }
    }
  }
  return { type: 'solid', color: ctx.theme.palette.background }
}

function mapElement(el: PptxElement, ctx: Ctx): AnyElement[] | null {
  switch (el.type) {
    case 'text':
      return [mapText(el, ctx)]
    case 'shape':
      return [mapShape(el, ctx)]
    case 'image':
      return [mapImage(el, ctx)]
    case 'table':
      return mapTable(el, ctx)
    case 'chart':
      return mapChart(el, ctx)
    case 'group':
      return mapGroup(el, ctx)
    case 'diagram':
      return mapDiagram(el, ctx)
    case 'math':
      return mapMath(el, ctx)
    case 'video':
    case 'audio':
      ctx.approximated.push(`وسائط مضمّنة (${el.type === 'video' ? 'فيديو' : 'صوت'}) في شريحة ${ctx.slideIndex + 1} — أعد إضافتها من لوحة الإدراج`)
      return null
    default:
      return null
  }
}

function mapGroup(el: Group, ctx: Ctx): AnyElement[] | null {
  // pptxtojson resolves child geometry into slide coordinates, so flattening preserves the visuals.
  const out: AnyElement[] = []
  for (const child of el.elements ?? []) {
    const mapped = mapElement(child as PptxElement, ctx)
    if (mapped) out.push(...mapped)
  }
  const gid = out.length > 1 ? newId('g') : undefined
  if (gid) for (const item of out) item.gid = gid
  return out.length ? out : null
}

function mapDiagram(el: Diagram, ctx: Ctx): AnyElement[] | null {
  const out: AnyElement[] = []
  for (const child of el.elements ?? []) {
    const mapped = child.type === 'text' ? mapText(child, ctx) : mapShape(child, ctx)
    out.push(mapped)
  }
  if (out.length) {
    const gid = newId('g')
    out.forEach((item) => (item.gid = gid))
    ctx.approximated.push(`رسم توضيحي (SmartArt) في شريحة ${ctx.slideIndex + 1} حُوّل إلى عناصره القابلة للتحرير`)
    return out
  }
  ctx.approximated.push(`رسم توضيحي فارغ في شريحة ${ctx.slideIndex + 1} تُرِك`)
  return null
}

function mapMath(el: PptxMath, ctx: Ctx): AnyElement[] | null {
  const src = ensureDataUrl(String(el.picBase64 ?? ''))
  if (src) {
    const asset = createAsset({ name: 'equation', mime: mimeFromData(src), kind: 'image', src })
    ctx.assets[asset.id] = asset
    ctx.approximated.push(`معادلة في شريحة ${ctx.slideIndex + 1} حُفظت كصورة (حفاظًا على الشكل)`)
    const geo = geoOf(el, ctx)
    return [createImage({ ...geo, assetId: asset.id, fit: 'contain', role: 'decoration', name: 'معادلة' })]
  }
  if (el.latex) {
    const geo = geoOf(el, ctx)
    return [
      createText(ctx.theme, {
        ...geo,
        role: 'body',
        text: String(el.latex).slice(0, 400),
        name: 'معادلة (LaTeX)',
        style: { fontSize: Math.min(28, Math.max(14, geo.h * 0.5)), fontFamily: 'jetbrains' },
      }),
    ]
  }
  return null
}

function mapText(el: Text, ctx: Ctx): AnyElement {
  const geo = geoOf(el, ctx)
  const style = styleFromHtml(el.content ?? '', ctx.theme)
  if (el.vAlign) style.vAlign = el.vAlign === 'top' ? 'start' : el.vAlign === 'bottom' ? 'end' : 'center'
  if (el.autoFit?.type === 'text') style.autoFit = 'shrink'
  const content = tidyTextHtml(el.content || `<p>${escapeHtml(String(el.name ?? ''))}</p>`)
  const out = createText(ctx.theme, {
    ...geo,
    role: guessRole(el, geo, style),
    html: content,
    style,
    name: el.name || 'نص',
    link: el.link || undefined,
  })
  const shadow = shadowOf(el.shadow as never)
  if (shadow) out.shadow = shadow
  return out
}

function guessRole(el: Text, geo: Geo, style: TextStyle): 'title' | 'body' {
  const plain = String(el.content ?? '').replace(/<[^>]+>/g, '').trim()
  const named = String(el.name ?? '').toLowerCase()
  if (/title|عنوان|heading/.test(named)) return 'title'
  if (geo.y < geo.h * 2.4 && geo.y < 240 && style.fontSize >= 26 && plain.length < 140) return 'title'
  return 'body'
}

function mapShape(el: Shape, ctx: Ctx): AnyElement {
  const geo = geoOf(el, ctx)
  const mapped: ShapeId | undefined = el.shapType ? (FROM_PPTX_SHAPE[el.shapType] as ShapeId | undefined) : undefined
  const stroke = strokeOf(el, ctx)
  const fill = el.strokeOnly ? ({ type: 'none' } as const) : paintOf(el.fill, ctx)
  const text = el.content && /<[a-z]/i.test(el.content) ? stripTagsToText(el.content) : ''
  const shadow = shadowOf(el.shadow as never)

  if (!mapped) {
    // Unknown preset geometry: preserve the exact outline as an editable SVG element.
    if (el.path) {
      const vb = el.pathViewBox ?? { x: 0, y: 0, width: Math.max(1, geo.w), height: Math.max(1, geo.h) }
      const markup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.x} ${vb.y} ${vb.width} ${vb.height}" preserveAspectRatio="none"><path d="${el.path}" fill="${fill.type === 'solid' ? fill.color : 'none'}" ${stroke ? `stroke="${stroke.color}" stroke-width="${stroke.width}"` : ''}/>${text ? `<text x="${vb.x + vb.width / 2}" y="${vb.y + vb.height / 2}" text-anchor="middle" dominant-baseline="central" fill="${ctx.theme.palette.onPrimary}" font-size="${Math.round(vb.height / 3)}">${escapeHtml(text)}</text>` : ''}</svg>`
      return createSvg({ ...geo, markup, name: el.name || `شكل (${el.shapType})`, role: 'decoration' })
    }
    ctx.approximated.push(`شكل بتخصيص هندسي (${el.shapType}) في شريحة ${ctx.slideIndex + 1} حُوّل إلى مستطيل`)
  }

  const out = createShape(ctx.theme, {
    ...geo,
    shape: mapped ?? 'rect',
    fill,
    stroke,
    radius: el.shapType === 'roundRect' ? [12, 12, 12, 12] : [0, 0, 0, 0],
    text: text || undefined,
    name: el.name || 'شكل',
    role: 'decoration',
    rotation: normalizeAngle(el.rotate),
  })
  if (shadow) out.shadow = shadow
  if (text) {
    const style = styleFromHtml(el.content, ctx.theme)
    out.textStyle = { ...style, align: 'center', vAlign: 'center' } as TextStyle
  }
  if (el.headEnd?.type && el.headEnd.type !== 'none') {
    // A line-style autoshape (connector) with an arrow head — represent as a line element.
    if (el.shapType === 'line' || el.shapType === 'straightConnector1' || el.shapType === 'bentConnector3') {
      return createLineFromShape(el, ctx, geo)
    }
  }
  if (el.keypoints) out.adj = { ...el.keypoints }
  return out
}

function createLineFromShape(el: Shape, ctx: Ctx, geo: Geo): AnyElement {
  return createLine({
    ...geo,
    name: el.name || 'خط',
    role: 'decoration',
    stroke: strokeOf(el, ctx) ?? { color: ctx.theme.palette.text, width: 2, dash: 'solid' },
    startArrow: arrowOf(el.headEnd?.type),
    endArrow: arrowOf(el.tailEnd?.type),
    curvature: el.shapType === 'bentConnector3' ? 1 : 0,
  })
}

function arrowOf(type: string | undefined): 'none' | 'arrow' | 'triangle' | 'diamond' | 'oval' {
  switch (type) {
    case 'triangle':
      return 'triangle'
    case 'diamond':
      return 'diamond'
    case 'oval':
      return 'oval'
    case 'arrow':
    case 'stealth':
      return 'arrow'
    default:
      return 'none'
  }
}

/**
 * pptxtojson pads runs with literal spaces and writes `&nbsp;` for every space so HTML collapsing
 * cannot eat them. Inside our restricted tag set we can turn that back into clean text — which is
 * what makes an imported deck behave (word counts, selection, re-export) like a native one.
 */
function tidyTextHtml(html: string): string {
  return sanitizeHtml(
    String(html)
      .replace(/&nbsp;|&#160;/gi, ' ')
      .replace(/\u00A0/g, ' ')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/(<[a-z][^>]*>)\s+/gi, '$1')
      .replace(/\s+<\/[a-z]+>/gi, '</$1>')
      .replace(/<p>\s*<\/p>/gi, ''),
  )
}

function stripTagsToText(html: string): string {
  return String(html)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|li|div)>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 600)
}

function mapImage(el: Image, ctx: Ctx): AnyElement {
  const geo = geoOf(el, ctx)
  const src = ensureDataUrl(String(el.base64 ?? ''))
  if (!src) {
    ctx.approximated.push(`صورة في شريحة ${ctx.slideIndex + 1} لم تُرفق بالملف — تُرِكت`)
    return createShape(ctx.theme, { ...geo, shape: 'rect', fill: { type: 'solid', color: ctx.theme.palette.surface }, name: 'صورة مفقودة', role: 'image' })
  }
  const asset = createAsset({ name: el.ref ? String(el.ref).split('/').pop() ?? 'image' : `image-${Object.keys(ctx.assets).length + 1}`, mime: mimeFromData(src), kind: 'image', src })
  ctx.assets[asset.id] = asset
  const out = createImage({ ...geo, assetId: asset.id, fit: 'cover', role: 'image', name: 'صورة', stroke: strokeOf(el, ctx) ?? undefined, rotation: normalizeAngle(el.rotate) })
  const geom = String(el.geom ?? '')
  if (/roundRect/i.test(geom)) out.radius = [16, 16, 16, 16]
  else if (/ellipse|circle/i.test(geom)) out.radius = [Math.round(Math.min(geo.w, geo.h) / 2), Math.round(Math.min(geo.w, geo.h) / 2), Math.round(Math.min(geo.w, geo.h) / 2), Math.round(Math.min(geo.w, geo.h) / 2)]
  if (/triangle|diamond|pentagon|hexagon|heart|star|cloud/i.test(geom)) {
    const shape = (FROM_PPTX_SHAPE[geom] as ShapeId | undefined) ?? 'rect'
    if (shape !== 'rect') out.mask = { shape: shape === 'ellipse' || shape === 'circle' ? 'circle' : (shape as never), inset: 0 }
  }
  if (el.filters) {
    const f = el.filters
    out.filters = {
      ...out.filters,
      brightness: scalePct(f.brightness, 100),
      contrast: scalePct(f.contrast, 100),
      saturation: scalePct(f.saturation, 100),
    }
  }
  if (el.rect && (el.rect.t || el.rect.b || el.rect.l || el.rect.r)) {
    const l = Number(el.rect.l) || 0
    const r = Number(el.rect.r) || 0
    const t = Number(el.rect.t) || 0
    const b = Number(el.rect.b) || 0
    out.crop = { x: clamp(0, 0.95, l), y: clamp(0, 0.95, t), w: clamp(0.05, 1, 1 - l - r), h: clamp(0.05, 1, 1 - t - b) }
  }
  if (el.link) out.link = el.link
  return out
}

function scalePct(v: number | undefined, fallback: number): number {
  if (v === undefined || !Number.isFinite(v)) return fallback
  return Math.round(v <= 4 ? v * 100 : v)
}

function mapTable(el: Table, ctx: Ctx): AnyElement[] {
  const geo = geoOf(el, ctx)
  const raw = el.data ?? []
  if (!raw.length) return []
  const cols = Math.max(1, ...raw.map((row) => row.length))
  const cells: TableCell[][] = raw.map((row) =>
    Array.from({ length: cols }, (_, c) => {
      const src = row[c] as Table['data'][number][number] | undefined
      return {
        text: stripTagsToText(String(src?.text ?? '')),
        bold: src?.fontBold,
        color: src?.fontColor ? toHex(src.fontColor as string, ctx.theme.palette.text) : undefined,
        fill: src?.fillColor ? toHex(src.fillColor as string, '#ffffff') : undefined,
        align: 'start',
        colSpan: src?.colSpan,
        rowSpan: src?.rowSpan,
      }
    }),
  ),
    hasHeaderFill = raw[0]?.some((c) => !!c?.fillColor) ?? false
  const table = createTable({ ...geo, theme: ctx.theme, rows: cells.length, cols })
  table.cells = cells
  table.header = hasHeaderFill
  const rh = el.rowHeights?.length ? el.rowHeights : cells.map(() => 1)
  const cw = el.colWidths?.length ? el.colWidths : Array.from({ length: cols }, () => 1)
  const sumR = rh.reduce((a, b) => a + (Number(b) || 0), 0) || 1
  const sumC = cw.reduce((a, b) => a + (Number(b) || 0), 0) || 1
  table.rowHeights = rh.map((h) => clamp(0.02, 1, (Number(h) || 0) / sumR))
  table.colWidths = cw.map((w) => clamp(0.02, 1, (Number(w) || 0) / sumC))
  const border = strokeOf(el as never, ctx)
  if (border) table.border = border
  table.name = 'جدول'
  return [table]
}

function mapChart(el: Chart, ctx: Ctx): AnyElement[] {
  const geo = geoOf(el, ctx)
  const kindMap: Record<string, ChartKind> = {
    barChart: 'bar',
    bar3DChart: 'bar',
    lineChart: 'line',
    line3DChart: 'line',
    areaChart: 'area',
    area3DChart: 'area',
    pieChart: 'pie',
    pie3DChart: 'pie',
    doughnutChart: 'donut',
    radarChart: 'radar',
    stockChart: 'line',
    surfaceChart: 'area',
    surface3DChart: 'area',
  }
  const scatter = el.chartType === 'scatterChart' || el.chartType === 'bubbleChart'
  let categories: string[] = []
  let series: { name: string; values: number[] }[] = []

  if (scatter) {
    const points = (el.data ?? []) as unknown as number[][]
    categories = points.map((p) => String(p[0]))
    series = [{ name: 'قيم', values: points.map((p) => Number(p[1]) || 0) }]
  } else {
    const items = (el.data ?? []) as unknown as { key?: string; values?: { x: string; y: number }[]; xlabels?: Record<string, string> }[]
    const first = items[0]
    const labels = first?.xlabels ? Object.entries(first.xlabels).map(([, v]) => String(v)) : []
    categories = (labels.length ? labels : (first?.values ?? []).map((v) => String(v.x))).slice(0, 30)
    series = items
      .map((it, i) => ({
        name: String(it.key ?? `سلسلة ${i + 1}`),
        values: (it.values ?? []).slice(0, 30).map((v) => Number(v.y) || 0),
      }))
      .filter((s) => s.values.length)
  }
  if (!categories.length || !series.length) {
    ctx.approximated.push(`مخطط (${el.chartType}) بلا بيانات قابلة للتحويل في شريحة ${ctx.slideIndex + 1} — استُبدل بشكل`)
    return [createShape(ctx.theme, { ...geo, shape: 'rect', fill: { type: 'solid', color: ctx.theme.palette.surface }, name: 'مخطط (بيانات غير مدعومة)', role: 'decoration' })]
  }
  const chart = createChart({ ...geo, theme: ctx.theme })
  const base = kindMap[el.chartType] ?? 'bar'
  chart.chart = base === 'bar' && (el as { barDir?: string }).barDir === 'bar' ? 'barH' : base
  chart.categories = categories
  chart.series = series
  chart.legend = series.length > 1 || base === 'pie' || base === 'donut'
  const colors = (el.colors ?? []).filter(Boolean).map((c) => toHex(c, ctx.theme.palette.secondary))
  if (colors.length) chart.colors = colors
  chart.name = 'مخطط'
  ctx.approximated.push(`مخطط (${el.chartType}) أُعيد بناؤه كبيانات قابلة للتحرير — راجع تنسيقه`)
  return [chart]
}

/* ------------------------------------------------------------------ text style extraction */

function styleFromHtml(html: string, theme: Theme): TextStyle {
  const text = String(html ?? '')
  const pick = (prop: string, target = '[^;"\'}]+') => {
    const m = new RegExp(`${prop}\\s*:\\s*(${target})`, 'i').exec(text)
    return m ? m[1].trim() : undefined
  }
  const arabic = /[؀-ۿ]/.test(text)
  const alignRaw = pick('text-align')
  const sizeRaw = pick('font-size')
  const colorRaw = pick('color')
  const lh = pick('line-height')
  const ls = pick('letter-spacing')
  const familyRaw = pick('font-family', '[^;"\'}]+')
  const sizePx = sizeRaw ? parseFloat(sizeRaw) : NaN
  const sizePt = /pt\b/i.test(sizeRaw ?? '') ? (Number.isFinite(sizePx) ? sizePx / PT_PER_PX : NaN) : NaN
  const list = /<(ul|ol)[^>]*>/i.test(text)
  const out: Partial<TextStyle> = {
    fontFamily: familyRaw ? fontIdFor(familyRaw.split(',')[0].replace(/["']/g, '').trim()) : arabic ? theme.fonts.body : theme.fonts.body,
    fontSize: Math.round(Number.isFinite(sizePt) ? sizePt : Number.isFinite(sizePx) ? sizePx : 22),
    color: colorRaw ? toHex(colorRaw, theme.palette.text) : theme.palette.text,
    lineHeight: lh && Number.isFinite(Number.parseFloat(lh)) ? clamp(0.8, 4, Number.parseFloat(lh)) : 1.4,
    letterSpacing: ls ? Math.round(parseFloat(ls) * 100) / 100 : 0,
    bold: /font-weight\s*:\s*(bold|[6-9]00)/i.test(text),
    italic: /font-style\s*:\s*italic/i.test(text),
    underline: /text-decoration[^;}"']*\bunderline\b/i.test(text),
    strike: /text-decoration[^;}"']*\bline-through\b/i.test(text),
    dir: arabic ? 'rtl' : 'ltr',
    wrap: true,
  }
  if (alignRaw === 'center') out.align = 'center'
  else if (alignRaw === 'right') out.align = arabic ? 'start' : 'end'
  else if (alignRaw === 'left') out.align = arabic ? 'end' : 'start'
  else if (alignRaw === 'justify') out.align = 'justify'
  if (list) out.transform = 'none'
  return { ...textStyleDefaults(theme), ...out }
}

function textStyleDefaults(theme: Theme): TextStyle {
  return {
    fontFamily: theme.fonts.body,
    fontSize: 22,
    color: theme.palette.text,
    align: 'start',
    vAlign: 'start',
    lineHeight: 1.4,
    letterSpacing: 0,
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    dir: 'ltr',
    wrap: true,
  }
}

export { sanitizeHtml }

/**
 * Application-level import: parse → create a project → open it in the editor, with a report of
 * anything that could not be represented faithfully. Used by the dashboard and canvas drop.
 */
export async function importPptxFile(
  file: File,
  onProgress?: (label: string, done: number, total: number) => void,
): Promise<ImportResult> {
  const { requestOpenProject } = await import('./openDeck')
  const { toast } = await import('../store/useUI')
  try {
    const result = await importPptx(file, onProgress)
    requestOpenProject({ doc: result.doc })
    const notes = result.report.approximated
    toast({
      kind: notes.length ? ('info' as const) : ('success' as const),
      title: `تم استيراد ${result.report.slides} شريحة`,
      body: notes.length
        ? `${notes.length} عنصر حُوّل أو تُرِك: ${notes.slice(0, 2).join('؛ ')}`
        : `${result.report.elements} عنصر قابل للتحرير بالكامل.`,
    })
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    toast({
      kind: 'error',
      title: 'تعذّر استيراد الملف',
      body: /zip|central directory/i.test(message) ? 'الملف ليس عرض PowerPoint صالحًا (.pptx).' : message,
    })
    throw error
  }
}
