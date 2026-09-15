/**
 * FinalCTA — the visual climax: a cinematic aurora landscape with dark blue
 * mountains, purple/cyan aurora light, reflective water, and the centered
 * closing message.
 */
import { Sparkles } from 'lucide-react'
import { Reveal } from './Reveal'

export function FinalCTA({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative mt-10 overflow-hidden">
      <div className="relative flex min-h-[92vh] flex-col">
        {/* ---- sky ---- */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, rgba(3,8,23,0) 0%, rgba(4,10,26,0.6) 55%, #03091c 100%)' }}
          />
          {/* aurora ribbons above the horizon */}
          <div className="slf-ribbon slf-ribbon-cyan" style={{ top: '6%', insetInlineStart: '-14%', width: '120%', height: 260, opacity: 0.85 }} />
          <div className="slf-ribbon slf-ribbon-violet" style={{ top: '16%', insetInlineEnd: '-16%', width: '115%', height: 280, opacity: 0.9 }} />
          <div className="slf-ribbon slf-ribbon-magenta" style={{ top: '2%', insetInlineEnd: '4%', width: '70%', height: 200, opacity: 0.6 }} />
          <div className="slf-ribbon slf-ribbon-blue" style={{ top: '26%', insetInlineStart: '2%', width: '95%', height: 240, opacity: 0.8 }} />
          {/* horizon light */}
          <div className="slf-horizon-glow" />
          {/* stars */}
          <div className="slf-stars" style={{ inset: '0 0 34% 0' }} />
          <div className="slf-stars slf-stars-2" style={{ inset: '0 0 30% 0' }} />
        </div>

        {/* ---- content ---- */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-[340px] pt-24 text-center md:pb-[410px] md:pt-28">
          <Reveal>
            <h2 className="slf-display max-w-3xl text-[38px] font-extrabold leading-[1.3] text-white drop-shadow-[0_0_44px_rgba(160,190,255,0.35)] sm:text-[52px] md:text-[60px]">
              ابدأ رحلتك الإبداعية <span className="slf-grad">الآن</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-[16.5px] leading-8 text-[#b7c2e2] md:text-[18px]">
              حوّل أفكارك إلى عروض تستحق أن تُعرض.
            </p>
            <button type="button" onClick={onStart} className="slf-btn slf-btn-primary mt-10 h-[56px] px-10 text-[17px]">
              <Sparkles className="h-[19px] w-[19px]" strokeWidth={2.2} aria-hidden />
              ابدأ الآن
            </button>
          </Reveal>
        </div>

        {/* ---- mountains + reflective water ---- */}
        <div aria-hidden className="absolute inset-x-0 bottom-0 z-[5]">
          {/* far mountains */}
          <svg viewBox="0 0 1440 260" preserveAspectRatio="none" className="block h-[130px] w-full md:h-[170px]" style={{ marginBottom: -1 }}>
            <defs>
              <linearGradient id="mtn-far" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#12234d" />
                <stop offset="100%" stopColor="#081228" />
              </linearGradient>
              <linearGradient id="mtn-mid" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0d1a3c" />
                <stop offset="100%" stopColor="#050c1f" />
              </linearGradient>
              <linearGradient id="mtn-near" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#070f26" />
                <stop offset="100%" stopColor="#020610" />
              </linearGradient>
            </defs>
            <path
              fill="url(#mtn-far)"
              d="M0 208 L90 128 L170 176 L260 96 L360 168 L450 120 L540 172 L640 88 L740 164 L830 116 L930 172 L1030 100 L1130 168 L1230 112 L1330 176 L1440 124 L1440 260 L0 260 Z"
            />
            <path
              fill="url(#mtn-mid)"
              d="M0 236 L120 172 L210 212 L330 148 L430 208 L540 164 L650 216 L770 152 L880 212 L990 168 L1100 220 L1220 160 L1330 214 L1440 176 L1440 260 L0 260 Z"
            />
            <path
              fill="url(#mtn-near)"
              d="M0 260 L140 216 L260 244 L400 196 L540 240 L680 204 L820 246 L960 200 L1100 244 L1250 208 L1440 248 L1440 260 L0 260 Z"
            />
          </svg>

          {/* water */}
          <div className="relative h-[170px] md:h-[210px]">
            <div className="slf-horizon-line bottom-full z-10" style={{ bottom: '99.5%' }} />
            {/* mirrored mountain silhouette */}
            <svg viewBox="0 0 1440 260" preserveAspectRatio="none" className="absolute inset-x-0 top-0 block h-[110px] w-full scale-y-[-1] opacity-25 md:h-[140px]" style={{ maskImage: 'linear-gradient(180deg, transparent 0%, black 70%)', WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, black 70%)' }}>
              <path fill="#0a1530" d="M0 208 L90 128 L170 176 L260 96 L360 168 L450 120 L540 172 L640 88 L740 164 L830 116 L930 172 L1030 100 L1130 168 L1230 112 L1330 176 L1440 124 L1440 260 L0 260 Z" />
            </svg>
            <div className="slf-water absolute inset-0" />
          </div>
        </div>
      </div>
    </section>
  )
}
