/**
 * Font registry. Arabic is a first-class citizen: every family declares the script it
 * renders best in, and the UI always offers the Arabic families regardless of UI language.
 * Families are preloaded from index.html (Google Fonts) with system fallbacks so the
 * editor degrades gracefully offline.
 */

export type FontScript = 'arabic' | 'latin' | 'both' | 'mono'

export interface FontDef {
  id: string
  /** CSS font-family value, with fallbacks. */
  stack: string
  label: string
  arabicLabel?: string
  script: FontScript
  category: 'sans' | 'serif' | 'display' | 'mono'
  weights: number[]
  /** Sample line shown in the picker. */
  sample: string
  metrics?: { ascent: number; capHeight: number }
}

export const FONTS: FontDef[] = [
  {
    id: 'tajawal',
    stack: "'Tajawal', 'IBM Plex Sans Arabic', system-ui, sans-serif",
    label: 'Tajawal',
    arabicLabel: 'تجوّل',
    script: 'arabic',
    category: 'sans',
    weights: [400, 500, 700, 800],
    sample: 'صمّم عروضًا تستحق أن تُعرض',
    metrics: { ascent: 1.0, capHeight: 0.72 },
  },
  {
    id: 'plex-arabic',
    stack: "'IBM Plex Sans Arabic', 'Tajawal', system-ui, sans-serif",
    label: 'IBM Plex Sans Arabic',
    arabicLabel: 'بلكس عربي',
    script: 'arabic',
    category: 'sans',
    weights: [400, 500, 600, 700],
    sample: 'تجربة حديثة، سريعة، وقليلة التشويش',
    metrics: { ascent: 1.02, capHeight: 0.7 },
  },
  {
    id: 'cairo',
    stack: "'Cairo', 'Tajawal', sans-serif",
    label: 'Cairo',
    arabicLabel: 'القاهرة',
    script: 'both',
    category: 'sans',
    weights: [400, 600, 700],
    sample: 'عروض تقديمية احترافية 1234',
    metrics: { ascent: 1.0, capHeight: 0.7 },
  },
  {
    id: 'readex',
    stack: "'Readex Pro', 'Tajawal', sans-serif",
    label: 'Readex Pro',
    arabicLabel: 'ريكس',
    script: 'both',
    category: 'sans',
    weights: [400, 500, 600],
    sample: 'الهوية البصرية للعلامة التجارية',
  },
  {
    id: 'noto-kufi',
    stack: "'Noto Kufi Arabic', 'Tajawal', sans-serif",
    label: 'Noto Kufi Arabic',
    arabicLabel: 'كوفي',
    script: 'arabic',
    category: 'display',
    weights: [400, 600, 700],
    sample: 'عنوان رئيسي بخط كوفي',
  },
  {
    id: 'amiri',
    stack: "'Amiri', 'Traditional Arabic', serif",
    label: 'Amiri',
    arabicLabel: 'أميري',
    script: 'arabic',
    category: 'serif',
    weights: [400, 700],
    sample: 'بحثٍ أكاديميٍ بلغةٍ عربيةٍ فصيحة',
  },
  {
    id: 'inter',
    stack: "'Inter', system-ui, 'Helvetica Neue', sans-serif",
    label: 'Inter',
    script: 'latin',
    category: 'sans',
    weights: [400, 500, 600, 700],
    sample: 'Q3 Revenue Growth 24.8%',
    metrics: { ascent: 0.98, capHeight: 0.727 },
  },
  {
    id: 'grotesk',
    stack: "'Space Grotesk', 'Inter', sans-serif",
    label: 'Space Grotesk',
    script: 'latin',
    category: 'display',
    weights: [400, 500, 600, 700],
    sample: 'Series A — 14M ARR',
  },
  {
    id: 'playfair',
    stack: "'Playfair Display', Georgia, serif",
    label: 'Playfair Display',
    script: 'latin',
    category: 'serif',
    weights: [400, 600, 700],
    sample: 'The Quarterly Review',
  },
  {
    id: 'lora',
    stack: "'Lora', Georgia, serif",
    label: 'Lora',
    script: 'latin',
    category: 'serif',
    weights: [400, 600],
    sample: 'A study in typography',
  },
  {
    id: 'jetbrains',
    stack: "'JetBrains Mono', ui-monospace, monospace",
    label: 'JetBrains Mono',
    script: 'mono',
    category: 'mono',
    weights: [400, 600],
    sample: 'const deck = createDeck()',
  },
]

export const FONT_MAP = new Map(FONTS.map((f) => [f.id, f]))

/** Accepts a font id or a raw CSS stack (imported decks reference real families). */
export function resolveFont(idOrStack: string | undefined): FontDef | undefined {
  if (!idOrStack) return undefined
  const byId = FONT_MAP.get(idOrStack)
  if (byId) return byId
  const lower = idOrStack.toLowerCase()
  return FONTS.find((f) => f.label.toLowerCase() === lower || f.stack.toLowerCase() === idOrStack.toLowerCase())
}

export function fontStack(idOrStack: string | undefined, fallbackId = 'tajawal'): string {
  const def = resolveFont(idOrStack)
  if (def) return def.stack
  // Imported decks can reference arbitrary families — pass them through with a safe tail.
  if (idOrStack && !idOrStack.startsWith('var-')) return `${idOrStack}, ${FONT_MAP.get(fallbackId)!.stack}`
  return FONT_MAP.get(fallbackId)!.stack
}

export const ARABIC_FONTS = FONTS.filter((f) => f.script === 'arabic' || f.script === 'both')
export const LATIN_FONTS = FONTS.filter((f) => f.script === 'latin' || f.script === 'both' || f.script === 'mono')

/** Heuristic used by the auto-fit + importers: does this string need an Arabic face? */
export function containsArabic(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text)
}

export function containsCjk(text: string): boolean {
  return /[\u3040-\u30FF\u4E00-\u9FFF]/.test(text)
}

/** Latin runs inside an Arabic paragraph should not inherit a Kufi face. */
export function fallbackStackFor(text: string, primary: string, dir: 'rtl' | 'ltr'): string {
  const stack = fontStack(primary)
  if (dir === 'ltr' || containsArabic(text)) return stack
  return `${stack}`
}
