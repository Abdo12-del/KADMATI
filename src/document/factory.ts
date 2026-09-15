import { customAlphabet, nanoid } from 'nanoid'
import { contrastRatio, readableOn } from '../lib/colors'
import {
  CANVAS_H,
  CANVAS_W,
  DOC_VERSION,
  defaultFilters,
  defaultTextStyle,
  defaultTransition,
  type AnyElement,
  type AssetRef,
  type ElementBase,
  type ElementKind,
  type Background,
  type ChartElement,
  type ChartKind,
  type ElementRole,
  type FrameElement,
  type IconElement,
  type ImageElement,
  type LineElement,
  type Paint,
  type Presentation,
  type PresentationSettings,
  type Radii,
  type ShapeElement,
  type ShapeId,
  type Slide,
  type Stroke,
  type SvgElement,
  type TableCell,
  type TableElement,
  type TextElement,
  type TextStyle,
  type Theme,
  type ThemePalette,
  type VideoElement,
} from './types'
import { containsArabic } from '../lib/fonts'

const uid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10)

import { migrateSlideAnimations } from '../animation/migrate'

export function newId(prefix = 'e'): string {
  return `${prefix}_${uid()}${nanoid(4).slice(0, 4)}`
}

/* ------------------------------------------------------------------ themes */

export interface ThemePreset {
  id: string
  name: string
  theme: Theme
}

const BASE_PALETTE: ThemePalette = {
  primary: '#16324F',
  secondary: '#3E7CB1',
  accent: '#E8734A',
  background: '#FFFFFF',
  surface: '#F4F6F8',
  text: '#101820',
  textMuted: '#5A6672',
  onPrimary: '#FFFFFF',
  success: '#1F9D6B',
  warning: '#D68910',
}

export function theme(
  id: string,
  name: string,
  palette: Partial<Theme['palette']>,
  fonts: Partial<Theme['fonts']> = {},
  extra: Partial<Theme> = {},
): Theme {
  const base: Theme = {
    id,
    name,
    palette: { ...BASE_PALETTE, ...(palette as Partial<ThemePalette>) } as Theme['palette'],
    fonts: { heading: 'tajawal', body: 'tajawal', mono: 'jetbrains' },
    radius: 14,
    spacing: 72,
    headingWeight: 700,
    headingTransform: 'none',
    style: 'flat',
  }
  return { ...base, fonts: { ...base.fonts, ...fonts }, style: extra.style ?? base.style, palette: guardPalette(base.palette) }
}

/**
 * A palette that fails its own contrast is a rendering bug waiting to happen — and themes arrive
 * from presets, brand kits and PPTX imports alike. So every theme passes through here: if the
 * declared foreground for a fill would be invisible on it, we recompute a readable one.
 */
export function guardPalette(p: ThemePalette): ThemePalette {
  const next = { ...p }
  if (contrastRatio(next.primary, next.onPrimary) < 3.2) next.onPrimary = readableOn(next.primary, '#0B0F19', '#FFFFFF')
  if (contrastRatio(next.background, next.text) < 3.2) next.text = readableOn(next.background, '#111114', '#F2F4F8')
  // A surface indistinguishable from the page makes cards vanish; keep it if it separates, else flip.
  if (contrastRatio(next.surface, next.background) < 1.08) next.surface = mixHex(next.background, next.text, 0.08)
  return next
}

