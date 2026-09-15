/**
 * PdfImportPage — «من PDF إلى عرض» — the automatic-design prototype route (/pdf).
 *
 * Stages: upload → parse+analyze (pdf.js + rules) → structure inspector
 * (bounding boxes, elements, tables, images, brand) → planning options →
 * generated-deck preview → open in the studio editor. OCR runs per scanned
 * page on demand (tesseract.js, lazily imported).
 */
import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Braces,
  Cpu,
  FileText,
  Layers,
  LayoutTemplate,
  Loader2,
  Palette,
  ScanText,
  Sparkles,
  Upload,
  Wand2,
} from 'lucide-react'
import { StructureInspector } from '../components/pdf/StructureInspector'
import { DeckPreview } from '../components/pdf/DeckPreview'
import { analyzePdf, buildSections, attachVisuals, planPresentation, buildDeck, getOcrBackend, loadPdfDocument } from '../services/pdf'
import type { ParseProgress, StructuredDocument } from '../services/pdf'
import { analyzePage, computeFontStats, normalizeLines } from '../services/pdf/analyze'
import { renderPageToCanvas } from '../services/pdf/parse'
import { useLibrary } from '../store/useLibrary'
import { requestOpenProject } from '../services/openDeck'
import { cn } from '../lib/cn'

type Stage = 'idle' | 'analyzing' | 'structure' | 'preview'

const STAGES = [
  { id: 'parse', label: 'قراءة PDF (pdf.js)', icon: FileText },
  { id: 'analyze', label: 'فهم البنية والعناصر', icon: Braces },
  { id: 'brand', label: 'استخراج الهوية', icon: Palette },
] as const

