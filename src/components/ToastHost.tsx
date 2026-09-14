/** Toast stack — bottom-center so it never covers the inspector you are typing in. */
import { useEffect } from 'react'
import { AlertCircle, CheckCircle2, Info, Sparkles, X } from 'lucide-react'
import { useUI, type Toast } from '../store/useUI'
import { cn } from '../lib/cn'

const TONE: Record<string, { icon: typeof Info; ring: string; tint: string }> = {
  info: { icon: Info, ring: 'ring-ink-700', tint: 'text-ink-200' },
  success: { icon: CheckCircle2, ring: 'ring-good/35', tint: 'text-good' },
  error: { icon: AlertCircle, ring: 'ring-red-500/40', tint: 'text-red-300' },
  ai: { icon: Sparkles, ring: 'ring-ai/40', tint: 'text-[#cfc6ff]' },
}

export function ToastHost() {
  const toasts = useUI((s) => s.toasts)
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex flex-col items-center gap-1.5 px-4">
      {toasts.map((t) => (
        <ToastRow key={t.id} toast={t} />
      ))}
    </div>
  )
}

function ToastRow({ toast: t }: { toast: Toast }) {
  const dismiss = useUI((st) => st.dismiss)
  useEffect(() => {
    const ms = t.ttl ?? (t.action ? 8000 : 4200)
    const id = window.setTimeout(() => dismiss(t.id), ms)
    return () => window.clearTimeout(id)
  }, [t.id, t.action, t.ttl, dismiss])
  const tone = TONE[t.kind] ?? TONE.info
  const Icon = tone.icon
  return (
    <div className={cn('animate-[slide-up_.2s_cubic-bezier(.22,1,.36,1)] pointer-events-auto flex max-w-md items-start gap-2.5 rounded-xl border border-ink-700 bg-ink-900/95 px-3 py-2.5 shadow-float ring-1 backdrop-blur', tone.ring)}>
      <Icon size={15} className={cn('mt-0.5 shrink-0', tone.tint)} />
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-semibold text-ink-50">{t.title}</p>
        {t.body ? <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-400">{t.body}</p> : null}
      </div>
      {t.action ? (
        <button
          type="button"
          onClick={() => {
            t.action?.run()
            dismiss(t.id)
          }}
          className="shrink-0 rounded-lg border border-ink-600 bg-ink-850 px-2 py-1 text-[11.5px] font-medium text-ink-100 transition-colors hover:bg-ink-800"
        >
          {t.action.label}
        </button>
      ) : null}
      <button type="button" onClick={() => dismiss(t.id)} className="shrink-0 rounded p-0.5 text-ink-500 transition-colors hover:text-ink-100" title="إغلاق">
        <X size={13} />
      </button>
    </div>
  )
}
