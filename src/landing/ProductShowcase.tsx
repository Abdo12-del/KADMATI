/**
 * ProductShowcase — matching the reference: text + stats strip on the left,
 * cinematic visual on the right — a glowing aurora orb with a play button,
 * a tilted glass presentation window behind it, and floating chips
 * (عرض توضيحي · views/shares card · أداء الاستوديو).
 */
import { Activity, Eye, Play, Share2 } from 'lucide-react'
import { AuroraScene } from './AuroraScene'
import { Reveal } from './Reveal'
import { Stats } from './Stats'

export function ProductShowcase() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-20 md:py-24">
      <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-10 xl:gap-14">
        {/* ---- visual (right in the reference) ---- */}
        <Reveal className="lg:order-1">
          <div className="relative mx-auto flex h-[380px] max-w-[540px] items-center justify-center md:h-[440px]">
            {/* bloom */}
            <div
              aria-hidden
              className="slf-glow"
              style={{ top: '8%', left: '12%', width: '76%', height: '86%', background: 'radial-gradient(closest-side, rgba(109,87,255,0.34), transparent)', filter: 'blur(56px)' }}
            />

            {/* back glass presentation window */}
            <div aria-hidden dir="ltr" className="slf-glass absolute top-1/2 w-[min(470px,94%)] -translate-y-1/2 rotate-[3deg] rounded-2xl p-2 opacity-95">
              <div className="flex items-center gap-1.5 px-1.5 pb-2 pt-0.5">
                <i className="h-2 w-2 rounded-full bg-white/20" />
                <i className="h-2 w-2 rounded-full bg-white/20" />
                <i className="h-2 w-2 rounded-full bg-white/20" />
                <i className="ml-2 h-2.5 flex-1 rounded-full bg-white/8" />
              </div>
              <div className="relative aspect-video overflow-hidden rounded-xl">
                <AuroraScene variant="purple">
                  <span aria-hidden className="absolute left-4 top-4 block">
                    <i className="block h-1.5 w-20 rounded bg-white/85" />
                    <i className="mt-1.5 block h-1.5 w-12 rounded bg-white/45" />
                    <i className="mt-3 block h-1 w-24 rounded bg-white/30" />
                  </span>
                </AuroraScene>
              </div>
            </div>

            {/* glowing orb + play */}
            <div className="slf-orb slf-float-slow relative z-10 h-[210px] w-[210px] rounded-full md:h-[248px] md:w-[248px]" style={{ animation: 'slf-float 10s ease-in-out infinite' }}>
              <span className="absolute inset-0 grid place-items-center">
                <span className="grid h-14 w-14 place-items-center rounded-full border border-white/50 bg-white/15 shadow-[0_0_38px_-4px_rgba(200,215,255,0.85),inset_0_1px_0_rgba(255,255,255,0.4)] backdrop-blur-md md:h-16 md:w-16">
                  <Play className="ms-0.5 h-5 w-5 fill-white text-white" aria-hidden />
                </span>
              </span>
              {/* swirling clouds over the orb */}
              <i aria-hidden className="slf-orb-cloud" style={{ top: '16%', left: '2%', width: '96%', height: '34%', background: 'linear-gradient(90deg, transparent, rgba(200,160,255,0.5), rgba(150,190,255,0.35), transparent)', transform: 'rotate(-7deg)' }} />
              <i aria-hidden className="slf-orb-cloud" style={{ bottom: '14%', left: '8%', width: '84%', height: '26%', background: 'linear-gradient(90deg, transparent, rgba(124,92,252,0.45), rgba(232,121,249,0.25), transparent)', transform: 'rotate(5deg)' }} />
            </div>

            {/* floating chips */}
            <div aria-hidden dir="rtl" className="slf-glass-soft slf-float absolute -top-1 right-0 z-20 flex items-center gap-2 rounded-full py-2 pe-4 ps-2">
              <span className="grid h-6 w-6 place-items-center rounded-full" style={{ backgroundImage: 'linear-gradient(135deg,#3e6dff,#8b5cf6)' }}>
                <Play className="h-2.5 w-2.5 fill-white text-white" />
              </span>
              <span className="text-[11px] font-semibold text-[#e6ecff]">عرض توضيحي</span>
            </div>

            <div aria-hidden dir="ltr" className="slf-glass-soft slf-float slf-float-later absolute left-0 top-1/2 z-20 w-[136px] -translate-y-1/2 rounded-xl p-3">
              {[
                { icon: Eye, text: '12K Views' },
                { icon: Share2, text: '2.4K Shares' },
                { icon: Activity, text: '98% Watch' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 py-1">
                  <Icon className="h-3 w-3 text-[#8fa0c9]" />
                  <span className="text-[10.5px] font-medium text-[#dbe4ff]">{text}</span>
                </div>
              ))}
            </div>

            <div aria-hidden dir="rtl" className="slf-glass-soft slf-float slf-float-late absolute bottom-3 right-4 z-20 flex items-center gap-2 rounded-full px-3.5 py-2">
              <Activity className="h-3.5 w-3.5 text-[#9fe8f7]" />
              <span className="text-[11px] font-medium text-[#dbe4ff]">أداء الاستوديو</span>
            </div>
          </div>
        </Reveal>

        {/* ---- copy + stats (left in the reference) ---- */}
        <Reveal delay="120ms" className="lg:order-2">
          <h2 className="slf-display text-[28px] font-extrabold leading-snug text-white md:text-[34px]">
            أكثر من مجرد أداة تصميم
          </h2>
          <p className="mt-4 max-w-md text-[14.5px] leading-8 text-[#93a2cb] md:text-[15.5px]">
            منصة متكاملة تجمع بين القوالب الاحترافية والذكاء الاصطناعي في مكان واحد — كل ما تحتاجه لتتميّز.
          </p>
          <Stats />
        </Reveal>
      </div>
    </section>
  )
}
