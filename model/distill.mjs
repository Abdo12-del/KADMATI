/**
 * Teacher distillation — upgrade planner-generated targets with a strong teacher model.
 *
 * The planner examples teach *shape*; a teacher (GPT-4.1 / Claude / Gemini / DeepSeek via any
 * OpenAI-compatible endpoint) supplies real content. Every teacher answer must pass the same
 * schema gate the editor uses; failures keep the planner target so the file never shrinks.
 *
 *   TEACHER_URL=https://api.openai.com/v1/chat/completions TEACHER_KEY=sk-… TEACHER_MODEL=gpt-4.1 \
 *   node model/distill.mjs [--in model/data/train.jsonl] [--out model/data/train.distilled.jsonl] [--limit N] [--concurrency 4]
 *
 * Resumable: existing lines in --out are kept, matched by the user prompt.
 */
import { createReadStream, existsSync, appendFileSync, readFileSync } from 'node:fs'
import readline from 'node:readline'
import { validateOutline, validateRewrite, validateReview, opFromUser, sourceFromUser, countFromSystem } from './validate.mjs'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const IN = arg('--in', 'model/data/train.jsonl')
const OUT = arg('--out', 'model/data/train.distilled.jsonl')
const LIMIT = Number(arg('--limit', '0'))
const CONC = Number(arg('--concurrency', '4'))
const URL_ = process.env.TEACHER_URL, KEY = process.env.TEACHER_KEY ?? '', MODEL = process.env.TEACHER_MODEL ?? 'gpt-4.1'
if (!URL_) { console.error('Set TEACHER_URL (OpenAI-compatible chat completions endpoint).'); process.exit(1) }

const done = new Set()
if (existsSync(OUT)) for (const l of readFileSync(OUT, 'utf8').split('\n')) if (l.trim()) done.add(JSON.parse(l).messages[1].content)

const queue = []
for await (const line of readline.createInterface({ input: createReadStream(IN) })) {
  if (!line.trim()) continue
  const ex = JSON.parse(line)
  if (done.has(ex.messages[1].content)) continue
  queue.push(ex)
}
const todo = LIMIT ? queue.slice(0, LIMIT) : queue
console.log(`distilling ${todo.length} examples with ${MODEL}`)

const stats = { kept: 0, upgraded: 0, rejected: 0, errors: 0 }
async function teach(ex) {
  const [system, user] = ex.messages
  const json = ex.meta.task !== 'rewrite'
  const res = await fetch(URL_, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(KEY ? { Authorization: `Bearer ${KEY}` } : {}) },
    body: JSON.stringify({ model: MODEL, temperature: 0.4, ...(json ? { response_format: { type: 'json_object' } } : {}), messages: [system, user] }),
  })
  if (!res.ok) throw new Error(`${res.status}`)
  const out = (await res.json()).choices?.[0]?.message?.content?.trim()
  if (!out) throw new Error('empty')
  let v
  if (ex.meta.task === 'outline') v = validateOutline(out, { count: countFromSystem(system.content) })
  else if (ex.meta.task === 'rewrite') v = validateRewrite(sourceFromUser(user.content), out, opFromUser(user.content))
  else v = validateReview(out, JSON.parse(user.content).slides.length)
  return v.ok ? out : null
}

let i = 0
async function worker() {
  while (i < todo.length) {
    const ex = todo[i++]
    let next = null
    // Only planner/synthetic targets are replaced; gold stays gold.
    if (ex.meta.source !== 'gold') {
      try { next = await teach(ex) } catch { stats.errors++ }
    }
    if (next) { ex.messages[2].content = next; ex.meta.source = 'teacher'; ex.meta.teacher = MODEL; stats.upgraded++ }
    else if (ex.meta.source !== 'gold') stats.rejected++
    else stats.kept++
    appendFileSync(OUT, JSON.stringify(ex) + '\n')
    if ((stats.upgraded + stats.rejected + stats.kept) % 25 === 0) console.log(stats)
  }
}
await Promise.all(Array.from({ length: CONC }, worker))
console.log('done', stats, '→', OUT)
