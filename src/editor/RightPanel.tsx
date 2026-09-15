/**
 * Right rail — the inspector.
 *
 * Two modes, like every serious design tool: when something is selected you edit the *element*,
 * when nothing is you edit the *slide and deck* (theme, layout, background, transition, brand).
 * Text formatting lives here too, but the inline selection formatting (bold part of a sentence) is
 * owned by the canvas toolbar so it sits next to the text you just selected.
 */
import { useCallback, useEffect, useState } from 'react'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  Contrast,
  Copy,
  Italic,
  Link2,
  List,
  ListOrdered,
  Palette,
  Play,
  RemoveFormatting,
  Spline,
  Strikethrough,
  Trash2,
  Underline,
  Wand2,
} from 'lucide-react'
import { useDoc } from '../store/useDoc'
import { toast, useUI } from '../store/useUI'
import { Button, Chip, ColorField, Divider, Field, NumberField, Row, Section, Segmented, Select, Slider, Switch, TextArea, TextField } from '../components/ui'
import { AnimationLibrary } from './anim/AnimationLibrary'
import { previewOnCanvas } from './anim/preview'
import { cloneAnim } from '../animation/serialize'
import { FONTS } from '../lib/fonts'
import { THEME_PRESETS } from '../document/factory'
import { LAYOUTS } from '../templates/layouts'
import { contrastRatio, relLuminance } from '../lib/colors'
import { cn } from '../lib/cn'
import type { AnyElement, ImageElement, Paint, ShapeElement, Slide, TableElement, TextElement, Theme } from '../document/types'

type Tab = 'design' | 'element' | 'animate' | 'transition' | 'notes' | 'ai'

const TABS: { id: Tab; label: string }[] = [
  { id: 'design', label: 'تصميم' },
  { id: 'element', label: 'خصائص' },
  { id: 'animate', label: 'حركة' },
  { id: 'transition', label: 'انتقال' },
  { id: 'notes', label: 'ملاحظات' },
  { id: 'ai', label: 'ذكاء' },
]

