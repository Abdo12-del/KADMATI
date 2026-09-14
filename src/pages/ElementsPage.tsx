/**
 * Elements library — the reusable building blocks a deck is made of. Each tile does something real:
 * it creates a scratch deck seeded with that element so you can see and edit it, or copies its SVG.
 */
import { useMemo, useState } from 'react'
import { Check, Copy, Plus } from 'lucide-react'
import { Button, Chip, Row, Segmented } from '../components/ui'
import { SHAPE_LIBRARY, shapePath } from '../document/shapes'
import { ICON_CATEGORIES, iconSvg } from '../lib/iconLibrary'
import { LAYOUTS } from '../templates/layouts'
import { SlidePreview } from '../components/SlidePreview'
import { MINIMAL_THEME, createPresentation, createSlide } from '../document/factory'
import { createChart, createShape, createTable, createText } from '../document/factory'
import { useLibrary } from '../store/useLibrary'
import { requestOpenProject } from '../services/openDeck'
import { toast } from '../store/useUI'
import { cn } from '../lib/cn'
import type { Presentation, Theme } from '../document/types'

type Kind = 'shapes' | 'icons' | 'blocks' | 'layouts'

export function ElementsPane() {
  const [kind, setKind] = useState<Kind>('blocks')
  const theme = useLibrary((s) => s.projects[0]?.doc.theme) ?? MINIMAL_THEME

  return (
    <section>
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          value={kind}
          onChange={(v) => setKind(v as Kind)}
          options={[
            { value: 'shapes', label: 'أشكال' },
            { value: 'icons', label: 'أيقونات' },
            { value: 'blocks', label: 'مكوّنات' },
            { value: 'layouts', label: 'تخطيطات' },
          ]}
        />
        <p className="text-[11.5px] text-ink-500">كل عنصر هنا يُفتح في عرض تجريبي قابل للتحرير — لا معرض صور.</p>
      </div>
      <div className="mt-4">
        {kind === 'shapes' ? <ShapeLibrary theme={theme} /> : null}
        {kind === 'icons' ? <IconLibrary /> : null}
        {kind === 'blocks' ? <BlockLibrary theme={theme} /> : null}
        {kind === 'layouts' ? <LayoutLibrary theme={theme} /> : null}
      </div>
    </section>
  )
}

function useScratchDeck(make: (theme: Theme) => Presentation['slides'][number], label: string) {
  const library = useLibrary()
  return async (theme: Theme) => {
    const doc = createPresentation({ title: label })
    const slide = make(theme)
    doc.slides = [slide]
    const record = await library.createProject(doc)
    requestOpenProject({ projectId: record.id })
  }
}

