/**
 * CanvasToolbar — the tool strip directly above the canvas (per the reference):
 * tools + contextual pickers + arrange/align cluster on the tool side, and
 * zoom / grid / snap / fit on the view side. All actions are real store calls.
 */
import { useRef, useState, useSyncExternalStore } from 'react'
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
  ArrowDownToLine,
  ArrowUpToLine,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  Frame,
  Grid3x3,
  Group,
  Hexagon,
  Image as ImageIcon,
  Lock,
  MousePointer2,
  Redo2,
  Scissors,
  Spline,
  Square,
  Table,
  Type,
  Undo2,
  Ungroup,
} from 'lucide-react'
import { useDoc, type ToolId } from '../store/useDoc'
import { toast } from '../store/useUI'
import { Button, Chip, Divider, IconButton, Popover, Segmented } from '../components/ui'
import { SHAPE_LIBRARY } from '../document/shapes'
import { ICON_CATEGORIES, iconSvg } from '../lib/iconLibrary'
import { fileToDataUrl } from '../store/storage'
import { createAsset } from '../document/factory'
import { cn } from '../lib/cn'

const GROUP_LABEL: Record<string, string> = {
  basic: 'أساسي',
  arrows: 'أسهم',
  callouts: 'تنبيهات',
  organic: 'عضوي',
  lines: 'خطوط',
}

const ZOOMS = [0.5, 0.75, 1, 1.5, 2]