export function PdfImportPage() {
  const library = useLibrary()
  const brandKits = library.brandKits
  const inputRef = useRef<HTMLInputElement>(null)
  const bufferRef = useRef<ArrayBuffer | null>(null)

  const [stage, setStage] = useState<Stage>('idle')
  const [progress, setProgress] = useState<ParseProgress | null>(null)
  const [structured, setStructured] = useState<StructuredDocument | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [ocrBusyPage, setOcrBusyPage] = useState<number | null>(null)

  const [mode, setMode] = useState<'preserve' | 'redesign' | 'brand'>('redesign')
  const [targetSlides, setTargetSlides] = useState(10)
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview] = useState<{ build: import('../services/pdf').BuildResult; warnings: string[] } | null>(null)

  const handleFile = useCallback(async (file: File) => {
    if (!file || file.type !== 'application/pdf') {
      setError('اختر ملف PDF صالحًا.')
      return
    }
    setError(null)
    setPreview(null)
    setStage('analyzing')
    setProgress({ stage: 'parse', done: 0, total: 1 })
    try {
      const buffer = await file.arrayBuffer()
      bufferRef.current = buffer
      const { structured } = await analyzePdf(buffer, file.name, {
        maxPages: 40,
        onProgress: (p) => setProgress(p),
      })
      setTargetSlides(Math.max(6, Math.min(20, Math.round(structured.pageCount / 2.5))))
      setStructured(structured)
      setStage('structure')
    } catch (e) {
      console.error(e)
      setError('تعذّر تحليل الملف — قد يكون تالفًا أو محميًا بكلمة مرور.')
      setStage('idle')
    }
  }, [])

  const runOcr = useCallback(
    async (pageIndex: number) => {
      const buffer = bufferRef.current
      if (!buffer || !structured) return
      setOcrBusyPage(pageIndex)
      try {
        const doc = await loadPdfDocument(buffer)
        const page = await doc.getPage(pageIndex + 1)
        const canvas = await renderPageToCanvas(page, 2)
        const backend = getOcrBackend()
        const ocrLines = await backend.run(canvas, 'ara+eng', (p) =>
          setProgress({ stage: 'ocr', done: Math.round(p.progress * 100), total: 100, message: `OCR صفحة ${pageIndex + 1}: ${p.status}` }),
        )
        // re-analyze the page with the OCR lines (native lines are empty on scans)
        const normalized = normalizeLines([ocrLines])[0] ?? []
        const stats = computeFontStats(normalized)
        const skeleton = structured.pages[pageIndex]
        const analyzed = analyzePage(skeleton, normalized, stats)
        const pages = [...structured.pages]
        pages[pageIndex] = { ...analyzed, thumbnail: skeleton.thumbnail, scanned: true }
        setStructured({ ...structured, pages, stats: { ...structured.stats, headings: pages.reduce((s, p) => s + p.elements.filter((e) => e.type === 'title' || e.type === 'heading').length, 0) } })
      } catch (e) {
        console.error(e)
        setError('فشل OCR — تحقق من الاتصال (يُنزّل نموذج العربية عند أول استخدام).')
      } finally {
        setOcrBusyPage(null)
        setProgress(null)
      }
    },
    [structured],
  )

  const generate = useCallback(async () => {
    if (!structured) return
    setGenerating(true)
    setError(null)
    try {
      const sections = buildSections(structured.pages)
      attachVisuals(sections, structured.pages)
      const kit = brandKits[0]
      const plan = planPresentation(structured, sections, {
        targetSlides,
        mode,
        brandKit:
          mode === 'brand' && kit
            ? {
                name: kit.name,
                colors: { primary: kit.colors.primary, secondary: kit.colors.secondary, accent: kit.colors.accent },
                fonts: { heading: kit.fonts.heading, body: kit.fonts.body },
              }
            : undefined,
      })
      const imagesById = new Map(structured.pages.flatMap((p) => p.images).map((im) => [im.id, im]))
      const tablesById = new Map(structured.pages.flatMap((p) => p.tables).map((t) => [t.id, t]))
      const build = buildDeck(structured, plan, imagesById, tablesById)
      setPreview({ build, warnings: plan.warnings })
      setStage('preview')
    } catch (e) {
      console.error(e)
      setError('تعذّر توليد العرض من هذه البنية.')
    } finally {
      setGenerating(false)
    }
  }, [structured, targetSlides, mode, brandKits])

  const openInEditor = useCallback(async () => {
    if (!preview) return
    const record = await library.createProject(preview.build.doc)
    requestOpenProject({ projectId: record.id })
  }, [preview, library])

  return (
    <div className="min-h-full bg-ink-950">
      {/* top bar */}
      <div className="aur-hairline-b sticky top-0 z-20 border-b border-ink-800/60 bg-ink-950/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Link to="/app" className="flex items-center gap-1.5 text-[13px] text-ink-300 transition-colors hover:text-ink-50">
            <ArrowRight className="h-4 w-4" />
            المكتبة
          </Link>
          <span className="h-4 w-px bg-ink-700/60" />
          <h1 className="flex items-center gap-2 text-[14.5px] font-bold text-ink-50">
            <Wand2 className="h-4 w-4 text-ai" />
            من PDF إلى عرض تقديمي
          </h1>
          <span className="ms-auto hidden rounded-full border border-ink-700/60 px-2.5 py-1 text-[10.5px] text-ink-400 sm:block">
            Prototype · تحليل محلي داخل المتصفح
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* pipeline header */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {STAGES.map((s, i) => {
            const active = stage === 'analyzing' && progress?.stage === s.id
            const done = stage !== 'idle' && (stage === 'structure' || stage === 'preview' || (progress && progress.stage !== s.id && progress.done >= progress.total))
            return (
              <span key={s.id} className="flex items-center gap-2">
                {i > 0 && <span className="h-px w-5 bg-ink-700/60" />}
                <span
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] font-medium transition-colors',
                    done || (stage !== 'idle' && stage !== 'analyzing') ? 'border-good/40 bg-good/10 text-[#8ee6b8]' : active ? 'border-signal/50 bg-signal/12 text-signal-soft' : 'border-ink-700/60 text-ink-400',
                  )}
                >
                  {active ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <s.icon className="h-3.5 w-3.5" />}
                  {s.label}
                </span>
              </span>
            )
          })}
          <span className="flex items-center gap-2">
            <span className="h-px w-5 bg-ink-700/60" />
            <span className={cn('flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] font-medium', stage === 'preview' ? 'border-good/40 bg-good/10 text-[#8ee6b8]' : 'border-ink-700/60 text-ink-400')}>
              <LayoutTemplate className="h-3.5 w-3.5" />
              توليد العرض
            </span>
          </span>
        </div>

        {progress && (
          <p className="mb-4 flex items-center gap-2 text-[12.5px] text-ink-400">
            <Cpu className="h-3.5 w-3.5" />
            {progress.message ?? 'جارٍ العمل…'}
            {progress.total > 1 && <span className="text-ink-500">({progress.done}/{progress.total})</span>}
          </p>
        )}

        {error && (
          <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-[12.5px] text-red-300">{error}</p>
        )}

        {/* ---- upload ---- */}
        {stage === 'idle' && (
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              void handleFile(e.dataTransfer.files[0])
            }}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'glass hairline cursor-pointer rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-colors',
              dragOver ? 'border-signal/60 bg-signal/8' : 'border-ink-700/60 hover:border-ink-600',
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && void handleFile(e.target.files[0])}
            />
            <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-ai/15 text-ai shadow-[0_0_30px_-8px_rgba(157,123,255,0.7)]">
              <Upload className="h-6 w-6" />
            </span>
            <p className="text-[16px] font-bold text-ink-50">ارفع ملف PDF</p>
            <p className="mx-auto mt-2 max-w-md text-[13px] leading-6 text-ink-400">
              يحلّل المحرك بنية المستند محليًا داخل متصفحك: العناوين والفقرات والقوائم والجداول والصور وحدود كل عنصر،
              ثم يبني منه عرضًا قابلًا للتعديل بالكامل.
            </p>
            <p className="mt-3 text-[11.5px] text-ink-500">PDF نصي (عربي/إنجليزي/فرنسي) · الملفات الممسوحة تدعم OCR عند الطلب</p>
          </div>
        )}

        {/* ---- analyzing ---- */}
        {stage === 'analyzing' && (
          <div className="glass hairline grid place-items-center rounded-2xl px-6 py-20 text-center">
            <Loader2 className="mb-4 h-8 w-8 animate-spin text-signal" />
            <p className="text-[15px] font-bold text-ink-100">جارٍ فهم المستند…</p>
            <p className="mt-1 text-[12.5px] text-ink-400">{progress?.message ?? 'لحظة'}</p>
          </div>
        )}

        {/* ---- structure inspector + options ---- */}
        {stage === 'structure' && structured && (
          <div className="space-y-6">
            <StructureInspector structured={structured} ocrBusyPage={ocrBusyPage} onRunOcr={(p) => void runOcr(p)} />

            {/* generation options */}
            <div className="glass hairline rounded-xl p-4">
              <p className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-ink-100">
                <Sparkles className="h-4 w-4 text-ai" />
                خيارات التوليد
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <ModeCard
                  active={mode === 'redesign'}
                  onClick={() => setMode('redesign')}
                  icon={Wand2}
                  title="إعادة تصميم حديثة"
                  desc="نظام تصميم من قوالب المنصة مع الحفاظ على بنية المحتوى"
                />
                <ModeCard
                  active={mode === 'preserve'}
                  onClick={() => setMode('preserve')}
                  icon={Layers}
                  title="الحفاظ على الهوية"
                  desc="ألوان وخطوط مستخلصة من ملف PDF نفسه"
                  disabled={!structured.brandSuggestion}
                />
                <ModeCard
                  active={mode === 'brand'}
                  onClick={() => setMode('brand')}
                  icon={Palette}
                  title="هوية علامتي"
                  desc={
                    brandKits.length
                      ? `تطبيق Brand Kit: ${brandKits[0].name}`
                      : 'أنشئ هوية من صفحة «الهوية» أولًا'
                  }
                  disabled={!brandKits.length}
                />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-3 text-[12.5px] text-ink-300">
                  عدد الشرائح المستهدف
                  <input
                    type="range"
                    min={4}
                    max={24}
                    value={targetSlides}
                    onChange={(e) => setTargetSlides(Number(e.target.value))}
                    className="range-input w-44"
                  />
                  <span className="w-6 text-center font-bold text-ink-100">{targetSlides}</span>
                </label>
                <button
                  type="button"
                  onClick={() => void generate()}
                  disabled={generating}
                  className="ms-auto flex items-center gap-2 rounded-lg bg-ai px-4 py-2.5 text-[13.5px] font-bold text-white shadow-[0_8px_24px_-8px_rgba(157,123,255,0.9)] transition-[filter,transform] hover:brightness-110 active:translate-y-px disabled:opacity-60"
                >
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  ولّد العرض التقديمي
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---- preview ---- */}
        {stage === 'preview' && preview && (
          <DeckPreview
            result={preview.build}
            warnings={preview.warnings}
            onOpen={() => void openInEditor()}
            onRegenerate={() => {
              setPreview(null)
              setStage('structure')
            }}
          />
        )}

        {/* how it works */}
        {stage === 'idle' && (
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Braces, title: 'فهم لا نسخ', desc: 'كل عنصر يُستخرج بنوعه وموقعه (bbox) ودرجة ثقة — ليس مجرد نص خام.' },
              { icon: ScanText, title: 'عربي أولًا', desc: 'اتجاه RTL، ترتيب قراءة، تطبيع أشكال الحروف، وOCR عربي عند الحاجة.' },
              { icon: LayoutTemplate, title: 'عناصر حقيقية', desc: 'الناتج شرائح بنصوص وجداول وصور قابلة للتعديل وتصدير PPTX — ليست صور صفحات.' },
            ].map((c) => (
              <div key={c.title} className="glass hairline rounded-xl p-4">
                <c.icon className="mb-2 h-5 w-5 text-signal-soft" />
                <p className="text-[13.5px] font-bold text-ink-100">{c.title}</p>
                <p className="mt-1 text-[12px] leading-5 text-ink-400">{c.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ModeCard({
  active,
  onClick,
  icon: Icon,
  title,
  desc,
  disabled,
}: {
  active: boolean
  onClick: () => void
  icon: typeof Wand2
  title: string
  desc: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-start gap-3 rounded-xl border p-3.5 text-start transition-all disabled:opacity-40',
        active ? 'border-ai/60 bg-ai/10 shadow-[0_0_0_1px_rgba(157,123,255,0.35)]' : 'border-ink-700/60 hover:border-ink-600',
      )}
    >
      <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg', active ? 'bg-ai/20 text-ai' : 'bg-ink-800 text-ink-400')}>
        <Icon className="h-4 w-4" />
      </span>
      <span>
        <span className="block text-[13px] font-bold text-ink-50">{title}</span>
        <span className="mt-0.5 block text-[11.5px] leading-5 text-ink-400">{desc}</span>
      </span>
    </button>
  )
}
