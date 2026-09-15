/**
 * FINAL PRODUCT REVIEW harness — tests the shipped path like a first-time user would, minus the
 * pixels (no browser in CI): generate → load into the editor store → regenerate one slide →
 * undo → export PPTX (16:9 + 4:3) → structural OOXML audit → re-import roundtrip, plus the
 * provider ladder against a fake local Ollama (detection, models, structured JSON, retry,
 * repair, fallback) and a generation-quality audit across 8 real prompts.
 *
 * Run: node tests/ai/review.mjs
 */
import { JSDOM } from 'jsdom'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true, url: 'https://kadmati.local/' })
const { window } = dom
if (!window.document.fonts) window.document.fonts = { ready: Promise.resolve() }
for (const key of ['window', 'document', 'Node', 'Element', 'HTMLElement', 'HTMLDivElement', 'SVGElement', 'SVGSVGElement', 'Text', 'DocumentFragment', 'Document', 'NodeList', 'DOMTokenList', 'CustomEvent', 'MutationObserver', 'ResizeObserver', 'requestAnimationFrame', 'cancelAnimationFrame']) {
  let value = window[key]
  if (value === undefined && key === 'ResizeObserver') value = class { observe() {} unobserve() {} disconnect() {} }
  try { globalThis[key] = value } catch { Object.defineProperty(globalThis, key, { configurable: true, value }) }
}
for (const key of Object.getOwnPropertyNames(window)) {
  if (key in globalThis) continue
  let v
  try { v = window[key] } catch { continue }
  if (typeof v === 'function') { try { globalThis[key] = v } catch { /* read-only */ } }
}

import { build } from 'esbuild'

const PY_AUDIT = String.raw`
import sys, json, zipfile, re
p = sys.argv[1]
z = zipfile.ZipFile(p)
names = z.namelist()
pres = z.read('ppt/presentation.xml').decode('utf-8')
m = re.search(r'<p:sldSz cx="(\d+)" cy="(\d+)"', pres)
slides = [n for n in names if re.match(r'ppt/slides/slide\d+\.xml$', n)]
rtl = 0
fonts = set()
tables = 0
for n in slides:
    x = z.read(n).decode('utf-8')
    rtl += len(re.findall(r'rtl="1"', x))
    fonts |= set(re.findall(r'typeface="([^"]+)"', x))
    tables += x.count('<a:tbl>')
charts = 'yes' if any('charts/chart' in n for n in names) else 'no'
notes = len([n for n in names if re.match(r'ppt/notesSlides/notesSlide\d+\.xml$', n)])
svgs = len([n for n in names if n.endswith('.svg')])
media = len([n for n in names if n.startswith('ppt/media/')])
print(json.dumps({
  'slideSize': {'cx': int(m.group(1)), 'cy': int(m.group(2))},
  'slides': len(slides), 'rtlRuns': rtl, 'fonts': sorted(fonts)[:6],
  'tables': tables, 'charts': charts, 'notes': notes, 'svgs': svgs, 'media': media,
}))
`
import { mkdirSync } from 'node:fs'
mkdirSync('.tmp-verify', { recursive: true })
mkdirSync('.tmp-verify/review', { recursive: true })
// platform 'browser' matches tests/ai/verify.mjs — with 'node', esbuild tree-shakes the CJS
// named import of pptxtojson's parse down to `void 0` and importPptx crashes at runtime.
await build({ entryPoints: ['tests/ai/e2e-entry.ts'], bundle: true, format: 'esm', platform: 'browser', outfile: '.tmp-verify/review/e2e.mjs', logLevel: 'silent' })
const mod = await import('../../.tmp-verify/review/e2e.mjs')
const { generateDeck, regenerateCurrentSlide, applyDesignAction, suggestSlideAnimations, localPlan, polish, composeDeck, buildTheme, instantiateDeck, detectOllama, recommendModel, useDoc, useUI, exportToPptx, importPptx } = mod

let pass = 0
let fail = 0
const fails = []
const findings = []
function ok(cond, msg) {
  if (cond) pass++
  else { fail++; fails.push(msg); console.error('  ✗', msg) }
}
function finding(severity, area, text) {
  findings.push({ severity, area, text })
}

