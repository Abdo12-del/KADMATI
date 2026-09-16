/**
 * Schema gate shared by distillation and evaluation. Mirrors what the app enforces on model
 * output (`normalizeProviderSlide`, `acceptable`), so anything that passes here is usable in
 * the editor unchanged.
 */
export const KINDS = new Set(['title', 'agenda', 'content', 'stats', 'quote', 'comparison', 'process', 'timeline', 'closing'])
export const LAYOUTS = new Set(['blank', 'title', 'title-centered', 'title-content', 'two-columns', 'image-text', 'full-image', 'quote', 'statistics', 'timeline', 'process', 'comparison', 'chart', 'table', 'section', 'closing'])
export const ARTS = new Set(['aurora', 'grid', 'waves', 'city', 'lab', 'portrait', 'product', 'paper'])
export const BGS = new Set(['default', 'primary', 'surface', 'dark', 'image', 'pattern'])
const wc = (s) => s.trim().split(/\s+/).filter(Boolean).length

export function parseLoose(raw) {
  const text = String(raw).trim().replace(/^```(?:json)?/i, '').replace(/```$/, '')
  try {
    return JSON.parse(text)
  } catch {
    const a = text.indexOf('{'), b = text.lastIndexOf('}')
    if (a >= 0 && b > a) {
      try { return JSON.parse(text.slice(a, b + 1)) } catch { return null }
    }
    return null
  }
}

/** @returns {{ok:boolean, reasons:string[]}} */
export function validateOutline(raw, { count } = {}) {
  const reasons = []
  const obj = parseLoose(raw)
  if (!obj || !Array.isArray(obj.slides)) return { ok: false, reasons: ['not-json'] }
  const s = obj.slides
  if (s.length < 3) reasons.push('too-few')
  if (s[0]?.kind !== 'title') reasons.push('no-title-first')
  if (s[s.length - 1]?.kind !== 'closing') reasons.push('no-closing-last')
  if (count && Math.abs(s.length - count) > 2) reasons.push('count-off')
  s.forEach((x, i) => {
    if (!KINDS.has(x.kind)) reasons.push(`kind@${i}`)
    if (typeof x.title !== 'string' || !x.title.trim()) reasons.push(`title@${i}`)
    else if (/[#*_`]/.test(x.title)) reasons.push(`markdown@${i}`)
    else if (i > 0 && i < s.length - 1 && wc(x.title) < 2 && x.kind !== 'quote') reasons.push(`label-title@${i}`)
    const pts = x.takeaways ?? x.steps ?? []
    if (pts.length > 5) reasons.push(`too-many-points@${i}`)
    if (pts.some((p) => typeof p !== 'string' || wc(p) > 22)) reasons.push(`long-point@${i}`)
    if (x.kind === 'stats' && !(x.stat?.length)) reasons.push(`stats-empty@${i}`)
    if (x.kind === 'quote' && !x.quote?.text) reasons.push(`quote-empty@${i}`)
    // design hints are optional but must come from the closed sets
    if (x.layout !== undefined && !LAYOUTS.has(x.layout)) reasons.push(`layout@${i}`)
    if (x.image !== undefined && !ARTS.has(x.image)) reasons.push(`image@${i}`)
    if (x.bg !== undefined && !BGS.has(x.bg)) reasons.push(`bg@${i}`)
    if (x.notes !== undefined && (typeof x.notes !== 'string' || x.notes.length > 400)) reasons.push(`notes@${i}`)
  })
  // coverage: how many slides carry a design hint (reported, not a failure)
  const hinted = s.filter((x) => x.layout || x.image || x.bg || x.notes).length
  return { ok: reasons.length === 0, reasons, hinted, total: s.length }
  return { ok: reasons.length === 0, reasons }
}

export function validateRewrite(source, next, op) {
  const t = String(next ?? '').trim()
  if (!t || t.length < 3) return { ok: false, reasons: ['empty'] }
  if (/```|^[#*-]\s/m.test(t)) return { ok: false, reasons: ['markdown'] }
  if (op === 'shorten' && wc(t) > wc(source)) return { ok: false, reasons: ['not-shorter'] }
  if (op === 'title' && (wc(t) > 12 || wc(t) < 2)) return { ok: false, reasons: ['title-length'] }
  if (wc(t) > Math.max(8, wc(source) * 3)) return { ok: false, reasons: ['too-long'] }
  return { ok: true, reasons: [] }
}

export function validateReview(raw, slideCount) {
  const obj = parseLoose(raw)
  if (!obj || !Array.isArray(obj.issues)) return { ok: false, reasons: ['not-json'] }
  const reasons = []
  if (obj.issues.length > 8) reasons.push('too-many')
  obj.issues.forEach((x, i) => {
    if (!Number.isInteger(x.slide) || x.slide < 0 || x.slide >= slideCount) reasons.push(`slide@${i}`)
    if (!['warn', 'info'].includes(x.severity)) reasons.push(`severity@${i}`)
    if (typeof x.message !== 'string' || !x.message.trim()) reasons.push(`message@${i}`)
  })
  return { ok: reasons.length === 0, reasons }
}

export function opFromUser(user) {
  if (/عنوانًا/.test(user)) return 'title'
  if (/اختصر/.test(user)) return 'shorten'
  if (/رسمية/.test(user)) return 'formal'
  return 'improve'
}
export function sourceFromUser(user) {
  return user.split(/النص:\s*/)[1]?.trim() ?? ''
}
export function countFromSystem(system) {
  return Number(/عدد الشرائح:\s*(\d+)/.exec(system)?.[1]) || undefined
}
