import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { sanitizeHtml } from '../document/text'
import type { TextStyle } from '../document/types'
import { textStyleCss } from './elementStyle'

/**
 * The text surface shared by text elements, shape labels and table cells.
 *
 * Editing is delegated to the browser (contentEditable) because that is the only way to get
 * first-class Arabic: RTL caret movement, keyboard shaping, IME composition, and mixed
 * Arabic/Latin selection. We read HTML back on input, sanitize it to a small whitelist, and let
 * shrink-to-fit measure the live DOM instead of guessing.
 */

export interface TextContentProps {
  html: string
  font: TextStyle
  editing?: boolean
  onInput?: (html: string) => void
  onBlur?: () => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void
  style?: React.CSSProperties
  outerStyle?: React.CSSProperties
  autoFit?: boolean
  alignBox?: { w: number; h: number }
}

export function TextContent({ html, font, editing, onInput, onBlur, onKeyDown, style, outerStyle, autoFit, alignBox }: TextContentProps) {
  const inner = useRef<HTMLDivElement>(null)
  const outer = useRef<HTMLDivElement>(null)
  const lastPushed = useRef<string | null>(null)
  const [fit, setFit] = useState(1)

  // Model → DOM, but never while we are the one typing (that would destroy the caret).
  useEffect(() => {
    const node = inner.current
    if (!node || editing) return
    if (lastPushed.current === html) return
    node.innerHTML = html || ''
    lastPushed.current = html
  }, [html, editing])

  // Entering edit mode: reseed, focus, caret to the end.
  useLayoutEffect(() => {
    const node = inner.current
    if (!node || !editing) return
    if (node.innerHTML !== html) node.innerHTML = html || ''
    lastPushed.current = node.innerHTML
    node.focus({ preventScroll: true })
    placeCaretAtEnd(node)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing])

  useLayoutEffect(() => {
    if (!autoFit || !alignBox) {
      if (fit !== 1) setFit(1)
      return
    }
    const node = inner.current
    const host = outer.current
    if (!node || !host) return
    let next = 1
    if (node.scrollHeight > host.clientHeight + 1) {
      next = Math.max(0.6, Math.floor((host.clientHeight / node.scrollHeight) * 100) / 100)
    }
    if (!font.wrap && node.scrollWidth > host.clientWidth + 1) {
      next = Math.max(0.6, Math.floor((host.clientWidth / node.scrollWidth) * 100) / 100)
    }
    if (Math.abs(next - fit) > 0.005) setFit(next)
  }, [html, alignBox, autoFit, font.wrap, font.fontSize, font.lineHeight, fit])

  const handleInput = useCallback(() => {
    const node = inner.current
    if (!node) return
    const next = node.innerHTML
    lastPushed.current = next
    onInput?.(sanitizeHtml(next))
  }, [onInput])

  return (
    <div
      ref={outer}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: vAlign(font),
        overflow: 'hidden',
        ...outerStyle,
      }}
    >
      <div
        ref={inner}
        className="rte"
        contentEditable={editing || undefined}
        role={editing ? 'textbox' : undefined}
        aria-multiline="true"
        suppressContentEditableWarning
        spellCheck={false}
        dir={font.dir}
        data-editable={editing ? 'true' : undefined}
        style={{
          ...textStyleCss(font, { editable: editing }),
          ...style,
          transform: fit !== 1 ? `scale(${fit})` : undefined,
          transformOrigin: font.dir === 'rtl' ? 'top right' : 'top left',
          width: fit !== 1 ? `${100 / fit}%` : '100%',
        }}
        onInput={handleInput}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        onMouseDown={(e) => {
          if (!editing) e.stopPropagation()
        }}
      />
    </div>
  )
}

function vAlign(font: TextStyle): 'flex-start' | 'center' | 'flex-end' {
  return font.vAlign === 'start' ? 'flex-start' : font.vAlign === 'end' ? 'flex-end' : 'center'
}

export function placeCaretAtEnd(node: HTMLElement) {
  const sel = window.getSelection()
  if (!sel) return
  const range = document.createRange()
  range.selectNodeContents(node)
  range.collapse(false)
  sel.removeAllRanges()
  sel.addRange(range)
}

export function selectAllIn(node: HTMLElement) {
  const sel = window.getSelection()
  if (!sel) return
  const range = document.createRange()
  range.selectNodeContents(node)
  sel.removeAllRanges()
  sel.addRange(range)
}
