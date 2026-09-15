/**
 * Presentation Planner — the strategy layer *before* any slide exists.
 *
 *   prompt → understanding (brief) → outline with slide TYPES → PresentationPlan
 *
 * Two engines, one output shape:
 *  • `localPlan` — a deterministic structural writer. It reads real signals from the prompt
 *    (numbers, comparisons, steps, questions) and builds the deck around them. Offline, free,
 *    private, instant — and it is the guaranteed fallback for every provider failure.
 *  • `providerPlan` — asks the resolved AIProvider for the same PresentationPlan under a strict
 *    JSON contract (schema.ts validates + repairs; one feedback-driven retry; never throws).
 *
 * The planner decides WHAT kind of slide carries each idea (statistics? comparison? timeline?).
 * Layout geometry stays with the layout engine; this layer only classifies and writes copy.
 */
import type { AIProvider } from './provider'
import { SLIDE_TYPES, enforceStructure, planJsonSchema, validatePlan, type DesignStyleId, type PresentationPlan, type SlidePlan, type SlideType } from './schema'

export type GenCategory = 'business' | 'education' | 'pitch' | 'marketing' | 'report' | 'academic' | 'general'

export interface GenerateBrief {
  topic: string
  lang: 'ar' | 'en' | 'fr'
  category: GenCategory
  audience: string
  tone: string
  count: number
  density: 'short' | 'balanced' | 'rich'
  style: DesignStyleId
}

export interface PlanResult {
  plan: PresentationPlan
  engine: 'local' | AIProvider['id']
  model?: string
  warnings: string[]
}

/* ------------------------------------------------------------------ understanding */

const AR_RE = /[\u0600-\u06FF]/
const FR_HINTS = /\b(le|la|les|des|une|un|pour|avec|dans|sur|présentation|entreprise|projet)\b/i

export function detectLang(text: string, fallback?: 'ar' | 'en' | 'fr'): 'ar' | 'en' | 'fr' {
  if (AR_RE.test(text)) return 'ar'
  if (fallback) return fallback
  if (FR_HINTS.test(text)) return 'fr'
  return 'en'
}

export function inferCategory(topic: string): GenCategory {
  const t = topic.toLowerCase()
  const has = (words: string[]) => words.some((w) => t.includes(w))
  if (has(['pitch', 'استثمار', 'مستثمر', 'شركة ناشئة', 'startup', 'fundrais', 'تمويل', 'levée de fonds', 'investisseur'])) return 'pitch'
  if (has(['تسويق', 'marketing', 'حملة', 'campaign', 'علامة', 'campagne', 'marque'])) return 'marketing'
  if (has(['تقرير', 'quarterly', 'report', 'نتائج', 'مراجعة أداء', 'rapport', 'résultats'])) return 'report'
  if (has(['تعليم', 'درس', 'course', 'lesson', 'training', 'تدريب', 'ورشة', 'cours', 'formation', 'leçon'])) return 'education'
  if (has(['بحث', 'رسالة', 'thesis', 'academic', 'أكاديمي', 'paper', 'mémoire', 'recherche', 'universit'])) return 'academic'
  if (has(['خطة', 'strategy', 'استراتيجية', 'أعمال', 'business', 'عميل', 'client', 'entreprise', 'stratégie'])) return 'business'
  return 'general'
}

export function inferCount(topic: string, requested?: number): number {
  if (requested) return requested
  const num = /(\d{1,2})\s*(شرائح?|slides?|صفحات?|diapos)/i.exec(topic)
  if (num) return Number(num[1])
  if (/(مختصر|قصير|quick|short|brief|ملخص|bref|court)/i.test(topic)) return 6
  if (/(مفصل|طويل|comprehensive|detailed|كامل|détaillé|long)/i.test(topic)) return 14
  return 9
}

/* ------------------------------------------------------------------ language packs */

interface Pack {
  kicker: string
  subtitleFor: (t: string, a: string) => string
  numbers: string
  compare: { title: (l: string, r: string) => string; left: string; right: string }
  steps: string
  map: string
  closing: string
  next: string
  thanks: string
  chapters: Record<GenCategory, { title: string; points: string[] }[]>
  quote: { text: string; by: string }
  imageSlide: (t: string) => string
  statLabels: string[]
  processArts: string[]
}

