/**
 * EditorMockup — the hero's floating presentation editor, matching the
 * reference: aurora-landscape thumbnails, a canvas playing an aurora slide
 * ("Ideas Into Impact"), a Design/Animate inspector, a Present top bar —
 * all tilted in perspective with a violet bloom behind and three floating
 * cards around it (slide card, insights chart, تسهيل التصميم chip).
 */
import { ChevronDown, Play, Redo2, Sparkles, Undo2 } from 'lucide-react'
import { AuroraScene } from './AuroraScene'

const TOOL = 'grid h-6 w-6 place-items-center rounded-md text-[#8fa0c9] transition-colors hover:bg-white/8 hover:text-white'

const THUMB_VARIANTS = ['purple', 'blue', 'pink', 'teal', 'purple'] as const

export function EditorMockup() {
  return (
    <div className="relative">
      {/* violet bloom + blue glow behind the editor (as in the reference) */}
      <div
        aria-hidden
        className="slf-glow"
        style={{ top: '2%', right: '-10%', width: '82%', height: '96%', background: 'radial-gradient(closest-side, rgba(139,92,246,0.4), transparent)', filter: 'blur(70px)' }}
      />
      <div
        aria-hidden
        className="slf-glow"
        style={{ bottom: '-8%', left: '-8%', width: '58%', height: '70%', background: 'radial-gradient(closest-side, rgba(59,90,246,0.32), transparent)', animationDelay: '-7s' }}
      />

      {/* floating: mini aurora slide card (back-left, rotated) */}
      <div aria-hidden className="slf-glass absolute -bottom-9 -left-3 z-0 hidden w-[132px] rotate-[-8deg] rounded-xl p-1.5 md:block">
        <div className="relative aspect-video overflow-hidden rounded-lg">
          <AuroraScene variant="teal" />
        </div>
      </div>

      {/* floating: insights chart panel (front-bottom) */}
      <div
        aria-hidden
        dir="ltr"
        className="slf-glass slf-float absolute -bottom-12 left-[34%] z-20 hidden w-[152px] rotate-[2deg] rounded-xl p-3 md:block"
      >
        <p className="text-[8.5px] font-semibold tracking-[0.16em] text-[#8fa0c9]">AUDIENCE</p>
        <div className="mt-2 flex h-11 items-end gap-1.5">
          {[42, 68, 52, 84, 60, 95].map((h, i) => (
            <i
              key={i}
              className="flex-1 rounded-sm bg-gradient-to-t from-[#0ea5a0]/70 to-[#5eead4]"
              style={{ height: `${h}%`, boxShadow: '0 0 10px -2px rgba(94,234,212,0.6)' }}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <i className="h-1 w-10 rounded bg-white/25" />
          <span className="text-[8.5px] font-bold text-[#5eead4]">+38%</span>
        </div>
      </div>

      {/* floating: تسهيل التصميم chip */}
      <div
        aria-hidden
        dir="rtl"
        className="slf-glass slf-float slf-float-late absolute -bottom-7 right-1 z-20 hidden items-center gap-2 rounded-full py-2 pe-4 ps-2 md:flex"
      >
        <span
          className="grid h-7 w-7 place-items-center rounded-full"
          style={{ backgroundImage: 'linear-gradient(135deg,#7c5cfc,#a855f7)', boxShadow: '0 0 16px -2px rgba(139,92,246,0.9)' }}
        >
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </span>
        <span className="text-[11.5px] font-semibold text-[#e6ecff]">تسهيل التصميم</span>
      </div>

      <div className="slf-tilt-wrap">
        <div className="slf-editor-float">
          <div className="slf-tilt">
            <div dir="ltr" className="slf-editor relative z-10 w-full overflow-hidden rounded-2xl text-[10px] leading-none">

              {/* ---- top bar ---- */}
              <div className="flex h-10 items-center gap-2 border-b border-white/8 px-3">
                <i className="h-4 w-4 rounded-[5px]" style={{ backgroundImage: 'linear-gradient(135deg,#3e6dff,#8b5cf6)' }} />
                <span className="text-[10.5px] font-semibold text-[#e6ecff]">Product Launch</span>
                <span className="rounded-md bg-white/6 px-1.5 py-0.5 text-[8.5px] font-medium text-[#8fa0c9]">Draft</span>
                <span className="mx-1 h-4 w-px bg-white/10" />
                <span className={TOOL}><Undo2 className="h-3 w-3" /></span>
                <span className={TOOL}><Redo2 className="h-3 w-3" /></span>
                <span className="flex-1" />
                <span className="flex items-center">
                  <i className="h-4 w-4 rounded-full bg-gradient-to-br from-[#4f7dff] to-[#8b5cf6]" />
                  <i className="-ml-1.5 h-4 w-4 rounded-full bg-gradient-to-br from-[#2fd4f6] to-[#4f7dff]" />
                </span>
                <span
                  className="ml-2 flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold text-white"
                  style={{ backgroundImage: 'linear-gradient(120deg,#3e6dff,#8b5cf6)', boxShadow: '0 4px 14px -4px rgba(99,125,255,0.9)' }}
                >
                  <Play className="h-2.5 w-2.5 fill-current" /> Present
                </span>
              </div>

              {/* ---- body ---- */}
              <div className="flex h-[250px] sm:h-[268px]">

                {/* thumbnails — aurora landscape slides */}
                <div className="w-[74px] shrink-0 space-y-2 border-r border-white/8 p-2 sm:w-[86px]">
                  {THUMB_VARIANTS.map((v, i) => (
                    <Thumb key={i} active={i === 1}>
                      <AuroraScene variant={v} water={i % 2 === 0} />
                      <i className="absolute left-1.5 top-1.5 h-0.5 w-6 rounded bg-white/75" />
                      {i % 2 === 1 && <i className="absolute left-1.5 top-3.5 h-0.5 w-4 rounded bg-white/40" />}
                    </Thumb>
                  ))}
                </div>

                {/* canvas — aurora slide: Ideas Into Impact */}
                <div className="relative flex-1 p-3">
                  <div className="relative h-full w-full overflow-hidden rounded-xl shadow-[0_10px_30px_-12px_rgba(0,0,0,0.8)]">
                    <AuroraScene variant="purple">
                      <div dir="ltr" className="absolute inset-0 flex flex-col justify-center p-4">
                        <p className="text-[21px] font-extrabold leading-[1.12] text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.55)]">
                          Ideas
                          <br />
                          Into Impact
                        </p>
                        <p className="mt-2 text-[9px] leading-[1.5] text-white/70">
                          Beautiful presentations
                          <br />
                          for a bigger tomorrow
                        </p>
                      </div>
                      <div dir="ltr" className="absolute inset-x-3 bottom-2.5 flex items-center justify-between">
                        <span className="flex gap-1">
                          {['Minimal', 'Aurora', 'Bold'].map((c) => (
                            <i key={c} className="rounded-full border border-white/25 px-1.5 py-0.5 text-[7px] font-medium text-white/80">{c}</i>
                          ))}
                        </span>
                        <span
                          className="rounded-full px-2 py-0.5 text-[7.5px] font-bold text-white"
                          style={{ backgroundImage: 'linear-gradient(120deg,#3e6dff,#8b5cf6)' }}
                        >
                          Try Free
                        </span>
                      </div>
                    </AuroraScene>
                    <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.07]" />
                  </div>
                </div>

                {/* inspector — Design / Animate */}
                <div className="hidden w-[118px] shrink-0 space-y-3 border-l border-white/8 p-2.5 sm:block">
                  <div dir="ltr" className="flex items-center gap-3 border-b border-white/8 pb-2">
                    <span className="border-b-[1.5px] border-[#6fa5ff] pb-1 text-[9px] font-bold text-white" style={{ textShadow: '0 0 10px rgba(111,165,255,0.8)' }}>Design</span>
                    <span className="pb-1 text-[9px] font-medium text-[#7385ad]">Animate</span>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[8px] font-semibold tracking-[0.16em] text-[#7385ad]">LAYOUT</p>
                    <div className="flex gap-1">
                      {[0, 1].map((i) => (
                        <span key={i} className={`grid h-6 w-8 place-items-center rounded-md border ${i === 0 ? 'border-[#8ea6ff]/50 bg-[#4f7dff]/20' : 'border-white/12 bg-white/5'}`}>
                          <i className="space-y-[2px]">
                            <i className="block h-[2px] w-4 rounded-sm bg-white/50" />
                            <i className="block h-[2px] w-4 rounded-sm bg-white/30" />
                            <i className="block h-[2px] w-3 rounded-sm bg-white/30" />
                          </i>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[8px] font-semibold tracking-[0.16em] text-[#7385ad]">COLORS</p>
                    <div className="flex items-center gap-1">
                      {['#3e6dff', '#7c5cfc', '#2fd4f6', '#e879f9', '#f2f5fd'].map((c, i) => (
                        <i
                          key={c}
                          className={`h-3.5 w-3.5 rounded-full ${i === 1 ? 'ring-[1.5px] ring-[#8ea6ff] ring-offset-1 ring-offset-[#0b1226]' : ''}`}
                          style={{ background: c, boxShadow: i === 1 ? '0 0 10px rgba(124,92,252,0.9)' : undefined }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[8px] font-semibold tracking-[0.16em] text-[#7385ad]">PALETTE</p>
                    <span className="flex items-center justify-between rounded-md border border-white/10 bg-white/6 px-1.5 py-1 text-[9px] font-medium text-[#c6d2f2]">
                      Aurora
                      <ChevronDown className="h-2.5 w-2.5 text-[#8fa0c9]" />
                    </span>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[8px] font-semibold tracking-[0.16em] text-[#7385ad]">ANIMATION</p>
                    <div className="space-y-1.5">
                      {[{ label: 'Fade', on: true }, { label: 'Rise', on: false }].map((row) => (
                        <div key={row.label} className="flex items-center justify-between rounded-md bg-white/4 px-1.5 py-1">
                          <span className={`text-[8.5px] ${row.on ? 'text-white' : 'text-[#8fa0c9]'}`}>{row.label}</span>
                          <span className={`flex h-2.5 w-5 items-center rounded-full p-[2px] ${row.on ? 'justify-end bg-[#4f7dff]/80 shadow-[0_0_8px_rgba(79,125,255,0.8)]' : 'bg-white/12'}`}>
                            <i className="h-1.5 w-1.5 rounded-full bg-white" />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ---- bottom bar ---- */}
              <div className="flex h-8 items-center gap-2 border-t border-white/8 px-3">
                <span className="text-[8.5px] font-medium text-[#7385ad]">Slide 2 / 24</span>
                <span className="flex-1" />
                <span className="flex items-center gap-1.5 text-[8.5px] font-medium text-[#8fa0c9]">
                  <span className="rounded bg-white/6 px-1 py-0.5">−</span>
                  100%
                  <span className="rounded bg-white/6 px-1 py-0.5">+</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Thumb({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return (
    <div className={`relative aspect-video overflow-hidden rounded-[5px] border border-white/10 bg-[#0c1430] ${active ? 'slf-thumb-active' : 'opacity-70 transition-opacity hover:opacity-100'}`}>
      {children}
    </div>
  )
}
