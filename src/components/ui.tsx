import { cva, type VariantProps } from 'class-variance-authority'
import { ChevronDown, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react'
import { cn } from '../lib/cn'

/* ------------------------------------------------------------------ button */

const button = cva(
  'relative inline-flex select-none items-center justify-center gap-2 rounded-md font-medium transition-[background,color,box-shadow,transform] duration-150 active:translate-y-[0.5px] disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        primary: 'bg-signal text-white hover:brightness-110 shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_6px_18px_-8px_rgba(255,90,54,0.75)]',
        solid: 'bg-ink-50 text-ink-950 hover:bg-white',
        surface: 'bg-ink-800 text-ink-50 hover:bg-ink-750 border border-ink-700/70',
        ghost: 'text-ink-200 hover:bg-ink-800 hover:text-ink-50',
        subtle: 'bg-ink-850 text-ink-200 hover:bg-ink-800 hover:text-ink-50',
        ai: 'bg-ai/15 text-[#cfc6ff] hover:bg-ai/25 border border-ai/30',
        danger: 'bg-red-500/12 text-red-300 hover:bg-red-500/20 border border-red-500/25',
        outline: 'border border-ink-700 text-ink-100 hover:border-ink-600 hover:bg-ink-850',
      },
      size: {
        sm: 'h-7 px-2.5 text-[12px]',
        md: 'h-9 px-3.5 text-[13px]',
        lg: 'h-11 px-5 text-[14px]',
        icon: 'h-8 w-8 p-0',
        iconSm: 'h-7 w-7 p-0 rounded-[6px]',
      },
    },
    defaultVariants: { variant: 'ghost', size: 'md' },
  },
)

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof button> {
  tip?: string
  active?: boolean
}

export function Button({ variant, size, className, tip, active, children, ...rest }: ButtonProps) {
  return (
    <button type="button" data-tip={tip} className={cn(button({ variant, size }), active && 'bg-ink-750 text-ink-50 ring-1 ring-ink-600/60', 'tip', className)} {...rest}>
      {children}
    </button>
  )
}

export const IconButton = ({ children, className, ...rest }: ButtonProps) => (
  <Button size="icon" variant={rest.variant ?? 'ghost'} className={className} {...rest}>
    {children}
  </Button>
)

/* ------------------------------------------------------------------ layout bits */

export function Row({ children, className, align = 'center' }: { children: ReactNode; className?: string; align?: 'center' | 'start' }) {
  return <div className={cn('flex items-center gap-2', align === 'start' && 'items-start', className)}>{children}</div>
}

export function Field({ label, children, hint, className }: { label?: string; children: ReactNode; hint?: string; className?: string }) {
  return (
    <label className={cn('flex items-center justify-between gap-3', className)}>
      {label ? <span className="shrink-0 text-[11.5px] font-medium text-ink-300">{label}</span> : null}
      <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">{children}</div>
      {hint ? <span className="text-[10px] text-ink-400">{hint}</span> : null}
    </label>
  )
}

export function Section({ title, children, right, defaultOpen = true, dense }: { title: string; children: ReactNode; right?: ReactNode; defaultOpen?: boolean; dense?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="border-b border-ink-800/80">
      <header className={cn('flex items-center gap-2 px-3', dense ? 'h-9' : 'h-10')}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 items-center gap-1.5 text-[12px] font-semibold text-ink-100 hover:text-white"
        >
          <ChevronDown className={cn('size-3.5 text-ink-400 transition-transform', !open && '-rotate-90 rtl:rotate-90')} strokeWidth={2.2} />
          {title}
        </button>
        {right}
      </header>
      {open ? <div className="space-y-2 px-3 pb-3.5">{children}</div> : null}
    </section>
  )
}

export function GroupLabel({ children }: { children: ReactNode }) {
  return <div className="pt-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-ink-400">{children}</div>
}

/* ------------------------------------------------------------------ inputs */