export function CanvasToolbar() {
  const tool = useDoc((s) => s.tool)
  const setTool = useDoc((s) => s.setTool)
  const selection = useDoc((s) => s.selection)
  const zoom = useDoc((s) => s.zoom)
  const setZoom = useDoc((s) => s.setZoom)
  const zoomMode = useDoc((s) => s.zoomMode)
  const fitZoom = useDoc((s) => s.fitZoom)
  const undo = useDoc((s) => s.undo)
  const redo = useDoc((s) => s.redo)
  const grid = useDoc((s) => s.doc.settings.gridVisible)
  const snap = useDoc((s) => s.doc.settings.snapToGrid)
  const { canUndo, canRedo } = useHistoryFlags()

  const fileInput = useRef<HTMLInputElement>(null)
  const hasSelection = selection.length > 0
  const multi = selection.length > 1
  const store = () => useDoc.getState()
  const anyLocked = selectedFlag('locked')
  const anyHidden = selectedFlag('visible', false)

  const insertImageFile = async (file?: File | null) => {
    if (!file) return
    try {
      const shot = await fileToDataUrl(file)
      const asset = createAsset({
        name: file.name,
        mime: file.type || 'image/png',
        kind: 'image',
        src: shot.src,
        w: shot.w,
        h: shot.h,
        bytes: shot.bytes,
      })
      const s = store()
      s.addAsset(asset)
      s.insertImage(asset)
      toast({ kind: 'success', title: 'أُضيفت الصورة', body: file.name })
    } catch {
      toast({ kind: 'error', title: 'تعذّرت قراءة الصورة', body: 'استخدم PNG أو JPG أو WebP.' })
    }
  }

  return (
    <div className="glass relative z-20 flex h-11 shrink-0 items-center gap-1 border-b border-ink-800/70 px-2">
      <Segmented<ToolId>
        size="sm"
        value={tool}
        onChange={setTool}
        options={[
          { value: 'select', tip: 'تحديد — V', label: <MousePointer2 size={13} /> },
          { value: 'text', tip: 'نص — T', label: <Type size={13} /> },
          { value: 'shape', tip: 'شكل — R', label: <Square size={13} /> },
          { value: 'line', tip: 'خط — L', label: <Spline size={13} /> },
          { value: 'icon', tip: 'أيقونة — I', label: <Hexagon size={13} /> },
        ]}
      />
      {tool === 'shape' ? <ShapePicker /> : null}
      {tool === 'icon' ? <IconPicker /> : null}

      <Divider vertical />

      <IconButton size="iconSm" tip="تراجع · ⌘Z" disabled={!canUndo} onClick={undo}>
        <Undo2 size={14} />
      </IconButton>
      <IconButton size="iconSm" tip="إعادة · ⌘⇧Z" disabled={!canRedo} onClick={redo}>
        <Redo2 size={14} />
      </IconButton>

      <div className="hidden items-center gap-0.5 md:flex">
        <Divider vertical />
        <IconButton size="iconSm" tip="محاذاة لبداية السطر" disabled={!hasSelection} onClick={() => store().alignSelected('left')}>
          <AlignStartVertical size={14} />
        </IconButton>
        <IconButton size="iconSm" tip="توسيط أفقي" disabled={!hasSelection} onClick={() => store().alignSelected('hcenter')}>
          <AlignCenterHorizontal size={14} />
        </IconButton>
        <IconButton size="iconSm" tip="محاذاة لنهاية السطر" disabled={!hasSelection} onClick={() => store().alignSelected('right')}>
          <AlignEndVertical size={14} />
        </IconButton>
        <IconButton size="iconSm" tip="أعلى الشريحة" disabled={!hasSelection} onClick={() => store().alignSelected('top')}>
          <AlignStartHorizontal size={14} />
        </IconButton>
        <IconButton size="iconSm" tip="توسيط رأسي" disabled={!hasSelection} onClick={() => store().alignSelected('vcenter')}>
          <AlignCenterVertical size={14} />
        </IconButton>
        <IconButton size="iconSm" tip="أسفل الشريحة" disabled={!hasSelection} onClick={() => store().alignSelected('bottom')}>
          <AlignEndHorizontal size={14} />
        </IconButton>
        <ArrangeMenu multi={multi} />
      </div>

      <div className="hidden items-center gap-0.5 lg:flex">
        <Divider vertical />
        <IconButton size="iconSm" tip="تجميع · ⌘G" disabled={!multi} onClick={() => store().groupSelected()}>
          <Group size={14} />
        </IconButton>
        <IconButton size="iconSm" tip="فك التجميع · ⌘⇧G" disabled={!hasSelection} onClick={() => store().ungroupSelected()}>
          <Ungroup size={14} />
        </IconButton>
        <IconButton size="iconSm" tip={anyLocked ? 'إلغاء القفل' : 'قفل'} disabled={!hasSelection} onClick={() => store().toggleLock()}>
          <Lock size={14} className={anyLocked ? 'text-warn' : undefined} />
        </IconButton>
        <IconButton size="iconSm" tip={anyHidden ? 'إظهار' : 'إخفاء'} disabled={!hasSelection} onClick={() => store().toggleVisible()}>
          {anyHidden ? <EyeOff size={14} className="text-ink-400" /> : <Eye size={14} />}
        </IconButton>
        <IconButton size="iconSm" tip="تكرار · ⌘D" disabled={!hasSelection} onClick={() => store().duplicateSelected()}>
          <Copy size={14} />
        </IconButton>
        <IconButton
          size="iconSm"
          tip="قص · ⌘X"
          disabled={!hasSelection}
          onClick={() => {
            store().cutSelected()
            toast({ kind: 'info', title: 'تم القص', body: 'الحافظة داخل المحرر — ⌘V للصق.' })
          }}
        >
          <Scissors size={14} />
        </IconButton>
      </div>

      <div className="ms-auto flex shrink-0 items-center gap-1">
        <InsertMenu onPickImage={() => fileInput.current?.click()} />
        <Divider vertical />
        <button
          type="button"
          onClick={() => setZoom(ZOOMS.includes(zoom) ? ZOOMS[(ZOOMS.indexOf(zoom) + 1) % ZOOMS.length] : 1)}
          className="flex h-7 items-center gap-1 rounded-md border border-ink-700 bg-ink-850/70 px-2 font-mono text-[11.5px] tabular-nums text-ink-100 transition-colors hover:bg-ink-800"
          title="مستوى التكبير — انقر للتبديل"
          dir="ltr"
        >
          {Math.round(zoom * 100)}% <ChevronDown size={11} className="text-ink-400" />
        </button>
        <Popover
          align="end"
          trigger={(p) => (
            <IconButton size="iconSm" tip="مستويات التكبير" active={p.open} onClick={p.toggle}>
              <ChevronDown size={13} />
            </IconButton>
          )}
        >
          {(close) => (
            <div className="w-36 p-1">
              {ZOOMS.map((z) => (
                <MenuLine
                  key={z}
                  label={`${Math.round(z * 100)}%`}
                  onClick={() => {
                    setZoom(z)
                    close()
                  }}
                />
              ))}
              <MenuLine
                label="ملاءمة النافذة"
                shortcut="⌘0"
                onClick={() => {
                  fitZoom(window.innerWidth - 620, window.innerHeight - 300)
                  close()
                }}
              />
            </div>
          )}
        </Popover>
        <IconButton size="iconSm" active={zoomMode === 'fit'} tip="ملاءمة النافذة · ⌘0" onClick={() => fitZoom(window.innerWidth - 620, window.innerHeight - 300)}>
          <Grid3x3 size={14} />
        </IconButton>
        <IconButton
          size="iconSm"
          tip="إظهار الشبكة"
          onClick={() => {
            store().setSettings({ gridVisible: !grid })
          }}
        >
          <span className={cn('text-[11px] leading-none', grid ? 'text-signal-soft' : 'text-ink-300')}>#</span>
        </IconButton>
        <button
          type="button"
          onClick={() => {
            store().setSettings({ snapToGrid: !snap })
            toast({ kind: 'info', title: snap ? 'أُلغيت المحاذاة للشبكة' : 'المحاذاة للشبكة مفعّلة' })
          }}
          className={cn('rounded px-1.5 py-0.5 text-[11px] transition-colors hover:bg-ink-800', snap ? 'text-signal-soft' : 'text-ink-400')}
          title="محاذاة للشبكة"
        >
          snap
        </button>
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void insertImageFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}

/** zundo exposes `.temporal` as a store API — subscribe to stable numbers. */
function useHistoryFlags() {
  const subscribe = (cb: () => void) => useDoc.temporal.subscribe(cb)
  const past = useSyncExternalStore(subscribe, () => useDoc.temporal.getState().pastStates.length, () => 0)
  const future = useSyncExternalStore(subscribe, () => useDoc.temporal.getState().futureStates.length, () => 0)
  return { canUndo: past > 0, canRedo: future > 0 }
}

function selectedFlag(key: 'locked' | 'visible', when = true): boolean {
  const { doc, slideIndex, selection } = useDoc.getState()
  const slide = doc.slides[slideIndex]
  if (!slide || !selection.length) return false
  return selection.every((id) => {
    const el = slide.elements.find((item) => item.id === id)
    return el ? !!el[key] === when : false
  })
}

function ArrangeMenu({ multi }: { multi: boolean }) {
  const store = () => useDoc.getState()
  return (
    <Popover
      trigger={(p) => (
        <IconButton size="iconSm" tip="ترتيب وتوزيع" active={p.open} onClick={p.toggle}>
          <ChevronDown size={14} />
        </IconButton>
      )}
    >
      {(close) => (
        <div className="w-60 p-1.5">
          <MenuGroup>التوزيع المتساوي</MenuGroup>
          <MenuLine
            label="أفقي"
            disabled={!multi}
            onClick={() => {
              store().distributeSelected('x')
              close()
            }}
          />
          <MenuLine
            label="رأسي"
            disabled={!multi}
            onClick={() => {
              store().distributeSelected('y')
              close()
            }}
          />
          <MenuGroup>ترتيب الطبقات</MenuGroup>
          {(
            [
              ['front', 'إلى المقدمة', ArrowUpToLine, '⌘⇧]'],
              ['forward', 'أمام طبقة', null, '⌘]'],
              ['backward', 'خلف طبقة', null, '⌘['],
              ['back', 'إلى الخلفية', ArrowDownToLine, '⌘⇧['],
            ] as [string, string, unknown, string][]
          ).map(([op, label, Icon, keys]) => (
            <MenuLine
              key={op}
              label={label}
              shortcut={keys}
              icon={Icon ? (Icon as typeof ArrowUpToLine) : undefined}
              onClick={() => {
                store().zOrder(op as 'front' | 'forward' | 'backward' | 'back')
                close()
              }}
            />
          ))}
        </div>
      )}
    </Popover>
  )
}

function MenuGroup({ children }: { children: React.ReactNode }) {
  return <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-ink-400">{children}</p>
}

function MenuLine({
  label,
  onClick,
  disabled,
  shortcut,
  icon: Icon,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  shortcut?: string
  icon?: typeof ArrowUpToLine
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[12.5px] text-ink-100 transition-colors hover:bg-ink-800 disabled:pointer-events-none disabled:opacity-35"
    >
      {Icon ? <Icon size={13} className="text-ink-400" /> : null}
      <span className="flex-1 text-start">{label}</span>
      {shortcut ? <span className="font-mono text-[10px] text-ink-400">{shortcut}</span> : null}
    </button>
  )
}

function InsertMenu({ onPickImage }: { onPickImage: () => void }) {
  const store = () => useDoc.getState()
  const [tableSize, setTableSize] = useState<{ rows: number; cols: number }>({ rows: 4, cols: 3 })
  return (
    <Popover
      align="end"
      trigger={(p) => (
        <Button size="sm" variant="subtle" active={p.open} onClick={p.toggle} tip="إدراج عنصر">
          إدراج <ChevronDown size={12} />
        </Button>
      )}
    >
      {(close) => (
        <div className="w-60 p-1.5">
          {(
            [
              ['مربع نص', 'T', () => store().insertText('body'), Type],
              ['عنوان', '⇧T', () => store().insertText('title'), Type],
              ['شكل', 'R', () => store().insertShape(store().pendingShape), Square],
              ['خط', 'L', () => store().insertLine(), Spline],
              ['أيقونة', 'I', () => store().insertIcon(store().pendingIcon), Hexagon],
              ['إطار', '', () => store().insertFrame(), Frame],
              ['صورة…', '', onPickImage, ImageIcon],
            ] as [string, string, () => void, typeof Type][]
          ).map(([label, keys, run, Icon]) => (
            <MenuLine
              key={label}
              label={label}
              shortcut={keys}
              icon={Icon}
              onClick={() => {
                run()
                close()
              }}
            />
          ))}
          <MenuGroup>مخطط</MenuGroup>
          <div className="flex flex-wrap gap-1 px-1 pb-1">
            {(['bar', 'line', 'area', 'pie', 'donut', 'radar'] as const).map((kind) => (
              <Chip
                key={kind}
                onClick={() => {
                  store().insertChart(kind)
                  close()
                }}
              >
                {CHART_LABEL[kind]}
              </Chip>
            ))}
          </div>
          <MenuGroup>جدول</MenuGroup>
          <div className="flex items-center gap-1.5 px-1 pb-1.5">
            <span className="text-[11px] text-ink-400">صفوف</span>
            <input
              type="number"
              min={2}
              max={12}
              value={tableSize.rows}
              onChange={(e) => setTableSize({ ...tableSize, rows: Math.max(2, Math.min(12, Number(e.target.value) || 2)) })}
              className="h-6 w-12 rounded border border-ink-700 bg-ink-850 px-1 text-[12px]"
            />
            <span className="text-[11px] text-ink-400">أعمدة</span>
            <input
              type="number"
              min={2}
              max={8}
              value={tableSize.cols}
              onChange={(e) => setTableSize({ ...tableSize, cols: Math.max(2, Math.min(8, Number(e.target.value) || 2)) })}
              className="h-6 w-12 rounded border border-ink-700 bg-ink-850 px-1 text-[12px]"
            />
            <button
              type="button"
              onClick={() => {
                store().insertTable(tableSize.rows, tableSize.cols)
                close()
              }}
              className="ms-auto rounded border border-ink-600 bg-ink-800 px-2 py-1 text-[11.5px] hover:bg-ink-750"
            >
              <Table size={12} className="inline" /> إدراج
            </button>
          </div>
        </div>
      )}
    </Popover>
  )
}

const CHART_LABEL: Record<string, string> = {
  bar: 'أعمدة',
  barH: 'أعمدة أفقية',
  line: 'خطي',
  area: 'مساحة',
  pie: 'دائري',
  donut: 'حلقي',
  radar: 'رادار',
  scatter: 'نقاط',
}

function ShapePicker() {
  const pending = useDoc((s) => s.pendingShape)
  const setPending = useDoc((s) => s.setPendingShape)
  const [group, setGroup] = useState<string>('basic')
  const groups = Array.from(new Set(SHAPE_LIBRARY.map((shape) => shape.group)))
  return (
    <Popover
      trigger={(p) => (
        <Chip active={p.open} onClick={p.toggle} title="اختر شكلًا ثم انقر داخل الشريحة">
          {SHAPE_LIBRARY.find((shape) => shape.id === pending)?.label ?? 'شكل'} <ChevronDown size={11} />
        </Chip>
      )}
    >
      {(close) => (
        <div className="w-[19rem] p-2">
          <div className="mb-2 flex flex-wrap gap-1">
            {groups.map((g) => (
              <Chip key={g} active={group === g} onClick={() => setGroup(g)}>
                {GROUP_LABEL[g] ?? g}
              </Chip>
            ))}
          </div>
          <div className="grid grid-cols-6 gap-1">
            {SHAPE_LIBRARY.filter((shape) => shape.group === group).map((shape) => (
              <button
                key={shape.id}
                type="button"
                title={shape.label}
                onClick={() => {
                  setPending(shape.id)
                  close()
                }}
                className={cn(
                  'grid aspect-square place-items-center rounded-md border text-[17px] leading-none transition-colors',
                  pending === shape.id ? 'border-signal/60 bg-signal/15 text-signal-soft' : 'border-ink-700 text-ink-200 hover:border-ink-600 hover:bg-ink-800',
                )}
              >
                {shape.short ?? shape.label.slice(0, 2)}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-ink-400">انقر داخل الشريحة لإدراج الشكل في الموضع الذي تحدده.</p>
        </div>
      )}
    </Popover>
  )
}

function IconPicker() {
  const pending = useDoc((s) => s.pendingIcon)
  const setPending = useDoc((s) => s.setPendingIcon)
  const [query, setQuery] = useState('')
  const all = ICON_CATEGORIES.flatMap((cat) => cat.icons)
  const results = all.filter((name) => (query ? name.toLowerCase().includes(query.trim().toLowerCase()) : true)).slice(0, 150)
  return (
    <Popover
      trigger={(p) => (
        <Chip active={p.open} onClick={p.toggle} title="مكتبة الأيقونات">
          {pending} <ChevronDown size={11} />
        </Chip>
      )}
    >
      {(close) => (
        <div className="w-[18rem] p-2">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder="ابحث: chart · users · light"
            className="h-7 w-full rounded-md border border-ink-700 bg-ink-850 px-2 text-[12px] text-ink-50 outline-none placeholder:text-ink-500 focus:border-signal"
          />
          <div className="mt-2 grid max-h-56 grid-cols-6 gap-1 overflow-y-auto">
            {results.map((name) => (
              <button
                key={name}
                type="button"
                title={name}
                onClick={() => {
                  setPending(name)
                  useDoc.getState().insertIcon(name)
                  close()
                }}
                className={cn(
                  'grid aspect-square place-items-center rounded-md border transition-colors [&_svg]:size-[17px]',
                  pending === name ? 'border-signal/60 bg-signal/15' : 'border-ink-700 hover:border-ink-600 hover:bg-ink-800',
                )}
                dangerouslySetInnerHTML={{ __html: iconSvg(name, { size: 17, color: '#dcdce2' }) }}
              />
            ))}
          </div>
          {!results.length && <p className="p-3 text-center text-[12px] text-ink-400">لا نتائج مطابقة</p>}
        </div>
      )}
    </Popover>
  )
}
