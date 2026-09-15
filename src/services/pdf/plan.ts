/**
 * Presentation planner — the "understanding → slides" bridge.
 *
 * Takes the structured sections and decides: how many slides, which layout each
 * gets (mapped to the platform's real layout library), and the copy per role.
 * Output is a DeckSpec — the same contract the AI generator uses — so the result
 * flows through instantiateDeck() into fully editable elements.
 *
 * Layout mapping (archetype → platform layout):
 *   concept → title-content / two-columns   stats → statistics
 *   comparison → comparison                 timeline → timeline
 *   process → process                       quote → quote
 *   table → table                           showcase → image-text / full-image
 *   cover → title                           section → section   closing → closing
 */
import type { DeckSpec, SlideSpec, TemplateCategory } from '../../templates/engine'
import { chunkBullets, compressParagraphs, type SectionContent } from './understand'
import type { StructuredDocument } from './types'

export interface PlanOptions {
  /** Target slide count (the planner compresses/expands to approach it). */
  targetSlides?: number
  /** Design mode. */
  mode?: 'redesign' | 'brand'
  lang?: 'ar' | 'en' | 'fr'
}

export interface PlannedSlide extends SlideSpec {
  sourceSection?: string
  sourcePage?: number
}

export interface PresentationPlan {
  spec: DeckSpec
  mode: 'redesign' | 'brand'
  /** Extra mapping the deck builder needs (real images / tables per slide). */
  meta: Array<{
    slideIndex: number
    imageId?: string
    tableId?: string
  }>
  warnings: string[]
}

const THEME_BY_CATEGORY: Record<TemplateCategory, string> = {
  business: 'corporate-ink',
  report: 'corporate-ink',
  education: 'edu-teal',
  pitch: 'startup-violet',
  marketing: 'marketing-pop',
  academic: 'academic-serif',
  startup: 'startup-violet',
  portfolio: 'startup-violet',
  personal: 'sand-editorial',
  minimal: 'mono-minimal',
  modern: 'startup-violet',
  creative: 'startup-violet',
}

export function inferCategory(doc: StructuredDocument): TemplateCategory {
  const sample = doc.pages.slice(0, 12).map((p) => p.elements.map((e) => e.text ?? '').join(' ')).join(' ')
  const t = sample.toLowerCase()
  const has = (words: string[]) => words.some((w) => t.includes(w))
  if (has(['بحث', 'رسالة', 'thesis', 'منهج', 'المنهجية', 'abstract', 'مراجع', 'دراسة'])) return 'academic'
  if (has(['تقرير', 'quarterly', 'نتائج', 'أداء', 'report', 'إيرادات', 'revenue'])) return 'report'
  if (has(['درس', 'وحدة', 'تعليم', 'الطلاب', 'lesson', 'course', 'أهداف التعلم'])) return 'education'
  if (has(['تسويق', 'حملة', 'جمهور', 'علامة', 'marketing', 'brand', 'campaign'])) return 'marketing'
  if (has(['استثمار', 'مستثمر', 'pitch', 'startup', 'تمويل', 'حصة'])) return 'pitch'
  if (has(['مشروع', 'خطة', 'استراتيجية', 'project', 'strategy'])) return 'business'
  return 'business'
}

/** Base theme id — 'brand' mode re-colors it after instantiation (see buildDeck). */
export function themeForCategory(category: TemplateCategory): string {
  return THEME_BY_CATEGORY[category] ?? 'corporate-ink'
}

