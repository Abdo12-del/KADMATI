/**
 * Every modal in the product, in one place. Nothing here is decorative: each primary button calls a
 * real service (templates engine, PPTX exporter, importer, AI generator) and reports what happened.
 */
import { useMemo, useRef, useState } from 'react'
import {
  Check,
  FileSpreadsheet,
  FileText,
  Import,
  LayoutTemplate,
  Loader2,
  Sparkles,
  Upload,
  Wand2,
  Download,
} from 'lucide-react'
import { Button, Chip, Divider, Field, Modal, NumberField, Row, Segmented, Select, Slider, Switch, TextArea, TextField } from './ui'
import { SlideView } from '../render/SlideView'
import { SHORTCUTS } from '../editor/useKeyboard'
import { useDoc } from '../store/useDoc'
import { toast, useUI } from '../store/useUI'
import { TEMPLATE_CATEGORIES, TEMPLATE_MAP, templatesByCategory } from '../templates/catalog'
import type { TemplateCategory } from '../templates/engine'
import { CATEGORY_LABEL, instantiateDeck, type TemplateDef } from '../templates/engine'
import { createPresentation, presentationWordCount } from '../document/factory'
import { exportToPptx } from '../services/exportPptx'
import { exportImagesZip, exportPdf, type RasterFormat } from '../services/exportImages'
import { makeRenderSlide } from '../services/renderOffscreen'
import { downloadBlob, downloadUrl } from '../store/storage'
import { importPptxFile } from '../services/importPptx'
import { cn, fileNameSafe } from '../lib/cn'
import { requestOpenProject } from '../services/openDeck'

export function DialogHost() {
  const dialog = useUI((s) => s.dialog)
  if (!dialog) return null
  return (
    <>
      {dialog === 'new-presentation' ? <NewPresentationDialog /> : null}
      {dialog === 'import' ? <ImportDialog /> : null}
      {dialog === 'export' ? <ExportDialog /> : null}
      {dialog === 'shortcuts' ? <ShortcutsDialog /> : null}
      {dialog === 'ai-settings' ? <AiSettingsDialog /> : null}
      {dialog === 'profile' ? <ProfileDialog /> : null}
      {dialog === 'share' ? <ShareDialog /> : null}
    </>
  )
}

function close() {
  useUI.getState().closeDialog()
}

/* ------------------------------------------------------------------ new presentation */

type NewMode = 'blank' | 'template' | 'import' | 'ai'

function NewPresentationDialog() {
  const [mode, setMode] = useState<NewMode>('template')

  return (
    <Modal
      open
      onClose={close}
      title="عرض جديد"
      width={860}
      footer={
        <Row className="justify-end">
          <Button variant="ghost" onClick={close}>
            إلغاء
          </Button>
        </Row>
      }
    >
      <div className="grid gap-5 md:grid-cols-[190px_1fr]">
        <nav className="flex gap-1 md:flex-col">
          {(
            [
              ['template', 'من قالب', LayoutTemplate],
              ['blank', 'فارغ', FileText],
              ['import', 'استيراد PPTX', Import],
              ['ai', 'توليد بالذكاء', Sparkles],
            ] as [NewMode, string, typeof FileText][]
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              className={cn(
                'flex flex-1 items-center gap-2 rounded-lg border px-3 py-2.5 text-[12.5px] font-medium transition-colors',
                mode === id ? 'border-signal/50 bg-signal/10 text-ink-50' : 'border-ink-800 text-ink-300 hover:bg-ink-850 hover:text-ink-100',
              )}
            >
              <Icon size={15} className={mode === id ? 'text-signal' : 'text-ink-500'} />
              {label}
            </button>
          ))}
        </nav>
        <div className="min-h-[380px]">
          {mode === 'blank' ? <BlankPane /> : null}
          {mode === 'template' ? <TemplatePane /> : null}
          {mode === 'import' ? <ImportPane /> : null}
          {mode === 'ai' ? <AiPane /> : null}
        </div>
      </div>
    </Modal>
  )
}

