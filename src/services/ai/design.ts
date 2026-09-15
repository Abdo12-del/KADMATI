/**
 * Design System — one coherent Theme per generated deck, never per slide.
 *
 * The AI never touches coordinates or per-element styling. It picks a *style*, and this module
 * derives the full design system (palette, fonts, radius, spacing, heading weight) from:
 *   style id  ×  language  ×  topic seed (so two topics never look identical)
 *   ×  optional Brand Kit (colors/fonts/logo win over everything else)
 *
 * Every palette passes `guardPalette` so contrast is readable before a single slide is built.
 */
import { theme as createTheme } from '../../document/factory'
import { isLight } from '../../lib/colors'
import type { Theme, ThemePalette } from '../../document/types'
import type { BrandKit } from '../../document/types'

export type DesignStyleId = import('./schema').DesignStyleId

export interface DesignStyleDef {
  id: DesignStyleId
  label: string
  en: string
  hint: string
}

export const DESIGN_STYLES: DesignStyleDef[] = [
  { id: 'minimal', label: 'بسيط', en: 'Minimal', hint: 'مساحة بيضاء، سطور نظيفة، بلا زخرفة' },
  { id: 'modern', label: 'حديث', en: 'Modern', hint: 'ألوان حية وزوايا ناعمة' },
  { id: 'professional', label: 'مهني', en: 'Professional', hint: 'كلاسيكي هادئ يصلح لمجلس الإدارة' },
  { id: 'creative', label: 'إبداعي', en: 'Creative', hint: 'تباين جريء ولون توقيع' },
  { id: 'cinematic', label: 'سينمائي', en: 'Cinematic', hint: 'خلفيات داكنة ولمسة ضوء' },
  { id: 'elegant', label: 'أنيق', en: 'Elegant', hint: 'خطوط Serif وهامش سخي' },
]

interface StyleRecipe {
  radius: number
  spacing: number
  headingWeight: number
  style: Theme['style']
  headingTransform: Theme['headingTransform']
  fonts: { ar: { heading: string; body: string }; lat: { heading: string; body: string } }
  palette: (seed: number) => Partial<ThemePalette>
}