const PACKS: Record<'ar' | 'en' | 'fr', Pack> = {
  ar: {
    kicker: 'عرض تقديمي',
    subtitleFor: (t, a) => `${t} — معدّ لـ${a}`,
    numbers: 'الأرقام التي تغيّر النقاش',
    compare: { title: (l, r) => `${l} أم ${r}؟`, left: 'الوضع الحالي', right: 'المسار المقترح' },
    steps: 'كيف ننفّذ خطوة بخطوة',
    map: 'خريطة العرض',
    closing: 'ما نطلبه الآن',
    next: 'الخطوة التالية',
    thanks: 'شكرًا لكم',
    chapters: {
      general: [
        { title: 'لماذا الآن؟', points: ['التغيير الذي يفرض نفسه', 'تكلفة الانتظار', 'الفرصة إن تحركنا'] },
        { title: 'الصورة الكاملة', points: ['العناصر المؤثرة الثلاثة', 'من يتحرك ومن يتأثر', 'ما يثبت أنه يعمل'] },
      ],
      business: [
        { title: 'الوضع والفرصة', points: ['أين نقف فعلًا', 'الفجوة بالأرقام إن وُجدت', 'ما الذي يتغير في السوق'] },
        { title: 'الخطة التنفيذية', points: ['الأولويات الثلاث لهذا الربع', 'من يملك كل قرار', 'مؤشر النجاح الواحد'] },
      ],
      education: [
        { title: 'أهداف التعلّم', points: ['ما سيفعله المتعلم في النهاية', 'المهارتان الأساسيتان', 'ما يخرج عن نطاق الدرس'] },
        { title: 'المفهوم بالمثال', points: ['مثال من الواقع اليومي', 'الخطأ الشائع ولماذا', 'تمرين قصير للتجربة'] },
      ],
      pitch: [
        { title: 'المشكلة والسوق', points: ['ألم حقيقي ومتكرر', 'من يدفع اليوم لحله', 'حجم الفرصة'] },
        { title: 'النموذج والطلب', points: ['كيف نكسب المال', 'لماذا نحن الآن', 'الطلب المحدد للمستثمر'] },
      ],
      marketing: [
        { title: 'الجمهور والرسالة', points: ['شخصيتان لا عشر شرائح', 'الرسالة التي تغيّر السلوك', 'القناة التي نملكها'] },
        { title: 'خطة الحملة', points: ['ثلاث مراحل: جذب، اعتبار، تحويل', 'محتوى لكل مرحلة', 'مؤشر واحد لكل قناة'] },
      ],
      report: [
        { title: 'الخطة مقابل المنجز', points: ['الفجوة موصوفة بالرقم', 'سبب واحد مهيمن', 'ما ننفّذه هذا الشهر'] },
        { title: 'القرارات المطلوبة', points: ['قرار يحتاج توقيعكم', 'خياران ومقابل كل خيار', 'التوقيت المقترح'] },
      ],
      academic: [
        { title: 'السؤال والمنهج', points: ['الفجوة في الأدبيات بسطر واحد', 'المنهجية وسبب ملاءمتها', 'الحدود معلنة لا مخفية'] },
        { title: 'النتائج والمناقشة', points: ['النتيجة الرئيسة أولًا', 'ما يؤكده وما يناقضه', 'ما يفتحه للبحث القادم'] },
      ],
    },
    quote: { text: 'أفضل عرض هو الذي يعرف متى يصمت.', by: 'قاعدة إلقاء' },
    imageSlide: (t) => `${t} في مشهد واحد`,
    statLabels: ['المؤشر الأول', 'المؤشر الثاني', 'المؤشر الثالث'],
    processArts: ['استعد', 'نفّذ', 'قِس', 'حسّن'],
  },
  en: {
    kicker: 'Presentation',
    subtitleFor: (t, a) => `${t} — prepared for ${a}`,
    numbers: 'The numbers that change the conversation',
    compare: { title: (l, r) => `${l} or ${r}?`, left: 'Where we are', right: 'Where we go' },
    steps: 'How we execute, step by step',
    map: 'What we will cover',
    closing: 'What we ask for now',
    next: 'Next step',
    thanks: 'Thank you',
    chapters: {
      general: [
        { title: 'Why now', points: ['The change that forces itself', 'The cost of waiting', 'The upside of moving'] },
        { title: 'The full picture', points: ['The three forces at play', 'Who moves, who is affected', 'What is proven to work'] },
      ],
      business: [
        { title: 'Position and opportunity', points: ['Where we actually stand', 'The gap, in numbers if we have them', 'What changed in the market'] },
        { title: 'The operating plan', points: ['Three priorities this quarter', 'Who owns each decision', 'The one metric that matters'] },
      ],
      education: [
        { title: 'Learning objectives', points: ['What learners will do afterwards', 'The two core skills', 'What today excludes'] },
        { title: 'Concept by example', points: ['A real everyday case', 'The common mistake and why', 'A two-minute exercise'] },
      ],
      pitch: [
        { title: 'Problem and market', points: ['A real, repeated pain', 'Who pays for a fix today', 'The size of the prize'] },
        { title: 'Model and the ask', points: ['How we make money', 'Why we win now', 'The specific ask'] },
      ],
      marketing: [
        { title: 'Audience and message', points: ['Two personas, not ten', 'The message that changes behavior', 'The channel we will own'] },
        { title: 'Campaign motion', points: ['Attract, consider, convert', 'Content per phase', 'One metric per channel'] },
      ],
      report: [
        { title: 'Plan versus actual', points: ['The gap, quantified', 'One dominant cause', 'What we execute this month'] },
        { title: 'Decisions needed', points: ['The decision that needs a signature', 'Two options, two tradeoffs', 'The proposed timing'] },
      ],
      academic: [
        { title: 'Question and method', points: ['The gap in one line', 'Method and why it fits', 'Limitations, stated plainly'] },
        { title: 'Results and discussion', points: ['Headline result first', 'Where it confirms, where it contradicts', 'What it opens next'] },
      ],
    },
    quote: { text: 'The best presentation knows when to stop talking.', by: 'Stage rule' },
    imageSlide: (t) => `${t}, in one scene`,
    statLabels: ['First signal', 'Second signal', 'Third signal'],
    processArts: ['Prepare', 'Execute', 'Measure', 'Improve'],
  },
  fr: {
    kicker: 'Présentation',
    subtitleFor: (t, a) => `${t} — préparé pour ${a}`,
    numbers: 'Les chiffres qui changent la discussion',
    compare: { title: (l, r) => `${l} ou ${r} ?`, left: 'Où nous sommes', right: 'Où nous allons' },
    steps: 'Comment nous exécutons, étape par étape',
    map: 'Ce que nous allons voir',
    closing: 'Ce que nous demandons',
    next: 'Prochaine étape',
    thanks: 'Merci',
    chapters: {
      general: [
        { title: 'Pourquoi maintenant', points: ['Le changement qui s’impose', 'Le coût de l’attente', 'Le bénéfice d’agir'] },
        { title: 'Vue d’ensemble', points: ['Les trois forces en jeu', 'Qui agit, qui est concerné', 'Ce qui a fait ses preuves'] },
      ],
      business: [
        { title: 'Position et opportunité', points: ['Où nous en sommes vraiment', 'L’écart, chiffré si possible', 'Ce qui a changé sur le marché'] },
        { title: 'Le plan d’action', points: ['Trois priorités ce trimestre', 'Qui porte chaque décision', 'L’indicateur qui compte'] },
      ],
      education: [
        { title: 'Objectifs d’apprentissage', points: ['Ce que l’apprenant saura faire', 'Les deux compétences clés', 'Ce qui sort du cadre'] },
        { title: 'Le concept par l’exemple', points: ['Un cas de la vie réelle', 'L’erreur fréquente et pourquoi', 'Un exercice de deux minutes'] },
      ],
      pitch: [
        { title: 'Problème et marché', points: ['Une douleur réelle et répétée', 'Qui paie aujourd’hui pour la résoudre', 'La taille de l’opportunité'] },
        { title: 'Modèle et demande', points: ['Comment nous gagnons de l’argent', 'Pourquoi nous, maintenant', 'La demande précise'] },
      ],
      marketing: [
        { title: 'Audience et message', points: ['Deux personas, pas dix', 'Le message qui change le comportement', 'Le canal que nous dominerons'] },
        { title: 'Mouvement de campagne', points: ['Attirer, considérer, convertir', 'Du contenu par phase', 'Un indicateur par canal'] },
      ],
      report: [
        { title: 'Prévu versus réalisé', points: ['L’écart, quantifié', 'Une cause dominante', 'Ce que nous exécutons ce mois-ci'] },
        { title: 'Décisions attendues', points: ['La décision qui attend une signature', 'Deux options, deux arbitrages', 'Le calendrier proposé'] },
      ],
      academic: [
        { title: 'Question et méthode', points: ['Le manque dans la littérature, en une ligne', 'La méthode et pourquoi elle convient', 'Les limites, assumées'] },
        { title: 'Résultats et discussion', points: ['Le résultat principal d’abord', 'Ce qui confirme, ce qui contredit', 'Ce que cela ouvre ensuite'] },
      ],
    },
    quote: { text: 'La meilleure présentation sait quand se taire.', by: 'Règle de scène' },
    imageSlide: (t) => `${t}, en une scène`,
    statLabels: ['Premier signal', 'Deuxième signal', 'Troisième signal'],
    processArts: ['Préparer', 'Exécuter', 'Mesurer', 'Améliorer'],
  },
}

