/**
 * TemplateShowcase — "قوالب مصممة لكل فكرة".
 * Four premium glass cards (Business / Education / Pitch Deck / Marketing),
 * each with a hand-built aurora-styled slide preview, category label,
 * short Arabic description, and a glowing arrow button.
 */
import { ArrowLeft } from 'lucide-react'
import { Reveal } from './Reveal'
import { cn } from '../lib/cn'

/* ---- per-category CSS slide previews (aurora visual language) ---- */

function PreviewBusiness() {
  return (
    <div className="slf-canvas absolute inset-0">
      <div dir="rtl" className="absolute inset-0 p-4">
        <i className="block h-1.5 w-1/2 rounded bg-gradient-to-l from-[#6fa5ff] to-[#a55ef9]" />
        <i className="mt-2 block h-1 w-1/3 rounded bg-white/30" />
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          <div className="flex items-end gap-1.5">
            <i className="h-5 w-2.5 rounded-sm bg-gradient-to-t from-[#3e6dff]/80 to-[#6fa5ff]" />
            <i className="h-9 w-2.5 rounded-sm bg-gradient-to-t from-[#7c5cfc]/80 to-[#b394ff]" />
            <i className="h-6 w-2.5 rounded-sm bg-gradient-to-t from-[#22d3ee]/80 to-[#7de8f7]" />
            <i className="h-12 w-2.5 rounded-sm bg-gradient-to-t from-[#a855f7]/80 to-[#e879f9]" />
          </div>
          <div className="space-y-1.5 text-left">
            <i className="block h-1.5 w-14 rounded bg-white/40" />
            <i className="block h-1.5 w-10 rounded bg-[#7de8f7]/70" />
          </div>
        </div>
      </div>
    </div>
  )
}

function PreviewEducation() {
  return (
    <div className="slf-canvas absolute inset-0">
      <div dir="rtl" className="absolute inset-0 grid place-items-center p-4 text-center">
        <div>
          <span
            className="mx-auto mb-2.5 grid h-11 w-11 place-items-center rounded-full"
            style={{
              backgroundImage: 'linear-gradient(135deg,#4f7dff,#2fd4f6)',
              boxShadow: '0 0 24px -4px rgba(47,212,246,0.8), inset 0 1px 0 rgba(255,255,255,0.4)',
            }}
          >
            <span className="slf-display text-[15px] font-bold text-white">أ</span>
          </span>
          <i className="mx-auto block h-1.5 w-2/5 rounded bg-white/70" />
          <i className="mx-auto mt-1.5 block h-1 w-3/5 rounded bg-white/30" />
          <div className="mt-3 flex justify-center gap-1.5">
            <i className="h-6 w-9 rounded-md border border-white/12 bg-white/8" />
            <i className="h-6 w-9 rounded-md border border-[#8ea6ff]/30 bg-[#4f7dff]/20" />
            <i className="h-6 w-9 rounded-md border border-white/12 bg-white/8" />
          </div>
        </div>
      </div>
    </div>
  )
}

function PreviewPitch() {
  return (
    <div className="slf-canvas absolute inset-0">
      <div aria-hidden className="absolute -right-6 -top-6 h-24 w-24 rounded-full"
        style={{ backgroundImage: 'linear-gradient(135deg,#7c5cfc,#e879f9)', filter: 'blur(2px)', boxShadow: '0 0 34px -4px rgba(168,85,247,0.9)' }}
      />
      <div aria-hidden className="absolute -right-9 top-1 h-[7.5rem] w-[7.5rem] rounded-full border border-[#e879f9]/30" />
      <div dir="rtl" className="absolute inset-0 flex flex-col justify-center p-4">
        <i className="block h-2 w-3/5 rounded bg-white/80" />
        <i className="mt-2 block h-1 w-2/5 rounded bg-gradient-to-l from-[#6fa5ff] to-[#e879f9]" />
        <i className="mt-3.5 block h-1 w-1/2 rounded bg-white/25" />
        <i className="mt-1.5 block h-1 w-1/3 rounded bg-white/25" />
        <span className="mt-3.5 h-4 w-16 rounded-full" style={{ backgroundImage: 'linear-gradient(120deg,#3e6dff,#8b5cf6)' }} />
      </div>
    </div>
  )
}

