/**
 * SVG hardening for `SvgElement` markup.
 *
 * User SVG arrives from three places: pasted markup, an imported PPTX, and the icon library.
 * It is rendered with `dangerouslySetInnerHTML`, so anything that can execute must be gone
 * *before* React touches the DOM.
 *
 * What this blocks (each one was verified against the previous, weaker implementation):
 *   • `<script>` — including an unclosed tag, which the old `/<script>[\s\S]*?<\/script>/`
 *     regex let through because it required a closing tag.
 *   • event handlers with any quoting — `onload="…"`, `onload='…'`, `onload=…`.
 *   • `javascript:` / `vbscript:` / `data:` (non-image) URLs in `href` / `xlink:href`.
 *   • `<foreignObject>` — it escapes the SVG namespace and re-enters HTML, where an
 *     `<img onerror>` or an `<iframe>` runs as ordinary HTML.
 *   • animation elements that can rewrite attributes (`<set attributeName="href">`,
 *     `<animate>`, `<animateTransform>`) and `<use>` with an external target.
 *
 * We deliberately do not try to whitelist every SVG attribute: the elements we render are
 * icons and imported vector art, so a blocklist of executable constructs plus a namespace
 * guard keeps legitimate artwork intact without betting the outcome on a long allowlist.
 */

const EXECUTABLE_TAGS = [
  'script',
  'foreignobject',
  'iframe',
  'embed',
  'object',
  'set',
  'animate',
  'animatetransform',
  'animatemotion',
  'handler',
  'discard',
  'style',
]

const EVENT_HANDLER_RE = /\son[a-z][a-z0-9-]*\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi
const HREF_RE = /\s(?:xlink:)?href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi

/**
 * True when an attribute value is safe to keep as a reference. Only fragment references,
 * same-document paths and inline images survive — a `data:` blob that is not an image can
 * carry script, and `javascript:`/`vbscript:` are executors by definition.
 */
export function isSafeSvgUrl(value: string): boolean {
  // Control characters and whitespace are how `java\nscript:` and `java\0script:` are written.
  const probe = value.replace(/[\u0000-\u0020]/g, '').toLowerCase()
  if (!probe) return false
  if (/^(javascript|vbscript|file):/.test(probe)) return false
  if (probe.startsWith('data:')) return /^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);/i.test(probe)
  return true
}

export function sanitizeSvg(markup: string): string {
  let out = String(markup ?? '')

  // Comments first: they can swallow a closing tag and change how the rest parses.
  out = out.replace(/<!--[\s\S]*?-->/g, '')

  // Executable / namespace-escaping elements: drop the tag *and* its subtree. A void form
  // such as `<use href="…"/>` has no closing tag, so both shapes are handled.
  for (const tag of EXECUTABLE_TAGS) {
    const pair = new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}\\s*>`, 'gi')
    const single = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi')
    out = out.replace(pair, '').replace(single, '')
  }

  // `<use>` is the one referencing element we keep (sprite art needs it) — but only when it
  // points at a fragment inside this very document. An external target fetches another file,
  // and a `data:` target can be a whole HTML document.
  out = out.replace(/<use\b[^>]*>/gi, (tag) => (/(?:xlink:)?href\s*=\s*(?:"#|'#|#)/i.test(tag) ? tag : ''))

  // Event handlers, whatever the quoting style.
  out = out.replace(EVENT_HANDLER_RE, '')

  // Reference attributes must point somewhere inert.
  out = out.replace(HREF_RE, (all, dq: string | undefined, sq: string | undefined, bare: string | undefined) => {
    const value = dq ?? sq ?? bare ?? ''
    return isSafeSvgUrl(value) ? all : ''
  })

  if (!/<svg[\s>]/i.test(out)) out = `<svg viewBox="0 0 100 100" width="100%" height="100%">${out}</svg>`
  out = out.replace(/<svg([^>]*)>/i, (_m, attrs: string) => `<svg${addIfMissing(attrs, 'preserveAspectRatio', 'xMidYMid meet')} style="width:100%;height:100%">`)
  return out
}

function addIfMissing(attrs: string, name: string, value: string): string {
  return attrs.includes(name) ? attrs : `${attrs} ${name}="${value}"`
}
