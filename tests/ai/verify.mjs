/**
 * Runtime verification for the AI Presentation Generator pipeline — the 9 brief scenarios plus
 * contract/quality/geometry guarantees. Everything runs on the LOCAL engine (no network, no
 * provider), which is exactly the guaranteed floor every user gets.
 *
 * Run: node tests/ai/verify.mjs
 */
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body><div id="host"></div></body></html>', { pretendToBeVisual: true, url: 'https://kadmati.local/' })
const { window } = dom
if (!window.document.fonts) window.document.fonts = { ready: Promise.resolve() }
for (const key of ['window', 'document', 'Node', 'Element', 'HTMLElement', 'HTMLDivElement', 'SVGElement', 'SVGGElement', 'SVGPathElement', 'Text', 'DocumentFragment', 'Document', 'NodeList', 'DOMTokenList', 'CustomEvent', 'MutationObserver', 'ResizeObserver', 'requestAnimationFrame', 'cancelAnimationFrame', 'getComputedStyle', 'localStorage']) {
  let value = window[key]
  if (value === undefined && key === 'ResizeObserver') value = class { observe() {} unobserve() {} disconnect() {} }
  try {
    globalThis[key] = value
  } catch {
    Object.defineProperty(globalThis, key, { configurable: true, value })
  }
}
for (const key of Object.getOwnPropertyNames(window)) {
  if (key in globalThis) continue
  let v
  try {
    v = window[key]
  } catch { continue }
  if (typeof v === 'function') {
    try {
      globalThis[key] = v
    } catch { /* read-only */ }
  }
}
if (!globalThis.requestAnimationFrame) {
  globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now()), 16)
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id)
}
window.requestAnimationFrame = globalThis.requestAnimationFrame
window.cancelAnimationFrame = globalThis.cancelAnimationFrame
if (!window.matchMedia) window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} })

import { build } from 'esbuild'
import { mkdirSync } from 'node:fs'

mkdirSync('.tmp-verify', { recursive: true })
await build({
  entryPoints: ['tests/ai/entry.ts'],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  outfile: '.tmp-verify/ai.mjs',
  logLevel: 'silent',
})
const mod = await import('../../.tmp-verify/ai.mjs')
const { localPlan, polish, composeDeck, validatePlan, enforceStructure, planJsonSchema, buildTheme, suggestSlideAnimations, recommendModel, hardwareProfile, parseLooseJson, instantiateDeck, LAYOUT_MAP, SIZE_4_3, guardPalette, SLIDE_TYPES, regenerateSlideSpec, regenerateCurrentSlide, applyDesignAction, generateDeck, useDoc, useUI, createPresentation } = mod

let pass = 0
let fail = 0
const fails = []
function ok(cond, msg) {
  if (cond) pass++
  else {
    fail++
    fails.push(msg)
    console.error('  ✗', msg)
  }
}

const brief = (over = {}) => ({
  topic: 'موضوع تجريبي',
  lang: 'ar',
  category: 'business',
  audience: 'جمهور عام',
  tone: 'واثقة ومباشرة',
  count: 9,
  density: 'balanced',
  style: 'professional',
  ...over,
})

/* ================================================================ 1..9 — the required scenarios */

