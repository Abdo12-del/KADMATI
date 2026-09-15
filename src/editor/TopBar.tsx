/**
 * Editor top bar — matching the reference: SlideFlow identity, deck title
 * chip, undo/redo + autosave state in the center, and the share/present
 * actions with the profile orb on the end. Tools live in the CanvasToolbar,
 * panels live in the rail.
 */
import { useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Download, MonitorPlay, Redo2, Sparkles, Undo2 } from 'lucide-react'
import { useDoc, type SaveStatus } from '../store/useDoc'
import { useUI } from '../store/useUI'
import { Button, Divider, IconButton } from '../components/ui'
import { cn } from '../lib/cn'

/**
 * zundo exposes `.temporal` as a store API (not a hook) whose snapshot objects are recreated on
 * every mutation — so we subscribe to stable numbers instead of an object.
 */
function useHistoryFlags() {
  const subscribe = (cb: () => void) => useDoc.temporal.subscribe(cb)
  const past = useSyncExternalStore(subscribe, () => useDoc.temporal.getState().pastStates.length, () => 0)
  const future = useSyncExternalStore(subscribe, () => useDoc.temporal.getState().futureStates.length, () => 0)
  return { canUndo: past > 0, canRedo: future > 0 }
}

export function TopBar({ onPresent }: { onPresent: () => void }) {
  const doc = useDoc((s) => s.doc)
  const saveStatus = useDoc((s) => s.saveStatus)
  const undo = useDoc((s) => s.undo)
  const redo = useDoc((s) => s.redo)
  const setMetadata = useDoc((s) => s.setMetadata)
  const { canUndo, canRedo } = useHistoryFlags()
  const [editingTitle, setEditingTitle] = useState(false)

  return (
    <header className="glass aur-hairline-b relative z-30 flex h-12 shrink-0 items-center gap-2 border-b border-ink-800/70 px-3">
      {/* identity */}
      <Link to="/" className="flex shrink-0 items-center gap-2 rounded-lg px-1 py-1 transition-colors hover:bg-ink-800" title="الخروج إلى المكتبة">
        <svg viewBox="0 0 24 24" className="size-6 drop-shadow-[0_0_8px_rgba(139,120,255,0.8)]" aria-hidden>
          <defs>
            <linearGradient id="slf-edit-star" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#8be9ff" />
              <stop offset="0.5" stopColor="#6d6dff" />
              <stop offset="1" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          <path d="M12 1.5l2.7 7.8 7.8 2.7-7.8 2.7L12 22.5l-2.7-7.8-7.8-2.7 7.8-2.7z" fill="url(#slf-edit-star)" />
        </svg>
        <span className="hidden font-display text-[14px] font-bold tracking-tight text-ink-50 lg:inline">SlideFlow</span>
      </Link>

      <Divider vertical />

      {/* deck title */}
      {editingTitle ? (
        <input
          autoFocus
          defaultValue={doc.metadata.title}
          onBlur={(e) => {
            setMetadata({ title: e.target.value.trim() || 'بدون عنوان' })
            setEditingTitle(false)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            if (e.key === 'Escape') setEditingTitle(false)
            e.stopPropagation()
          }}
          className="h-7 w-56 rounded-md border border-ink-600 bg-ink-850 px-2 text-[13px] text-ink-50 outline-none focus:border-signal"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditingTitle(true)}
          className="flex h-8 min-w-0 max-w-[min(28vw,20rem)] items-center gap-1.5 truncate rounded-lg border border-ink-800 bg-ink-850/60 px-2.5 text-[12.5px] font-semibold text-ink-100 transition-colors hover:border-ink-700 hover:bg-ink-800"
          title="إعادة تسمية العرض"
        >
          <span className="truncate">{doc.metadata.title || 'بدون عنوان'}</span>
          <ChevronDown size={12} className="shrink-0 text-ink-400" />
        </button>
      )}

      {/* center: history + autosave */}
      <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1.5">
        <IconButton size="iconSm" tip="تراجع · ⌘Z" disabled={!canUndo} onClick={undo}>
          <Undo2 size={14} />
        </IconButton>
        <IconButton size="iconSm" tip="إعادة · ⌘⇧Z" disabled={!canRedo} onClick={redo}>
          <Redo2 size={14} />
        </IconButton>
        <SaveBadge status={saveStatus} />
      </div>

      {/* actions */}
      <div className="ms-auto flex shrink-0 items-center gap-1.5">
        <IconButton size="iconSm" tip="تصدير · ⌘E" onClick={() => useUI.getState().openDialog('export')}>
          <Download size={14} />
        </IconButton>
        <Button size="sm" variant="subtle" tip="عرض تقديمي · P" onClick={onPresent}>
          <MonitorPlay size={13} /> عرض تقديمي
        </Button>
        <Button
          size="sm"
          variant="primary"
          tip="مشاركة وتصدير"
          className="shadow-[0_0_18px_-4px_rgba(139,92,246,0.8)]"
          onClick={() => useUI.getState().openDialog('share')}
        >
          <Sparkles size={13} /> مشاركة
        </Button>
        <span
          className="ms-1 grid size-7 cursor-pointer place-items-center rounded-full bg-gradient-to-br from-[#4f7dff] via-[#7c5cfc] to-[#2fd4f6] text-[11px] font-bold text-white shadow-[0_0_14px_-2px_rgba(99,125,255,0.9)]"
          title="الملف الشخصي"
          onClick={() => useUI.getState().openDialog('profile')}
          role="button"
          aria-label="الملف الشخصي"
        >
          ض
        </span>
      </div>
    </header>
  )
}

const SAVE_COPY: Record<SaveStatus, { label: string; tone: string; dot: string }> = {
  idle: { label: 'جاهز', tone: 'text-ink-400', dot: 'bg-ink-500' },
  saved: { label: 'تم الحفظ تلقائيًا', tone: 'text-ink-300', dot: 'bg-good' },
  dirty: { label: 'تغييرات غير محفوظة', tone: 'text-ink-400', dot: 'bg-ink-400' },
  saving: { label: 'جارٍ الحفظ…', tone: 'text-signal-soft', dot: 'animate-pulse bg-signal' },
  offline: { label: 'غير متصل — يُحفظ محليًا', tone: 'text-warn', dot: 'bg-warn' },
  error: { label: 'تعذّر الحفظ', tone: 'text-red-300', dot: 'bg-red-400' },
}

function SaveBadge({ status }: { status: SaveStatus }) {
  const s = SAVE_COPY[status] ?? SAVE_COPY.idle
  return (
    <span className={cn('hidden items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-medium md:flex', s.tone)}>
      <span className={cn('size-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  )
}