function mixHex(a: string, b: string, amount: number): string {
  const parse = (h: string) => {
    const v = h.replace('#', '')
    const full = v.length === 3 ? v.split('').map((c) => c + c).join('') : v.slice(0, 6)
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) || 0)
  }
  const [r1, g1, b1] = parse(a)
  const [r2, g2, b2] = parse(b)
  const ch = (x: number) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')
  return `#${ch(r1 + (r2 - r1) * amount)}${ch(g1 + (g2 - g1) * amount)}${ch(b1 + (b2 - b1) * amount)}`
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'corporate-ink', name: 'شركة · حبر', theme: theme('corporate-ink', 'شركة · حبر', { primary: '#16324F', secondary: '#3E7CB1', accent: '#E8734A', surface: '#F4F6F8' }) },
  { id: 'midnight-signal', name: 'ليل · إشارة', theme: theme('midnight-signal', 'ليل · إشارة', { primary: '#243B7A', secondary: '#4C6FFF', accent: '#FF5A36', background: '#0B1020', surface: '#151B2E', text: '#F2F4F8', textMuted: '#9AA5BF', onPrimary: '#FFFFFF' }, { heading: 'noto-kufi' }, { style: 'bold' }) },
  { id: 'sand-editorial', name: 'رملي · تحرير', theme: theme('sand-editorial', 'رملي · تحرير', { primary: '#3D2E23', secondary: '#A9714B', accent: '#B4552F', background: '#FBF7F0', surface: '#F1E7D8' }, { heading: 'playfair', body: 'amiri' }, { style: 'editorial', radius: 4 }) },
  { id: 'edu-teal', name: 'تعليم · فيروزي', theme: theme('edu-teal', 'تعليم · فيروزي', { primary: '#0F5C57', secondary: '#38A3A5', accent: '#F2B138', surface: '#EFF7F5' }, { heading: 'readex' }, { style: 'soft' }) },
  { id: 'startup-violet', name: 'ستارت أب · بنفسج', theme: theme('startup-violet', 'ستارت أب · بنفسج', { primary: '#1B1035', secondary: '#7C5CFC', accent: '#22D3A6', background: '#FFFFFF', surface: '#F5F3FF', text: '#17122B', textMuted: '#6B6488', onPrimary: '#FFFFFF' }, { heading: 'grotesk' }, { style: 'glass' }) },
  { id: 'mono-minimal', name: 'مينيمال · أحادي', theme: theme('mono-minimal', 'مينيمال · أحادي', { primary: '#111114', secondary: '#6B6B76', accent: '#111114', background: '#FFFFFF', surface: '#F5F5F5', text: '#111114', textMuted: '#7A7A85', onPrimary: '#FFFFFF' }, { heading: 'inter' }, { style: 'minimal', radius: 0, spacing: 96 }) },
  { id: 'academic-serif', name: 'أكاديمي · serif', theme: theme('academic-serif', 'أكاديمي · serif', { primary: '#1C2B4A', secondary: '#5C7CA6', accent: '#8C1D18', background: '#FFFFFF', surface: '#F3F4F7' }, { heading: 'lora', body: 'lora' }, { style: 'editorial', radius: 2 }) },
  { id: 'marketing-pop', name: 'تسويق · نبضة', theme: theme('marketing-pop', 'تسويق · نبضة', { primary: '#12002B', secondary: '#FF2E63', accent: '#08D9D6', background: '#FFFFFF', text: '#1A1030', textMuted: '#6E6386', surface: '#FFF0F4', onPrimary: '#FFFFFF' }, { heading: 'cairo' }, { style: 'bold', radius: 24 }) },
]

export const MINIMAL_THEME = THEME_PRESETS[5].theme

/* ------------------------------------------------------------------ document */

export function defaultSettings(): PresentationSettings {
  return {
    gridVisible: false,
    gridSize: 20,
    snapToGrid: false,
    smartGuides: true,
    margins: { top: 72, right: 96, bottom: 72, left: 96 },
    showThumbnails: true,
    autoTextFit: true,
  }
}

export function createPresentation(input: Partial<Presentation> & { title?: string } = {}): Presentation {
  const now = Date.now()
  const title = input.title ?? 'عرض بدون عنوان'
  const dir = input.metadata?.dir ?? (containsArabic(title) ? 'rtl' : 'ltr')
  const themePreset = input.theme ?? THEME_PRESETS[0].theme
  const slides = input.slides?.length ? input.slides : [createBlankSlide(themePreset)]
  return {
    id: input.id ?? newId('p'),
    version: DOC_VERSION,
    metadata: {
      title,
      subject: input.metadata?.subject,
      author: input.metadata?.author ?? 'كدماتي ستوديو',
      company: input.metadata?.company,
      createdAt: input.metadata?.createdAt ?? now,
      updatedAt: now,
      tags: input.metadata?.tags ?? [],
      dir,
      lang: input.metadata?.lang ?? (dir === 'rtl' ? 'ar' : 'en'),
      folderId: input.metadata?.folderId,
      favorite: input.metadata?.favorite ?? false,
      trashedAt: null,
    },
    size: input.size ?? { w: CANVAS_W, h: CANVAS_H },
    theme: themePreset,
    brandKitId: input.brandKitId,
    slides,
    settings: { ...defaultSettings(), ...(input.settings ?? {}) },
    assets: input.assets ?? {},
    raw: input.raw,
  }
}

/** A blank document with one empty slide — the "New presentation" starting point. */
export function createEmptyDoc(input: Partial<Presentation> = {}): Presentation {
  return createPresentation(input)
}

