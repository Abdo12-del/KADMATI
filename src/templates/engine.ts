/**
 * Template / deck authoring layer.
 *
 * A template is *authored* as compact specs (layout id + copy per role) and instantiated into
 * the real document model. There is no second rendering path: what you see in the gallery is the
 * same editable element tree you get in the editor.
 */
import { createAsset, createText, newId, THEME_PRESETS } from '../document/factory'
import { CANVAS_H, CANVAS_W } from '../document/types'
import { buildLayout, LAYOUT_MAP } from './layouts'
import {
  type AnyElement,
  type AssetRef,
  type Background,
  type ElementRole,
  type Presentation,
  type Slide,
  type TextElement,
  type Theme,
  type TransitionSpec,
} from '../document/types'
import { createPresentation } from '../document/factory'

export type TemplateCategory =
  | 'business'
  | 'education'
  | 'marketing'
  | 'startup'
  | 'pitch'
  | 'portfolio'
  | 'academic'
  | 'report'
  | 'personal'
  | 'minimal'
  | 'modern'
  | 'creative'

export const CATEGORY_LABEL: Record<TemplateCategory, string> = {
  business: 'أعمال',
  education: 'تعليم',
  marketing: 'تسويق',
  startup: 'شركات ناشئة',
  pitch: 'Pitch Deck',
  portfolio: 'أعمال ومعرض',
  academic: 'أكاديمي',
  report: 'تقارير',
  personal: 'شخصي',
  minimal: 'بسيط',
  modern: 'حديث',
  creative: 'إبداعي',
}

export interface SlideSpec {
  layout: string
  /** Copy per role. An array becomes a bullet list on a single element, or one item per matching element. */
  content?: Partial<Record<ElementRole, string | string[]>>
  bg?: 'default' | 'primary' | 'surface' | 'dark' | 'image' | 'pattern'
  image?: ArtKind
  transition?: Partial<TransitionSpec>
  notes?: string
  /** Overrides for specific element indices, e.g. { title: '...' } applied after layout copy. */
  patch?: Record<string, unknown>
}

export type ArtKind = 'aurora' | 'grid' | 'waves' | 'city' | 'lab' | 'portrait' | 'product' | 'paper'

export interface DeckSpec {
  id: string
  title: string
  subject?: string
  author?: string
  lang?: 'ar' | 'en' | 'fr'
  dir?: 'rtl' | 'ltr'
  themeId: string
  categories?: TemplateCategory[]
  tags?: string[]
  slides: SlideSpec[]
}

export interface TemplateDef extends DeckSpec {
  name: string
  description: string
  category: TemplateCategory
  featured?: boolean
}

/* ------------------------------------------------------------------ demo artwork */

const hash = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

/**
 * Deterministic SVG artwork for image slots. Real photos come from the Images panel
 * (upload / Picsum / Unsplash); templates must render offline and look designed, not empty.
 */