function BlankPane() {
  const [title, setTitle] = useState('عرضي الجديد')
  const [size, setSize] = useState<'169' | '43'>('169')
  const create = () => {
    const sizeSpec = size === '169' ? { w: 1280, h: 720 } : { w: 1024, h: 768 }
    const doc = createPresentation({ title: title.trim() || 'عرض بدون عنوان', size: sizeSpec })
    requestOpenProject({ doc })
    toast({ kind: 'success', title: 'أُنشئ العرض', body: 'شريحة فارغة جاهزة — ابدأ بالعناصر أو بتخطيط جاهز.' })
  }
  return (
    <div className="space-y-4">
      <p className="text-[12.5px] leading-relaxed text-ink-400">
        لوحة بيضاء بأدوات المحرر الكاملة: نص، أشكال، جداول، مخططات، وشرائح ذكية. كل شيء قابل للتحرير لاحقًا بما فيه التصدير.
      </p>
      <Field label="الاسم">
        <TextField value={title} onChange={setTitle} />
      </Field>
      <Field label="المقاس">
        <Segmented
          value={size}
          onChange={(v) => setSize(v as never)}
          options={[
            { value: '169', label: 'عريض ١٦:٩' },
            { value: '43', label: 'كلاسيكي ٤:٣' },
          ]}
        />
      </Field>
      <Button variant="primary" onClick={create}>
        إنشاء العرض الفارغ
      </Button>
    </div>
  )
}

function TemplatePane() {
  const [cat, setCat] = useState<TemplateCategory | 'all'>('all')
  const list = cat === 'all' ? [...TEMPLATE_MAP.values()] : templatesByCategory(cat)

  const use = (templateId: string) => {
    const template = TEMPLATE_MAP.get(templateId)
    if (!template) return
    const doc = instantiateDeck(template, { templateId: template.id, category: template.category })
    requestOpenProject({ doc })
    toast({ kind: 'success', title: `يُفتح قالب ${template.name}`, body: 'كل عنصر قابل للتحرير — القالب ليس صورة.' })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        <Chip active={cat === 'all'} onClick={() => setCat('all')}>
          الكل
        </Chip>
        {TEMPLATE_CATEGORIES.map((c) => (
          <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
            {CATEGORY_LABEL[c]}
          </Chip>
        ))}
      </div>
      <div className="panel-x grid max-h-[340px] grid-cols-2 gap-2 overflow-y-auto pe-1 sm:grid-cols-3">
        {list.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => use(template.id)}
            className="group overflow-hidden rounded-lg border border-ink-800 text-start transition-colors hover:border-ink-600"
          >
            <TemplateCover template={template} />
            <div className="px-2 py-1.5">
              <p className="truncate text-[12px] font-medium text-ink-100">{template.name}</p>
              <p className="mt-0.5 truncate text-[10.5px] text-ink-500">
                {CATEGORY_LABEL[template.category]} · {template.slides.length} شرائح
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function TemplateCover({ template }: { template: TemplateDef }) {
  const doc = useMemo(() => instantiateDeck(template), [template])
  const slide = doc.slides[0]
  if (!slide) return null
  return (
    <div className="relative aspect-video w-full overflow-hidden bg-ink-950">
      <div className="absolute inset-0" style={{ width: doc.size.w, height: doc.size.h, transform: 'scale(0.155)', transformOrigin: 'top left' }}>
        <SlideView slide={slide} doc={doc} mode="thumb" static />
      </div>
    </div>
  )
}

function ImportPane() {
  return <ImportFlow />
}

function ImportFlow({ compact }: { compact?: boolean }) {
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [drag, setDrag] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  const run = async (file?: File | null) => {
    if (!file) return
    setBusy(true)
    try {
      await importPptxFile(file, (label, done, total) => setProgress(total ? `${label} (${done}/${total})` : label))
      close()
    } catch (err) {
      toast({ kind: 'error', title: 'فشل الاستيراد', body: (err as Error).message })
    } finally {
      setBusy(false)
      setProgress(null)
    }
  }

  return (
    <div className={cn('space-y-3', !compact && 'pt-1')}>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          void run(e.dataTransfer.files?.[0])
        }}
        className={cn(
          'rounded-xl border border-dashed p-6 text-center transition-colors',
          drag ? 'border-signal bg-signal/8' : 'border-ink-700 bg-ink-950',
        )}
      >
        <Upload size={20} className="mx-auto text-ink-500" />
        <p className="mt-2 text-[13px] font-medium text-ink-100">أفلت ملف PPTX هنا</p>
        <p className="mt-1 text-[11.5px] leading-relaxed text-ink-400">
          نقرأ النص، الصور، الأشكال، الجداول، المخططات والخلفيات كعناصر قابلة للتحرير. ما لا يمكن تحويله يبقى صورة آمنة ونخبرك به.
        </p>
        <div className="mt-3 flex justify-center gap-2">
          <Button variant="surface" size="sm" onClick={() => input.current?.click()} disabled={busy}>
            {busy ? <Loader2 size={13} className="animate-spin" /> : <FileSpreadsheet size={13} />} اختيار ملف
          </Button>
        </div>
        <input ref={input} type="file" accept=".pptx,ppt" className="hidden" onChange={(e) => void run(e.target.files?.[0])} />
      </div>
      {progress ? <p className="text-[11.5px] text-signal-soft">{progress}</p> : null}
    </div>
  )
}