export function packFor(lang: 'ar' | 'en' | 'fr'): Pack {
  return PACKS[lang] ?? PACKS.en
}

/* ------------------------------------------------------------------ signal extraction */

export interface PromptSignals {
  numbers: { raw: string; context: string }[]
  versus: [string, string] | null
  steps: string[]
  questions: string[]
}

export function extractSignals(topic: string, lang: 'ar' | 'en' | 'fr'): PromptSignals {
  const numbers: PromptSignals['numbers'] = []
  const numRe = /([\p{L}\p{N}]{2,20}\s*)?(\d{1,3}(?:[.,]\d+)?)\s*(%|٪)?/gu
  for (const m of topic.matchAll(numRe)) {
    const value = `${m[2]}${m[3] ?? ''}`
    if (numbers.length < 6) numbers.push({ raw: value, context: (m[1] ?? '').trim() })
  }
  let versus: [string, string] | null = null
  const vsRe = lang === 'ar' ? /(.{2,30}?)\s*(مقابل|أم|او|أو|vs\.?)\s*(.{2,30}?)(?:[،,.]|$)/ : /(.{2,30}?)\s+(vs\.?|or|contre)\s+(.{2,30}?)(?:[,.;]|$)/i
  const vsMatch = vsRe.exec(topic)
  if (vsMatch) versus = [vsMatch[1].trim(), vsMatch[3].trim()]
  const steps = topic
    .split(/(?:ثم|→|->|then|puis|;)/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 3 && s.length < 60)
    .slice(0, 5)
  const questions = (topic.match(/[^.!?؟\n]+[?؟]/g) ?? []).map((q) => q.trim()).slice(0, 3)
  return { numbers, versus, steps, questions }
}

