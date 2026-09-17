/**
 * Zoom target picker — "Zoom to Slide" in one dialog:
 *  1. pick the target slide (live thumbnails, never placeholders),
 *  2. large preview of the target,
 *  3. zoom settings (transition / duration / easing / origin / return / effects),
 *  4. save → one undoable step for the whole selection (group-aware).
 *
 * Mounted once by RightPanel; opened from the inspector, the selection badge,
 * the navigation map or AI suggestions via `useUI.openZoomPicker(elementIds)`.
 */
import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, X, ZoomIn } from 'lucide-react'
import { SlideView } from '../../render/SlideView'
import { useDoc } from '../../store/useDoc'
import { useUI } from '../../store/useUI'
import {
  createZoomLink,
  slideLabel,
  triggerGroup,
  ZOOM_DURATIONS,
  ZOOM_DURATION_MAX,
  ZOOM_DURATION_MIN,
  ZOOM_EASINGS,
  ZOOM_ORIGINS,
  ZOOM_TRANSITIONS,
  type ZoomEasing,
  type ZoomLink,
  type ZoomOrigin,
  type ZoomTransition,
} from '../../document/zoom'
import { Button, Section, Segmented, Select, Switch } from '../../components/ui'
import { cn } from '../../lib/cn'

export function ZoomPickerHost() {
  const picker = useUI((s) => s.zoomPicker)
  if (!picker) return null
  return <ZoomPicker key={picker.elementIds.join(',')} elementIds={picker.elementIds} />
}

