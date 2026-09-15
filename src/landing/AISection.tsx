/**
 * AISection — "مساعدك الذكي في كل خطوة".
 * Right: headline + the four AI capabilities.
 * Left: a futuristic AI generation interface (prompt, settings, create)
 * with floating generated-slide cards — integrated into the platform,
 * not a chatbot.
 */
import { Check, ChevronDown, ListChecks, Palette, PenLine, Sparkles, Wand2 } from 'lucide-react'
import { Reveal } from './Reveal'

const CAPABILITIES = [
  { icon: ListChecks, title: 'تنظيم المحتوى', desc: 'حوّل نقاطك المتناثرة إلى هيكل واضح ومتسلسل.' },
  { icon: Palette, title: 'اقتراح التصميم', desc: 'تخطيطات وألوان تناسب فكرتك وجمهورك.' },
  { icon: PenLine, title: 'تحسين النصوص', desc: 'صياغة أوضح وأقوى بضغطة واحدة.' },
  { icon: Sparkles, title: 'إنشاء العرض', desc: 'شرائح كاملة قابلة للتعديل، جاهزة فورًا.' },
]

const COUNTS = ['6', '10', '14']

export function AISection() {
  return (
    <section id="features" className="relative mx-auto max-w-7xl scroll-mt-24 px-6 py-24 md:py-32">
      {/* section aurora accents */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="slf-glow"
          style={{ top: '12%', insetInlineEnd: '2%', width: '38%', height: 380, background: 'radial-gradient(closest-side, rgba(124,92,252,0.2), transparent)' }}
        />
        <div
          className="slf-glow"
          style={{ bottom: '4%', insetInlineStart: '0%', width: '34%', height: 320, background: 'radial-gradient(closest-side, rgba(34,211,238,0.14), transparent)', animationDelay: '-8s' }}
        />
      </div>

      <div className="relative grid items-center gap-14 lg:grid-cols-2 lg:gap-10 xl:gap-16">
        {/* ---- headline + capabilities (right in the reference) ---- */}
        <Reveal className="lg:order-1">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#8b5cf6]/30 bg-[#7c5cfc]/10 px-4 py-1.5 text-[12.5px] font-semibold text-[#cdbcff] shadow-[0_0_24px_-8px_rgba(124,92,252,0.8)]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            الذكاء الاصطناعي داخل المنصة
          </span>
          <h2 className="slf-display mt-5 text-[34px] font-extrabold leading-snug text-white drop-shadow-[0_0_30px_rgba(170,190,255,0.2)] md:text-[46px]">
            مساعدك الذكي <span className="slf-grad">في كل خطوة</span>
          </h2>
          <p className="mt-4 max-w-lg text-[15.5px] leading-8 text-[#9dabcd] md:text-[16.5px]">
            من الفكرة الأولى إلى الشريحة الأخيرة — الذكاء الاصطناعي يعمل داخل محرر العروض نفسه،
            ومخرجاته عناصر حقيقية يمكنك تعديلها بالكامل.
          </p>

          <div className="mt-9 grid gap-3.5 sm:grid-cols-2">
            {CAPABILITIES.map(({ icon: Icon, title, desc }, i) => (
              <Reveal key={title} delay={`${i * 90}ms`} className="h-full">
                <div className="slf-glass-soft flex h-full items-start gap-3.5 rounded-2xl p-4 transition-colors duration-300 hover:border-[#8ea6ff]/30">
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/12 bg-white/[0.06]"
                    style={{ boxShadow: '0 0 18px -6px rgba(124,92,252,0.7), inset 0 1px 0 rgba(255,255,255,0.12)' }}
                  >
                    <Icon className="h-[18px] w-[18px] text-[#cdbcff]" strokeWidth={2} aria-hidden />
                  </span>
                  <div>
                    <p className="slf-display text-[15.5px] font-bold text-white">{title}</p>
                    <p className="mt-1 text-[12.5px] leading-6 text-[#9dabcd]">{desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>

        {/* ---- AI generation interface (left in the reference) ---- */}
        <Reveal delay="140ms" className="lg:order-2">
          <div className="relative mx-auto w-full max-w-[520px]">
            {/* glow pool */}
            <div
              aria-hidden
              className="absolute -bottom-10 left-1/2 h-28 w-[80%] -translate-x-1/2 rounded-full blur-3xl"
              style={{ background: 'radial-gradient(50% 100% at 50% 50%, rgba(124,92,252,0.45), rgba(80,110,255,0.3) 55%, transparent 80%)' }}
            />

            <div className="slf-glass relative rounded-3xl p-5 md:p-6">
              {/* header */}
              <div className="flex items-center gap-3">
                <span className="slf-ai-orb grid h-11 w-11 place-items-center rounded-2xl">
                  <Sparkles className="h-5 w-5 text-white" strokeWidth={2.2} aria-hidden />
                </span>
                <div>
                  <p className="slf-display text-[15.5px] font-bold text-white">المساعد الذكي</p>
                  <p className="text-[11.5px] text-[#8d9cc6]">توليد عروض تقديمية كاملة</p>
                </div>
                <span className="slf-display-en ms-auto rounded-full border border-[#8b5cf6]/35 bg-[#7c5cfc]/15 px-2.5 py-1 text-[10.5px] font-bold tracking-widest text-[#cdbcff]">
                  AI
                </span>
              </div>

              {/* prompt */}
              <div className="mt-5 rounded-2xl border border-[#8ea6ff]/18 bg-[#0a122a]/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_0_30px_-14px_rgba(99,125,255,0.6)]">
                <p className="text-[15px] leading-7 text-[#e6ecff]">
                  أنشئ عرضًا عن التسويق الرقمي<span className="slf-caret" aria-hidden />
                </p>
              </div>

              {/* settings */}
              <div className="mt-4 space-y-3.5">
                <SettingRow label="عدد الشرائح">
                  <div className="flex items-center gap-1.5">
                    {COUNTS.map((c) => (
                      <span
                        key={c}
                        className={
                          c === '10'
                            ? 'slf-display-en grid h-7 w-9 place-items-center rounded-lg text-[12px] font-bold text-white'
                            : 'slf-display-en grid h-7 w-9 place-items-center rounded-lg border border-white/12 bg-white/[0.05] text-[12px] font-semibold text-[#8d9cc6]'
                        }
                        style={c === '10' ? { backgroundImage: 'linear-gradient(120deg,#3e6dff,#8b5cf6)', boxShadow: '0 0 16px -4px rgba(99,125,255,0.9)' } : undefined}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </SettingRow>

                <SettingRow label="نوع العرض">
                  <span className="flex items-center gap-2 rounded-lg border border-white/12 bg-white/[0.05] px-3 py-1.5 text-[12.5px] font-medium text-[#dbe4ff]">
                    عرض أعمال احترافي
                    <ChevronDown className="h-3.5 w-3.5 text-[#8d9cc6]" aria-hidden />
                  </span>
                </SettingRow>

                <SettingRow label="الأسلوب البصري">
                  <span className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      {['#3e6dff', '#7c5cfc', '#2fd4f6', '#e879f9'].map((c, i) => (
                        <i
                          key={c}
                          className={`h-4 w-4 rounded-full ${i === 1 ? 'ring-[1.5px] ring-[#cdbcff] ring-offset-1 ring-offset-[#0b1226]' : ''}`}
                          style={{ background: c, boxShadow: '0 0 10px -2px rgba(150,130,255,0.8)' }}
                        />
                      ))}
                    </span>
                    <span className="text-[12px] font-medium text-[#dbe4ff]">أورورا</span>
                  </span>
                </SettingRow>
              </div>

              {/* create */}
              <button type="button" className="slf-btn slf-btn-primary mt-5 h-12 w-full text-[15.5px]">
                <Wand2 className="h-[17px] w-[17px]" strokeWidth={2.2} aria-hidden />
                إنشاء
              </button>
            </div>

            {/* floating: generated slide */}
            <div aria-hidden className="slf-glass-soft absolute -top-8 end-[-14px] hidden w-[132px] rotate-[4deg] rounded-2xl p-2.5 slf-float sm:block">
              <div className="relative h-16 overflow-hidden rounded-lg slf-canvas">
                <div dir="rtl" className="absolute inset-0 p-2">
                  <i className="block h-1 w-3/4 rounded bg-white/70" />
                  <i className="mt-1 block h-1 w-1/2 rounded bg-white/30" />
                  <i className="absolute bottom-1.5 right-2 h-4 w-4 rounded-full bg-gradient-to-br from-[#4f7dff] to-[#2fd4f6]" />
                </div>
              </div>
              <p className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-[#8ee6b8]">
                <Check className="h-3 w-3" /> جاهز للتعديل
              </p>
            </div>

            {/* floating: refine chip */}
            <div aria-hidden className="slf-glass-soft absolute -bottom-7 start-[-10px] hidden items-center gap-2 rounded-full px-4 py-2.5 slf-float slf-float-late sm:flex">
              <PenLine className="h-3.5 w-3.5 text-[#9db4ff]" aria-hidden />
              <span className="text-[11.5px] font-medium text-[#dbe4ff]">تحسين النص</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#8ee6b8] shadow-[0_0_8px_rgba(142,230,184,0.9)]" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="shrink-0 text-[12.5px] font-medium text-[#8d9cc6]">{label}</span>
      {children}
    </div>
  )
}
