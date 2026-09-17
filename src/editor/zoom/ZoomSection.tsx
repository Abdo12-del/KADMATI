/**
 * Inspector section: Navigation (Zoom).
 *
 * Single selection shows the full editor (target / transition / duration / easing /
 * origin / return + broken-link repair); multi-selection offers one-click link-all /
 * unlink-all. Every change flows through the doc store, so undo/redo just works.
 */
import { AlertTriangle, Link2Off, Pencil, ZoomIn } from 'lucide-react'
import { useDoc } from '../../store/useDoc'
import { useUI } from '../../store/useUI'
import {
  canTriggerZoom,
  resolveZoomTarget,
  slideLabel,
  triggerGroup,
  ZOOM_DURATIONS,
  ZOOM_EASINGS,
  ZOOM_ORIGINS,
  ZOOM_TRANSITIONS,
  type ZoomEasing,
  type ZoomLink,
  type ZoomOrigin,
  type ZoomTransition,
} from '../../document/zoom'
import { Button, Field, Section, Segmented, Select, Switch } from '../../components/ui'
import type { AnyElement } from '../../document/types'

export function ZoomSection({ elements }: { elements: AnyElement[] }) {
  const doc = useDoc((s) => s.doc)
  const openZoomPicker = useUI((s) => s.openZoomPicker)

  if (!elements.length) return null

  if (elements.length > 1) {
    const linked = elements.filter((e) => e.zoom)
    const compatible = elements.filter(canTriggerZoom)
    return (
      <Section title={`التنقل — ${elements.length} عناصر`}>
        <p className="text-[11.5px] leading-relaxed text-ink-400">
          {linked.length ? `${linked.length} مرتبطة بزوم.` : 'لا روابط زوم.'} {compatible.length !== elements.length ? 'بعض الأنواع (خطوط) لا تدعم الزوم.' : ''}
        </p>
        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant="surface"
            className="flex-1"
            disabled={!compatible.length}
            onClick={() => openZoomPicker(compatible.map((e) => e.id))}
          >
            <ZoomIn size={13} /> ربط الكل بشريحة
          </Button>
          {linked.length ? (
            <Button
              size="sm"
              variant="ghost"
              title="إزالة كل روابط الزوم (تشمل المجموعات)"
              onClick={() => {
                const slide = doc.slides[useDoc.getState().slideIndex]
                if (!slide) return
                // mirror link creation: a group linked as one trigger unlinks as one
                const ids = new Set<string>()
                for (const e of linked) for (const m of triggerGroup(slide, e.id)) ids.add(m.id)
                useDoc.getState().updateSlide(
                  slide.id,
                  (s) => {
                    for (const el of s.elements) if (ids.has(el.id)) el.zoom = undefined
                  },
                  'إزالة الزوم',
                )
              }}
            >
              <Link2Off size={13} />
            </Button>
          ) : null}
        </div>
      </Section>
    )
  }

  const el = elements[0]
  if (!canTriggerZoom(el)) {
    return (
      <Section title="التنقل (Zoom)" defaultOpen={false}>
        <p className="text-[11.5px] leading-relaxed text-ink-500">
          الخطوط لا تصلح كنقاط زوم (مساحة ضغط صغيرة). استخدم شكلًا أو صورة أو زرًا أو مجموعة.
        </p>
      </Section>
    )
  }

  const link = el.zoom
  if (!link) {
    return (
      <Section title="التنقل (Zoom)">
        <Button size="sm" variant="surface" className="w-full" onClick={() => openZoomPicker([el.id])}>
          <ZoomIn size={13} /> زوم إلى شريحة…
        </Button>
        <p className="text-[11px] leading-relaxed text-ink-500">
          اجعل هذا العنصر بوابة لشريحة أخرى — يعمل في وضع العرض والمعاينة.
        </p>
      </Section>
    )
  }

  const targetId = link.target.kind === 'slide' ? resolveZoomTarget(doc, link.target) : null
  const broken = !targetId
  // Settings edits apply to the whole trigger group (they were linked as one),
  // each member keeping its own id/target — a single undo step.
  const patch = (fn: (z: ZoomLink) => void, label = 'تعديل الزوم') => {
    const st = useDoc.getState()
    const slide = st.doc.slides[st.slideIndex]
    const members = slide ? triggerGroup(slide, el.id).filter((m) => m.zoom) : []
    if (members.length <= 1) {
      const draft = structuredClone(link)
      fn(draft)
      st.updateElement(el.id, { zoom: draft }, label)
      return
    }
    const ids = new Set(members.map((m) => m.id))
    st.updateSlide(
      slide!.id,
      (s) => {
        for (const m of s.elements) {
          if (!ids.has(m.id) || !m.zoom) continue
          const draft = structuredClone(m.zoom)
          fn(draft)
          m.zoom = draft
        }
      },
      label,
    )
  }
  const unlink = () => useDoc.getState().setElementZoom(el.id, null, { group: true })

  return (
    <Section title="التنقل (Zoom)">
      {broken ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/8 p-2.5">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-red-300">
            <AlertTriangle size={13} /> رابط زوم معطّل
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-ink-400">
            الشريحة المستهدفة حُذفت. العرض لن يتعطل — اختر شريحة بديلة أو أزل الرابط.
          </p>
          <div className="mt-2 flex gap-1.5">
            <Button size="sm" variant="surface" className="flex-1" onClick={() => openZoomPicker([el.id])}>
              اختيار شريحة
            </Button>
            <Button size="sm" variant="ghost" onClick={unlink}>
              إزالة
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            const i = doc.slides.findIndex((s) => s.id === targetId)
            if (i >= 0) useDoc.getState().gotoSlide(i)
          }}
          className="flex w-full items-center gap-2 rounded-lg border border-signal/40 bg-signal/8 px-2.5 py-2 text-start transition-colors hover:bg-signal/12"
          title="انتقال إلى الشريحة المستهدفة"
        >
          <span className="aur-fill grid size-6 shrink-0 place-items-center rounded-md font-mono text-[11px] text-white">
            {doc.slides.findIndex((s) => s.id === targetId) + 1}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-semibold text-ink-50">{targetId ? slideLabel(doc, targetId) : ''}</span>
            <span className="block text-[10.5px] text-ink-500">انقر للانتقال إليها</span>
          </span>
          <Pencil size={12} className="shrink-0 text-ink-400" />
        </button>
      )}

      <Field label="الانتقال">
        <Select
          value={link.transition}
          onChange={(v) => patch((z) => void (z.transition = v as ZoomTransition))}
          options={ZOOM_TRANSITIONS.map((t) => ({ value: t.id, label: t.label }))}
        />
      </Field>
      <Field label="المدة">
        <Segmented
          size="sm"
          value={ZOOM_DURATIONS.includes(link.duration as never) ? String(link.duration) : 'custom'}
          onChange={(v) => {
            if (v !== 'custom') patch((z) => void (z.duration = Number(v)))
            else openZoomPicker([el.id])
          }}
          options={[...ZOOM_DURATIONS.map((d) => ({ value: String(d), label: `${d / 1000}ث` })), { value: 'custom', label: `${(link.duration / 1000).toFixed(1)}ث` }]}
        />
      </Field>
      <Field label="التسارع">
        <Select
          value={link.easing}
          onChange={(v) => patch((z) => void (z.easing = v as ZoomEasing))}
          options={ZOOM_EASINGS.map((e) => ({ value: e.id, label: e.label }))}
        />
      </Field>
      <Field label="نقطة البداية">
        <Select
          value={link.origin}
          onChange={(v) => patch((z) => void (z.origin = v as ZoomOrigin))}
          options={ZOOM_ORIGINS.map((o) => ({ value: o.id, label: o.label }))}
        />
      </Field>
      <Switch checked={link.returnToSource} onChange={(v) => patch((z) => void (z.returnToSource = v))} label="عودة للمصدر" />

      <div className="flex gap-1.5 pt-0.5">
        <Button size="sm" variant="surface" className="flex-1" onClick={() => openZoomPicker([el.id])}>
          <Pencil size={12} /> تعديل / تغيير الهدف
        </Button>
        <Button size="sm" variant="ghost" onClick={unlink} title="إزالة رابط الزوم (يشمل المجموعة)">
          <Link2Off size={13} />
        </Button>
      </div>
    </Section>
  )
}
