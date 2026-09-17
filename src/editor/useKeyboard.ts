/**
 * Editor keyboard layer — the single place that turns key presses into document actions.
 *
 * Rules that keep it safe inside a `contentEditable` canvas:
 * • every shortcut is ignored while an element is being text-edited (except Escape, which commits);
 * • `⌘`/`Ctrl` combos are owned by us, plain typing is owned by the text editor.
 */
import { useEffect } from 'react'
import { useDoc } from '../store/useDoc'
import { toast, useUI } from '../store/useUI'

export interface KeyboardHandlers {
  onPresent?: () => void
  onSave?: () => void
  onEscape?: () => boolean
  canUndo?: boolean
  canRedo?: boolean
}

const isTypingTarget = (el: EventTarget | null): boolean => {
  if (!(el instanceof HTMLElement)) return false
  if (el.isContentEditable) return true
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

export function useKeyboard(handlers: KeyboardHandlers = {}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const doc = useDoc.getState()
      const meta = e.metaKey || e.ctrlKey
      const editing = doc.editingId !== null
      const currentElement = () => {
        const slide = doc.doc.slides[doc.slideIndex]
        return slide?.elements.find((el) => el.id === doc.selection[0])
      }

      // Escape first: it must work everywhere.
      if (e.key === 'Escape') {
        if (editing) {
          doc.stopEditing()
          e.preventDefault()
          return
        }
        if (handlers.onEscape?.()) {
          e.preventDefault()
          return
        }
        if (doc.tool !== 'select') {
          doc.setTool('select')
          e.preventDefault()
          return
        }
        if (doc.selection.length) {
          doc.clearSelection()
          e.preventDefault()
        }
        return
      }

      if (isTypingTarget(e.target)) return

      if (meta) {
        const key = e.key.toLowerCase()
        switch (key) {
          case 'z':
            e.preventDefault()
            if (e.shiftKey) doc.redo()
            else doc.undo()
            return
          case 'y':
            e.preventDefault()
            doc.redo()
            return
          case 'c':
            e.preventDefault()
            doc.copySelected()
            return
          case 'x':
            e.preventDefault()
            doc.cutSelected()
            return
          case 'v':
            e.preventDefault()
            doc.paste()
            return
          case 'd':
            e.preventDefault()
            doc.duplicateSelected()
            return
          case 'g':
            e.preventDefault()
            if (e.shiftKey) doc.ungroupSelected()
            else doc.groupSelected()
            return
          case 'a':
            e.preventDefault()
            doc.selectAll()
            return
          case 's':
            e.preventDefault()
            if (handlers.onSave) handlers.onSave()
            else doc.markSaved('saved')
            return
          case 'e':
            e.preventDefault()
            useUI.getState().openDialog('export')
            return
          case 'b':
          case 'i':
          case 'u': {
            e.preventDefault()
            const patch = key === 'b' ? { bold: true } : key === 'i' ? { italic: true } : { underline: true }
            const field = key === 'b' ? 'bold' : key === 'i' ? 'italic' : 'underline'
            const first = currentElement()
            // Toggle against the live selection so ⌘B twice returns to normal text.
            const on = first?.kind === 'text' ? !!first.font[field] : false
            doc.updateTextStyle({ [field]: !on } as never)
            void patch
            return
          }
          case 'enter':
            if (doc.selection.length === 1) {
              e.preventDefault()
              doc.startEditing(doc.selection[0])
            }
            return
          case ']':
            e.preventDefault()
            doc.zOrder(e.shiftKey ? 'front' : 'forward')
            return
          case '[':
            e.preventDefault()
            doc.zOrder(e.shiftKey ? 'back' : 'backward')
            return
          case '=':
          case '+':
            e.preventDefault()
            doc.zoomBy(0.1)
            return
          case '-':
            e.preventDefault()
            doc.zoomBy(-0.1)
            return
          case '0':
            e.preventDefault()
            doc.fitZoom(900, 540)
            return
          default:
            return
        }
      }

      if (editing) return

      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          e.preventDefault()
          doc.removeSelected()
          return
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight': {
          const step = e.shiftKey ? 10 : 1
          const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
          const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
          if (!doc.selection.length && dx !== 0 && !e.shiftKey) {
            // Nothing selected: browsing slides is more useful than nudging nothing.
            e.preventDefault()
            if (dx < 0) doc.nextSlide()
            else doc.prevSlide()
            return
          }
          if (!doc.selection.length) return
          e.preventDefault()
          doc.nudge(dx, dy)
          return
        }
        case 'Tab':
          e.preventDefault()
          doc.focusNext(e.shiftKey)
          return
        case 'Enter':
          if (doc.selection.length === 1) {
            e.preventDefault()
            doc.startEditing(doc.selection[0])
          }
          return
        case 'PageDown':
          e.preventDefault()
          doc.nextSlide()
          return
        case 'PageUp':
          e.preventDefault()
          doc.prevSlide()
          return
        case 'Home':
          e.preventDefault()
          doc.gotoSlide(0)
          return
        case 'End':
          e.preventDefault()
          doc.gotoSlide(doc.doc.slides.length - 1)
          return
        case ' ':
          // Space + drag pans the canvas in Figma; here it toggles the hand tool.
          if (doc.selection.length) return
          e.preventDefault()
          toast({ kind: 'info', title: 'مساحة + سحب للتحريك', body: 'استخدم العجلة للتكبير مع ⌘/Ctrl.' })
          return
        default:
          break
      }

      // Single-letter tool switches (design-tool muscle memory).
      const tool = e.key.toLowerCase()
      if (tool === 'v') doc.setTool('select')
      else if (tool === 't') doc.setTool('text')
      else if (tool === 'r') doc.setTool('shape')
      else if (tool === 'l') doc.setTool('line')
      else if (tool === 'i') doc.setTool('icon')
      else if (tool === 'p' && handlers.onPresent) {
        e.preventDefault()
        handlers.onPresent()
      } else if (tool === 'n') {
        e.preventDefault()
        doc.addSlide(doc.slideIndex + 1)
      } else if (tool === 'h') {
        e.preventDefault()
        doc.toggleGrid()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handlers])
}