const SCENARIOS = [
  { name: '1. تعليمي (عربي)', b: brief({ topic: 'أريد عرضًا عن الذكاء الاصطناعي وتأثيره على التعليم', category: 'education', lang: 'ar' }) },
  { name: '2. تجاري (عربي)', b: brief({ topic: 'خطة توسع الشركة في السوق الخليجي مع أرقام النمو 24% و 31% خلال سنتين', category: 'business', lang: 'ar' }) },
  { name: '3. Pitch Deck (إنجليزي)', b: brief({ topic: 'Pitch deck for a startup teaching kids to code, raise 2M seed', category: 'pitch', lang: 'en' }) },
  { name: '4. أكاديمي (فرنسي)', b: brief({ topic: 'Une présentation sur la mémoire et l’apprentissage profond', category: 'academic', lang: 'fr' }) },
  { name: '5. عربي عام', b: brief({ topic: 'أريد عرضًا عن الطاقة الشمسية وتأثيرها على مستقبل الطاقة' }) },
  { name: '6. فرنسي عام', b: brief({ topic: "Une présentation sur l'énergie solaire en Afrique du Nord", lang: 'fr' }) },
  { name: '7. إنجليزي عام', b: brief({ topic: 'Solar energy and its impact on the next decade', lang: 'en' }) },
  { name: '8. Prompt قصير جدًا', b: brief({ topic: 'القهوة', count: 4 }) },
  { name: '9. Prompt طويل ومفصل', b: brief({ topic: 'عرض تفصيلي عن تحول الشركة إلى العمل الهجين: الأرقام 45% إنتاجية و 12% تكاليف، مقارنة بين العمل من المكتب والعمل عن بعد، خطة من ثلاث مراحل، تجارب الشركات العالمية، والمخاطر المتوقعة مع حلولها', count: 14, category: 'report' }) },
]

console.log('— السيناريوهات التسعة (المحرك المحلي) —')
for (const sc of SCENARIOS) {
  const plan = localPlan(sc.b)
  ok(plan && plan.slides.length >= 4, `${sc.name}: عدد شرائح معقول (${plan.slides.length})`)
  ok(plan.slides[0].type === 'cover', `${sc.name}: الشريحة الأولى غلاف`)
  ok(plan.slides[plan.slides.length - 1].type === 'closing', `${sc.name}: الشريحة الأخيرة ختام`)
  const types = new Set(plan.slides.map((s) => s.type))
  ok(types.size >= 3, `${sc.name}: تنوع أنواع الشرائح (${[...types].join(',')})`)
  ok(plan.slides.every((s) => SLIDE_TYPES.includes(s.type)), `${sc.name}: كل الأنواع ضمن المفردات المعروفة`)
  ok(plan.slides.every((s) => (s.title ?? '').trim().length > 0), `${sc.name}: لا شرائح بلا عنوان`)

  // Composer → real slides through the SAME layout engine the editor uses.
  const theme = buildTheme({ style: sc.b.style, topic: sc.b.topic, lang: sc.b.lang })
  const spec = composeDeck(plan, sc.b, { theme, themeId: 'test' })
  ok(spec.slides.every((s) => LAYOUT_MAP.has(s.layout)), `${sc.name}: كل تخطيط موجود في المحرك`)
  const doc = instantiateDeck(spec)
  ok(doc.slides.length === spec.slides.length, `${sc.name}: الشرائح المبنية = المواصفة`)
  ok(doc.metadata.lang === sc.b.lang, `${sc.name}: لغة المستند`)
  ok(doc.slides.every((sl) => sl.elements.length > 0), `${sc.name}: لا شرائح فارغة`)
  // Titles must be unique after polish.
  const polished = polish(plan, sc.b.lang)
  const titles = polished.plan.slides.map((s) => s.title.toLowerCase())
  ok(new Set(titles).size === titles.length, `${sc.name}: لا عناوين مكررة بعد التلميع`)
}

/* ================================================================ content quality rules */

console.log('— قواعد الجودة —')
{
  const junk = localPlan(brief({ topic: 'عرض', count: 9 }))
  junk.slides[2].bullets = Array.from({ length: 9 }, (_, i) => `نقطة رقم ${i} طويلة جدًا تحتوي كلمات كثيرة تفيض عن الحد المسموح به في العروض الجيدة`)
  junk.slides[3].title = junk.slides[2].title
  const { plan: cleaned, quality } = polish(junk, 'ar')
  ok(cleaned.slides[2].bullets.length <= 5, `النقاط مقصوصة إلى ${cleaned.slides[2].bullets.length} ≤ 5`)
  ok(cleaned.slides[2].bullets.every((b) => b.split(/\s+/).length <= 15), 'طول كل نقطة داخل الحد')
  ok(quality.dedupedTitles >= 1, 'العنوان المكرر أُعيدت صياغته')
}

