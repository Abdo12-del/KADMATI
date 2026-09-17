/**
 * Left rail — the three things a designer reaches for constantly:
 * slides (with real live thumbnails), layers, and the insert libraries.
 *
 * Thumbnails reuse the exact editor renderer (`SlideView mode="thumb"`), so what you see in the
 * strip is what the canvas and the exporters produce — one renderer, zero drift. Long decks stay
 * smooth because the strip is virtualized.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  AlertTriangle,
  ArrowDownRight,
  BarChart3,
  Copy,
  Eye,
  EyeOff,
  FileText,
  GripVertical,
  Image as ImageIcon,
  Layers,
  Lock,
  Network,
  Plus,
  Trash2,
  Type,
  ArrowUpToLine,
  ArrowDownToLine,
  Ungroup,
  Square,
  Table as TableIcon,
  Frame as FrameIcon,
  Spline,
  Play,
  Group as GroupIcon,
  ZoomIn,
} from 'lucide-react'
import { SlideView } from '../render/SlideView'
import { useDoc } from '../store/useDoc'
import { toast, useUI } from '../store/useUI'
import { Button, Chip, IconButton, Popover } from '../components/ui'
import { SHAPE_LIBRARY } from '../document/shapes'
import { collectZoomEdges, slideLabel, type ZoomEdge } from '../document/zoom'
import { LAYOUTS, buildLayout } from '../templates/layouts'
import { ICON_CATEGORIES, iconSvg } from '../lib/iconLibrary'
import { fileToDataUrl } from '../store/storage'
import { createAsset } from '../document/factory'
import { cn } from '../lib/cn'
import type { AnyElement } from '../document/types'

type Tab = 'slides' | 'layers' | 'shapes' | 'icons' | 'media' | 'map'

const TABS: { id: Tab; label: string; icon: typeof Layers }[] = [
  { id: 'slides', label: 'الشرائح', icon: FileText },
  { id: 'layers', label: 'الطبقات', icon: Layers },
  { id: 'map', label: 'الخريطة', icon: Network },
  { id: 'shapes', label: 'أشكال', icon: Square },
  { id: 'icons', label: 'أيقونات', icon: GripVertical },
  { id: 'media', label: 'صور', icon: ImageIcon },
]

export function LeftPanel() {
  const leftPanel = useUI((s) => s.leftPanel)
  const setLeftPanel = useUI((s) => s.setLeftPanel)
  const tab: Tab = (['slides', 'layers', 'shapes', 'icons', 'images', 'map'].includes(leftPanel) ? (leftPanel === 'images' ? 'media' : leftPanel) : 'slides') as Tab
  const setTab = (next: Tab) => setLeftPanel(next === 'media' ? 'images' : next)

  return (
    <aside className="glass flex h-full w-[248px] shrink-0 flex-col border-e border-ink-800/70">
      <nav className="flex shrink-0 items-center gap-0.5 border-b border-ink-800 px-1.5 py-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            title={t.label}
            className={cn(
              'flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-[11px] font-medium transition-colors',
              tab === t.id ? 'bg-ink-800 text-ink-50' : 'text-ink-400 hover:bg-ink-850 hover:text-ink-100',
            )}
          >
            <t.icon size={13} />
            <span className="hidden xl:inline">{t.label}</span>
          </button>
        ))}
      </nav>
      {tab === 'slides' ? <SlidesTab /> : null}
      {tab === 'layers' ? <LayersTab /> : null}
      {tab === 'map' ? <MapTab /> : null}
      {tab === 'shapes' ? <ShapesTab /> : null}
      {tab === 'icons' ? <IconsTab /> : null}
      {tab === 'media' ? <MediaTab /> : null}
    </aside>
  )
}

/* ------------------------------------------------------------------ slides */