/* ================================================================ fake Ollama */

let server = null
let chatCalls = 0
let chatBehavior = 'valid' // valid | garbage | emptyslides | slow
const fakePlan = {
  title: 'خطة نمو من المزود',
  subtitle: 'مولّد من خادم محلي',
  slides: [
    { type: 'cover', title: 'خطة نمو من المزود', subtitle: 'مولّد من خادم محلي', notes: 'افتتح بالهدف.' },
    { type: 'statistics', title: 'مؤشرات الربع', stats: [{ value: '42%', label: 'نمو المستخدمين' }, { value: '1.8M', label: 'زيارات شهرية' }], notes: 'اربط كل رقم بقرار.' },
    { type: 'comparison', title: 'خياران للتوسع', comparison: { left: { title: 'عضوي', points: ['محتوى', 'مجتمع'] }, right: { title: 'مدفوع', points: ['حملات', 'شراكات'] } } },
    { type: 'process', title: 'خطة التنفيذ', steps: ['نُجهّز', 'نُطلق', 'نقيس', 'نوسّع'] },
    { type: 'closing', title: 'القرار المطلوب', bullets: ['الموافقة على الميزانية'] },
  ],
}

function startFakeOllama() {
  chatCalls = 0
  server = http.createServer((req, res) => {
    let body = ''
    req.on('data', (c) => (body += c))
    req.on('end', () => {
      if (req.url === '/api/tags') {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ models: [{ name: 'llama3:7b', size: 1 }, { name: 'qwen3:8b', size: 2 }, { name: 'qwen3:14b', size: 3 }] }))
        return
      }
      if (req.url === '/api/version') {
        res.end(JSON.stringify({ version: '0.6-fake' }))
        return
      }
      if (req.url === '/api/chat') {
        chatCalls++
        res.setHeader('Content-Type', 'application/json')
        if (chatBehavior === 'garbage') {
          res.end(JSON.stringify({ message: { content: 'أعتذر، لا أستطيع إخراج JSON. دعني أشرح لك الفكرة بنثريات طويلة بدل ذلك…' } }))
          return
        }
        if (chatBehavior === 'emptyslides') {
          res.end(JSON.stringify({ message: { content: JSON.stringify({ title: 'خ', slides: [] }) } }))
          return
        }
        res.end(JSON.stringify({ message: { content: JSON.stringify(fakePlan) } }))
        return
      }
      res.statusCode = 404
      res.end('{}')
    })
  })
  return new Promise((resolve) => server.listen(11434, '127.0.0.1', () => resolve(server)))
}
const stopFakeOllama = () => new Promise((r) => server?.close(() => r()))

const briefOf = (over = {}) => ({
  topic: 'موضوع',
  lang: 'ar',
  category: 'general',
  audience: 'جمهور',
  tone: 'واثقة',
  count: 8,
  density: 'balanced',
  style: 'professional',
  ...over,
})

/* ================================================================ 1) provider ladder (fake Ollama) */

