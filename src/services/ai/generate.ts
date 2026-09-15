/**
 * Create-with-AI — the orchestrator.
 *
 *   prompt → understanding → planning (provider or local) → structure → content quality
 *          → design system → visuals → animations → Presentation (real elements)
 *
 * The AI decides the *story* (types, copy, data); the layout engine keeps geometry; this file
 * runs the stages and reports progress so the UI can show a live preview instead of a spinner.
 *
 * Guarantees:
 *  • never throws a broken deck at the user — every provider failure falls back one layer down;
 *  • regeneration touches only what it should (one slide, or the whole deck — never silently);
 *  • output is always Presentation → Slides → Elements, i.e. fully editable + exportable.
 */
import { createShape } from '../../document/factory'
import type { Presentation, Slide } from '../../document/types'
import type { DeckSpec, SlideSpec } from '../../templates/engine'
import { instantiateSlide } from '../../templates/engine'
import { buildTheme, brandFor, type DesignStyleId } from './design'
import { suggestSlideAnimations } from './animate'
import { detectLang, inferCategory, inferCount, localPlan, packFor, providerPlan, type GenerateBrief, type GenCategory } from './planner'
import { composeDeck, polish } from './composer'
import { enforceStructure, type PresentationPlan } from './schema'
import { resolveProvider, type EngineKind } from './provider'
import { useUI } from '../../store/useUI'
import { useDoc } from '../../store/useDoc'

export interface GenerateOptions {
  slides?: number
  lang?: 'ar' | 'en' | 'fr'
  category?: GenCategory
  audience?: string
  style?: DesignStyleId
  aspect?: '16:9' | '4:3'
  brandKitId?: string
  tone?: string
  density?: 'short' | 'balanced' | 'rich'
  /** the caller builds slides progressively itself (Create page live preview) */
  skipBuild?: boolean
  onStage?: (stage: string, done: number, total: number) => void
  /** richer progress for the Create page: stages + the plan as soon as it exists */
  onProgress?: (p: GenerateProgress) => void
}

export type GenerateStage = 'understanding' | 'planning' | 'structure' | 'content' | 'design' | 'visuals' | 'animate' | 'done'

export interface GenerateProgress {
  stage: GenerateStage
  message: string
  done: number
  total: number
  plan?: PresentationPlan
  slidesDone?: number
  engine?: EngineKind
  engineDetail?: string
}

export interface GenerateResult {
  spec: DeckSpec
  /** presentation built from the spec (already themed, 4:3-reflowed, animations suggested) */
  doc: Presentation
  engine: EngineKind
  engineDetail: string
  outline: string[]
  quality: { dedupedTitles: number; trimmedBullets: number; shortenedBullets: number }
  animationsApplied: number
  brief: GenerateBrief
}

const STAGE_LABEL: Record<GenerateStage, string> = {
  understanding: 'فهم فكرتك…',
  planning: 'تخطيط العرض…',
  structure: 'بناء هيكل الشرائح…',
  content: 'كتابة المحتوى…',
  design: 'تطبيق نظام التصميم…',
  visuals: 'إضافة العناصر البصرية…',
  animate: 'اقتراح الحركة…',
  done: 'اكتمل العرض',
}

const STAGES: GenerateStage[] = ['understanding', 'planning', 'structure', 'content', 'design', 'visuals', 'animate', 'done']

function defaultAudience(lang: 'ar' | 'en' | 'fr'): string {
  return lang === 'ar' ? 'جمهور مهتم بالموضوع' : lang === 'fr' ? 'audience professionnelle' : 'a general professional audience'
}

function defaultTone(lang: 'ar' | 'en' | 'fr'): string {
  return lang === 'ar' ? 'واثقة ومباشرة' : lang === 'fr' ? 'assurée et directe' : 'confident and direct'
}

function understand(prompt: string, opts: GenerateOptions): GenerateBrief {
  const topic = prompt.trim().replace(/\s+/g, ' ')
  const lang = opts.lang ?? detectLang(topic)
  const category = opts.category ?? inferCategory(topic)
  const ai = useUI.getState().ai
  const toneBySetting: Record<string, string> = { neutral: defaultTone(lang), formal: lang === 'ar' ? 'رسمية ورصينة' : lang === 'fr' ? 'formelle et posée' : 'formal and measured', friendly: lang === 'ar' ? 'ودّية وقريبة' : lang === 'fr' ? 'chaleureuse et directe' : 'warm and direct', punchy: lang === 'ar' ? 'مكثّفة وحاسمة' : lang === 'fr' ? 'carrée et percutante' : 'tight and punchy' }
  return {
    topic,
    lang,
    category,
    audience: opts.audience?.trim() || defaultAudience(lang),
    tone: opts.tone || toneBySetting[ai.tone] || defaultTone(lang),
    count: Math.max(4, Math.min(30, opts.slides ?? inferCount(topic))),
    density: opts.density ?? ai.density,
    style: opts.style ?? inferStyle(topic, lang),
  }
}