function SlidesTab() {
  const doc = useDoc((s) => s.doc)
  const slideIndex = useDoc((s) => s.slideIndex)
  const gotoSlide = useDoc((s) => s.gotoSlide)
  const addSlide = useDoc((s) => s.addSlide)
  const removeSlide = useDoc((s) => s.removeSlide)
  const duplicateSlide = useDoc((s) => s.duplicateSlide)
  const reorderSlide = useDoc((s) => s.reorderSlide)
  const toggleSlideHidden = useDoc((s) => s.toggleSlideHidden)
  const updateSlide = useDoc((s) => s.updateSlide)
  const parentRef = useRef<HTMLDivElement>(null)
  const dragFrom = useRef<number | null>(null)
  const [over, setOver] = useState<number | null>(null)

  const width = 216
  const scale = (width - 16) / doc.size.w
  const height = Math.round(doc.size.h * scale) + 34
  const zoomCount = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of collectZoomEdges(doc)) map.set(e.sourceSlideId, (map.get(e.sourceSlideId) ?? 0) + 1)
    return map
  }, [doc])

  const virtualizer = useVirtualizer({
    count: doc.slides.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => height,
    overscan: 6,
  })

  const lastIndex = useRef(-1)
  useEffect(() => {
    // Reveal the active slide when it changes from elsewhere (canvas, presenter, shortcuts).
    if (lastIndex.current !== slideIndex && slideIndex > 0) virtualizer.scrollToIndex(slideIndex, { align: 'auto' })
    lastIndex.current = slideIndex
  }, [slideIndex, virtualizer])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={parentRef} className="panel-x min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {virtualizer.getVirtualItems().map((item) => {
          const index = item.index
          const slide = doc.slides[index]
          const active = index === slideIndex
          return (
            <div
              key={slide.id}
              data-index={index}
              ref={virtualizer.measureElement}
              draggable
              onDragStart={() => {
                dragFrom.current = index
              }}
              onDragOver={(e) => {
                e.preventDefault()
                if (dragFrom.current !== null && dragFrom.current !== index) setOver(index)
              }}
              onDragLeave={() => setOver((v) => (v === index ? null : v))}
              onDrop={(e) => {
                e.preventDefault()
                const from = dragFrom.current
                if (from !== null && from !== index) reorderSlide(from, index)
                dragFrom.current = null
                setOver(null)
              }}
              onDragEnd={() => {
                dragFrom.current = null
                setOver(null)
              }}
              className={cn('group relative mb-2 select-none rounded-lg p-1.5 transition-shadow', over === index && 'ring-2 ring-signal/70')}
            >
              <button
                type="button"
                onClick={() => gotoSlide(index)}
                onDoubleClick={() => updateSlide(slide.id, (s) => void (s.name = s.name || `شريحة ${index + 1}`))}
                className={cn(
                  'relative block w-full overflow-hidden rounded-md border bg-ink-950 transition-colors',
                  active ? 'border-signal' : 'border-ink-700 hover:border-ink-500',
                )}
                style={{ height: Math.round(doc.size.h * scale) }}
                title={slide.name || `شريحة ${index + 1}`}
              >
                <div
                  className="pointer-events-none origin-top-left"
                  style={{ width: doc.size.w, height: doc.size.h, transform: `scale(${scale})`, transformOrigin: 'top left' }}
                >
                  <SlideView slide={slide} doc={doc} mode="thumb" static />
                </div>
                {slide.hidden ? (
                  <span className="absolute inset-0 grid place-items-center bg-ink-950/60 text-[11px] text-ink-200">مخفية في العرض</span>
                ) : null}
              </button>
              <div className="mt-1 flex items-center gap-1 px-0.5">
                <span className={cn('w-4 shrink-0 text-[10px] tabular-nums', active ? 'text-signal-soft' : 'text-ink-500')}>{index + 1}</span>
                {(zoomCount.get(slide.id) ?? 0) > 0 ? (
                  <span
                    className="flex shrink-0 items-center gap-0.5 rounded bg-sky-400/12 px-1 py-px text-[9.5px] font-semibold text-sky-200"
                    title={`${zoomCount.get(slide.id)} روابط زوم صادرة — انظر تبويب الخريطة`}
                  >
                    <ZoomIn size={10} /> {zoomCount.get(slide.id)}
                  </span>
                ) : null}
                <span className="min-w-0 flex-1 truncate text-[11px] text-ink-300">{slide.name || slideTitle(slide, doc)}</span>
                <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <IconButton
                    size="iconSm"
                    className="size-5"
                    tip={slide.hidden ? 'إظهار الشريحة' : 'إخفاء الشريحة'}
                    onClick={() => {
                      gotoSlide(index)
                      toggleSlideHidden()
                    }}
                  >
                    {slide.hidden ? <EyeOff size={11} /> : <Eye size={11} />}
                  </IconButton>
                  <IconButton size="iconSm" className="size-5" tip="تكرار الشريحة" onClick={() => duplicateSlide(index)}>
                    <Copy size={11} />
                  </IconButton>
                  <IconButton
                    size="iconSm"
                    className="size-5"
                    tip="حذف الشريحة"
                    disabled={doc.slides.length <= 1}
                    onClick={() => {
                      const doomed = collectZoomEdges(doc).filter(
                        (e) => e.target.kind === 'slide' && e.target.slideId === slide.id && e.sourceSlideId !== slide.id,
                      ).length
                      removeSlide(index)
                      if (doomed > 0) {
                        toast({
                          kind: 'error',
                          title: `حُذفت الشريحة — ${doomed} روابط زوم أصبحت معطّلة`,
                          body: 'العرض يعمل، لكن أصلح الروابط من تبويب الخريطة.',
                          action: { label: 'فتح الخريطة', run: () => { if (useUI.getState().leftPanel !== 'map') useUI.getState().setLeftPanel('map') } },
                        })
                      } else {
                        toast({ kind: 'info', title: 'حُذفت الشريحة', body: '⌘Z للتراجع.', action: { label: 'تراجع', run: () => useDoc.getState().undo() } })
                      }
                    }}
                  >
                    <Trash2 size={11} />
                  </IconButton>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex shrink-0 items-center gap-1.5 border-t border-ink-800 p-2">
        <Button size="sm" variant="surface" className="flex-1" onClick={() => addSlide(doc.slides.length)}>
          <Plus size={13} /> شريحة
        </Button>
        <Popover
          align="end"
          trigger={(p) => (
            <IconButton size="sm" tip="شريحة بتخطيط محدد" active={p.open} onClick={p.toggle}>
              <Layers size={13} />
            </IconButton>
          )}
        >
          {() => <LayoutChoices onPick={(id) => addSlide(doc.slides.length, findLayout(id))} />}
        </Popover>
      </div>
    </div>
  )
}

