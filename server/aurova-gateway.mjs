#!/usr/bin/env node
/**
 * Aurova Model gateway — the server the browser talks to for the "Aurova Model" source.
 *
 *   node server/aurova-gateway.mjs            # stub mode: deterministic outlines, no GPU needed
 *   AUROVA_UPSTREAM_URL=http://127.0.0.1:8000/v1/chat/completions \
 *   AUROVA_UPSTREAM_KEY=... node server/aurova-gateway.mjs   # forward to vLLM / llama.cpp / any OpenAI-compatible server
 *
 * Responsibilities (kept deliberately small, zero dependencies):
 *   • expose POST /v1/chat/completions (OpenAI schema) so the client code stays identical
 *   • hold the upstream key server-side — the browser never sees it
 *   • per-IP rate limiting and request size cap
 *   • model-name mapping: aurova-deck-1 → whatever the upstream calls the fine-tuned checkpoint
 *
 * The Vite dev server proxies /api/aurova/* here (see vite.config.ts).
 */
import http from 'node:http'

const PORT = Number(process.env.PORT ?? 8787)
const UPSTREAM = process.env.AUROVA_UPSTREAM_URL ?? ''
const UPSTREAM_KEY = process.env.AUROVA_UPSTREAM_KEY ?? ''
const MODEL_MAP = {
  'aurova-deck-1': process.env.AUROVA_MODEL_DECK ?? 'aurova-deck-1',
  'aurova-deck-1-mini': process.env.AUROVA_MODEL_MINI ?? 'aurova-deck-1-mini',
}
const RATE = { windowMs: 60_000, max: Number(process.env.AUROVA_RATE_LIMIT ?? 30) }
const MAX_BODY = 256 * 1024

const hits = new Map()
function limited(ip) {
  const now = Date.now()
  const rec = hits.get(ip) ?? { start: now, n: 0 }
  if (now - rec.start > RATE.windowMs) Object.assign(rec, { start: now, n: 0 })
  rec.n++
  hits.set(ip, rec)
  return rec.n > RATE.max
}

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' })
  res.end(JSON.stringify(body))
}

/* ---------------------------------------------------------------- stub model */

function stubOutline(userText, count) {
  const topic = (userText.match(/الموضوع:\s*(.+)/)?.[1] ?? userText.split('\n')[0] ?? 'الموضوع').trim()
  const ar = /[\u0600-\u06FF]/.test(topic)
  const t = (arText, enText) => (ar ? arText : enText)
  const n = Math.max(4, Math.min(count || 8, 14))
  const slides = [
    { kind: 'title', title: topic, takeaways: [t('عرض من إعداد نموذج Aurova (وضع التجربة)', 'Prepared by the Aurova model (stub mode)')] },
    { kind: 'agenda', title: t('ما سنغطيه', 'What we will cover'), takeaways: [t('السياق', 'Context'), t('التحليل', 'Analysis'), t('الخطة', 'Plan'), t('القرار', 'Decision')] },
  ]
  const middle = [
    { kind: 'content', title: t(`لماذا ${topic} الآن`, `Why ${topic} now`), takeaways: [t('تغيّر في السوق يفتح نافذة قصيرة', 'A market shift opens a short window'), t('التكلفة تتضاعف مع التأخير', 'Cost of delay compounds'), t('لدينا القدرة الداخلية للبدء', 'We already have the internal capacity')] },
    { kind: 'stats', title: t('الأرقام التي تهم', 'The numbers that matter'), stat: [{ value: '3×', label: t('عائد متوقع', 'Expected return') }, { value: '90', label: t('يومًا للنتائج الأولى', 'days to first results') }, { value: '12%', label: t('وفر تشغيلي', 'Operating savings') }] },
    { kind: 'comparison', title: t('الوضع الحالي مقابل المستهدف', 'Current vs. target'), takeaways: [t('يدوي ومتفرّق ← موحّد وآلي', 'Manual and scattered → unified and automated'), t('قرارات شهرية ← أسبوعية', 'Monthly decisions → weekly')] },
    { kind: 'process', title: t('كيف ننفّذ', 'How we execute'), steps: [t('تشخيص', 'Diagnose'), t('تجربة محدودة', 'Pilot'), t('توسيع', 'Scale'), t('قياس', 'Measure')] },
    { kind: 'timeline', title: t('الجدول الزمني', 'Timeline'), takeaways: [t('الربع الأول: الأساس', 'Q1: foundation'), t('الربع الثاني: التجربة', 'Q2: pilot'), t('الربع الثالث: التعميم', 'Q3: rollout')] },
    { kind: 'quote', title: t('ما يقوله العملاء', 'What customers say'), quote: { text: t('لم نكن نعرف كم نخسر حتى قسنا.', "We didn't know how much we were losing until we measured."), by: t('مدير عمليات', 'Operations lead') } },
    { kind: 'content', title: t('المخاطر وكيف نحتويها', 'Risks and how we contain them'), takeaways: [t('اعتماد الفريق: تدريب مبكر', 'Adoption: train early'), t('التكلفة: مراحل ممولة تدريجيًا', 'Cost: staged funding'), t('الجودة: بوابات قياس', 'Quality: measurement gates')] },
  ]
  while (slides.length < n - 1) slides.push(middle[(slides.length - 2) % middle.length])
  slides.push({ kind: 'closing', title: t('ما نطلبه الآن', 'What we ask for'), takeaways: [t('الموافقة على التجربة المحدودة', 'Approve the pilot'), t('تسمية مالك للمبادرة', 'Name an owner')] })
  return { slides }
}

