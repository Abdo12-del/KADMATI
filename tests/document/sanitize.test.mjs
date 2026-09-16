/**
 * Sanitizer tests (Node + jsdom).
 *
 * These exist because both sanitizers had a *demonstrated* bypass (see CODE_REVIEW.md §2):
 * the HTML one never visited the children of an unwrapped tag, and the SVG one only stripped
 * `<script>…</script>` and double-quoted `on*="…"` handlers.
 *
 * The harness runs the real source modules — no re-implementation in the test — so a
 * regression in `src/document/text.ts` or `src/lib/svg.ts` fails here.
 */
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body></body></html>')
globalThis.window = dom.window
globalThis.document = dom.window.document
globalThis.DOMParser = dom.window.DOMParser
globalThis.Node = dom.window.Node
globalThis.HTMLElement = dom.window.HTMLElement

const { sanitizeHtml, safeHref, htmlToBlocks, sanitizeSvg, isSafeSvgUrl } = await import('../../.tmp-verify/document-test.mjs')

let passed = 0
let failed = 0
function check(name, ok, detail = '') {
  if (ok) {
    passed++
    console.log(`  ✓ ${name}`)
  } else {
    failed++
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

/** True when HTML output can execute script or navigate to an executor. */
const DANGEROUS = /on[a-z]+\s*=|javascript:|vbscript:|<script|<iframe|<img|<svg[\s>]/i
/** Same idea for SVG output — minus `<svg`, which every sanitized result legitimately has. */
const DANGEROUS_SVG = /on[a-z]+\s*=|javascript:|vbscript:|<script|<iframe|<img|<foreignobject|data:(?!image\/)/i

/* ------------------------------------------------------------------ HTML: bypasses */

console.log('\n■ HTML — regressions that used to pass through')

const htmlCases = [
  ['nested handler inside a disallowed wrapper', '<div><span onclick="alert(1)">x</span></div>'],
  ['javascript: href inside a disallowed wrapper', '<section><a href="javascript:alert(1)">y</a></section>'],
  ['img inside a disallowed wrapper', '<div><b>bold</b><img src=x onerror="alert(1)"></div>'],
  ['handler with single quotes', "<p onmouseover='alert(1)'>x</p>"],
  ['handler, unquoted', '<p onmouseover=alert(1)>x</p>'],
  ['obfuscated scheme (newline)', '<a href="java\nscript:alert(1)">x</a>'],
  ['obfuscated scheme (tab + case)', '<a href="JaVa\tScript:alert(1)">x</a>'],
  ['data: uri href', '<a href="data:text/html,<script>alert(1)</script>">x</a>'],
  ['svg with foreignObject', '<div><svg><foreignObject><img src=x onerror="alert(1)"></foreignObject></svg></div>'],
  ['style with url()', '<p style="background:url(javascript:alert(1))">x</p>'],
  ['script element', '<div><script>alert(1)</script>text</div>'],
  ['iframe element', '<div><iframe src="//evil.tld"></iframe>text</div>'],
  ['deeply nested bypass', '<section><article><div><span onfocus="alert(1)">z</span></div></article></section>'],
  ['form controls', '<div><form><input onfocus="alert(1)"></form></div>'],
]

for (const [name, input] of htmlCases) {
  const out = sanitizeHtml(input)
  check(`blocks: ${name}`, !DANGEROUS.test(out), `got ${JSON.stringify(out)}`)
}

/* ------------------------------------------------------------------ HTML: preservation */

console.log('\n■ HTML — legitimate content survives')

check('keeps paragraphs, bold, italic', (() => {
  const out = sanitizeHtml('<p style="text-align:center"><b>عريض</b> و <i>مائل</i></p>')
  return /<p style="text-align:center">/.test(out) && /<b>عريض<\/b>/.test(out) && /<i>مائل<\/i>/.test(out)
})(), JSON.stringify(sanitizeHtml('<p style="text-align:center"><b>عريض</b> و <i>مائل</i></p>')))

check('keeps bullet lists', (() => {
  const out = sanitizeHtml('<ul><li>واحد</li><li>اثنان</li></ul>')
  return out.includes('<ul>') && out.includes('<li>واحد</li>') && out.includes('<li>اثنان</li>')
})())

check('keeps https links', sanitizeHtml('<a href="https://example.com">رابط</a>').includes('href="https://example.com"'))
check('keeps mailto links', sanitizeHtml('<a href="mailto:a@b.com">رابط</a>').includes('href="mailto:a@b.com"'))
check('keeps relative links', sanitizeHtml('<a href="/deck/1">رابط</a>').includes('href="/deck/1"'))
check('keeps dir + highlight span', (() => {
  const out = sanitizeHtml('<span dir="ltr" style="background-color:#ff0">EN</span>')
  return out.includes('dir="ltr"') && out.includes('background-color:#ff0')
})())
check('unwraps unknown tags but keeps text', sanitizeHtml('<section>نص</section>') === 'نص', JSON.stringify(sanitizeHtml('<section>نص</section>')))
check('keeps rtl markup and Arabic', sanitizeHtml('<p dir="rtl">مرحبا بالعالم</p>').includes('مرحبا بالعالم'))
check('empty input is empty', sanitizeHtml('') === '' && sanitizeHtml(null) === '')

console.log('\n■ HTML — exports still parse sanitized markup')
check('htmlToBlocks reads sanitized rich text', (() => {
  const blocks = htmlToBlocks(sanitizeHtml('<p><b>العنوان</b></p><ul><li>نقطة</li></ul>'))
  return blocks.length === 2 && blocks[1].type === 'bullet' && blocks[0].runs.some((r) => r.bold)
})())
check('htmlToBlocks on sanitized attack markup yields plain text only', (() => {
  const blocks = htmlToBlocks(sanitizeHtml('<div><img src=x onerror="alert(1)">نص</div>'))
  return blocks.every((b) => b.runs.every((r) => !/onerror|alert/.test(r.text)))
})())

/* ------------------------------------------------------------------ hrefs */

console.log('\n■ URL policy')
for (const bad of ['javascript:alert(1)', 'JaVaScript:alert(1)', 'java\nscript:alert(1)', 'data:text/html,x', 'vbscript:x', 'file:///etc/passwd', '']) {
  check(`rejects ${JSON.stringify(bad)}`, safeHref(bad) === null)
}
for (const good of ['https://example.com', 'http://example.com/a?b=1', 'mailto:a@b.com', 'tel:+213555', '#slide-2', '/app/decks', 'page.html']) {
  check(`allows ${JSON.stringify(good)}`, safeHref(good) === good)
}

/* ------------------------------------------------------------------ SVG */

console.log('\n■ SVG — regressions that used to pass through')

const svgCases = [
  ['single-quoted handler', `<svg><rect onload='alert(1)' width="10" height="10"/></svg>`],
  ['unquoted handler', `<svg><rect onload=alert(1) width="10" height="10"/></svg>`],
  ['javascript: href', `<svg><a href="javascript:alert(1)"><text>x</text></a></svg>`],
  ['foreignObject escape', `<svg><foreignObject><img src=x onerror=alert(1)></foreignObject></svg>`],
  ['animate rewriting href', `<svg><animate attributeName="href" values="javascript:alert(1)"/></svg>`],
  ['unclosed script tag', `<svg><script src="//evil.tld/x.js"><rect/></svg>`],
  ['use pointing outside', `<svg><use href="data:text/html,<script>alert(1)</script>"/></svg>`],
  ['style block', `<svg><style>@import url(//evil.tld)</style><rect/></svg>`],
  ['data: non-image href', `<svg><image href="data:text/html,<script>alert(1)</script>"/></svg>`],
]

for (const [name, input] of svgCases) {
  const out = sanitizeSvg(input)
  check(`blocks: ${name}`, !DANGEROUS_SVG.test(out), `got ${JSON.stringify(out)}`)
}

console.log('\n■ SVG — legitimate artwork survives')
check('keeps paths and fills', (() => {
  const out = sanitizeSvg('<svg viewBox="0 0 24 24"><path d="M2 2 L22 22" fill="none" stroke="#fff"/></svg>')
  return out.includes('<path') && out.includes('M2 2 L22 22') && out.includes('stroke="#fff"')
})())
check('keeps inline image data URIs', sanitizeSvg('<svg><image href="data:image/png;base64,iVBORw0KGgo="/></svg>').includes('data:image/png;base64'))
check('keeps fragment references', sanitizeSvg('<svg><use href="#icon-1"/></svg>').includes('href="#icon-1"'))
check('wraps bare markup in an svg root', sanitizeSvg('<circle cx="5" cy="5" r="4"/>').startsWith('<svg'))
check('adds preserveAspectRatio once', (sanitizeSvg('<svg><rect/></svg>').match(/preserveAspectRatio/g) ?? []).length === 1)
check('url policy rejects data: html', isSafeSvgUrl('data:text/html,x') === false)
check('url policy allows data: image', isSafeSvgUrl('data:image/png;base64,AAA') === true)

/* ------------------------------------------------------------------ summary */

console.log(`\n═══ RESULTS: ${passed} passed, ${failed} failed ═══\n`)
if (failed) process.exit(1)
