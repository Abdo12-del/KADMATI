/**
 * Status bar — the strip under the canvas: navigation, zoom, document telemetry and the honest
 * save state. Small, but it is where a designer checks "did it save / how long is this deck".
 */
import { useEffect, useState } from 'react'
import { Clock3, Grid3x3, Keyboard, Maximize2, Minus, Plus, Presentation } from 'lucide-react'
import { useDoc } from '../store/useDoc'
import { toast, useUI } from '../store/useUI'
import { Button, IconButton, Segmented } from '../components/ui'
import { presentationDuration, presentationWordCount } from '../document/factory'
import { cn } from '../lib/cn'

export function StatusBar() {
  const doc = useDoc((s) => s.doc)
  const slideIndex = useDoc((s) => s.slideIndex)
  const zoom = useDoc((s) => s.zoom)
  const zoomMode = useDoc((s) => s.zoomMode)
  const setZoom = useDoc((s) => s.setZoom)
  const fitZoom = useDoc((s) => s.fitZoom)
  const gotoSlide = useDoc((s) => s.gotoSlide)
  const toggleGrid = useDoc((s) => s.toggleGrid)
  const grid = useDoc((s) => s.doc.settings.gridVisible)
  const snap = useDoc((s) => s.doc.settings.snapToGrid)
  const saveStatus = useDoc((s) => s.saveStatus)
  const savedAt = useDoc((s) => s.savedAt)
  const selection = useDoc((s) => s.selection)
  const elements = doc.slides[slideIndex]?.elements.length ?? 0
  const words = presentationWordCount(doc)
  const minutes = presentationDuration(doc)

  return (
    <footer className="flex h-8 shrink-0 items-center gap-2 border-t border-ink-800 bg-ink-900 px-2 text-[11px] text-ink-400">
      <div className="flex items-center gap-1">
        <IconButton size="iconSm" className="size-6" tip="الشريحة السابقة" onClick={() => gotoSlide(Math.max(0, slideIndex - 1))}>
          <span className="text-[13px] leading-none">‹</span>
        </IconButton>
        <span className="min-w-[68px] text-center font-mono text-[11px] tabular-nums text-ink-200">
          {slideIndex + 1} / {doc.slides.length}
        </span>
        <IconButton size="iconSm" className="size-6" tip="الشريحة التالية" onClick={() => gotoSlide(Math.min(doc.slides.length - 1, slideIndex + 1))}>
          <span className="text-[13px] leading-none">›</span>
        </IconButton>
      </div>

      <span className="hidden text-ink-600 sm:inline">|</span>
      <span className="hidden items-center gap-1 sm:flex">
        <span className="text-ink-300">{elements}</span> عنصر
        {selection.length ? (
          <>
            · <span className="text-signal-soft">{selection.length}</span> محدد
          </>
        ) : null}
      </span>

      <div className="mx-auto flex items-center gap-2">
        <span title="عدد الكلمات في العرض">
          <span className="text-ink-300">{words}</span> كلمة
        </span>
        <span className="text-ink-600">·</span>
        <span title="مدة تقديرية للإلقاء (≈١٣٠ كلمة/دقيقة)" className="flex items-center gap-1">
          <Clock3 size={11} /> <span className="text-ink-300">{minutes}</span> دقيقة
        </span>
        <span className="hidden text-ink-600 md:inline">·</span>
        <span className="hidden md:inline" title="اتجاه المستند">
          {doc.metadata.dir === 'rtl' ? 'عربي RTL' : 'LTR'} · {doc.slides.length} شرائح
        </span>
      </div>

      <div className="flex items-center gap-1">
        <SaveIndicator status={saveStatus} at={savedAt} />
        <button
          type="button"
          onClick={() => {
            useDoc.getState().setSettings({ snapToGrid: !snap })
            toast({ kind: 'info', title: snap ? 'أُلغيت المحاذاة للشبكة' : 'المحاذاة للشبكة مفعّلة' })
          }}
          className={cn('rounded px-1.5 py-0.5 transition-colors hover:bg-ink-800', snap && 'text-signal-soft')}
          title="محاذاة للشبكة (تعمل مع الأدلة الذكية دائمًا)"
        >
          snap
        </button>
        <IconButton size="iconSm" className="size-6" tip="الشبكة · H" active={grid} onClick={toggleGrid}>
          <Grid3x3 size={12} />
        </IconButton>
        <IconButton size="iconSm" className="size-6" tip="الاختصارات" onClick={() => useUI.getState().openDialog('shortcuts')}>
          <Keyboard size={12} />
        </IconButton>
        <Segmented
          size="sm"
          value={zoomMode}
          onChange={(v) => {
            if (v === 'fit') fitZoom(window.innerWidth - 560, window.innerHeight - 200)
          }}
          options={[
            { value: 'fit', label: 'ملاءمة' },
            { value: 'manual', label: 'يدوي' },
          ]}
        />
        <div className="flex items-center gap-0.5 rounded-md border border-ink-800 bg-ink-850 px-0.5">
          <button type="button" className="grid size-5 place-items-center rounded hover:bg-ink-750" onClick={() => setZoom(Math.max(0.1, zoom - 0.1))} title="تصغير">
            <Minus size={11} />
          </button>
          <button
            type="button"
            className="w-11 text-center font-mono text-[11px] text-ink-200 hover:text-white"
            onClick={() => fitZoom(window.innerWidth - 560, window.innerHeight - 200)}
            title="إعادة الضبط إلى الملاءمة"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button type="button" className="grid size-5 place-items-center rounded hover:bg-ink-750" onClick={() => setZoom(Math.min(4, zoom + 0.1))} title="تكبير">
            <Plus size={11} />
          </button>
          <button
            type="button"
            className="grid size-5 place-items-center rounded hover:bg-ink-750"
            title="تكبير/تصغير بالملاءمة (⌘ عجلة الفأرة)"
            onClick={() => setZoom(1)}
          >
            <Maximize2 size={11} />
          </button>
        </div>
        <Button size="sm" variant="surface" onClick={() => window.dispatchEvent(new CustomEvent('kadmati:present'))} tip="عرض تقديمي · P">
          <Presentation size={12} /> عرض
        </Button>
      </div>
    </footer>
  )
}