export function createBlankSlide(t: Theme = MINIMAL_THEME, background?: Background): Slide {
  return {
    id: newId('s'),
    layoutId: 'blank',
    background:
      background ??
      ({
        type: 'solid',
        color: t.palette.background,
      } as Background),
    elements: [],
    notes: '',
    transition: defaultTransition(),
    hidden: false,
  }
}

export function createSlide(partial: Partial<Slide> = {}): Slide {
  return { ...createBlankSlide(), ...partial, id: partial.id ?? newId('s') }
}

/* ------------------------------------------------------------------ elements */

interface BaseOpts {
  x?: number
  y?: number
  w?: number
  h?: number
  rotation?: number
  role?: ElementRole
  name?: string
  opacity?: number
  gid?: string
  frameId?: string
  link?: string
}

function base(kind: ElementKind, opts: BaseOpts = {}): ElementBase {
  return {
    id: newId(kind),
    kind,
    name: opts.name ?? kind,
    role: opts.role,
    x: opts.x ?? 0,
    y: opts.y ?? 0,
    w: opts.w ?? 320,
    h: opts.h ?? 120,
    rotation: opts.rotation ?? 0,
    opacity: opts.opacity ?? 1,
    gid: opts.gid,
    frameId: opts.frameId,
    link: opts.link,
    visible: true,
    locked: false,
  }
}

export function textStyleFrom(theme: Theme, role: ElementRole | undefined, over: Partial<TextStyle> = {}): TextStyle {
  const baseStyle = defaultTextStyle()
  const heading = role === 'title' || role === 'kicker' || role === 'quote' || role === 'stat'
  return {
    ...baseStyle,
    fontFamily: heading ? theme.fonts.heading : theme.fonts.body,
    color: theme.palette.text,
    ...over,
  }
}

export interface TextOpts extends BaseOpts {
  text?: string
  html?: string
  style?: Partial<TextStyle>
}

export function createText(theme: Theme, opts: TextOpts = {}): TextElement {
  const role = opts.role ?? 'body'
  const presets: Record<string, Partial<TextStyle>> = {
    title: { fontSize: 62, bold: true, lineHeight: 1.16, align: 'start', vAlign: 'center' },
    kicker: { fontSize: 20, bold: true, letterSpacing: 1.6, color: theme.palette.accent, lineHeight: 1.2 },
    subtitle: { fontSize: 30, color: theme.palette.textMuted, lineHeight: 1.4 },
    body: { fontSize: 24, lineHeight: 1.6, color: theme.palette.text },
    quote: { fontSize: 42, italic: true, lineHeight: 1.32 },
    stat: { fontSize: 76, bold: true, lineHeight: 1 },
    footer: { fontSize: 15, color: theme.palette.textMuted, letterSpacing: 0.4 },
    list: { fontSize: 24, lineHeight: 1.6 },
  }
  const style = textStyleFrom(theme, role, { ...presets[role], ...opts.style })
  const plain = opts.text ?? ''
  return {
    ...base('text', { w: 640, h: role === 'title' ? 120 : 90, ...opts, role }),
    kind: 'text',
    content: opts.html ?? plainToParagraph(plain, style),
    font: style,
  }
}

function plainToParagraph(text: string, style: TextStyle): string {
  if (!text) return ''
  const dir = style.dir === 'rtl' || containsArabic(text) ? 'rtl' : 'ltr'
  return text
    .split(/\n/)
    .map((line) => `<p style="direction:${dir}">${line.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</p>`)
    .join('')
}

export interface ShapeOpts extends BaseOpts {
  shape?: ShapeId
  fill?: Paint
  stroke?: Stroke | null
  radius?: Radii
  text?: string
  textStyle?: Partial<TextStyle>
  adj?: Record<string, number>
}

export function createShape(theme: Theme, opts: ShapeOpts = {}): ShapeElement {
  const shape = opts.shape ?? 'roundRect'
  const el = base('shape', { w: 280, h: 180, ...opts, role: opts.role ?? 'decoration' })
  return {
    ...el,
    kind: 'shape',
    shape,
    fill: opts.fill ?? { type: 'solid', color: theme.palette.surface },
    stroke: opts.stroke === null ? undefined : (opts.stroke ?? undefined),
    radius: opts.radius ?? ([theme.radius, theme.radius, theme.radius, theme.radius] as Radii),
    text: opts.text,
    textStyle: opts.text ? textStyleFrom(theme, opts.role, { align: 'center', vAlign: 'center', fontSize: 22, ...opts.textStyle }) : undefined,
    adj: opts.adj,
  }
}