export function planPresentation(doc: StructuredDocument, sections: SectionContent[], opts: PlanOptions = {}): PresentationPlan {
  const lang = opts.lang ?? (doc.language === 'en' ? 'en' : doc.language === 'fr' ? 'fr' : 'ar')
  const rtl = lang === 'ar'
  const category = inferCategory(doc)
  const target = opts.targetSlides ?? Math.max(6, Math.min(24, Math.round(doc.pageCount / 3)))
  const mode = opts.mode ?? 'redesign'
  const warnings: string[] = []

  const slides: PlannedSlide[] = []
  const meta: PresentationPlan['meta'] = []

  const push = (slide: PlannedSlide, extra?: { imageId?: string; tableId?: string }) => {
    meta.push({ slideIndex: slides.length, ...extra })
    slides.push(slide)
  }

  // ---- cover
  const firstTitle = doc.outline.find((o) => o.level === 1)?.text ?? doc.outline[0]?.text ?? doc.fileName.replace(/\.pdf$/i, '')
  const firstPage = doc.pages[0]
  const subtitleEl = firstPage?.elements.find((e) => e.type === 'paragraph' || e.type === 'kv')
  push({
    layout: 'title',
    content: {
      title: firstTitle.slice(0, 90),
      subtitle: (subtitleEl?.text ?? '').slice(0, 140) || undefined,
      kicker: undefined,
    },
    sourcePage: 0,
  }, { imageId: doc.pages[0]?.images.find((im) => im.kind === 'image')?.id })

  // ---- agenda (top-level headings, capped)
  const agenda = doc.outline.filter((o) => o.level <= 2).map((o) => o.text)
  const agendaItems = [...new Set(agenda)].slice(0, 5)
  if (agendaItems.length >= 3 && target >= 7) {
    push({ layout: 'title-content', content: { title: rtl ? 'محاور العرض' : 'Agenda', list: agendaItems } })
  }

  // ---- section slides
  const budget = Math.max(3, target - slides.length - 2) // keep room for closing
  const perSection = distributeBudget(sections.map(sectionWeight), budget)

  sections.forEach((section, si) => {
    const n = perSection[si] ?? 1
    const rtlSection = rtl
    emitSection(section, n, rtlSection, doc, push, warnings, si)
  })

  // ---- closing
  const closingTakeaways = sections.slice(0, 4).map((s) => s.title)
  push({
    layout: 'closing',
    content: {
      title: rtl ? 'شكرًا لكم' : 'Thank you',
      body: closingTakeaways.slice(0, 3).join(' · ').slice(0, 160) || undefined,
    },
  })

  const spec: DeckSpec = {
    id: `pdf-${Date.now().toString(36)}`,
    title: firstTitle.slice(0, 80),
    subject: rtl ? 'مُنشأ تلقائيًا من ملف PDF' : 'Auto-generated from a PDF document',
    author: 'KADMATI PDF Import',
    lang: lang === 'fr' ? 'fr' : lang,
    dir: rtl ? 'rtl' : 'ltr',
    themeId: themeForCategory(category),
    categories: [category],
    tags: ['pdf', category],
    slides,
  }

  if (doc.stats.scannedPages > 0) {
    warnings.push(`${doc.stats.scannedPages} صفحة ممسوحة ضوئيًا — نصوصها من OCR وقد تحتاج مراجعة.`)
  }
  const lowConf = sections.filter((s) => s.paragraphs.length + s.bullets.length === 0).length
  if (lowConf > 0) warnings.push(`${lowConf} قسمًا بلا محتوى نصي كافٍ — راجع فاحص البنية.`)

  return { spec, meta, warnings, mode }
}

