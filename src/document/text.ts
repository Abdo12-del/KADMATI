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

/** Remove scripts, event handlers and anything outside the whitelist. */
export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') return html
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html')
  const root = doc.body.firstElementChild
  if (!root) return ''
  const walk = (node: Element) => {
    for (const child of Array.from(node.children)) {
      if (!ALLOWED_TAGS.has(child.tagName)) {
        if (child.tagName === 'STYLE' || child.tagName === 'SCRIPT') child.remove()
        else {
          const parent = child.parentNode
          while (child.firstChild) parent?.insertBefore(child.firstChild, child)
          child.remove()
        }
        continue
      }
      for (const attr of Array.from(child.attributes)) {
        const name = attr.name.toLowerCase()
        const keep = name === 'style' || name === 'href' || name === 'dir' || name === 'start' || name === 'face' || name === 'color' || name === 'size'
        if (!keep) child.removeAttribute(attr.name)
        if (name === 'href' && /^\s*(javascript|data|vbscript):/i.test(attr.value)) child.removeAttribute('href')
      }
      walk(child)
    }
  }
  walk(root)
  return root.innerHTML
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