export interface ImageOpts extends BaseOpts {
  assetId: string
  fit?: ImageElement['fit']
  radius?: Radii
  mask?: ImageElement['mask']
  stroke?: Stroke
}

export function createImage(opts: ImageOpts): ImageElement {
  return {
    ...base('image', { w: 480, h: 320, ...opts, role: opts.role ?? 'image' }),
    kind: 'image',
    assetId: opts.assetId,
    fit: opts.fit ?? 'cover',
    radius: opts.radius ?? [0, 0, 0, 0],
    mask: opts.mask,
    stroke: opts.stroke,
    filters: defaultFilters(),
  }
}

export function createIcon(opts: BaseOpts & { icon: string; color?: string; background?: Paint; radius?: Radii; strokeWidth?: number }): IconElement {
  return {
    ...base('icon', { w: 72, h: 72, ...opts, role: opts.role ?? 'decoration' }),
    kind: 'icon',
    icon: opts.icon,
    color: opts.color ?? '#111114',
    strokeWidth: 1.75,
    background: opts.background,
    radius: opts.radius,
  }
}

export function createSvg(opts: BaseOpts & { markup: string }): SvgElement {
  return { ...base('svg', { w: 240, h: 240, ...opts, role: 'decoration' }), kind: 'svg', markup: opts.markup }
}

export function createLine(opts: BaseOpts & { stroke?: Stroke; startArrow?: LineElement['startArrow']; endArrow?: LineElement['endArrow']; curvature?: number }): LineElement {
  return {
    ...base('line', { w: 420, h: 2, ...opts, role: 'decoration' }),
    kind: 'line',
    stroke: opts.stroke ?? { color: '#111114', width: 2, dash: 'solid', cap: 'round' },
    startArrow: opts.startArrow ?? 'none',
    endArrow: opts.endArrow ?? 'none',
    curvature: opts.curvature ?? 0,
  }
}

export function createTable(opts: BaseOpts & Partial<Pick<TableElement, 'header' | 'cells' | 'colWidths' | 'rowHeights' | 'striped' | 'border'>> & { theme?: Theme; rows?: number; cols?: number } = {}): TableElement {
  const rows = opts.rows ?? 4
  const cols = opts.cols ?? 4
  const t = opts.theme ?? MINIMAL_THEME
  const cells: TableCell[][] = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (__, c) => ({
      text: r === 0 ? `رأس ${c + 1}` : r === 1 && c === 0 ? '—' : '',
      bold: r === 0,
      color: r === 0 ? t.palette.onPrimary : undefined,
      fill: r === 0 ? t.palette.primary : undefined,
      align: 'start',
    })),
  )
  return {
    ...base('table', { w: 880, h: 260, ...opts, role: opts.role ?? 'body' }),
    kind: 'table',
    header: opts.header ?? true,
    footer: false,
    striped: opts.striped ?? true,
    cells,
    colWidths: opts.colWidths ?? Array.from({ length: cols }, () => 1 / cols),
    rowHeights: opts.rowHeights ?? Array.from({ length: rows }, () => 1 / rows),
    border: opts.border ?? { color: '#E2E5EA', width: 1, dash: 'solid' },
    cellPadding: 12,
    font: textStyleFrom(t, 'body', { fontSize: 18, lineHeight: 1.4, vAlign: 'center' }),
  }
}

export function createChart(opts: BaseOpts & { chart?: ChartKind; categories?: string[]; series?: ChartElement['series']; colors?: string[]; theme?: Theme } = {}): ChartElement {
  const t = opts.theme ?? MINIMAL_THEME
  return {
    ...base('chart', { w: 620, h: 360, ...opts, role: 'body' }),
    kind: 'chart',
    chart: opts.chart ?? 'bar',
    categories: opts.categories ?? ['الربع الأول', 'الربع الثاني', 'الربع الثالث', 'الربع الرابع'],
    series: opts.series ?? [{ name: 'الإيراد', values: [32, 48, 41, 66] }],
    colors: opts.colors ?? [t.palette.secondary, t.palette.accent, t.palette.primary, t.palette.success],
    legend: (opts.series?.length ?? 1) > 1,
    axis: true,
    values: false,
    gridFill: undefined,
  }
}

