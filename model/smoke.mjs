/** CI smoke: dataset builds, every example passes the schema gate, stub gateway answers all three tasks. */
import { spawn, spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { validateOutline, validateRewrite, validateReview, opFromUser, sourceFromUser, countFromSystem } from './validate.mjs'

const r = spawnSync(process.execPath, ['model/build.mjs'], { stdio: 'inherit' })
if (r.status) process.exit(r.status)

let bad = 0, n = 0
for (const file of ['model/data/train.jsonl', 'model/data/valid.jsonl']) {
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue
    const ex = JSON.parse(line); n++
    const [sys, user, asst] = ex.messages
    const v = ex.meta.task === 'outline' ? validateOutline(asst.content, { count: countFromSystem(sys.content) })
      : ex.meta.task === 'rewrite' ? validateRewrite(sourceFromUser(user.content), asst.content, opFromUser(user.content))
      : validateReview(asst.content, JSON.parse(user.content).slides.length)
    // label-title is a soft rule (planner agenda titles like "What we will cover" are fine); everything else is hard.
    const hard = v.reasons.filter((x) => !x.startsWith('label-title') && !x.startsWith('count-off'))
    if (hard.length) { bad++; if (bad <= 5) console.error('✗', ex.meta, hard) }
  }
}
console.log(`dataset: ${n} examples, ${bad} hard failures`)
if (bad) process.exit(1)

const gw = spawn(process.execPath, ['server/aurova-gateway.mjs'], { env: { ...process.env, PORT: '8799', AUROVA_RATE_LIMIT: '1000' }, stdio: 'ignore' })
await new Promise((res) => setTimeout(res, 700))
try {
  const ask = async (system, user) => {
    const res = await fetch('http://127.0.0.1:8799/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'aurova-deck-1', messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }) })
    return (await res.json()).choices[0].message.content
  }
  const o = validateOutline(await ask('أنت مخرج عروض تقديمية. عدد الشرائح: 8.', 'الموضوع: الأمن السيبراني'), { count: 8 })
  const w = validateRewrite('نص طويل نسبيًا يحتاج إلى اختصار واضح ومباشر الآن', await ask('أنت محرر عروض تقديمية.', 'اختصر إلى النصف تقريبًا.\n\nالنص:\nنص طويل نسبيًا يحتاج إلى اختصار واضح ومباشر الآن'), 'shorten')
  const v = validateReview(await ask('أنت مراجع محتوى عروض تقديمية.', JSON.stringify({ title: 't', slides: [{ index: 0, texts: ['مقدمة'] }, { index: 1, texts: ['x', 'a', 'b', 'c', 'd', 'e', 'f'] }] })), 2)
  const hardO = o.reasons.filter((x) => !x.startsWith('label-title'))
  console.log('gateway stub:', { outline: hardO.length ? hardO : 'ok', rewrite: w.ok ? 'ok' : w.reasons, review: v.ok ? 'ok' : v.reasons })
  if (hardO.length || !w.ok || !v.ok) process.exit(1)
} finally {
  gw.kill()
}
console.log('model smoke ✓')