function LayoutChoices({ onPick }: { onPick: (id: string) => void }) {
  const theme = useDoc((s) => s.doc.theme)
  const size = useDoc((s) => s.doc.size)
  return (
    <div className="grid max-h-[22rem] w-64 grid-cols-2 gap-1.5 overflow-y-auto p-1.5">
      {LAYOUTS.map((layout) => (
        <button
          key={layout.id}
          type="button"
          title={layout.hint}
          onClick={() => onPick(layout.id)}
          className="rounded-md border border-ink-700 p-1.5 text-start transition-colors hover:border-ink-500 hover:bg-ink-800"
        >
          <LayoutGlyph layout={layout} theme={theme} size={size} />
          <span className="mt-1 block truncate text-[11px] text-ink-200">{layout.name}</span>
        </button>
      ))}
    </div>
  )
}

/** The tile is the real layout, drawn small — بدون رسم توضيحي منفصل. */
function LayoutGlyph({ layout, theme, size }: { layout: (typeof LAYOUTS)[number]; theme: import('../document/types').Theme; size: { w: number; h: number } }) {
  const built = useMemo(() => buildLayout(layout, theme), [layout, theme])
  return (
    <div className="relative h-[40px] w-full overflow-hidden rounded-sm bg-ink-950">
      {built.elements.map((el) => (
        <span
          key={el.id}
          className={cn('absolute rounded-[1px]', el.kind === 'text' ? 'bg-ink-500/70' : el.kind === 'image' ? 'bg-ink-600' : 'bg-signal/40')}
          style={{
            left: `${(el.x / size.w) * 100}%`,
            top: `${(el.y / size.h) * 100}%`,
            width: `${(el.w / size.w) * 100}%`,
            height: `${(el.h / size.h) * 100}%`,
          }}
        />
      ))}
    </div>
  )
}