function ZoomPicker({ elementIds }: { elementIds: string[] }) {
  const doc = useDoc((s) => s.doc)
  const slideIndex = useDoc((s) => s.slideIndex)
  const close = useUI((s) => s.closeZoomPicker)
  const slide = doc.slides[slideIndex]
  const elements = useMemo(
    () => elementIds.map((id) => slide?.elements.find((e) => e.id === id)).filter((e) => e !== undefined),
    [elementIds, slide],
  )

  // prefill from the shared link when the whole selection already zooms alike
  const shared = useMemo(() => {
    const links = elements.map((e) => e.zoom).filter((z) => z !== undefined)
    if (!links.length || links.length !== elements.length) return null
    const [first] = links
    const same = links.every(
      (z) =>
        z.target.kind === first.target.kind &&
        (z.target.kind !== 'slide' || (first.target.kind === 'slide' && z.target.slideId === first.target.slideId)) &&
        z.transition === first.transition &&
        z.duration === first.duration &&
        z.easing === first.easing &&
        z.origin === first.origin &&
        z.returnToSource === first.returnToSource,
    )
    return same ? first : null
  }, [elements])

  const initialTarget =
    shared?.target.kind === 'slide' ? shared.target.slideId : (doc.slides.find((s) => s.id !== slide?.id)?.id ?? '')
  const [targetId, setTargetId] = useState(initialTarget)
  const [transition, setTransition] = useState<ZoomTransition>(shared?.transition ?? 'zoom')
  const [duration, setDuration] = useState(shared?.duration ?? 900)
  const [customDuration, setCustomDuration] = useState(false)
  const [easing, setEasing] = useState<ZoomEasing>(shared?.easing ?? 'easeInOut')
  const [origin, setOrigin] = useState<ZoomOrigin>(shared?.origin ?? 'element')
  const [returnToSource, setReturnToSource] = useState(shared?.returnToSource ?? true)
  const [effects, setEffects] = useState(shared?.effects ?? createZoomLink('').effects)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])

  if (!slide || !elements.length) {
    return null
  }

  const targetIndex = doc.slides.findIndex((s) => s.id === targetId)
  const targetSlide = targetIndex >= 0 ? doc.slides[targetIndex] : null
  const grouped = elements.some((e) => e.gid)
  const brokenBefore = elements.some(
    (e) => e.zoom?.target.kind === 'slide' && !doc.slides.some((s) => s.id === (e.zoom!.target as { slideId: string }).slideId),
  )

  const save = () => {
    if (!targetSlide) return
    const link: ZoomLink = createZoomLink(targetSlide.id, {
      transition,
      duration,
      easing,
      origin,
      returnToSource,
      effects,
    })
    // expand groups so a card built from several elements zooms as one trigger
    const ids = new Set<string>()
    for (const el of elements) {
      for (const m of triggerGroup(slide, el.id)) ids.add(m.id)
    }
    useDoc.getState().applyZoomBatch(
      [...ids].map((elementId) => ({ slideId: slide.id, elementId, link })),
      ids.size > 1 ? `ربط زوم (${ids.size})` : 'إضافة زوم',
    )
    close()
  }

  const thumbScale = 148 / doc.size.w
  const previewScale = Math.min(1, 460 / doc.size.w)

  return (
    <div className="fixed inset-0 z-[85] grid place-items-center bg-black/60 p-4" onClick={close} dir="rtl">
      <div
        className="glass flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-ink-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-ink-800 px-4 py-3">
          <span className="aur-fill glow-blue grid size-8 place-items-center rounded-lg text-white">
            <ZoomIn size={15} />
          </span>
          <div className="min-w-0">
            <h3 className="text-[13.5px] font-bold text-ink-50">
              زوم إلى شريحة {elements.length > 1 ? <span className="text-ink-400">({elements.length} عناصر)</span> : null}
            </h3>
            <p className="truncate text-[11px] text-ink-500">
              {elements.map((e) => e.name).slice(0, 3).join('، ')}
              {elements.length > 3 ? ` +${elements.length - 3}` : ''}
              {grouped ? ' · يشمل عناصر المجموعة' : ''}
            </p>
          </div>
          <button type="button" onClick={close} className="ms-auto grid size-8 place-items-center rounded-lg text-ink-400 hover:bg-ink-800" title="إغلاق (Esc)">
            <X size={15} />
          </button>
        </div>

        {brokenBefore ? (
          <div className="flex shrink-0 items-center gap-2 border-b border-warn/25 bg-warn/8 px-4 py-2 text-[12px] text-warn">
            <AlertTriangle size={14} /> الرابط الحالي معطّل (الشريحة المستهدفة محذوفة) — اختر شريحة جديدة لإصلاحه.
          </div>
        ) : null}

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 overflow-hidden md:grid-cols-[1fr_300px]">
          {/* target slides */}
          <div className="panel-x min-h-0 overflow-y-auto border-e border-ink-800 p-3">
            <p className="mb-2 text-[11px] font-semibold text-ink-400">اختر الشريحة المستهدفة</p>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
              {doc.slides.map((s, i) => {
                const isSource = s.id === slide.id
                const active = s.id === targetId
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={isSource}
                    onClick={() => setTargetId(s.id)}
                    className={cn(
                      'group overflow-hidden rounded-lg border text-start transition-all',
                      active
                        ? 'border-signal shadow-[0_0_0_1px_var(--color-signal)]'
                        : 'border-ink-750 hover:border-ink-500',
                      isSource && 'cursor-not-allowed opacity-45',
                    )}
                    title={isSource ? 'الشريحة الحالية (المصدر)' : slideLabel(doc, s.id)}
                  >
                    <span className="pointer-events-none block overflow-hidden bg-ink-950" style={{ height: doc.size.h * thumbScale }}>
                      <span className="block origin-top-left" style={{ width: doc.size.w, height: doc.size.h, transform: `scale(${thumbScale})` }}>
                        <SlideView slide={s} doc={doc} mode="thumb" static />
                      </span>
                    </span>
                    <span className={cn('flex items-center gap-1.5 px-2 py-1.5 text-[11px]', active ? 'text-signal-soft' : 'text-ink-300')}>
                      <span className="font-mono tabular-nums text-ink-500">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate">{s.name || slideLabel(doc, s.id).replace(/^شريحة \d+ — /, '') || `شريحة ${i + 1}`}</span>
                      {isSource ? <span className="text-[10px] text-ink-500">المصدر</span> : null}
                      {s.hidden ? <span className="text-[10px] text-ink-500">مخفية</span> : null}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* preview + settings */}
          <div className="panel-x min-h-0 overflow-y-auto p-3">
            {targetSlide ? (
              <div className="overflow-hidden rounded-lg border border-ink-750 bg-ink-950">
                <div className="pointer-events-none overflow-hidden" style={{ height: doc.size.h * previewScale }}>
                  <div className="origin-top-left" style={{ width: doc.size.w, height: doc.size.h, transform: `scale(${previewScale})` }}>
                    <SlideView slide={targetSlide} doc={doc} mode="thumb" static />
                  </div>
                </div>
                <p className="border-t border-ink-800 px-2.5 py-1.5 text-[11.5px] text-ink-200">{slideLabel(doc, targetSlide.id)}</p>
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-ink-700 px-3 py-4 text-center text-[12px] text-ink-500">
                لا توجد شريحة أخرى بعد — أضف شريحة أولًا.
              </p>
            )}

            <Section title="الانتقال">
              <Select
                value={transition}
                onChange={(v) => setTransition(v as ZoomTransition)}
                options={ZOOM_TRANSITIONS.map((t) => ({ value: t.id, label: `${t.label} — ${t.hint}` }))}
              />
            </Section>
            <Section title="المدة">
              <Segmented
                size="sm"
                value={customDuration ? 'custom' : String(duration)}
                onChange={(v) => {
                  if (v === 'custom') setCustomDuration(true)
                  else {
                    setCustomDuration(false)
                    setDuration(Number(v))
                  }
                }}
                options={[...ZOOM_DURATIONS.map((d) => ({ value: String(d), label: `${d / 1000}ث` })), { value: 'custom', label: 'مخصص' }]}
              />
              {customDuration ? (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="range"
                    min={ZOOM_DURATION_MIN}
                    max={ZOOM_DURATION_MAX}
                    step={50}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full accent-signal"
                  />
                  <span className="w-16 shrink-0 font-mono text-[11px] text-ink-200">{duration}ms</span>
                </div>
              ) : null}
            </Section>
            <Section title="التسارع (Easing)">
              <Select
                value={easing}
                onChange={(v) => setEasing(v as ZoomEasing)}
                options={ZOOM_EASINGS.map((e) => ({ value: e.id, label: e.label }))}
              />
            </Section>
            <Section title="نقطة البداية">
              <Select
                value={origin}
                onChange={(v) => setOrigin(v as ZoomOrigin)}
                options={ZOOM_ORIGINS.map((o) => ({ value: o.id, label: `${o.label} — ${o.hint}` }))}
              />
            </Section>
            <div className="px-3 py-1.5">
              <Switch checked={returnToSource} onChange={setReturnToSource} label="عودة للمصدر (زر عودة + Backspace)" />
            </div>
            <Section title="تأثيرات بصرية" defaultOpen={false}>
              <div className="space-y-1.5">
                <Switch checked={effects.backgroundFade} onChange={(v) => setEffects({ ...effects, backgroundFade: v })} label="تلاشي الخلفية" />
                <Switch checked={effects.depth} onChange={(v) => setEffects({ ...effects, depth: v })} label="عمق (دفع الشريحة للخلف)" />
                <Switch checked={effects.scale} onChange={(v) => setEffects({ ...effects, scale: v })} label="تحجيم أثناء الغوص" />
                <Switch checked={effects.blur} onChange={(v) => setEffects({ ...effects, blur: v })} label="تمويه خفيف" />
                <Switch checked={effects.softShadow} onChange={(v) => setEffects({ ...effects, softShadow: v })} label="ظل ناعم للشريحة القادمة" />
              </div>
              <p className="text-[10.5px] text-ink-500">الوضع الافتراضي متوازن واحترافي — فعّل بحذر.</p>
            </Section>

            <div className="flex gap-1.5 px-3 pb-3">
              <Button size="sm" variant="primary" className="flex-1" disabled={!targetSlide} onClick={save}>
                <ZoomIn size={13} /> {shared ? 'حفظ التعديلات' : 'إنشاء الزوم'}
              </Button>
              <Button size="sm" variant="ghost" onClick={close}>
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
