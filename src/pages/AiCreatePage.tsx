/**
 * Create with AI — the generation experience inside the platform (not a chat page).
 *
 *   Idea → Generate → live stages + progressive real-slide preview → Edit in the existing editor.
 *
 * The right side is not a spinner: as soon as the plan exists the outline appears, then each
 * slide is instantiated from the SAME layout engine the editor uses and rendered as a real
 * thumbnail — so "what you saw while generating" is literally what opens in the editor.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, ChevronDown, Cpu, Loader2, Lock, RefreshCw, Sparkles, Wand2 } from 'lucide-react'
import { Button, Field, Select, Slider, TextArea, TextField, Segmented } from '../components/ui'
import { SlidePreview } from '../components/SlidePreview'
import { useUI } from '../store/useUI'
import { useLibrary } from '../store/useLibrary'
import { requestOpenProject } from '../services/openDeck'
import { toast } from '../store/useUI'
import { cn } from '../lib/cn'
import { DESIGN_STYLES } from '../services/ai/design'
import { detectOllama, ollamaUrl } from '../services/ai/provider'
import type { DesignStyleId } from '../services/ai/schema'
import type { GenCategory } from '../services/ai/planner'
import type { GenerateProgress, GenerateResult } from '../services/ai/generate'
import { createPresentation } from '../document/factory'
import { SIZE_4_3, reflowToSize } from '../templates/reflow'
import type { Presentation, Slide } from '../document/types'
import type { AssetRef } from '../document/types'
import type { DeckSpec, SlideSpec } from '../templates/engine'

const EXAMPLES: { label: string; prompt: string }[] = [
  { label: 'تعليم', prompt: 'أريد عرضًا عن الذكاء الاصطناعي وتأثيره على التعليم لطلاب الجامعة' },
  { label: 'أعمال', prompt: 'عرض عن خطة توسع الشركة في السوق الخليجي خلال 2027' },
  { label: 'Pitch', prompt: 'Pitch deck لشركة ناشئة تطور تطبيقًا لتعليم البرمجة للأطفال' },
  { label: 'Énergie', prompt: "Une présentation sur l'énergie solaire et son avenir en Afrique du Nord" },
  { label: 'Solar', prompt: 'A presentation about solar energy for potential investors, with market numbers' },
]

const STAGE_FLOW: { id: string; label: string }[] = [
  { id: 'understanding', label: 'فهم فكرتك…' },
  { id: 'planning', label: 'تخطيط العرض…' },
  { id: 'structure', label: 'إنشاء هيكل الشرائح…' },
  { id: 'content', label: 'كتابة المحتوى…' },
  { id: 'design', label: 'تطبيق نظام التصميم…' },
  { id: 'visuals', label: 'إضافة العناصر البصرية…' },
  { id: 'animate', label: 'اقتراح الحركة…' },
  { id: 'done', label: 'اكتمل العرض' },
]

type Phase = 'form' | 'generating' | 'ready'

export function AiCreatePage() {
  const ai = useUI((s) => s.ai)
  const brandKits = useLibrary((s) => s.brandKits)
  const init = useLibrary((s) => s.init)

  const [phase, setPhase] = useState<Phase>('form')
  const [prompt, setPrompt] = useState('')
  const [lang, setLang] = useState<'ar' | 'fr' | 'en'>('ar')
  const [category, setCategory] = useState<GenCategory>('general')
  const [audience, setAudience] = useState('')
  const [slides, setSlides] = useState(9)
  const [style, setStyle] = useState<DesignStyleId>('professional')
  const [aspect, setAspect] = useState<'16:9' | '4:3'>('16:9')
  const [brandKitId, setBrandKitId] = useState<string>('')
  const [advanced, setAdvanced] = useState(false)

  const [progress, setProgress] = useState<GenerateProgress | null>(null)
  const [outline, setOutline] = useState<string[]>([])
  const [partial, setPartial] = useState<Presentation | null>(null)
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [engineNote, setEngineNote] = useState('')
  const [ollamaStatus, setOllamaStatus] = useState<'unknown' | 'ok' | 'off'>('unknown')
  const cancelled = useRef(false)

  useEffect(() => {
    void init()
    return () => {
      cancelled.current = true
    }
  }, [init])

  // One silent probe so the source chip tells the truth before generating.
  useEffect(() => {
    if (ai.provider !== 'ollama') return
    let alive = true
    void detectOllama(ollamaUrl(ai)).then((status) => {
      if (alive) setOllamaStatus(status.ok ? 'ok' : 'off')
    })
    return () => {
      alive = false
    }
  }, [ai])

  const sourceChip = useMemo(() => {
    if (ai.provider === 'ollama') {
      return ollamaStatus === 'ok'
        ? { icon: Cpu, label: `Ollama محلي — ${ai.model || 'نموذج مقترح تلقائيًا'}`, tone: 'good' as const }
        : { icon: Cpu, label: 'Ollama غير متاح — سيعمل محرك القواعد المحلي', tone: 'warn' as const }
    }
    if (ai.provider === 'custom' && ai.endpoint) return { icon: Sparkles, label: `مزوّد خارجي — ${ai.model || ai.endpoint}`, tone: 'signal' as const }
    return { icon: Lock, label: 'محرك كدماتي المحلي — خصوصية كاملة، بلا إنترنت', tone: 'signal' as const }
  }, [ai, ollamaStatus])

  const generate = async () => {
    if (prompt.trim().length < 8) {
      toast({ kind: 'error', title: 'اكتب فكرة أوضح', body: 'مثال: أريد عرضًا عن الطاقة الشمسية وتأثيرها على التعليم.' })
      return
    }
    setPhase('generating')
    setOutline([])
    setPartial(null)
    setResult(null)
    setProgress({ stage: 'understanding', message: STAGE_FLOW[0].label, done: 0, total: 8 })

    try {
      const { generateDeck } = await import('../services/ai/generate')
      const res = await generateDeck(prompt, {
        slides,
        lang,
        category,
        audience,
        style,
        aspect,
        brandKitId: brandKitId || undefined,
        skipBuild: true,
        onProgress: (p) => {
          setProgress(p)
          if (p.plan) setOutline(p.plan.slides.map((s) => s.title))
        },
      })
      if (cancelled.current) return
      setResult(res)
      setEngineNote(res.engineDetail)

      // Progressive preview: instantiate real slides from the same engine, one per frame-ish tick.
      const spec = res.spec
      const theme = spec.theme!
      const dir = spec.dir ?? 'rtl'
      const builtSlides: Slide[] = []
      const assets: Record<string, AssetRef> = {}
      const mkPartial = (): Presentation => {
        const doc = makePartialDoc(spec, builtSlides, assets)
        return doc
      }
      setPartial(mkPartial())
      for (let i = 0; i < spec.slides.length; i++) {
        if (cancelled.current) return
        await tick(36)
        builtSlides.push(await instantiateOne(spec.slides[i], theme, dir, i, assets))
        setPartial(mkPartial())
        setProgress({ stage: 'visuals', message: `تصميم الشريحة ${i + 1} من ${spec.slides.length}…`, done: 5, total: 8, slidesDone: i + 1 })
      }
      const { suggestSlideAnimations } = await import('../services/ai/animate')
      for (const slide of builtSlides) {
        const anims = suggestSlideAnimations(slide)
        if (anims.length) slide.animations = anims
      }
      setPartial(mkPartial())
      setProgress({ stage: 'done', message: 'اكتمل العرض', done: 8, total: 8 })
      setPhase('ready')
    } catch (err) {
      toast({ kind: 'error', title: 'تعذّر التوليد', body: (err as Error).message })
      setPhase('form')
    }
  }

  const openInEditor = () => {
    if (!result) return
    const doc = partial ?? result.doc
    if (!doc?.slides?.length) return
    requestOpenProject({ doc })
  }

  const regenerate = () => void generate()

  return (
    <div className="min-h-full bg-ink-950 text-ink-50" dir="rtl">
      <header className="glass aur-hairline-b sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-ink-800/70 px-4">
        <Link to="/app" className="flex items-center gap-2 text-[12.5px] text-ink-400 transition-colors hover:text-ink-100">
          <ArrowLeft size={14} className="rotate-180" /> المكتبة
        </Link>
        <span className="h-4 w-px bg-ink-800" />
        <span className="aur-fill glow-blue grid size-7 place-items-center rounded-lg text-[13px] font-black text-white">ك</span>
        <span className="font-display text-[15px] font-semibold tracking-tight">Create with AI</span>
        <span className="ms-auto flex items-center gap-1.5 rounded-full border border-ink-800 bg-ink-900 px-3 py-1 text-[11px] text-ink-300">
          <sourceChip.icon size={12} className={sourceChip.tone === 'good' ? 'text-good' : sourceChip.tone === 'warn' ? 'text-warn' : 'text-signal-soft'} />
          {sourceChip.label}
        </span>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[minmax(340px,420px)_1fr] sm:px-6">
        {/* ------------------------------------------------------------ form */}
        <section className="glass h-fit rounded-2xl border border-ink-800/70 p-5">
          <h1 className="font-display text-[22px] font-bold tracking-tight">ماذا تريد أن تصنع؟</h1>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-400">
            فكرة واحدة تكفي. نخطط العرض، نختار نوع كل شريحة، ونبني عناصر حقيقية قابلة للتعديل بالكامل داخل المحرر.
          </p>

          <div className="mt-4">
            <TextArea value={prompt} onChange={setPrompt} rows={4} placeholder='مثال: "أريد عرضًا عن الطاقة الشمسية وتأثيرها على مستقبل الطاقة في المنطقة"' />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  onClick={() => {
                    setPrompt(ex.prompt)
                    setLang(ex.prompt.match(/[\u0600-\u06FF]/) ? 'ar' : ex.prompt.match(/[éèàê]/i) ? 'fr' : 'en')
                  }}
                  className="rounded-full border border-ink-800 bg-ink-900/60 px-2.5 py-1 text-[10.5px] text-ink-400 transition-colors hover:border-signal/40 hover:text-ink-100"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Field label="اللغة">
              <Segmented
                size="sm"
                value={lang}
                onChange={setLang}
                options={[
                  { value: 'ar', label: 'العربية' },
                  { value: 'fr', label: 'Français' },
                  { value: 'en', label: 'English' },
                ]}
              />
            </Field>
            <Field label="نسبة العرض">
              <Segmented
                size="sm"
                value={aspect}
                onChange={setAspect}
                options={[
                  { value: '16:9', label: '16:9' },
                  { value: '4:3', label: '4:3' },
                ]}
              />
            </Field>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="نوع العرض">
              <Select
                value={category}
                onChange={setCategory}
                options={[
                  { value: 'general', label: 'عام' },
                  { value: 'business', label: 'أعمال' },
                  { value: 'education', label: 'تعليم' },
                  { value: 'pitch', label: 'Pitch Deck' },
                  { value: 'marketing', label: 'تسويق' },
                  { value: 'report', label: 'تقرير' },
                  { value: 'academic', label: 'أكاديمي' },
                ]}
              />
            </Field>
            <Field label="عدد الشرائح">
              <div className="pt-1.5">
                <Slider value={slides} onChange={setSlides} min={4} max={30} step={1} suffix="شريحة" />
              </div>
            </Field>
          </div>

          <Field label="النمط البصري" className="mt-3">
            <div className="grid grid-cols-3 gap-1.5">
              {DESIGN_STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  title={s.hint}
                  onClick={() => setStyle(s.id)}
                  className={cn(
                    'rounded-lg border px-2 py-2 text-[11.5px] font-medium transition-all',
                    style === s.id ? 'border-signal/50 bg-signal/12 text-white shadow-[0_0_14px_-6px_rgba(79,125,255,0.6)]' : 'border-ink-800 bg-ink-900/50 text-ink-400 hover:border-ink-700 hover:text-ink-100',
                  )}
                >
                  {s.label}
                  <span className="mt-0.5 block text-[9.5px] font-normal text-ink-500">{s.en}</span>
                </button>
              ))}
            </div>
          </Field>

          <button type="button" onClick={() => setAdvanced((v) => !v)} className="mt-4 flex w-full items-center gap-1.5 text-[12px] text-ink-400 transition-colors hover:text-ink-100">
            <ChevronDown size={13} className={cn('transition-transform', advanced && 'rotate-180')} /> خيارات متقدمة
          </button>
          {advanced ? (
            <div className="mt-3 space-y-3 rounded-xl border border-ink-800/70 bg-ink-900/40 p-3">
              <Field label="الجمهور">
                <TextField value={audience} onChange={setAudience} placeholder="إدارة عليا / طلاب / مستثمرون / عملاء" />
              </Field>
              <Field label="هوية بصرية (Brand Kit)">
                <Select
                  value={brandKitId}
                  onChange={setBrandKitId}
                  options={[{ value: '', label: 'بدون — نظام تصميم مولّد' }, ...brandKits.map((k) => ({ value: k.id, label: k.name }))]}
                />
              </Field>
              <p className="text-[11px] leading-relaxed text-ink-500">
                عند اختيار هوية تُستخدم ألوانها وخطوطها وشعارها في كل الشرائح تلقائيًا.
              </p>
            </div>
          ) : null}

          <Button variant="primary" size="lg" className="mt-5 w-full justify-center" onClick={() => void generate()} disabled={phase === 'generating'}>
            {phase === 'generating' ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
            {phase === 'generating' ? 'جارٍ التوليد…' : 'Generate Presentation'}
          </Button>
          <p className="mt-2 text-center text-[10.5px] text-ink-500">
            الفكرة تُحلَّل ثم تُخطَّط ثم تُبنى كعناصر حقيقية — لا صور للشرائح، ولا إرسال بياناتك مع المحرك المحلي.
          </p>
        </section>

        {/* ------------------------------------------------------------ preview */}
        <section className="min-w-0">
          {phase === 'form' ? <PreviewIdle /> : null}
          {phase === 'generating' || phase === 'ready' ? (
            <div className="space-y-4">
              <ProgressPanel progress={progress} outline={outline} engineNote={engineNote} />
              {partial ? <SlideGrid doc={partial} onOpen={openInEditor} /> : null}
              {phase === 'ready' && partial ? (
                <div className="glass flex flex-wrap items-center gap-2 rounded-2xl border border-ink-800/70 p-4">
                  <Button variant="primary" onClick={openInEditor}>
                    <Sparkles size={14} /> افتح في المحرر وعدّل أي عنصر
                  </Button>
                  <Button variant="surface" onClick={regenerate}>
                    <RefreshCw size={13} /> إعادة توليد
                  </Button>
                  <Button variant="ghost" onClick={() => setPhase('form')}>
                    فكرة جديدة
                  </Button>
                  {result ? (
                    <span className="ms-auto text-[11px] text-ink-500">
                      {result.animationsApplied ? `${result.animationsApplied} حركة مقترحة · ` : ''}
                      {result.engine === 'local' ? 'محرك محلي' : result.engine} · {partial.slides.length} شريحة
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      </main>
    </div>
  )
}

/* ------------------------------------------------------------------ pieces */

function PreviewIdle() {
  return (
    <div className="glass flex h-full min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-ink-800 p-10 text-center">
      <span className="aur-fill glow-blue grid size-14 place-items-center rounded-2xl text-white">
        <Wand2 size={24} />
      </span>
      <h2 className="mt-4 font-display text-[17px] font-semibold">المعاينة الحيّة تظهر هنا</h2>
      <p className="mt-2 max-w-sm text-[12.5px] leading-relaxed text-ink-400">
        اكتب فكرتك واضغط Generate — ستشاهد مراحل التوليد: الفهم، التخطيط، الهيكل، ثم كل شريحة تُبنى أمامك كعناصر حقيقية.
      </p>
      <div className="mt-6 grid w-full max-w-md grid-cols-3 gap-2 text-[10.5px] text-ink-500">
        {['Cover', 'Statistics', 'Comparison', 'Process', 'Timeline', 'Chart', 'Table', 'Quote', 'Closing'].map((t) => (
          <span key={t} className="rounded-lg border border-ink-800/70 bg-ink-900/50 px-2 py-1.5">
            {t}
          </span>
        ))}
      </div>
      <p className="mt-4 text-[11px] text-ink-500">١٣ نوع شريحة — لكل فكرة شكلها المناسب، لا «عنوان وفصلة» للجميع.</p>
    </div>
  )
}

function ProgressPanel({ progress, outline, engineNote }: { progress: GenerateProgress | null; outline: string[]; engineNote: string }) {
  const currentId = progress?.stage ?? 'understanding'
  const currentIndex = STAGE_FLOW.findIndex((s) => s.id === currentId)
  return (
    <div className="glass rounded-2xl border border-ink-800/70 p-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {STAGE_FLOW.map((stage, i) => {
          const done = i < currentIndex || currentId === 'done'
          const active = i === currentIndex && currentId !== 'done'
          return (
            <span key={stage.id} className={cn('flex items-center gap-1 text-[11px]', done ? 'text-good' : active ? 'text-signal-soft' : 'text-ink-600')}>
              {done ? <Check size={11} /> : active ? <Loader2 size={11} className="animate-spin" /> : <span className="size-1.5 rounded-full bg-ink-700" />}
              {stage.label.replace('…', '')}
            </span>
          )
        })}
      </div>
      {outline.length ? (
        <div className="mt-3 border-t border-ink-800/70 pt-3">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-500">الهيكل المخطط ({outline.length} شريحة)</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {outline.map((title, i) => (
              <span key={`${title}-${i}`} className="rounded-md border border-ink-800 bg-ink-900/60 px-2 py-0.5 text-[10.5px] text-ink-300">
                {i + 1}. {title}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {engineNote ? <p className="mt-2 text-[10.5px] text-ink-500">المصدر: {engineNote}</p> : null}
    </div>
  )
}

function SlideGrid({ doc, onOpen }: { doc: Presentation; onOpen: () => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {doc.slides.map((slide, i) => {
        const titleEl = slide.elements.find((e) => e.role === 'title' && e.kind === 'text')
        const title = titleEl && titleEl.kind === 'text' ? titleEl.content.replace(/<[^>]+>/g, '').trim().slice(0, 46) : slide.name ?? `شريحة ${i + 1}`
        return (
          <button
            key={slide.id}
            type="button"
            onClick={onOpen}
            className="group overflow-hidden rounded-xl border border-ink-800/70 bg-ink-900/40 text-start transition-all hover:-translate-y-0.5 hover:border-signal/40 hover:shadow-aurora"
          >
            <SlidePreview doc={doc} index={i} />
            <div className="flex items-center justify-between px-3 py-2">
              <span className="truncate text-[11.5px] text-ink-300">{title}</span>
              <span className="shrink-0 text-[10px] text-ink-600">{i + 1}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ helpers */

const tick = (ms = 30) => new Promise((r) => setTimeout(r, ms))

async function instantiateOne(spec: SlideSpec, theme: DeckSpec['theme'], dir: 'rtl' | 'ltr', seed: number, assets: Record<string, AssetRef>): Promise<Slide> {
  const { instantiateSlide } = await import('../templates/engine')
  return instantiateSlide(spec, theme!, dir, seed, assets)
}

function makePartialDoc(spec: DeckSpec, slides: Slide[], assets: Record<string, AssetRef>): Presentation {
  const doc = createPresentation({
    title: spec.title,
    theme: spec.theme,
    slides: slides.length ? [...slides] : undefined,
    assets: { ...assets },
    metadata: {
      title: spec.title,
      subject: spec.subject,
      author: spec.author,
      tags: spec.tags ?? [],
      dir: spec.dir ?? 'rtl',
      lang: spec.lang ?? 'ar',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      trashedAt: null,
    },
  })
  if (spec.aspect === '4:3') reflowToSize(doc, SIZE_4_3)
  return doc
}

