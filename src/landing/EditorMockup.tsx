/**
 * EditorMockup — the hero's floating presentation editor.
 * A hand-built, stylized editor: window chrome, tool rail, slide thumbnails,
 * live canvas with a selected element, design + animation inspector, and an
 * animation timeline — tilted in perspective and surrounded by floating UI
 * cards. Purely presentational (divs + lucide glyphs), dir="ltr" like real
 * desktop tools.
 */
import {
  Image as ImageIcon,
  Layers,
  MousePointer2,
  Play,
  Redo2,
  Sparkles,
  Square,
  Type,
  Undo2,
  Zap,
} from 'lucide-react'

const TOOL = 'grid h-6 w-6 place-items-center rounded-md text-[#8fa0c9] transition-colors hover:bg-white/8 hover:text-white'

export function EditorMockup() {
  return (
    <div className="relative">
      {/* Glow pool under the editor */}
      <div
        aria-hidden
        className="absolute -bottom-10 left-1/2 h-28 w-[86%] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(50% 100% at 50% 50%, rgba(80,110,255,0.5), rgba(124,92,252,0.28) 55%, transparent 80%)' }}
      />

      <div className="slf-tilt-wrap">
        <div className="slf-editor-float">
          <div className="slf-tilt">
            <div dir="ltr" className="slf-editor w-full overflow-hidden rounded-2xl text-[10px] leading-none">

              {/* ---- window chrome ---- */}
              <div className="flex h-9 items-center gap-2 border-b border-white/8 px-3">
                <span className="flex gap-1.5">
                  <i className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/80" />
                  <i className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/80" />
                  <i className="h-2.5 w-2.5 rounded-full bg-[#28c840]/80" />
                </span>
                <span className="ms-2 rounded-md bg-white/6 px-2 py-1 text-[10px] font-medium text-[#c6d2f2]">
                  إطلاق المنتج — Q4
                </span>
                <span className="flex-1" />
                <span className="flex items-center gap-1 text-[#8fa0c9]">
                  <i className="h-4 w-4 rounded-full bg-gradient-to-br from-[#4f7dff] to-[#8b5cf6]" />
                  <i className="-ms-2.5 h-4 w-4 rounded-full bg-gradient-to-br from-[#2fd4f6] to-[#4f7dff]" />
                </span>
                <span
                  className="ms-1 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold text-white"
                  style={{ backgroundImage: 'linear-gradient(120deg,#3e6dff,#8b5cf6)' }}
                >
                  <Play className="h-2.5 w-2.5 fill-current" /> Present
                </span>
              </div>

              {/* ---- tool rail ---- */}
              <div className="flex h-9 items-center gap-1 border-b border-white/8 px-3">
                <span className={TOOL + ' bg-white/10 text-white shadow-[0_0_12px_-2px_rgba(99,125,255,0.9)]'}><MousePointer2 className="h-3 w-3" /></span>
                <span className={TOOL}><Type className="h-3 w-3" /></span>
                <span className={TOOL}><Square className="h-3 w-3" /></span>
                <span className={TOOL}><ImageIcon className="h-3 w-3" /></span>
                <span className="mx-1.5 h-4 w-px bg-white/10" />
                <span className={TOOL}><Undo2 className="h-3 w-3" /></span>
                <span className={TOOL}><Redo2 className="h-3 w-3" /></span>
                <span className="flex-1" />
                <span className="rounded-md bg-white/6 px-2 py-1 text-[9px] font-medium text-[#8fa0c9]">100%</span>
                <span className="ml-1 flex items-center gap-1 rounded-md bg-white/6 px-2 py-1 text-[9px] font-medium text-[#c6d2f2]">
                  <Sparkles className="h-2.5 w-2.5 text-[#b394ff]" /> AI
                </span>
              </div>

              {/* ---- body ---- */}
              <div className="flex h-[248px] sm:h-[264px]">

                {/* thumbnails */}
                <div className="w-[74px] shrink-0 space-y-2 border-r border-white/8 p-2 sm:w-[86px]">
                  <Thumb>
                    <div className="absolute inset-x-2 top-2 h-1 rounded bg-white/50" />
                    <div className="absolute inset-x-3 top-4.5 h-1 rounded bg-white/25" />
                    <div className="absolute bottom-1.5 right-1.5 h-4 w-4 rounded-full bg-gradient-to-br from-[#4f7dff] to-[#2fd4f6] opacity-80" />
                  </Thumb>
                  <Thumb active>
                    <div className="absolute inset-x-2 top-2 h-1.5 rounded bg-gradient-to-l from-[#6fa5ff] to-[#a55ef9]" />
                    <div className="absolute inset-x-3 top-5 h-1 rounded bg-white/30" />
                    <div className="absolute bottom-1.5 left-1.5 flex items-end gap-0.5">
                      <i className="h-2 w-1 rounded-sm bg-[#4f7dff]/90" />
                      <i className="h-3.5 w-1 rounded-sm bg-[#8b5cf6]/90" />
                      <i className="h-2.5 w-1 rounded-sm bg-[#2fd4f6]/90" />
                    </div>
                  </Thumb>
                  <Thumb>
                    <div className="absolute inset-x-2 top-2 h-1 rounded bg-white/40" />
                    <div className="absolute left-2 right-2 top-5 bottom-2 grid grid-cols-3 gap-1">
                      <i className="rounded-sm bg-white/12" /><i className="rounded-sm bg-white/12" /><i className="rounded-sm bg-white/12" />
                    </div>
                  </Thumb>
                  <Thumb>
                    <div className="absolute inset-y-2 right-2 w-1/2 rounded-sm bg-gradient-to-br from-[#7c5cfc]/70 to-[#2fd4f6]/50" />
                    <div className="absolute inset-x-2 left-2 top-3 space-y-1">
                      <i className="block h-1 rounded bg-white/45" />
                      <i className="block h-1 w-2/3 rounded bg-white/25" />
                      <i className="block h-1 w-1/2 rounded bg-white/25" />
                    </div>
                  </Thumb>
                  <Thumb>
                    <div className="absolute inset-0 bg-gradient-to-br from-[#3e6dff]/50 via-[#7c5cfc]/40 to-transparent" />
                    <div className="absolute inset-x-3 top-1/2 h-1 -translate-y-1/2 rounded bg-white/70" />
                  </Thumb>
                </div>

                {/* canvas */}
                <div className="relative flex-1 p-3.5">
                  <div className="slf-canvas relative h-full w-full overflow-hidden rounded-xl shadow-[0_10px_30px_-12px_rgba(0,0,0,0.8)]">
                    {/* slide artwork */}
                    <div dir="rtl" className="absolute inset-0 p-4">
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/8 px-2 py-0.5 text-[8px] font-medium text-[#cfe0ff]">
                        <Sparkles className="h-2 w-2 text-[#9db4ff]" /> استراتيجية 2026
                      </span>
                      {/* selected title element */}
                      <div className="relative mt-2.5 inline-block rounded-[3px] ring-1 ring-[#5b8bff]">
                        <i className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 rounded-[1px] bg-white shadow-[0_0_6px_rgba(120,160,255,1)]" />
                        <i className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 rounded-[1px] bg-white shadow-[0_0_6px_rgba(120,160,255,1)]" />
                        <i className="absolute -bottom-[3px] -left-[3px] h-1.5 w-1.5 rounded-[1px] bg-white shadow-[0_0_6px_rgba(120,160,255,1)]" />
                        <i className="absolute -bottom-[3px] -right-[3px] h-1.5 w-1.5 rounded-[1px] bg-white shadow-[0_0_6px_rgba(120,160,255,1)]" />
                        <p className="slf-display px-1 text-[15px] font-extrabold leading-snug text-white sm:text-[17px]">
                          خطة إطلاق <span className="slf-grad">المنتج الجديد</span>
                        </p>
                      </div>
                      <div className="mt-2 space-y-1">
                        <i className="block h-1 w-3/5 rounded bg-white/35" />
                        <i className="block h-1 w-2/5 rounded bg-white/20" />
                      </div>
                      <div className="absolute bottom-3.5 left-4 right-4 flex items-end justify-between">
                        <div className="flex items-end gap-1">
                          <i className="h-3.5 w-2 rounded-sm bg-gradient-to-t from-[#3e6dff] to-[#6fa5ff]" />
                          <i className="h-6 w-2 rounded-sm bg-gradient-to-t from-[#7c5cfc] to-[#b394ff]" />
                          <i className="h-4.5 w-2 rounded-sm bg-gradient-to-t from-[#2fd4f6] to-[#7de8f7]" />
                          <i className="h-8 w-2 rounded-sm bg-gradient-to-t from-[#a855f7] to-[#e879f9]" />
                        </div>
                        <span className="rounded-full px-2.5 py-1 text-[8px] font-bold text-white" style={{ backgroundImage: 'linear-gradient(120deg,#3e6dff,#8b5cf6)' }}>
                          ابدأ الآن
                        </span>
                      </div>
                    </div>
                    {/* canvas sheen */}
                    <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-white/[0.09]" />
                  </div>
                </div>

                {/* inspector */}
                <div className="hidden w-[118px] shrink-0 space-y-3 border-l border-white/8 p-2.5 sm:block">
                  <div>
                    <p className="mb-1.5 text-[8.5px] font-semibold tracking-[0.14em] text-[#7385ad]">DESIGN</p>
                    <div className="flex items-center gap-1">
                      {['#3e6dff', '#7c5cfc', '#2fd4f6', '#e879f9', '#0f1830'].map((c, i) => (
                        <i
                          key={c}
                          className={`h-3.5 w-3.5 rounded-full ${i === 1 ? 'ring-[1.5px] ring-[#8ea6ff] ring-offset-1 ring-offset-[#0b1226]' : ''}`}
                          style={{ background: c, boxShadow: i === 1 ? '0 0 10px rgba(124,92,252,0.9)' : undefined }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[68, 40].map((w) => (
                      <div key={w} className="relative h-1 rounded-full bg-white/12">
                        <i className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#4f7dff] to-[#8b5cf6]" style={{ width: `${w}%` }} />
                        <i className="absolute -top-[3px] h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(120,150,255,0.9)]" style={{ left: `${w}%` }} />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg bg-white/6 p-1.5">
                    <span className="slf-display grid h-5 w-5 place-items-center rounded-md bg-gradient-to-br from-[#4f7dff] to-[#8b5cf6] text-[9px] font-bold text-white">أ</span>
                    <span className="text-[8.5px] font-medium text-[#c6d2f2]">Tajawal · Bold</span>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[8.5px] font-semibold tracking-[0.14em] text-[#7385ad]">ANIMATE</p>
                    <div className="space-y-1">
                      {[
                        { label: 'Fade In', w: '72%', on: true },
                        { label: 'Rise', w: '48%', on: false },
                        { label: 'Zoom', w: '58%', on: false },
                      ].map((row) => (
                        <div key={row.label} className={`flex items-center gap-1.5 rounded-md px-1.5 py-1 ${row.on ? 'bg-[#4f7dff]/18 shadow-[inset_0_0_0_1px_rgba(99,140,255,0.4)]' : ''}`}>
                          <Zap className={`h-2.5 w-2.5 ${row.on ? 'text-[#9db4ff]' : 'text-[#5d6f9c]'}`} />
                          <span className={`text-[8.5px] ${row.on ? 'text-white' : 'text-[#8fa0c9]'}`}>{row.label}</span>
                          <span className="flex-1" />
                          <i className="h-0.5 rounded-full bg-[#8ea6ff]/60" style={{ width: row.w, maxWidth: 26 }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ---- animation timeline ---- */}
              <div className="flex h-10 items-center gap-2.5 border-t border-white/8 px-3">
                <span className={TOOL + ' bg-[#4f7dff]/25 text-[#bcd0ff]'}><Play className="h-3 w-3 fill-current" /></span>
                <span className="text-[8.5px] font-medium text-[#7385ad]">00:00</span>
                <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-white/8">
                  <i className="absolute inset-y-0 left-[4%] w-[22%] rounded-full bg-gradient-to-r from-[#3e6dff] to-[#6fa5ff] opacity-90" />
                  <i className="absolute inset-y-0 left-[30%] w-[18%] rounded-full bg-gradient-to-r from-[#7c5cfc] to-[#b394ff] opacity-90" />
                  <i className="absolute inset-y-0 left-[52%] w-[15%] rounded-full bg-gradient-to-r from-[#22d3ee] to-[#7de8f7] opacity-90" />
                  <i className="absolute inset-y-0 left-[71%] w-[12%] rounded-full bg-gradient-to-r from-[#a855f7] to-[#e879f9] opacity-90" />
                  <i className="absolute inset-y-[-2px] left-[46%] w-[1.5px] bg-white shadow-[0_0_6px_rgba(255,255,255,0.9)]" />
                </div>
                <span className="text-[8.5px] font-medium text-[#7385ad]">00:12</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---- floating UI cards around the editor (desktop) ---- */}
      <div dir="ltr" aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
        {/* layers panel */}
        <div className="slf-glass-soft absolute -left-10 top-10 w-[124px] rounded-xl p-2.5 slf-float">
          <p className="mb-1.5 flex items-center gap-1 text-[8.5px] font-semibold tracking-[0.14em] text-[#8fa0c9]">
            <Layers className="h-2.5 w-2.5" /> LAYERS
          </p>
          {[
            { c: '#8ea6ff', w: '78%' },
            { c: '#b394ff', w: '58%' },
            { c: '#67e8f9', w: '44%' },
          ].map((row, i) => (
            <div key={i} className="flex items-center gap-1.5 rounded-md px-1 py-1">
              <i className="h-2 w-2 rounded-[3px]" style={{ background: row.c }} />
              <i className="h-1 rounded-full bg-white/25" style={{ width: row.w }} />
            </div>
          ))}
        </div>

        {/* auto-animate toggle */}
        <div className="slf-glass-soft absolute -right-6 bottom-16 flex w-[132px] items-center gap-2 rounded-xl p-2.5 slf-float slf-float-late">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-gradient-to-br from-[#4f7dff] to-[#8b5cf6] shadow-[0_0_14px_-2px_rgba(99,125,255,0.9)]">
            <Zap className="h-3 w-3 text-white" />
          </span>
          <div>
            <p className="text-[9px] font-semibold text-white">Auto-animate</p>
            <p className="text-[8px] text-[#8fa0c9]">Smooth transitions</p>
          </div>
          <span className="ms-auto flex h-3.5 w-6.5 items-center rounded-full bg-[#4f7dff]/80 p-[2px] shadow-[0_0_10px_rgba(79,125,255,0.8)]">
            <i className="ml-auto h-2.5 w-2.5 rounded-full bg-white" />
          </span>
        </div>

        {/* AI generation card */}
        <div className="slf-glass-soft absolute -right-4 top-4 w-[128px] rounded-xl p-2.5 slf-float slf-float-later">
          <p className="mb-1.5 flex items-center gap-1 text-[8.5px] font-semibold text-[#cdbcff]">
            <Sparkles className="h-2.5 w-2.5 text-[#b394ff]" /> AI Slide
          </p>
          <div className="relative h-12 overflow-hidden rounded-md slf-canvas">
            <i className="absolute inset-x-2 top-2.5 h-1 rounded bg-white/60" />
            <i className="absolute inset-x-3 top-5 h-1 w-1/2 rounded bg-white/30" />
            <i className="absolute bottom-1.5 right-2 h-3.5 w-3.5 rounded-full bg-gradient-to-br from-[#4f7dff] to-[#2fd4f6]" />
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
            <i className="block h-full w-3/4 rounded-full bg-gradient-to-r from-[#4f7dff] via-[#8b5cf6] to-[#2fd4f6]" />
          </div>
        </div>
      </div>
    </div>
  )
}

function Thumb({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return (
    <div className={`relative aspect-video overflow-hidden rounded-[5px] border border-white/10 bg-[#0c1430] ${active ? 'slf-thumb-active bg-[#111c3e]' : 'opacity-70 transition-opacity hover:opacity-100'}`}>
      {children}
    </div>
  )
}