/* ================================================================ structured output contract */

console.log('— عقد JSON المنظم —')
{
  // Valid provider answer with fences + markdown residue → must repair, not reject.
  const fenced = '```json\n' + JSON.stringify({
    title: 'عرض تجريبي',
    slides: [
      { type: 'cover', title: 'الغلاف', subtitle: 'سطر مساند' },
      { type: 'stats', title: 'أرقام', stats: [{ value: '42%', label: 'نمو' }, { value: '1.2M', label: 'مستخدم' }] },
      { type: 'comparison', title: 'مقارنة', comparison: { left: { title: 'الآن', points: ['أ', 'ب'] }, right: { title: 'بعد', points: ['ج', 'د'] } } },
      { type: 'closing', title: 'خلاصة' },
    ],
  }) + '\n```'
  const v = validatePlan(parseLooseJson(fenced))
  ok(v.ok && v.plan.slides.length === 4, 'JSON داخل أسوار markdown يُقرأ ويُصلح')
  ok(v.plan.slides[1].type === 'statistics', "نوع 'stats' يُطابق إلى 'statistics'")

  // Garbage → rejected (caller falls back to local planner).
  ok(!validatePlan({ hello: 'world' }).ok, 'كائن بلا slides يُرفض')
  ok(!validatePlan(null).ok, 'null يُرفض')
  ok(!validatePlan({ slides: [{ title: 'واحدة فقط' }] }).ok, 'شريحة واحدة لا تكفي')

  // Structural guarantees.
  const fixed = enforceStructure({ title: 'ت', slides: [{ type: 'content', title: 'وسط' }] }, { lang: 'ar', min: 4, max: 30, fallbackTitles: { cover: 'غ', closing: 'خ' } })
  ok(fixed.plan.slides[0].type === 'cover' && fixed.plan.slides.at(-1).type === 'closing', 'الغلاف والختام يُضمنان بنيويًا')
  const schema = planJsonSchema()
  ok(schema.properties?.slides?.items?.properties?.type?.enum?.length === SLIDE_TYPES.length, 'JSON Schema يغطي كل الأنواع')
}

/* ================================================================ design system */

console.log('— نظام التصميم —')
{
  const t1 = buildTheme({ style: 'creative', topic: 'طاقة شمسية', lang: 'ar' })
  const t2 = buildTheme({ style: 'minimal', topic: 'طاقة شمسية', lang: 'ar' })
  const t3 = buildTheme({ style: 'creative', topic: 'موضوع مختلف تمامًا عن القهوة والفضاء', lang: 'ar' })
  ok(t1.palette.primary !== t2.palette.primary, 'أنماط مختلفة → ثيمات مختلفة')
  ok(t1.id !== t3.id, 'مواضيع مختلفة → بذرة مختلفة')
  for (const style of ['minimal', 'modern', 'professional', 'creative', 'cinematic', 'elegant']) {
    const t = buildTheme({ style, topic: 'x', lang: 'ar' })
    const g = guardPalette(t.palette)
    ok(g.onPrimary === t.palette.onPrimary && g.text === t.palette.text, `ثيم ${style}: تباين الألوان سليم بعد الحرس`)
    ok(t.fonts.heading && t.fonts.body, `ثيم ${style}: خطوط محددة`)
  }
}

/* ================================================================ aspect 4:3 */