export const SHORTCUTS: { group: string; items: { keys: string[]; label: string }[] }[] = [
  {
    group: 'أساسيات',
    items: [
      { keys: ['⌘', 'Z'], label: 'تراجع' },
      { keys: ['⌘', '⇧', 'Z'], label: 'إعادة' },
      { keys: ['⌘', 'S'], label: 'حفظ فوري' },
      { keys: ['⌘', 'E'], label: 'تصدير' },
      { keys: ['P'], label: 'وضع العرض' },
    ],
  },
  {
    group: 'عناصر',
    items: [
      { keys: ['⌘', 'C'], label: 'نسخ' },
      { keys: ['⌘', 'V'], label: 'لصق' },
      { keys: ['⌘', 'X'], label: 'قص' },
      { keys: ['⌘', 'D'], label: 'تكرار' },
      { keys: ['⌘', 'A'], label: 'تحديد الكل' },
      { keys: ['Delete'], label: 'حذف' },
      { keys: ['⌘', 'G'], label: 'تجميع' },
      { keys: ['⌘', '⇧', 'G'], label: 'فك التجميع' },
      { keys: ['⌘', ']'], label: 'إلى الأمام' },
      { keys: ['⌘', '['], label: 'إلى الخلف' },
      { keys: ['Enter'], label: 'تحرير النص المحدد' },
    ],
  },
  {
    group: 'تحريك ومحاذاة',
    items: [
      { keys: ['↑', '↓', '←', '→'], label: 'تحريك ١ بكسل' },
      { keys: ['⇧', '↑/↓/←/→'], label: 'تحريك ١٠ بكسل' },
      { keys: ['H'], label: 'إظهار الشبكة' },
    ],
  },
  {
    group: 'أدوات',
    items: [
      { keys: ['V'], label: 'تحديد' },
      { keys: ['T'], label: 'نص' },
      { keys: ['R'], label: 'شكل' },
      { keys: ['L'], label: 'خط' },
      { keys: ['I'], label: 'أيقونة' },
      { keys: ['N'], label: 'شريحة جديدة' },
      { keys: ['⌘', '='], label: 'تكبير' },
      { keys: ['⌘', '-'], label: 'تصغير' },
      { keys: ['⌘', '0'], label: 'ملاءمة' },
    ],
  },
  {
    group: 'شرائح',
    items: [
      { keys: ['PgDn', '/'], label: 'الشريحة التالية' },
      { keys: ['PgUp'], label: 'السابقة' },
      { keys: ['Home'], label: 'الأولى' },
      { keys: ['End'], label: 'الأخيرة' },
    ],
  },
  {
    group: 'زوم وتنقل (وضع العرض)',
    items: [
      { keys: ['Tab'], label: 'التنقل بين روابط الزوم' },
      { keys: ['Enter', '/'], label: 'تفعيل رابط الزوم' },
      { keys: ['⌫'], label: 'عودة بالزوم للمصدر' },
    ],
  },
]