function stubRewrite(userText) {
  const src = userText.split(/النص:\s*/)[1]?.trim() ?? userText
  if (/عنوانًا/.test(userText)) return src.split(/\s+/).slice(0, 6).join(' ')
  if (/اختصر/.test(userText)) return src.split(/\s+/).slice(0, Math.ceil(src.split(/\s+/).length / 2)).join(' ')
  return src.replace(/\s+/g, ' ').trim()
}

function stubReview(userText) {
  let slides = []
  try {
    slides = JSON.parse(userText).slides ?? []
  } catch {}
  const issues = []
  for (const s of slides) {
    const title = s.texts?.[0] ?? ''
    if (title && title.split(/\s+/).length <= 2) issues.push({ slide: s.index, severity: 'warn', message: 'العنوان تسمية قسم لا فكرة.', hint: 'صِغه كجملة تحمل الاستنتاج.' })
    if ((s.texts?.length ?? 0) > 6) issues.push({ slide: s.index, severity: 'info', message: 'الشريحة مزدحمة بالنقاط.', hint: 'قسّمها أو ادمج المتشابه.' })
    if (issues.length >= 8) break
  }
  return { issues }
}

function stubReply(body) {
  const user = body.messages?.find((m) => m.role === 'user')?.content ?? ''
  const system = body.messages?.find((m) => m.role === 'system')?.content ?? ''
  if (/ping/.test(user) && /OK/.test(system)) return 'OK'
  if (/مراجع محتوى/.test(system)) return JSON.stringify(stubReview(user))
  if (/مخرج عروض/.test(system)) return JSON.stringify(stubOutline(user, Number(system.match(/عدد الشرائح:\s*(\d+)/)?.[1])))
  return stubRewrite(user)
}

/* ---------------------------------------------------------------- server */

async function handle(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS' })
    return res.end()
  }
  if (req.method === 'GET' && req.url === '/health') return json(res, 200, { ok: true, mode: UPSTREAM ? 'upstream' : 'stub', models: Object.keys(MODEL_MAP) })
  if (req.method === 'GET' && req.url === '/v1/models') return json(res, 200, { data: Object.keys(MODEL_MAP).map((id) => ({ id, object: 'model', owned_by: 'aurova' })) })
  if (req.method !== 'POST' || !req.url.endsWith('/v1/chat/completions')) return json(res, 404, { error: 'not found' })

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown'
  if (limited(ip)) return json(res, 429, { error: 'rate limited' })

  let raw = ''
  for await (const chunk of req) {
    raw += chunk
    if (raw.length > MAX_BODY) return json(res, 413, { error: 'payload too large' })
  }
  let body
  try {
    body = JSON.parse(raw)
  } catch {
    return json(res, 400, { error: 'invalid json' })
  }
  if (!(body.model in MODEL_MAP)) return json(res, 400, { error: `unknown model ${body.model}` })

  if (!UPSTREAM) {
    const content = stubReply(body)
    return json(res, 200, { id: `aurova-${Date.now().toString(36)}`, object: 'chat.completion', model: body.model, choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }] })
  }

  try {
    const up = await fetch(UPSTREAM, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(UPSTREAM_KEY ? { Authorization: `Bearer ${UPSTREAM_KEY}` } : {}) },
      body: JSON.stringify({ ...body, model: MODEL_MAP[body.model] }),
    })
    const text = await up.text()
    res.writeHead(up.status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' })
    res.end(text)
  } catch (err) {
    json(res, 502, { error: `upstream unreachable: ${err.message}` })
  }
}

http.createServer((req, res) => void handle(req, res)).listen(PORT, '0.0.0.0', () => {
  console.log(`Aurova gateway on :${PORT} — mode: ${UPSTREAM ? `upstream → ${UPSTREAM}` : 'stub (no model attached)'}`)
})