export function RightPanel() {
  const rightPanel = useUI((s) => s.rightPanel)
  const setRightPanel = useUI((s) => s.setRightPanel)
  const selection = useDoc((s) => s.selection)
  const tab = (selection.length && rightPanel === 'design' ? 'element' : rightPanel) as Tab

  return (
    <aside className="glass flex h-full w-[320px] shrink-0 flex-col border-s border-ink-800/70">
      <nav className="flex shrink-0 items-center gap-0.5 overflow-x-auto border-b border-ink-800 px-1.5 py-1.5 no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setRightPanel(t.id)}
            className={cn(
              'shrink-0 rounded-md px-2 py-1.5 text-[11.5px] font-medium transition-colors',
              tab === t.id ? 'bg-ink-800 text-ink-50' : 'text-ink-400 hover:bg-ink-850 hover:text-ink-100',
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <div className="panel-x min-h-0 flex-1 overflow-y-auto">
        {tab === 'design' ? <DesignTab /> : null}
        {tab === 'element' ? <ElementTab /> : null}
        {tab === 'animate' ? <AnimateTab /> : null}
        {tab === 'transition' ? <TransitionTab /> : null}
        {tab === 'notes' ? <NotesTab /> : null}
        {tab === 'ai' ? <AiTab /> : null}
      </div>
    </aside>
  )
}

/* ------------------------------------------------------------------ element */

function ElementTab() {
  const doc = useDoc((s) => s.doc)
  const slideIndex = useDoc((s) => s.slideIndex)
  const selection = useDoc((s) => s.selection)
  const updateSelected = useDoc((s) => s.updateSelected)
  const slide = doc.slides[slideIndex]
  const selected = selection.map((id) => slide?.elements.find((el) => el.id === id)).filter(Boolean) as AnyElement[]

  if (!selected.length) {
    return (
      <div className="p-4">
        <p className="text-[12.5px] leading-relaxed text-ink-400">
          لا يوجد تحديد. انقر عنصرًا في الشريحة، أو استخدم <span className="font-mono text-ink-200">⌘A</span> لتحديد كل العناصر، ثم عدّل خصائصه هنا.
        </p>
        <div className="mt-3 grid gap-1.5">
          <Button size="sm" variant="surface" onClick={() => useDoc.getState().selectAll()}>
            تحديد كل العناصر
          </Button>
          <Button size="sm" variant="surface" onClick={() => useDoc.getState().insertText('body')}>
            إضافة مربع نص
          </Button>
        </div>
      </div>
    )
  }

  const shared = selected[0]
  const kinds = new Set(selected.map((el) => el.kind))
  const single = selected.length === 1

  return (
    <div>
      <Section title={single ? labelOf(shared) : `${selected.length} عناصر`}>
        <Row>
          <Field label="X">
            <NumberField value={round(shared.x)} onChange={(v) => updateSelected({ x: v })} compact />
          </Field>
          <Field label="Y">
            <NumberField value={round(shared.y)} onChange={(v) => updateSelected({ y: v })} compact />
          </Field>
        </Row>
        <Row>
          <Field label="العرض">
            <NumberField value={round(shared.w)} min={2} onChange={(v) => updateSelected({ w: Math.max(2, v) })} compact />
          </Field>
          <Field label="الارتفاع">
            <NumberField value={round(shared.h)} min={2} onChange={(v) => updateSelected({ h: Math.max(2, v) })} compact />
          </Field>
        </Row>
        <Row>
          <Field label="دوران">
            <NumberField value={round(shared.rotation)} step={1} onChange={(v) => updateSelected({ rotation: ((v % 360) + 360) % 360 })} compact suffix="°" />
          </Field>
          <Field label="اسم">
            <TextField value={single ? shared.name : ''} onChange={(v) => single && updateSelected({ name: v })} placeholder={`${selected.length} عناصر`} />
          </Field>
        </Row>
        <Slider label="الشفافية" value={Math.round(shared.opacity * 100)} suffix="٪" min={0} max={100} onChange={(v) => updateSelected({ opacity: v / 100 })} />
        <Row className="pt-0.5">
          <Chip active={shared.locked} onClick={() => updateSelected((el) => ({ locked: !el.locked }))}>
            {shared.locked ? 'مقفول' : 'قابل للتحريك'}
          </Chip>
          <Chip active={!shared.visible} onClick={() => updateSelected((el) => ({ visible: !el.visible }))}>
            {shared.visible ? 'ظاهر' : 'مخفي'}
          </Chip>
          <div className="ms-auto flex gap-0.5">
            <NumberLabel label="مقدمة" onClick={() => useDoc.getState().zOrder('front')} />
            <NumberLabel label="أمام" onClick={() => useDoc.getState().zOrder('forward')} />
            <NumberLabel label="خلف" onClick={() => useDoc.getState().zOrder('backward')} />
            <NumberLabel label="خلفية" onClick={() => useDoc.getState().zOrder('back')} />
          </div>
        </Row>
      </Section>

      {kinds.size === 1 && kinds.has('text') ? <TextInspection elements={selected as TextElement[]} /> : null}
      {kinds.size === 1 && kinds.has('image') ? <ImageInspection elements={selected as ImageElement[]} /> : null}
      {kinds.size === 1 && kinds.has('shape') ? <ShapeInspection elements={selected as ShapeElement[]} /> : null}
      {kinds.size === 1 && kinds.has('table') ? <TableInspection elements={selected as TableElement[]} /> : null}
      {kinds.size === 1 && kinds.has('chart') ? <ChartInspection /> : null}
      {kinds.size === 1 && (kinds.has('icon') || kinds.has('svg')) ? <IconInspection element={shared} /> : null}
      {kinds.size === 1 && kinds.has('line') ? <LineInspection /> : null}
      {kinds.size === 1 && kinds.has('frame') ? <FrameInspection /> : null}
      {kinds.size === 1 && kinds.has('video') ? <VideoInspection /> : null}

      <Section title="محاذاة وتوزيع" defaultOpen={false}>
        <AlignGrid />
      </Section>

      <Section title="رابط العنصر" defaultOpen={false}>
        <Field label="URL">
          <TextField
            value={shared.link ?? ''}
            onChange={(v) => updateSelected({ link: v.trim() || undefined })}
            placeholder="https://…"
          />
        </Field>
        <p className="text-[11px] leading-relaxed text-ink-500">يُصدَّر كرابط تشعبي في PPTX، ويعمل في وضع العرض.</p>
      </Section>
    </div>
  )
}

function labelOf(el: AnyElement): string {
  const kindLabel: Record<string, string> = {
    text: 'نص',
    image: 'صورة',
    shape: 'شكل',
    line: 'خط',
    icon: 'أيقونة',
    svg: 'SVG',
    table: 'جدول',
    chart: 'مخطط',
    video: 'فيديو',
    frame: 'إطار',
  }
  return `${kindLabel[el.kind] ?? el.kind}${el.name && el.name !== el.kind ? ` · ${el.name}` : ''}`
}

function round(v: number): number {
  return Math.round(v * 10) / 10
}

function NumberLabel({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('rounded border border-ink-700 px-1.5 py-0.5 text-[10.5px] text-ink-300 transition-colors hover:bg-ink-800 hover:text-ink-50')}
    >
      {label}
    </button>
  )
}

function AlignGrid() {
  const alignSelected = useDoc((s) => s.alignSelected)
  const distributeSelected = useDoc((s) => s.distributeSelected)
  const items: [string, typeof AlignLeft, () => void][] = [
    ['بداية', AlignLeft, () => alignSelected('left')],
    ['وسط', AlignCenter, () => alignSelected('hcenter')],
    ['نهاية', AlignRight, () => alignSelected('right')],
  ]
  const vertical: [string, typeof AlignLeft, () => void][] = [
    ['أعلى', AlignLeft, () => alignSelected('top')],
    ['وسط', AlignCenter, () => alignSelected('vcenter')],
    ['أسفل', AlignRight, () => alignSelected('bottom')],
  ]
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-1">
        {items.map(([label, Icon, run]) => (
          <button key={`h-${label}`} type="button" onClick={run} className="flex items-center justify-center gap-1 rounded-md border border-ink-700 py-1.5 text-[11px] text-ink-200 transition-colors hover:bg-ink-800">
            <Icon size={12} /> {label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1">
        {vertical.map(([label, Icon, run]) => (
          <button key={`v-${label}`} type="button" onClick={run} className="flex items-center justify-center gap-1 rounded-md border border-ink-700 py-1.5 text-[11px] text-ink-200 transition-colors hover:bg-ink-800">
            <Icon size={12} /> {label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1">
        <button type="button" onClick={() => distributeSelected('x')} className="rounded-md border border-ink-700 py-1.5 text-[11px] text-ink-200 hover:bg-ink-800">
          توزيع أفقي
        </button>
        <button type="button" onClick={() => distributeSelected('y')} className="rounded-md border border-ink-700 py-1.5 text-[11px] text-ink-200 hover:bg-ink-800">
          توزيع رأسي
        </button>
      </div>
      <p className="text-[11px] leading-relaxed text-ink-500">المحاذاة تعمل على التحديد الفردي (نسبةً للشريحة) وعلى الجماعي (نسبةً لأطراف التحديد).</p>
    </div>
  )
}

/* ------------------------------------------------------------------ per-kind inspectors */

function TextInspection({ elements }: { elements: TextElement[] }) {
  const updateTextStyle = useDoc((s) => s.updateTextStyle)
  const font = elements[0].font
  const editing = useDoc((s) => s.editingId) !== null
  const exec = (command: string, value?: string) => {
    if (!editing) return false
    document.execCommand(command, false, value)
    // Push the browser's result back into the document so it is undoable and exportable.
    const node = document.querySelector<HTMLElement>('[data-editable="true"][contenteditable="true"]')
    const id = useDoc.getState().editingId
    if (node && id) useDoc.getState().updateElementText(id, node.innerHTML)
    return true
  }

  return (
    <>
      <Section title="الخط">
        <Field label="العائلة">
          <Select value={font.fontFamily} onChange={(v) => updateTextStyle({ fontFamily: v })} options={FONTS.map((f) => ({ value: f.id, label: f.label }))} />
        </Field>
        <Row>
          <Field label="الحجم">
            <NumberField value={font.fontSize} min={6} max={400} onChange={(v) => updateTextStyle({ fontSize: Math.max(6, Math.min(400, v)) })} compact suffix="px" />
          </Field>
          <Field label="الوزن">
            <Select
              value={String(font.bold ? 700 : 400)}
              onChange={(v) => updateTextStyle({ bold: Number(v) >= 600 })}
              options={[
                { value: '300', label: 'خفيف ٣٠٠' },
                { value: '400', label: 'عادي ٤٠٠' },
                { value: '600', label: 'نصف ٦٠٠' },
                { value: '700', label: 'عريض ٧٠٠' },
              ]}
            />
          </Field>
        </Row>
        <div className="flex flex-wrap items-center gap-1">
          <Toggle on={font.bold} onClick={() => (exec('bold') || updateTextStyle({ bold: !font.bold }))} title="عريض · ⌘B">
            <Bold size={13} />
          </Toggle>
          <Toggle on={font.italic} onClick={() => (exec('italic') || updateTextStyle({ italic: !font.italic }))} title="مائل · ⌘I">
            <Italic size={13} />
          </Toggle>
          <Toggle on={font.underline} onClick={() => (exec('underline') || updateTextStyle({ underline: !font.underline }))} title="تسطير">
            <Underline size={13} />
          </Toggle>
          <Toggle on={font.strike} onClick={() => (exec('strikeThrough') || updateTextStyle({ strike: !font.strike }))} title="شطب">
            <Strikethrough size={13} />
          </Toggle>
          <Divider vertical />
          <Toggle on={false} onClick={() => exec('insertUnorderedList')} title="قائمة نقطية">
            <List size={13} />
          </Toggle>
          <Toggle on={false} onClick={() => exec('insertOrderedList')} title="قائمة رقمية">
            <ListOrdered size={13} />
          </Toggle>
          <Toggle on={false} onClick={() => exec('removeFormat')} title="مسح التنسيقات">
            <RemoveFormatting size={13} />
          </Toggle>
        </div>
        {!editing ? (
          <p className="text-[10.5px] leading-relaxed text-ink-500">
            التنسيق داخل النص (تعتيم جزء محدد، لون كلمة، رابط) يُطبَّق أثناء التحرير داخل الشريحة — انقر نقرة مزدوجة على النص.
          </p>
        ) : null}
        <Field label="المحاذاة">
          <Segmented
            size="sm"
            value={font.align}
            onChange={(v) => updateTextStyle({ align: v as never })}
            options={[
              { value: 'start', label: <AlignLeft size={12} />, tip: 'بداية السطر' },
              { value: 'center', label: <AlignCenter size={12} />, tip: 'توسيط' },
              { value: 'end', label: <AlignRight size={12} />, tip: 'نهاية السطر' },
              { value: 'justify', label: <JoinIcon size={12} />, tip: 'ضبط' },
            ]}
          />
        </Field>
        <Field label="الاتجاه">
          <Segmented
            size="sm"
            value={font.dir}
            onChange={(v) => updateTextStyle({ dir: v as 'rtl' | 'ltr' })}
            options={[
              { value: 'rtl', label: 'RTL' },
              { value: 'ltr', label: 'LTR' },
            ]}
          />
        </Field>
        <Row>
          <Field label="تباعد الأسطر">
            <NumberField value={font.lineHeight} min={0.8} max={4} step={0.05} onChange={(v) => updateTextStyle({ lineHeight: v })} compact />
          </Field>
          <Field label="تباعد الحروف">
            <NumberField value={font.letterSpacing} min={-4} max={20} step={0.1} onChange={(v) => updateTextStyle({ letterSpacing: v })} compact suffix="px" />
          </Field>
        </Row>
        <Field label="محاذاة رأسية">
          <Segmented
            size="sm"
            value={font.vAlign}
            onChange={(v) => updateTextStyle({ vAlign: v as never })}
            options={[
              { value: 'start', label: 'أعلى' },
              { value: 'center', label: 'وسط' },
              { value: 'end', label: 'أسفل' },
            ]}
          />
        </Field>
        <Field label="حشو">
          <NumberField value={font.paraSpacing ?? 0} min={0} max={4} step={0.1} onChange={(v) => updateTextStyle({ paraSpacing: v })} compact suffix="em" />
        </Field>
        <Switch checked={font.autoFit === 'shrink'} onChange={(v) => updateTextStyle({ autoFit: v ? 'shrink' : 'none' })} label="تصغير الخط ليلائم الإطار" />
        <Switch checked={font.wrap !== false} onChange={(v) => updateTextStyle({ wrap: v })} label="التفاف النص" />
      </Section>

      <Section title="الألوان">
        <Field label="لون النص">
          <ColorField value={font.color} onChange={(v) => updateTextStyle({ color: v })} />
        </Field>
        <Field label="تظليل">
          <ColorField value={font.highlight} onChange={(v) => updateTextStyle({ highlight: v || undefined })} allowTransparent />
        </Field>
        <Row>
          <Chip onClick={() => updateTextStyle({ color: useDoc.getState().doc.theme.palette.onPrimary })}>لون على الخلفية</Chip>
          <Chip onClick={() => updateTextStyle({ color: useDoc.getState().doc.theme.palette.text })}>لون النص الأساسي</Chip>
        </Row>
        <ContrastNote fg={font.color} bg={currentColorBehind()} />
      </Section>

      <Section title="النص">
        <TextArea
          value={plain(elements[0].content)}
          dir={font.dir}
          rows={5}
          onChange={(v) => {
            const html = v
              .split(/\n{2,}/)
              .map((para) => `<p>${para.replace(/\n/g, '<br/>').replace(/&/g, '&amp;').replace(/</g, '&lt;')}</p>`)
              .join('')
            useDoc.getState().updateElementText(elements[0].id, html)
          }}
        />
        <div className="flex flex-wrap gap-1">
          <AiChip label="تحسين الصياغة" op="improve" id={elements[0].id} />
          <AiChip label="اختصار" op="shorten" id={elements[0].id} />
          <AiChip label="أكثر رسمية" op="formal" id={elements[0].id} />
          <AiChip label="اقتراح عنوان" op="title" id={elements[0].id} />
        </div>
      </Section>
    </>
  )
}

function currentColorBehind(): string {
  const { doc, slideIndex } = useDoc.getState()
  const slide = doc.slides[slideIndex]
  if (slide?.background.type === 'solid' && slide.background.color) return slide.background.color
  return doc.theme.palette.background
}

function plain(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|li|div)>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function ImageInspection({ elements }: { elements: ImageElement[] }) {
  const updateSelected = useDoc((s) => s.updateSelected)
  const doc = useDoc((s) => s.doc)
  const el = elements[0]
  const asset = doc.assets[el.assetId]
  const filters = el.filters
  return (
    <>
      <Section title="الصورة">
        <Field label="الملء">
          <Segmented
            size="sm"
            value={el.fit}
            onChange={(v) => updateSelected({ fit: v as never })}
            options={[
              { value: 'cover', label: 'تغطية' },
              { value: 'contain', label: 'احتواء' },
              { value: 'fill', label: 'تمديد' },
            ]}
          />
        </Field>
        <Field label="استدارة">
          <NumberField value={el.radius?.[0] ?? 0} min={0} max={400} onChange={(v) => updateSelected({ radius: [v, v, v, v] })} compact suffix="px" />
        </Field>
        <Field label="القناع">
          <Select
            value={el.mask?.shape ?? 'none'}
            onChange={(v) => updateSelected({ mask: v === 'none' ? undefined : { shape: v as never, inset: 0 } })}
            options={[
              { value: 'none', label: 'بدون' },
              { value: 'circle', label: 'دائرة' },
              { value: 'ellipse', label: 'قطع ناقص' },
              { value: 'rounded', label: 'حواف دائرية' },
              { value: 'triangle', label: 'مثلث' },
              { value: 'pentagon', label: 'خماسي' },
              { value: 'hexagon', label: 'سداسي' },
              { value: 'diamond', label: 'معين' },
              { value: 'blob', label: 'عضوي' },
              { value: 'star', label: 'نجمة' },
            ]}
          />
        </Field>
        {el.mask ? (
          <Slider label="تقصير القناع" value={el.mask.inset} min={0} max={40} suffix="٪" onChange={(v) => updateSelected({ mask: { ...el.mask!, inset: v } })} />
        ) : null}
      </Section>

      <Section title="اقتصاص">
        <Row>
          <Field label="يسار">
            <NumberField value={Math.round((el.crop?.x ?? 0) * 100)} min={0} max={90} onChange={(v) => setCrop(updateSelected, el, { x: v / 100 })} compact suffix="٪" />
          </Field>
          <Field label="يمين">
            <NumberField value={Math.round((1 - (el.crop?.x ?? 0) - (el.crop?.w ?? 1)) * 100)} min={0} max={90} onChange={(v) => setCrop(updateSelected, el, { r: v / 100 })} compact suffix="٪" />
          </Field>
        </Row>
        <Row>
          <Field label="أعلى">
            <NumberField value={Math.round((el.crop?.y ?? 0) * 100)} min={0} max={90} onChange={(v) => setCrop(updateSelected, el, { y: v / 100 })} compact suffix="٪" />
          </Field>
          <Field label="أسفل">
            <NumberField value={Math.round((1 - (el.crop?.y ?? 0) - (el.crop?.h ?? 1)) * 100)} min={0} max={90} onChange={(v) => setCrop(updateSelected, el, { b: v / 100 })} compact suffix="٪" />
          </Field>
        </Row>
        <Button size="sm" variant="ghost" className="w-full" onClick={() => updateSelected({ crop: undefined })}>
          إلغاء الاقتصاص
        </Button>
      </Section>

      <Section title="تعديل لوني">
        <Slider label="الإضاءة" value={filters.brightness} min={0} max={200} suffix="٪" onChange={(v) => updateSelected({ filters: { ...filters, brightness: v } })} />
        <Slider label="التباين" value={filters.contrast} min={0} max={200} suffix="٪" onChange={(v) => updateSelected({ filters: { ...filters, contrast: v } })} />
        <Slider label="التشبع" value={filters.saturation} min={0} max={200} suffix="٪" onChange={(v) => updateSelected({ filters: { ...filters, saturation: v } })} />
        <Slider label="رمادي" value={filters.grayscale} min={0} max={100} suffix="٪" onChange={(v) => updateSelected({ filters: { ...filters, grayscale: v } })} />
        <Slider label="سيبيا" value={filters.sepia} min={0} max={100} suffix="٪" onChange={(v) => updateSelected({ filters: { ...filters, sepia: v } })} />
        <Slider label="تدوير اللون" value={filters.hueRotate} min={-180} max={180} suffix="°" onChange={(v) => updateSelected({ filters: { ...filters, hueRotate: v } })} />
        <Slider label="تمويه" value={filters.blur} min={0} max={20} step={0.5} suffix="px" onChange={(v) => updateSelected({ filters: { ...filters, blur: v } })} />
        <Button size="sm" variant="ghost" className="w-full" onClick={() => updateSelected({ filters: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, blur: 0, sepia: 0, hueRotate: 0 } })}>
          إعادة ضبط
        </Button>
      </Section>

      <Section title="الحدود">
        <Field label="اللون">
          <ColorField value={el.stroke?.color} onChange={(v) => updateSelected({ stroke: { color: v, width: el.stroke?.width ?? 2, dash: el.stroke?.dash ?? 'solid' } })} allowTransparent />
        </Field>
        <Field label="السماكة">
          <NumberField value={el.stroke?.width ?? 0} min={0} max={40} onChange={(v) => updateSelected({ stroke: v ? { color: el.stroke?.color ?? '#000000', width: v, dash: el.stroke?.dash } : undefined })} compact suffix="px" />
        </Field>
      </Section>

      {asset ? (
        <div className="px-3 py-2.5 text-[11px] text-ink-500">
          {asset.name} · {asset.w}×{asset.h} بكسل · {Math.round((asset.bytes ?? 0) / 1024)} ك.ب
        </div>
      ) : null}
    </>
  )
}

function setCrop(
  updateSelected: (patch: Partial<AnyElement> | ((el: AnyElement) => Partial<AnyElement>), label?: string) => void,
  el: ImageElement,
  next: Partial<{ x: number; y: number; r: number; b: number }>,
) {
  const cur = el.crop ?? { x: 0, y: 0, w: 1, h: 1 }
  const x = next.x ?? cur.x
  const y = next.y ?? cur.y
  const r = next.r ?? 1 - cur.x - cur.w
  const b = next.b ?? 1 - cur.y - cur.h
  updateSelected({ crop: { x, y, w: Math.max(0.05, 1 - x - r), h: Math.max(0.05, 1 - y - b) } })
}

function ShapeInspection({ elements }: { elements: ShapeElement[] }) {
  const updateSelected = useDoc((s) => s.updateSelected)
  const el = elements[0]
  const paint = el.fill
  const setColor = (color: string) => updateSelected({ fill: { type: 'solid', color } } as Partial<ShapeElement>)
  return (
    <>
      <Section title="التعبئة">
        <Segmented
          size="sm"
          value={paint.type}
          onChange={(v) => updateSelected({ fill: defaultPaintFor(v as Paint['type'], paint) } as Partial<ShapeElement>)}
          options={[
            { value: 'none', label: 'بلا' },
            { value: 'solid', label: 'لون' },
            { value: 'gradient', label: 'تدرج' },
            { value: 'pattern', label: 'نمط' },
          ]}
        />
        {paint.type === 'solid' ? <ColorField value={paint.color} onChange={setColor} allowTransparent /> : null}
        {paint.type === 'gradient' ? (
          <div className="space-y-2">
            <Row>
              <span className="text-[11.5px] text-ink-300">اللون الأول</span>
              <ColorField value={paint.stops[0]?.color} onChange={(v) => updateSelected({ fill: { ...paint, stops: [{ pos: paint.stops[0]?.pos ?? 0, color: v }, ...(paint.stops.slice(1) ?? [])] } } as Partial<ShapeElement>)} />
            </Row>
            <Row>
              <span className="text-[11.5px] text-ink-300">اللون الثاني</span>
              <ColorField value={paint.stops[1]?.color} onChange={(v) => updateSelected({ fill: { ...paint, stops: [paint.stops[0] ?? { pos: 0, color: '#ffffff' }, { pos: 100, color: v }] } } as Partial<ShapeElement>)} />
            </Row>
            <Slider label="الزاوية" value={paint.angle} min={0} max={360} suffix="°" onChange={(v) => updateSelected({ fill: { ...paint, angle: v } } as Partial<ShapeElement>)} />
            <Segmented
              size="sm"
              value={paint.kind}
              onChange={(v) => updateSelected({ fill: { ...paint, kind: v as 'linear' | 'radial' } } as Partial<ShapeElement>)}
              options={[
                { value: 'linear', label: 'خطي' },
                { value: 'radial', label: 'شعاعي' },
              ]}
            />
          </div>
        ) : null}
        {paint.type === 'pattern' ? (
          <div className="space-y-2">
            <Segmented
              size="sm"
              value={paint.pattern}
              onChange={(v) => updateSelected({ fill: { ...paint, pattern: v as never } } as Partial<ShapeElement>)}
              options={[
                { value: 'diagonal', label: 'قطري' },
                { value: 'dots', label: 'نقاط' },
                { value: 'grid', label: 'شبكة' },
                { value: 'cross', label: 'تقاطع' },
              ]}
            />
            <Row>
              <span className="text-[11.5px] text-ink-300">الخطوط</span>
              <ColorField value={paint.color} onChange={(v) => updateSelected({ fill: { ...paint, color: v } } as Partial<ShapeElement>)} />
            </Row>
            <Row>
              <span className="text-[11.5px] text-ink-300">الأرضية</span>
              <ColorField value={paint.background} onChange={(v) => updateSelected({ fill: { ...paint, background: v } } as Partial<ShapeElement>)} />
            </Row>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-1 pt-0.5">
          {themeSwatches().map((c) => (
            <button
              key={c}
              type="button"
              title="استخدام لون السمة"
              onClick={() => setColor(c)}
              className="size-5 rounded-md border border-ink-700 transition-transform hover:scale-110"
              style={{ background: c }}
            />
          ))}
        </div>
      </Section>

      <Section title="الحدود">
        <Switch checked={!!el.stroke} onChange={(v) => updateSelected({ stroke: v ? { color: el.stroke?.color ?? el.shape === 'rect' ? '#000000' : '#000000', width: el.stroke?.width ?? 2, dash: 'solid' } : undefined } as Partial<ShapeElement>)} label="إظهار الحدود" />
        {el.stroke ? (
          <>
            <Field label="اللون">
              <ColorField value={el.stroke.color} onChange={(v) => updateSelected({ stroke: { ...el.stroke!, color: v } } as Partial<ShapeElement>)} />
            </Field>
            <Field label="السماكة">
              <NumberField value={el.stroke.width} min={0} max={40} step={0.5} onChange={(v) => updateSelected({ stroke: { ...el.stroke!, width: v } } as Partial<ShapeElement>)} compact suffix="px" />
            </Field>
            <Field label="النوع">
              <Segmented
                size="sm"
                value={el.stroke.dash ?? 'solid'}
                onChange={(v) => updateSelected({ stroke: { ...el.stroke!, dash: v as never } } as Partial<ShapeElement>)}
                options={[
                  { value: 'solid', label: 'متصل' },
                  { value: 'dashed', label: 'متقطع' },
                  { value: 'dotted', label: 'منقّط' },
                ]}
              />
            </Field>
          </>
        ) : null}
      </Section>

      <Section title="الاستدارة والظل">
        <Field label="الحواف">
          <NumberField
            value={el.radius?.[0] ?? 0}
            min={0}
            max={400}
            onChange={(v) => updateSelected({ radius: [v, v, v, v] } as Partial<ShapeElement>)}
            compact
            suffix="px"
          />
        </Field>
        <Switch checked={!!el.shadow} onChange={(v) => updateSelected({ shadow: v ? { x: 0, y: 8, blur: 24, spread: 0, color: 'rgba(0,0,0,0.35)' } : undefined } as Partial<ShapeElement>)} label="ظل" />
        {el.shadow ? (
          <>
            <Row>
              <Field label="س">
                <NumberField value={el.shadow.x} min={-100} max={100} onChange={(v) => updateSelected({ shadow: { ...el.shadow!, x: v } } as Partial<ShapeElement>)} compact />
              </Field>
              <Field label="ع">
                <NumberField value={el.shadow.y} min={-100} max={100} onChange={(v) => updateSelected({ shadow: { ...el.shadow!, y: v } } as Partial<ShapeElement>)} compact />
              </Field>
            </Row>
            <Slider label="دوام الظل" value={el.shadow.blur} min={0} max={80} onChange={(v) => updateSelected({ shadow: { ...el.shadow!, blur: v } } as Partial<ShapeElement>)} />
            <Slider label="امتداد" value={el.shadow.spread} min={-20} max={40} onChange={(v) => updateSelected({ shadow: { ...el.shadow!, spread: v } } as Partial<ShapeElement>)} />
            <Field label="اللون">
              <ColorField value={el.shadow.color} onChange={(v) => updateSelected({ shadow: { ...el.shadow!, color: v } } as Partial<ShapeElement>)} />
            </Field>
          </>
        ) : null}
      </Section>

      {el.text !== undefined ? (
        <Section title="نص الشكل">
          <TextArea value={el.text ?? ''} rows={3} onChange={(v) => updateSelected({ text: v } as Partial<ShapeElement>)} />
          <Row>
            <Field label="الحجم">
              <NumberField value={el.textStyle?.fontSize ?? 22} min={6} max={200} onChange={(v) => updateSelected({ textStyle: { ...el.textStyle!, fontSize: v } } as Partial<ShapeElement>)} compact />
            </Field>
            <Field label="اللون">
              <ColorField value={el.textStyle?.color} onChange={(v) => updateSelected({ textStyle: { ...el.textStyle!, color: v } } as Partial<ShapeElement>)} />
            </Field>
          </Row>
        </Section>
      ) : null}
    </>
  )
}

function defaultPaintFor(type: Paint['type'], current: Paint): Paint {
  if (type === current.type) return current
  if (type === 'none') return { type: 'none' }
  if (type === 'solid') return { type: 'solid', color: current.type === 'gradient' ? current.stops[0]?.color ?? '#ffffff' : '#4C6FFF' }
  if (type === 'gradient') {
    const from = current.type === 'solid' ? current.color : '#16324F'
    return { type: 'gradient', kind: 'linear', angle: 135, stops: [{ pos: 0, color: from }, { pos: 100, color: themeAccent() }] }
  }
  return { type: 'pattern', color: '#FFFFFF', background: current.type === 'solid' ? current.color : '#16324F', pattern: 'diagonal' }
}

function themeAccent(): string {
  return useDoc.getState().doc.theme.palette.accent
}

function themeSwatches(): string[] {
  const p = useDoc.getState().doc.theme.palette
  return [p.primary, p.secondary, p.accent, p.surface, p.text, p.success, p.warning, p.background]
}

function TableInspection({ elements }: { elements: TableElement[] }) {
  const updateSelected = useDoc((s) => s.updateSelected)
  const el = elements[0]
  const doc = useDoc((s) => s.doc)
  return (
    <>
      <Section title="الحجم">
        <Row>
          <Field label="صفوف">
            <NumberField
              value={el.cells.length}
              min={1}
              max={40}
              onChange={(v) => {
                const rows = Math.max(1, Math.min(40, Math.round(v)))
                const cells = Array.from({ length: rows }, (_, r) => (r < el.cells.length ? el.cells[r] : Array.from({ length: el.cells[0].length }, () => ({ text: '' }))))
                updateSelected({ cells } as Partial<TableElement>)
              }}
              compact
            />
          </Field>
          <Field label="أعمدة">
            <NumberField
              value={el.cells[0]?.length ?? 1}
              min={1}
              max={12}
              onChange={(v) => {
                const cols = Math.max(1, Math.min(12, Math.round(v)))
                const cells = el.cells.map((row) => Array.from({ length: cols }, (_, ci) => (ci < row.length ? row[ci] : { text: '' })))
                updateSelected({ cells, colWidths: Array.from({ length: cols }, () => 1 / cols) } as Partial<TableElement>)
              }}
              compact
            />
          </Field>
        </Row>
        <Switch checked={el.header} onChange={(v) => updateSelected({ header: v } as Partial<TableElement>)} label="صف رأس" />
        <Switch checked={el.footer} onChange={(v) => updateSelected({ footer: v } as Partial<TableElement>)} label="صف تذييل" />
        <Switch checked={el.striped} onChange={(v) => updateSelected({ striped: v } as Partial<TableElement>)} label="تظليل الصفوف" />
      </Section>
      <Section title="المظهر">
        <Field label="لون الرأس">
          <ColorField value={el.cells[0]?.[0]?.fill} onChange={(v) => setHeaderFill(updateSelected, el, v)} />
        </Field>
        <Field label="حشو الخلايا">
          <NumberField value={el.cellPadding} min={0} max={40} onChange={(v) => updateSelected({ cellPadding: v } as Partial<TableElement>)} compact suffix="px" />
        </Field>
        <Field label="حجم الخط">
          <NumberField value={el.font.fontSize} min={8} max={64} onChange={(v) => updateSelected({ font: { ...el.font, fontSize: v } } as Partial<TableElement>)} compact suffix="px" />
        </Field>
        <Field label="حدود">
          <ColorField value={el.border.color} onChange={(v) => updateSelected({ border: { ...el.border, color: v } } as Partial<TableElement>)} />
        </Field>
        <Button
          size="sm"
          variant="ghost"
          className="w-full"
          onClick={() => updateSelected({ header: true, striped: true, font: { ...el.font, fontSize: 18 }, border: { color: doc.theme.palette.surface, width: 1, dash: 'solid' } } as Partial<TableElement>)}
        >
          تطبيق نمط السمة
        </Button>
      </Section>
      <Section title="بيانات الجدول" defaultOpen={false}>
        <TableGridEditor />
      </Section>
    </>
  )
}

function setHeaderFill(
  updateSelected: (patch: Partial<AnyElement> | ((el: AnyElement) => Partial<AnyElement>), label?: string) => void,
  el: TableElement,
  color: string,
) {
  updateSelected({ cells: el.cells.map((row, r) => row.map((cell) => (r === 0 ? { ...cell, fill: color, color: bestTextColor(color) } : cell))) } as Partial<TableElement>)
}

function bestTextColor(bg: string): string {
  return relLuminance(bg) > 0.45 ? '#101820' : '#FFFFFF'
}

/** Cells are edited on the canvas by double-click; this grid is the fast path for bulk data. */
function TableGridEditor() {
  const doc = useDoc((s) => s.doc)
  const selection = useDoc((s) => s.selection)
  const slideIndex = useDoc((s) => s.slideIndex)
  const updateElement = useDoc((s) => s.updateElement)
  const el = doc.slides[slideIndex]?.elements.find((item) => item.id === selection[0]) as TableElement | undefined
  if (!el) return null
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${el.cells[0].length}, minmax(0,1fr))` }}>
      {el.cells.map((row, r) =>
        row.map((cell, c) => (
          <input
            key={`${r}-${c}`}
            value={cell.text}
            onChange={(e) => {
              const cells = el.cells.map((row, ri) => row.map((cel, ci) => (ri === r && ci === c ? { ...cel, text: e.target.value } : cel)))
              updateElement(el.id, { cells } as Partial<TableElement>, 'تعديل جدول')
            }}
            className={cn(
              'h-7 w-full rounded border border-ink-750 bg-ink-850 px-1 text-[11px] outline-none focus:border-signal',
              r === 0 && 'font-semibold text-ink-100',
            )}
          />
        )),
      )}
    </div>
  )
}

function ChartInspection() {
  const doc = useDoc((s) => s.doc)
  const selection = useDoc((s) => s.selection)
  const updateSelected = useDoc((s) => s.updateSelected)
  const el = doc.slides[doc.slides.length ? useDoc.getState().slideIndex : 0]?.elements.find((item) => item.id === selection[0])
  if (!el || el.kind !== 'chart') return null
  return (
    <>
      <Section title="نوع المخطط">
        <Segmented
          size="sm"
          value={el.chart}
          onChange={(v) => updateSelected({ chart: v as never })}
          options={[
            { value: 'bar', label: 'أعمدة' },
            { value: 'barH', label: 'أفقي' },
            { value: 'line', label: 'خط' },
            { value: 'area', label: 'مساحة' },
            { value: 'pie', label: 'دائري' },
            { value: 'donut', label: 'حلقي' },
          ]}
        />
        <div className="mt-1 flex gap-1">
          <Chip active={el.legend} onClick={() => updateSelected({ legend: !el.legend })}>
            المفتاح
          </Chip>
          <Chip active={el.axis} onClick={() => updateSelected({ axis: !el.axis })}>
            المحاور
          </Chip>
          <Chip active={el.values} onClick={() => updateSelected({ values: !el.values })}>
            إظهار القيم
          </Chip>
        </div>
      </Section>
      <Section title="البيانات">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {el.categories.map((cat, i) => (
              <input
                key={`c${i}`}
                value={cat}
                onChange={(e) => {
                  const categories = el.categories.map((c, ci) => (ci === i ? e.target.value : c))
                  updateSelected({ categories })
                }}
                className="h-6 rounded border border-ink-750 bg-ink-850 px-1 text-[11px] outline-none focus:border-signal"
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => updateSelected({ categories: [...el.categories, `فئة ${el.categories.length + 1}`] })}
            className="w-full rounded-md border border-dashed border-ink-700 py-1.5 text-[11.5px] text-ink-300 hover:bg-ink-850"
          >
            إضافة فئة
          </button>
          {el.series.map((s, si) => (
            <div key={s.name} className="rounded-md border border-ink-800 p-1.5">
              <div className="mb-1 flex items-center gap-1">
                <input
                  value={s.name}
                  onChange={(e) => updateSelected({ series: el.series.map((x, xi) => (xi === si ? { ...x, name: e.target.value } : x)) })}
                  className="h-6 flex-1 rounded border border-ink-750 bg-ink-850 px-1 text-[11.5px] outline-none focus:border-signal"
                />
                {el.series.length > 1 ? (
                  <button
                    type="button"
                    title="حذف السلسلة"
                    onClick={() => updateSelected({ series: el.series.filter((_, xi) => xi !== si) })}
                    className="rounded p-1 text-ink-400 hover:bg-red-500/15 hover:text-red-300"
                  >
                    ×
                  </button>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-1">
                {el.categories.map((_, ci) => (
                  <input
                    key={ci}
                    type="number"
                    value={s.values[ci] ?? 0}
                    onChange={(e) => {
                      const values = el.categories.map((__, i2) => (i2 === ci ? Number(e.target.value) : s.values[i2] ?? 0))
                      updateSelected({ series: el.series.map((x, xi) => (xi === si ? { ...x, values } : x)) })
                    }}
                    className="h-6 w-14 rounded border border-ink-750 bg-ink-850 px-1 text-[11px] outline-none focus:border-signal"
                  />
                ))}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => updateSelected({ series: [...el.series, { name: `سلسلة ${el.series.length + 1}`, values: el.categories.map(() => Math.round(20 + Math.random() * 60)) }] })}
            className="w-full rounded-md border border-dashed border-ink-700 py-1.5 text-[11.5px] text-ink-300 hover:bg-ink-850"
          >
            إضافة سلسلة
          </button>
        </div>
      </Section>
      <Section title="الألوان">
        <div className="flex flex-wrap gap-1.5">
          {el.colors.map((c, i) => (
            <ColorField
              key={i}
              value={c}
              onChange={(v) => updateSelected({ colors: el.colors.map((x, xi) => (xi === i ? v : x)) })}
              label={`سلسلة ${i + 1}`}
            />
          ))}
        </div>
      </Section>
    </>
  )
}

function IconInspection({ element }: { element: AnyElement }) {
  const updateSelected = useDoc((s) => s.updateSelected)
  if (element.kind !== 'icon' && element.kind !== 'svg') return null
  return (
    <Section title="الأيقونة">
      <Field label="اللون">
        <ColorField value={element.kind === 'icon' ? element.color : undefined} onChange={(v) => updateSelected({ color: v } as Partial<AnyElement>)} />
      </Field>
      {element.kind === 'icon' ? (
        <>
          <Slider label="سماكة الخط" value={element.strokeWidth} min={0.5} max={4} step={0.25} onChange={(v) => updateSelected({ strokeWidth: v } as Partial<AnyElement>)} />
          <Switch checked={!!element.background} onChange={(v) => updateSelected({ background: v ? { type: 'solid', color: useDoc.getState().doc.theme.palette.surface } : undefined } as Partial<AnyElement>)} label="خلفية دائرية" />
          <div className="flex flex-wrap gap-1">
            {['fill', 'solid', 'surface', 'none'].map((k) => (
              <Chip key={k} onClick={() => updateSelected({ icon: k === 'fill' ? 'sparkles' : k === 'solid' ? 'square' : k === 'surface' ? 'layers' : 'circle' } as Partial<AnyElement>)}>
                {k === 'fill' ? 'لمعة' : k === 'solid' ? 'مربع' : k === 'surface' ? 'طبقات' : 'دائرة'}
              </Chip>
            ))}
          </div>
        </>
      ) : null}
    </Section>
  )
}

function LineInspection() {
  const doc = useDoc((s) => s.doc)
  const slideIndex = useDoc((s) => s.slideIndex)
  const updateSelected = useDoc((s) => s.updateSelected)
  const selection = useDoc((s) => s.selection)
  const el = doc.slides[slideIndex]?.elements.find((item) => item.id === selection[0])
  if (!el || el.kind !== 'line') return null
  const stroke = el.stroke
  return (
    <Section title="الخط">
      <Field label="اللون">
        <ColorField value={stroke.color} onChange={(v) => updateSelected({ stroke: { ...stroke, color: v } } as Partial<AnyElement>)} />
      </Field>
      <Field label="السماكة">
        <NumberField value={stroke.width} min={0.5} max={40} step={0.5} onChange={(v) => updateSelected({ stroke: { ...stroke, width: v } } as Partial<AnyElement>)} compact suffix="px" />
      </Field>
      <Field label="النمط">
        <Segmented
          size="sm"
          value={stroke.dash ?? 'solid'}
          onChange={(v) => updateSelected({ stroke: { ...stroke, dash: v as never } } as Partial<AnyElement>)}
          options={[
            { value: 'solid', label: 'متصل' },
            { value: 'dashed', label: 'متقطع' },
            { value: 'dotted', label: 'منقّط' },
          ]}
        />
      </Field>
      <Field label="نهاية البداية">
        <Select
          value={el.startArrow ?? 'none'}
          onChange={(v) => updateSelected({ startArrow: v as never } as Partial<AnyElement>)}
          options={ARROW_OPTIONS}
        />
      </Field>
      <Field label="نهاية الطرف">
        <Select value={el.endArrow ?? 'none'} onChange={(v) => updateSelected({ endArrow: v as never } as Partial<AnyElement>)} options={ARROW_OPTIONS} />
      </Field>
      <Slider label="انحناء" value={Math.round(el.curvature * 100)} min={0} max={100} suffix="٪" onChange={(v) => updateSelected({ curvature: v / 100 } as Partial<AnyElement>)} />
    </Section>
  )
}

const ARROW_OPTIONS = [
  { value: 'none', label: 'بدون' },
  { value: 'arrow', label: 'سهم' },
  { value: 'triangle', label: 'مثلث' },
  { value: 'diamond', label: 'معين' },
  { value: 'oval', label: 'نقطة' },
]

function FrameInspection() {
  return (
    <Section title="الإطار">
      <p className="text-[11.5px] leading-relaxed text-ink-400">الأطار يقصّ ما يجاوزه ويحرّك عناصره معه. أدرج عناصر داخله بالسحب فوقه في لوحة الطبقات.</p>
    </Section>
  )
}

function VideoInspection() {
  return (
    <Section title="الفيديو">
      <p className="text-[11.5px] leading-relaxed text-ink-400">يعمل التشغيل داخل المحرر ووضع العرض. عند التصدير إلى PPTX يُرفق الملف إن كان بحجم مناسب، وإلا يبقى كرابط.</p>
    </Section>
  )
}

/* ------------------------------------------------------------------ design */

function DesignTab() {
  const doc = useDoc((s) => s.doc)
  const slideIndex = useDoc((s) => s.slideIndex)
  const applyTheme = useDoc((s) => s.applyTheme)
  const updateTheme = useDoc((s) => s.updateTheme)
  const applyLayout = useDoc((s) => s.applyLayout)
  const setSlideBackground = useDoc((s) => s.setSlideBackground)
  const setBackgroundForAll = useDoc((s) => s.setBackgroundForAll)
  const slide = doc.slides[slideIndex]
  const [editingPalette, setEditingPalette] = useState(false)

  return (
    <div>
      <Section title="التخطيط" right={<span className="text-[10px] text-ink-500">غير مدمّر</span>}>
        <div className="grid grid-cols-2 gap-1.5">
          {LAYOUTS.map((layout) => (
            <button
              key={layout.id}
              type="button"
              onClick={() => {
                applyLayout(layout)
                toast({ kind: 'success', title: `طُبِّق تخطيط ${layout.name}`, body: 'النصوص والأشكال بقيت، والمواضع أُعيد ترتيبها.', action: { label: 'تراجع', run: () => useDoc.getState().undo() } })
              }}
              className={cn(
                'rounded-md border p-1.5 text-start transition-colors',
                slide.layoutId === layout.id ? 'border-signal/60 bg-signal/10' : 'border-ink-750 hover:border-ink-600 hover:bg-ink-850',
              )}
            >
              <span className="block truncate text-[11.5px] text-ink-100">{layout.name}</span>
              <span className="mt-0.5 block truncate text-[10px] text-ink-500">{layout.hint}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="السمة">
        <div className="grid grid-cols-4 gap-1.5">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              title={preset.name}
              onClick={() => {
                applyTheme(preset.theme)
                toast({ kind: 'success', title: `طُبِّقت سمة ${preset.name}`, body: 'الألوان والخطوط في كل العرض.' })
              }}
              className={cn('overflow-hidden rounded-md border transition-transform hover:-translate-y-0.5', doc.theme.id === preset.id ? 'border-signal' : 'border-ink-750')}
            >
              <span className="flex h-9 w-full items-end gap-px p-1" style={{ background: preset.theme.palette.background }}>
                <i className="size-2.5 rounded-full" style={{ background: preset.theme.palette.primary }} />
                <i className="size-2.5 rounded-full" style={{ background: preset.theme.palette.secondary }} />
                <i className="size-2.5 rounded-full" style={{ background: preset.theme.palette.accent }} />
              </span>
              <span className="block truncate px-1 py-0.5 text-[9.5px] text-ink-400">{preset.name}</span>
            </button>
          ))}
        </div>
        <Row className="pt-1">
          <Chip active={editingPalette} onClick={() => setEditingPalette((v) => !v)}>
            {editingPalette ? 'إخفاء التحرير' : 'تحرير الألوان'}
          </Chip>
          <Select
            className="ms-auto w-32"
            value={doc.theme.style}
            onChange={(v) => updateTheme((t) => void (t.style = v as Theme['style']))}
            options={[
              { value: 'flat', label: 'مسطح' },
              { value: 'soft', label: 'ناعم' },
              { value: 'bold', label: 'جريء' },
              { value: 'editorial', label: 'تحريري' },
              { value: 'minimal', label: 'بسيط' },
              { value: 'glass', label: 'زجاجي' },
            ]}
          />
        </Row>
        {editingPalette ? (
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {(Object.keys(doc.theme.palette) as (keyof Theme['palette'])[]).map((key) => (
              <Field key={key} label={PALETTE_LABEL[key]}>
                <ColorField value={doc.theme.palette[key]} onChange={(v) => updateTheme((t) => void (t.palette[key] = v))} />
              </Field>
            ))}
          </div>
        ) : null}
      </Section>

      <Section title="الخطوط">
        <Field label="العناوين">
          <Select value={doc.theme.fonts.heading} onChange={(v) => updateTheme((t) => void (t.fonts.heading = v))} options={FONTS.map((f) => ({ value: f.id, label: f.label }))} />
        </Field>
        <Field label="النص">
          <Select value={doc.theme.fonts.body} onChange={(v) => updateTheme((t) => void (t.fonts.body = v))} options={FONTS.map((f) => ({ value: f.id, label: f.label }))} />
        </Field>
        <Row>
          <Field label="وزن العناوين">
            <NumberField value={doc.theme.headingWeight} min={300} max={900} step={100} onChange={(v) => updateTheme((t) => void (t.headingWeight = v))} compact />
          </Field>
          <Field label="أحرف كبيرة">
            <Segmented
              size="sm"
              value={doc.theme.headingTransform}
              onChange={(v) => updateTheme((t) => void (t.headingTransform = v as Theme['headingTransform']))}
              options={[
                { value: 'none', label: 'لا' },
                { value: 'uppercase', label: 'Aa' },
                { value: 'capitalize', label: 'Ab' },
              ]}
            />
          </Field>
        </Row>
        <Slider label="الاستدارة" value={doc.theme.radius} min={0} max={32} onChange={(v) => updateTheme((t) => void (t.radius = v))} />
        <Slider label="الهامش الداخلي" value={doc.theme.spacing} min={24} max={160} suffix="px" onChange={(v) => updateTheme((t) => void (t.spacing = v))} />
      </Section>

      <Section title="خلفية الشريحة">
        <BackgroundEditor value={slide.background} onApply={(bg) => setSlideBackground(bg)} onApplyAll={(bg) => setBackgroundForAll(bg)} />
      </Section>

      <Section title="قالب وعلامة تجارية" defaultOpen={false}>
        <div className="flex flex-wrap gap-1">
          <Button size="sm" variant="surface" onClick={() => useUI.getState().setLeftPanel('templates')}>
            استكشاف القوالب
          </Button>
          <Button size="sm" variant="surface" onClick={() => useUI.getState().setRightPanel('brand')}>
            العلامة التجارية
          </Button>
        </div>
      </Section>
    </div>
  )
}

const PALETTE_LABEL: Record<string, string> = {
  primary: 'أساسي',
  secondary: 'ثانوي',
  accent: 'ميّز',
  background: 'الخلفية',
  surface: 'سطح',
  text: 'نص',
  textMuted: 'نص خافت',
  onPrimary: 'على الأساسي',
  success: 'نجاح',
  warning: 'تحذير',
}

function BackgroundEditor({ value, onApply, onApplyAll }: { value: Slide['background']; onApply: (bg: Slide['background']) => void; onApplyAll: (bg: Slide['background']) => void }) {
  const doc = useDoc((s) => s.doc)
  const [mode, setMode] = useState(value.type)
  const patch = (next: Slide['background']) => onApply(next)
  return (
    <div className="space-y-2">
      <Segmented
        size="sm"
        value={mode}
        onChange={(v) => {
          setMode(v as never)
          if (v === 'none') patch({ type: 'none' })
          if (v === 'solid') patch({ type: 'solid', color: doc.theme.palette.background })
          if (v === 'gradient') patch({ type: 'gradient', color: doc.theme.palette.background, gradient: { angle: 135, kind: 'linear', stops: [{ pos: 0, color: doc.theme.palette.primary }, { pos: 100, color: doc.theme.palette.secondary }] } })
          if (v === 'pattern') patch({ type: 'pattern', color: doc.theme.palette.primary, patternColor: doc.theme.palette.background, pattern: 'diagonal' })
        }}
        options={[
          { value: 'none', label: 'بلا' },
          { value: 'solid', label: 'لون' },
          { value: 'gradient', label: 'تدرج' },
          { value: 'pattern', label: 'نمط' },
          { value: 'image', label: 'صورة' },
        ]}
      />
      {value.type === 'solid' ? (
        <Row>
          <ColorField value={value.color} onChange={(v) => patch({ type: 'solid', color: v })} />
          <Button size="sm" variant="ghost" onClick={() => onApplyAll({ type: 'solid', color: value.color ?? '#ffffff' })}>
            لكل الشرائح
          </Button>
        </Row>
      ) : null}
      {value.type === 'gradient' && value.gradient ? (
        <div className="space-y-2">
          <Row>
            <ColorField value={value.gradient.stops[0]?.color} onChange={(v) => patch({ ...value, gradient: { ...value.gradient!, stops: [{ pos: 0, color: v }, value.gradient!.stops[1] ?? { pos: 100, color: v }] } })} />
            <ColorField value={value.gradient.stops[1]?.color} onChange={(v) => patch({ ...value, gradient: { ...value.gradient!, stops: [value.gradient!.stops[0] ?? { pos: 0, color: v }, { pos: 100, color: v }] } })} />
          </Row>
          <Slider label="الزاوية" value={value.gradient.angle} min={0} max={360} suffix="°" onChange={(v) => patch({ ...value, gradient: { ...value.gradient!, angle: v } })} />
          <Segmented
            size="sm"
            value={value.gradient.kind}
            onChange={(v) => patch({ ...value, gradient: { ...value.gradient!, kind: v as 'linear' | 'radial' } })}
            options={[
              { value: 'linear', label: 'خطي' },
              { value: 'radial', label: 'شعاعي' },
            ]}
          />
        </div>
      ) : null}
      {value.type === 'pattern' ? (
        <Row>
          <Select
            value={value.pattern ?? 'diagonal'}
            onChange={(v) => patch({ ...value, pattern: v as never })}
            options={[
              { value: 'diagonal', label: 'قطري' },
              { value: 'dots', label: 'نقاط' },
              { value: 'grid', label: 'شبكة' },
              { value: 'cross', label: 'تقاطع' },
            ]}
          />
          <ColorField value={value.color} onChange={(v) => patch({ ...value, color: v })} />
        </Row>
      ) : null}
      {value.type === 'image' ? (
        <p className="text-[11px] leading-relaxed text-ink-500">اختر صورة من لوحة «صور» ثم اسحبها إلى الشريحة لتصبح خلفية، أو ارفع صورة جديدة.</p>
      ) : null}
      {mode === 'image' && value.type !== 'image' ? (
        <p className="text-[11px] text-ink-500">أفلت صورة على الشريحة لتعيينها خلفية — أو استخدم «ملء الشريحة» من قائمة الصورة.</p>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ animate / transition / notes */

function AnimateTab() {
  const slide = useDoc((s) => s.doc.slides[s.slideIndex])
  const selection = useDoc((s) => s.selection)
  const targets = selection.filter((id) => slide?.elements.some((e) => e.id === id))
  const targetSet = new Set(targets)
  const ownAnims = (slide?.animations ?? []).filter((a) => targetSet.has(a.target))

  const openStudio = () => window.dispatchEvent(new CustomEvent('aurova:anim-open'))

  const removeAnim = (id: string) => {
    if (!slide) return
    useDoc.getState().updateSlide(
      slide.id,
      (s) => {
        s.animations = (s.animations ?? []).filter((a) => a.id !== id)
      },
      'حذف الحركة',
    )
  }
  const duplicateAnim = (id: string) => {
    if (!slide) return
    const src = slide.animations?.find((a) => a.id === id)
    if (!src) return
    useDoc.getState().updateSlide(
      slide.id,
      (s) => {
        s.animations ??= []
        s.animations.push(cloneAnim(src, src.target))
      },
      'نسخ الحركة',
    )
    toast({ kind: 'success', title: 'نُسخت الحركة' })
  }

  return (
    <div className="space-y-3 py-1">
      <Section title={selection.length > 1 ? `تحريك التحديد (${selection.length})` : 'مكتبة الحركات'}>
        {!slide?.elements.length ? (
          <p className="text-[12px] leading-relaxed text-ink-400">أضف عناصر إلى الشريحة أولًا.</p>
        ) : (
          <>
            {!selection.length ? (
              <p className="mb-2 rounded-lg border border-dashed border-ink-700 px-2.5 py-2 text-[11px] leading-relaxed text-ink-400">
                حدد عنصرًا واحدًا أو أكثر — نص، صورة، شكل، أيقونة، مخطط، جدول، أو مجموعة — ثم اختر حركة. تُطبَّق فورًا مع معاينة على اللوحة.
              </p>
            ) : null}
            <AnimationLibrary targets={targets} />
          </>
        )}
      </Section>

      {ownAnims.length ? (
        <Section title={`حركات العنصر المحدد (${ownAnims.length})`}>
          <div className="space-y-1">
            {ownAnims.map((a, i) => {
              const el = slide?.elements.find((x) => x.id === a.target)
              return (
                <div key={a.id} className="flex items-center gap-1.5 rounded-lg border border-ink-750 bg-ink-900/50 px-2 py-1.5">
                  <span className="grid size-6 shrink-0 place-items-center rounded-md bg-signal-dim font-mono text-[10px] text-signal-soft">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11.5px] font-semibold text-ink-100">{a.name ?? a.kind}</p>
                    <p className="truncate text-[10px] text-ink-500">
                      {el?.name ?? el?.kind} · {(a.duration / 1000).toFixed(1)}s{a.delay ? ` · +${(a.delay / 1000).toFixed(1)}s` : ''}
                      {a.start === 'onClick' ? ' · بالنقر' : a.start === 'after' ? ' · بعد السابقة' : ''}
                    </p>
                  </div>
                  <button type="button" onClick={() => slide && previewOnCanvas(slide, { onlyIds: [a.id] })} className="grid size-6 place-items-center rounded-md text-ink-400 hover:bg-ink-800 hover:text-signal-soft" title="معاينة">
                    <Play size={11} />
                  </button>
                  <button type="button" onClick={() => duplicateAnim(a.id)} className="grid size-6 place-items-center rounded-md text-ink-400 hover:bg-ink-800" title="نسخ">
                    <Copy size={11} />
                  </button>
                  <button type="button" onClick={() => removeAnim(a.id)} className="grid size-6 place-items-center rounded-md text-ink-400 hover:bg-signal-dim hover:text-signal-soft" title="حذف">
                    <Trash2 size={11} />
                  </button>
                </div>
              )
            })}
          </div>
        </Section>
      ) : null}

      <Button size="sm" variant="surface" className="w-full" onClick={openStudio}>
        <Spline size={13} /> فتح استوديو الحركة (Timeline + Keyframes)
      </Button>
    </div>
  )
}

function TransitionTab() {
  const doc = useDoc((s) => s.doc)
  const slide = doc.slides[useDoc.getState().slideIndex]
  const setSlideTransition = useDoc((s) => s.setSlideTransition)
  const t = slide.transition
  return (
    <div>
      <Section title="انتقال الشريحة">
        <Segmented
          size="sm"
          value={t.type}
          onChange={(v) => setSlideTransition({ type: v as never })}
          options={[
            { value: 'none', label: 'بلا' },
            { value: 'fade', label: 'تلاشٍ' },
            { value: 'slide', label: 'انزلاق' },
            { value: 'push', label: 'دفع' },
            { value: 'zoom', label: 'تكبير' },
            { value: 'morph', label: 'Morph' },
          ]}
        />
        {t.type === 'morph' ? (
          <p className="rounded-lg border border-fuchsia-500/25 bg-fuchsia-500/5 px-2.5 py-2 text-[11px] leading-relaxed text-ink-300">
            Morph يطابق عناصر الشريحة الحالية مع التالية (نفس المعرف أو الاسم) ويحرّكها بين موضعيها تلقائيًا — كرّر الشريحة وعدّلها لنتيجة مثالية. يعمل أثناء الانتقال إلى هذه الشريحة في وضع العرض.
          </p>
        ) : null}
        <Slider label="المدة" value={t.duration} min={0} max={2000} step={50} suffix="م.ث" onChange={(v) => setSlideTransition({ duration: v })} />
        {t.type === 'slide' || t.type === 'push' ? (
          <Field label="الاتجاه">
            <Segmented
              size="sm"
              value={t.direction ?? 'right'}
              onChange={(v) => setSlideTransition({ direction: v as never })}
              options={[
                { value: 'left', label: 'يسار' },
                { value: 'right', label: 'يمين' },
                { value: 'up', label: 'أعلى' },
                { value: 'down', label: 'أسفل' },
              ]}
            />
          </Field>
        ) : null}
        <Button
          size="sm"
          variant="ghost"
          className="w-full"
          onClick={() => {
            useDoc.getState().mutate((d) => d.slides.forEach((s) => (s.transition = { ...t })), 'تطبيق الانتقال على الكل')
            toast({ kind: 'success', title: 'طُبِّق على كل الشرائح' })
          }}
        >
          تطبيق على كل الشرائح
        </Button>
      </Section>
    </div>
  )
}

function NotesTab() {
  const doc = useDoc((s) => s.doc)
  const slideIndex = useDoc((s) => s.slideIndex)
  const setNotes = useDoc((s) => s.setNotes)
  const slide = doc.slides[slideIndex]
  const words = wordsOf(slide?.elements ?? [])
  const minutes = Math.max(1, Math.round(words / 130))
  return (
    <div className="flex h-full flex-col p-3">
      <div className="mb-2 flex items-center justify-between text-[11px] text-ink-400">
        <span>
          شريحة {slideIndex + 1} · {words} كلمة
        </span>
        <span>≈ {minutes} دقيقة إلقاء</span>
      </div>
      <textarea
        key={slide?.id}
        defaultValue={slide?.notes ?? ''}
        onChange={(e) => setNotes(e.target.value)}
        onKeyDown={(e) => e.stopPropagation()}
        placeholder="ما الذي تقوله في هذه الشريحة؟ اكتب جملة واحدة واضحة إن أردت إلقاءً أفضل."
        className="panel-x min-h-0 flex-1 resize-none rounded-lg border border-ink-750 bg-ink-850 p-2.5 text-[12.5px] leading-relaxed text-ink-100 outline-none placeholder:text-ink-500 focus:border-signal"
      />
      <Button
        size="sm"
        variant="subtle"
        className="mt-2 w-full"
        onClick={() => {
          const generated = autoNotes(slide ?? { elements: [] })
          setNotes(generated)
          toast({ kind: 'ai', title: 'مقترح ملاحظات', body: 'مبني على محتوى الشريحة — عدّله كما تريد.' })
        }}
      >
        <Wand2 size={13} /> اقتراح ملاحظات
      </Button>
    </div>
  )
}

function wordsOf(elements: AnyElement[]): number {
  return elements.reduce((n, el) => {
    if (el.kind === 'text') return n + plain(el.content).split(/\s+/).filter(Boolean).length
    if (el.kind === 'shape' && el.text) return n + el.text.split(/\s+/).filter(Boolean).length
    return n
  }, 0)
}

function autoNotes(slide: { elements?: AnyElement[] }): string {
  const texts = (slide.elements ?? []).filter((el) => el.kind === 'text').map((el) => plain((el as TextElement).content).split('\n')[0]).filter(Boolean)
  if (!texts.length) return 'اشرح الفكرة الأساسية، ثم أعطِ مثالًا واحدًا ملموسًا.'
  const [first, second] = texts
  return [`افتتح بـ: ${first}`, second ? `ادعمها بـ: ${second}` : '', 'اختم بجملة واحدة يريد الجمهور تذكّرها.'].filter(Boolean).join('\n')
}

/* ------------------------------------------------------------------ AI */

function AiTab() {
  const doc = useDoc((s) => s.doc)
  const slideIndex = useDoc((s) => s.slideIndex)
  const [busy, setBusy] = useState<string | null>(null)
  const review = useReview()

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label)
    try {
      await fn()
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-2 p-3">
      <Section title="مراجعة التصميم">
        <p className="text-[11.5px] leading-relaxed text-ink-400">
          فحص محلي فوري (بدون إرسال بياناتك لأي مكان): تباين الألوان، طول النصوص، المحاذاة، التسلسل الهرمي، اتساق الخطوط.
        </p>
        {review.issues.length ? (
          <ul className="space-y-1.5">
            {review.issues.slice(0, 12).map((issue, i) => (
              <li key={i} className={cn('rounded-md border p-2 text-[11.5px] leading-relaxed', SEVERITY[issue.severity].border)}>
                <div className="flex items-start gap-1.5">
                  <span className={cn('mt-1 size-1.5 shrink-0 rounded-full', SEVERITY[issue.severity].dot)} />
                  <div className="min-w-0 flex-1">
                    <p className="text-ink-100">
                      {SEVERITY[issue.severity].label} · شريحة {issue.slide + 1}
                    </p>
                    <p className="mt-0.5 text-ink-400">{issue.message}</p>
                    <div className="mt-1 flex gap-1">
                      <button type="button" className="rounded border border-ink-700 px-1.5 py-0.5 text-[10.5px] text-ink-200 hover:bg-ink-800" onClick={() => useDoc.getState().gotoSlide(issue.slide)}>
                        الانتقال
                      </button>
                      {issue.fix ? (
                        <button
                          type="button"
                          className="rounded border border-ai/40 bg-ai/15 px-1.5 py-0.5 text-[10.5px] text-[#cfc6ff] hover:bg-ai/25"
                          onClick={() => issue.fix?.()}
                        >
                          إصلاح
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="flex items-center gap-1.5 rounded-md border border-good/30 bg-good/10 p-2 text-[12px] text-good">
            <Check size={13} /> لا ملاحظات — التصميم متسق.
          </p>
        )}
        <Button size="sm" variant="subtle" className="w-full" onClick={review.scan} disabled={busy !== null}>
          إعادة الفحص
        </Button>
      </Section>

      <Section title="هذه الشريحة">
        <div className="grid gap-1.5">
          <Button
            size="sm"
            variant="surface"
            disabled={busy !== null}
            onClick={() =>
              run('تحسين', async () => {
                const { improveSlideDesign } = await import('../services/ai/refine')
                const count = improveSlideDesign(doc.slides[slideIndex])
                toast({ kind: 'ai', title: 'حُسِّنت الشريحة', body: count ? `${count} تعديل على التباعد والمحاذاة` : 'الشريحة مضبوطة بالفعل.' })
              })
            }
          >
            <Wand2 size={13} /> تحسين التصميم
          </Button>
          <Button
            size="sm"
            variant="surface"
            disabled={busy !== null}
            onClick={() =>
              run('توزيع', async () => {
                const { balanceSlide } = await import('../services/ai/refine')
                const note = balanceSlide(doc.slides[slideIndex])
                toast({ kind: 'ai', title: 'توزيع متوازن', body: note })
              })
            }
          >
            <Contrast size={13} /> توزيع متوازن
          </Button>
          <Button
            size="sm"
            variant="surface"
            disabled={busy !== null}
            onClick={() =>
              run('تخطيط', async () => {
                const { suggestLayout } = await import('../services/ai/refine')
                const suggestion = suggestLayout(doc.slides[slideIndex], doc)
                if (!suggestion) {
                  toast({ kind: 'ai', title: 'التخطيط الحالي مناسب', body: 'لا يوجد تخطيط يخدم المحتوى أكثر.' })
                  return
                }
                toast({
                  kind: 'ai',
                  title: `تقترح «${suggestion.layout.name}»`,
                  body: suggestion.reason,
                  action: { label: 'تطبيق', run: () => useDoc.getState().applyLayout(suggestion.layout) },
                })
              })
            }
          >
            <Palette size={13} /> اقتراح تخطيط
          </Button>
        </div>
      </Section>

      <Section title="النص المحدد">
        <div className="flex flex-wrap gap-1">
          {(['improve', 'shorten', 'formal', 'title'] as const).map((op) => (
            <AiChip key={op} id={useDoc.getState().selection[0] ?? ''} op={op} label={AI_OP_LABEL[op]} />
          ))}
        </div>
        <p className="text-[11px] leading-relaxed text-ink-500">
          المحسِّن يعمل محليًا على إعادة صياغة الجمل الطويلة وحشو الكلمات. عند ضبط مزوّد ذكاء اصطناعي في الإعدادات تُستخدمواجهته بدلًا من ذلك.
        </p>
        <Button size="sm" variant="ghost" className="w-full" onClick={() => useUI.getState().openDialog('ai-settings')}>
          <Link2 size={13} /> إعدادات الذكاء
        </Button>
      </Section>
    </div>
  )
}

const AI_OP_LABEL: Record<string, string> = {
  improve: 'تحسين الصياغة',
  shorten: 'اختصار',
  formal: 'أكثر رسمية',
  title: 'اقتراح عنوان',
}

function AiChip({ id, op, label }: { id: string; op: 'improve' | 'shorten' | 'formal' | 'title'; label: string }) {
  const [busy, setBusy] = useState(false)
  return (
    <Chip
      onClick={async () => {
        if (!id) {
          toast({ kind: 'info', title: 'حدّد نصًا أولًا' })
          return
        }
        setBusy(true)
        try {
          const { rewriteText } = await import('../services/ai/refine')
          const res = await rewriteText(id, op)
          toast({ kind: res.changed ? 'ai' : 'info', title: res.changed ? res.title : 'لا تغيير مطلوب', body: res.detail })
        } finally {
          setBusy(false)
        }
      }}
      title={busy ? 'جارٍ المعالجة…' : label}
    >
      {busy ? '…' : label}
    </Chip>
  )
}

/** Live WCAG feedback next to the color picker — the detail that makes a deck readable in a bright room. */
function ContrastNote({ fg, bg }: { fg: string; bg: string }) {
  const ratio = contrastRatio(fg, bg)
  const pass = ratio >= 4.5
  const weak = ratio >= 3
  const tone = pass ? 'border-good/30 bg-good/10 text-good' : weak ? 'border-warn/30 bg-warn/10 text-warn' : 'border-red-500/30 bg-red-500/10 text-red-300'
  return (
    <div className={cn('flex items-center justify-between rounded-md border px-2 py-1.5 text-[11px]', tone)}>
      <span className="font-mono">{ratio.toFixed(2)}:1</span>
      <span className="text-ink-300">{pass ? 'تباين جيد' : weak ? 'للعناوين الكبيرة فقط' : 'ضعيف — يصعب قراءته'}</span>
    </div>
  )
}

function Toggle({ on, onClick, children, title }: { on: boolean; onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        'grid h-7 w-7 place-items-center rounded-md border transition-colors',
        on ? 'border-signal/60 bg-signal/15 text-signal-soft' : 'border-ink-700 text-ink-300 hover:bg-ink-800 hover:text-ink-50',
      )}
    >
      {children}
    </button>
  )
}

function JoinIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 6h18M3 12h12M3 18h18" />
    </svg>
  )
}

/** Deck review is pure logic in a service so the same rules can be reused by the CLI/tests. */
function useReview() {
  const doc = useDoc((s) => s.doc)
  const [issues, setIssues] = useState<ReviewIssue[]>([])
  const scan = useCallback(async () => {
    const { reviewDeck } = await import('../services/ai/review')
    setIssues(reviewDeck(doc))
  }, [doc])
  useEffect(() => {
    void scan()
  }, [scan])
  return { issues, scan }
}

export interface ReviewIssue {
  slide: number
  severity: 'error' | 'warn' | 'info'
  message: string
  fix?: () => void
}

const SEVERITY: Record<string, { label: string; border: string; dot: string }> = {
  error: { label: 'يحتاج انتباه', border: 'border-red-500/25 bg-red-500/8', dot: 'bg-red-400' },
  warn: { label: 'تحسين مقترح', border: 'border-warn/25 bg-warn/8', dot: 'bg-warn' },
  info: { label: 'ملاحظة', border: 'border-ink-700 bg-ink-850', dot: 'bg-ink-400' },
}
