/**
 * FeatureStrip — the thin futuristic row under the hero, sitting directly
 * on the background (no panel, as in the reference):
 * AI Assistant · Professional Templates · PPTX Export · Real-time Editing
 */
import { FileDown, LayoutTemplate, PenLine, Sparkles } from 'lucide-react'
import { Reveal } from './Reveal'

const FEATURES = [
  { icon: Sparkles, label: 'AI Assistant', tint: 'rgba(139,92,246,0.7)' },
  { icon: LayoutTemplate, label: 'Professional Templates', tint: 'rgba(79,125,255,0.7)' },
  { icon: FileDown, label: 'PPTX Export', tint: 'rgba(34,211,238,0.7)' },
  { icon: PenLine, label: 'Real-time Editing', tint: 'rgba(168,85,247,0.7)' },
]

export function FeatureStrip() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 pb-12 pt-2">
      <Reveal>
        <div dir="ltr" className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 xl:justify-between">
          {FEATURES.map(({ icon: Icon, label, tint }) => (
            <div key={label} className="flex items-center gap-3">
              <span
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/12 bg-white/[0.04]"
                style={{ boxShadow: `0 0 16px -6px ${tint}, inset 0 1px 0 rgba(255,255,255,0.08)` }}
              >
                <Icon className="h-[15px] w-[15px] text-[#c9d6ff]" strokeWidth={2} aria-hidden />
              </span>
              <span className="slf-display-en text-[13px] font-medium text-[#b7c2e2]">{label}</span>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