function findLayout(id: string) {
  return LAYOUTS.find((l) => l.id === id) ?? null
}

function slideTitle(slide: { elements: AnyElement[] }, doc: unknown): string {
  void doc
  const title = slide.elements.find((el) => el.kind === 'text' && el.role === 'title')
  if (title && title.kind === 'text') {
    const text = title.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    if (text) return text.slice(0, 34)
  }
  const first = slide.elements.find((el) => el.kind === 'text')
  if (first && first.kind === 'text') {
    const text = first.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    if (text) return text.slice(0, 34)
  }
  return 'شريحة فارغة'
}

/* ------------------------------------------------------------------ layers */

const KIND_ICON: Record<string, typeof Type> = {
  text: Type,
  image: ImageIcon,
  shape: Square,
  line: Spline,
  icon: GripVertical,
  svg: GripVertical,
  table: TableIcon,
  chart: BarChart3,
  video: Play,
  frame: FrameIcon,
}

function LayersTab() {
  const slide = useDoc((s) => s.doc.slides[s.slideIndex])
  const selection = useDoc((s) => s.selection)
  const select = useDoc((s) => s.select)
  const updateElement = useDoc((s) => s.updateElement)
  const zOrder = useDoc((s) => s.zOrder)
  const removeElement = useDoc((s) => s.removeElement)
  const renameElement = useDoc((s) => s.renameElement)
  const [renaming, setRenaming] = useState<string | null>(null)
  const groupIds = useMemo(() => {
    const map = new Map<string, number>()
    for (const el of slide?.elements ?? []) if (el.gid) map.set(el.gid, (map.get(el.gid) ?? 0) + 1)
    return map
  }, [slide])

  const list = useMemo(() => [...(slide?.elements ?? [])].reverse(), [slide])

  if (!slide || !list.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <Layers size={20} className="text-ink-600" />
        <p className="text-[12px] leading-relaxed text-ink-400">هذه الشريحة لا تحتوي عناصر بعد. أضف نصًا أو شكلًا من الشريط العلوي.</p>
      </div>
    )
  }

  return (
    <div className="panel-x min-h-0 flex-1 overflow-y-auto py-1">
      {list.map((el) => {
        const Icon = KIND_ICON[el.kind] ?? Square
        const selected = selection.includes(el.id)
        const grouped = el.gid ? (groupIds.get(el.gid) ?? 0) > 1 : false
        return (
          <div
            key={el.id}
            className={cn(
              'group flex h-8 items-center gap-1.5 px-2 text-[12px] transition-colors',
              selected ? 'bg-signal/12 text-ink-50' : 'text-ink-300 hover:bg-ink-850',
              !el.visible && 'opacity-50',
            )}
            onClick={(e) => select([el.id], { additive: e.shiftKey || e.metaKey || e.ctrlKey })}
          >
            <Icon size={12} className={cn('shrink-0', selected ? 'text-signal-soft' : 'text-ink-500')} />
            {el.zoom ? (
              <span title="مرتبط بزوم — انظر لوحة الخصائص">
                <ZoomIn size={11} className="shrink-0 text-sky-300" />
              </span>
            ) : null}
            {renaming === el.id ? (
              <input
                autoFocus
                defaultValue={el.name}
                onBlur={(e) => {
                  renameElement(el.id, e.target.value.trim() || el.name)
                  setRenaming(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                  if (e.key === 'Escape') setRenaming(null)
                  e.stopPropagation()
                }}
                className="min-w-0 flex-1 rounded border border-ink-600 bg-ink-950 px-1 text-[12px] outline-none"
              />
            ) : (
              <button
                type="button"
                onDoubleClick={() => setRenaming(el.id)}
                className="min-w-0 flex-1 truncate text-start"
                title={`${el.name} — نقرة مزدوجة لإعادة التسمية`}
              >
                {el.name}
                {grouped ? <span className="ms-1 rounded bg-ink-750 px-1 text-[9px] text-ink-300">مجموعة</span> : null}
              </button>
            )}
            <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              <button type="button" title="إلى الأمام" className="rounded p-0.5 hover:bg-ink-700" onClick={() => zOrder('forward')}>
                <ArrowUpToLine size={11} />
              </button>
              <button type="button" title="إلى الخلف" className="rounded p-0.5 hover:bg-ink-700" onClick={() => zOrder('backward')}>
                <ArrowDownToLine size={11} />
              </button>
              <button
                type="button"
                title={el.locked ? 'إلغاء القفل' : 'قفل'}
                className={cn('rounded p-0.5 hover:bg-ink-700', el.locked && 'text-warn opacity-100')}
                onClick={() => updateElement(el.id, { locked: !el.locked }, el.locked ? 'فك القفل' : 'قفل')}
              >
                <Lock size={11} />
              </button>
              <button
                type="button"
                title={el.visible ? 'إخفاء' : 'إظهار'}
                className={cn('rounded p-0.5 hover:bg-ink-700', !el.visible && 'opacity-100')}
                onClick={() => updateElement(el.id, { visible: !el.visible }, el.visible ? 'إخفاء' : 'إظهار')}
              >
                {el.visible ? <Eye size={11} /> : <EyeOff size={11} />}
              </button>
              <button type="button" title="حذف" className="rounded p-0.5 text-ink-400 hover:bg-red-500/15 hover:text-red-300" onClick={() => removeElement(el.id)}>
                <Trash2 size={11} />
              </button>
            </div>
          </div>
        )
      })}
      <div className="mt-1 flex items-center gap-1 border-t border-ink-800 px-2 pt-2">
        <Chip onClick={() => useDoc.getState().groupSelected()} title="تجميع المحدد · ⌘G">
          <GroupIcon size={11} className="inline" /> تجميع
        </Chip>
        <Chip onClick={() => useDoc.getState().ungroupSelected()} title="فك التجميع · ⌘⇧G">
          <Ungroup size={11} className="inline" /> فك
        </Chip>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ navigation map */

function MapTab() {
  const doc = useDoc((s) => s.doc)
  const gotoSlide = useDoc((s) => s.gotoSlide)
  const select = useDoc((s) => s.select)
  const openZoomPicker = useUI((s) => s.openZoomPicker)
  const edges = useMemo(() => collectZoomEdges(doc), [doc])
  const broken = edges.filter((e) => e.status !== 'ok')
  const bySource = useMemo(() => {
    const map = new Map<string, ZoomEdge[]>()
    for (const e of edges) {
      const list = map.get(e.sourceSlideId) ?? []
      list.push(e)
      map.set(e.sourceSlideId, list)
    }
    return map
  }, [edges])

  const triggerName = (e: ZoomEdge) =>
    doc.slides.find((s) => s.id === e.sourceSlideId)?.elements.find((el) => el.id === e.triggerElementId)?.name ?? 'عنصر'

  const jumpToTrigger = (e: ZoomEdge) => {
    const i = doc.slides.findIndex((s) => s.id === e.sourceSlideId)
    if (i >= 0) {
      gotoSlide(i)
      select([e.triggerElementId])
    }
  }
  const jumpToTarget = (e: ZoomEdge) => {
    const target = e.target
    if (target.kind !== 'slide') return
    const i = doc.slides.findIndex((s) => s.id === target.slideId)
    if (i >= 0) gotoSlide(i)
  }

  if (!edges.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <Network size={20} className="text-ink-600" />
        <p className="text-[12px] leading-relaxed text-ink-400">
          لا روابط زوم بعد. حدد بطاقة أو زرًا أو صورة ثم اختر «زوم إلى شريحة» من لوحة الخصائص.
        </p>
      </div>
    )
  }

  return (
    <div className="panel-x min-h-0 flex-1 overflow-y-auto p-2">
      {broken.length ? (
        <div className="mb-2 rounded-lg border border-red-500/30 bg-red-500/8 p-2">
          <p className="flex items-center gap-1.5 text-[11.5px] font-bold text-red-300">
            <AlertTriangle size={12} /> روابط معطّلة ({broken.length})
          </p>
          <div className="mt-1.5 space-y-1.5">
            {broken.map((e) => (
              <div key={e.id} className="rounded-md border border-red-500/20 bg-ink-950/60 p-1.5">
                <button type="button" onClick={() => jumpToTrigger(e)} className="block w-full truncate text-start text-[11px] text-ink-200 hover:text-ink-50" title="انتقال إلى العنصر">
                  {slideLabel(doc, e.sourceSlideId).split(' — ')[0]} · {triggerName(e)}
                </button>
                <p className="mt-0.5 text-[10.5px] text-ink-500">
                  {e.status === 'unsupported-section' ? 'يستهدف قسمًا (الأقسام غير مدعومة بعد)' : 'الشريحة المستهدفة محذوفة'}
                </p>
                <div className="mt-1 flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      jumpToTrigger(e)
                      openZoomPicker([e.triggerElementId])
                    }}
                    className="flex-1 rounded border border-ink-600 px-1.5 py-1 text-[10.5px] text-ink-100 hover:bg-ink-800"
                  >
                    اختيار شريحة
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const i = doc.slides.findIndex((s) => s.id === e.sourceSlideId)
                      if (i < 0) return
                      gotoSlide(i)
                      useDoc.getState().updateElement(e.triggerElementId, { zoom: undefined }, 'إزالة الزوم')
                    }}
                    className="flex-1 rounded border border-ink-700 px-1.5 py-1 text-[10.5px] text-ink-400 hover:bg-ink-800"
                  >
                    إزالة الرابط
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {doc.slides.map((s, i) => {
        const out = bySource.get(s.id) ?? []
        if (!out.length) return null
        return (
          <div key={s.id} className="mb-2 rounded-lg border border-ink-800 bg-ink-900/40">
            <button
              type="button"
              onClick={() => gotoSlide(i)}
              className="flex w-full items-center gap-1.5 px-2 py-1.5 text-start"
              title="انتقال إلى الشريحة"
            >
              <span className="grid size-5 shrink-0 place-items-center rounded bg-ink-750 font-mono text-[10px] text-ink-200">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-[11.5px] font-semibold text-ink-100">{s.name || slideLabel(doc, s.id).replace(/^شريحة \d+ — /, '') || `شريحة ${i + 1}`}</span>
              <span className="text-[10px] text-ink-500">{out.length} ←</span>
            </button>
            <div className="space-y-1 px-2 pb-2">
              {out.map((e) => {
                const ok = e.status === 'ok' && e.target.kind === 'slide'
                return (
                  <div key={e.id} className="flex items-center gap-1 text-[11px]">
                    <ArrowDownRight size={11} className={ok ? 'shrink-0 text-sky-300' : 'shrink-0 text-red-400'} />
                    <button type="button" onClick={() => jumpToTrigger(e)} className="min-w-0 max-w-[86px] truncate rounded px-1 py-0.5 text-ink-300 hover:bg-ink-800 hover:text-ink-50" title={`العنصر: ${triggerName(e)} — انقر للتحديد`}>
                      {triggerName(e)}
                    </button>
                    <span className="shrink-0 text-ink-600">←</span>
                    {ok ? (
                      <button type="button" onClick={() => jumpToTarget(e)} className="min-w-0 flex-1 truncate rounded bg-sky-400/10 px-1.5 py-0.5 text-start text-sky-200 hover:bg-sky-400/20" title="انتقال إلى الشريحة المستهدفة">
                        {slideLabel(doc, (e.target as { slideId: string }).slideId)}
                      </button>
                    ) : (
                      <span className="min-w-0 flex-1 truncate rounded bg-red-500/10 px-1.5 py-0.5 text-red-300">معطّل</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
      <p className="px-1 pb-2 text-[10.5px] leading-relaxed text-ink-500">
        الروابط تُحفظ بمعرّف الشريحة — إعادة الترتيب لا تكسرها أبدًا.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ insert libraries */

function ShapesTab() {
  const pending = useDoc((s) => s.pendingShape)
  const setPending = useDoc((s) => s.setPendingShape)
  const insert = useDoc((s) => s.insertShape)
  const [group, setGroup] = useState<string>('basic')
  const groups = Array.from(new Set(SHAPE_LIBRARY.map((s) => s.group)))
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap gap-1 border-b border-ink-800 p-2">
        {groups.map((g) => (
          <Chip key={g} active={group === g} onClick={() => setGroup(g)}>
            {GROUP_LABEL[g] ?? g}
          </Chip>
        ))}
      </div>
      <div className="panel-x min-h-0 flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-5 gap-1">
          {SHAPE_LIBRARY.filter((s) => s.group === group).map((shape) => (
            <button
              key={shape.id}
              type="button"
              title={`${shape.label} — نقرة للإدراج`}
              onClick={() => {
                setPending(shape.id)
                insert(shape.id)
              }}
              className={cn(
                'grid aspect-square place-items-center rounded-md border text-[18px] leading-none transition-colors',
                pending === shape.id ? 'border-signal/60 bg-signal/12 text-signal-soft' : 'border-ink-750 text-ink-200 hover:border-ink-600 hover:bg-ink-850',
              )}
            >
              {shape.short ?? shape.label.slice(0, 2)}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-ink-500">الإدراج يتم في مركز الشريحة ثم يمكنك تحريكه بمحاذاة ذكية وشبكات إرشاد.</p>
      </div>
    </div>
  )
}

const GROUP_LABEL: Record<string, string> = {
  basic: 'أساسي',
  arrows: 'أسهم',
  callouts: 'تنبيهات',
  organic: 'عضوي',
  lines: 'خطوط',
}

function IconsTab() {
  const insert = useDoc((s) => s.insertIcon)
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState<string>('all')
  const icons = useMemo(() => {
    const pool = cat === 'all' ? ICON_CATEGORIES.flatMap((c) => c.icons) : ICON_CATEGORIES.find((c) => c.id === cat)?.icons ?? []
    const q = query.trim().toLowerCase()
    return pool.filter((n) => (q ? n.includes(q) : true)).slice(0, 240)
  }, [query, cat])
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-1.5 border-b border-ink-800 p-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="بحث في الأيقونات…"
          className="h-7 w-full rounded-md border border-ink-700 bg-ink-850 px-2 text-[12px] outline-none placeholder:text-ink-500 focus:border-signal"
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
      <div className="panel-x min-h-0 flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-6 gap-1">
          {icons.map((name) => (
            <button
              key={name}
              type="button"
              title={name}
              onClick={() => insert(name)}
              className="grid aspect-square place-items-center rounded-md border border-ink-750 transition-colors hover:border-ink-600 hover:bg-ink-850 [&_svg]:size-[17px]"
              dangerouslySetInnerHTML={{ __html: iconSvg(name, { size: 17, color: '#dcdce2' }) }}
            />
          ))}
        </div>
        {!icons.length && <p className="p-4 text-center text-[12px] text-ink-500">لا نتائج — جرّب كلمة أقصر.</p>}
      </div>
    </div>
  )
}

function MediaTab() {
  const assets = useDoc((s) => s.doc.assets)
  const addAsset = useDoc((s) => s.addAsset)
  const insertImage = useDoc((s) => s.insertImage)
  const insertVideo = useDoc((s) => s.insertVideo)
  const removeAsset = useDoc((s) => s.removeAsset)
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const list = useMemo(() => Object.values(assets).sort((a, b) => b.createdAt - a.createdAt), [assets])

  const ingest = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return
      setBusy(true)
      let added = 0
      for (const file of Array.from(files)) {
        try {
          const shot = await fileToDataUrl(file, { maxSide: 1800 })
          const isVideo = file.type.startsWith('video/')
          const asset = createAsset({
            name: file.name,
            mime: file.type || (isVideo ? 'video/mp4' : 'image/png'),
            kind: isVideo ? 'video' : 'image',
            src: shot.src,
            w: shot.w,
            h: shot.h,
            bytes: shot.bytes,
          })
          addAsset(asset)
          if (isVideo) insertVideo(asset)
          else insertImage(asset)
          added++
        } catch {
          toast({ kind: 'error', title: 'تعذّرت إضافة ملف', body: file.name })
        }
      }
      setBusy(false)
      if (added) toast({ kind: 'success', title: `أُضيفت ${added} وسائط`, body: 'تُحفظ محليًا داخل العرض، وتُصدَّر مع الملف.' })
    },
    [addAsset, insertImage, insertVideo],
  )

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        void ingest(e.dataTransfer.files)
      }}
    >
      <div className="border-b border-ink-800 p-2">
        <Button size="sm" variant="surface" className="w-full" onClick={() => input.current?.click()} disabled={busy}>
          {busy ? 'جارٍ المعالجة…' : 'رفع صور أو فيديو'}
        </Button>
        <p className="mt-1.5 text-[10.5px] leading-relaxed text-ink-500">اسحب الملفات إلى هنا أو إلى الشريحة مباشرة. الصور تُصغَّر تلقائيًا إلى ١٨٠٠ بكسل للحفاظ على خفة العرض.</p>
        <input ref={input} type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => void ingest(e.target.files)} />
      </div>
      <div className="panel-x min-h-0 flex-1 overflow-y-auto p-2">
        {!list.length ? (
          <p className="p-6 text-center text-[12px] leading-relaxed text-ink-500">لا وسائط في هذا العرض بعد. كل ما ترفعه يبقى داخل المستند، لذا يعمل التصدير دون اتصال.</p>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {list.map((asset) => (
              <div key={asset.id} className="group relative overflow-hidden rounded-md border border-ink-750 bg-ink-950">
                <button
                  type="button"
                  onClick={() => (asset.kind === 'video' ? insertVideo(asset) : insertImage(asset))}
                  className="block aspect-video w-full"
                  title="إدراج في الشريحة"
                >
                  {asset.kind === 'video' ? (
                    <span className="grid h-full place-items-center text-ink-400">
                      <Play size={16} />
                    </span>
                  ) : (
                    <img src={asset.src} alt={asset.name} className="h-full w-full object-cover" loading="lazy" />
                  )}
                </button>
                <span className="block truncate px-1.5 py-1 text-[10px] text-ink-400">{asset.name}</span>
                <button
                  type="button"
                  title="إزالة من العرض"
                  onClick={() => removeAsset(asset.id)}
                  className="absolute end-1 top-1 hidden rounded bg-ink-900/85 p-1 text-ink-200 group-hover:block hover:text-red-300"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
