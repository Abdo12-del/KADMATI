/**
 * StructureInspector — the "show me what you understood" view of the PDF
 * prototype: page thumbnails with colored bounding-box overlays, the outline,
 * per-page element list with confidences, detected tables, extracted images,
 * and the suggested brand kit.
 */
import { useEffect, useState } from 'react'
import {
  AlignRight,
  Captions,
  FileWarning,
  Hash,
  Heading1,
  Heading2,
  Image as ImageIcon,
  ListOrdered,
  ScanLine,
  Quote,
  Scan,
  Sigma,
  Table2,
  Type,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import type { PdfElement, PdfElementType, StructuredDocument } from '../../services/pdf'

const TYPE_COLOR: Record<PdfElementType, string> = {
  title: '#7dd3fc',
  heading: '#93c5fd',
  paragraph: 'rgba(148,163,184,0.55)',
  list: '#c4b5fd',
  image: '#5eead4',
  table: '#fbbf24',
  caption: '#a5b4fc',
  header: 'rgba(148,163,184,0.3)',
  footer: 'rgba(148,163,184,0.3)',
  quote: '#f0abfc',
  kv: '#9ca3af',
  stat: '#fda4af',
  'page-number': 'rgba(148,163,184,0.3)',
}

const TYPE_ICON: Partial<Record<PdfElementType, typeof Type>> = {
  title: Heading1,
  heading: Heading2,
  paragraph: AlignRight,
  list: ListOrdered,
  image: ImageIcon,
  table: Table2,
  caption: Captions,
  quote: Quote,
  stat: Sigma,
  'page-number': Hash,
  kv: Type,
}

const TYPE_LABEL: Record<PdfElementType, string> = {
  title: 'عنوان رئيسي',
  heading: 'عنوان',
  paragraph: 'فقرة',
  list: 'قائمة',
  image: 'صورة',
  table: 'جدول',
  caption: 'تعليق',
  header: 'رأس صفحة',
  footer: 'تذييل',
  quote: 'اقتباس',
  kv: 'مفتاح: قيمة',
  stat: 'رقم/إحصاء',
  'page-number': 'رقم صفحة',
}

export function StructureInspector({
  structured,
  ocrBusyPage,
  onRunOcr,
}: {
  structured: StructuredDocument
  ocrBusyPage: number | null
  onRunOcr: (pageIndex: number) => void
}) {
  const [selected, setSelected] = useState(0)
  const [showBoxes, setShowBoxes] = useState(true)
  useEffect(() => {
    const scanned = structured.pages.findIndex((p) => p.scanned)
    if (scanned >= 0) setSelected(scanned)
  }, [structured])

  const page = structured.pages[Math.min(selected, structured.pages.length - 1)]

  return (
    <div className="space-y-5">
      {/* ---- document summary ---- */}
      <div className="glass hairline rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          <Chip label="صفحات" value={String(structured.stats.chars ? structured.pageCount : structured.pageCount)} />
          <Chip label="كلمات" value={String(structured.stats.words)} />
          <Chip label="عناوين" value={String(structured.stats.headings)} />
          <Chip label="صور" value={String(structured.stats.images)} />
          <Chip label="جداول" value={String(structured.stats.tables)} />
          <Chip label="اللغة" value={langLabel(structured.language)} />
          {structured.stats.scannedPages > 0 && <Chip label="ممسوحة" value={String(structured.stats.scannedPages)} tone="warn" />}
        </div>

        {/* brand suggestion */}
        {structured.brandSuggestion && (
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-ink-700/40 pt-3">
            <span className="text-[11.5px] font-medium text-ink-400">هوية مقترحة من الملف:</span>
            {[structured.brandSuggestion.primary, structured.brandSuggestion.secondary, structured.brandSuggestion.accent].map((c) => (
              <span key={c} className="flex items-center gap-1.5 text-[11px] text-ink-300">
                <i className="h-4 w-4 rounded-md border border-ink-600" style={{ background: c }} />
                <code className="text-ink-500">{c}</code>
              </span>
            ))}
            {structured.brandSuggestion.fonts.slice(0, 2).map((f) => (
              <span key={f} className="rounded-md bg-ink-800/60 px-2 py-0.5 text-[11px] text-ink-300">{f}</span>
            ))}
          </div>
        )}

        {/* outline */}
        {structured.outline.length > 0 && (
          <div className="mt-3 border-t border-ink-700/40 pt-3">
            <p className="mb-1.5 text-[11.5px] font-medium text-ink-400">هيكل العناوين المكتشف</p>
            <ul className="max-h-32 space-y-1 overflow-y-auto pe-1 text-[12px]">
              {structured.outline.slice(0, 24).map((o, i) => (
                <li key={o.elementId + i} className="flex items-center gap-2" style={{ paddingInlineStart: (o.level - 1) * 14 }}>
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: o.level === 1 ? '#7dd3fc' : '#93c5fd' }} />
                  <span className="truncate text-ink-200">{o.text}</span>
                  <span className="ms-auto shrink-0 text-[10.5px] text-ink-500">ص{o.page + 1}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ---- pages grid with bbox overlay ---- */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[13px] font-semibold text-ink-200">الصفحات وحدود العناصر</p>
          <button
            type="button"
            onClick={() => setShowBoxes((v) => !v)}
            className="rounded-md border border-ink-700/60 px-2 py-1 text-[11px] text-ink-300 transition-colors hover:text-ink-50"
          >
            {showBoxes ? 'إخفاء الحدود' : 'إظهار الحدود'}
          </button>
        </div>
        <div className="grid max-h-[420px] grid-cols-3 gap-3 overflow-y-auto pe-1 sm:grid-cols-4 xl:grid-cols-6">
          {structured.pages.map((p) => (
            <button
              key={p.index}
              type="button"
              onClick={() => setSelected(p.index)}
              className={cn(
                'group relative overflow-hidden rounded-lg border bg-ink-900 transition-all',
                selected === p.index ? 'border-signal/70 shadow-[0_0_0_1px_rgba(79,125,255,0.5),0_8px_24px_-8px_rgba(79,125,255,0.5)]' : 'border-ink-700/50 hover:border-ink-600',
              )}
            >
              <div className="relative aspect-[1.414] w-full">
                {p.thumbnail ? (
                  <img src={p.thumbnail} alt={`صفحة ${p.index + 1}`} className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-[10px] text-ink-500">{p.index + 1}</div>
                )}
                {showBoxes &&
                  p.elements
                    .filter((e) => e.type !== 'paragraph' || e.bbox.w > 40)
                    .slice(0, 60)
                    .map((el) => <Box key={el.id} el={el} page={p} />)}
              </div>
              <div className="flex items-center justify-between px-1.5 py-1">
                <span className="text-[10px] text-ink-500">{p.index + 1}</span>
                {p.scanned && <Scan className="h-3 w-3 text-warn" aria-label="ممسوحة" />}
              </div>
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-ink-500">
          {(['title', 'heading', 'list', 'table', 'image', 'stat', 'quote'] as PdfElementType[]).map((t) => (
            <span key={t} className="flex items-center gap-1">
              <i className="h-2 w-2 rounded-sm" style={{ background: TYPE_COLOR[t] }} />
              {TYPE_LABEL[t]}
            </span>
          ))}
        </div>
      </div>

      {/* ---- selected page detail ---- */}
      <div className="glass hairline rounded-xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[13px] font-semibold text-ink-100">الصفحة {page.index + 1}</p>
          <span className="text-[11px] text-ink-500">{page.layout}</span>
        </div>

        {page.scanned && (
          <div className="mb-3 flex items-center gap-3 rounded-lg border border-warn/30 bg-warn/10 px-3 py-2.5">
            <ScanLine className="h-4 w-4 shrink-0 text-warn" />
            <p className="flex-1 text-[12px] leading-5 text-ink-200">
              صفحة بلا طبقة نص — يُرجَّح أنها ممسوحة ضوئيًا. شغّل OCR لاستخراج النصوص.
            </p>
            <button
              type="button"
              disabled={ocrBusyPage !== null}
              onClick={() => onRunOcr(page.index)}
              className="rounded-md bg-warn/20 px-3 py-1.5 text-[12px] font-semibold text-warn transition-colors hover:bg-warn/30 disabled:opacity-50"
            >
              {ocrBusyPage === page.index ? 'جارٍ التعرف…' : 'تشغيل OCR (عربي+إنجليزي)'}
            </button>
          </div>
        )}

        {page.tables.length > 0 && (
          <div className="mb-4 space-y-3">
            {page.tables.map((t) => (
              <div key={t.id}>
                <p className="mb-1 flex items-center gap-1.5 text-[11.5px] font-medium text-ink-300">
                  <Table2 className="h-3.5 w-3.5 text-[#fbbf24]" />
                  جدول {t.nRows}×{t.nCols} · ثقة {Math.round(t.confidence * 100)}%
                </p>
                <div className="max-h-40 overflow-auto rounded-lg border border-ink-700/50">
                  <table className="w-full border-collapse text-[11px]">
                    <tbody>
                      {t.rows.map((row, ri) => (
                        <tr key={ri} className={ri === 0 ? 'bg-ink-800/70 font-semibold text-ink-100' : 'text-ink-300'}>
                          {row.map((cell, ci) => (
                            <td key={ci} className="border border-ink-700/40 px-2 py-1">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {page.images.length > 0 && (
          <div className="mb-4">
            <p className="mb-1.5 flex items-center gap-1.5 text-[11.5px] font-medium text-ink-300">
              <ImageIcon className="h-3.5 w-3.5 text-[#5eead4]" />
              صور مستخرجة ({page.images.length})
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {page.images.slice(0, 8).map((im) => (
                <div key={im.id} className="w-24 shrink-0 overflow-hidden rounded-lg border border-ink-700/50 bg-ink-900">
                  {im.dataUrl ? (
                    <img src={im.dataUrl} alt="" className="h-16 w-full object-cover" />
                  ) : (
                    <div className="grid h-16 place-items-center text-[10px] text-ink-500">{Math.round(im.bbox.w)}×{Math.round(im.bbox.h)}</div>
                  )}
                  <p className="truncate px-1.5 py-1 text-[9.5px] text-ink-500">{im.caption ?? im.kind}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* element list */}
        <ul className="max-h-64 space-y-1.5 overflow-y-auto pe-1">
          {page.elements.map((el) => (
            <li key={el.id} className="flex items-start gap-2.5 rounded-lg bg-ink-850/60 px-2.5 py-2">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md" style={{ background: 'color-mix(in oklab, ' + TYPE_COLOR[el.type] + ' 16%, transparent)' }}>
                {TYPE_ICON[el.type] ? (
                  (() => {
                    const Icon = TYPE_ICON[el.type]!
                    return <Icon className="h-3.5 w-3.5" style={{ color: TYPE_COLOR[el.type] }} />
                  })()
                ) : (
                  <Type className="h-3.5 w-3.5 text-ink-400" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="shrink-0 text-[10.5px] font-semibold" style={{ color: TYPE_COLOR[el.type] }}>{TYPE_LABEL[el.type]}</span>
                  {el.source === 'ocr' && <span className="rounded bg-warn/15 px-1 text-[9px] font-medium text-warn">OCR</span>}
                  <span className={cn('ms-auto shrink-0 text-[9.5px]', el.confidence < 0.7 ? 'text-warn' : 'text-ink-500')}>
                    {Math.round(el.confidence * 100)}%
                  </span>
                </div>
                <p className="truncate text-[12px] text-ink-200">{el.items ? el.items.join(' • ') : el.text}</p>
              </div>
            </li>
          ))}
          {page.elements.length === 0 && <li className="py-6 text-center text-[12px] text-ink-500">لا عناصر نصية في هذه الصفحة</li>}
        </ul>
      </div>

      {structured.stats.scannedPages > 0 && (
        <p className="flex items-start gap-2 rounded-lg border border-warn/25 bg-warn/8 px-3 py-2.5 text-[12px] leading-5 text-ink-300">
          <FileWarning className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
          الصفحات الممسوحة تحتاج OCR — جودة المتصفح جيدة للنص الواضح، وللدقة الأعلى تُوصى خدمة التحليل المتقدمة (Docling/Surya) لاحقًا.
        </p>
      )}
    </div>
  )
}

function Box({ el, page }: { el: PdfElement; page: { width: number; height: number } }) {
  const color = TYPE_COLOR[el.type]
  const style: React.CSSProperties = {
    left: `${(el.bbox.x / page.width) * 100}%`,
    top: `${(el.bbox.y / page.height) * 100}%`,
    width: `${(el.bbox.w / page.width) * 100}%`,
    height: `${(el.bbox.h / page.height) * 100}%`,
    borderColor: color,
    background: `color-mix(in oklab, ${color} 12%, transparent)`,
  }
  return <span title={`${TYPE_LABEL[el.type]}: ${(el.text ?? '').slice(0, 40)}`} className="pointer-events-none absolute rounded-[2px] border" style={style} />
}

function Chip({ label, value, tone }: { label: string; value: string; tone?: 'warn' }) {
  return (
    <span
      className={cn(
        'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5',
        tone === 'warn' ? 'bg-warn/12 text-warn' : 'bg-ink-800/70 text-ink-200',
      )}
    >
      <span className="text-[10.5px] opacity-70">{label}</span>
      <span className="text-[12.5px] font-bold">{value}</span>
    </span>
  )
}

function langLabel(lang: StructuredDocument['language']): string {
  return lang === 'ar' ? 'العربية' : lang === 'en' ? 'الإنجليزية' : lang === 'fr' ? 'الفرنسية' : 'مختلطة'
}