export function NumberField({
  value,
  onChange,
  min = -100000,
  max = 100000,
  step = 1,
  suffix,
  label,
  disabled,
  compact,
}: {
  value: number | undefined
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
  label?: string
  disabled?: boolean
  compact?: boolean
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const scrub = useRef<{ x: number; v: number } | null>(null)
  const shown = draft ?? (Number.isFinite(value) ? String(round(value ?? 0, 2)) : '')
  const id = useId()

  const commit = (raw: string) => {
    const n = Number(raw.replace(/[^\d.-]/g, ''))
    if (Number.isFinite(n)) onChange(clampNum(n, min, max))
    setDraft(null)
  }

  return (
    <div
      className={cn(
        'group flex items-center gap-1 rounded-[7px] border border-ink-700/70 bg-ink-850 px-1.5 transition-colors focus-within:border-signal/70 focus-within:bg-ink-900',
        compact ? 'h-7' : 'h-8',
        disabled && 'opacity-50',
      )}
      dir="ltr"
    >
      {label ? (
        <label
          htmlFor={id}
          onPointerDown={(e) => {
            if (disabled) return
            scrub.current = { x: e.clientX, v: value ?? 0 }
            ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
          }}
          onPointerMove={(e) => {
            if (!scrub.current) return
            const delta = Math.round((e.clientX - scrub.current.x) / 3) * step
            onChange(clampNum(scrub.current.v + delta, min, max))
          }}
          onPointerUp={() => (scrub.current = null)}
          className="cursor-ew-resize select-none ps-0.5 text-[10.5px] font-semibold text-ink-400 group-hover:text-ink-300"
        >
          {label}
        </label>
      ) : null}
      <input
        id={id}
        value={shown}
        disabled={disabled}
        inputMode="decimal"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit((e.target as HTMLInputElement).value)
          if (e.key === 'ArrowUp') {
            e.preventDefault()
            onChange(clampNum((value ?? 0) + (e.shiftKey ? step * 10 : step), min, max))
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            onChange(clampNum((value ?? 0) - (e.shiftKey ? step * 10 : step), min, max))
          }
        }}
        className="min-w-0 flex-1 bg-transparent py-0 text-center text-[12px] tabular-nums text-ink-50 outline-none"
      />
      {suffix ? <span className="pe-0.5 text-[10px] text-ink-400">{suffix}</span> : null}
    </div>
  )
}

export function TextField({ value, onChange, placeholder, className, onEnter }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string; onEnter?: () => void }) {
  return (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onEnter?.()
        e.stopPropagation()
      }}
      className={cn('h-8 w-full rounded-[7px] border border-ink-700/70 bg-ink-850 px-2 text-[12.5px] text-ink-50 outline-none placeholder:text-ink-500 focus:border-signal/70 focus:bg-ink-900', className)}
    />
  )
}

export function TextArea({ value, onChange, rows = 4, placeholder, dir }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string; dir?: 'rtl' | 'ltr' }) {
  return (
    <textarea
      value={value}
      rows={rows}
      dir={dir}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.stopPropagation()}
      className="w-full resize-none rounded-[9px] border border-ink-700/70 bg-ink-850 p-2.5 text-[12.5px] leading-relaxed text-ink-50 outline-none placeholder:text-ink-500 focus:border-signal/70 focus:bg-ink-900"
    />
  )
}

export function Segmented<T extends string>({ value, onChange, options, size = 'md', className }: { value: T; onChange: (v: T) => void; options: { value: T; label?: ReactNode; tip?: string }[]; size?: 'sm' | 'md'; className?: string }) {
  return (
    <div className={cn('inline-flex items-center gap-0.5 rounded-[8px] border border-ink-700/60 bg-ink-900/80 p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          data-tip={o.tip}
          onClick={() => onChange(o.value)}
          className={cn(
            'tip rounded-[6px] font-medium transition-colors',
            size === 'sm' ? 'h-6 px-2 text-[11px]' : 'h-7 px-2.5 text-[12px]',
            value === o.value ? 'bg-ink-700 text-white shadow-[0_1px_0_rgba(255,255,255,0.08)_inset]' : 'text-ink-300 hover:bg-ink-800 hover:text-ink-100',
          )}
        >
          {o.label ?? o.value}
        </button>
      ))}
    </div>
  )
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="group flex items-center gap-2" role="switch" aria-checked={checked}>
      <span className={cn('relative h-[18px] w-[32px] rounded-full border transition-colors', checked ? 'border-signal/50 bg-signal/85' : 'border-ink-600 bg-ink-800')}>
        <span className={cn('absolute top-[2px] size-[12px] rounded-full bg-white transition-all', checked ? 'start-[16px]' : 'start-[3px]')} />
      </span>
      {label ? <span className="text-[12px] text-ink-200 group-hover:text-ink-50">{label}</span> : null}
    </button>
  )
}

export function Slider({ value, onChange, min = 0, max = 100, step = 1, label, suffix, onCommit }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; label?: string; suffix?: string; onCommit?: () => void }) {
  return (
    <div className="flex items-center gap-2">
      {label ? <span className="w-12 shrink-0 text-[11px] text-ink-300">{label}</span> : null}
      <input
        type="range"
        dir="ltr"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerUp={onCommit}
        className="range-input h-1.5 flex-1"
      />
      <span className="w-10 shrink-0 text-end text-[11px] tabular-nums text-ink-300">
        {round(value, 2)}
        {suffix}
      </span>
    </div>
  )
}

