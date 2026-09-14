/**
 * Read-only deck preview from the library: keyboard/click navigation, notes on demand, and a
 * direct jump into the editor. Route: /preview/:id.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Copy, Pencil, X } from 'lucide-react'
import { SlidePreview } from '../components/SlidePreview'
import { useLibrary } from '../store/useLibrary'
import { useDoc } from '../store/useDoc'
import { Button } from '../components/ui'
import { requestOpenProject } from '../services/openDeck'
import { cn } from '../lib/cn'
import type { Presentation } from '../document/types'

export function PreviewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [doc, setDoc] = useState<Presentation | null>(null)
  const [index, setIndex] = useState(0)
  const [notes, setNotes] = useState(false)

  useEffect(() => {
    let alive = true
    if (!id) return
    void useLibrary.getState().openDoc(id).then((loaded) => {
      if (alive) setDoc(loaded)
    })
    return () => {
      alive = false
    }
  }, [id])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') navigate(-1)
      if (e.key === 'ArrowRight') setIndex((i) => Math.max(0, i - 1))
      if (e.key === 'ArrowLeft') setIndex((i) => (doc ? Math.min(doc.slides.length - 1, i + 1) : 0))
      if (e.key === 'n') setNotes((v) => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate, doc])

  const rtl = doc?.metadata.dir !== 'ltr'
  const slide = useMemo(() => doc?.slides[index], [doc, index])

  if (!doc) {
    return (
      <div className="grid h-full place-items-center bg-ink-950 text-[13px] text-ink-400">تُحمَّل الشرائح…</div>
    )
  }
  if (!slide) {
    return (
      <div className="grid h-full place-items-center gap-3 bg-ink-950 text-center">
        <p className="text-[13px] text-ink-400">لا شرائح في هذا العرض.</p>
        <Link to="/app" className="text-[13px] text-signal-soft underline">العودة للمكتبة</Link>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-ink-1000">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-ink-800/80 px-3">
        <Link to="/app" className="grid size-8 place-items-center rounded-lg border border-ink-800 text-ink-300 transition-colors hover:bg-ink-900" title="إغلاق">
          <X size={14} />
        </Link>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-ink-50">{doc.metadata.title}</p>
          <p className="text-[11px] text-ink-500">{doc.slides.length} شريحة · معاينة فقط</p>
        </div>
        <div className="ms-auto flex items-center gap-1.5">
          <Button size="sm" variant={notes ? 'surface' : 'ghost'} onClick={() => setNotes((v) => !v)}>
            ملاحظات
          </Button>
          <Button
            size="sm"
            variant="subtle"
            onClick={() => requestOpenProject({ doc })}
            title="يبقي هذا العرض كما هو ويفتح نسخة يمكنك التعديل عليها بحرية"
          >
            <Copy size={12} /> نسخة للتعديل
          </Button>
          <Button size="sm" variant="primary" onClick={() => { useDoc.getState().load(doc, id); navigate(`/edit/${id}`) }} title="تحرير هذا العرض نفسه (الحفظ التلقائي يسري عليه)">
            <Pencil size={12} /> تحرير هذا العرض
          </Button>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 items-center justify-center p-4">
        <button type="button" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} className="absolute start-3 z-10 grid size-10 place-items-center rounded-full border border-ink-700 bg-ink-900/80 text-ink-100 transition-colors hover:bg-ink-800 disabled:opacity-30" title="السابق">
          {rtl ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        <div className="w-full max-w-5xl overflow-hidden rounded-xl shadow-float">
          <SlidePreview doc={doc} index={index} className="rounded-xl" />
        </div>
        <button type="button" onClick={() => setIndex((i) => Math.min(doc.slides.length - 1, i + 1))} disabled={index === doc.slides.length - 1} className="absolute end-3 z-10 grid size-10 place-items-center rounded-full border border-ink-700 bg-ink-900/80 text-ink-100 transition-colors hover:bg-ink-800 disabled:opacity-30" title="التالي">
          {rtl ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      <div className={cn('shrink-0 border-t border-ink-800/80 px-4 transition-[height]', notes ? 'h-36 py-3' : 'h-16')}>
        <div className="mx-auto flex h-full max-w-4xl gap-4">
          <div className="panel-x min-h-0 flex-1 overflow-y-auto">
            {notes ? (
              <p className="whitespace-pre-wrap text-[12.5px] leading-[1.9] text-ink-300">
                {slide.notes.trim() || <span className="text-ink-600">لا ملاحظات لهذه الشريحة.</span>}
              </p>
            ) : (
              <div className="flex h-full items-end gap-1 overflow-x-auto pb-1">
                {doc.slides.map((s, i) => (
                  <button key={s.id} type="button" onClick={() => setIndex(i)} className={cn('w-16 shrink-0 overflow-hidden rounded border transition-colors', i === index ? 'border-signal' : 'border-ink-800 hover:border-ink-600')}>
                    <SlidePreview doc={doc} index={i} />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="hidden w-40 shrink-0 flex-col justify-end gap-1 text-[11px] text-ink-500 sm:flex">
            <span>شريحة {index + 1} من {doc.slides.length}</span>
            <span>{slide.elements.length} عنصر</span>
            <span>← → للتنقل · N للملاحظات</span>
          </div>
        </div>
      </div>
    </div>
  )
}
