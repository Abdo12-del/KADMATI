/**
 * TemplateShowcase — matching the reference: a lighter rounded navy band
 * with the title column on the right (title, description, "تغطي كل الأفكار"
 * link) and four compact aurora-preview cards to the left — Business,
 * Education, Pitch Deck, Marketing — each with an AuroraScene slide,
 * English name + subtitle, and a circular arrow button.
 */
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { AuroraScene } from './AuroraScene'
import { Reveal } from './Reveal'

const TEMPLATES = [
  { name: 'Business', sub: 'Professional & Modern', variant: 'blue' as const },
  { name: 'Education', sub: 'Learn & Inspire', variant: 'purple' as const },
  { name: 'Pitch Deck', sub: 'For Startups', variant: 'pink' as const },
  { name: 'Marketing', sub: 'Grow Your Brand', variant: 'teal' as const },
]

export function TemplateShowcase({ onOpen }: { onOpen: () => void }) {
  return (
    <section id="templates" className="relative scroll-mt-24 px-3 py-6 md:px-5">
      <Reveal>
        <div className="slf-band relative mx-auto max-w-[1400px] overflow-hidden rounded-[32px] px-6 py-12 md:px-10 md:py-14">
          {/* faint inner bloom */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(46% 70% at 18% 0%, rgba(99,102,241,0.12), transparent 65%), radial-gradient(40% 60% at 90% 100%, rgba(139,92,246,0.1), transparent 65%)' }}
          />

          <div className="relative grid gap-10 lg:grid-cols-[270px_1fr] lg:gap-12">
            {/* title column (right in RTL) */}
            <div className="flex flex-col justify-center">
              <h2 className="slf-display text-[28px] font-extrabold leading-snug text-white md:text-[32px]">
                قوالب مصممة لكل فكرة
              </h2>
              <p className="mt-3 text-[13.5px] leading-7 text-[#93a2cb]">
                اختر من مكتبة القوالب الاحترافية المصممة لتناسب جميع الأفكار والاحتياجات.
              </p>
              <button
                type="button"
                onClick={onOpen}
                className="mt-6 inline-flex items-center gap-2 self-start text-[13px] font-semibold text-[#aebadd] transition-colors hover:text-white"
              >
                تغطي كل الأفكار
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>

            {/* cards (left in RTL) */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {TEMPLATES.map(({ name, sub, variant }, i) => (
                <Reveal key={name} delay={`${i * 100}ms`} className="h-full">
                  <button
                    type="button"
                    onClick={onOpen}
                    className="slf-card slf-glass group relative block h-full w-full rounded-2xl p-2 text-start"
                  >
                    {/* aurora slide preview */}
                    <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-white/8">
                      <AuroraScene variant={variant}>
                        {i % 2 === 1 && (
                          <span aria-hidden className="absolute left-3 top-3 block">
                            <i className="block h-1 w-14 rounded bg-white/80" />
                            <i className="mt-1 block h-1 w-9 rounded bg-white/40" />
                          </span>
                        )}
                      </AuroraScene>
                    </div>

                    {/* meta */}
                    <div dir="ltr" className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-3">
                      <div>
                        <p className="slf-display-en text-[15px] font-bold tracking-tight text-white">{name}</p>
                        <p className="mt-0.5 text-[10.5px] text-[#8d9cc6]">{sub}</p>
                      </div>
                      <span className="slf-card-arrow grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/12 bg-white/[0.06] text-[#c9d6ff]">
                        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
                      </span>
                    </div>
                  </button>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
