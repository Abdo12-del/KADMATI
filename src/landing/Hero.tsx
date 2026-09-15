/**
 * Hero — cinematic split matching the reference: Arabic headline block on
 * the left (right-aligned RTL), floating tilted editor mockup on the right,
 * with an aurora ribbon cascading down the left edge.
 */
import { ArrowLeft } from 'lucide-react'
import { EditorMockup } from './EditorMockup'
import { Reveal } from './Reveal'

export function Hero({ onStart, onTemplates }: { onStart: () => void; onTemplates: () => void }) {
  return (
    <section className="relative mx-auto max-w-7xl px-6 pb-10 pt-32 md:pt-40 lg:pb-14 lg:pt-44">
      {/* hero-local aurora accents */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-visible">
        {/* ribbon cascading down the left edge */}
        <div
          className="slf-ribbon slf-ribbon-violet"
          style={{ top: '-18%', left: '-22%', width: '48%', height: '125%', rotate: '58deg', opacity: 0.65 }}
        />
        <div
          className="slf-glow"
          style={{ top: '30%', left: '-6%', width: '30%', height: 340, background: 'radial-gradient(closest-side, rgba(232,121,249,0.16), transparent)' }}
        />
      </div>

      <div className="relative grid items-center gap-14 lg:grid-cols-[1fr_1.15fr] lg:gap-8 xl:gap-12">
        {/* ---- copy (left in the reference, right-aligned RTL) ---- */}
        <Reveal className="lg:order-1">
          <h1 className="slf-display text-[42px] font-extrabold leading-[1.3] text-white sm:text-[52px] lg:text-[54px] xl:text-[58px]">
            <span className="block drop-shadow-[0_0_28px_rgba(190,210,255,0.25)]">صمّم عروضًا تقديمية</span>
            <span className="slf-grad-cyan block drop-shadow-[0_0_36px_rgba(94,180,255,0.35)]">تستحق أن تُعرض.</span>
          </h1>

          <p className="mt-6 max-w-lg text-[15.5px] leading-8 text-[#9aa7cc] md:text-[16.5px]">
            من أفكارك إلى عروض احترافية، في منصة تجمع بين الإبداع والذكاء الاصطناعي.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <button type="button" onClick={onStart} className="slf-btn slf-btn-primary h-12 px-7 text-[15px]">
              ابدأ الآن
              <ArrowLeft className="h-4 w-4" strokeWidth={2.4} aria-hidden />
            </button>
            <button type="button" onClick={onTemplates} className="slf-btn slf-btn-glass h-12 px-7 text-[15px]">
              استكشف القوالب
            </button>
          </div>
        </Reveal>

        {/* ---- editor mockup (right in the reference) ---- */}
        <Reveal delay="140ms" className="lg:order-2">
          <div className="mx-auto w-full max-w-[620px] pb-8 lg:max-w-none">
            <EditorMockup />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
