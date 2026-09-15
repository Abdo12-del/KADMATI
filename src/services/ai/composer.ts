/**
 * Composer — PresentationPlan → DeckSpec (the contract the layout engine already understands).
 *
 * This is where CONTENT INTELLIGENCE meets DESIGN ENGINE:
 *  • each SlidePlan.type maps to a concrete LayoutDef — the layout engine owns all coordinates;
 *  • type-specific payloads (stats/comparison/steps/timeline/chart/table) land in the layout's
 *    real role slots or native chart/table elements — never into free-floating text boxes;
 *  • `polish()` enforces the presentation-quality rules (title uniqueness, bullet length and
 *    density caps) on ANY engine's output — local or provider — before a slide is built.
 *
 * Pure module: no stores, no DOM — tests run it headless.
 */
import type { ArtKind, DeckSpec, SlideSpec, TemplateCategory } from '../../templates/engine'
import { packFor, cleanTitle, type GenerateBrief } from './planner'
import type { PresentationPlan, SlidePlan } from './schema'

/* ------------------------------------------------------------------ quality rules */

export const QUALITY = {
  maxBullets: 5,
  maxWordsPerBullet: 14,
  maxWordsPerSlide: 70,
  maxNotesChars: 400,
  minSlides: 4,
  maxSlides: 30,
} as const

export interface QualityReport {
  trimmedBullets: number
  shortenedBullets: number
  dedupedTitles: number
  droppedSlides: number
  notes: string[]
}

