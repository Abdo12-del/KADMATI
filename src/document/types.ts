/**
 * KADMATI Studio — document model.
 *
 * The whole product is a serializer around this shape: a `Presentation` is a plain JSON
 * document (metadata + theme + slides[] + settings) and every slide owns a flat,
 * z-ordered list of independent elements. Coordinates live in a fixed 1280×720 logical
 * space ("design units") so import/export, zoom and export scaling are trivial math.
 *
 * Nothing here knows about React or the DOM.
 */

export const CANVAS_W = 1280
export const CANVAS_H = 720
export const DOC_VERSION = 1

export type Dir = 'rtl' | 'ltr'

/* ------------------------------------------------------------------ paints */

export type Paint =
  | { type: 'none' }
  | { type: 'solid'; color: string }
  | { type: 'gradient'; kind: 'linear' | 'radial'; angle: number; stops: GradientStop[] }
  | { type: 'pattern'; color: string; background: string; pattern: PatternId }

export interface GradientStop {
  pos: number
  color: string
}

export type PatternId = 'diagonal' | 'dots' | 'grid' | 'cross'

export interface Stroke {
  color: string
  width: number
  dash?: 'solid' | 'dashed' | 'dotted'
  cap?: 'butt' | 'round' | 'square'
}

export interface Shadow {
  x: number
  y: number
  blur: number
  spread: number
  color: string
}

export type Radii = [number, number, number, number]

export interface Background {
  type: 'none' | 'solid' | 'gradient' | 'image' | 'pattern'
  color?: string
  gradient?: { angle: number; stops: GradientStop[]; kind: 'linear' | 'radial' }
  image?: { assetId: string; fit: 'cover' | 'contain' | 'fill'; position?: string; overlay?: Paint }
  pattern?: PatternId
  patternColor?: string
}

/* ------------------------------------------------------------------ types */

export type ElementKind =
  | 'text'
  | 'image'
  | 'shape'
  | 'line'
  | 'icon'
  | 'svg'
  | 'table'
  | 'chart'
  | 'video'
  | 'frame'

/** Roles let us re-layout a slide without destroying the content. */
export type ElementRole =
  | 'title'
  | 'subtitle'
  | 'body'
  | 'kicker'
  | 'quote'
  | 'stat'
  | 'image'
  | 'decoration'
  | 'footer'
  | 'list'

import type { AnimSpec } from '../animation/types'

export type TextAlign = 'start' | 'center' | 'end' | 'justify'
export type VAlign = 'start' | 'center' | 'end'

export interface AnimationSpec {
  enter: 'none' | 'fade' | 'appear' | 'slide' | 'zoom' | 'scale'
  duration: number
  delay: number
  direction?: 'left' | 'right' | 'top' | 'bottom'
}

export interface TransitionSpec {
  type: 'none' | 'fade' | 'slide' | 'push' | 'zoom' | 'morph'
  duration: number
  direction?: 'left' | 'right' | 'up' | 'down'
}

export interface ElementBase {
  id: string
  kind: ElementKind
  name: string
  role?: ElementRole
  x: number
  y: number
  w: number
  h: number
  rotation: number
  opacity: number
  visible: boolean
  locked: boolean
  /** Logical grouping id — elements sharing a `gid` select/move together. */
  gid?: string
  /** Parent frame id — frames clip and translate their children. */
  frameId?: string
  link?: string
  animation?: AnimationSpec
  shadow?: Shadow
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'difference'
}

export interface TextElement extends ElementBase {
  kind: 'text'
  /** Restricted HTML: p, br, span(style), b/i/u/s/a, ul/ol/li */
  content: string
  font: TextStyle
}

export interface TextStyle {
  fontFamily: string
  fontSize: number
  color: string
  align: TextAlign
  vAlign: VAlign
  lineHeight: number
  letterSpacing: number
  bold: boolean
  italic: boolean
  underline: boolean
  strike: boolean
  highlight?: string
  transform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  dir: Dir
  wrap: boolean
  autoFit?: 'none' | 'shrink'
  /** Paragraph spacing in em, applied between <p> blocks. */
  paraSpacing?: number
}