function inferStyle(topic: string, _lang?: 'ar' | 'en' | 'fr'): DesignStyleId {
  const t = topic.toLowerCase()
  if (/(بسيط|minimal|clean|هادئ|épuré|minimaliste)/.test(t)) return 'minimal'
  if (/(إبداع|ابداع|creative|جريء|فني|créatif|audacieux)/.test(t)) return 'creative'
  if (/(سينما|cinematic|درامي|غامق|dark)/.test(t)) return 'cinematic'
  if (/(أنيق|راقي|elegant|élégant|فخم|luxury)/.test(t)) return 'elegant'
  if (/(حديث|modern|عصري|contemporain)/.test(t)) return 'modern'
  if (/(بحث|academic|thesis|رسالة|أكاديمي|éducation|universit)/.test(t)) return 'elegant'
  return 'professional'
}

export async function generateDeck(prompt: string, opts: GenerateOptions = {}): Promise<GenerateResult> {
  const total = STAGES.length
  const emit = (stage: GenerateStage, extra?: Partial<GenerateProgress>) => {
    opts.onStage?.(STAGE_LABEL[stage], STAGES.indexOf(stage), total)
    opts.onProgress?.({ stage, message: STAGE_LABEL[stage], done: STAGES.indexOf(stage), total, ...extra })
  }

  /* 1 — understanding */
  emit('understanding')
  const brief = understand(prompt, opts)
  const pack = packFor(brief.lang)

  /* 2 — planning: provider if reachable, local planner always ready */
  emit('planning')
  const ai = useUI.getState().ai
  const resolved = await resolveProvider(ai)
  let engine: EngineKind = resolved.engine
  let engineDetail = resolved.reason
  let plan: PresentationPlan | null = resolved.provider ? await providerPlan(brief, resolved.provider) : null
  if (!plan && resolved.provider) {
    engine = 'local'
    engineDetail = `${resolved.reason} — فشل العقد، صياغة محلية`
  }
  if (!plan) plan = localPlan(brief)
  emit('planning', { plan, engine, engineDetail })

  /* 3 — structure guarantees */
  emit('structure')
  plan = enforceStructure(plan, { lang: brief.lang, min: 4, max: brief.count + 4, fallbackTitles: { cover: brief.topic, closing: pack.closing } }).plan

  /* 4 — content quality rules */
  emit('content')
  const polished = polish(plan, brief.lang)
  plan = polished.plan

  /* 5 — design system */
  emit('design')
  const brand = brandFor(await getBrandKits(), opts.brandKitId)
  const theme = buildTheme({ style: brief.style, topic: brief.topic, lang: brief.lang, brand })
  const themeId = brand ? 'brand-kit' : `ai-${brief.style}`

  /* 6 — compose spec + build real elements */
  emit('visuals')
  const spec = composeDeck(plan, brief, { theme, themeId, brandKitId: brand?.id, aspect: opts.aspect ?? '16:9' })
  const doc = opts.skipBuild ? ({} as Presentation) : await buildDocFromSpec(spec)

  /* 7 — animation suggestions through the real engine (skipped when the caller builds progressively) */
  emit('animate')
  let animationsApplied = 0
  if (!opts.skipBuild) {
    for (const slide of doc.slides) {
      const anims = suggestSlideAnimations(slide)
      if (anims.length) {
        slide.animations = anims
        animationsApplied += anims.length
      }
    }
  }

  emit('done')
  return {
    spec,
    doc,
    engine,
    engineDetail,
    outline: plan.slides.map((s) => s.title),
    quality: { dedupedTitles: polished.quality.dedupedTitles, trimmedBullets: polished.quality.trimmedBullets, shortenedBullets: polished.quality.shortenedBullets },
    animationsApplied,
    brief,
  }
}

/* ------------------------------------------------------------------ helpers */

async function getBrandKits() {
  try {
    const { storage } = await import('../../store/storage')
    return await storage.listBrandKits()
  } catch {
    return []
  }
}

