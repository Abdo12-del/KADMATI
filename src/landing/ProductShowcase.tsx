/**
 * ProductShowcase — "أكثر من مجرد أداة تصميم".
 * A large cinematic visualization: a central glowing presentation card with
 * floating interface panels around it, followed by the Stats glass panel.
 */
import { FileDown, Layers, Palette, Type, Zap } from 'lucide-react'
import { Reveal } from './Reveal'
import { Stats } from './Stats'

export function ProductShowcase() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
      <Reveal className="text-center">
        <h2 className="slf-display text-[34px] font-extrabold leading-snug text-white drop-shadow-[0_0_30px_rgba(170,190,255,0.2)] md:text-[46px]">
          أكثر من مجرد <span className="slf-grad">أداة تصميم</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-[15.5px] leading-8 text-[#9dabcd] md:text-[16.5px]">
          منصة متكاملة تجمع التصميم، الذكاء الاصطناعي، والتصدير الاحترافي في مكان واحد —
          كل ما تحتاجه لعرض يترك أثرًا.
        </p>
      </Reveal>

      {/* ---- cinematic central visual ---- */}
      <Reveal delay="120ms">
        <div className="relative mx-auto mt-16 flex min-h-[380px] max-w-4xl items-center justify-center md:min-h-[440px]">
          {/* glow pool */}
          <div aria-hidden className="slf-showcase-glow" />

          {/* back cards */}
          <div
            aria-hidden
            className="slf-glass-soft absolute h-[180px] w-[300px] rotate-[7deg] rounded-2xl opacity-70 md:h-[210px] md:w-[360px]"
            style={{ translate: '9% -6%' }}
          />
          <div
            aria-hidden
            className="slf-glass-soft absolute h-[180px] w-[300px] rotate-[-8deg] rounded-2xl opacity-70 md:h-[210px] md:w-[360px]"
            style={{ translate: '-9% -4%' }}
          />

          {/* central presentation card */}
          <div className="slf-glass relative z-10 w-[min(560px,86%)] rotate-0 overflow-hidden rounded-3xl p-3 slf-float-slow" style={{ animation: 'slf-float 10s ease-in-out infinite' }}>
            <div className="slf-canvas relative aspect-video overflow-hidden rounded-2xl">
              <div dir="rtl" className="absolute inset-0 p-6 md:p-8">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[10.5px] font-medium text-[#cfe0ff]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#7de8f7] shadow-[0_0_8px_rgba(125,232,247,0.9)]" />
                  عرض تقديمي · 2026
                </span>
                <p className="slf-display mt-4 text-[24px] font-extrabold leading-snug text-white md:text-[32px]">
                  فكرتك تستحق <span className="slf-grad">أفضل عرض</span>
                </p>
                <div className="mt-3 space-y-1.5">
                  <i className="block h-1.5 w-2/5 rounded bg-white/35" />
                  <i className="block h-1.5 w-1/3 rounded bg-white/20" />
                </div>
                <div className="absolute bottom-5 left-6 right-6 flex items-end justify-between md:left-8 md:right-8">
                  <div className="flex items-end gap-1.5">
                    <i className="h-5 w-3 rounded-sm bg-gradient-to-t from-[#3e6dff] to-[#6fa5ff]" />
                    <i className="h-9 w-3 rounded-sm bg-gradient-to-t from-[#7c5cfc] to-[#b394ff]" />
                    <i className="h-7 w-3 rounded-sm bg-gradient-to-t from-[#22d3ee] to-[#7de8f7]" />
                  </div>
                  <span className="rounded-full px-4 py-1.5 text-[11px] font-bold text-white" style={{ backgroundImage: 'linear-gradient(120deg,#3e6dff,#8b5cf6)', boxShadow: '0 6px 20px -6px rgba(99,125,255,0.9)' }}>
                    شاهد العرض
                  </span>
                </div>
              </div>
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-white/[0.08]" />
            </div>
          </div>

          {/* floating interface panels */}
          <div dir="ltr" aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
            {/* export */}
            <div className="slf-glass-soft absolute left-0 top-8 flex items-center gap-2.5 rounded-2xl px-4 py-3 slf-float">
              <span className="grid h-8 w-8 place-items-center rounded-xl border border-white/12 bg-white/[0.06]" style={{ boxShadow: '0 0 16px -4px rgba(34,211,238,0.7)' }}>
                <FileDown className="h-4 w-4 text-[#9fe8f7]" />
              </span>
              <div>
                <p className="text-[11.5px] font-bold text-white">PPTX</p>
                <p className="text-[10px] text-[#8d9cc6]">قابل للتحرير</p>
              </div>
            </div>

            {/* palette */}
            <div className="slf-glass-soft absolute right-2 top-24 rounded-2xl px-4 py-3 slf-float slf-float-late">
              <p className="mb-2 flex items-center gap-1.5 text-[10.5px] font-semibold text-[#c9d6ff]">
                <Palette className="h-3.5 w-3.5 text-[#cdbcff]" /> الهوية البصرية
              </p>
              <div className="flex gap-1.5">
                {['#3e6dff', '#7c5cfc', '#2fd4f6', '#e879f9', '#f2f5fd'].map((c) => (
                  <i key={c} className="h-4 w-4 rounded-full border border-white/15" style={{ background: c }} />
                ))}
              </div>
            </div>

            {/* typography */}
            <div className="slf-glass-soft absolute bottom-16 left-4 flex items-center gap-2.5 rounded-2xl px-4 py-3 slf-float slf-float-later">
              <span className="slf-display grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[#4f7dff] to-[#8b5cf6] text-[13px] font-bold text-white" style={{ boxShadow: '0 0 16px -4px rgba(99,125,255,0.9)' }}>
                أ
              </span>
              <div>
                <p className="text-[11.5px] font-bold text-white">خطوط عربية</p>
                <p className="text-[10px] text-[#8d9cc6]">Tajawal · Cairo · Readex</p>
              </div>
            </div>

            {/* animation */}
            <div className="slf-glass-soft absolute bottom-6 right-8 flex items-center gap-2.5 rounded-2xl px-4 py-3 slf-float">
              <span className="grid h-8 w-8 place-items-center rounded-xl border border-white/12 bg-white/[0.06]" style={{ boxShadow: '0 0 16px -4px rgba(168,85,247,0.7)' }}>
                <Zap className="h-4 w-4 text-[#e3c8ff]" />
              </span>
              <div className="w-24">
                <p className="text-[11.5px] font-bold text-white">حركات سلسة</p>
                <div className="mt-1.5 flex gap-1">
                  <i className="h-1 w-7 rounded-full bg-[#6fa5ff]/80" />
                  <i className="h-1 w-5 rounded-full bg-[#b394ff]/80" />
                  <i className="h-1 w-4 rounded-full bg-[#7de8f7]/80" />
                </div>
              </div>
            </div>

            {/* layers */}
            <div className="slf-glass-soft absolute right-24 top-2 flex items-center gap-2 rounded-full px-3.5 py-2 slf-float slf-float-late">
              <Layers className="h-3.5 w-3.5 text-[#9db4ff]" />
              <Type className="h-3.5 w-3.5 text-[#8d9cc6]" />
              <span className="text-[10.5px] font-medium text-[#c3cdea]">12 layers</span>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ---- statistics in a premium glass panel ---- */}
      <Stats />
    </section>
  )
}
