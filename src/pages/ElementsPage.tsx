/**
 * Elements library — the building blocks a deck is made of. Nothing here is a static gallery: every
 * tile inserts real model elements into a scratch deck (one reused project, so browsing cannot flood
 * the library) and opens it in the editor, where they can be moved, restyled and exported.
 */
import { useMemo, useState } from 'react'
import { Check, Copy, Plus } from 'lucide-react'
import { Button, Chip, Row, Segmented } from '../components/ui'
import { SHAPE_LIBRARY, shapePath } from '../document/shapes'
import { ICON_CATEGORIES, iconSvg } from '../lib/iconLibrary'
import { LAYOUTS } from '../templates/layouts'
import { SlidePreview } from '../components/SlidePreview'
import {
  MINIMAL_THEME,
  createChart,
  createIcon,
  createPresentation,
  createShape,
  createSlide,
  createSvg,
  createTable,
  createText,
} from '../document/factory'
import { useLibrary } from '../store/useLibrary'
import { requestOpenProject } from '../services/openDeck'
import { toast } from '../store/useUI'
import { cn } from '../lib/cn'
import type { AnyElement, Background, Presentation, Slide, Theme } from '../document/types'

type Kind = 'shapes' | 'icons' | 'svg' | 'blocks' | 'layouts'
type Built = { elements: AnyElement[]; background?: Background }

const SCRATCH_TITLE = 'مكتبة العناصر — مسودة'

/**
 * Reuses a single "scratch" project so clicking twenty shapes creates one deck, not twenty. The
 * element arrives as normal model data — movable, restylable, exportable.
 */
async function openInScratchDeck(make: (theme: Theme) => Built, note: string) {
  const lib = useLibrary.getState()
  const theme = lib.projects.find((p) => !p.trashedAt)?.doc.theme ?? MINIMAL_THEME
  const existing = lib.projects.find((p) => !p.trashedAt && p.doc.metadata.title === SCRATCH_TITLE)
  const base = existing?.doc ?? createPresentation({ title: SCRATCH_TITLE, theme })
  const built = make(theme)
  const slide: Slide = { ...createSlide(), elements: built.elements, ...(built.background ? { background: built.background } : {}) }
  const doc: Presentation = {
    ...base,
    slides: [slide],
    metadata: { ...base.metadata, title: SCRATCH_TITLE, updatedAt: Date.now() },
  }
  const id = existing ? await lib.saveProject({ ...existing, doc, updatedAt: Date.now() }).then(() => existing.id) : (await lib.createProject(doc)).id
  requestOpenProject({ projectId: id })
  toast({ kind: 'success', title: 'فُتح في المحرر', body: note })
}

function docFor(built: Built, theme: Theme): Presentation {
  const base = createPresentation({ title: 'معاينة', theme })
  const slide: Slide = { ...createSlide(), elements: built.elements, ...(built.background ? { background: built.background } : {}) }
  return { ...base, slides: [slide] }
}