console.log('— 5) مسار المزود المحلي (خادم Ollama وهمي) —')
{
  await startFakeOllama()

  // Detection + model recommendation
  const status = await detectOllama('http://127.0.0.1:11434')
  ok(status.ok && status.models.length === 3, `اكتشاف Ollama والنماذج (${status.models.length})`)
  const rec = recommendModel(status.models.map((m) => m.name), 'mid')
  ok(rec === 'qwen3:8b', `ترشيح النموذج حسب العتاد mid → ${rec}`)

  // A: valid structured plan from the provider — content must reach real slides
  useUI.setState({ ai: { ...useUI.getState().ai, provider: 'ollama', model: 'qwen3:8b', ollamaUrl: 'http://127.0.0.1:11434' } })
  const resA = await generateDeck('خطة نمو المتجر الإلكتروني', { slides: 5, lang: 'ar' })
  ok(resA.engine === 'ollama', `المحرك المُستخدم = ${resA.engine}`)
  ok(resA.spec.slides.some((sl) => String(sl.content?.title ?? '').includes('المزود')), 'محتوى المزود وصل إلى الشرائح فعليًا')
  ok(chatCalls === 1, `محاولة JSON واحدة عند نجاح أول محاولة (${chatCalls})`)
  ok(resA.spec.slides.every((sl) => LAYOUT_KNOWN(sl)), 'شرائح المزود مرّت كلها عبر محرك التخطيطات')
  const providerStatsSlide = resA.spec.slides.find((sl) => sl.data?.chart)
  void providerStatsSlide

  // B: garbage answer → falls back to local, never breaks
  chatBehavior = 'garbage'
  chatCalls = 0
  const resB = await generateDeck('موضوع الاحتياطي عند فشل المزود', { slides: 6, lang: 'ar' })
  ok(resB.engine === 'local' && /فشل العقد|قواعدي|محلي/.test(resB.engineDetail), `سقوط آمن عند رد غير صالح (${resB.engineDetail})`)
  ok(resB.spec.slides.length >= 4, 'العرض الاحتياطي كامل الشرائح')
  ok(chatCalls >= 1, `المزود استُفسر قبل السقوط (${chatCalls})`)

  // C: valid JSON but empty slides → retry once → fallback
  chatBehavior = 'emptyslides'
  chatCalls = 0
  const resC = await generateDeck('اختبار إعادة المحاولة', { slides: 6, lang: 'ar' })
  ok(resC.engine === 'local', 'السقوط بعد فشل العقد مرتين')
  ok(chatCalls === 2, `إعادة المحاولة مرة واحدة بالضبط (${chatCalls})`)

  await stopFakeOllama()

  // D: server unreachable → instant local, no crash
  chatCalls = 0
  const resD = await generateDeck('اختبار عدم توفر الخادم', { slides: 6, lang: 'ar' })
  ok(resD.engine === 'local', 'عند تعذر Ollama: المحرك المحلي فورًا')
  ok(resD.spec.slides.length >= 4, 'والعرض سليم كامل')
  ok(chatCalls === 0, 'بلا طلبات معلقة')

  // E: detection of a dead server reports a clean error string (feeds the UI chip)
  const dead = await detectOllama('http://127.0.0.1:11434')
  ok(!dead.ok && (dead.error === 'unreachable' || dead.error === 'timeout'), `رسالة عدم التوفر واضحة (${dead.error})`)
}

/* ================================================================ 2) quality audit across 8 real prompts */

console.log('— 2) جودة التوليد عبر 8 عروض حقيقية (المحرك المحلي) —')
const PROMPTS = [
  { id: 'ai-education-ar', prompt: 'أنشئ عرضًا عن الذكاء الاصطناعي في التعليم', opts: { slides: 9, lang: 'ar', category: 'education' } },
  { id: 'digital-marketing-ar', prompt: 'عرض تقديمي عن التسويق الرقمي', opts: { slides: 9, lang: 'ar', category: 'marketing' } },
  { id: 'pitch-app-ar', prompt: 'أريد Pitch Deck لتطبيق تعليمي للأطفال', opts: { slides: 11, lang: 'ar', category: 'pitch' } },
  { id: 'climate-ar', prompt: 'أسباب تغير المناخ وتأثيرها على المنطقة العربية', opts: { slides: 9, lang: 'ar' } },
  { id: 'tiny-ar', prompt: 'القهوة', opts: { slides: 5, lang: 'ar' } },
  { id: 'long-ar', prompt: 'عرض تفصيلي عن استراتيجية التحول الرقمي للبنك خلال 2027: الأرقام 45% نمو و12% خفض تكاليف، مقارنة بين المسارين، خطة من ثلاث مراحل، مؤشرات القياس، المخاطر وحلولها، وخطة التدريب', opts: { slides: 14, lang: 'ar', category: 'business' } },
  { id: 'solaire-fr', prompt: "Une présentation sur l'énergie solaire en Afrique du Nord pour des investisseurs", opts: { slides: 9, lang: 'fr' } },
  { id: 'growth-en', prompt: 'A detailed presentation about product-led growth for a B2B SaaS company', opts: { slides: 10, lang: 'en', category: 'business' } },
]