/**
 * Build a full Presentation from a DeckSpec without touching any store — used by the Create
 * page for progressive previews and by generateDeck itself. Layouts instantiate synchronously;
 * the await points only keep the UI responsive between chunks.
 */
export async function buildDocFromSpec(
  spec: DeckSpec,
  onSlide?: (index: number, total: number) => void,
): Promise<Presentation> {
  const { instantiateDeck } = await import('../../templates/engine')
  onSlide?.(0, spec.slides.length)
  const doc = instantiateDeck(spec)
  onSlide?.(spec.slides.length, spec.slides.length)
  return doc
}

/* ------------------------------------------------------------------ slide regeneration */

export interface RegenerateSlideInput {
  doc: Presentation
  index: number
  instruction?: string
  /** keep speaker notes even when the slide is rebuilt */
  keepNotes?: boolean
}

export interface RegenerateSlideResult {
  spec: SlideSpec
  source: 'provider' | 'local-heuristic'
  summary: string
}

/**
 * Replan ONE slide. The rest of the deck is untouched — the caller splices the new elements into
 * the store (single undo step). Provider path re-asks only for this slide with deck context;
 * local path applies instruction heuristics (more visual / simpler / shorter / professional…).
 */
export async function regenerateSlideSpec(input: RegenerateSlideInput): Promise<RegenerateSlideResult | null> {
  const { doc, index, instruction } = input
  const slide = doc.slides[index]
  if (!slide) return null
  const lang = doc.metadata.lang
  const outline = doc.slides.map((s) => firstTitle(s)).filter(Boolean)
  const instructionText = (instruction ?? '').trim()

  const ai = useUI.getState().ai
  const resolved = await resolveProvider(ai)
  if (resolved.provider) {
    const brief: GenerateBrief = {
      topic: doc.metadata.title,
      lang,
      category: 'general',
      audience: doc.metadata.subject || defaultAudience(lang),
      tone: defaultTone(lang),
      count: doc.slides.length,
      density: 'balanced',
      style: 'professional',
    }
    const plan = await providerPlan(
      brief,
      resolved.provider,
      [
        `هذه شريحة واحدة من عرض موجود. عنوان العرض: ${doc.metadata.title}.`,
        `الشرائح المحيطة: ${outline.join(' · ')}.`,
        `الشريحة الحالية (${index + 1}/${doc.slides.length}): ${describeSlide(slide)}`,
        instructionText ? `مطلوب التعديل: ${instructionText}` : 'أعد صياغة الشريحة بشكل أفضل مع الحفاظ على معلوماتها الأساسية.',
        'أعد JSON لعنصر slides واحد فقط (بنفس عقد الأنواع).',
      ].join('\n'),
    )
    const planSlide = plan?.slides?.find((sl) => sl.type !== 'cover' && sl.type !== 'closing') ?? plan?.slides?.[0]
    if (planSlide) {
      // One slide in, one slide out — no structural insertion here (enforceStructure is for whole decks).
      const { planToSlideSpecs } = await import('./composer')
      const [spec] = planToSlideSpecs({ title: doc.metadata.title, slides: [planSlide] }, { ...brief, style: 'professional' }, 'business')
      return { spec, source: 'provider', summary: `أعاد ${resolved.provider.model()} صياغة الشريحة` }
    }
  }

  const heuristic = localSlideHeuristic(slide, doc, instructionText)
  return heuristic ? { spec: heuristic, source: 'local-heuristic', summary: 'صياغة محلية للشريحة (قواعد بنيوية)' } : null
}

function firstTitle(slide: Slide): string {
  const t = slide.elements.find((e) => e.role === 'title' && e.kind === 'text')
  return t && t.kind === 'text' ? t.content.replace(/<[^>]+>/g, ' ').trim().slice(0, 60) : slide.name ?? ''
}

function describeSlide(slide: Slide): string {
  const parts: string[] = []
  for (const el of slide.elements) {
    if (el.kind === 'text' && el.role) {
      const text = el.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      if (text) parts.push(`${el.role}: ${text.slice(0, 90)}`)
    }
    if (el.kind === 'chart') parts.push(`chart(${el.chart}): ${el.categories.join(',')}`)
    if (el.kind === 'table') parts.push('table')
  }
  return parts.join(' | ').slice(0, 900) || 'شريحة فارغة تقريبًا'
}

const VISUAL_LAYOUTS = ['image-text', 'statistics', 'chart']

