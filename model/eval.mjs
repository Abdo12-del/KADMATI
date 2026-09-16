/**
 * Evaluate any OpenAI-compatible endpoint (our gateway, vLLM, or a third-party provider) on the
 * validation set with the *product's* acceptance criteria — not perplexity.
 *
 *   node model/eval.mjs --url http://127.0.0.1:8787/v1/chat/completions --model aurova-deck-1
 *   node model/eval.mjs --url https://api.openai.com/v1/chat/completions --model gpt-4.1-mini --key sk-…
 *
 * Metrics
 *   schema_ok      share of outline/review answers that pass the editor's gate unchanged
 *   frame_ok       title first + closing last
 *   count_ok       |slides − requested| ≤ 2
 *   rewrite_ok     passes `acceptable()`; shorten really shortens
 *   lang_ok        answer language matches the requested one
 *   latency_p50/p95
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { validateOutline, validateRewrite, validateReview, opFromUser, sourceFromUser, countFromSystem, parseLoose } from './validate.mjs'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const URL_ = arg('--url', 'http://127.0.0.1:8787/v1/chat/completions')
const MODEL = arg('--model', 'aurova-deck-1')
const KEY = arg('--key', process.env.EVAL_KEY ?? '')
const FILE = arg('--valid', 'model/data/valid.jsonl')
const LIMIT = Number(arg('--limit', '0'))
const CONC = Number(arg('--concurrency', '4'))

const rows = readFileSync(FILE, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))
const todo = LIMIT ? rows.slice(0, LIMIT) : rows
const isAr = (s) => (s.match(/[\u0600-\u06FF]/g)?.length ?? 0) > (s.match(/[A-Za-z]/g)?.length ?? 0)

const results = []
let i = 0
async function worker() {
  while (i < todo.length) {
    const ex = todo[i++]
    const [system, user] = ex.messages
    const t0 = performance.now()
    let out = null, err = null
    try {
      const res = await fetch(URL_, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(KEY ? { Authorization: `Bearer ${KEY}` } : {}) },
        body: JSON.stringify({ model: MODEL, temperature: 0.3, ...(ex.meta.task !== 'rewrite' ? { response_format: { type: 'json_object' } } : {}), messages: [system, user] }) })
      if (!res.ok) err = `http ${res.status}`
      else out = (await res.json()).choices?.[0]?.message?.content ?? null
    } catch (e) { err = e.message }
    const ms = performance.now() - t0
    const r = { task: ex.meta.task, lang: ex.meta.lang, ms, err, schema_ok: false, frame_ok: null, count_ok: null, lang_ok: null, hint_cov: null, reasons: [] }
    if (out) {
      if (ex.meta.task === 'outline') {
        const count = countFromSystem(system.content)
        const v = validateOutline(out, { count })
        r.schema_ok = v.ok; r.reasons = v.reasons
        r.frame_ok = !v.reasons.some((x) => x.startsWith('no-')) && !v.reasons.includes('not-json')
        r.count_ok = !v.reasons.includes('count-off') && !v.reasons.includes('not-json')
        r.hint_cov = v.total ? v.hinted / v.total : 0
        const o = parseLoose(out); const text = o?.slides?.map((s) => s.title).join(' ') ?? ''
        r.lang_ok = text ? isAr(text) === (ex.meta.lang === 'ar') : false
      } else if (ex.meta.task === 'rewrite') {
        const v = validateRewrite(sourceFromUser(user.content), out, opFromUser(user.content))
        r.schema_ok = v.ok; r.reasons = v.reasons
        r.lang_ok = isAr(out) === (ex.meta.lang === 'ar')
      } else {
        const v = validateReview(out, JSON.parse(user.content).slides.length)
        r.schema_ok = v.ok; r.reasons = v.reasons
      }
    }
    results.push(r)
    if (results.length % 10 === 0) process.stdout.write(`\r${results.length}/${todo.length}`)
  }
}
await Promise.all(Array.from({ length: CONC }, worker))
console.log()

const pct = (arr, f) => (arr.length ? Math.round((arr.filter(f).length / arr.length) * 1000) / 10 : null)
const q = (arr, p) => { const s = arr.slice().sort((a, b) => a - b); return s.length ? Math.round(s[Math.min(s.length - 1, Math.floor(p * s.length))]) : null }
const byTask = {}
for (const task of ['outline', 'rewrite', 'review']) {
  const rs = results.filter((r) => r.task === task)
  if (!rs.length) continue
  byTask[task] = {
    n: rs.length,
    errors: rs.filter((r) => r.err).length,
    schema_ok: pct(rs, (r) => r.schema_ok),
    ...(task === 'outline' ? { frame_ok: pct(rs, (r) => r.frame_ok), count_ok: pct(rs, (r) => r.count_ok), design_hints: Math.round((rs.reduce((a, r) => a + (r.hint_cov ?? 0), 0) / rs.length) * 100) } : {}),
    ...(task !== 'review' ? { lang_ok: pct(rs, (r) => r.lang_ok) } : {}),
    latency_p50: q(rs.map((r) => r.ms), 0.5),
    latency_p95: q(rs.map((r) => r.ms), 0.95),
  }
}
const failures = {}
for (const r of results) for (const x of r.reasons) { const k = x.replace(/@\d+$/, ''); failures[k] = (failures[k] ?? 0) + 1 }
const report = { url: URL_, model: MODEL, date: new Date().toISOString(), byTask, top_failures: Object.fromEntries(Object.entries(failures).sort((a, b) => b[1] - a[1]).slice(0, 10)) }
console.table(byTask)
console.log('top failures', report.top_failures)
mkdirSync('model/reports', { recursive: true })
const file = `model/reports/${MODEL.replace(/[^a-z0-9.-]+/gi, '_')}-${Date.now()}.json`
writeFileSync(file, JSON.stringify(report, null, 2))
console.log('→', file)