const generated = {}
for (const item of PROMPTS) {
  const res = await generateDeck(item.prompt, { ...item.opts, aspect: '16:9' })
  const doc = res.doc
  generated[item.id] = { res, doc }
  const layouts = doc.slides.map((sl) => sl.layoutId)
  const distinct = new Set(layouts).size
  const maxRun = maxConsecutive(layouts)
  const wordsPerSlide = doc.slides.map((sl) => slideWords(sl))
  const maxWords = Math.max(...wordsPerSlide)
  const titles = doc.slides.map((sl) => plainTitle(sl))
  const uniqueTitles = new Set(titles.map((t) => t.toLowerCase())).size
  const emptySlides = doc.slides.filter((sl) => {
    if (sl.elements.length >= 3) return false
    // A focused slide may be title + one big element (chart/table) — that is not empty.
    return !sl.elements.some((e) => e.kind === 'chart' || e.kind === 'table')
  }).length

  ok(doc.slides.length >= Math.min(4, item.opts.slides) - 1, `${item.id}: عدد الشرائح ${doc.slides.length}`)
  ok(distinct >= Math.min(4, doc.slides.length), `${item.id}: تنوع التخطيطات ${distinct} من ${doc.slides.length}`)
  ok(maxRun <= 2, `${item.id}: أطول تكرار متتالي لتخطيط = ${maxRun} (≤2)`)
  ok(maxWords <= 80, `${item.id}: أعلى كثافة كلمات ${maxWords} (≤80)`)
  ok(uniqueTitles === titles.length, `${item.id}: العناوين كلها فريدة`)
  ok(emptySlides === 0, `${item.id}: لا شرائح فارغة`)

  // Hierarchy: every slide with body text has a clearly larger title.
  const weakHierarchy = doc.slides.filter((sl) => {
    const title = sl.elements.find((e) => e.kind === 'text' && e.role === 'title')
    const body = sl.elements.find((e) => e.kind === 'text' && (e.role === 'body' || e.role === 'list'))
    return title && body && title.kind === 'text' && body.kind === 'text' && title.font.fontSize < body.font.fontSize * 1.5
  }).length
  ok(weakHierarchy === 0, `${item.id}: تسلسل هرمي واضح في كل الشرائح (${weakHierarchy} ضعيفة)`)

  // Arabic correctness: RTL dir on every text element of Arabic decks.
  if (item.opts.lang === 'ar') {
    const badDir = doc.slides.flatMap((sl) => sl.elements).filter((e) => e.kind === 'text' && e.font.dir !== 'rtl').length
    ok(badDir === 0, `${item.id}: كل النصوص rtl (${badDir} مخالفة)`)
    ok(doc.metadata.dir === 'rtl' && doc.metadata.lang === 'ar', `${item.id}: بيانات المستند rtl/ar`)
  }
  if (item.opts.lang === 'fr' || item.opts.lang === 'en') {
    ok(doc.metadata.dir === 'ltr', `${item.id}: اتجاه المستند ltr`)
  }
  // Visual slides carry real art assets; data slides carry native data.
  const imageText = doc.slides.filter((sl) => sl.layoutId === 'image-text' || sl.background.type === 'image')
  const missingArt = imageText.filter((sl) => {
    const imgs = sl.elements.filter((e) => e.kind === 'image')
    const bgHas = sl.background.type === 'image'
    return !bgHas && imgs.every((e) => !(e.kind === 'image' && e.assetId))
  })
  ok(missingArt.length === 0, `${item.id}: الشرائح البصرية تحمل صورًا فعلية (${missingArt.length} ناقصة)`)
  // Notes: speaker guidance exists almost everywhere.
  const withNotes = doc.slides.filter((sl) => sl.notes.trim().length > 0).length
  ok(withNotes >= doc.slides.length * 0.7, `${item.id}: ملاحظات متحدث في ${withNotes}/${doc.slides.length}`)
  // Animations suggested and valid.
  const deadAnim = doc.slides.filter((sl) => (sl.animations ?? []).some((a) => !sl.elements.some((e) => e.id === a.target))).length
  ok(deadAnim === 0, `${item.id}: كل الحركات تستهدف عناصر موجودة`)
}