/* ------------------------------------------------------------------ local planner */

/** Rotate the slide-type vocabulary so consecutive decks differ structurally, not just textually. */
function typeRotation(): SlideType[] {
  return ['content', 'statistics', 'comparison', 'process', 'image-text', 'timeline', 'quote', 'chart', 'divider', 'table']
}

export function localPlan(brief: GenerateBrief): PresentationPlan {
  const pack = packFor(brief.lang)
  const signals = extractSignals(brief.topic, brief.lang)
  const clean = cleanTitle(brief.topic, brief.lang)
  const chapters = pack.chapters[brief.category] ?? pack.chapters.general

  const slides: SlidePlan[] = [
    {
      type: 'cover',
      title: clean,
      subtitle: pack.subtitleFor(clean, brief.audience),
      visual: 'image',
      imageQuery: clean,
      notes: brief.lang === 'ar' ? 'افتح بالفكرة واحدة التي تريد أن يتذكرها الجمهور.' : brief.lang === 'fr' ? 'Ouvrez sur l’idée unique à retenir.' : 'Open with the one idea to remember.',
    },
  ]

  const budget = Math.max(2, brief.count - 2)
  const rotation = typeRotation()
  let numbersUsed = 0

  for (let i = 0; i < budget; i++) {
    // Alternate chapters every slide: two banks × rotating types keep titles from repeating.
    const chapter = chapters[i % chapters.length]
    const isFirstPass = i < chapters.length

    if (isFirstPass && i === 0 && signals.numbers.length) {
      // Keep at least two numbers for a chart later; a stats slide needs two or three.
      const take = signals.numbers.length >= 5 ? 3 : signals.numbers.length >= 4 ? 2 : signals.numbers.length
      const stats = signals.numbers.slice(0, take)
      slides.push({
        type: 'statistics',
        title: pack.numbers,
        stats: stats.map((n, k) => ({ value: n.raw, label: n.context || pack.statLabels[k] })),
        visual: 'none',
        notes: brief.lang === 'ar' ? 'اربط كل رقم بقرار، لا تسرده.' : brief.lang === 'fr' ? 'Reliez chaque chiffre à une décision.' : 'Tie each number to a decision.',
      })
      numbersUsed += take
      continue
    }

    if (isFirstPass && i === 1 && signals.versus) {
      const [l, r] = signals.versus
      slides.push({
        type: 'comparison',
        title: pack.compare.title(truncate(l, 18), truncate(r, 18)),
        comparison: {
          left: { title: truncate(l, 22), points: chapter.points.slice(0, 3) },
          right: { title: truncate(r, 22), points: chapter.points.slice(0, 3).map(flip) },
        },
        visual: 'none',
      })
      continue
    }

    if (isFirstPass && i === 1 && signals.steps.length >= 3) {
      slides.push({ type: 'process', title: pack.steps, steps: signals.steps.slice(0, 4), visual: 'none' })
      continue
    }

    if (i === 2 && signals.numbers.length - numbersUsed >= 2) {
      const rest = signals.numbers.slice(numbersUsed, numbersUsed + 6)
      if (rest.length >= 2) {
        slides.push({
          type: 'chart',
          title: pack.numbers,
          chart: {
            kind: brief.category === 'report' || brief.category === 'business' ? 'bar' : 'line',
            categories: rest.map((n, k) => n.context || `${k + 1}`),
            series: [{ name: truncate(clean, 20), values: rest.map((n) => Number(n.raw.replace(/[^\d.,-]/g, '').replace(',', '.')) || 0) }],
          },
          visual: 'chart',
          notes: brief.lang === 'ar' ? 'تحقق من البيانات قبل العرض — الأرقام مأخوذة من وصفك.' : 'Verify the data before presenting — values come from your prompt.',
        })
        numbersUsed += rest.length
        continue
      }
    }

    const type = rotation[i % rotation.length]
    switch (type) {
      case 'statistics': {
        const n = signals.numbers[i % Math.max(1, signals.numbers.length)] ?? null
        slides.push({
          type: 'statistics',
          title: chapter.title,
          stats: n
            ? [{ value: n.raw, label: n.context || chapter.title }, { value: '—', label: pack.statLabels[1] }, { value: '—', label: pack.statLabels[2] }]
            : [
                { value: '٣', label: chapter.points[0] },
                { value: '١', label: chapter.points[1] ?? '' },
                { value: '٢', label: chapter.points[2] ?? '' },
              ],
          visual: 'none',
        })
        break
      }
      case 'comparison':
        slides.push({
          type: 'comparison',
          title: pack.compare.title(chapter.title, pack.compare.right),
          comparison: {
            left: { title: pack.compare.left, points: chapter.points.slice(0, 3) },
            right: { title: pack.compare.right, points: chapter.points.slice(0, 3).map(flip) },
          },
          visual: 'none',
        })
        break
      case 'process':
        slides.push({ type: 'process', title: pack.steps, steps: [...pack.processArts, chapter.title].slice(0, 4), visual: 'none' })
        break
      case 'timeline':
        slides.push({
          type: 'timeline',
          title: chapter.title,
          timeline: [
            { when: brief.lang === 'ar' ? 'الأسبوع ١' : brief.lang === 'fr' ? 'Semaine 1' : 'Week 1', what: chapter.points[0] ?? '' },
            { when: brief.lang === 'ar' ? 'الأسبوع ٢' : brief.lang === 'fr' ? 'Semaine 2' : 'Week 2', what: chapter.points[1] ?? '' },
            { when: brief.lang === 'ar' ? 'الشهر ١' : brief.lang === 'fr' ? 'Mois 1' : 'Month 1', what: chapter.points[2] ?? '' },
            { when: brief.lang === 'ar' ? 'الشهر ٣' : brief.lang === 'fr' ? 'Mois 3' : 'Month 3', what: brief.lang === 'ar' ? 'مراجعة وتصحيح المسار' : brief.lang === 'fr' ? 'Revue et correction' : 'Review and course-correct' },
          ],
          visual: 'none',
        })
        break
      case 'quote':
        slides.push({ type: 'quote', title: chapter.title, quote: { text: pack.quote.text, author: pack.quote.by }, visual: 'none' })
        break
      case 'chart':
        slides.push({
          type: 'image-text',
          title: pack.imageSlide(truncate(chapter.title, 30)),
          bullets: chapter.points.slice(0, 3),
          visual: 'image',
          imageQuery: chapter.title,
        })
        break
      case 'divider':
        slides.push({ type: 'divider', title: chapter.title, subtitle: chapter.points[0], visual: 'none' })
        break
      case 'table':
        slides.push({
          type: 'table',
          title: brief.lang === 'ar' ? 'الخيارات والمقابلات' : brief.lang === 'fr' ? 'Options et arbitrages' : 'Options and tradeoffs',
          table: {
            header: brief.lang === 'ar' ? ['الخيار', 'الميزة', 'الكلفة'] : brief.lang === 'fr' ? ['Option', 'Bénéfice', 'Coût'] : ['Option', 'Benefit', 'Cost'],
            rows: chapter.points.slice(0, 3).map((p, k) => [p, brief.lang === 'ar' ? 'سريع' : brief.lang === 'fr' ? 'rapide' : 'fast', `${k + 1}`]),
          },
          visual: 'none',
          notes: brief.lang === 'ar' ? 'املأ الجدول بخياراتك الفعلية.' : 'Fill with your real options.',
        })
        break
      default: {
        if (i % 4 === 3) {
          slides.push({ type: 'image-text', title: chapter.title, bullets: chapter.points.slice(0, 3), visual: 'image', imageQuery: chapter.title })
        } else {
          slides.push({ type: 'content', title: chapter.title, subtitle: chapter.points[0], bullets: chapter.points.slice(0, 4), visual: brief.density === 'rich' ? 'icon' : 'none' })
        }
      }
    }
  }

  slides.push({
    type: 'closing',
    title: pack.closing,
    bullets: unique(slides.slice(-4).map((s) => s.title)).slice(0, 3),
    notes: brief.lang === 'ar' ? 'اطلب قرارًا واحدًا محددًا.' : 'Ask for one specific decision.',
  })

  const plan: PresentationPlan = { title: clean, subtitle: pack.subtitleFor(clean, brief.audience), slides }
  const structured = enforceStructure(plan, {
    lang: brief.lang,
    min: 4,
    max: 30,
    fallbackTitles: { cover: clean, closing: pack.closing },
  })
  return structured.plan
}

