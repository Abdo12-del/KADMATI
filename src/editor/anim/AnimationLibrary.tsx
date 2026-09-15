/**
 * AnimationLibrary — the organised, searchable effect browser shared by the
 * Right Panel ("حركة" tab) and the Animation Studio dock.
 *
 * Every entry applies a REAL spec through the engine and immediately previews
 * it on the canvas. Entries with multiple targets offer Same / Simultaneous /
 * Sequence / Stagger modes.
 */
import { useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Circle,
  CircleDashed,
  Clapperboard,
  Droplet,
  Droplets,
  Heart,
  Layers,
  MousePointerClick,
  PenLine,
  Repeat,
  RotateCcw,
  RotateCw,
  Route,
  Scan,
  Search,
  Shuffle,
  Sparkles,
  Spline,
  Split,
  Square,
  Star,
  Timer,
  TrendingDown,
  TrendingUp,
  Type,
  Wand2,
  Waves,
  Wind,
  Zap,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ANIMATION_BUNDLES, PRESET_GROUPS, presetById, type PresetDef } from '../../animation/presets'
import { cn } from '../../lib/cn'
import { toast } from '../../store/useUI'
import { useCurrentSlide, useDoc } from '../../store/useDoc'
import { previewOnCanvas } from './preview'
import { applyBundle, applyPreset, enableMorph, type MultiMode } from './library'

type Tab = 'presets' | 'entrance' | 'exit' | 'emphasis' | 'reveal' | 'advanced'

const TABS: { id: Tab; label: string }[] = [
  { id: 'presets', label: 'Presets' },
  { id: 'entrance', label: 'Entrance' },
  { id: 'exit', label: 'Exit' },
  { id: 'emphasis', label: 'Emphasis' },
  { id: 'reveal', label: 'Reveal' },
  { id: 'advanced', label: 'Advanced' },
]

const ICONS: Record<string, LucideIcon> = {
  'fade-in': Sparkles,
  'fade-out': Sparkles,
  'slide-in-left': ArrowRight,
  'slide-in-right': ArrowLeft,
  'slide-in-top': ArrowDown,
  'slide-in-bottom': ArrowUp,
  'slide-out-left': ArrowLeft,
  'slide-out-right': ArrowRight,
  'slide-out-top': ArrowUp,
  'slide-out-bottom': ArrowDown,
  'zoom-in': ZoomIn,
  'zoom-out-in': ZoomOut,
  'zoom-out': ZoomOut,
  'scale-in': TrendingUp,
  'scale-out': TrendingDown,
  'bounce-in': ArrowUp,
  'rotate-in': RotateCcw,
  'rotate-out': RotateCw,
  'rotate-emphasis': RotateCw,
  'blur-in': Droplets,
  'blur-out': Droplet,
  rise: TrendingUp,
  typewriter: Type,
  drop: ArrowDown,
  pulse: Zap,
  bounce: TrendingUp,
  shake: Wind,
  swing: RotateCw,
  float: Waves,
  grow: TrendingUp,
  shrink: TrendingDown,
  glow: Sparkles,
  flash: Zap,
  tada: Star,
  wobble: Wind,
  heartbeat: Heart,
  'reveal-right': Scan,
  'reveal-left': Scan,
  'reveal-down': Scan,
  'reveal-up': Scan,
  'mask-reveal': Circle,
  'text-reveal': Split,
  'path-bezier': Spline,
  'path-circle': CircleDashed,
  'path-custom': PenLine,
}

const KIND_TINT: Record<string, string> = {
  entrance: 'text-emerald-300 bg-emerald-500/10',
  exit: 'text-rose-300 bg-rose-500/10',
  emphasis: 'text-amber-300 bg-amber-500/10',
  reveal: 'text-sky-300 bg-sky-500/10',
  motion: 'text-violet-300 bg-violet-500/10',
}