function LAYOUT_KNOWN(spec) {
  return typeof spec.layout === 'string' && spec.layout.length > 0
}
function maxConsecutive(list) {
  let best = 1
  let run = 1
  for (let i = 1; i < list.length; i++) {
    run = list[i] === list[i - 1] ? run + 1 : 1
    best = Math.max(best, run)
  }
  return best
}
function slideWords(slide) {
  return slide.elements.reduce((n, el) => {
    if (el.kind === 'text') return n + el.content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
    if (el.kind === 'table') return n + el.cells.flat().reduce((m, c) => m + String(c.text ?? '').split(/\s+/).filter(Boolean).length, 0)
    return n
  }, 0)
}
function plainTitle(slide) {
  const t = slide.elements.find((e) => e.kind === 'text' && e.role === 'title')
  return t && t.kind === 'text' ? t.content.replace(/<[^>]+>/g, '').trim() : ''
}

/* ================================================================ 3) full path: editor + regenerate + undo + animations */

console.log('— 7+8) المسار داخل المحرر: إعادة توليد شريحة، التراجع، الحركات —')
{
  const { res, doc } = generated['ai-education-ar']
  void res
  useDoc.getState().load(doc, 'p_review')
  const before = useDoc.getState().doc
  const target = 3
  useDoc.getState().gotoSlide(target)
  const otherIdx = 1
  const otherBefore = JSON.stringify({ els: before.slides[otherIdx].elements.map((e) => e.id), anims: before.slides[otherIdx].animations?.map((a) => a.id) })
  const beforeIds = JSON.stringify(before.slides[target].elements.map((e) => e.id))
  const beforeAnims = JSON.stringify(before.slides[target].animations?.map((a) => a.id))

  const regen = await regenerateCurrentSlide('اجعلها أكثر بصرية')
  ok(!!regen, `إعادة التوليد تعمل (${regen?.source})`)
  const after = useDoc.getState().doc
  ok(after.slides.length === before.slides.length, 'عدد الشرائح ثابت')
  ok(after.slides[target].id === before.slides[target].id, 'معرّف الشريحة محفوظ')
  ok(JSON.stringify(after.slides[target].elements.map((e) => e.id)) !== beforeIds, 'عناصر الشريحة أُعيد بناؤها')
  ok(JSON.stringify(after.slides[target].animations?.map((a) => a.id)) !== beforeAnims, 'حركات الشريحة أعيد بناؤها (لا أهداف ميتة)')
  ok((after.slides[target].animations ?? []).every((a) => after.slides[target].elements.some((e) => e.id === a.target)), 'كل حركات الشريحة الجديدة صالحة')
  ok(JSON.stringify({ els: after.slides[otherIdx].elements.map((e) => e.id), anims: after.slides[otherIdx].animations?.map((a) => a.id) }) === otherBefore, 'الشرائح الأخرى (عناصرها وحركاتها) لم تتغير')

  // Undo rolls back to the pre-AI document.
  let restored = false
  for (let i = 0; i < 10 && !restored; i++) {
    if (!useDoc.temporal.getState().pastStates.length) break
    useDoc.getState().undo()
    restored = JSON.stringify(useDoc.getState().doc.slides[target].elements.map((e) => e.id)) === beforeIds
  }
  ok(restored, 'التراجع يعيد المستند إلى ما قبل الذكاء')

  // Design actions are deterministic and safe on the same doc.
  const note = await applyDesignAction('simplify')
  ok(typeof note === 'string' && note.length > 0, `فعل التصميم «بسّط» يعمل (${note})`)
}

/* ================================================================ 4) PPTX export (16:9 ar, 4:3 en) + structural audit + roundtrip */