/** Small hash so the same topic keeps its look across regenerations, different topics diverge. */
export function styleSeed(topic: string): number {
  let h = 2166136261
  for (let i = 0; i < topic.length; i++) {
    h ^= topic.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

const RECIPES: Record<DesignStyleId, StyleRecipe> = {
  minimal: {
    radius: 6,
    spacing: 96,
    headingWeight: 700,
    style: 'minimal',
    headingTransform: 'none',
    fonts: { ar: { heading: 'tajawal', body: 'tajawal' }, lat: { heading: 'inter', body: 'inter' } },
    palette: (seed) => {
      const hue = seed % 30
      return {
        primary: hsl(hue + 200, 22, 16),
        secondary: hsl(hue + 205, 12, 46),
        accent: hsl(hue + 18, 60, 46),
        background: '#FFFFFF',
        surface: '#F6F6F5',
        text: '#141414',
        textMuted: '#6E6E74',
        onPrimary: '#FFFFFF',
      }
    },
  },
  modern: {
    radius: 18,
    spacing: 72,
    headingWeight: 800,
    style: 'glass',
    headingTransform: 'none',
    fonts: { ar: { heading: 'readex', body: 'tajawal' }, lat: { heading: 'grotesk', body: 'inter' } },
    palette: (seed) => {
      const hue = 230 + (seed % 70)
      return {
        primary: hsl(hue, 58, 24),
        secondary: hsl(hue + 18, 74, 56),
        accent: hsl(hue + 150, 66, 48),
        background: '#FFFFFF',
        surface: hsl(hue, 44, 96),
        text: hsl(hue, 30, 14),
        textMuted: hsl(hue, 14, 48),
        onPrimary: '#FFFFFF',
      }
    },
  },
  professional: {
    radius: 10,
    spacing: 80,
    headingWeight: 700,
    style: 'flat',
    headingTransform: 'none',
    fonts: { ar: { heading: 'cairo', body: 'tajawal' }, lat: { heading: 'inter', body: 'inter' } },
    palette: (seed) => {
      const hue = 205 + (seed % 40)
      return {
        primary: hsl(hue, 52, 20),
        secondary: hsl(hue + 12, 42, 42),
        accent: hsl(hue - 130, 64, 50),
        background: '#FFFFFF',
        surface: hsl(hue, 26, 96),
        text: hsl(hue, 24, 12),
        textMuted: hsl(hue, 12, 44),
        onPrimary: '#FFFFFF',
      }
    },
  },
  creative: {
    radius: 24,
    spacing: 64,
    headingWeight: 800,
    style: 'bold',
    headingTransform: 'none',
    fonts: { ar: { heading: 'cairo', body: 'readex' }, lat: { heading: 'grotesk', body: 'inter' } },
    palette: (seed) => {
      const hue = (seed % 360 + 330) % 360
      return {
        primary: hsl(hue, 62, 14),
        secondary: hsl(hue + 20, 86, 58),
        accent: hsl(hue + 160, 78, 52),
        background: '#FFFFFF',
        surface: hsl(hue, 70, 96),
        text: hsl(hue, 34, 12),
        textMuted: hsl(hue, 16, 46),
        onPrimary: '#FFFFFF',
      }
    },
  },
  cinematic: {
    radius: 12,
    spacing: 72,
    headingWeight: 800,
    style: 'bold',
    headingTransform: 'none',
    fonts: { ar: { heading: 'noto-kufi', body: 'tajawal' }, lat: { heading: 'grotesk', body: 'inter' } },
    palette: (seed) => {
      const hue = 220 + (seed % 60)
      return {
        primary: hsl(hue, 60, 12),
        secondary: hsl(hue + 14, 64, 48),
        accent: hsl(38 + (seed % 16), 92, 58),
        background: hsl(hue, 44, 7),
        surface: hsl(hue, 36, 13),
        text: '#F4F1EA',
        textMuted: hsl(hue, 18, 66),
        onPrimary: '#FFFFFF',
      }
    },
  },
  elegant: {
    radius: 4,
    spacing: 104,
    headingWeight: 600,
    style: 'editorial',
    headingTransform: 'none',
    fonts: { ar: { heading: 'playfair', body: 'amiri' }, lat: { heading: 'playfair', body: 'lora' } },
    palette: (seed) => {
      const hue = 150 + (seed % 60)
      return {
        primary: hsl(hue - 60, 34, 16),
        secondary: hsl(hue, 22, 42),
        accent: hsl(hue + 120, 44, 40),
        background: '#FBF8F2',
        surface: '#F1EAD9',
        text: '#20180F',
        textMuted: '#6F6455',
        onPrimary: '#FFFFFF',
      }
    },
  },
}

function hsl(h: number, s: number, l: number): string {
  const hh = ((h % 360) + 360) % 360
  const sat = s / 100
  const lig = l / 100
  const k = (n: number) => (n + hh / 30) % 12
  const a = sat * Math.min(lig, 1 - lig)
  const f = (n: number) => lig - a * Math.max(-1, Math.min(Math.min(k(n) - 3, 9 - k(n)), 1))
  const to = (v: number) => Math.round(255 * v).toString(16).padStart(2, '0')
  return `#${to(f(0))}${to(f(8))}${to(f(4))}`
}

export interface BuildThemeOptions {
  style: DesignStyleId
  topic: string
  lang: 'ar' | 'en' | 'fr'
  brand?: BrandKit | null
}

export function buildTheme(opts: BuildThemeOptions): Theme {
  const seed = styleSeed(opts.topic || opts.style)
  const recipe = RECIPES[opts.style] ?? RECIPES.professional
  const fonts = opts.lang === 'ar' ? recipe.fonts.ar : recipe.fonts.lat
  const id = `ai-${opts.style}-${seed.toString(36)}`
  const name = opts.brand ? opts.brand.name : DESIGN_STYLES.find((s) => s.id === opts.style)?.label ?? opts.style

  if (opts.brand) {
    // Brand kit wins: its colors + fonts, the style's structural voice.
    return createTheme(
      id,
      name,
      { ...opts.brand.colors },
      { heading: opts.brand.fonts.heading, body: opts.brand.fonts.body, mono: opts.brand.fonts.mono },
      { style: recipe.style, radius: recipe.radius, spacing: recipe.spacing, headingWeight: recipe.headingWeight, headingTransform: recipe.headingTransform },
    )
  }

  return createTheme(
    id,
    name,
    recipe.palette(seed),
    { heading: fonts.heading, body: fonts.body, mono: 'jetbrains' },
    { style: recipe.style, radius: recipe.radius, spacing: recipe.spacing, headingWeight: recipe.headingWeight, headingTransform: recipe.headingTransform },
  )
}

export function themeIsLight(theme: Theme): boolean {
  return isLight(theme.palette.background)
}

export function brandFor(brandKits: BrandKit[], brandKitId?: string): BrandKit | null {
  if (!brandKitId) return null
  return brandKits.find((k) => k.id === brandKitId) ?? null
}
