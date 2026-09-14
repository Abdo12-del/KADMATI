/**
 * Brand Kit — the one place colors/fonts/logo are decided, applied deck-wide in a click.
 * Kits are stored as real `BrandKit` records and consumed by `useDoc.applyBrandKit`, so an applied
 * kit changes actual element colors and fonts, not just a preview.
 */
import { useMemo, useRef, useState } from 'react'
import { Check, Plus, Sparkles, Trash2, Upload } from 'lucide-react'
import { Button, Chip, ColorField, Field, Row, Section, Select, TextField } from '../components/ui'
import { useLibrary } from '../store/useLibrary'
import { useDoc } from '../store/useDoc'
import { toast } from '../store/useUI'
import { fileToDataUrl } from '../store/storage'
import { createAsset, newId } from '../document/factory'
import { FONTS } from '../lib/fonts'
import { readableOn, relLuminance } from '../lib/colors'
import { cn } from '../lib/cn'
import type { BrandKit, ThemePalette } from '../document/types'

const ROLE_LABEL: Record<keyof ThemePalette, string> = {
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

const ROLE_ORDER = Object.keys(ROLE_LABEL) as (keyof ThemePalette)[]

export function BrandPane() {
  const kits = useLibrary((s) => s.brandKits)
  const doc = useDoc((s) => s.doc)
  const library = useLibrary()
  const [activeId, setActiveId] = useState<string | null>(kits[0]?.id ?? null)
  const [draft, setDraft] = useState<BrandKit>(() => kits[0] ?? emptyKit(doc.theme.palette, doc.theme.fonts))
  const file = useRef<HTMLInputElement>(null)

  const select = (kit: BrandKit) => {
    setActiveId(kit.id)
    setDraft(kit)
  }

  const apply = () => {
    if (!useDoc.getState().projectId) {
      toast({ kind: 'info', title: 'افتح عرضًا لتطبيق العلامة', body: 'العلامة تُطبَّق على عرض مفتوح في المحرر — أو أنشئ عرضًا جديدًا أولًا.' })
      return
    }
    useDoc.getState().applyBrandKit(draft)
    toast({
      kind: 'success',
      title: `طُبِّقت «${draft.name}»`,
      body: 'الألوان والخطوط في كل الشرائح، وكل عرضك محفوظ.',
      action: { label: 'تراجع', run: () => useDoc.getState().undo() },
    })
  }

  const uploadLogo = async (f?: File | null) => {
    if (!f) return
    try {
      const shot = await fileToDataUrl(f, { maxSide: 512 })
      const asset = createAsset({ name: f.name, mime: f.type || 'image/png', kind: 'image', src: shot.src, w: shot.w, h: shot.h, bytes: shot.bytes })
      useDoc.getState().addAsset(asset)
      setDraft({ ...draft, logoAssetId: asset.id })
      toast({ kind: 'success', title: 'رُفع الشعار', body: 'يُستخدم في الشرائح ويُصدَّر مع العرض.' })
    } catch {
      toast({ kind: 'error', title: 'تعذّرت قراءة الشعار', body: 'جرّب PNG شفاف الخلفية.' })
    }
  }

  const save = async () => {
    const next = { ...draft, updatedAt: Date.now() }
    await library.upsertBrandKit(next)
    setActiveId(next.id)
    toast({ kind: 'success', title: 'حُفظت العلامة', body: 'متاحة في كل عروض هذا الجهاز.' })
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[250px_1fr]">
      <div>
        <Row className="mb-2 justify-between">
          <h2 className="text-[14px] font-semibold">العلامات</h2>
          <Button
            size="sm"
            variant="subtle"
            onClick={() => {
              const kit = emptyKit(doc.theme.palette, doc.theme.fonts)
              void library.upsertBrandKit(kit)
              select(kit)
              toast({ kind: 'success', title: 'أُنشئت علامة جديدة', body: 'عدّل الألوان والخطوط ثم احفظ.' })
            }}
          >
            <Plus size={12} /> جديدة
          </Button>
        </Row>
        <div className="space-y-1.5">
          {kits.map((kit) => (
            <button
              key={kit.id}
              type="button"
              onClick={() => select(kit)}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-start transition-colors',
                activeId === kit.id ? 'border-signal/50 bg-signal/8' : 'border-ink-800 bg-ink-900/50 hover:border-ink-600',
              )}
            >
              <span className="flex shrink-0 gap-0.5">
                {[kit.colors.primary, kit.colors.secondary, kit.colors.accent, kit.colors.success].map((c) => (
                  <i key={c} className="size-3.5 rounded-[4px] ring-1 ring-ink-900" style={{ background: c }} />
                ))}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] font-medium text-ink-50">{kit.name}</span>
                <span className="mt-0.5 block truncate text-[11px] text-ink-500">{kit.tagline || kit.fonts.heading}</span>
              </span>
              {doc.brandKitId === kit.id ? <Check size={13} className="shrink-0 text-good" /> : null}
            </button>
          ))}
          {!kits.length ? (
            <p className="rounded-xl border border-dashed border-ink-700 p-3 text-[11.5px] leading-relaxed text-ink-500">
              لا علامات بعد. أنشئ واحدة بألوان جهتك وخطيها، ثم طبّقها على أي عرض بضغطة — وستجدها أيضًا في لوحة التصميم داخل المحرر.
            </p>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-ink-800 bg-ink-900/40">
        <div className="flex flex-wrap items-center gap-2 border-b border-ink-800 px-4 py-3">
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="min-w-0 flex-1 bg-transparent font-display text-[15px] font-semibold text-ink-50 outline-none placeholder:text-ink-600"
            placeholder="اسم العلامة"
          />
          <Button size="sm" variant="primary" onClick={() => void save()}>
            حفظ
          </Button>
          <Button
            size="sm"
            variant="danger"
            disabled={!activeId}
            onClick={() => {
              if (!activeId) return
              void library.removeBrandKit(activeId)
              setActiveId(null)
              toast({ kind: 'success', title: 'حُذفت العلامة' })
            }}
          >
            <Trash2 size={12} /> حذف
          </Button>
        </div>

        <div className="grid gap-4 p-4 md:grid-cols-2">
          <Section title="اللوحة اللونية">
            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
              {ROLE_ORDER.map((role) => (
                <ColorField
                  key={role}
                  label={ROLE_LABEL[role]}
                  value={draft.colors[role]}
                  onChange={(v) => setDraft({ ...draft, colors: { ...draft.colors, [role]: v } })}
                />
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Chip
                onClick={() =>
                  setDraft({
                    ...draft,
                    colors: derivePalette(draft.colors.primary, draft.colors.secondary),
                  })
                }
              >
                توليد لوحة من اللون الأساسي
              </Chip>
              <Chip onClick={() => setDraft({ ...draft, colors: doc.theme.palette })}>استخدام سمة العرض الحالي</Chip>
            </div>
          </Section>

          <Section title="الخطوط والشعار">
            <Field label="العناوين">
              <Select value={draft.fonts.heading} onChange={(v) => setDraft({ ...draft, fonts: { ...draft.fonts, heading: v } })} options={FONTS.map((f) => ({ value: f.id, label: f.label }))} />
            </Field>
            <Field label="النص">
              <Select value={draft.fonts.body} onChange={(v) => setDraft({ ...draft, fonts: { ...draft.fonts, body: v } })} options={FONTS.map((f) => ({ value: f.id, label: f.label }))} />
            </Field>
            <Field label="شعار">
              <div className="flex items-center gap-2">
                <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-ink-700 bg-ink-950">
                  {draft.logoAssetId && doc.assets[draft.logoAssetId] ? (
                    <img src={doc.assets[draft.logoAssetId]!.src} alt="" className="size-full object-contain p-0.5" />
                  ) : (
                    <span className="text-[9px] text-ink-500">لا ملف</span>
                  )}
                </div>
                <Button size="sm" variant="surface" onClick={() => file.current?.click()}>
                  <Upload size={12} /> رفع
                </Button>
                {draft.logoAssetId ? <Chip onClick={() => setDraft({ ...draft, logoAssetId: undefined })}>إزالة</Chip> : null}
                <input ref={file} type="file" accept="image/*" className="hidden" onChange={(e) => void uploadLogo(e.target.files?.[0])} />
              </div>
            </Field>
            <Field label="عبارة">
              <TextField value={draft.tagline ?? ''} onChange={(v) => setDraft({ ...draft, tagline: v })} placeholder="مثل: الوضوح قبل الزخرفة" />
            </Field>
            <p className="text-[11px] leading-relaxed text-ink-500">الشعار يُخزَّن داخل العرض (data URL)، لذا يبقى متاحًا في التصدير دون اتصال.</p>
          </Section>

          <Section title="معاينة حيّة">
            <BrandPreview kit={draft} />
            <div className="flex flex-wrap gap-1.5">
              <Button size="sm" variant="primary" onClick={apply}>
                <Sparkles size={12} /> تطبيق على عرضي المفتوح
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={!doc.brandKitId}
                onClick={() => {
                  useDoc.getState().applyTheme({ ...doc.theme, palette: draft.colors, fonts: draft.fonts, name: draft.name })
                  toast({ kind: 'success', title: 'طُبِّقت الألوان فقط', body: 'بقيت الخطوط كما هي في كل عنصر.', action: { label: 'تراجع', run: () => useDoc.getState().undo() } })
                }}
              >
                الألوان فقط
              </Button>
            </div>
          </Section>
        </div>
      </div>
    </section>
  )
}

function derivePalette(primary: string, secondary: string): ThemePalette {
  const dark = relLuminance(primary) < 0.4
  return {
    primary,
    secondary,
    accent: secondary,
    background: dark ? '#FFFFFF' : '#F7F7F5',
    surface: dark ? '#F1F2F5' : '#ECEDEF',
    text: dark ? '#0F1116' : '#12161F',
    textMuted: dark ? '#5A6070' : '#5A6070',
    onPrimary: dark ? '#FFFFFF' : '#0F1116',
    success: '#12855A',
    warning: '#B45309',
  }
}

function emptyKit(colors: ThemePalette, fonts: BrandKit['fonts']): BrandKit {
  return { id: newId('bk'), name: 'علامتي', colors: { ...colors }, fonts: { ...fonts }, updatedAt: Date.now() }
}

function BrandPreview({ kit }: { kit: BrandKit }) {
  const style = useMemo(
    () => ({ background: kit.colors.background, color: kit.colors.text, fontFamily: `'${kit.fonts.heading}', system-ui, sans-serif` }),
    [kit],
  )
  return (
    <div className="overflow-hidden rounded-lg border border-ink-800 p-3.5" style={style}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[16px] font-bold leading-snug">عنوان using خط العلامة</p>
        {kit.logoAssetId ? <img src={useDoc.getState().doc.assets[kit.logoAssetId]?.src} alt="" className="h-6 w-auto object-contain" /> : null}
      </div>
      <p className="mt-1 font-ui text-[11.5px] leading-relaxed" style={{ color: kit.colors.textMuted, fontFamily: `'${kit.fonts.body}', system-ui, sans-serif` }}>
        نص الجسم بخط العلامة، مع لون نص محسوب على الخلفية. {kit.tagline ? `— ${kit.tagline}` : ''}
      </p>
      <div className="mt-2.5 flex items-end gap-3">
        <span className="text-[26px] font-black leading-none" style={{ color: kit.colors.primary }}>
          ٪٤٢
        </span>
        <span className="pb-1 text-[11px]" style={{ color: kit.colors.textMuted }}>
          تحسّن في الربع
        </span>
        <span
          className="ms-auto rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
          style={{ background: kit.colors.accent, color: readableOn(kit.colors.accent, kit.colors.text, '#FFFFFF') }}
        >
          قرار
        </span>
      </div>
      <div className="mt-3 flex gap-1">
        {ROLE_ORDER.map((role) => (
          <span key={role} className="h-1.5 flex-1 rounded-full" style={{ background: kit.colors[role] }} />
        ))}
      </div>
    </div>
  )
}

export function BrandPage() {
  return (
    <div className="min-h-full bg-ink-950 p-6 text-ink-50">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-[22px] font-semibold tracking-tight">العلامة التجارية</h1>
        <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-ink-400">
          ألوان وخطوط وشعار واحد لكل عروضك. كل ما هنا يطبَّق فعلًا على العناصر داخل المحرر — لا مجرد معاينة.
        </p>
        <div className="mt-6">
          <BrandPane />
        </div>
      </div>
    </div>
  )
}