export function makeArt(kind: ArtKind, theme: Theme, seed = 0): AssetRef {
  const { palette } = theme
  const r = hash(`${kind}:${seed}`)
  const A = (i: number, mod: number) => ((r >> (i * 3)) % mod + mod) % mod
  let body = ''
  const w = 1600
  const h = 1000
  switch (kind) {
    case 'aurora':
      body = `
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="${palette.primary}"/>
            <stop offset="0.55" stop-color="${palette.secondary}"/>
            <stop offset="1" stop-color="${palette.background}"/>
          </linearGradient>
          <filter id="b"><feGaussianBlur stdDeviation="60"/></filter>
        </defs>
        <rect width="${w}" height="${h}" fill="url(#g)"/>
        <circle cx="${200 + A(1, 1100)}" cy="${150 + A(2, 600)}" r="${260 + A(3, 180)}" fill="${palette.accent}" opacity="0.55" filter="url(#b)"/>
        <circle cx="${300 + A(4, 900)}" cy="${400 + A(5, 400)}" r="${200 + A(6, 240)}" fill="${palette.success}" opacity="0.35" filter="url(#b)"/>`;
      break
    case 'grid':
      body = `<rect width="${w}" height="${h}" fill="${palette.surface}"/>` + Array.from({ length: 26 }, (_, i) => `<rect x="${40 + (i % 6) * 255}" y="${60 + Math.floor(i / 6) * 165}" width="180" height="96" rx="14" fill="${i % 5 === 0 ? palette.primary : palette.background}" opacity="${i % 5 === 0 ? 0.9 : 1}"/>`).join('')
      break
    case 'waves':
      body = `<rect width="${w}" height="${h}" fill="${palette.primary}"/>` + Array.from({ length: 9 }, (_, i) => `<path d="M0 ${120 + i * 96} C ${w * 0.3} ${40 + i * 96 + A(i, 60)}, ${w * 0.7} ${200 + i * 96 - A(i, 50)}, ${w} ${100 + i * 96}" fill="none" stroke="${i % 3 === 0 ? palette.accent : palette.secondary}" stroke-width="${1 + (i % 4)}" opacity="${0.25 + i * 0.06}"/>`).join('')
      break
    case 'city':
      body = `<rect width="${w}" height="${h}" fill="${palette.background}"/>
        <rect width="${w}" height="${h}" fill="${palette.primary}" opacity="0.08"/>` +
        Array.from({ length: 16 }, (_, i) => {
          const bw = 60 + A(i, 90)
          const bh = 180 + A(i + 3, 520)
          return `<rect x="${i * 100}" y="${h - bh}" width="${bw}" height="${bh}" fill="${i % 4 === 0 ? palette.accent : palette.primary}" opacity="${0.12 + (i % 5) * 0.14}"/>`
        }).join('')
      break
    case 'lab':
      body = `<rect width="${w}" height="${h}" fill="${palette.surface}"/>` + Array.from({ length: 34 }, (_, i) => `<circle cx="${A(i, w)}" cy="${A(i + 5, h)}" r="${6 + A(i + 2, 46)}" fill="${i % 6 === 0 ? palette.accent : palette.secondary}" opacity="0.${20 + (i % 5) * 12}"/>`).join('')
      break
    case 'portrait':
      body = `<rect width="${w}" height="${h}" fill="${palette.secondary}"/>
        <circle cx="${w / 2}" cy="${h * 0.42}" r="210" fill="${palette.background}" opacity="0.92"/>
        <path d="M${w / 2 - 330} ${h} q330 -420 660 0 z" fill="${palette.background}" opacity="0.92"/>
        <rect width="${w}" height="${h}" fill="${palette.primary}" opacity="0.08"/>`
      break
    case 'product':
      body = `<rect width="${w}" height="${h}" fill="${palette.background}"/>
        <circle cx="${w / 2}" cy="${h / 2}" r="330" fill="${palette.surface}"/>
        <rect x="${w / 2 - 150}" y="${h / 2 - 210}" width="300" height="420" rx="42" fill="${palette.primary}"/>
        <rect x="${w / 2 - 150}" y="${h / 2 - 210}" width="300" height="120" rx="42" fill="${palette.accent}" opacity="0.9"/>`
      break
    case 'paper':
    default:
      body = `<rect width="${w}" height="${h}" fill="${palette.background}"/>
        <path d="M0 0 L${w} 0 L${w} ${h} Z" fill="${palette.surface}"/>
        <path d="M0 ${h} L${w * 0.55} ${h} L0 ${h * 0.4} Z" fill="${palette.accent}" opacity="0.16"/>
        <circle cx="${w * 0.78}" cy="${h * 0.3}" r="${h * 0.19}" fill="${palette.primary}" opacity="0.9"/>`
      break
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`
  return createAsset({
    name: `${kind}-${seed}.svg`,
    mime: 'image/svg+xml',
    kind: 'image',
    src: `data:image/svg+xml;base64,${b64(svg)}`,
    w,
    h,
  })
}

function b64(s: string): string {
  if (typeof btoa === 'undefined') return s
  // UTF-8 safe base64 without the deprecated unescape() trick.
  const bytes = new TextEncoder().encode(s)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}

/* ------------------------------------------------------------------ instantiation */

function bgFor(spec: SlideSpec, theme: Theme, art?: AssetRef): Background {
  switch (spec.bg) {
    case 'primary':
      return { type: 'solid', color: theme.palette.primary }
    case 'surface':
      return { type: 'solid', color: theme.palette.surface }
    case 'dark':
      return { type: 'gradient', gradient: { kind: 'linear', angle: 160, stops: [{ pos: 0, color: '#0B1020' }, { pos: 100, color: theme.palette.primary }] } }
    case 'pattern':
      return { type: 'pattern', color: theme.palette.secondary, pattern: 'grid', patternColor: theme.palette.secondary }
    case 'image':
      return art ? { type: 'image', image: { assetId: art.id, fit: 'cover' }, color: theme.palette.primary } : { type: 'solid', color: theme.palette.background }
    default:
      return { type: 'solid', color: theme.palette.background }
  }
}

/**
 * Copy arrives as a string with newlines or as an array; either way it becomes real paragraphs or a
 * real list. (Collapsing newlines into spaces is what makes imported/AI decks read as one long run-on.)
 */
/** A text block added below the content area for copy the chosen layout has no slot for. */
function leftoverBlock(slide: Slide, theme: Theme, html: string, role: ElementRole): AnyElement {
  const texts = slide.elements.filter((e) => e.kind === 'text')
  const below = texts.reduce((max, e) => Math.max(max, e.y + e.h), 0)
  const y = Math.min(CANVAS_H - 140, Math.max(below + 20, 420))
  const el = createText(theme, {
    x: texts[0]?.x ?? 96,
    y,
    w: texts[0]?.w ?? CANVAS_W - 192,
    h: Math.min(160, CANVAS_H - y - 24),
    role: 'body',
    html,
    name: `نص ${role}`,
  })
  return el
}

function valueToHtml(value: string | string[], role: ElementRole, dir: 'rtl' | 'ltr'): string {
  const raw = Array.isArray(value) ? value : String(value).split(/\r?\n/)
  const lines = raw.map((line) => line.replace(/^\s*[-•*]\s*/, '').trim()).filter((line) => line.length > 0)
  if (!lines.length) return ''
  if (lines.length === 1) return `<p>${escape(lines[0])}</p>`
  const listy = role === 'body' || role === 'list' || role === 'quote'
  if (Array.isArray(value) || listy) return listHtml(lines, dir)
  return lines.map((line) => `<p>${escape(line)}</p>`).join('')
}

function listHtml(items: string[], dir: 'rtl' | 'ltr'): string {
  return `<ul>${items.map((i) => `<li style="direction:${dir}">${escape(i)}</li>`).join('')}</ul>`
}

function escape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
}

function applyCopy(slide: Slide, spec: SlideSpec, theme: Theme, dir: 'rtl' | 'ltr') {
  const content = spec.content ?? {}
  const byRole = new Map<ElementRole, AnyElement[]>()
  for (const el of slide.elements) {
    if (!el.role) continue
    const list = byRole.get(el.role) ?? []
    list.push(el)
    byRole.set(el.role, list)
  }
  const filled = new Set<AnyElement>()
  for (const [role, value] of Object.entries(content) as [ElementRole, string | string[]][]) {
    const html = Array.isArray(value) && (byRole.get(role)?.length ?? 0) > 1 ? null : valueToHtml(value, role, dir)
    const targets = byRole.get(role) ?? []
    if (!targets.length) {
      // No slot for this role. Use an *unfilled* body block if there is one, otherwise add a new
      // one — overwriting an already-filled block is how generated decks used to lose their bullets.
      const free = slide.elements.find((e) => e.kind === 'text' && !filled.has(e) && (e.role === 'body' || e.role === 'list'))
      if (free && html) {
        setText(free, html, dir)
        filled.add(free)
      } else if (html) {
        slide.elements.push(leftoverBlock(slide, theme, html, role))
      }
      continue
    }
    if (Array.isArray(value) && targets.length > 1) {
      // One item per matching slot (4 stats, 4 process cards …).
      value.forEach((v, i) => {
        const target = targets[i % targets.length]
        setText(target, valueToHtml(v, role, dir), dir)
        filled.add(target)
      })
    } else {
      const lines = String(value).split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
      if (targets.length > 1 && lines.length > 1) {
        // Several slots for one role (process cards, comparison columns …): share the lines out
        // instead of stamping the same paragraph into every slot.
        const chunks: string[][] = targets.map(() => [])
        lines.forEach((line, i) => chunks[Math.min(i, chunks.length - 1)].push(line))
        targets.forEach((t, i) => {
          const chunk = chunks[i]
          if (!chunk.length) return
          setText(t, valueToHtml(chunk.join('\n'), role, dir), dir)
          filled.add(t)
        })
      } else if (html) {
        targets.forEach((t) => {
          setText(t, html, dir)
          filled.add(t)
        })
      }
    }
  }
  // Shape text inside cards, when a layout declares it.
  for (const el of slide.elements) {
    if (el.kind === 'shape' && !el.text) {
      void theme
    }
  }
}

function setText(el: AnyElement, html: string, dir: 'rtl' | 'ltr') {
  if (el.kind === 'text') {
    el.content = html
    el.font = { ...el.font, dir }
  }
}

export function instantiateDeck(spec: DeckSpec, opts: { templateId?: string; category?: TemplateCategory } = {}): Presentation {
  const theme = THEME_PRESETS.find((t) => t.id === spec.themeId)?.theme ?? THEME_PRESETS[0].theme
  const dir = spec.dir ?? (spec.lang === 'en' ? 'ltr' : 'rtl')
  const assets: Record<string, AssetRef> = {}
  const slides: Slide[] = []

  for (const s of spec.slides) {
    const layout = LAYOUT_MAP.get(s.layout) ?? LAYOUT_MAP.get('title-content')!
    const slide = buildLayout(layout, theme)
    slide.background = bgFor(s, theme)
    if (s.transition) Object.assign(slide.transition, s.transition)
    if (s.notes) slide.notes = s.notes
    if (s.patch) Object.assign(slide, s.patch)

    const needsArt = s.bg === 'image' || slide.elements.some((e) => e.kind === 'image' && !e.assetId)
    let art: AssetRef | undefined
    if (needsArt) {
      art = makeArt(s.image ?? 'aurora', theme, slides.length)
      assets[art.id] = art
      for (const el of slide.elements) {
        if (el.kind === 'image' && !el.assetId) el.assetId = art.id
      }
      if (s.bg === 'image') slide.background = bgFor(s, theme, art)
    }

    applyCopy(slide, s, theme, dir)
    slides.push(slide)
  }

  const doc = createPresentation({
    title: spec.title,
    theme,
    slides,
    assets,
    metadata: {
      title: spec.title,
      subject: spec.subject,
      author: spec.author,
      tags: spec.tags ?? [],
      dir,
      lang: spec.lang ?? 'ar',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      trashedAt: null,
    },
  })
  if (opts.templateId) doc.raw = { templateId: opts.templateId, category: opts.category }
  return doc
}

export function emptySlideSpec(): SlideSpec {
  return { layout: 'blank' }
}

export function newPresentationId(): string {
  return newId('p')
}

export type { TextElement }