function AiPane() {
  const [prompt, setPrompt] = useState('')
  const [slides, setSlides] = useState(9)
  const [category, setCategory] = useState<TemplateCategory>('business')
  const [style, setStyle] = useState<'minimal' | 'business' | 'creative' | 'academic' | 'bold'>('business')
  const [audience, setAudience] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const ai = useUI((s) => s.ai)

  const generate = async () => {
    if (prompt.trim().length < 8) {
      toast({ kind: 'error', title: 'اكتب موضوعًا أوضح', body: 'مثال: عرض عن اعتماد الذكاء الاصطناعي في المستشفى لهذا العام.' })
      return
    }
    setBusy('بدء التوليد…')
    try {
      const { generateDeck } = await import('../services/ai/generate')
      const { spec, engine } = await generateDeck(prompt, {
        slides,
        category,
        style,
        audience,
        onStage: (stage, done, total) => setBusy(`${stage} (${done}/${total})`),
      })
      const doc = instantiateDeck(spec, { category })
      requestOpenProject({ doc })
      toast({
        kind: 'ai',
        title: `أُنشئ عرض من ${doc.slides.length} شرائح`,
        body: engine === 'provider' ? 'المحتوى من مزوّدك — راجعه وعدّله.' : 'المحتوى مُهيكل محليًا: عدّل العناوين والنقاط، كل شيء قابل للتحرير.',
      })
    } catch (err) {
      toast({ kind: 'error', title: 'تعذّر التوليد', body: (err as Error).message })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-3">
      <TextArea
        value={prompt}
        onChange={setPrompt}
        rows={3}
        placeholder="مثال: عرض تقديمي عن خطة تبني الذكاء الاصطناعي في خدمة العملاء خلال ٩٠ يومًا"
      />
      <div className="grid grid-cols-2 gap-2">
        <Field label="عدد الشرائح">
          <NumberField value={slides} min={4} max={30} onChange={(v) => setSlides(Math.max(4, Math.min(30, v)))} compact />
        </Field>
        <Field label="نوع العرض">
          <Select value={category} onChange={(v) => setCategory(v as TemplateCategory)} options={TEMPLATE_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABEL[c] }))} />
        </Field>
        <Field label="أسلوب بصري">
          <Select
            value={style}
            onChange={(v) => setStyle(v as never)}
            options={[
              { value: 'minimal', label: 'بسيط' },
              { value: 'business', label: 'أعمال' },
              { value: 'creative', label: 'إبداعي' },
              { value: 'academic', label: 'أكاديمي' },
              { value: 'bold', label: 'جريء' },
            ]}
          />
        </Field>
        <Field label="الجمهور">
          <TextField value={audience} onChange={setAudience} placeholder="إدارة عليا / طلاب / عملاء" />
        </Field>
      </div>
      <p className="text-[11.5px] leading-relaxed text-ink-400">
        {ai.provider === 'custom' && ai.endpoint
          ? `المصدر: ${ai.model || ai.endpoint} — نطلب منه الهيكل والنصوص فقط، ثم نبني التخطيط والعناصر محليًا.`
          : 'المصدر: محرك أوروفا المحلي — يبني هيكلًا ومنطقًا لغويًا دون إنترنت. اضبط مزوّدًا من إعدادات الذكاء لتحصل على صياغة أعمق.'}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="primary" onClick={() => void generate()} disabled={!!busy}>
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />} توليد العرض
        </Button>
        {busy ? <span className="text-[11.5px] text-signal-soft">{busy}</span> : null}
        <Button variant="ghost" size="sm" onClick={() => useUI.getState().openDialog('ai-settings')}>
          إعدادات الذكاء
        </Button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ export */

