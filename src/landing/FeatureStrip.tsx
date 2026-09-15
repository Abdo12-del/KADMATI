/**
 * FeatureStrip — the thin futuristic row under the hero:
 * AI Assistant · Professional Templates · PPTX Export · Real-time Editing
 */
import { FileDown, LayoutTemplate, Sparkles, Zap } from 'lucide-react'
import { Reveal } from './Reveal'

const FEATURES = [
  { icon: Sparkles, label: 'AI Assistant', tint: 'rgba(124,92,252,0.55)' },
  { icon: LayoutTemplate, label: 'Professional Templates', tint: 'rgba(62,109,255,0.55)' },
  { icon: FileDown, label: 'PPTX Export', tint: 'rgba(34,211,238,0.55)' },
  { icon: Zap, label: 'Real-time Editing', tint: 'rgba(168,85,247,0.55)' },
]

export function FeatureStrip() {
  return (
    <section className="relative mx-auto max-w-5xl px-6 pb-8 pt-6">
      <Reveal>
        <div
          dir="ltr"
          className="slf-glass-soft flex flex-wrap items-center justify-center gap-x-8 gap-y-4 rounded-2xl px-8 py-4 xl:justify-between lg:px-12"
        >
          {FEATURES.map(({ icon: Icon, label, tint }, i) => (
            <div key={label} className="flex items-center gap-3.5">
              {i > 0 && <span aria-hidden className="hidden h-5 w-px bg-white/10 xl:block" />}
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/12 bg-white/[0.06]"
                style={{ boxShadow: `0 0 18px -4px ${tint}, inset 0 1px 0 rgba(255,255,255,0.12)` }}
              >
                <Icon className="h-4 w-4 text-[#c9d6ff]" strokeWidth={2} aria-hidden />
              </span>
              <span className="slf-display-en text-[13.5px] font-medium tracking-wide text-[#c3cdea]">
                {label}
              </span>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