console.log('— 9) تصدير PPTX: الحجم، RTL، الخطوط، المخططات، الجداول + roundtrip —')
{
  const outDir = '.tmp-verify/review'
  const jobs = [
    { name: 'ar-16x9.pptx', doc: generated['ai-education-ar'].doc },
    { name: 'en-4x3.pptx', doc: (await generateDeck('Quarterly growth review with numbers 21% 34% and 12%', { slides: 8, lang: 'en', category: 'business', aspect: '4:3' })).doc },
    { name: 'ar-long.pptx', doc: generated['long-ar'].doc },
  ]
  for (const job of jobs) {
    const { blob, result } = await exportToPptx(job.doc, { includeNotes: true })
    const buf = Buffer.from(await blob.arrayBuffer())
    const file = path.join(outDir, job.name)
    fs.writeFileSync(file, buf)
    ok(buf.length > 20_000, `${job.name}: حجم معقول (${Math.round(buf.length / 1024)}KB)`)
    ok(result.rasterized.length === 0 || result.rasterized.every((r) => !/تعذّر/.test(r.reason)), `${job.name}: بلا أخطاء تصدير (${result.rasterized.length} تبسيط)`)

    // Structural audit via python (zipfile ships with it).
    const audit = JSON.parse(execFileSync('python3', ['-c', PY_AUDIT, file], { encoding: 'utf8' }))
    const expect43 = job.name.includes('4x3')
    const expectW = expect43 ? 9144000 : 12192000
    ok(audit.slideSize.cx === expectW, `${job.name}: أبعاد الصفحة ${audit.slideSize.cx}×${audit.slideSize.cy} EMU (${expect43 ? '4:3' : '16:9'})`)
    ok(audit.slides === job.doc.slides.length, `${job.name}: عدد ملفات الشرائح ${audit.slides}`)
    if (job.doc.metadata.dir === 'rtl') ok(audit.rtlRuns > 0, `${job.name}: خصائص RTL موجودة (${audit.rtlRuns} فقرة rtl)`)
    ok(audit.fonts.length > 0, `${job.name}: خطوط مضمّنة بالاسم (${audit.fonts.slice(0, 3).join(', ')})`)
    const hasChart = job.doc.slides.some((sl) => sl.elements.some((e) => e.kind === 'chart'))
    ok(audit.charts === (hasChart ? 'yes' : 'no') || !hasChart || audit.charts === 'yes', `${job.name}: مخططات أصلية (${audit.charts})`)
    const hasTable = job.doc.slides.some((sl) => sl.elements.some((e) => e.kind === 'table'))
    if (hasTable) ok(audit.tables > 0, `${job.name}: جداول أصلية (${audit.tables})`)
    ok(audit.notes === job.doc.slides.filter((sl) => sl.notes.trim()).length, `${job.name}: ملاحظات المتحدث ${audit.notes}`)

    // Roundtrip: import our own export and sanity-compare.
    const data = fs.readFileSync(file)
    const fileLike = { arrayBuffer: async () => data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), name: job.name }
    const back = await importPptx(fileLike)
    ok(back.doc.slides.length === job.doc.slides.length, `${job.name}: roundtrip — نفس عدد الشرائح (${back.doc.slides.length})`)
    const textBefore = job.doc.slides.flatMap((sl) => sl.elements).filter((e) => e.kind === 'text').map((e) => e.kind === 'text' && e.content.replace(/<[^>]+>/g, '').trim()).filter(Boolean)
    const textAfter = back.doc.slides.flatMap((sl) => sl.elements).filter((e) => e.kind === 'text').map((e) => e.kind === 'text' && e.content.replace(/<[^>]+>/g, '').trim()).filter(Boolean)
    const kept = textBefore.filter((t) => textAfter.some((u) => u.includes(String(t).slice(0, 12)))).length
    ok(kept >= textBefore.length * 0.6, `${job.name}: roundtrip — ${kept}/${textBefore.length} نصًا موجودًا بعد الاستيراد`)
  }
}

/* ================================================================ report */

console.log(`\n${pass} فحصًا ناجحًا، ${fail} فاشلًا`)
fs.writeFileSync('.tmp-verify/review/findings.json', JSON.stringify({ pass, fail, fails, findings }, null, 2))
if (fail) {
  console.error(fails.map((f) => `  ✗ ${f}`).join('\n'))
  process.exit(1)
}

