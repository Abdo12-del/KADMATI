/**
 * Arabic/RTL handling for text extracted from PDFs.
 *
 * Real-world Arabic PDFs expose two common extraction problems, both handled here:
 * 1. Visual vs logical order — some producers write glyphs in visual order, so the
 *    extracted string reads backwards. We detect and re-reverse whole *tokens*
 *    (never characters — shaping is already baked into the codepoints).
 * 2. Presentation forms (U+FB50–U+FDFF, U+FE70–U+FEFF) — normalized back to base
 *    letters so search/LLM/editing all work on plain Arabic.
 * Plus: Arabic-Indic digits are preserved (never converted — matches platform rules).
 */

const ARABIC_RANGE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/
const LATIN_RANGE = /[A-Za-zÀ-ÿ]/

/** Presentation-form → base-letter mapping (the systematic FB50/FE70 block ranges). */
function normalizePresentationForms(s: string): string {
  return s.normalize('NFKC')
}

export function hasArabic(s: string): boolean {
  return ARABIC_RANGE.test(s)
}

export function isRtlText(s: string): boolean {
  const ar = (s.match(new RegExp(ARABIC_RANGE, 'g')) ?? []).length
  const la = (s.match(new RegExp(LATIN_RANGE, 'g')) ?? []).length
  return ar > 0 && ar >= la
}

/** Language guess from a text sample. */
export function detectLanguage(sample: string): 'ar' | 'en' | 'fr' | 'mixed' {
  const ar = (sample.match(new RegExp(ARABIC_RANGE, 'g')) ?? []).length
  const fr = (sample.match(/[éèêëàâçùûôîï]/gi) ?? []).length
  const la = (sample.match(/[A-Za-z]/g) ?? []).length
  if (ar === 0) {
    if (fr > la * 0.04) return 'fr'
    return 'en'
  }
  if (la > ar * 0.25) return 'mixed'
  return 'ar'
}

/* Frequent Arabic bigrams — used purely as a statistic to tell logical from
 * visual-order extraction apart, without any lexicon of "real words". */
const AR_BIGRAMS = ['ال', 'ية', 'ين', 'ما', 'ها', 'يا', 'لا', 'ون', 'ار', 'تح', 'قد', 'لى', 'ان', 'نى', 'را', 'نت', 'عن', 'كل', 'او', 'تى', 'بر', 'من', 'فع', 'تم', 'مع', 'خا', 'شن', 'هذ', 'عل', 'قر']

function arabicBigramScore(s: string): number {
  let score = 0
  for (const bg of AR_BIGRAMS) {
    let i = 0
    while ((i = s.indexOf(bg, i)) >= 0) {
      score += bg.length
      i += 1
    }
  }
  return score
}

/**
 * Detect "visual order" Arabic — glyphs were written in drawing order, so the
 * extracted tokens read backwards. We score space-stripped token sequences with
 * common-bigram frequencies: whichever order (as-is vs token-reversed) forms
 * more typical Arabic clusters wins. Statistic, lexicon-free, conservative.
 */
export function looksVisuallyOrdered(text: string): boolean {
  if (!hasArabic(text)) return false
  const tokens = text.trim().split(/\s+/).filter(Boolean)
  if (tokens.length < 2) return false
  const fwd = tokens.join('')
  const rev = [...tokens].reverse().join('')
  if (fwd === rev) return false
  return arabicBigramScore(rev) > arabicBigramScore(fwd) * 1.08
}

/** Strip bullet glyphs from both ends (RTL extraction puts the bullet last). */
export function stripBulletEnds(text: string): string {
  return text.replace(/^[•‣▪◦●·∙\-*]\s*/, '').replace(/\s*[•‣▪◦●·∙]$/, '').trim()
}

/** Reverse token order (visual → logical) and fix bracket mirroring. */
export function reorderVisualTokens(text: string): string {
  const tokens = text.trim().split(/\s+/).filter(Boolean)
  const flipped = tokens.reverse().map((t) => t.replace(/\(/g, ')').replace(/\)/g, '(').replace(/\[/g, ']').replace(/\]/g, '[').replace(/«/g, '»').replace(/»/g, '«'))
  return flipped.join(' ')
}

/** Clean an extracted Arabic/RTL line: normalize forms, drop broken control chars. */
export function cleanArabicLine(text: string): string {
  let out = normalizePresentationForms(text)
  out = out.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '') // bidi controls
  out = out.replace(/\u00A0/g, ' ')
  return out.replace(/\s+/g, ' ').trim()
}

/** Full line-level fix: clean + conditionally reorder. */
export function fixLine(text: string, rtlHint: boolean): string {
  const cleaned = cleanArabicLine(text)
  if (rtlHint && looksVisuallyOrdered(cleaned)) return reorderVisualTokens(cleaned)
  return cleaned
}

/** Percentage of Arabic script chars — used for lang/dir decisions per page. */
export function arabicRatio(sample: string): number {
  const ar = (sample.match(new RegExp(ARABIC_RANGE, 'g')) ?? []).length
  const total = sample.replace(/\s/g, '').length || 1
  return ar / total
}
