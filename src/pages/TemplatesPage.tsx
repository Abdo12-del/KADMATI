/**
 * Template gallery — full-screen browse with a real preview modal.
 * Applying a template either starts a new deck or restyles the deck you already have open, which is
 * what "template" means here: theme + layouts + components, not a background picture.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, Check, Layers, Palette, X } from 'lucide-react'
import { SlidePreview } from '../components/SlidePreview'
import { Button, Chip, Row } from '../components/ui'
import { TEMPLATE_CATEGORIES, TEMPLATE_MAP } from '../templates/catalog'
import { CATEGORY_LABEL, instantiateDeck, type TemplateCategory, type TemplateDef } from '../templates/engine'
import { useLibrary } from '../store/useLibrary'
import { useDoc } from '../store/useDoc'
import { toast, useUI } from '../store/useUI'
import { requestOpenProject } from '../services/openDeck'
import { LAYOUTS } from '../templates/layouts'
import { cn } from '../lib/cn'

export function TemplatesPage() {
  const [params, setParams] = useSearchParams()
  const cat = (params.get('cat') as TemplateCategory | null) ?? 'all'
  const focus = params.get('focus')
  const [open, setOpen] = useState<string | null>(focus)
  const list = useMemo(() => {
    const all = [...TEMPLATE_MAP.values()]
    return cat === 'all' ? all : all.filter((t) => t.category === cat)
  }, [cat])

  useEffect(() => {
    if (focus) setOpen(focus)
  }, [focus])

  return (
    <div className="min-h-full bg-ink-950 text-ink-50">
      <header className="glass aur-hairline-b sticky top-0 z-20 border-b border-ink-800/70">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="aur-fill glow-blue grid size-7 place-items-center rounded-lg text-[12px] font-black text-white">ك</span>
            <span className="font-display text-[15px] font-semibold tracking-tight">KADMATI</span>
          </Link>
          <div className="ms-auto flex items-center gap-2">
            <Link to="/app/decks">
              <Button size="sm" variant="subtle">
                <ArrowRight size={13} /> مكتبتك
              </Button>
            </Link>
            <Button size="sm" variant="primary" onClick={() => useUI.getState().openDialog('new-presentation')}>
              عرض جديد
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-[clamp(1.5rem,3vw,2.1rem)] font-semibold tracking-tight text-white">
              قوالب <span className="aur-text">مبنية، لا مرسومة</span>
            </h1>
            <p className="mt-2 max-w-2xl text-[13.5px] leading-[1.95] text-ink-400">
              كل قالب = سمة ألوان + خطوط + تخطيطات + شرائح افتتاح/محتوى/فصل/ختام. بعد الاستخدام تحصل على عناصر نص وأشكال وجداول ومخططات قابلة للتحرير بالكامل.
            </p>
          </div>
          <p className="text-[12px] text-ink-500">{list.length} قالب</p>
        </div>

        <div className="mt-5 flex flex-wrap gap-1.5">
          <Chip active={cat === 'all'} onClick={() => setParams(cat === 'all' ? {} : { cat: 'all' })}>
            الكل
          </Chip>
          {TEMPLATE_CATEGORIES.map((c) => (
            <Chip key={c} active={cat === c} onClick={() => setParams({ cat: c })}>
              {CATEGORY_LABEL[c]}
            </Chip>
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((template) => (
            <TemplateCard key={template.id} template={template} onOpen={() => setOpen(template.id)} />
          ))}
        </div>
      </div>

      {open ? <TemplateModal template={TEMPLATE_MAP.get(open)!} onClose={() => (setOpen(null), setParams(cat === 'all' ? {} : { cat }))} /> : null}
    </div>
  )
}

function TemplateCard({ template, onOpen }: { template: TemplateDef; onOpen: () => void }) {
  const doc = useMemo(() => instantiateDeck(template, { templateId: template.id, category: template.category }), [template])
  return (
    <article className="glass group overflow-hidden rounded-xl border transition-all hover:-translate-y-0.5 hover:border-signal/40 hover:shadow-aurora">
      <button type="button" onClick={onOpen} className="block w-full">
        <SlidePreview doc={doc} index={0} />
      </button>
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <h3 className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink-50">{template.name}</h3>
          <span className="flex gap-0.5">
            {[doc.theme.palette.primary, doc.theme.palette.secondary, doc.theme.palette.accent].map((c, i) => (
              <i key={i} className="size-2.5 rounded-full ring-1 ring-ink-700/60" style={{ background: c }} />
            ))}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-ink-500">{template.description}</p>
        <div className="mt-2 flex items-center gap-2 text-[11px] text-ink-500">
          <span className="flex items-center gap-1">
            <Layers size={11} /> {template.slides.length} شرائح
          </span>
          <span className="text-ink-700">·</span>
          <span>{CATEGORY_LABEL[template.category]}</span>
          <button type="button" onClick={onOpen} className="ms-auto rounded-md border border-ink-700 px-2 py-0.5 text-[11px] text-ink-200 transition-colors hover:border-signal/60 hover:text-white">
            معاينة
          </button>
        </div>
      </div>
    </article>
  )
}

function TemplateModal({ template, onClose }: { template: TemplateDef; onClose: () => void }) {
  const doc = useMemo(() => instantiateDeck(template, { templateId: template.id, category: template.category }), [template])
  const [index, setIndex] = useState(0)
  const library = useLibrary()
  const editorHasDoc = useDoc((s) => !!s.projectId)
  const slide = doc.slides[index]

  const useAsDeck = async () => {
    const record = await library.createProject(doc)
    requestOpenProject({ projectId: record.id })
    onClose()
  }

  const applyThemeOnly = () => {
    if (!editorHasDoc) {
      toast({ kind: 'info', title: 'افتح عرضًا أولًا', body: 'تطبيق السمة يحتاج عرضًا مفتوحًا في المحرر.' })
      return
    }
    useDoc.getState().applyTheme(doc.theme)
    onClose()
    toast({ kind: 'success', title: `طُبِّقت سمة ${template.name}`, body: 'الألوان والخطوط في كل عرضك الحالي — ⌘Z للتراجع.' })
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink-1000/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-2xl shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center gap-3 border-b border-ink-700/50 px-4 py-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-[16px] font-semibold">{template.name}</h2>
            <p className="mt-0.5 truncate text-[12px] text-ink-400">{template.description}</p>
          </div>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg border border-ink-700 text-ink-300 hover:bg-ink-800" title="إغلاق">
            <X size={14} />
          </button>
        </header>

        <div className="grid gap-3 p-4 lg:grid-cols-[1fr_200px]">
          <div className="overflow-hidden rounded-xl border border-ink-800 bg-paper">
            {slide ? <SlidePreview doc={doc} index={index} /> : null}
          </div>
          <div className="panel-x flex gap-2 overflow-x-auto lg:max-h-[420px] lg:flex-col lg:overflow-y-auto">
            {doc.slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setIndex(i)}
                className={cn('w-36 shrink-0 overflow-hidden rounded-lg border lg:w-full', i === index ? 'border-signal' : 'border-ink-800 hover:border-ink-600')}
              >
                <SlidePreview doc={doc} index={i} />
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 px-4 pb-2 sm:grid-cols-3">
          <InfoBlock title="نظام التصميم" rows={[['السمة', doc.theme.name], ['العناوين', doc.theme.fonts.heading], ['النص', doc.theme.fonts.body], ['الاستدارة', `${doc.theme.radius}px`]]} />
          <InfoBlock title="الشرائح" rows={doc.slides.slice(0, 4).map((s, i) => [`${i + 1}`, s.elements.length + ' عنصر'])} />
          <div>
            <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-ink-500">تخطيطات مستخدمة</p>
            <div className="flex flex-wrap gap-1">
              {Array.from(new Set(doc.slides.map((s) => s.layoutId)))
                .slice(0, 6)
                .map((id) => (
                  <span key={id} className="rounded-full border border-ink-700 px-1.5 py-0.5 text-[10.5px] text-ink-300">
                    {LAYOUTS.find((l) => l.id === id)?.name ?? id}
                  </span>
                ))}
            </div>
            <p className="mt-2 flex items-center gap-1 text-[11px] text-good">
              <Check size={11} /> كل العناصر قابلة للتحرير
            </p>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-ink-700/50 bg-ink-950/40 px-4 py-3">
          <Row className="gap-1.5">
            <Palette size={13} className="text-ink-500" />
            <span className="text-[11.5px] text-ink-400">يطبَّق كنظام كامل: سمة + تخطيطات + محتوى</span>
          </Row>
          <div className="flex gap-2">
            <Button variant="subtle" onClick={applyThemeOnly}>
              تطبيق السمة على عرضي المفتوح
            </Button>
            <Button variant="primary" onClick={() => void useAsDeck()}>
              استخدام القالب
            </Button>
          </div>
        </footer>
      </div>
    </div>
  )
}

function InfoBlock({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div>
      <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-ink-500">{title}</p>
      <dl className="space-y-1">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-2 text-[11.5px]">
            <dt className="text-ink-500">{k}</dt>
            <dd className="truncate text-ink-200">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
