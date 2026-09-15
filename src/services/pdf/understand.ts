/**
 * Semantic understanding — from typed elements to meaningful document sections.
 *
 * Sections are segmented by headings; content inside each section is grouped into
 * paragraphs, bullets, stats, quotes, images and tables. Compression rules decide
 * what deserves a slide (a 50-page PDF never becomes 50 slides): sentences are
 * scored by position/length/numbers, long lists are capped and split, and each
 * section is classified into a slide archetype (comparison, timeline, process,
 * stats, concept, …) that drives layout selection later.
 */
import type { PdfElement, PdfImageData, PdfPage, PdfTableData } from './types'

export interface SectionContent {
  title: string
  level: number
  page: number
  paragraphs: string[]
  bullets: string[]
  stats: Array<{ value: string; label?: string }>
  quotes: string[]
  kv: Array<{ label: string; value: string }>
  captions: string[]
  images: PdfImageData[]
  table?: PdfTableData
  archetype: SlideArchetype
}

export type SlideArchetype = 'concept' | 'comparison' | 'timeline' | 'process' | 'stats' | 'quote' | 'table' | 'showcase'

const COMPARISON_HINTS = [/مقارن/, /الفرق بين/, /بشكل? مقابل/, /\bvs\.?\b/i, /\bversus\b/i, /بين (?:الطريق|الأسلوب)/, /مزايا وعيوب/, /pros?\b.*\bcons?/i]
const TIMELINE_HINTS = [/\b(19|20)\d{2}\b/, /[١-٩0-9]{1,4}\s?(هـ|م)\b/, /مراحل?/, /timeline/i, /خطة زمنية/]
const PROCESS_HINTS = [/خطوات?/, /المرحلة (?:الأولى|الثانية|الثالثة)/, /\bstep\s?\d/i, /أولًا|أولاً|ثانيًا|ثم\b|أخيرًا|أخيراً/, /عملية/]
const DATE_TOKEN = /\b(19|20)\d{2}\b|\b[٠-٩]{4}\s?[هـم]\b/

/** Group pages into semantic sections starting at each heading/title. */
export function buildSections(pages: PdfPage[]): SectionContent[] {
  const sections: SectionContent[] = []
  const flat: Array<{ page: PdfPage; el: PdfElement }> = []
  for (const page of pages) for (const el of page.elements) flat.push({ page, el })

  const headingIdx = flat.map((f, i) => ({ f, i })).filter(({ f }) => f.el.type === 'title' || f.el.type === 'heading')

  if (!headingIdx.length) {
    // No headings at all: one section per chunk of content pages.
    const all: SectionContent = emptySection('المحتوى', 1, 0)
    for (const { page, el } of flat) absorb(all, el, page)
    finishSection(all)
    sections.push(all)
    return sections
  }

  headingIdx.forEach((h, hi) => {
    const end = hi + 1 < headingIdx.length ? headingIdx[hi + 1].i : flat.length
    const section = emptySection(h.f.el.text ?? `قسم ${hi + 1}`, h.f.el.level ?? 2, h.f.page.index)
    for (let k = h.i + 1; k < end; k++) absorb(section, flat[k].el, flat[k].page)
    finishSection(section)
    if (sectionHasContent(section)) sections.push(section)
  })

  // Sections that follow no heading (content before the first heading) get folded
  // into the first section, or stand alone if there is a lot of it.
  const firstHeadPage = headingIdx[0]?.f.page.index ?? 0
  const intro = emptySection('مقدمة', 2, 0)
  for (const { page, el } of flat) {
    if (page.index >= firstHeadPage) break
    if (el.type === 'title') continue
    absorb(intro, el, page)
  }
  finishSection(intro)
  if (sectionHasContent(intro)) sections.unshift(intro)

  return sections
}

function emptySection(title: string, level: number, page: number): SectionContent {
  return { title, level, page, paragraphs: [], bullets: [], stats: [], quotes: [], kv: [], captions: [], images: [], archetype: 'concept' }
}

function sectionHasContent(s: SectionContent): boolean {
  return s.paragraphs.length + s.bullets.length + s.stats.length + s.quotes.length + s.kv.length + s.captions.length + s.images.length + (s.table ? 1 : 0) > 0
}

function absorb(section: SectionContent, el: PdfElement, page: PdfPage): void {
  switch (el.type) {
    case 'paragraph': {
      if (!el.text) break
      // split very long paragraphs into sentences — compression works per sentence
      section.paragraphs.push(el.text)
      break
    }
    case 'list':
      for (const item of el.items ?? []) if (item.trim()) section.bullets.push(item.trim())
      break
    case 'stat': {
      const value = (el.text ?? '').trim()
      if (value) section.stats.push({ value })
      break
    }
    case 'quote':
      if (el.text) section.quotes.push(el.text)
      break
    case 'kv': {
      const label = String((el.meta?.label as string) ?? '')
      const value = String((el.meta?.value as string) ?? '')
      if (label && value) section.kv.push({ label, value })
      break
    }
    case 'caption': {
      // attach to the nearest image on the same page (captions travel with figures)
      const cap = el.text ?? ''
      section.captions.push(cap)
      const img = section.images.length ? section.images[section.images.length - 1] : page.images[page.images.length - 1]
      if (img && !img.caption) img.caption = cap
      break
    }
    default:
      break
  }
  // images from the page land in every section whose page range they fall in —
  // handled below by page proximity instead of here
  void page
}