export function Select<T extends string>({ value, onChange, options, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-8 w-full appearance-none rounded-[7px] border border-ink-700/70 bg-ink-850 ps-2 pe-7 text-[12.5px] text-ink-50 outline-none focus:border-signal/70"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-ink-900 text-ink-50">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute end-2 top-1/2 size-3.5 -translate-y-1/2 text-ink-400" />
    </div>
  )
}

/* ------------------------------------------------------------------ color */

const RECENT: string[] = []

export function ColorField({ value, onChange, allowTransparent, label }: { value: string | undefined; onChange: (v: string) => void; allowTransparent?: boolean; label?: string }) {
  const [open, setOpen] = useState(false)
  const isNone = !value || value === 'transparent'
  const swatch = isNone ? 'none' : value
  return (
    <div className="relative flex items-center gap-1.5">
      {label ? <span className="text-[11px] text-ink-300">{label}</span> : null}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-7 w-7 place-items-center overflow-hidden rounded-[7px] border border-ink-600"
        style={{ background: isNone ? 'transparent' : swatch }}
        aria-label="اختيار لون"
      >
        {isNone ? <span className="absolute inset-0 bg-[linear-gradient(45deg,transparent_45%,#f55_45%,#f55_55%,transparent_55%)]" /> : null}
      </button>
      <input
        value={isNone ? '' : (value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => {
          const raw = e.target.value.trim()
          if (!raw) onChange('transparent')
          else if (/^#?[0-9a-f]{3}([0-9a-f]{3})?$/i.test(raw)) onChange(raw.startsWith('#') ? raw : `#${raw}`)
        }}
        onKeyDown={(e) => e.stopPropagation()}
        placeholder={allowTransparent ? 'none' : ''}
        dir="ltr"
        className="h-7 w-[74px] rounded-[6px] border border-ink-700/70 bg-ink-850 px-1.5 text-center text-[11.5px] uppercase tracking-wide text-ink-100 outline-none focus:border-signal/70"
      />
      {open ? (
        <ColorPopover value={isNone ? '#ffffff' : (value ?? '#ffffff')} onPick={(c) => onChange(c)} onClear={allowTransparent ? () => onChange('transparent') : undefined} onClose={() => setOpen(false)} />
      ) : null}
    </div>
  )
}

function ColorPopover({ value, onPick, onClear, onClose }: { value: string; onPick: (c: string) => void; onClear?: () => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onDoc = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('pointerdown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])
  return (
    <div ref={ref} className="absolute bottom-9 end-0 z-50 w-[212px] animate-pop-in rounded-xl border border-ink-700 bg-ink-850 p-3 shadow-float">
      <input type="color" value={toHexColor(value)} onChange={(e) => onPick(e.target.value)} className="h-8 w-full cursor-pointer rounded-md border border-ink-700 bg-transparent" />
      <div className="mt-2.5 grid grid-cols-9 gap-1.5">
        {PALETTE.map((c) => (
          <button key={c} type="button" onClick={() => onPick(c)} className="size-[18px] rounded-[5px] border border-black/20 transition-transform hover:scale-110" style={{ background: c }} />
        ))}
      </div>
      {RECENT.length ? (
        <div className="mt-2.5 grid grid-cols-9 gap-1.5">
          {RECENT.map((c) => (
            <button key={c} type="button" onClick={() => onPick(c)} className="size-[18px] rounded-[5px] border border-black/20" style={{ background: c }} />
          ))}
        </div>
      ) : null}
      <div className="mt-2.5 flex items-center justify-between">
        {onClear ? (
          <button type="button" onClick={onClear} className="text-[11px] text-ink-300 hover:text-ink-100">
            بدون
          </button>
        ) : (
          <span />
        )}
        <button type="button" onClick={onClose} className="text-[11px] text-ink-300 hover:text-ink-100">
          إغلاق
        </button>
      </div>
    </div>
  )
}

const PALETTE = [
  '#000000', '#111114', '#2a2a32', '#5a6672', '#8f8f9b', '#d3d7de', '#f4f6f8', '#ffffff', '#fef3c7',
  '#7c2d12', '#b45309', '#f59e0b', '#fcd34d', '#065f46', '#059669', '#34d399', '#a7f3d0', '#0f172a',
  '#1e3a8a', '#2563eb', '#60a5fa', '#bfdbfe', '#4c1d95', '#7c3aed', '#a78bfa', '#ddd6fe', '#500724',
  '#9f1239', '#e11d48', '#fb7185', '#fecdd3', '#134e4a', '#0f766e', '#14b8a6', '#5eead4', '#1c1917',
]

function toHexColor(c: string): string {
  const m = /^#([0-9a-f]{6})$/i.exec(c)
  if (m) return c
  const m3 = /^#([0-9a-f]{3})$/i.exec(c)
  if (m3) return `#${m3[1].split('').map((x) => x + x).join('')}`
  return '#111114'
}

/* ------------------------------------------------------------------ overlays */

export function Modal({ open, onClose, title, children, width = 620, footer }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; width?: number; footer?: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-1000/72 backdrop-blur-[2px]" onPointerDown={onClose} />
      <div className="relative flex max-h-[86vh] w-full animate-pop-in flex-col overflow-hidden rounded-2xl border border-ink-700/80 bg-ink-900 shadow-float" style={{ maxWidth: width }}>
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-ink-800 px-4">
          <h2 className="text-[14px] font-semibold text-ink-50">{title}</h2>
          <IconButton size="iconSm" onClick={onClose} tip="إغلاق">
            <X className="size-4" />
          </IconButton>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer ? <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-ink-800 px-4 py-3">{footer}</footer> : null}
      </div>
    </div>
  )
}

export function Popover({ trigger, children, align = 'start', className }: { trigger: (p: { open: boolean; toggle: () => void }) => ReactNode; children: ReactNode | ((close: () => void) => ReactNode); align?: 'start' | 'end'; className?: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDoc = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDoc)
    return () => document.removeEventListener('pointerdown', onDoc)
  }, [open])
  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      {open ? (
        <div className={cn('absolute top-[calc(100%+6px)] z-50 min-w-[190px] animate-pop-in rounded-xl border border-ink-700 bg-ink-850 p-1.5 shadow-float', align === 'end' ? 'end-0' : 'start-0', className)}>
          {typeof children === 'function' ? children(() => setOpen(false)) : children}
        </div>
      ) : null}
    </div>
  )
}