console.log('— نسبة 4:3 —')
{
  const plan = localPlan(brief({ topic: 'عرض عن التخطيط العمراني المستدام في المدن الجديدة', count: 8 }))
  const theme = buildTheme({ style: 'modern', topic: 'عمران', lang: 'ar' })
  const spec = composeDeck(plan, brief({ topic: 'عمران' }), { theme, themeId: 't', aspect: '4:3' })
  const doc = instantiateDeck(spec)
  ok(doc.size.w === SIZE_4_3.w && doc.size.h === SIZE_4_3.h, `حجم المستند ${doc.size.w}×${doc.size.h} = 4:3`)
  const inside = doc.slides.every((sl) => sl.elements.every((el) => el.x + el.w <= SIZE_4_3.w + 2 && el.y + el.h <= SIZE_4_3.h + 2))
  ok(inside, 'كل العناصر داخل حدود 960×720')
  const fontSize = doc.slides[0].elements.find((e) => e.kind === 'text')?.font.fontSize
  ok(fontSize && fontSize <= 76, `أحجام الخط معاد تدويرها (${fontSize})`)
  // 16:9 stays untouched.
  const spec169 = composeDeck(plan, brief({ topic: 'عمران' }), { theme, themeId: 't', aspect: '16:9' })
  const doc169 = instantiateDeck(spec169)
  ok(doc169.size.w === 1280 && doc169.size.h === 720, '16:9 يبقى 1280×720')
}

/* ================================================================ animations */

console.log('— اقتراح الحركة —')
{
  const plan = localPlan(brief({ topic: 'عرض عن رحلة تحول رقمي', count: 9 }))
  const theme = buildTheme({ style: 'professional', topic: 'تحول', lang: 'ar' })
  const doc = instantiateDeck(composeDeck(plan, brief({ topic: 'تحول' }), { theme, themeId: 't' }))
  let total = 0
  for (const slide of doc.slides) {
    const anims = suggestSlideAnimations(slide)
    total += anims.length
    const ids = new Set(slide.elements.map((e) => e.id))
    ok(anims.every((a) => ids.has(a.target)), `شريحة ${slide.layoutId}: كل حركة تستهدف عنصرًا موجودًا`)
    ok(anims.every((a) => a.properties && Object.keys(a.properties).length > 0), `شريحة ${slide.layoutId}: الحركة لها keyframes فعلية`)
    const last = anims.reduce((m, a) => Math.max(m, a.delay + a.duration), 0)
    ok(last <= 2400, `شريحة ${slide.layoutId}: إجمالي الرقص ≤ 2.4s (${Math.round(last)}ms)`)
  }
  ok(total > 0, `حركات مقترحة للعرض (${total})`)
}

/* ================================================================ data slides (chart/table) */

console.log('— شرائح البيانات —')
{
  const plan = localPlan(brief({ topic: 'مبيعات الربع الأول 120 والربع الثاني 180 والربع الثالث 240 والربع الرابع 310', category: 'report', count: 10 }))
  const hasChartPlan = plan.slides.some((s) => s.type === 'chart' && s.chart?.series?.length)
  ok(hasChartPlan, 'الأرقام في الوصف تُحوَّل لمخطط (من الوصف لا من الخيال)')
  if (hasChartPlan) {
    const theme = buildTheme({ style: 'professional', topic: 'مبيعات', lang: 'ar' })
    const doc = instantiateDeck(composeDeck(plan, brief({ topic: 'مبيعات', category: 'report' }), { theme, themeId: 't' }))
    const chartSlide = doc.slides.find((sl) => sl.elements.some((e) => e.kind === 'chart'))
    const chart = chartSlide.elements.find((e) => e.kind === 'chart')
    ok(chart && chart.categories.length >= 2 && chart.series[0]?.values?.length >= 2, 'المخطط المبني يحمل بيانات حقيقية قابلة للتحرير')
  }
}

/* ================================================================ model recommendation */

console.log('— ترشيح النموذج المحلي —')
{
  ok(recommendModel(['qwen3:8b', 'llama3:7b'], 'mid') === 'qwen3:8b', 'mid: يرشح qwen3:8b')
  ok(recommendModel(['qwen3:14b', 'qwen3:8b'], 'high') === 'qwen3:14b', 'high: يرشح qwen3:14b')
  ok(recommendModel(['gemma3:4b', 'llama3.1:8b'], 'low') === 'gemma3:4b' || recommendModel(['gemma3:4b'], 'low') === 'gemma3:4b', 'low: يرشح 4b')
  ok(recommendModel([], 'high') === null, 'لا نماذج → null (لا يفشل)')
  const hw = hardwareProfile()
  ok(['high', 'mid', 'low'].includes(hw.tier), `عتبة العتاد محسوبة (${hw.tier})`)
}