type ExportFormat = 'pptx' | 'pdf' | 'png' | 'jpg'

function ExportDialog() {
  const doc = useDoc((s) => s.doc)
  const slideIndex = useDoc((s) => s.slideIndex)
  const [format, setFormat] = useState<ExportFormat>('pptx')
  const [scale, setScale] = useState(2)
  const [quality, setQuality] = useState(92)
  const [includeNotes, setIncludeNotes] = useState(true)
  const [hiddenSlides, setHiddenSlides] = useState(false)
  const [scope, setScope] = useState<'all' | 'current'>('all')
  const [busy, setBusy] = useState<string | null>(null)
  const [report, setReport] = useState<{ title: string; lines: string[] } | null>(null)

  const words = useMemo(() => presentationWordCount(doc), [doc])

  const run = async () => {
    setReport(null)
    try {
      if (format === 'pptx') {
        setBusy('يُبني ملف PPTX…')
        const { blob, result } = await exportToPptx(doc, {
          includeNotes,
          hiddenSlides,
          onProgress: (step, done, total) => setBusy(`${step}${total ? ` · ${done}/${total}` : ''}`),
        })
        downloadBlob(blob, result.fileName)
        setReport({
          title: `${result.fileName} · ${Math.round(result.bytes / 1024)} ك.ب`,
          lines: result.rasterized.length
            ? [`${result.rasterized.length} عنصر حُوّل إلى صورة لأنه لا يمثَّل في PPTX:`, ...result.rasterized.slice(0, 6).map((r) => `· ${r.name}: ${r.reason}`)]
            : ['كل العناصر صدّرت كعناصر PPTX أصلية قابلة للتحرير — لم نُصغّر أي شريحة إلى صورة.'],
        })
        toast({ kind: 'success', title: 'صُدِّر PPTX', body: `${doc.slides.length} شريحة قابلة للتحرير في PowerPoint` })
      } else if (format === 'pdf') {
        setBusy('يُجهّز PDF…')
        const slides = scope === 'current' ? [doc.slides[slideIndex]] : doc.slides
        const sub = { ...doc, slides }
        const { blob, fileName } = await exportPdf(sub, {
          scale,
          quality: quality / 100,
          renderSlide: makeRenderSlide(sub, 1),
          onProgress: (done, total, label) => setBusy(`${label} (${done}/${total})`),
        })
        downloadBlob(blob, fileName)
        setReport({ title: `${fileName} · ${slides.length} صفحة`, lines: ['الصفحات صور عالية الدقة — النص غير قابل للتحديد داخل PDF (حدّ المتصفح، وليس تصميمك).'] })
        toast({ kind: 'success', title: 'صُدِّر PDF', body: `${slides.length} صفحة بجودة عالية` })
      } else {
        setBusy('يلتقط الشرائح…')
        const target = scope === 'current' ? [doc.slides[slideIndex].id] : undefined
        const base = {
          scale,
          quality: quality / 100,
          format: format as RasterFormat,
          slideIds: target,
          renderSlide: makeRenderSlide(doc, 1),
          onProgress: (done: number, total: number, label: string) => setBusy(`${label} (${done}/${total})`),
        }
        if (scope === 'current' && target) {
          const { toPng, toJpeg } = await import('html-to-image')
          const node = await base.renderSlide(slideIndex, doc.size.w, doc.size.h)
          const url = format === 'jpg' ? await toJpeg(node, { quality: quality / 100, pixelRatio: scale, backgroundColor: '#ffffff' }) : await toPng(node, { pixelRatio: scale, backgroundColor: '#ffffff' })
          downloadUrl(url, `${fileNameSafe(doc.metadata.title)}-${slideIndex + 1}.${format}`)
          node.remove()
          setReport({ title: `شريحة ${slideIndex + 1} بصيغة ${format.toUpperCase()}`, lines: [`الدقة: ${doc.size.w * scale}×${doc.size.h * scale} بكسل.`] })
        } else {
          const { blob, fileName } = await exportImagesZip(doc, base)
          downloadBlob(blob, fileName)
          setReport({ title: `${fileName} · ${doc.slides.filter((s) => !s.hidden).length} صورة`, lines: [`الدقة: ${doc.size.w * scale}×${doc.size.h * scale} لكل شريحة، مع manifest.json يصف العرض.`] })
        }
        toast({ kind: 'success', title: `صُدِّرت الصور (${format.toUpperCase()})`, body: 'ZIP جاهز في مجلد التنزيلات.' })
      }
    } catch (err) {
      toast({ kind: 'error', title: 'فشل التصدير', body: (err as Error).message })
      setReport({ title: 'تعذّر التصدير', lines: [(err as Error).message] })
    } finally {
      setBusy(null)
    }
  }

  return (
    <Modal
      open
      onClose={close}
      title="تصدير"
      width={720}
      footer={
        <Row className="justify-between">
          <span className="text-[11.5px] text-ink-500">
            {doc.slides.length} شريحة · {words} كلمة · {doc.metadata.dir === 'rtl' ? 'RTL' : 'LTR'}
          </span>
          <Button variant="primary" onClick={() => void run()} disabled={!!busy}>
            {busy ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} تنزيل
          </Button>
        </Row>
      }
    >
      <div className="grid gap-5 md:grid-cols-[1fr_260px]">
        <div className="space-y-4">
          <Segmented
            value={format}
            onChange={(v) => setFormat(v as ExportFormat)}
            options={[
              { value: 'pptx', label: 'PPTX' },
              { value: 'pdf', label: 'PDF' },
              { value: 'png', label: 'PNG' },
              { value: 'jpg', label: 'JPG' },
            ]}
          />
          {format === 'pptx' ? (
            <div className="space-y-2.5">
              <p className="text-[12px] leading-relaxed text-ink-400">
                ملف PowerPoint حقيقي: نصوص في مربعات نص، أشكال أصلية، جداول ومخططات قابلة للتحديث، وخلفيات بلون/تدرج — لا صور مشطوفة للشرائح.
              </p>
              <Switch checked={includeNotes} onChange={setIncludeNotes} label="تضمين ملاحظات المتحدث" />
              <Switch checked={hiddenSlides} onChange={setHiddenSlides} label="تضمين الشرائح المخفية" />
              <div className="rounded-lg border border-ink-800 bg-ink-950 p-2.5 text-[11.5px] leading-relaxed text-ink-400">
                يُحوَّل إلى صورة فقط ما لا يدعمه PPTX (فلاتر CSS المعقدة، أقنعة غير قياسية، SVG مخصص). إن حدث ستجده مدرجًا أدناه بوضوح.
              </div>
            </div>
          ) : null}
          {format !== 'pptx' ? (
            <div className="space-y-3">
              <Field label="الموضوع">
                <Segmented
                  size="sm"
                  value={scope}
                  onChange={(v) => setScope(v as never)}
                  options={[
                    { value: 'all', label: 'كل الشرائح' },
                    { value: 'current', label: 'الشريحة الحالية' },
                  ]}
                />
              </Field>
              <Field label={`الدقة — ×${scale}`}>
                <Slider value={scale} min={1} max={4} step={1} onChange={setScale} suffix="×" />
              </Field>
              <Field label={`الجودة — ${quality}٪`}>
                <Slider value={quality} min={50} max={100} step={1} onChange={setQuality} suffix="٪" />
              </Field>
              <p className="text-[11.5px] leading-relaxed text-ink-500">
                {format === 'pdf' ? 'كل شريحة صفحة مستقلة بنفس المقاس، جاهزة للطباعة والمشاركة.' : 'ZIP يحتوي كل الشرائح مع manifest.json بوصف العرض.'}
              </p>
            </div>
          ) : null}
          {report ? (
            <div className="rounded-lg border border-good/30 bg-good/8 p-3">
              <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-good">
                <Check size={13} /> {report.title}
              </p>
              <ul className="mt-1.5 space-y-0.5 text-[11.5px] leading-relaxed text-ink-300">
                {report.lines.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <aside className="space-y-2 rounded-lg border border-ink-800 bg-ink-950 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">ملخص العرض</p>
          <Info label="شرائح" value={String(doc.slides.length)} />
          <Info label="عناصر" value={String(doc.slides.reduce((n, s) => n + s.elements.length, 0))} />
          <Info label="وسائط" value={String(Object.keys(doc.assets).length)} />
          <Info label="كلمات" value={String(words)} />
          <Divider />
          <p className="text-[11px] leading-relaxed text-ink-500">
            العنوان: <span className="text-ink-200">{doc.metadata.title}</span>
          </p>
          <p className="text-[11px] leading-relaxed text-ink-500">
            السمة: <span className="text-ink-200">{doc.theme.name}</span>
          </p>
        </aside>
      </div>
    </Modal>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between text-[12px]">
      <span className="text-ink-400">{label}</span>
      <span className="font-mono text-ink-100">{value}</span>
    </div>
  )
}

/* ------------------------------------------------------------------ import (standalone dialog) */

function ImportDialog() {
  return (
    <Modal open onClose={close} title="استيراد PowerPoint" width={560}>
      <ImportFlow compact />
    </Modal>
  )
}

/* ------------------------------------------------------------------ shortcuts / settings */

function ShortcutsDialog() {
  return (
    <Modal open onClose={close} title="اختصارات لوحة المفاتيح" width={720}>
      <div className="grid gap-5 sm:grid-cols-2">
        {SHORTCUTS.map((group) => (
          <section key={group.group}>
            <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500">{group.group}</h3>
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.label} className="flex items-center justify-between gap-3 rounded-md px-1.5 py-1 text-[12.5px] hover:bg-ink-850">
                  <span className="text-ink-200">{item.label}</span>
                  <span className="flex gap-1">
                    {item.keys.map((k) => (
                      <kbd key={k} className="rounded border border-ink-700 bg-ink-850 px-1.5 py-0.5 font-mono text-[10.5px] text-ink-300">
                        {k}
                      </kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Modal>
  )
}

function AiSettingsDialog() {
  const ai = useUI((s) => s.ai)
  const setAi = useUI((s) => s.setAi)
  return (
    <Modal open onClose={close} title="إعدادات الذكاء الاصطناعي" width={600}>
      <div className="space-y-3.5">
        <Field label="المصدر">
          <Segmented
            value={ai.provider}
            onChange={(v) => setAi({ provider: v as never })}
            options={[
              { value: 'local', label: 'محلي (في المتصفح)' },
              { value: 'custom', label: 'مزوّد خارجي' },
            ]}
          />
        </Field>
        {ai.provider === 'custom' ? (
          <>
            <Field label="عنوان API">
              <TextField value={ai.endpoint} onChange={(v) => setAi({ endpoint: v })} placeholder="https://my-provider.example/v1/chat/completions" />
            </Field>
            <Field label="الموديل">
              <TextField value={ai.model} onChange={(v) => setAi({ model: v })} placeholder="gpt-… · local-llm · …" />
            </Field>
            <Field label="مفتاح API">
              <TextField value={ai.apiKey ?? ''} onChange={(v) => setAi({ apiKey: v })} placeholder="يُحفظ في هذا المتصفح فقط" />
            </Field>
            <p className="rounded-lg border border-warn/30 bg-warn/8 p-2.5 text-[11.5px] leading-relaxed text-ink-200">
              لا خادم وسيط بعد: الطلبات تخرج من متصفحك مباشرةً إلى العنوان أعلاه، والمفتاح مخزّن محليًا في device storage. لا تلصق مفتاحًا مشتركًا.
            </p>
          </>
        ) : (
          <p className="rounded-lg border border-ink-800 bg-ink-950 p-2.5 text-[11.5px] leading-relaxed text-ink-300">
            المحرك المحلي يبني هيكل العرض ويعيد صياغة النصوص بقواعد لغوية — يعمل بلا اتصال وبلا إرسال أي بيانات. القالب والتخطيط والمحاذاة تظل كما هي في كلتا الحالتين.
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="النبرة">
            <Select
              value={ai.tone}
              onChange={(v) => setAi({ tone: v as never })}
              options={[
                { value: 'neutral', label: 'محايدة' },
                { value: 'formal', label: 'رسمية' },
                { value: 'friendly', label: 'ودّية' },
                { value: 'punchy', label: 'مكثّفة' },
              ]}
            />
          </Field>
          <Field label="كثافة النص">
            <Select
              value={ai.density}
              onChange={(v) => setAi({ density: v as never })}
              options={[
                { value: 'short', label: 'قصير' },
                { value: 'balanced', label: 'متوازن' },
                { value: 'rich', label: 'غني' },
              ]}
            />
          </Field>
        </div>
        <Row className="justify-end">
          <Button variant="primary" onClick={close}>
            تم
          </Button>
        </Row>
      </div>
    </Modal>
  )
}

function ProfileDialog() {
  const profile = useUI((s) => s.profile)
  const setProfile = useUI((s) => s.setProfile)
  const [name, setName] = useState(profile?.name ?? '')
  const [role, setRole] = useState(profile?.role ?? '')
  const [email, setEmail] = useState(profile?.email ?? '')
  return (
    <Modal open onClose={close} title="ملفك" width={480}>
      <div className="space-y-3">
        <p className="text-[11.5px] leading-relaxed text-ink-400">
          يُستخدم الاسم في بيانات PPTX (المؤلف) وفي الشرائح التي تطلب تقديمًا. الحسابات والمزامنة السحابية لم تُبنَ بعد — كل شيء هنا محلي في متصفحك.
        </p>
        <Field label="الاسم">
          <TextField value={name} onChange={setName} />
        </Field>
        <Field label="الدور">
          <TextField value={role} onChange={setRole} placeholder="مصمم عروض / مدير منتج / محاضر" />
        </Field>
        <Field label="البريد">
          <TextField value={email} onChange={setEmail} placeholder="name@studio.com" />
        </Field>
        <Row className="justify-end gap-2">
          <Button variant="ghost" onClick={() => setProfile(null)}>
            مسح
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setProfile({ name: name.trim() || 'مستخدم أوروفا', role: role.trim(), email: email.trim() })
              close()
              toast({ kind: 'success', title: 'حُفظ الملف' })
            }}
          >
            حفظ
          </Button>
        </Row>
      </div>
    </Modal>
  )
}

function ShareDialog() {
  const doc = useDoc((s) => s.doc)
  const [copied, setCopied] = useState(false)
  const json = useMemo(() => JSON.stringify(doc, null, 2), [doc])
  return (
    <Modal open onClose={close} title="مشاركة وحفظ" width={560}>
      <div className="space-y-3">
        <p className="rounded-lg border border-ink-800 bg-ink-950 p-2.5 text-[11.5px] leading-relaxed text-ink-300">
          روابط المشاركة والتعاون اللحظي تحتاج خادمًا — وهو ضمن المرحلة ٨ في خطة العمل، لذا لم نضع زرًا لا يعمل. ما يعمل اليوم: تنزيل الملف، أو نسخ مستند JSON كامل تفتحه هنا لاحقًا.
        </p>
        <Row className="gap-2">
          <Button
            variant="surface"
            onClick={() => {
              downloadBlob(new Blob([json], { type: 'application/json' }), `${fileNameSafe(doc.metadata.title)}.aurova.json`)
            }}
          >
            <Upload size={13} /> تنزيل نسخة JSON
          </Button>
          <Button
            variant="ghost"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(json)
                setCopied(true)
                setTimeout(() => setCopied(false), 1800)
              } catch {
                toast({ kind: 'error', title: 'المتصفح منع النسخ', body: 'استخدم تنزيل نسخة JSON بدلًا من ذلك.' })
              }
            }}
          >
            {copied ? <Check size={13} /> : <FileText size={13} />} {copied ? 'نُسخ' : 'نسخ المستند'}
          </Button>
        </Row>
      </div>
    </Modal>
  )
}