function emitSection(
  section: SectionContent,
  budget: number,
  rtl: boolean,
  doc: StructuredDocument,
  push: (slide: PlannedSlide, extra?: { imageId?: string; tableId?: string }) => void,
  warnings: string[],
  si: number,
): void {
  const title = section.title.slice(0, 90)

  // table sections always get their table
  if (section.archetype === 'table' && section.table) {
    push({ layout: 'table', content: { title } }, { tableId: section.table.id })
    budget -= 1
  }

  // stats
  if (section.archetype === 'stats' && section.stats.length) {
    const stats = section.stats.slice(0, 3)
    const labels = compressParagraphs(section.paragraphs, stats.length, rtl).map((s) => s.slice(0, 70))
    while (labels.length < stats.length) labels.push(title.slice(0, 40))
    push({
      layout: 'statistics',
      content: { title, stat: stats.map((s) => s.value), body: labels },
    }, { imageId: section.images[0]?.id })
    budget -= 1
  }

  // timeline / process
  if ((section.archetype === 'timeline' || section.archetype === 'process') && section.bullets.length >= 3 && budget > 0) {
    const items = section.bullets.slice(0, 4).map((b) => b.slice(0, 90))
    push({
      layout: section.archetype === 'timeline' ? 'timeline' : 'process',
      content: { title, list: items },
    })
    budget -= 1
  }

  // comparison
  if (section.archetype === 'comparison' && budget > 0) {
    const lines = section.bullets.length >= 2 ? section.bullets.slice(0, 6) : compressParagraphs(section.paragraphs, 4, rtl)
    push({ layout: 'comparison', content: { title, list: lines.map((l) => l.slice(0, 80)) } }, { imageId: section.images[0]?.id })
    budget -= 1
  }

  // quote
  if (section.archetype === 'quote' && section.quotes[0] && budget > 0) {
    push({ layout: 'quote', content: { quote: section.quotes[0].slice(0, 200), title } })
    budget -= 1
  }

  // image showcase
  if (section.archetype === 'showcase' && section.images.length && budget > 0) {
    const img = section.images[0]
    const body = compressParagraphs(section.paragraphs, 2, rtl).join(' ').slice(0, 240)
    push({ layout: 'image-text', content: { title, body: body || undefined } }, { imageId: img.id })
    budget -= 1
  }

  // concept / leftover → bullets or text slides
  const bullets = section.bullets.filter((b) => b.length > 1)
  const paragraphs = compressParagraphs(section.paragraphs, Math.max(2, budget * 2), rtl)
  let remaining = Math.max(budget, 1)

  if (bullets.length) {
    const groups = chunkBullets(bullets, 5).slice(0, remaining)
    groups.forEach((group, gi) => {
      push({
        layout: gi === 0 && section.images.length ? 'image-text' : 'title-content',
        content: { title: groups.length > 1 && gi > 0 ? `${title} (${gi + 1})` : title, list: group.map((b) => b.slice(0, 120)) },
      }, gi === 0 && section.images.length ? { imageId: section.images[0].id } : undefined)
      remaining -= 1
    })
  } else if (paragraphs.length) {
    const merged = paragraphs.join(' ')
    push({ layout: 'title-content', content: { title, body: merged.slice(0, 520) } })
    remaining -= 1
  } else if (section.images.length && budget > 0) {
    push({ layout: 'full-image', content: { title } }, { imageId: section.images[0].id })
    remaining -= 1
  } else {
    warnings.push(`قسم «${title}» بلا محتوى كافٍ — حُذف.`)
  }

  // leftover images when the section got rich content: extra showcase slide
  if (remaining > 0 && section.images.length > 1) {
    push({ layout: 'image-text', content: { title, body: section.images[1].caption?.slice(0, 160) } }, { imageId: section.images[1].id })
  }
  void doc
  void si
}

function sectionWeight(s: SectionContent): number {
  const base = s.paragraphs.join(' ').length / 400 + s.bullets.length / 5 + s.stats.length / 3 + (s.table ? 1 : 0) + (s.images.length ? 0.5 : 0)
  return Math.max(0.3, Math.min(3, base))
}

function distributeBudget(weights: number[], budget: number): number[] {
  const total = weights.reduce((a, b) => a + b, 0) || 1
  const raw = weights.map((w) => Math.max(1, Math.round((w / total) * budget)))
  let sum = raw.reduce((a, b) => a + b, 0)
  // trim or pad toward budget
  const order = weights.map((w, i) => ({ w, i })).sort((a, b) => b.w - a.w)
  let oi = 0
  while (sum > budget && order.length) {
    const idx = order[oi % order.length].i
    if (raw[idx] > 1) {
      raw[idx] -= 1
      sum -= 1
    }
    oi += 1
    if (oi > budget * 4) break
  }
  let pad = 0
  while (sum < budget && pad < weights.length * 2) {
    raw[pad % raw.length] += 1
    sum += 1
    pad += 1
  }
  return raw
}