/** Local, deterministic one-slide transformation honoring the instruction keywords. */
function localSlideHeuristic(slide: Slide, doc: Presentation, instruction: string): SlideSpec | null {
  const text = instruction.toLowerCase()
  const wantsVisual = /(visual|بصري|صورة|صور|image|chart|رسم|بيان)/.test(text)
  const wantsSimple = /(simplif|بسّط|بسيط|simpler|أقل)/.test(text)
  const wantsShort = /(short|اختصار|قصّر|اختصر)/.test(text)
  const wantsPro = /(professional|مهني|احتراف|رسمي)/.test(text)
  const currentLayout = slide.layoutId

  const content: SlideSpec['content'] = {}
  let layout = currentLayout

  for (const el of slide.elements) {
    if (el.kind !== 'text' || !el.role || el.role === 'decoration' || el.role === 'footer') continue
    // Block tags become line breaks BEFORE stripping, so list items never fuse into one run-on.
    const plain = el.content
      .replace(/<\/?(p|li|ul|ol|br)(\s[^>]*)?\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .trim()
    if (!plain) continue
    if (el.role === 'list' || el.role === 'body') {
      const lines = plain.split(/\n+/).map((l) => l.trim()).filter(Boolean)
      const trimmed = wantsSimple || wantsShort ? lines.slice(0, Math.max(2, Math.ceil(lines.length / 2))) : lines
      content.body = trimmed
    } else if (!content[el.role]) {
      content[el.role] = plain
    }
  }

  if (wantsVisual && !VISUAL_LAYOUTS.includes(currentLayout)) {
    const hasNumbers = slide.elements.some((e) => e.kind === 'text' && /\d/.test(e.content))
    layout = hasNumbers ? 'statistics' : 'image-text'
  }
  if (wantsPro) {
    content.kicker = content.kicker || ''
  }

  const changed = layout !== currentLayout || wantsSimple || wantsShort || wantsVisual
  if (!changed) return null
  return {
    layout,
    content,
    bg: layout === 'image-text' ? 'default' : slide.background.type === 'solid' && slide.background.color === doc.theme.palette.primary ? 'primary' : 'default',
  }
}

/* ------------------------------------------------------------------ editor operations */

/**
 * Regenerate the CURRENT slide inside the editor. One undo step, same slide id, user assets and
 * speaker notes preserved. The rest of the deck is never touched (requirement 14).
 */
export async function regenerateCurrentSlide(instruction?: string): Promise<{ summary: string; source: string } | null> {
  const { doc, slideIndex } = useDoc.getState()
  const slide = doc.slides[slideIndex]
  if (!slide) return null
  const result = await regenerateSlideSpec({ doc, index: slideIndex, instruction })
  if (!result) return null

  const assets: Record<string, import('../../document/types').AssetRef> = {}
  const rebuilt = instantiateSlide(result.spec, doc.theme, doc.metadata.dir, slideIndex, assets)
  useDoc.getState().mutate(
    (d) => {
      const target = d.slides[slideIndex]
      if (!target || target.id !== slide.id) return
      target.layoutId = rebuilt.layoutId
      target.elements = rebuilt.elements
      target.background = rebuilt.background
      if (rebuilt.notes) target.notes = rebuilt.notes
      for (const [k, v] of Object.entries(assets)) d.assets[k] = v
    },
    `إعادة توليد الشريحة · ${result.source === 'provider' ? 'المزوّد' : 'محليًا'}`,
  )
  return { summary: result.summary, source: result.source }
}

export type SlideDesignAction = 'more-visual' | 'simplify' | 'hierarchy' | 'shorten' | 'professional' | 'creative'

const DESIGN_ACTION_META: Record<SlideDesignAction, { label: string; instruction: string }> = {
  'more-visual': { label: 'اجعلها أكثر بصرية', instruction: 'اجعل الشريحة أكثر بصرية — حولها إلى شريحة إحصاءات أو صورة+نص حسب محتواها.' },
  simplify: { label: 'بسّط', instruction: 'بسّط الشريحة: نقاط أقل وجمل أقصر.' },
  hierarchy: { label: 'تسلسل هرمي أوضح', instruction: 'أضف تسلسلًا هرميًا أوضح للشريحة.' },
  shorten: { label: 'اختصر المحتوى', instruction: 'اختصر محتوى الشريحة إلى النصف.' },
  professional: { label: 'أكثر مهنية', instruction: 'اجعل الشريحة أكثر مهنية ورسمية.' },
  creative: { label: 'أكثر إبداعًا', instruction: 'اجعل الشريحة أكثر إبداعًا وجرأة بصرية.' },
}

export const SLIDE_DESIGN_ACTIONS = Object.entries(DESIGN_ACTION_META).map(([id, meta]) => ({ id: id as SlideDesignAction, ...meta }))

/**
 * Slide-level AI design actions (requirement 10). Deterministic first: each action has a local
 * structural implementation through the SAME regenerate/regine primitives, so everything stays
 * undoable and on-theme.
 */
export async function applyDesignAction(action: SlideDesignAction): Promise<string> {
  const meta = DESIGN_ACTION_META[action]
  if (action === 'hierarchy') {
    const { improveSlideDesign } = await import('./refine')
    const { doc, slideIndex } = useDoc.getState()
    const changed = improveSlideDesign(doc.slides[slideIndex])
    return changed ? `طُبِّق التسلسل الهرمي (${changed} تعديل)` : 'الشريحة مضبوطة هرميًا بالفعل.'
  }
  if (action === 'simplify' || action === 'shorten') {
    const { doc, slideIndex } = useDoc.getState()
    const slide = doc.slides[slideIndex]
    const target = action === 'simplify' ? 3 : 0
    let touched = 0
    // Compute first; only commit when something actually changed (no empty history entries).
    const draft = structuredClone(slide)
    const apply = (s: typeof draft) => {
      for (const el of s.elements) {
        if (el.kind !== 'text' || (el.role !== 'body' && el.role !== 'list')) continue
        const isList = /<ul|<ol/i.test(el.content)
        let lines = el.content.replace(/<\/?(p|li|ul|ol|br)(\s[^>]*)?\/?>/gi, '\n').replace(/<[^>]+>/g, '').split(/\n+/).map((l) => l.trim()).filter(Boolean)
        if (isList && target && lines.length > target) lines = lines.slice(0, target)
        if (action === 'shorten') lines = lines.map((l) => l.split(/\s+/).slice(0, Math.max(4, Math.ceil(l.split(/\s+/).length * 0.55))).join(' '))
        const html = isList && lines.length > 1 ? `<ul>${lines.map((l) => `<li>${l}</li>`).join('')}</ul>` : lines.map((l) => `<p>${l}</p>`).join('')
        if (html && html !== el.content) {
          el.content = html
          touched++
        }
      }
    }
    apply(draft)
    if (!touched) return 'المحتوى مضغوط بالفعل.'
    useDoc.getState().mutate((d) => {
      const s = d.slides[slideIndex]
      if (!s || s.id !== slide.id) return
      for (const [i, el] of s.elements.entries()) {
        const next = draft.elements[i]
        if (el.kind === 'text' && next && next.kind === 'text' && next.content !== el.content) el.content = next.content
      }
    }, meta.label)
    return `${meta.label}: ${touched} عنصرًا`
  }
  if (action === 'professional') {
    const { doc, slideIndex } = useDoc.getState()
    const slide = doc.slides[slideIndex]
    useDoc.getState().mutate((d) => {
      const s = d.slides[slideIndex]
      if (!s || s.id !== slide.id) return
      for (const el of s.elements) {
        el.rotation = 0
        if (el.kind === 'text') {
          el.font.bold = el.role === 'title' || el.role === 'kicker' || el.role === 'stat'
          el.font.italic = false
        }
      }
    }, meta.label)
    const res = await regenerateCurrentSlide(undefined)
    return res ? `${meta.label} — ${res.summary}` : meta.label
  }
  if (action === 'creative') {
    const { doc, slideIndex } = useDoc.getState()
    const slide = doc.slides[slideIndex]
    useDoc.getState().mutate((d) => {
      const s = d.slides[slideIndex]
      if (!s || s.id !== slide.id) return
      const title = s.elements.find((e) => e.kind === 'text' && e.role === 'title')
      if (title && title.kind === 'text') title.font.color = d.theme.palette.accent
      const hasAccent = s.elements.some((e) => e.role === 'decoration')
      if (!hasAccent) {
        s.elements.unshift(createShape(d.theme, { shape: 'roundRect', x: doc.size.w - 150, y: 56, w: 64, h: 10, fill: { type: 'solid', color: d.theme.palette.accent }, name: 'لمسة إبداعية' }))
      }
    }, meta.label)
    return meta.label
  }
  // more-visual → structural regeneration through the layout engine
  const res = await regenerateCurrentSlide(meta.instruction)
  return res ? `${meta.label} — ${res.summary}` : 'لم يكن هناك ما يتحسن — الشريحة بصرية بالفعل.'
}