function words(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

/** Presentation ≠ document: cap density, kill repeated titles, strip markdown residue. */
export function polish(plan: PresentationPlan, lang: 'ar' | 'en' | 'fr'): { plan: PresentationPlan; quality: QualityReport } {
  const quality: QualityReport = { trimmedBullets: 0, shortenedBullets: 0, dedupedTitles: 0, droppedSlides: 0, notes: [] }
  const seenTitles = new Set<string>()
  const slides: SlidePlan[] = []

  for (const slide of plan.slides.slice(0, QUALITY.maxSlides)) {
    const next: SlidePlan = { ...slide }

    // 1. Unique, meaningful titles.
    let title = next.title.trim()
    if (seenTitles.has(title.toLowerCase())) {
      const alt = next.subtitle?.trim()
      if (alt && !seenTitles.has(alt.toLowerCase())) {
        title = alt
        next.subtitle = undefined
      } else {
        title = `${title} — ${typeLabel(next.type, lang) || String(slides.length + 1)}`
      }
      quality.dedupedTitles++
    }
    next.title = title
    seenTitles.add(title.toLowerCase())

    // 2. Bullet hygiene: count and per-bullet length.
    if (next.bullets?.length) {
      if (next.bullets.length > QUALITY.maxBullets) {
        next.bullets = next.bullets.slice(0, QUALITY.maxBullets)
        quality.trimmedBullets++
      }
      next.bullets = next.bullets.map((b) => {
        if (words(b) <= QUALITY.maxWordsPerBullet) return b
        quality.shortenedBullets++
        return b.split(/\s+/).slice(0, QUALITY.maxWordsPerBullet).join(' ') + '…'
      })
    }
    if (next.steps?.length) {
      next.steps = next.steps.slice(0, 6).map((s) => (words(s) > 12 ? s.split(/\s+/).slice(0, 12).join(' ') + '…' : s))
    }

    // 3. Slide word budget — a slide is not a page.
    const slideWords =
      words(next.title) +
      words(next.subtitle ?? '') +
      (next.bullets ?? []).reduce((n, b) => n + words(b), 0) +
      (next.steps ?? []).reduce((n, s) => n + words(s), 0) +
      (next.timeline ?? []).reduce((n, t) => n + words(t.what), 0)
    if (slideWords > QUALITY.maxWordsPerSlide && next.bullets?.length) {
      const keep = Math.max(2, Math.floor((QUALITY.maxWordsPerSlide * 0.8) / Math.max(1, slideWords / next.bullets.length)))
      if (keep < next.bullets.length) {
        next.bullets = next.bullets.slice(0, keep)
        quality.trimmedBullets++
      }
    }

    if (next.notes && next.notes.length > QUALITY.maxNotesChars) next.notes = `${next.notes.slice(0, QUALITY.maxNotesChars - 1)}…`
    slides.push(next)
  }

  if (plan.slides.length > QUALITY.maxSlides) quality.droppedSlides = plan.slides.length - QUALITY.maxSlides
  return { plan: { ...plan, slides }, quality }
}

function typeLabel(type: SlidePlan['type'], lang: 'ar' | 'en' | 'fr'): string {
  const ar: Record<string, string> = { statistics: 'بالأرقام', comparison: 'مقارنة', process: 'منهجية', timeline: 'جدول زمني', chart: 'رسم بياني', table: 'جدول', quote: 'اقتباس', 'image-text': 'بصريًا', divider: 'قسم', agenda: 'أجندة', content: 'تفصيل', cover: 'غلاف', closing: 'خلاصة' }
  const fr: Record<string, string> = { statistics: 'en chiffres', comparison: 'comparaison', process: 'méthode', timeline: 'chronologie', chart: 'graphique', table: 'tableau', quote: 'citation', 'image-text': 'visuel', divider: 'section', agenda: 'programme', content: 'détail', cover: 'couverture', closing: 'conclusion' }
  const en: Record<string, string> = { statistics: 'in numbers', comparison: 'compared', process: 'the method', timeline: 'timeline', chart: 'the data', table: 'the matrix', quote: 'in one line', 'image-text': 'visually', divider: 'section', agenda: 'agenda', content: 'detail', cover: 'cover', closing: 'wrap-up' }
  const map = lang === 'ar' ? ar : lang === 'fr' ? fr : en
  return map[type] ?? ''
}

/* ------------------------------------------------------------------ layout mapping */

const LAYOUT_FOR_TYPE: Record<SlidePlan['type'], string> = {
  cover: 'title',
  agenda: 'title-content',
  divider: 'section',
  content: 'title-content',
  statistics: 'statistics',
  comparison: 'comparison',
  process: 'process',
  timeline: 'timeline',
  chart: 'chart',
  table: 'table',
  quote: 'quote',
  'image-text': 'image-text',
  closing: 'closing',
}

const ART_BY_CATEGORY: Record<string, ArtKind> = {
  business: 'grid',
  education: 'lab',
  academic: 'lab',
  pitch: 'aurora',
  marketing: 'waves',
  report: 'grid',
  general: 'paper',
}

function visualToArt(plan: SlidePlan, category: TemplateCategory, i: number): ArtKind {
  if (plan.visual === 'image') return ART_BY_CATEGORY[category] ?? (['aurora', 'grid', 'waves', 'city', 'lab', 'paper'] as ArtKind[])[i % 6]
  return 'paper'
}

/**
 * Plan → SlideSpec list. Content lands per ROLE so applyCopy distributes it across the layout's
 * real slots (3 stat cards, 2 comparison columns, 4 process cards…).
 */
export function planToSlideSpecs(plan: PresentationPlan, brief: GenerateBrief, category: TemplateCategory): SlideSpec[] {
  const pack = packFor(brief.lang)
  return plan.slides.map((slide, i) => {
    const spec: SlideSpec = { layout: LAYOUT_FOR_TYPE[slide.type] ?? 'title-content', notes: slide.notes ?? '' }
    const content: SlideSpec['content'] = {}

    switch (slide.type) {
      case 'cover':
        spec.layout = brief.style === 'minimal' || brief.style === 'elegant' ? 'title-centered' : 'title'
        content.kicker = pack.kicker
        content.title = slide.title
        content.subtitle = slide.subtitle || plan.subtitle || ''
        content.footer = brief.audience
        spec.bg = brief.style === 'cinematic' ? 'dark' : 'primary'
        if (slide.visual === 'image' || slide.imageQuery) spec.image = visualToArt(slide, category, i)
        break

      case 'agenda':
        content.kicker = pack.kicker
        content.title = slide.title
        content.body = (slide.bullets ?? []).slice(0, 6)
        spec.bg = 'default'
        break

      case 'divider':
        content.kicker = typeLabel('divider', brief.lang)
        content.title = slide.title
        content.subtitle = slide.subtitle
        spec.bg = 'primary'
        break

      case 'statistics': {
        content.title = slide.title
        const stats = (slide.stats ?? []).slice(0, 3)
        content.stat = stats.map((s) => s.value)
        content.body = stats.map((s) => s.label)
        spec.bg = 'surface'
        break
      }

      case 'comparison': {
        content.title = slide.title
        const cmp = slide.comparison
        if (cmp) {
          content.kicker = [cmp.left.title, cmp.right.title]
          content.body = [...cmp.left.points.slice(0, 4), ...cmp.right.points.slice(0, 4)]
        } else {
          content.body = slide.bullets?.slice(0, 4) ?? []
        }
        spec.bg = 'default'
        break
      }

      case 'process':
        content.title = slide.title
        content.body = (slide.steps ?? slide.bullets ?? []).slice(0, 4)
        spec.bg = 'default'
        break

      case 'timeline': {
        content.title = slide.title
        const tl = (slide.timeline ?? []).slice(0, 4)
        content.kicker = tl.map((t) => t.when)
        content.body = tl.map((t) => t.what)
        spec.bg = 'default'
        break
      }

      case 'chart':
        content.title = slide.title
        content.body = slide.chart?.insight || slide.subtitle || slide.bullets?.[0] || ''
        spec.data = slide.chart
          ? {
              chart: {
                kind: slide.chart.kind,
                categories: slide.chart.categories.slice(0, 8),
                series: slide.chart.series.slice(0, 3).map((s) => ({ name: s.name, values: s.values.slice(0, 8) })),
              },
            }
          : undefined
        spec.bg = 'default'
        break

      case 'table':
        content.title = slide.title
        if (slide.table) {
          spec.data = { table: { header: slide.table.header.slice(0, 5), rows: slide.table.rows.slice(0, 6).map((r) => r.slice(0, 5)) } }
        }
        spec.bg = 'default'
        break

      case 'quote':
        content.title = ''
        content.quote = slide.quote?.text ?? slide.title
        content.footer = slide.quote?.author ? `— ${slide.quote.author}` : ''
        spec.bg = 'surface'
        break

      case 'image-text':
        content.title = slide.title
        content.body = slide.bullets?.slice(0, 3) ?? slide.subtitle ?? ''
        spec.image = visualToArt(slide, category, i)
        if (slide.imageQuery) spec.notes = [spec.notes, `${brief.lang === 'ar' ? 'صورة مقترحة' : brief.lang === 'fr' ? 'Image suggérée' : 'Suggested image'}: ${slide.imageQuery}`].filter(Boolean).join('\n')
        spec.bg = 'default'
        break

      case 'closing':
        content.kicker = pack.next
        content.title = slide.title
        content.body = (slide.bullets ?? [pack.thanks]).slice(0, 3)
        content.footer = brief.audience
        spec.bg = 'dark'
        break

      default:
        content.kicker = ''
        content.title = slide.title
        if (slide.subtitle) content.subtitle = slide.subtitle
        content.body = (slide.bullets ?? []).slice(0, 5)
        spec.bg = 'default'
        if (i % 5 === 3 && slide.visual !== 'none') {
          spec.layout = 'image-text'
          spec.image = visualToArt(slide, category, i)
        }
    }

    spec.content = content
    return spec
  })
}

/* ------------------------------------------------------------------ deck assembly */

export function composeDeck(
  plan: PresentationPlan,
  brief: GenerateBrief,
  options: { theme: DeckSpec['theme']; themeId: string; brandKitId?: string; aspect?: '16:9' | '4:3' },
): DeckSpec {
  const category = (brief.category === 'general' ? 'business' : brief.category) as TemplateCategory
  const specs = planToSlideSpecs(plan, brief, category)
  return {
    id: `ai-${Date.now().toString(36)}`,
    title: cleanTitle(plan.title, brief.lang),
    subject: plan.subtitle,
    author: 'KADMATI AI',
    lang: brief.lang,
    dir: brief.lang === 'ar' ? 'rtl' : 'ltr',
    themeId: options.themeId,
    theme: options.theme,
    brandKitId: options.brandKitId,
    aspect: options.aspect ?? '16:9',
    categories: [category],
    tags: Array.from(new Set([category, brief.style])),
    slides: specs,
  }
}
