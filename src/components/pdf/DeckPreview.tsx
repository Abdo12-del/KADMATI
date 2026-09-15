/**
 * DeckPreview — the generated presentation, rendered with the *real* slide
 * renderer (SlidePreview) before the user commits it to the library.
 */
import { FolderOpen, RefreshCcw } from 'lucide-react'
import { SlidePreview } from '../SlidePreview'
import type { Presentation } from '../../document/types'
import type { BuildResult } from '../../services/pdf'

export function DeckPreview({
  result,
  warnings,
  onOpen,
  onRegenerate,
}: {
  result: BuildResult
  warnings: string[]
  onOpen: () => void
  onRegenerate: () => void
}) {
  const doc: Presentation = result.doc
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <h2 className="text-[17px] font-bold text-ink-50">{doc.metadata.title}</h2>
          <p className="mt-0.5 text-[12px] text-ink-400">
            {doc.slides.length} شريحة · {result.imagesInjected} صورة من الملف · {result.tablesInjected} جدول — كل العناصر قابلة للتحرير
          </p>
        </div>
        <button
          type="button"
          onClick={onRegenerate}
          className="flex items-center gap-2 rounded-lg border border-ink-700/60 px-3.5 py-2 text-[13px] font-medium text-ink-200 transition-colors hover:border-ink-600 hover:text-ink-50"
        >
          <RefreshCcw className="h-4 w-4" />
          إعادة الضبط
        </button>
        <button
          type="button"
          onClick={onOpen}
          className="flex items-center gap-2 rounded-lg bg-signal px-4 py-2 text-[13.5px] font-bold text-white shadow-[0_8px_24px_-8px_rgba(79,125,255,0.8)] transition-[filter,transform] hover:brightness-110 active:translate-y-px"
        >
          <FolderOpen className="h-4 w-4" />
          افتح في المحرر
        </button>
      </div>

      {warnings.length > 0 && (
        <ul className="space-y-1.5">
          {warnings.map((w, i) => (
            <li key={i} className="rounded-lg border border-warn/25 bg-warn/8 px-3 py-2 text-[12px] text-ink-200">{w}</li>
          ))}
        </ul>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {doc.slides.map((slide, i) => (
          <div key={slide.id} className="overflow-hidden rounded-xl border border-ink-700/50 bg-ink-900 shadow-[0_10px_30px_-16px_rgba(3,6,18,0.9)] transition-transform duration-300 hover:-translate-y-1">
            <div className="relative aspect-video">
              <SlidePreview doc={doc} index={i} className="absolute inset-0" />
            </div>
            <div className="flex items-center justify-between px-2.5 py-1.5">
              <span className="text-[10.5px] font-medium text-ink-400">{i + 1}</span>
              <span className="rounded bg-ink-800/80 px-1.5 py-0.5 text-[9.5px] text-ink-400">{slide.layoutId}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