function PreviewMarketing() {
  return (
    <div className="slf-canvas absolute inset-0">
      <div aria-hidden
        className="absolute -left-10 top-0 h-full w-24 rotate-[24deg]"
        style={{ backgroundImage: 'linear-gradient(180deg,#3e6dff,#7c5cfc 60%,#2fd4f6)', opacity: 0.5, filter: 'blur(6px)' }}
      />
      <div dir="rtl" className="absolute inset-0 grid grid-cols-2 gap-2 p-4">
        {[
          'linear-gradient(135deg, rgba(62,109,255,0.55), rgba(47,212,246,0.35))',
          'rgba(255,255,255,0.08)',
          'rgba(255,255,255,0.08)',
          'linear-gradient(135deg, rgba(168,85,247,0.5), rgba(232,121,249,0.3))',
        ].map((bg, i) => (
          <div key={i} className="relative overflow-hidden rounded-lg border border-white/12 p-2" style={{ background: bg }}>
            <i className="block h-1 w-3/4 rounded bg-white/50" />
            <i className="mt-1 block h-1 w-1/2 rounded bg-white/25" />
            {i % 3 === 0 && (
              <span className="absolute -bottom-1.5 -left-1.5 h-6 w-6 rounded-full bg-white/25 blur-[3px]" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---- cards ---- */

const TEMPLATES = [
  {
    name: 'Business',
    label: 'أعمال',
    desc: 'عروض أعمال احترافية مع مخططات وتقارير واضحة.',
    Preview: PreviewBusiness,
    glow: 'rgba(62,109,255,0.5)',
  },
  {
    name: 'Education',
    label: 'تعليم',
    desc: 'دروس ومحتوى تعليمي بتصميم واضح وجذّاب.',
    Preview: PreviewEducation,
    glow: 'rgba(47,212,246,0.5)',
  },
  {
    name: 'Pitch Deck',
    label: 'عرض استثماري',
    desc: 'اعرض فكرتك على المستثمرين بأسلوب مقنع.',
    Preview: PreviewPitch,
    glow: 'rgba(168,85,247,0.5)',
  },
  {
    name: 'Marketing',
    label: 'تسويق',
    desc: 'حملات واستراتيجيات تسويق بتصميم لافت.',
    Preview: PreviewMarketing,
    glow: 'rgba(232,121,249,0.45)',
  },
]

export function TemplateShowcase({ onOpen }: { onOpen: () => void }) {
  return (
    <section id="templates" className="relative mx-auto max-w-7xl scroll-mt-24 px-6 py-24 md:py-32">
      <Reveal className="text-center">
        <h2 className="slf-display text-[34px] font-extrabold leading-snug text-white drop-shadow-[0_0_30px_rgba(170,190,255,0.2)] md:text-[46px]">
          قوالب مصممة <span className="slf-grad">لكل فكرة</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-[15.5px] leading-8 text-[#9dabcd] md:text-[16.5px]">
          مكتبة قوالب جاهزة صُممت بعناية بلغة أورورا البصرية — اختر قالبًا، خصّصه بضغطات قليلة، واعرضه بثقة.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {TEMPLATES.map(({ name, label, desc, Preview, glow }, i) => (
          <Reveal key={name} delay={`${i * 110}ms`} className="h-full">
            <button
              type="button"
              onClick={onOpen}
              className="slf-card slf-glass group relative block h-full w-full rounded-3xl p-3 text-start"
              style={{ ['--glow' as string]: glow }}
            >
              {/* slide preview */}
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/8">
                <Preview />
              </div>

              {/* meta */}
              <div className="px-2.5 pb-2 pt-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="slf-display-en text-[16.5px] font-bold tracking-tight text-white">{name}</p>
                    <p className="mt-0.5 text-[12px] font-medium text-[#8d9cc6]">{label}</p>
                  </div>
                  <span
                    className="slf-card-arrow grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/12 bg-white/[0.06] text-[#c9d6ff]"
                    style={{ boxShadow: `0 0 14px -6px ${glow}` }}
                  >
                    <ArrowLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                  </span>
                </div>
                <p className="mt-2.5 min-h-[42px] text-[13px] leading-6 text-[#9dabcd]">{desc}</p>
              </div>

              {/* hover glow */}
              <span
                aria-hidden
                className={cn(
                  'pointer-events-none absolute inset-x-8 -bottom-px h-px opacity-0 transition-opacity duration-500 group-hover:opacity-100',
                )}
                style={{ background: `linear-gradient(90deg, transparent, ${glow.replace('0.5', '0.9').replace('0.45', '0.9')}, transparent)` }}
              />
            </button>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