function ShapeLibrary({ theme }: { theme: Theme }) {
  const open = useScratchDeck((t) => {
    const slide = createSlide()
    SHAPE_LIBRARY.slice(0, 12).forEach((shape, i) => {
      slide.elements.push(
        createShape(t, {
          shape: shape.id,
          x: 96 + (i % 4) * 280,
          y: 110 + Math.floor(i / 4) * 170,
          w: 210,
          h: 130,
          fill: { type: i % 3 ? 'solid' : 'gradient', ...(i % 3 ? { color: [t.palette.primary, t.palette.secondary, t.palette.accent][i % 3] } : { kind: 'linear', angle: 135, stops: [{ pos: 0, color: t.palette.primary }, { pos: 100, color: t.palette.accent }] }) } as never,
          radius: [12, 12, 12, 12],
        }),
      )
    })
    return slide
  }, 'معرض أشكال')

  const [copied, setCopied] = useState<string | null>(null)
  return (
    <div>
      <Row className="mb-3 justify-between">
        <p className="text-[12.5px] text-ink-400">{SHAPE_LIBRARY.length} شكلًا بأكواد SVG ومسارات PPTX المقابلة</p>
        <Button size="sm" variant="surface" onClick={() => void open(theme)}>
          <Plus size={12} /> فتح الكل في عرض
        </Button>
      </Row>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-8">
        {SHAPE_LIBRARY.map((shape) => (
          <div key={shape.id} className="group rounded-lg border border-ink-800 bg-ink-900/50 p-2 transition-colors hover:border-ink-600">
            <button
              type="button"
              title={shape.label}
              onClick={async () => {
                const doc = createPresentation({ title: shape.label })
                const slide = doc.slides[0]
                slide.elements.push(createShape(MINIMAL_THEME, { shape: shape.id, x: 340, y: 180, w: 600, h: 360, fill: { type: 'solid', color: MINIMAL_THEME.palette.primary } }))
                const record = await useLibrary.getState().createProject(doc)
                requestOpenProject({ projectId: record.id })
              }}
              className="block w-full"
            >
              <svg viewBox="0 0 100 100" className="mx-auto h-11 w-full text-ink-200">
                <path d={shapePath(shape.id, 100, 100, 8).d} fill="currentColor" />
              </svg>
              <span className="mt-1.5 block truncate text-center text-[10.5px] text-ink-400">{shape.label}</span>
            </button>
            <button
              type="button"
              title="نسخ SVG"
              onClick={async () => {
                const d = shapePath(shape.id, 100, 100, 8).d
                await navigator.clipboard.writeText(`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`)
                setCopied(shape.id)
                setTimeout(() => setCopied(null), 1400)
              }}
              className="mt-1 flex w-full items-center justify-center gap-1 rounded border border-ink-800 py-0.5 text-[10px] text-ink-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-ink-850"
            >
              {copied === shape.id ? <Check size={10} className="text-good" /> : <Copy size={10} />} {copied === shape.id ? 'نُسخ' : 'SVG'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function IconLibrary() {
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('all')
  const icons = useMemo(() => {
    const pool = cat === 'all' ? ICON_CATEGORIES.flatMap((c) => c.icons) : ICON_CATEGORIES.find((c) => c.id === cat)?.icons ?? []
    const q = query.trim().toLowerCase()
    return pool.filter((n) => (q ? n.includes(q) : true)).slice(0, 300)
  }, [cat, query])

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن أيقونة…"
          className="h-8 w-56 rounded-lg border border-ink-800 bg-ink-900 px-2.5 text-[12.5px] outline-none focus:border-ink-600"
        />
        <div className="flex flex-wrap gap-1">
          <Chip active={cat === 'all'} onClick={() => setCat('all')}>
            الكل
          </Chip>
          {ICON_CATEGORIES.map((c) => (
            <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
              {c.label}
            </Chip>
          ))}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-1.5 sm:grid-cols-8 lg:grid-cols-12">
        {icons.map((name) => (
          <button
            key={name}
            type="button"
            title={`${name} — انقر للنسخ والإدراج`}
            onClick={async () => {
              await navigator.clipboard.writeText(iconSvg(name, { size: 24 }))
              toast({ kind: 'success', title: 'نُسخت الأيقونة', body: `${name}.svg — والصقها في أي عنصر SVG داخل المحرر.` })
            }}
            className="grid aspect-square place-items-center rounded-lg border border-ink-800 bg-ink-900/50 p-2 transition-colors hover:border-signal/50 hover:bg-ink-900 [&_svg]:size-[20px]"
            dangerouslySetInnerHTML={{ __html: iconSvg(name, { size: 20, color: '#dcdce2' }) }}
          />
        ))}
      </div>
      {!icons.length ? <p className="p-6 text-center text-[12.5px] text-ink-500">لا نتائج — جرّب كلمة أقصر.</p> : null}
      <p className="mt-3 text-[11.5px] leading-relaxed text-ink-500">
        الأيقونات من lucide (رخصة ISC). داخل المحرر تُدرَج كأ عنصر أيقونة قابل للتلوين والحجم، ويُصدَّر PNG مصحَّح الدقة داخل PPTX.
      </p>
    </div>
  )
}

const BLOCKS: { id: string; label: string; hint: string; build: (t: Theme) => Presentation['slides'][number] }[] = [
  {
    id: 'kpi',
    label: 'صف أرقام (KPI)',
    hint: '٤ إحصاءات بعنوان وسطر شرح',
    build: (t) => {
      const slide = createSlide()
      const values = [['٤٢٪', 'نمو في التحويل'], ['٣.١×', 'سرعة الإنجاز'], ['١٨ يومًا', 'زمن الدورة'], ['٪٩٧', 'رضا الفريق']]
      values.forEach(([value, label], i) => {
        slide.elements.push(createText(t, { role: 'stat', x: 96 + i * 280, y: 240, w: 240, h: 160, content: `<p>${value}</p><p>${label}</p>`, font: { fontSize: 44, bold: true, color: t.palette.text, align: 'start', dir: 'rtl', lineHeight: 1.2, vAlign: 'center' } } as never))
      })
      slide.elements.push(createText(t, { role: 'title', x: 96, y: 96, w: 700, h: 90, content: '<p>مؤشرات هذا الربع</p>' } as never))
      return slide
    },
  },
  {
    id: 'quote',
    label: 'اقتباس',
    hint: 'سطر كبير + مصدر',
    build: (t) => {
      const slide = createSlide()
      slide.elements.push(
        createText(t, {
          role: 'quote',
          x: 140,
          y: 210,
          w: 1000,
          h: 220,
          content: '<p>«لم نكن نحتاج تقريرًا أطول، كنا نحتاج قرارًا أسرع.»</p>',
          font: { fontSize: 40, bold: true, color: t.palette.text, align: 'start', dir: 'rtl', lineHeight: 1.4, vAlign: 'center' },
        } as never),
      )
      slide.elements.push(createText(t, { role: 'footer', x: 140, y: 450, w: 600, h: 50, content: '<p>— مديرة العمليات</p>', font: { fontSize: 18, color: t.palette.textMuted, align: 'start', dir: 'rtl', lineHeight: 1.4, vAlign: 'center' } } as never))
      return slide
    },
  },
  {
    id: 'table',
    label: 'جدول مقارنة',
    hint: 'رأس + ٤ صفوف + شريط تمييز',
    build: (t) => {
      const slide = createSlide()
      slide.elements.push(createText(t, { role: 'title', x: 96, y: 80, w: 700, h: 70, content: '<p>قبل / بعد</p>' } as never))
      slide.elements.push(
        createTable({ theme: t,
          x: 96,
          y: 190,
          w: 1088,
          h: 320,
          header: true,
          cells: [
            [
              { text: 'المؤشر' },
              { text: 'قبل' },
              { text: 'بعد' },
              { text: 'التغيّر' },
            ],
            [{ text: 'زمن التقرير' }, { text: '٦ ساعات' }, { text: '٤٠ دقيقة' }, { text: '‑٨٩٪' }],
            [{ text: 'أخطاء الإدخال' }, { text: '١٢/شهر' }, { text: '٢/شهر' }, { text: '‑٨٣٪' }],
            [{ text: 'رضا الفريق' }, { text: '٦.٤' }, { text: '٨.٧' }, { text: '+٢.٣' }],
          ],
        } as never),
      )
      return slide
    },
  },
  {
    id: 'chart',
    label: 'مخطط أعمدة',
    hint: 'بياناته قابلة للتحرير ومصدَّرة كمخطط PPTX',
    build: (t) => {
      const slide = createSlide()
      slide.elements.push(createText(t, { role: 'title', x: 96, y: 80, w: 700, h: 70, content: '<p>الإيراد حسب الربع</p>' } as never))
      slide.elements.push(
        createChart({ theme: t,
          x: 96,
          y: 180,
          w: 1088,
          h: 420,
          chart: 'bar',
          categories: ['الأول', 'الثاني', 'الثالث', 'الرابع'],
          series: [{ name: 'الإيراد', values: [32, 48, 41, 66] }],
          axis: true,
          values: true,
        } as never),
      )
      return slide
    },
  },
]

function BlockLibrary({ theme }: { theme: Theme }) {
  const library = useLibrary()
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {BLOCKS.map((block) => {
        const doc = createPresentation({ title: block.label, theme })
        doc.slides = [block.build(theme)]
        return (
          <article key={block.id} className="overflow-hidden rounded-xl border border-ink-800 bg-ink-900/50 transition-colors hover:border-ink-600">
            <SlidePreview doc={doc} index={0} />
            <div className="flex items-center gap-2 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-ink-50">{block.label}</p>
                <p className="mt-0.5 truncate text-[11px] text-ink-500">{block.hint}</p>
              </div>
              <Button
                size="sm"
                variant="subtle"
                onClick={async () => {
                  const record = await library.createProject(doc)
                  requestOpenProject({ projectId: record.id })
                  toast({ kind: 'success', title: `فُتح مكوّن ${block.label}`, body: 'كل عنصر قابل للتحريك والتنسيق والتصدير.' })
                }}
              >
                فتح في محرر
              </Button>
            </div>
          </article>
        )
      })}
    </div>
  )
}

function LayoutLibrary({ theme }: { theme: Theme }) {
  const [preview, setPreview] = useState(LAYOUTS[0]?.id ?? '')
  const layout = LAYOUTS.find((l) => l.id === preview) ?? LAYOUTS[0]
  const doc = useMemo(() => {
    const d = createPresentation({ title: layout?.name ?? 'تخطيط', theme })
    if (layout) {
      const built = layout.build(theme)
      d.slides = [{ ...createSlide(), elements: built.elements, background: built.background ?? d.slides[0].background }]
    }
    return d
  }, [layout, theme])

  if (!layout) return null
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
      <div className="panel-x grid max-h-[420px] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
        {LAYOUTS.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => setPreview(l.id)}
            className={cn('rounded-lg border p-2 text-start transition-colors', l.id === preview ? 'border-signal bg-signal/8' : 'border-ink-800 hover:border-ink-600')}
          >
            <span className="block truncate text-[12px] font-medium text-ink-100">{l.name}</span>
            <span className="mt-0.5 block truncate text-[10.5px] text-ink-500">{l.roles.length} أدوار</span>
          </button>
        ))}
      </div>
      <div>
        <SlidePreview doc={doc} index={0} className="rounded-lg border border-ink-800" />
        <p className="mt-2 text-[11.5px] leading-relaxed text-ink-400">{layout.hint}</p>
        <Button
          size="sm"
          variant="surface"
          className="mt-2 w-full"
          onClick={async () => {
            const record = await useLibrary.getState().createProject(doc)
            requestOpenProject({ projectId: record.id })
            toast({ kind: 'success', title: `فُتح تخطيط ${layout.name}`, body: 'بدّل التخطيط من لوحة التصميم لتجربة غيره دون فقدان المحتوى.' })
          }}
        >
          فتح هذا التخطيط
        </Button>
      </div>
    </div>
  )
}

export function ElementsPage() {
  return (
    <div className="min-h-full bg-ink-950 p-6 text-ink-50">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-[22px] font-semibold tracking-tight">مكتبة العناصر</h1>
        <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-ink-400">
          أشكال، أيقونات، مكوّنات وتخطيطات — كلها عناصر حقيقية في نموذج المستند. اضغط أي عنصر ليفتح في عرض قابل للتحرير.
        </p>
        <div className="mt-6">
          <ElementsPane />
        </div>
      </div>
    </div>
  )
}