export function MenuItem({ children, onClick, icon, danger, disabled, active, shortcut }: { children: ReactNode; onClick?: () => void; icon?: ReactNode; danger?: boolean; disabled?: boolean; active?: boolean; shortcut?: string }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-[7px] px-2 py-1.5 text-start text-[12.5px] transition-colors disabled:opacity-40',
        danger ? 'text-red-300 hover:bg-red-500/12' : 'text-ink-100 hover:bg-ink-750',
        active && 'bg-ink-750 text-white',
      )}
    >
      <span className="grid w-4 shrink-0 place-items-center text-ink-400">{icon}</span>
      <span className="flex-1">{children}</span>
      {shortcut ? <kbd className="font-mono text-[10px] text-ink-500">{shortcut}</kbd> : null}
    </button>
  )
}

export function Chip({ children, onClick, active, className, style, title, disabled }: { children: ReactNode; onClick?: () => void; active?: boolean; className?: string; style?: CSSProperties; title?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      title={title}
      disabled={disabled}
      className={cn(
        'rounded-full border px-2.5 py-[3px] text-[11.5px] font-medium transition-colors disabled:opacity-40',
        active ? 'border-signal/60 bg-signal/15 text-signal-soft' : 'border-ink-700/70 bg-ink-850 text-ink-300 hover:border-ink-600 hover:text-ink-100',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function Divider({ vertical, className }: { vertical?: boolean; className?: string }) {
  return vertical ? <span className={cn('mx-1 h-5 w-px bg-ink-700', className)} /> : <span className={cn('my-1 h-px w-full bg-ink-800', className)} />
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border border-ink-600 bg-ink-800 px-1.5 py-[1px] font-mono text-[10px] text-ink-200">{children}</kbd>
}

export function Empty({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      {icon ? <div className="grid size-11 place-items-center rounded-xl border border-ink-700 bg-ink-850 text-ink-400">{icon}</div> : null}
      <div>
        <p className="text-[13.5px] font-semibold text-ink-100">{title}</p>
        {body ? <p className="mt-1 max-w-[46ch] text-[12px] leading-relaxed text-ink-400">{body}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function TooltipHost({ children }: { children: ReactNode }) {
  return <>{children}</>
}

/* ------------------------------------------------------------------ utils */

function round(v: number, d = 0): number {
  const f = 10 ** d
  return Math.round(v * f) / f
}

function clampNum(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

export function pushRecent(color: string) {
  if (!RECENT.includes(color)) {
    RECENT.unshift(color)
    RECENT.splice(0, 12)
  }
}