export function createVideo(opts: BaseOpts & { src: string; posterAssetId?: string }): VideoElement {
  return {
    ...base('video', { w: 640, h: 360, ...opts, role: 'image' }),
    kind: 'video',
    src: opts.src,
    posterAssetId: opts.posterAssetId,
    autoplay: false,
    muted: true,
    loop: false,
    radius: [12, 12, 12, 12],
  }
}

export function createFrame(opts: BaseOpts & { background?: Paint; radius?: Radii; stroke?: Stroke }): FrameElement {
  return {
    ...base('frame', { w: 520, h: 320, ...opts, role: 'decoration' }),
    kind: 'frame',
    background: opts.background ?? { type: 'solid', color: '#F4F6F8' },
    radius: opts.radius ?? [16, 16, 16, 16],
    stroke: opts.stroke,
  }
}

export function createAsset(input: Partial<AssetRef> & { src: string; name: string }): AssetRef {
  return {
    id: input.id ?? newId('a'),
    name: input.name,
    mime: input.mime ?? 'image/png',
    kind: input.kind ?? 'image',
    src: input.src,
    w: input.w,
    h: input.h,
    bytes: input.bytes,
    createdAt: Date.now(),
  }
}

/* ------------------------------------------------------------------ mutations */

export function cloneElement(el: AnyElement, offset = { x: 0, y: 0 }, keepId = false): AnyElement {
  const copy = structuredClone(el)
  copy.id = keepId ? el.id : newId(el.kind)
  copy.x += offset.x
  copy.y += offset.y
  if (!keepId) copy.gid = undefined
  return copy
}

export function moveElement(el: AnyElement, dx: number, dy: number): AnyElement {
  return { ...el, x: el.x + dx, y: el.y + dy }
}

export function normalizeElement(el: AnyElement): AnyElement {
  const out = { ...el }
  out.x = round(out.x, 1)
  out.y = round(out.y, 1)
  out.w = Math.max(2, round(out.w, 1))
  out.h = Math.max(2, round(out.h, 1))
  out.rotation = round(out.rotation ?? 0, 1)
  out.opacity = out.opacity ?? 1
  out.visible = out.visible !== false
  out.locked = out.locked === true
  return out as AnyElement
}

function round(v: number, d = 0): number {
  const f = 10 ** d
  return Math.round(v * f) / f
}

/**
 * Defensive pass over a loaded document: fill in anything a template/AI/importer missed and
 * drop structurally broken elements instead of crashing the editor.
 */
export function normalizePresentation(doc: Presentation): Presentation {
  const source = doc.theme ?? MINIMAL_THEME
  // Saved decks predating guardPalette may hold an invisible palette — heal it on load.
  const theme: Theme = { ...source, palette: guardPalette(source.palette) }
  const slides: Slide[] = (doc.slides ?? []).map((slide) => {
    const s: Slide = {
      ...createBlankSlide(theme),
      ...slide,
      id: slide.id || newId('s'),
      background: slide.background ?? { type: 'solid', color: theme.palette.background },
      transition: { ...defaultTransition(), ...(slide.transition ?? {}) },
      elements: (slide.elements ?? []).filter((e) => e && typeof e === 'object' && 'id' in e && 'kind' in e).map(normalizeElement),
    }
    // legacy element.animation (CSS entrance specs) → data-driven slide.animations
    migrateSlideAnimations(s)
    return s
  })
  if (!slides.length) slides.push(createBlankSlide(theme))
  return {
    ...doc,
    version: DOC_VERSION,
    size: doc.size?.w ? doc.size : { w: CANVAS_W, h: CANVAS_H },
    settings: { ...defaultSettings(), ...(doc.settings ?? {}) },
    metadata: { ...createPresentation().metadata, ...doc.metadata },
    theme,
    assets: doc.assets ?? {},
    slides,
  }
}

export function slidePlainText(slide: Slide): string {
  return slide.elements
    .map((e) => {
      if (e.kind === 'text') return e.content.replace(/<[^>]+>/g, ' ')
      if (e.kind === 'shape' && e.text) return e.text
      if (e.kind === 'table') return e.cells.flat().map((c) => c.text).join(' ')
      return ''
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function presentationWordCount(doc: Presentation): number {
  return doc.slides.reduce((acc, s) => acc + slidePlainText(s).split(/\s+/).filter(Boolean).length, 0)
}

export function presentationDuration(doc: Presentation): number {
  return doc.slides.reduce((acc, s) => acc + (slidePlainText(s).split(/\s+/).filter(Boolean).length / 130 + 0.35), 0)
}