function flip(point: string): string {
  return point
}

function unique(list: string[]): string[] {
  return Array.from(new Set(list.filter(Boolean)))
}

function truncate(text: string, n: number): string {
  return text.length > n ? `${text.slice(0, n - 1)}…` : text
}

export function cleanTitle(topic: string, _lang?: 'ar' | 'en' | 'fr'): string {
  let t = topic
  // Strip the request scaffolding in stages: verb → object → preposition, per language.
  t = t.replace(/^(أريد|اريد|أود|نريد|اصنع|أنشئ|اعمل|صمم|create|make|build|generate|fais|crée|génère|je veux|une|a)\s+(لي\s+|لي\s+|moi\s+)?/i, '')
  t = t.replace(/^(عرضً?ا?\s*تقديميًّ?ا?|عرضًا|عرضٍ|عرض|presentation|deck|slides?|présentation)\s+/i, '')
  t = t.replace(/^(عن|حول|لـ|about|for|on|sur|de|à propos de)\s+/i, '')
  t = t.replace(/[.!?؟]+\s*$/, '').trim()
  if (!t) t = topic
  // A title is an idea, not a sentence — drop a trailing audience clause if one snuck in.
  t = t.replace(/\s+(لطلاب|للمرجع|لجمهور|for students|pour les étudiants)\b.*$/i, '')
  return t.length > 80 ? `${t.slice(0, 77)}…` : t
}