export function AnimationLibrary({ targets, onApplied, className, autoPreview = true }: { targets: string[]; onApplied?: () => void; className?: string; autoPreview?: boolean }) {
  const slide = useCurrentSlide()
  const [tab, setTab] = useState<Tab>('presets')
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<MultiMode>('same')
  const [step, setStep] = useState(120)
  const docSlide = useDoc((s) => s.doc.slides[s.slideIndex])

  const multi = targets.length > 1
  const freshSlide = () => useDoc.getState().doc.slides.find((s) => s.id === slide?.id) ?? docSlide

  const runPreview = () => {
    const s = freshSlide()
    if (s) previewOnCanvas(s)
  }

  const apply = (presetId: string) => {
    if (!targets.length || !slide) {
      toast({ kind: 'error', title: 'حدد عنصرًا أولًا', body: 'اختر عنصرًا واحدًا أو أكثر على الشريحة ثم طبّق الحركة.' })
      return
    }
    const res = applyPreset(presetId, targets, multi ? mode : 'same', step)
    if (res.count) {
      toast({ kind: 'success', title: 'طُبّقت الحركة', body: `${presetById(presetId)?.label ?? presetId} — ${res.count} عنصر` })
      if (autoPreview) requestAnimationFrame(runPreview)
      onApplied?.()
    }
  }

  const applyBundleClick = (bundleId: string, label: string) => {
    if (!targets.length || !slide) {
      toast({ kind: 'error', title: 'حدد عنصرًا أولًا' })
      return
    }
    const res = applyBundle(bundleId, targets, multi ? mode : 'same', step)
    if (res.count) {
      toast({ kind: 'success', title: `حزمة ${label}`, body: `${res.count} عنصر` })
      if (autoPreview) requestAnimationFrame(runPreview)
      onApplied?.()
    }
  }

  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    const group = PRESET_GROUPS.find((g) => g.id === tab)
    if (!group) return []
    if (!q) return group.items
    return group.items.filter((p) => p.label.toLowerCase().includes(q) || (p.kw ?? '').toLowerCase().includes(q) || p.id.includes(q))
  }, [tab, query])

  return (
    <div className={cn('space-y-2.5', className)} dir="rtl">
      {/* search */}
      <div className="relative">
        <Search size={12.5} className="absolute end-2.5 top-1/2 -translate-y-1/2 text-ink-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث: fade, slide, zoom, rotate…"
          className="w-full rounded-lg border border-ink-700 bg-ink-950 py-1.5 pe-8 ps-3 text-[12px] text-ink-100 outline-none placeholder:text-ink-600 focus:border-signal/60"
        />
      </div>

      {/* tabs */}
      <div className="flex flex-wrap gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn('rounded-md px-2 py-1 text-[11px] font-semibold transition-colors', tab === t.id ? 'bg-signal-dim text-signal-soft' : 'text-ink-400 hover:bg-ink-800')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* multi-selection modes */}
      {multi ? (
        <div className="rounded-lg border border-ink-750 bg-ink-900/60 p-2">
          <p className="mb-1.5 text-[10.5px] font-semibold text-ink-300">
            {targets.length} عناصر محددة — طريقة التطبيق
          </p>
          <div className="grid grid-cols-2 gap-1">
            {(
              [
                ['same', 'نفس الحركة'],
                ['simultaneous', 'متزامنة'],
                ['sequence', 'متسلسلة'],
                ['stagger', 'Stagger'],
              ] as [MultiMode, string][]
            ).map(([m, label]) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn('rounded-md px-2 py-1 text-[11px]', mode === m ? 'bg-signal/20 text-signal-soft ring-1 ring-signal/40' : 'bg-ink-800 text-ink-300 hover:bg-ink-750')}
              >
                {label}
              </button>
            ))}
          </div>
          {mode === 'stagger' ? (
            <label className="mt-2 flex items-center gap-2 text-[10.5px] text-ink-400">
              الفارق الزمني
              <input type="range" min={30} max={500} step={10} value={step} onChange={(e) => setStep(Number(e.target.value))} className="flex-1 accent-signal" />
              <span className="w-12 font-mono text-end text-ink-200">{step}ms</span>
            </label>
          ) : null}
        </div>
      ) : null}

      {/* presets (bundles) */}
      {tab === 'presets' ? (
        <div className="grid grid-cols-2 gap-1.5">
          {ANIMATION_BUNDLES.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => applyBundleClick(b.id, b.label)}
              className="group rounded-xl border border-ink-700 bg-gradient-to-br from-ink-850 to-ink-900 p-2.5 text-start transition-all hover:border-signal/50 hover:from-ink-800"
            >
              <Wand2 size={15} className="mb-1.5 text-signal" />
              <p className="text-[12px] font-bold text-ink-100">{b.label}</p>
              <p className="text-[10px] text-ink-400" dir="ltr">{b.description}</p>
            </button>
          ))}
        </div>
      ) : tab === 'advanced' ? (
        <div className="space-y-1.5">
          <p className="text-[10.5px] font-bold tracking-wide text-ink-500">مسارات الحركة (Motion Paths)</p>
          {(['path-bezier', 'path-circle', 'path-custom'] as const).map((id) => (
            <LibraryItem key={id} def={presetById(id)!} onPick={() => apply(id)} />
          ))}
          <p className="pt-2 text-[10.5px] font-bold tracking-wide text-ink-500">انتقالات ومتعدد العناصر</p>
          <button
            type="button"
            onClick={() => {
              if (enableMorph()) {
                toast({ kind: 'success', title: 'فُعّل Morph', body: 'ستتعرف العناصر المتطابقة تلقائيًا عند الانتقال للشريحة التالية (نفس المعرف/الاسم).' })
                onApplied?.()
              }
            }}
            className="flex w-full items-center gap-2.5 rounded-lg border border-ink-700 px-2.5 py-2 text-start hover:bg-ink-800"
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-fuchsia-500/10 text-fuchsia-300"><Shuffle size={13} /></span>
            <span>
              <span className="block text-[12px] font-semibold text-ink-100">Morph بين الشرائح</span>
              <span className="block text-[10px] text-ink-400">يطابق العناصر ويحرّكها من مواضعها السابقة</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('stagger')
              if (multi) apply('fade-in')
              else toast({ kind: 'info', title: 'Stagger لمجموعة عناصر', body: 'حدد عدة عناصر أولًا (اسحب Marquee أو Shift+نقر)، ثم اختر Stagger وأي حركة.' })
            }}
            className="flex w-full items-center gap-2.5 rounded-lg border border-ink-700 px-2.5 py-2 text-start hover:bg-ink-800"
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-indigo-500/10 text-indigo-300"><Layers size={13} /></span>
            <span>
              <span className="block text-[12px] font-semibold text-ink-100">Stagger على التحديد</span>
              <span className="block text-[10px] text-ink-400">تتابع الحركة بين عناصر التحديد بفارق زمني</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (!multi) toast({ kind: 'info', title: 'التشغيل بالنقر', body: 'في المفتش: البداية = عند النقر — لتشغيل الحركات واحدًا تلو الآخر أثناء العرض.' })
            }}
            className="flex w-full items-center gap-2.5 rounded-lg border border-ink-700 px-2.5 py-2 text-start hover:bg-ink-800"
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-emerald-500/10 text-emerald-300"><MousePointerClick size={13} /></span>
            <span>
              <span className="block text-[12px] font-semibold text-ink-100">تشغيل بالنقر (Click Sequence)</span>
              <span className="block text-[10px] text-ink-400">من إعدادات الحركة: البداية = عند النقر</span>
            </span>
          </button>
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-ink-700 px-2.5 py-2 text-ink-400">
            <Clapperboard size={13} className="shrink-0" />
            <span className="text-[10px] leading-relaxed">التسلسل الكامل والـ Timeline والمفاتيح في استوديو الحركة (زر «الحركة» بالأعلى).</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1.5">
          {items.map((p) => (
            <LibraryItem key={p.id} def={p} onPick={() => apply(p.id)} />
          ))}
          {!items.length ? <p className="col-span-2 py-3 text-center text-[11px] text-ink-500">لا نتائج لـ «{query}»</p> : null}
        </div>
      )}

      <p className="flex items-center gap-1.5 border-t border-ink-800 pt-2 text-[10px] text-ink-500">
        <Repeat size={10} /> المعاينة فورية على اللوحة — والإعدادات الكاملة في استوديو الحركة.
        <button type="button" onClick={runPreview} className="ms-auto text-ink-300 underline decoration-dotted hover:text-signal-soft">
          <Timer size={10} className="me-0.5 inline" />إعادة المعاينة
        </button>
      </p>
    </div>
  )
}

function LibraryItem({ def, onPick }: { def: PresetDef; onPick: () => void }) {
  const Icon = ICONS[def.id] ?? (def.kind === 'motion' ? Route : Square)
  return (
    <button
      type="button"
      onClick={onPick}
      className="group flex items-center gap-2 rounded-lg border border-ink-750 bg-ink-900/50 px-2 py-1.5 text-start transition-all hover:border-signal/40 hover:bg-ink-800"
      title={def.label}
    >
      <span className={cn('grid size-7 shrink-0 place-items-center rounded-md', KIND_TINT[def.kind] ?? 'text-ink-300 bg-ink-800')}>
        <Icon size={13} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[11px] font-semibold text-ink-100">{def.label.replace(/\s*\([^)]*\)/g, '')}</span>
        <span className="block text-[9.5px] text-ink-500">{def.kind}</span>
      </span>
    </button>
  )
}