/* ================================================================ editor integration (jsdom) */

console.log('— تكامل المحرر: إعادة توليد شريحة واحدة —')
{
  const briefA = brief({ topic: 'عرض عن استراتيجية المحتوى الرقمي للشركة', count: 8 })
  const themeA = buildTheme({ style: 'professional', topic: 'محتوى', lang: 'ar' })
  const doc = instantiateDeck(composeDeck(localPlan(briefA), briefA, { theme: themeA, themeId: 't' }))

  const state = useDoc.getState()
  state.load(doc, 'p_test')
  const before = useDoc.getState().doc
  const targetIndex = 2
  useDoc.getState().gotoSlide(targetIndex) // the editor flow: regenerate the CURRENT slide
  const targetTitle = JSON.stringify(before.slides[targetIndex].elements.map((e) => e.id))
  const otherTitle = JSON.stringify(before.slides[4].elements.map((e) => e.id))

  const res = await regenerateCurrentSlide('اجعلها أكثر بصرية')
  ok(!!res, 'إعادة التوليد المحلية تعمل')
  const after = useDoc.getState().doc
  ok(after.slides.length === before.slides.length, 'عدد الشرائح لم يتغير')
  ok(after.slides[targetIndex].id === before.slides[targetIndex].id, 'معرّف الشريحة نفسه محفوظ')
  ok(JSON.stringify(after.slides[targetIndex].elements.map((e) => e.id)) !== targetTitle, 'عناصر الشريحة المستهدفة أعيد بناؤها')
  ok(JSON.stringify(after.slides[4].elements.map((e) => e.id)) === otherTitle, 'بقية الشرائح لم تُلمَ (متطلب 14)')

  // Design action: shorten content deterministically.
  const note = await applyDesignAction('shorten')
  ok(typeof note === 'string' && note.length > 0, `فعل «اختصر» يعمل (${note})`)

  // Every AI operation is one history entry; undo rolls back to the pre-AI doc.
  const withHistory = useDoc.getState()
  if (withHistory.undo) {
    const ids = (d) => JSON.stringify(d.slides[targetIndex].elements.map((e) => e.id))
    let found = false
    for (let i = 0; i < 12 && !found; i++) {
      if (!useDoc.temporal.getState().pastStates.length) break
      withHistory.undo()
      found = ids(useDoc.getState().doc) === targetTitle
    }
    ok(found, 'التراجع يعيد الشريحة إلى ما قبل الذكاء (كل عملية AI = خطوة في التاريخ)')
    const restored = useDoc.getState().doc
    ok(restored.slides[targetIndex].elements.length === before.slides[targetIndex].elements.length, 'العناصر الأصلية كاملة بعد التراجع')
  }

  // End-to-end generateDeck (local engine, no build) — the exact call the Create page makes.
  const gen = await generateDeck('عرض عن أثر القراءة في تنمية مهارات الأطفال', { slides: 6, skipBuild: true })
  ok(gen.spec.slides.length >= 4, `generateDeck ينتج مواصفة كاملة (${gen.spec.slides.length} شرائح)`)
  ok(gen.engine === 'local' && gen.outline.length === gen.spec.slides.length, 'المخطط والمصدر محليان متسقان')
  ok(!!gen.spec.theme && !!gen.spec.theme.palette.primary, 'الثيم المولّد مرفق بالمواصفة')
}

/* ================================================================ summary */

console.log(`\n${pass} ناجح، ${fail} فاشل`)
if (fail) {
  console.error(fails.map((f) => `  ✗ ${f}`).join('\n'))
  process.exit(1)
}