export function ElementsPane() {
  const [kind, setKind] = useState<Kind>('blocks')
  return (
    <section>
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          value={kind}
          onChange={(v) => setKind(v as Kind)}
          options={[
            { value: 'shapes', label: 'أشكال' },
            { value: 'icons', label: 'أيقونات' },
            { value: 'svg', label: 'SVG' },
            { value: 'blocks', label: 'مكوّنات' },
            { value: 'layouts', label: 'تخطيطات' },
          ]}
        />
        <p className="text-[11.5px] text-ink-500">كل عنصر يُدرَج في مسودة حقيقية تفتح في المحرر — لا معرض صور.</p>
      </div>
      <div className="mt-4">
        {kind === 'shapes' ? <ShapeLibrary /> : null}
        {kind === 'icons' ? <IconLibrary /> : null}
        {kind === 'svg' ? <SvgLibrary /> : null}
        {kind === 'blocks' ? <BlockLibrary /> : null}
        {kind === 'layouts' ? <LayoutLibrary /> : null}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ shapes */

function ShapeLibrary() {
  const [copied, setCopied] = useState<string | null>(null)
  const gallery = (t: Theme): Built => {
    const elements: AnyElement[] = [createText(t, { role: 'title', x: 96, y: 72, w: 700, h: 76, html: '<p>معرض الأشكال</p>' })]
    SHAPE_LIBRARY.slice(0, 12).forEach((shape, i) => {
      const palette = [t.palette.primary, t.palette.secondary, t.palette.accent]
      elements.push(
        createShape(t, {
          shape: shape.id,
          x: 96 + (i % 4) * 280,
          y: 190 + Math.floor(i / 4) * 170,
          w: 210,
          h: 130,
          fill: { type: 'solid', color: palette[i % palette.length] },
          radius: [t.radius, t.radius, t.radius, t.radius],
        }),
      )
    })
    return { elements }
  }

  return (
    <div>
      <Row className="mb-3 justify-between">
        <p className="text-[12.5px] text-ink-400">{SHAPE_LIBRARY.length} شكلًا بمسارات SVG مقابلة في PPTX (لا صور)</p>
        <Button size="sm" variant="surface" onClick={() => void openInScratchDeck(gallery, 'فُتح معرض الأشكال: تعبئة وحدّ وظل قابلة للتحرير.')}>
          <Plus size={12} /> فتح الكل في عرض
        </Button>
      </Row>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-8">
        {SHAPE_LIBRARY.map((shape) => (
          <div key={shape.id} className="group rounded-lg border border-ink-800 bg-ink-900/50 p-2 transition-colors hover:border-ink-600">
            <button
              type="button"
              title={`أدرج «${shape.label}» في المسودة`}
              onClick={() =>
                void openInScratchDeck(
                  (t) => ({
                    elements: [
                      createShape(t, { shape: shape.id, x: 340, y: 180, w: 600, h: 360, fill: { type: 'solid', color: t.palette.primary } }),
                      createText(t, { role: 'kicker', x: 340, y: 560, w: 600, h: 40, html: `<p>${shape.label}</p>` }),
                    ],
                  }),
                  `أُدرج «${shape.label}» في المسودة.`,
                )
              }
              className="block w-full"
            >
              <svg viewBox="0 0 100 100" className="mx-auto h-11 w-full text-ink-200">
                <path d={shapePath(shape.id, 100, 100, 8).d} fill="currentColor" />
              </svg>
              <span className="mt-1.5 block truncate text-center text-[10.5px] text-ink-400">{shape.label}</span>
            </button>
            <button
              type="button"
              title="نسخ مسار SVG"
              onClick={async () => {
                const d = shapePath(shape.id, 100, 100, 8).d
                try {
                  await navigator.clipboard.writeText(`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`)
                  setCopied(shape.id)
                  setTimeout(() => setCopied(null), 1400)
                } catch {
                  toast({ kind: 'error', title: 'المتصفح منع الحافظة', body: 'استخدم الإدراج في المسودة بدل النسخ.' })
                }
              }}
              className="mt-1 flex w-full items-center justify-center gap-1 rounded border border-ink-800 py-0.5 text-[10px] text-ink-400 transition-colors hover:bg-ink-850"
            >
              {copied === shape.id ? <Check size={10} className="text-good" /> : <Copy size={10} />} {copied === shape.id ? 'نُسخ' : 'SVG'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ icons */

function IconLibrary() {
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('all')
  const icons = useMemo(() => {
    const pool = cat === 'all' ? ICON_CATEGORIES.flatMap((c) => c.icons) : (ICON_CATEGORIES.find((c) => c.id === cat)?.icons ?? [])
    const q = query.trim().toLowerCase()
    return pool.filter((name) => (q ? name.includes(q) : true)).slice(0, 300)
  }, [cat, query])

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن أيقونة…"
          className="h-8 w-56 rounded-lg border border-ink-800 bg-ink-900 px-2.5 text-[12.5px] outline-none transition-colors focus:border-ink-600"
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
          <div key={name} className="group relative">
            <button
              type="button"
              title={`${name} — اضغط للإدراج في المسودة`}
              onClick={() =>
                void openInScratchDeck(
                  (t) => ({
                    elements: [
                      createIcon({
                        icon: name,
                        x: 560,
                        y: 280,
                        w: 160,
                        h: 160,
                        color: t.palette.primary,
                        background: { type: 'solid', color: t.palette.surface },
                        radius: [36, 36, 36, 36],
                      }),
                    ],
                  }),
                  `أُدرجت الأيقونة «${name}» — لونها وحجمها قابلان للتحرير.`,
                )
              }
              className="grid aspect-square w-full place-items-center rounded-lg border border-ink-800 bg-ink-900/50 p-2 transition-colors hover:border-signal/50 hover:bg-ink-900 [&_svg]:size-[20px]"
              dangerouslySetInnerHTML={{ __html: iconSvg(name, { size: 20, color: '#dcdce2' }) }}
            />
            <button
              type="button"
              title="نسخ SVG"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(iconSvg(name, { size: 24 }))
                  toast({ kind: 'success', title: 'نُسخت الأيقونة', body: `${name}.svg جاهزة للصق في عنصر SVG.` })
                } catch {
                  toast({ kind: 'error', title: 'المتصفح منع الحافظة' })
                }
              }}
              className="absolute end-1 top-1 grid size-5 place-items-center rounded bg-ink-850/90 text-ink-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-ink-50"
            >
              <Copy size={10} />
            </button>
          </div>
        ))}
      </div>
      {!icons.length ? <p className="p-6 text-center text-[12.5px] text-ink-500">لا نتائج — جرّب كلمة أقصر.</p> : null}
      <p className="mt-3 text-[11.5px] leading-relaxed text-ink-500">
        الأيقونات من lucide (رخصة ISC). تُدرَج كعنصر أيقونة قابل للتلوين والحجم، وتُصدَّر PNG بدقة مضاعفة داخل PPTX لأن OOXML لا
        يحمل SVG بشكل مضمون.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ svg art */

const SVG_ART: { id: string; label: string; markup: (t: Theme) => string }[] = [
  {
    id: 'arabesque',
    label: 'زخرفة هندسية',
    markup: (t) =>
      `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="${t.palette.accent}" stroke-width="2"><path d="M60 6 114 60 60 114 6 60Z"/><path d="M60 24 96 60 60 96 24 60Z"/><path d="M60 42 78 60 60 78 42 60Z"/><circle cx="60" cy="60" r="6" fill="${t.palette.primary}" stroke="none"/></svg>`,
  },
  {
    id: 'growth',
    label: 'منحنى نمو',
    markup: (t) =>
      `<svg viewBox="0 0 240 120" xmlns="http://www.w3.org/2000/svg" fill="none"><path d="M8 104c40 0 56-28 88-44s64-40 136-48" stroke="${t.palette.primary}" stroke-width="4" stroke-linecap="round"/><path d="M8 112h224" stroke="${t.palette.textMuted}" stroke-width="2"/><circle cx="232" cy="12" r="7" fill="${t.palette.accent}"/></svg>`,
  },
  {
    id: 'nodes',
    label: 'شبكة عُقد',
    markup: (t) =>
      `<svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg"><g stroke="${t.palette.secondary}" stroke-width="2"><path d="M100 70 30 30M100 70 170 34M100 70 40 116M100 70 164 110"/></g><g fill="${t.palette.primary}"><circle cx="100" cy="70" r="14"/><circle cx="30" cy="30" r="9"/><circle cx="170" cy="34" r="9"/><circle cx="40" cy="116" r="9"/><circle cx="164" cy="110" r="9"/></g><circle cx="100" cy="70" r="5" fill="${t.palette.accent}"/></svg>`,
  },
  {
    id: 'layers',
    label: 'طبقات متراكبة',
    markup: (t) =>
      `<svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg"><g fill="${t.palette.surface}" stroke="${t.palette.primary}" stroke-width="2"><path d="M100 22 176 60 100 98 24 60Z"/><path d="M100 48 176 86 100 124 24 86Z" opacity=".8"/><path d="M100 74 176 112 100 150 24 112Z" opacity=".6"/></g></svg>`,
  },
]

function SvgLibrary() {
  return (
    <div>
      <p className="text-[12.5px] leading-relaxed text-ink-400">
        رسومات SVG مكتوبة داخل الكود — تُدرَج كعنصر SVG قابل للتلوين والتغيير، وتُبسَّط إلى صورة عند التصدير فقط إن لم يستطع
        PPTX حملها.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SVG_ART.map((art) => (
          <button
            key={art.id}
            type="button"
            onClick={() =>
              void openInScratchDeck((t) => ({ elements: [createSvg({ markup: art.markup(t), x: 440, y: 220, w: 400, h: 280 })] }), `أُدرجت «${art.label}» كعنصر SVG.`)
            }
            className="rounded-xl border border-ink-800 bg-ink-900/50 p-3 text-start transition-colors hover:border-signal/50"
          >
            <div className="grid h-24 place-items-center [&_svg]:max-h-24 [&_svg]:w-auto" dangerouslySetInnerHTML={{ __html: art.markup(MINIMAL_THEME) }} />
            <span className="mt-2 block text-[12px] font-medium text-ink-100">{art.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ blocks */

type BlockDef = { id: string; label: string; hint: string; build: (t: Theme) => Built }

const BLOCKS: BlockDef[] = [
  {
    id: 'kpi',
    label: 'صف أرقام (KPI)',
    hint: '٤ إحصاءات بعنوان وسطر شرح',
    build: (t) => {
      const elements: AnyElement[] = [createText(t, { role: 'title', x: 96, y: 96, w: 700, h: 90, html: '<p>مؤشرات هذا الربع</p>' })]
      const values: [string, string][] = [
        ['٤٢٪', 'نمو في التحويل'],
        ['٣.١×', 'سرعة الإنجاز'],
        ['١٨ يومًا', 'زمن الدورة'],
        ['٩٧٪', 'رضا الفريق'],
      ]
      values.forEach(([value, label], i) => {
        elements.push(
          createText(t, {
            role: 'stat',
            x: 96 + i * 280,
            y: 240,
            w: 240,
            h: 160,
            html: `<p>${value}</p><p>${label}</p>`,
            style: { fontSize: 44, bold: true, color: t.palette.text, align: 'center', dir: 'rtl', lineHeight: 1.2, vAlign: 'center' },
          }),
        )
      })
      return { elements }
    },
  },
  {
    id: 'quote',
    label: 'اقتباس',
    hint: 'سطر كبير + مصدر',
    build: (t) => ({
      elements: [
        createText(t, {
          role: 'quote',
          x: 140,
          y: 210,
          w: 1000,
          h: 220,
          html: '<p>«لم نكن نحتاج تقريرًا أطول، كنا نحتاج قرارًا أسرع.»</p>',
          style: { fontSize: 40, bold: true, color: t.palette.text, align: 'start', dir: 'rtl', lineHeight: 1.4, vAlign: 'center' },
        }),
        createText(t, {
          role: 'footer',
          x: 140,
          y: 450,
          w: 600,
          h: 50,
          html: '<p>— مديرة العمليات</p>',
          style: { fontSize: 18, color: t.palette.textMuted, align: 'start', dir: 'rtl', vAlign: 'center' },
        }),
      ],
    }),
  },
  {
    id: 'table',
    label: 'جدول مقارنة',
    hint: 'رأس + ٣ صفوف + تمييز',
    build: (t) => ({
      elements: [
        createText(t, { role: 'title', x: 96, y: 80, w: 700, h: 70, html: '<p>قبل / بعد</p>' }),
        createTable({
          theme: t,
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
            [
              { text: 'زمن التقرير' },
              { text: '٦ ساعات' },
              { text: '٤٠ دقيقة' },
              { text: '-٨٩٪' },
            ],
            [
              { text: 'أخطاء الإدخال' },
              { text: '١٢/شهر' },
              { text: '٢/شهر' },
              { text: '-٨٣٪' },
            ],
            [
              { text: 'رضا الفريق' },
              { text: '٦.٤' },
              { text: '٨.٧' },
              { text: '+٢.٣' },
            ],
          ],
        }),
      ],
    }),
  },
  {
    id: 'chart',
    label: 'مخطط أعمدة',
    hint: 'بياناته قابلة للتحرير ومصدَّرة كمخطط PPTX حقيقي',
    build: (t) => {
      const chart = createChart({
        theme: t,
        x: 96,
        y: 180,
        w: 1088,
        h: 420,
        chart: 'bar',
        categories: ['الأول', 'الثاني', 'الثالث', 'الرابع'],
        series: [{ name: 'الإيراد', values: [32, 48, 41, 66] }],
      })
      chart.axis = true
      chart.values = true
      chart.legend = false
      return { elements: [createText(t, { role: 'title', x: 96, y: 80, w: 700, h: 70, html: '<p>الإيراد حسب الربع</p>' }), chart] }
    },
  },
]

function BlockLibrary() {
  const theme = useLibrary((s) => s.projects[0]?.doc.theme) ?? MINIMAL_THEME
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {BLOCKS.map((block) => (
        <article key={block.id} className="overflow-hidden rounded-xl border border-ink-800 bg-ink-900/50 transition-colors hover:border-ink-600">
          <SlidePreview doc={docFor(block.build(theme), theme)} index={0} />
          <div className="flex items-center gap-2 px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-ink-50">{block.label}</p>
              <p className="mt-0.5 truncate text-[11px] text-ink-500">{block.hint}</p>
            </div>
            <Button size="sm" variant="subtle" onClick={() => void openInScratchDeck(block.build, `أُدرج مكوّن «${block.label}» — جدولُه/مخطَّطُه حقيقيان لا صورة.`)}>
              إدراج وفتح
            </Button>
          </div>
        </article>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ layouts */

function LayoutLibrary() {
  const theme = useLibrary((s) => s.projects[0]?.doc.theme) ?? MINIMAL_THEME
  const [preview, setPreview] = useState(LAYOUTS[0]?.id ?? '')
  const layout = LAYOUTS.find((l) => l.id === preview) ?? LAYOUTS[0]
  const doc = useMemo(() => (layout ? docFor(layout.build(theme), theme) : null), [layout, theme])

  if (!layout || !doc) return null
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
        <Button size="sm" variant="surface" className="mt-2 w-full" onClick={() => void openInScratchDeck(layout.build, `فُتح تخطيط «${layout.name}» — بدّلْه من لوحة التصميم دون فقدان المحتوى.`)}>
          إدراج التخطيط وفتحه
        </Button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ page */

export function ElementsPage() {
  return (
    <div className="min-h-full bg-ink-950 p-6 text-ink-50">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-[22px] font-semibold tracking-tight">مكتبة العناصر</h1>
        <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-ink-400">
          أشكال، أيقونات، رسومات SVG، مكوّنات وتخطيطات — كلها عناصر في نموذج المستند نفسه. اضغط أي عنصر ليفتح في مسودة قابلة
          للتحرير.
        </p>
        <div className="mt-6">
          <ElementsPane />
        </div>
      </div>
    </div>
  )
}
