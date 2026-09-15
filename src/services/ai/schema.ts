/**
 * The contract between any AI provider and this product.
 *
 * Nothing in the pipeline trusts free-form text: every provider answer must arrive as JSON that
 * matches `PresentationPlan`. This module owns that shape, the JSON Schema handed to runtimes
 * that support native structured outputs (Ollama `format:`), the validator, and the repair pass.
 *
 * Pure module — no store, no DOM — so tests can run it headless.
 */

export const SLIDE_TYPES = [
  'cover',
  'agenda',
  'divider',
  'content',
  'statistics',
  'comparison',
  'process',
  'timeline',
  'chart',
  'table',
  'quote',
  'image-text',
  'closing',
] as const

export type SlideType = (typeof SLIDE_TYPES)[number]

/** Visual direction chosen by the user (or inferred) — realized by design.ts into a Theme. */
export type DesignStyleId = 'minimal' | 'modern' | 'professional' | 'creative' | 'cinematic' | 'elegant'

export type ChartShape = 'bar' | 'barH' | 'line' | 'area' | 'pie' | 'donut'

export interface PlanStat {
  value: string
  label: string
}

export interface PlanComparison {
  left: { title: string; points: string[] }
  right: { title: string; points: string[] }
}

export interface PlanChart {
  kind: ChartShape
  categories: string[]
  series: { name: string; values: number[] }[]
  insight?: string
}

export interface PlanTable {
  header: string[]
  rows: string[][]
}

export interface SlidePlan {
  type: SlideType
  title: string
  subtitle?: string
  bullets?: string[]
  stats?: PlanStat[]
  comparison?: PlanComparison
  steps?: string[]
  timeline?: { when: string; what: string }[]
  chart?: PlanChart
  table?: PlanTable
  quote?: { text: string; author?: string }
  /** How the slide wants to feel visually: chart | image | icon | none */
  visual?: 'chart' | 'image' | 'icon' | 'none'
  /** A concrete image-search-style suggestion (used as art seed + recorded in notes). */
  imageQuery?: string
  notes?: string
}

export interface PresentationPlan {
  title: string
  subtitle?: string
  slides: SlidePlan[]
}

/* ------------------------------------------------------------------ JSON Schema */

/**
 * JSON Schema (draft-07 subset understood by Ollama structured outputs) for the full plan.
 * Kept permissive on length on purpose: repair + quality rules do the clamping, and an
 * over-constrained schema makes small local models fail harder, not better.
 */
export function planJsonSchema(): Record<string, unknown> {
  const str = { type: 'string' }
  const strArr = { type: 'array', items: str }
  const slideProps: Record<string, unknown> = {
    type: { type: 'string', enum: [...SLIDE_TYPES] },
    title: str,
    subtitle: str,
    bullets: strArr,
    visual: { type: 'string', enum: ['chart', 'image', 'icon', 'none'] },
    imageQuery: str,
    notes: str,
  }
  const statObj = { type: 'object', properties: { value: str, label: str }, required: ['value', 'label'] }
  const colObj = { type: 'object', properties: { title: str, points: strArr }, required: ['title', 'points'] }
  Object.assign(slideProps, {
    stats: { type: 'array', items: statObj },
    comparison: { type: 'object', properties: { left: colObj, right: colObj }, required: ['left', 'right'] },
    steps: strArr,
    timeline: { type: 'array', items: { type: 'object', properties: { when: str, what: str }, required: ['when', 'what'] } },
    chart: {
      type: 'object',
      properties: {
        kind: { type: 'string', enum: ['bar', 'barH', 'line', 'area', 'pie', 'donut'] },
        categories: strArr,
        series: { type: 'array', items: { type: 'object', properties: { name: str, values: { type: 'array', items: { type: 'number' } } }, required: ['name', 'values'] } },
        insight: str,
      },
      required: ['kind', 'categories', 'series'],
    },
    table: { type: 'object', properties: { header: strArr, rows: { type: 'array', items: { type: 'array', items: str } } }, required: ['header', 'rows'] },
    quote: { type: 'object', properties: { text: str, author: str }, required: ['text'] },
  })
  return {
    type: 'object',
    properties: {
      title: str,
      subtitle: str,
      slides: {
        type: 'array',
        items: { type: 'object', properties: slideProps, required: ['type', 'title'] },
      },
    },
    required: ['title', 'slides'],
  }
}

/* ------------------------------------------------------------------ validation */