export interface ImageElement extends ElementBase {
  kind: 'image'
  assetId: string
  fit: 'cover' | 'contain' | 'fill'
  radius: Radii
  stroke?: Stroke
  filters: ImageFilters
  mask?: MaskSpec
  crop?: { x: number; y: number; w: number; h: number }
}

export interface ImageFilters {
  brightness: number
  contrast: number
  saturation: number
  grayscale: number
  blur: number
  sepia: number
  hueRotate: number
}

export interface MaskSpec {
  shape: 'rectangle' | 'circle' | 'ellipse' | 'triangle' | 'pentagon' | 'hexagon' | 'diamond' | 'blob' | 'star'
  inset: number
}

export interface ShapeElement extends ElementBase {
  kind: 'shape'
  shape: ShapeId
  fill: Paint
  stroke?: Stroke
  radius?: Radii
  /** Adjust values for preset-dependent geometry (e.g. star points, arrow shaft). */
  adj?: Record<string, number>
  text?: string
  textStyle?: TextStyle
}

export type ShapeId =
  | 'rect'
  | 'roundRect'
  | 'ellipse'
  | 'circle'
  | 'triangle'
  | 'rightTriangle'
  | 'diamond'
  | 'pentagon'
  | 'hexagon'
  | 'octagon'
  | 'star'
  | 'parallelogram'
  | 'trapezoid'
  | 'arrowRight'
  | 'arrowLeft'
  | 'arrowUp'
  | 'arrowDown'
  | 'chevron'
  | 'pill'
  | 'plate'
  | 'cloud'
  | 'heart'
  | 'speech'
  | 'donut'
  | 'semiEllipse'
  | 'cross'
  | 'lightning'
  | 'sun'
  | 'moon'
  | 'blob'

export interface LineElement extends ElementBase {
  kind: 'line'
  stroke: Stroke
  startArrow?: 'none' | 'arrow' | 'triangle' | 'diamond' | 'oval'
  endArrow?: 'none' | 'arrow' | 'triangle' | 'diamond' | 'oval'
  curvature: number
}

export interface IconElement extends ElementBase {
  kind: 'icon'
  icon: string
  color: string
  strokeWidth: number
  background?: Paint
  radius?: Radii
}

export interface SvgElement extends ElementBase {
  kind: 'svg'
  markup: string
  color?: string
}

export interface TableCell {
  text: string
  bold?: boolean
  color?: string
  fill?: string
  align?: TextAlign
  colSpan?: number
  rowSpan?: number
}

export interface TableElement extends ElementBase {
  kind: 'table'
  header: boolean
  footer: boolean
  striped: boolean
  cells: TableCell[][]
  colWidths: number[]
  rowHeights: number[]
  border: Stroke
  cellPadding: number
  font: TextStyle
}

export type ChartKind = 'bar' | 'barH' | 'line' | 'area' | 'pie' | 'donut' | 'radar' | 'scatter'

export interface ChartElement extends ElementBase {
  kind: 'chart'
  chart: ChartKind
  categories: string[]
  series: { name: string; values: number[]; color?: string }[]
  colors: string[]
  legend: boolean
  axis: boolean
  values: boolean
  gridFill?: string
}

export interface VideoElement extends ElementBase {
  kind: 'video'
  src: string
  posterAssetId?: string
  autoplay: boolean
  muted: boolean
  loop: boolean
  radius: Radii
}

export interface FrameElement extends ElementBase {
  kind: 'frame'
  background: Paint
  stroke?: Stroke
  radius: Radii
}

export type AnyElement =
  | TextElement
  | ImageElement
  | ShapeElement
  | LineElement
  | IconElement
  | SvgElement
  | TableElement
  | ChartElement
  | VideoElement
  | FrameElement

/* ------------------------------------------------------------------ slides */

export interface Slide {
  id: string
  name?: string
  layoutId: string
  background: Background
  elements: AnyElement[]
  notes: string
  transition: TransitionSpec
  hidden: boolean
  /** Master overrides: hide the theme background, force an accent, etc. */
  accent?: string
  /** Data-driven animations (engine). Migrated automatically from the legacy per-element field. */
  animations?: AnimSpec[]
}

/* ------------------------------------------------------------------ theme */

export interface ThemePalette {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  textMuted: string
  onPrimary: string
  success: string
  warning: string
}

export interface ThemeFonts {
  heading: string
  body: string
  mono: string
}