function SaveIndicator({ status, at }: { status: string; at: number | null }) {
  const [, tick] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 15000)
    return () => window.clearInterval(id)
  }, [])
  const label =
    status === 'saved'
      ? at
        ? `حُفظ ${relative(at)}`
        : 'محفوظ'
      : status === 'saving'
        ? 'جارٍ الحفظ…'
        : status === 'offline'
          ? 'غير متصل — محفوظ محليًا'
          : status === 'error'
            ? 'تعذّر الحفظ'
            : status === 'dirty'
              ? 'تغييرات قيد الانتظار'
              : 'جاهز'
  const tone = status === 'error' ? 'text-red-300' : status === 'saving' ? 'text-signal-soft' : status === 'offline' ? 'text-warn' : 'text-ink-400'
  return (
    <span className={cn('flex items-center gap-1.5 rounded-full border border-ink-800 bg-ink-850 px-2 py-0.5', tone)} title="يُحفظ في متصفحك (IndexedDB) — لا خادم بعد">
      <span className={cn('size-1.5 rounded-full', status === 'saving' ? 'animate-pulse bg-signal' : status === 'error' ? 'bg-red-400' : 'bg-good')} />
      {label}
    </span>
  )
}

function relative(ts: number): string {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000))
  if (s < 45) return 'الآن'
  if (s < 3600) return `قبل ${Math.round(s / 60)} د`
  if (s < 86400) return `قبل ${Math.round(s / 3600)} س`
  return `قبل ${Math.round(s / 86400)} يوم`
}