export interface ValidateResult {
  ok: boolean
  plan: PresentationPlan | null
  errors: string[]
  /** true when the input needed coercion but produced a usable plan */
  repaired: boolean
}

const MARKDOWN_RE = /^[#*`>\-\s]+|[`*]+$/g

function cleanString(v: unknown): string {
  if (typeof v !== 'string') return ''
  return v
    .replace(MARKDOWN_RE, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanList(v: unknown, max = 8): string[] {
  const raw = Array.isArray(v) ? v : typeof v === 'string' ? v.split(/\r?\n/) : []
  const out: string[] = []
  for (const item of raw) {
    const line = cleanString(item).replace(/^[-•*\d.)\s]+/, '').trim()
    if (line) out.push(line)
    if (out.length >= max) break
  }
  return out
}

function toNumber(v: unknown): number | null {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').replace(/[^\d.-]/g, ''))
  return Number.isFinite(n) ? n : null
}

/**
 * Validate + repair a provider answer into a `PresentationPlan`.
 * Never throws: a plan it cannot salvage comes back with ok=false so the caller falls back.
 */
export function validatePlan(raw: unknown): ValidateResult {
  const errors: string[] = []
  let repaired = false
  const root = (raw ?? {}) as Record<string, unknown>
  const slidesRaw = Array.isArray(root.slides) ? root.slides : raw && Array.isArray(raw) ? (raw as unknown[]) : null

  if (!slidesRaw) {
    return { ok: false, plan: null, errors: ['no slides array'], repaired: false }
  }

  const title = cleanString(root.title) || cleanString((slidesRaw[0] as Record<string, unknown>)?.title)
  if (!title) errors.push('missing deck title')

  const slides: SlidePlan[] = []
  for (const item of slidesRaw.slice(0, 30)) {
    const s = (item ?? {}) as Record<string, unknown>
    const planTitle = cleanString(s.title)
    if (!planTitle) {
      repaired = true
      continue
    }
    let type = cleanString(s.type).toLowerCase() as SlideType
    if (!(SLIDE_TYPES as readonly string[]).includes(type)) {
      type = guessType(s)
      repaired = true
    }
    const plan: SlidePlan = { type, title: planTitle.slice(0, 120) }
    const subtitle = cleanString(s.subtitle)
    if (subtitle) plan.subtitle = subtitle.slice(0, 160)

    const bullets = cleanList(s.bullets ?? s.points ?? s.takeaways)
    if (bullets.length) plan.bullets = bullets

    const statsRaw = Array.isArray(s.stats) ? s.stats : []
    const stats = statsRaw
      .map((st) => {
        const o = (st ?? {}) as Record<string, unknown>
        const value = cleanString(o.value) || String(toNumber(o.value) ?? '')
        const label = cleanString(o.label) || cleanString(o.text)
        return value ? { value: value.slice(0, 12), label: label.slice(0, 80) } : null
      })
      .filter((x): x is PlanStat => !!x)
    if (stats.length) plan.stats = stats

    const cmp = s.comparison as Record<string, unknown> | undefined
    if (cmp && typeof cmp === 'object') {
      const col = (c: unknown) => {
        const o = (c ?? {}) as Record<string, unknown>
        return { title: cleanString(o.title) || '—', points: cleanList(o.points, 5) }
      }
      const left = col(cmp.left)
      const right = col(cmp.right)
      if (left.points.length || right.points.length) plan.comparison = { left, right }
    }

    const steps = cleanList(s.steps, 6)
    if (steps.length) plan.steps = steps

    const timelineRaw = Array.isArray(s.timeline) ? s.timeline : []
    const timeline = timelineRaw
      .map((t) => {
        const o = (t ?? {}) as Record<string, unknown>
        const when = cleanString(o.when) || cleanString(o.label)
        const what = cleanString(o.what) || cleanString(o.text)
        return when || what ? { when: when.slice(0, 24), what: what.slice(0, 90) } : null
      })
      .filter((x): x is { when: string; what: string } => !!x)
    if (timeline.length) plan.timeline = timeline

    const chart = s.chart as Record<string, unknown> | undefined
    if (chart && typeof chart === 'object') {
      const kind = cleanString(chart.kind).toLowerCase()
      const categories = cleanList(chart.categories, 8)
      const seriesRaw = Array.isArray(chart.series) ? chart.series : []
      const series = seriesRaw
        .map((sr) => {
          const o = (sr ?? {}) as Record<string, unknown>
          const name = cleanString(o.name) || 'series'
          const values = Array.isArray(o.values) ? o.values.map(toNumber).map((n) => n ?? 0).slice(0, 8) : []
          return values.length ? { name: name.slice(0, 40), values } : null
        })
        .filter((x): x is { name: string; values: number[] } => !!x)
      if (['bar', 'barh', 'line', 'area', 'pie', 'donut'].includes(kind) && categories.length && series.length) {
        const insight = cleanString(chart.insight)
        plan.chart = {
          kind: (kind === 'barh' ? 'barH' : kind) as PlanChart['kind'],
          categories,
          series,
          ...(insight ? { insight: insight.slice(0, 160) } : {}),
        }
      }
    }

    const table = s.table as Record<string, unknown> | undefined
    if (table && typeof table === 'object') {
      const header = cleanList(table.header, 6)
      const rowsRaw = Array.isArray(table.rows) ? table.rows : []
      const rows = rowsRaw
        .map((r) => cleanList(r, 6))
        .filter((r) => r.length)
        .slice(0, 8)
      if (header.length && rows.length) plan.table = { header, rows }
    }

    const quote = s.quote as Record<string, unknown> | undefined
    const quoteText = cleanString(quote?.text) || cleanString(s.quote)
    if (quoteText) plan.quote = { text: quoteText.slice(0, 220), author: cleanString(quote?.author).slice(0, 60) || undefined }

    const visual = cleanString(s.visual).toLowerCase()
    if (['chart', 'image', 'icon', 'none'].includes(visual)) plan.visual = visual as SlidePlan['visual']
    const imageQuery = cleanString(s.imageQuery)
    if (imageQuery) plan.imageQuery = imageQuery.slice(0, 90)
    const notes = cleanString(s.notes)
    if (notes) plan.notes = notes.slice(0, 400)

    slides.push(plan)
  }

  if (slides.length < 2) {
    errors.push(`only ${slides.length} usable slide(s)`)
    return { ok: false, plan: slides.length ? { title: title || 'عرض', slides } : null, errors, repaired }
  }

  return { ok: true, plan: { title: title || slides[0].title, subtitle: cleanString(root.subtitle) || undefined, slides }, errors, repaired }
}

function guessType(s: Record<string, unknown>): SlideType {
  if (s.stats) return 'statistics'
  if (s.comparison) return 'comparison'
  if (s.chart) return 'chart'
  if (s.table) return 'table'
  if (s.quote) return 'quote'
  if (s.timeline) return 'timeline'
  if (s.steps) return 'process'
  return 'content'
}

/* ------------------------------------------------------------------ structure */

export interface StructureOptions {
  lang: 'ar' | 'en' | 'fr'
  min: number
  max: number
  /** used to synthesize a cover/closing when the plan lacks them */
  fallbackTitles: { cover: string; closing: string }
}

/**
 * Structural guarantees that hold for every deck regardless of provider:
 * cover first, closing last, slide count inside the requested budget.
 */
export function enforceStructure(plan: PresentationPlan, opts: StructureOptions): { plan: PresentationPlan; fixes: string[] } {
  const fixes: string[] = []
  const slides = [...plan.slides]

  if (slides[0]?.type !== 'cover') {
    const t = slides[0]?.title || opts.fallbackTitles.cover
    slides.unshift({ type: 'cover', title: plan.title || t, subtitle: plan.subtitle })
    fixes.push('cover')
  }
  if (slides[slides.length - 1]?.type !== 'closing') {
    slides.push({ type: 'closing', title: opts.fallbackTitles.closing, bullets: slides.slice(-4, -1).map((s) => s.title).slice(0, 3) })
    fixes.push('closing')
  }

  // An agenda earns its place only in longer decks.
  if (slides.length >= 7 && !slides.some((s) => s.type === 'agenda')) {
    slides.splice(1, 0, { type: 'agenda', title: agendaTitle(opts.lang), bullets: slides.slice(2, 6).map((s) => s.title) })
    fixes.push('agenda')
  }

  const clamped = slides.slice(0, opts.max)
  if (clamped.length !== slides.length) fixes.push('count')
  return { plan: { ...plan, slides: clamped }, fixes }
}

function agendaTitle(lang: 'ar' | 'en' | 'fr'): string {
  return lang === 'ar' ? 'خريطة العرض' : lang === 'fr' ? 'Ce que nous allons voir' : 'What we will cover'
}