export interface Theme {
  id: string
  name: string
  palette: ThemePalette
  fonts: ThemeFonts
  radius: number
  spacing: number
  headingWeight: number
  headingTransform: 'none' | 'uppercase' | 'capitalize'
  style: 'flat' | 'soft' | 'bold' | 'editorial' | 'minimal' | 'glass'
}

export interface BrandKit {
  id: string
  name: string
  logoAssetId?: string
  colors: ThemePalette
  fonts: ThemeFonts
  tagline?: string
  updatedAt: number
}

/* ------------------------------------------------------------------ document */

export interface PresentationMeta {
  title: string
  subject?: string
  author?: string
  company?: string
  createdAt: number
  updatedAt: number
  slideCount?: number
  tags: string[]
  dir: Dir
  lang: 'ar' | 'en' | 'fr'
  folderId?: string
  favorite?: boolean
  trashedAt?: number | null
}

export interface PresentationSettings {
  gridVisible: boolean
  gridSize: number
  snapToGrid: boolean
  smartGuides: boolean
  margins: { top: number; right: number; bottom: number; left: number }
  showThumbnails: boolean
  autoTextFit: boolean
}

export interface Presentation {
  id: string
  version: number
  metadata: PresentationMeta
  size: { w: number; h: number }
  theme: Theme
  brandKitId?: string
  slides: Slide[]
  settings: PresentationSettings
  /** Media referenced by id; object URLs or data URLs. Kept separate so docs stay small. */
  assets: Record<string, AssetRef>
  /** Unparsed payload we refuse to lose (grouped/unsupported PPTX parts). */
  raw?: Record<string, unknown>
}

export interface AssetRef {
  id: string
  name: string
  mime: string
  kind: 'image' | 'video' | 'audio' | 'font' | 'other'
  src: string
  w?: number
  h?: number
  bytes?: number
  createdAt: number
}

export interface ProjectRecord {
  id: string
  doc: Presentation
  updatedAt: number
  createdAt: number
  thumbnail?: string
  folderId?: string
  trashedAt?: number | null
  favorite?: boolean
  openCount?: number
}

export interface Folder {
  id: string
  name: string
  color?: string
  createdAt: number
}

/* ------------------------------------------------------------------ guards */

export const ELEMENT_KINDS: ElementKind[] = [
  'text',
  'image',
  'shape',
  'line',
  'icon',
  'svg',
  'table',
  'chart',
  'video',
  'frame',
]

export function isTextElement(e: AnyElement): e is TextElement {
  return e.kind === 'text'
}
export function isImageElement(e: AnyElement): e is ImageElement {
  return e.kind === 'image'
}
export function isShapeElement(e: AnyElement): e is ShapeElement {
  return e.kind === 'shape'
}
export function isTableElement(e: AnyElement): e is TableElement {
  return e.kind === 'table'
}
export function isChartElement(e: AnyElement): e is ChartElement {
  return e.kind === 'chart'
}
export function isLineElement(e: AnyElement): e is LineElement {
  return e.kind === 'line'
}
export function isIconElement(e: AnyElement): e is IconElement {
  return e.kind === 'icon'
}
export function isFrameElement(e: AnyElement): e is FrameElement {
  return e.kind === 'frame'
}
export function isVideoElement(e: AnyElement): e is VideoElement {
  return e.kind === 'video'
}
export function isSvgElement(e: AnyElement): e is SvgElement {
  return e.kind === 'svg'
}

/** Fallback theme used when a document was authored without one. */
export function defaultTextStyle(): TextStyle {
  return {
    fontFamily: 'tajawal',
    fontSize: 24,
    color: '#111114',
    align: 'start',
    vAlign: 'center',
    lineHeight: 1.45,
    letterSpacing: 0,
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    dir: 'rtl',
    wrap: true,
    transform: 'none',
  }
}

export function defaultFilters(): ImageFilters {
  return {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    grayscale: 0,
    blur: 0,
    sepia: 0,
    hueRotate: 0,
  }
}

export function defaultAnimation(): AnimationSpec {
  return { enter: 'none', duration: 500, delay: 0, direction: 'bottom' }
}

export function defaultTransition(): TransitionSpec {
  return { type: 'fade', duration: 400, direction: 'left' }
}
