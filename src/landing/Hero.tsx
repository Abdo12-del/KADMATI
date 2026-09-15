/**
 * Hero — cinematic split: Arabic headline on the left, floating tilted
 * presentation-editor mockup on the right (as in the reference).
 */
import { ArrowLeft, Sparkles } from 'lucide-react'
import { EditorMockup } from './EditorMockup'
import { Reveal } from './Reveal'

export function Hero({ onStart, onTemplates }: { onStart: () => void; onTemplates: () => void }) {
  return (
    <section className="relative mx-auto max-w-7xl px-6 pb-16 pt-36 md:pt-44 lg:pb-24 lg:pt-48">
      {/* hero-local aurora accents */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-visible">
        <div
          className="slf-glow"
          style={{ top: '-6%', insetInlineStart: '30%', width: '52%', height: 320, background: 'radial-gradient(closest-side, rgba(79,125,255,0.22), transparent)' }}
        />
        <div
          className="slf-glow"
          style={{ top: '22%', insetInlineEnd: '-4%', width: '38%', height: 360, background: 'radial-gradient(closest-side, rgba(139,92,246,0.2), transparent)', animationDelay: '-6s' }}
        />
      </div>

      <div className="relative grid items-center gap-14 lg:grid-cols-[1.02fr_1.1fr] lg:gap-8 xl:gap-14">
        {/* ---- copy (left in the reference) ---- */}
        <Reveal className="lg:order-2">
          <h1 className="slf-display text-[42px] font-extrabold leading-[1.28] text-white sm:text-[54px] lg:text-[58px] xl:text-[64px]">
            <span className="block drop-shadow-[0_0_28px_rgba(190,210,255,0.25)]">صمّم عروضًا تقديمية</span>
            <span className="slf-grad block drop-shadow-[0_0_36px_rgba(124,92,252,0.35)]">تستحق أن تُعرض.</span>
          </h1>

          <p className="mt-6 max-w-xl text-[17px] leading-8 text-[#a7b4d8] md:text-[18px]">
            من أفكارك إلى عروض احترافية، في منصة تجمع بين الإبداع والذكاء الاصطناعي.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <button type="button" onClick={onStart} className="slf-btn slf-btn-primary h-[52px] px-8 text-[16px]">
              <Sparkles className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
              ابدأ الآن
            </button>
            <button type="button" onClick={onTemplates} className="slf-btn slf-btn-glass h-[52px] px-8 text-[16px]">
              استكشف القوالب
              <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
            </button>
          </div>
        </Reveal>

        {/* ---- editor mockup (right in the reference) ---- */}
        <Reveal delay="140ms" className="lg:order-1">
          <div className="mx-auto w-full max-w-[640px] lg:max-w-none">
            <EditorMockup />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
