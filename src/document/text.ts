/**
 * Text model helpers.
 *
 * Text content is stored as *restricted* HTML — a deliberate trade-off: contentEditable
 * gives us real cursor behaviour, IME, Arabic shaping and mixed RTL/LTR for free, while the
 * whitelist below keeps that HTML small, deterministic, and mechanically convertible into
 * PowerPoint `<a:p>/<a:r>` runs on export.
 */

import type { Dir, TextAlign, TextElement, TextStyle, VAlign } from './types'

export const ALLOWED_TAGS = new Set([
  'P',
  'BR',
  'SPAN',
  'B',
  'STRONG',
  'I',
  'EM',
  'U',
  'S',
  'STRIKE',
  'A',
  'UL',
  'OL',
  'LI',
  'FONT',
])

/**
 * Tags dropped *with* their subtree. These can execute script, load remote code, or leave the
 * HTML namespace, so unwrapping them (what we do for ordinary unknown tags) would be unsafe.
 */
const DROP_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'IFRAME',
  'FRAME',
  'FRAMESET',
  'OBJECT',
  'EMBED',
  'APPLET',
  'LINK',
  'META',
  'BASE',
  'TEMPLATE',
  'NOSCRIPT',
  'SVG',
  'MATH',
  'CANVAS',
  'FORM',
  'INPUT',
  'BUTTON',
  'TEXTAREA',
  'SELECT',
  'OPTION',
  'AUDIO',
  'VIDEO',
  'SOURCE',
  'TRACK',
  'IMG',
  'PICTURE',
  'MAP',
  'AREA',
  'PORTAL',
  'DIALOG',
])

/** Attributes we keep. Everything else — including every `on*` handler — is discarded. */
const KEEP_ATTRS = new Set(['style', 'href', 'dir', 'start', 'face', 'color', 'size'])

/** Guard against pathological nesting blowing the stack. Real documents are a handful deep. */
const MAX_DEPTH = 40

/**
 * Remove scripts, event handlers and anything outside the whitelist.
 *
 * The output is rebuilt into a fresh tree rather than edited in place. That matters: the
 * previous implementation unwrapped disallowed tags by splicing their children into the parent,
 * but iterated over a snapshot of the child list, so the moved children were never visited —
 * `<div><span onclick=…>` came back untouched and `<div><img onerror=…>` kept the `<img>`.
 */
export function sanitizeHtml(html: string): string {
  const input = String(html ?? '')
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') return sanitizeHtmlNoDom(input)
  const doc = new DOMParser().parseFromString(`<div>${input}</div>`, 'text/html')
  const root = doc.body.firstElementChild
  if (!root) return ''
  const out = doc.createElement('div')
  copyChildren(root, out, 0)
  return out.innerHTML
}

function copyChildren(from: Element, to: Element, depth: number): void {
  if (depth > MAX_DEPTH) return
  for (const child of Array.from(from.childNodes)) {
    // Text nodes carry the actual content; comments, CDATA and processing instructions go.
    if (child.nodeType === 3) {
      to.appendChild(child.cloneNode(false))
      continue
    }
    if (child.nodeType !== 1) continue
    const el = child as Element
    if (DROP_TAGS.has(el.tagName)) continue
    if (!ALLOWED_TAGS.has(el.tagName)) {
      // Unknown wrapper: keep the content, lose the tag — and *visit* the content.
      copyChildren(el, to, depth + 1)
      continue
    }
    const clean = to.ownerDocument.createElement(el.tagName.toLowerCase())
    copyAttributes(el, clean)
    copyChildren(el, clean, depth + 1)
    to.appendChild(clean)
  }
}

function copyAttributes(from: Element, to: Element): void {
  for (const attr of Array.from(from.attributes)) {
    const name = attr.name.toLowerCase()
    if (!KEEP_ATTRS.has(name)) continue
    if (name === 'href') {
      const safe = safeHref(attr.value)
      if (safe !== null) to.setAttribute('href', safe)
      continue
    }
    if (name === 'style') {
      const safe = safeStyle(attr.value)
      if (safe !== null) to.setAttribute('style', safe)
      continue
    }
    if (name === 'size' && !/^\d{1,2}$/.test(attr.value.trim())) continue
    if (name === 'start' && !/^-?\d{1,5}$/.test(attr.value.trim())) continue
    to.setAttribute(name, attr.value)
  }
}

