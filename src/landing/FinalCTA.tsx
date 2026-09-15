/**
 * FinalCTA — the visual climax, matching the reference: a cinematic aurora
 * valley — dark blue-purple mountains framing both sides, pink/violet
 * curtains and horizon light, reflective water below. Centered heading +
 * light glass "ابدأ الآن" pill, faint templates link, a vertical Scroll
 * hint on the left edge and a handwritten "Ideas into Slides" signature.
 */
import { ArrowLeft } from 'lucide-react'
import { Reveal } from './Reveal'

export function FinalCTA({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative mt-8 overflow-hidden">
      <div className="relative flex min-h-[94vh] flex-col">
        {/* ---- sky ---- */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, #04091a 0%, #0a1036 28%, #251252 52%, #3d1d6b 64%, #171a48 76%, #050a20 100%)',
            }}
          />
          {/* aurora ribbons */}
          <div className="slf-ribbon slf-ribbon-magenta" style={{ top: '2%', left: '-10%', width: '80%', height: 240, opacity: 0.8 }} />
          <div className="slf-ribbon slf-ribbon-violet" style={{ top: '10%', right: '-14%', width: '85%', height: 260, opacity: 0.9 }} />
          <div className="slf-ribbon slf-ribbon-cyan" style={{ top: '22%', left: '6%', width: '60%', height: 200, opacity: 0.55 }} />
          {/* light curtains */}
          <i className="slf-curtain" style={{ left: '14%', ['--c1' as string]: 'rgba(232,121,249,0.55)', ['--c2' as string]: 'rgba(168,85,247,0.4)' }} />
          <i className="slf-curtain" style={{ left: '38%', width: 110, opacity: 0.4, ['--c1' as string]: 'rgba(139,92,246,0.5)', ['--c2' as string]: 'rgba(59,130,246,0.35)' }} />
          <i className="slf-curtain" style={{ left: '62%', width: 170, opacity: 0.5, ['--c1' as string]: 'rgba(249,168,212,0.45)', ['--c2' as string]: 'rgba(124,92,252,0.4)' }} />
          {/* horizon light */}
          <div className="slf-horizon-glow" />
          {/* stars */}
          <div className="slf-stars" style={{ inset: '0 0 34% 0' }} />
          <div className="slf-stars slf-stars-2" style={{ inset: '0 0 30% 0' }} />
        </div>

        {/* ---- content ---- */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-[330px] pt-24 text-center md:pb-[400px] md:pt-28">
          <Reveal>
            <h2 className="slf-display max-w-3xl text-[36px] font-extrabold leading-[1.3] text-white drop-shadow-[0_0_44px_rgba(200,160,255,0.35)] sm:text-[46px] md:text-[52px]">
              ابدأ رحلتك الإبداعية الآن
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[15.5px] leading-8 text-[#c3bce4] md:text-[17px]">
              انضم إلى آلاف المبدعين الذين يحوّلون أفكارهم إلى عروض استثنائية
            </p>
            <button type="button" onClick={onStart} className="slf-btn slf-btn-light mt-9 h-12 px-8 text-[15.5px]">
              ابدأ الآن
              <ArrowLeft className="h-4 w-4" strokeWidth={2.4} aria-hidden />
            </button>
            <div>
              <a href="#templates" className="mt-5 inline-block text-[12.5px] text-white/40 transition-colors hover:text-white/80">
                أو استكشف القوالب الجاهزة
              </a>
            </div>
          </Reveal>
        </div>

        {/* ---- mountains + reflective water ---- */}
        <div aria-hidden className="absolute inset-x-0 bottom-0 z-[5]">
          {/* valley: tall ridges on both sides, open center */}
          <svg viewBox="0 0 1440 300" preserveAspectRatio="none" className="block h-[180px] w-full md:h-[230px]" style={{ marginBottom: -1 }}>
            <defs>
              <linearGradient id="mtn-far" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2c1d5e" />
                <stop offset="100%" stopColor="#120c34" />
              </linearGradient>
              <linearGradient id="mtn-near" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#151038" />
                <stop offset="100%" stopColor="#050518" />
              </linearGradient>
            </defs>
            <path
              fill="url(#mtn-far)"
              d="M0 300 L0 96 L60 46 L130 130 L210 78 L300 160 L390 120 L490 196 L590 224 L720 238 L850 226 L950 190 L1030 128 L1120 200 L1210 108 L1300 176 L1380 130 L1440 170 L1440 300 Z"
            />
            <path
              fill="url(#mtn-near)"
              d="M0 300 L0 150 L80 96 L170 190 L260 140 L360 226 L470 252 L620 262 L780 254 L900 226 L1000 176 L1100 240 L1210 180 L1320 244 L1440 196 L1440 300 Z"
            />
          </svg>

          {/* water */}
          <div className="relative h-[160px] md:h-[200px]">
            <div className="slf-horizon-line" style={{ top: -1 }} />
            {/* mirrored silhouette */}
            <svg viewBox="0 0 1440 300" preserveAspectRatio="none" className="absolute inset-x-0 top-0 block h-[100px] w-full scale-y-[-1] opacity-20 md:h-[130px]" style={{ maskImage: 'linear-gradient(180deg, transparent 0%, black 75%)', WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, black 75%)' }}>
              <path fill="#241a52" d="M0 300 L0 96 L60 46 L130 130 L210 78 L300 160 L390 120 L490 196 L590 224 L720 238 L850 226 L950 190 L1030 128 L1120 200 L1210 108 L1300 176 L1380 130 L1440 170 L1440 300 Z" />
            </svg>
            {/* sky reflection */}
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(180deg, rgba(190,90,220,0.28) 0%, rgba(90,50,160,0.2) 30%, rgba(10,8,34,0.75) 100%)' }}
            />
            <i className="slf-water-lines absolute inset-0" />
            {/* reflected light column */}
            <i
              className="absolute"
              style={{ top: '-12%', left: '50%', translate: '-50% 0', width: '46%', height: '110%', background: 'radial-gradient(46% 58% at 50% 34%, rgba(240,150,255,0.32), rgba(124,92,252,0.18) 55%, transparent 75%)', filter: 'blur(18px)', mixBlendMode: 'screen' }}
            />
          </div>
        </div>

        {/* ---- scroll hint (left edge) ---- */}
        <div aria-hidden dir="ltr" className="absolute bottom-10 left-6 z-10 hidden flex-col items-center gap-3 lg:flex">
          <span className="flex h-9 w-6 items-start justify-center rounded-full border border-white/30 p-1.5">
            <i className="slf-scroll-dot h-1.5 w-1 rounded-full bg-white/80" />
          </span>
          <span className="h-10 w-px bg-gradient-to-b from-white/40 to-transparent" />
          <span className="slf-display-en text-[10.5px] tracking-[0.3em] text-white/50" style={{ writingMode: 'vertical-rl' }}>
            SCROLL
          </span>
        </div>

        {/* ---- handwritten signature (bottom right) ---- */}
        <div
          aria-hidden
          dir="ltr"
          className="slf-script absolute bottom-20 right-10 z-10 hidden rotate-[-8deg] text-right text-[40px] leading-[0.95] text-[#a5ecff] lg:block"
          style={{ textShadow: '0 0 26px rgba(110,220,255,0.55), 0 0 70px rgba(110,160,255,0.35)' }}
        >
          Ideas
          <br />
          into Slides
        </div>
      </div>
    </section>
  )
}