/** Attach page images/tables to the section that owns that page's content. */
export function attachVisuals(sections: SectionContent[], pages: PdfPage[]): void {
  if (!sections.length) return
  const ownerFor = (pageIndex: number): SectionContent => {
    let best = sections[0]
    let bestDist = Infinity
    for (const s of sections) {
      const d = Math.abs(s.page - pageIndex)
      if (d < bestDist) {
        bestDist = d
        best = s
      }
    }
    return best
  }
  for (const page of pages) {
    for (const img of page.images) {
      if (areaOf(img.bbox) < 0.01 * page.width * page.height) continue // decorations/logos
      ownerFor(page.index).images.push(img)
    }
    for (const table of page.tables) {
      const owner = ownerFor(page.index)
      if (!owner.table || table.nRows * table.nCols > owner.table.nRows * owner.table.nCols) owner.table = table
    }
  }
  // archetypes were computed before visuals existed — tables/images can change them
  for (const s of sections) s.archetype = classifyArchetype(s)
}

function areaOf(b: { x: number; y: number; w: number; h: number }): number {
  return Math.max(0, b.w) * Math.max(0, b.h)
}

/** Classify a section into the slide archetype that should present it. */
export function classifyArchetype(section: SectionContent): SlideArchetype {
  const text = [section.title, ...section.paragraphs, ...section.bullets].join(' ')
  if (section.table && section.table.nRows >= 3) return 'table'
  if (section.stats.length >= 2 || (section.stats.length >= 1 && section.paragraphs.join(' ').match(/\d+\s*%|٪/) !== null)) return 'stats'
  const dateHits = (text.match(new RegExp(DATE_TOKEN, 'g')) ?? []).length
  if (dateHits >= 3 || TIMELINE_HINTS.some((r) => r.test(text)) && dateHits >= 2) return 'timeline'
  if (section.bullets.length >= 3 && PROCESS_HINTS.some((r) => r.test(text))) return 'process'
  if (COMPARISON_HINTS.some((r) => r.test(text))) return 'comparison'
  if (section.quotes.length && section.paragraphs.length + section.bullets.length <= 2) return 'quote'
  if (section.images.length && contentWeight(section) < 900) return 'showcase'
  return 'concept'
}

function contentWeight(s: SectionContent): number {
  return s.paragraphs.join(' ').length + s.bullets.join(' ').length
}

function finishSection(section: SectionContent): void {
  section.archetype = classifyArchetype(section)
  section.stats = section.stats.filter((s) => s.value.length <= 16).slice(0, 4)
}

/**
 * Compression: pick the strongest sentences of a paragraph collection.
 * Score = numbers presence + position (early better) + length sanity + keyword density.
 */
export function compressParagraphs(paragraphs: string[], maxSentences: number, rtl: boolean): string[] {
  const sentences: string[] = []
  for (const p of paragraphs) {
    const parts = splitSentences(p, rtl)
    sentences.push(...parts)
  }
  if (sentences.length <= maxSentences) return sentences

  const scored = sentences.map((s, i) => {
    let score = 0
    if (/\d/.test(s)) score += 2
    if (s.length > 40 && s.length < 220) score += 2
    if (i < sentences.length * 0.3) score += 1.5
    if (/^(هو|هي|يعرف|تُعرَّف|تعرف|in short|i\.e)/i.test(s.trim())) score += 1
    score -= Math.max(0, (s.length - 260) / 120)
    return { s, i, score }
  })
  const kept = scored.sort((a, b) => b.score - a.score).slice(0, maxSentences).sort((a, b) => a.i - b.i)
  return kept.map((k) => k.s.trim())
}

function splitSentences(text: string, rtl: boolean): string[] {
  const ends = rtl ? /(?<=[.!؟?؛])\s+/ : /(?<=[.!?])\s+/
  return text.split(ends).map((s) => s.trim()).filter((s) => s.length > 0)
}

/** Split long bullet lists into slide-sized groups. */
export function chunkBullets(bullets: string[], perSlide: number): string[][] {
  const clean = bullets.map((b) => b.trim()).filter(Boolean)
  const out: string[][] = []
  for (let i = 0; i < clean.length; i += perSlide) out.push(clean.slice(i, i + perSlide))
  return out.length ? out : [[]]
}