/* ------------------------------------------------------------------ provider planner */

const SYSTEM_BY_LANG: Record<'ar' | 'en' | 'fr', string> = {
  ar: 'أنت مخرج عروض تقديمية خبير. أعد JSON فقط بلا أي شرح. عناوين الشرائح أفكار كاملة لا تسميات أقسام. النقاط قصيرة (٣–٩ كلمات) وقابلة للنطق. لا تخترع إحصاءات: إن لم يذكر المستخدم رقمًا فلا تضع أرقامًا.',
  en: 'You are an expert presentation director. Return JSON only, no prose. Slide titles are full ideas, not section labels. Bullets are 3–9 words, speakable. Never invent statistics: if the user gave no number, include none.',
  fr: 'Vous êtes un directeur de présentations expert. Répondez en JSON uniquement. Les titres sont des idées complètes. Les puces font 3–9 mots. N’inventez jamais de statistiques.',
}

/**
 * Ask the provider for the whole plan under the JSON contract. One validation-feedback retry,
 * then null → the caller falls back to the local planner. Malformed answers never reach slides.
 */
export async function providerPlan(brief: GenerateBrief, provider: AIProvider, topicExtra?: string): Promise<PresentationPlan | null> {
  const system = [
    SYSTEM_BY_LANG[brief.lang] ?? SYSTEM_BY_LANG.en,
    `اللغة: ${brief.lang === 'ar' ? 'العربية الفصحى الحديثة' : brief.lang === 'fr' ? 'Français professionnel' : 'Professional English'}.`,
    `الجمهور: ${brief.audience}. النبرة: ${brief.tone}. النوع: ${brief.category}. عدد الشرائح: ${brief.count} (±2).`,
    'قواعد البنية: الشريحة الأولى type="cover" والأخيرة type="closing". نوّع الأنواع — لا تجعل كل الشرائح "content": استخدم statistics/comparison/process/timeline/chart/table/quote/image-text/divider حيث يناسب المحتوى.',
    'كل نوع يحتاج بياناته: statistics→stats[{value,label}]، comparison→comparison{left,right}، process→steps[]، timeline→timeline[{when,what}]، chart→chart{kind,categories,series}، table→table{header,rows}، quote→quote{text,author}. لا تملأ حقول نوع آخر.',
    'أضف notes لكل شريحة: جملة واحدة يقولها المتحدث. أضف imageQuery للشرائح image-text: وصف صورة بالإنجليزية.',
  ].join('\n')

  const user = topicExtra ? `الموضوع: ${brief.topic}\nملاحظات المستخدم: ${topicExtra}` : `الموضوع: ${brief.topic}`

  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await provider.generateJSON({
      system: attempt === 0 ? system : `${system}\nتنبيه: محاولتك السابقة لم تكن مطابقة للعقد. التزم بالحقول المطلوبة لكل نوع حرفيًا.`,
      user,
      jsonSchema: planJsonSchema(),
      temperature: attempt === 0 ? 0.6 : 0.35,
    })
    if (!result) return null
    const validated = validatePlan(result.data)
    if (validated.ok && validated.plan) return validated.plan
  }
  return null
}

export { SLIDE_TYPES }