/** Only links that cannot execute: absolute http(s)/mailto/tel, or a relative reference. */
export function safeHref(value: string): string | null {
  // Control chars and whitespace are stripped before the scheme test: `java\nscript:` and
  // `java\0script:` both execute in a browser but neither matches a naive /^javascript:/.
  const probe = value.replace(/[\u0000-\u0020]/g, '').toLowerCase()
  if (!probe) return null
  if (/^(javascript|data|vbscript|file):/.test(probe)) return null
  if (/^(https?|mailto|tel):/.test(probe)) return value
  if (probe.startsWith('#') || probe.startsWith('/')) return value
  if (!probe.includes(':')) return value
  return null
}

/** CSS can pull in remote content or, on legacy engines, run script. Drop those declarations. */
function safeStyle(value: string): string | null {
  const clean = value.replace(/[\u0000-\u001f]/g, '')
  if (!clean) return null
  if (/url\s*\(|expression\s*\(|@import|behavior\s*:|javascript:|vbscript:/i.test(clean)) return null
  return clean
}

/**
 * Defensive fallback for a DOM-less host (a worker or a server-side export run). There is no
 * parser to lean on, so we keep only whitelisted tags with whitelisted attributes and drop
 * everything else — never the raw input, which is what this function used to return.
 */
function sanitizeHtmlNoDom(html: string): string {
  let out = html.replace(/<!--[\s\S]*?-->/g, '')
  for (const tag of DROP_TAGS) {
    const name = tag.toLowerCase()
    out = out
      .replace(new RegExp(`<${name}\\b[\\s\\S]*?<\\/${name}\\s*>`, 'gi'), '')
      .replace(new RegExp(`<${name}\\b[^>]*\\/?>`, 'gi'), '')
  }
  out = out.replace(/<\/?([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>])*)>/g, (all, tag: string, attrs: string) => {
    if (!ALLOWED_TAGS.has(tag.toUpperCase())) return ''
    if (all[1] === '/') return `</${tag.toLowerCase()}>`
    let kept = ''
    const attrRe = /([a-zA-Z][\w:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g
    let m: RegExpExecArray | null
    while ((m = attrRe.exec(attrs))) {
      const name = m[1].toLowerCase()
      if (!KEEP_ATTRS.has(name)) continue
      const value = m[2] ?? m[3] ?? m[4] ?? ''
      if (name === 'href') {
        const safe = safeHref(value)
        if (safe === null) continue
        kept += ` href="${safe.replace(/"/g, '&quot;')}"`
      } else if (name === 'style') {
        const safe = safeStyle(value)
        if (safe === null) continue
        kept += ` style="${safe.replace(/"/g, '&quot;')}"`
      } else {
        kept += ` ${name}="${value.replace(/"/g, '&quot;')}"`
      }
    }
    return `<${tag.toLowerCase()}${kept}>`
  })
  // Anything that still looks like an event handler or an executor never reaches the DOM.
  out = out.replace(/\son[a-z][a-z0-9-]*\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  return out
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function escapeAttr(text: string): string {
  return escapeHtml(text).replace(/"/g, '&quot;')
}

/** Plain-text → paragraphs. Blank line = new paragraph. */
export function plainToHtml(text: string, align?: TextAlign, dir?: Dir): string {
  const parts = text.split(/\n{2,}/)
  const style = [align && align !== 'start' ? `text-align:${align}` : '', dir ? `direction:${dir}` : ''].filter(Boolean).join(';')
  return parts
    .map((p) => `<p${style ? ` style="${style}"` : ''}>${escapeHtml(p).replace(/\n/g, '<br/>')}</p>`)
    .join('')
}

export function htmlToPlainText(html: string): string {
  if (typeof window === 'undefined') return html.replace(/<[^>]+>/g, ' ')
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html')
  const root = doc.body.firstElementChild
  if (!root) return ''
  const out: string[] = []
  root.childNodes.forEach((node) => {
    if (node.nodeType === 3) out.push(node.textContent ?? '')
    else if (node instanceof HTMLElement) {
      const isList = node.tagName === 'UL' || node.tagName === 'OL'
      if (isList) {
        node.querySelectorAll('li').forEach((li) => out.push(`• ${li.textContent?.trim() ?? ''}`))
      } else out.push(node.textContent ?? '')
      out.push('\n')
    }
  })
  return out
    .join('')
    .replace(/\u00a0/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export interface TextRun {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strike?: boolean
  color?: string
  highlight?: string
  size?: number
  font?: string
  link?: string
  spacing?: number
}

export interface TextBlock {
  type: 'p' | 'bullet' | 'number'
  level: number
  align?: TextAlign
  dir?: Dir
  lineHeight?: number
  spaceBefore?: number
  runs: TextRun[]
}

function styleToRun(style: string, run: Partial<TextRun>): Partial<TextRun> {
  const get = (prop: string) => {
    const re = new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`, 'i')
    const m = re.exec(style)
    return m ? m[1].trim() : undefined
  }
  const weight = get('font-weight')
  if (weight === 'bold' || (weight && Number(weight) >= 600)) run.bold = true
  if (/italic/.test(style)) run.italic = true
  const deco = get('text-decoration') ?? get('text-decoration-line') ?? ''
  if (/underline/.test(deco)) run.underline = true
  if (/line-through/.test(deco)) run.strike = true
  const color = get('color')
  if (color) run.color = color
  const bg = get('background-color') ?? get('background')
  if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') run.highlight = bg
  const size = get('font-size')
  if (size && /px$/.test(size)) run.size = Math.round(parseFloat(size))
  const family = get('font-family')
  if (family) run.font = family.split(',')[0].replace(/["']/g, '').trim()
  const ls = get('letter-spacing')
  if (ls && /px$/.test(ls)) run.spacing = Math.round(parseFloat(ls) * 100) / 100
  return run
}

/* ------------------------------------------------------------------ HTML → blocks
 *
 * A dependency-free tokenizer for the *restricted* HTML our sanitizer produces
 * (p, div, br, span[style], b, strong, i, em, u, s, strike, a[href], font, ul, ol, li).
 * No DOMParser on purpose: the PPTX writer must run identically in a worker or on a server,
 * and this keeps a single, testable code path instead of two.
 */
export function htmlToBlocks(html: string): TextBlock[] {
  const blocks: TextBlock[] = []
  const listStack: { numbered: boolean }[] = []
  let current: TextBlock | null = null
  let marks: Partial<TextRun> = {}
  const frameStack: { tag: string; prev: Partial<TextRun> }[] = []

  const flush = () => {
    const block = current
    current = null
    if (!block) return
    if (!block.runs.length) block.runs.push({ text: '' })
    blocks.push(block)
  }
  const start = (type: TextBlock['type'], style?: string): TextBlock => {
    flush()
    const block: TextBlock = { type, level: listStack.length ? listStack.length - 1 : 0, runs: [] }
    current = block
    if (style) {
      const get = (prop: string) => {
        const m = new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`, 'i').exec(style)
        return m ? m[1].trim() : undefined
      }
      const rawAlign = get('text-align')
      if (rawAlign) block.align = rawAlign === 'left' ? 'start' : rawAlign === 'right' ? 'end' : (rawAlign as TextAlign)
      const dir = get('direction')
      if (dir === 'rtl' || dir === 'ltr') block.dir = dir
      const lh = parseFloat(get('line-height') ?? '')
      if (Number.isFinite(lh) && lh > 0) block.lineHeight = lh
      const mb = parseFloat(get('margin-bottom') ?? '')
      if (Number.isFinite(mb) && mb > 0) block.spaceBefore = mb
    }
    return block
  }
  const pushRun = (text: string) => {
    const block = current ?? start('p')
    block.runs.push({ ...stripUndefined(marks), text })
  }

  for (const token of tokenizeRestrictedHtml(html)) {
    if (token.kind === 'text') {
      // Whitespace between block tags is formatting, not content — but a space *inside* a
      // paragraph is real (and `&nbsp;` is U+00A0, which this check keeps).
      if (!/[^ \t\n\r\f\v]/.test(token.text) && !current) continue
      pushRun(token.text)
      continue
    }
    const tag = token.tag
    if (token.kind === 'close') {
      if (tag === 'ul' || tag === 'ol') {
        flush()
        listStack.pop()
        continue
      }
      const idx = findLastIndex(frameStack, (f) => f.tag === tag)
      if (idx >= 0) {
        marks = frameStack[idx].prev
        frameStack.length = idx
      }
      if (tag === 'p' || tag === 'div' || tag === 'li') flush()
      continue
    }
    // open
    switch (tag) {
      case 'p':
      case 'div':
        start('p', token.attrsStyle)
        break
      case 'ul':
        listStack.push({ numbered: false })
        break
      case 'ol':
        listStack.push({ numbered: true })
        break
      case 'li':
        start(listStack[listStack.length - 1]?.numbered ? 'number' : 'bullet', token.attrsStyle)
        break
      case 'br':
        pushRun('\n')
        break
      case 'b':
      case 'strong':
        frameStack.push({ tag, prev: marks })
        marks = { ...marks, bold: true }
        break
      case 'i':
      case 'em':
        frameStack.push({ tag, prev: marks })
        marks = { ...marks, italic: true }
        break
      case 'u':
        frameStack.push({ tag, prev: marks })
        marks = { ...marks, underline: true }
        break
      case 's':
      case 'strike':
        frameStack.push({ tag, prev: marks })
        marks = { ...marks, strike: true }
        break
      case 'a':
        frameStack.push({ tag, prev: marks })
        marks = { ...marks, link: token.attrsHref ?? undefined }
        break
      case 'font': {
        frameStack.push({ tag, prev: marks })
        const next = { ...marks }
        if (token.attrsColor) next.color = token.attrsColor
        if (token.attrsSize) next.size = Math.round(Number(token.attrsSize) * 4) || undefined
        marks = next
        break
      }
      case 'span': {
        frameStack.push({ tag, prev: marks })
        marks = token.attrsStyle ? styleToRun(token.attrsStyle, { ...marks }) : marks
        break
      }
      default:
        break
    }
  }
  flush()
  // Merge adjacent runs that ended up with identical formatting (keeps the XML tight).
  for (const b of blocks) b.runs = mergeRuns(b.runs)
  return blocks.length ? blocks : [{ type: 'p', level: 0, runs: [{ text: '' }] }]
}

function mergeRuns(runs: TextRun[]): TextRun[] {
  const out: TextRun[] = []
  for (const run of runs) {
    const prev = out[out.length - 1]
    if (prev && sameRunStyle(prev, run)) {
      prev.text += run.text
      continue
    }
    out.push({ ...run })
  }
  return out
}

function sameRunStyle(a: TextRun, b: TextRun): boolean {
  const keys: (keyof TextRun)[] = ['bold', 'italic', 'underline', 'strike', 'color', 'highlight', 'size', 'font', 'link', 'spacing']
  return keys.every((k) => a[k] === b[k])
}

function findLastIndex<T>(arr: T[], predicate: (item: T) => boolean): number {
  for (let i = arr.length - 1; i >= 0; i--) if (predicate(arr[i])) return i
  return -1
}

interface HtmlToken {
  kind: 'open' | 'close' | 'text'
  tag: string
  text: string
  attrsStyle?: string
  attrsHref?: string
  attrsColor?: string
  attrsSize?: string
}

const TAG_RE = /<\/?[a-zA-Z][\w-]*(?:"[^"]*"|'[^']*'|[^>])*>|[^<]+/g
const VOID_TAGS = new Set(['br'])

function tokenizeRestrictedHtml(html: string): HtmlToken[] {
  const tokens: HtmlToken[] = []
  const matches = String(html ?? '').match(TAG_RE) ?? []
  for (const raw of matches) {
    if (raw[0] !== '<') {
      tokens.push({ kind: 'text', tag: '', text: decodeEntities(raw) })
      continue
    }
    const isClose = raw[1] === '/'
    const tag = /^<\/?([a-zA-Z][\w-]*)/.exec(raw)?.[1]?.toLowerCase() ?? ''
    const attrs = {
      attrsStyle: attr(raw, 'style'),
      attrsHref: attr(raw, 'href'),
      attrsColor: attr(raw, 'color'),
      attrsSize: attr(raw, 'size'),
    }
    if (isClose) {
      tokens.push({ kind: 'close', tag, text: '', ...attrs })
      continue
    }
    tokens.push({ kind: 'open', tag, text: '', ...attrs })
    if (VOID_TAGS.has(tag)) tokens.push({ kind: 'close', tag, text: '' })
  }
  return tokens
}

function attr(html: string, name: string): string | undefined {
  const re = new RegExp(`${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i')
  const m = re.exec(html)
  if (!m) return undefined
  return decodeEntities(m[1] ?? m[2] ?? '')
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00a0',
  '#39': "'",
  hellip: '…',
  mdash: '—',
  ndash: '–',
  times: '×',
  bull: '•',
}

export function decodeEntities(text: string): string {
  return String(text).replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (all, code: string) => {
    const key = code.toLowerCase()
    if (ENTITIES[key] !== undefined) return ENTITIES[key]
    if (key.startsWith('#x')) {
      const cp = parseInt(key.slice(2), 16)
      return Number.isFinite(cp) ? safeFromCodePoint(cp) : all
    }
    if (key.startsWith('#')) {
      const cp = parseInt(key.slice(1), 10)
      return Number.isFinite(cp) ? safeFromCodePoint(cp) : all
    }
    return all
  })
}

function safeFromCodePoint(cp: number): string {
  try {
    return String.fromCodePoint(cp)
  } catch {
    return ''
  }
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>
}

export function blocksToPlainText(blocks: TextBlock[]): string {
  return blocks
    .map((b) => `${b.type === 'bullet' ? '• ' : b.type === 'number' ? '' : ''}${b.runs.map((r) => r.text).join('')}`)
    .join('\n')
    .trim()
}

/** Word count that understands Arabic tashkeel/hamza as letters, not spaces. */
export function countWords(text: string): number {
  const clean = text.replace(/[\u064B-\u0652\u0670]/g, '').trim()
  if (!clean) return 0
  return clean.split(/[\s\u200B]+/).filter(Boolean).length
}

export function charCount(text: string): number {
  return Array.from(text.replace(/\s+/g, ' ')).length
}

/** Reading time in minutes — used by the design reviewer and the status bar. */
export function readingMinutes(text: string, wpm = 130): number {
  return Math.max(0, Math.round((countWords(text) / wpm) * 10) / 10)
}

/** Rough height so `autoFit` can shrink a font until it fits the box. */
export function estimateTextHeight(text: string, style: Pick<TextStyle, 'fontSize' | 'lineHeight' | 'wrap'>, boxWidth: number): number {
  const plain = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (!plain) return style.fontSize * style.lineHeight
  const perChar = style.fontSize * (containsWide(plain) ? 0.55 : 0.5)
  const perLine = style.wrap ? Math.max(1, Math.floor((boxWidth - 8) / perChar)) : plain.length
  const chars = plain.split(/(\s+)/).reduce((acc, t) => acc + (t.length > perLine ? Math.ceil(t.length / perLine) : 1), 0)
  const lines = Math.max(1, Math.ceil(chars / Math.max(1, perLine)) + (plain.match(/\n/g)?.length ?? 0))
  return lines * style.fontSize * style.lineHeight
}

export function containsWide(text: string): boolean {
  return /[\u0600-\u06FF\u3040-\u9FFF]/.test(text)
}

/** vAlign → flexbox alignment (the renderer positions text with flex, not table cells). */
export function vAlignToJustify(vAlign: VAlign): 'flex-start' | 'center' | 'flex-end' {
  return vAlign === 'start' ? 'flex-start' : vAlign === 'end' ? 'flex-end' : 'center'
}

export function isRichEmpty(html: string): boolean {
  return htmlToPlainText(html).length === 0
}

export function textElementPlainText(el: TextElement): string {
  return htmlToPlainText(el.content)
}

export function alignToTextAlign(align: TextAlign, dir: Dir): 'left' | 'right' | 'center' | 'justify' {
  if (align === 'center' || align === 'justify') return align
  if (align === 'start') return dir === 'rtl' ? 'right' : 'left'
  if (align === 'end') return dir === 'rtl' ? 'left' : 'right'
  return 'left'
}
