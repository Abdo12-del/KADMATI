/**
 * In-app performance benchmark: builds a synthetic heavy deck offscreen
 * (N slides × M animated elements), plays each slide through the real engine
 * and measures rAF frame deltas the whole way.
 *
 * Target (architecture doc §10): 60fps with 50 slides × 20–50 animated
 * elements. Only the active slide is ever in the DOM — that is the point.
 */
import { buildSlideEngine } from '../../animation/engine'
import type { ElementBaseInfo } from '../../animation/engine'
import { presetById } from '../../animation/presets'
import type { AnimSpec } from '../../animation/types'

export interface PerfReport {
  label: string
  slides: number
  elements: number
  anims: number
  seconds: number
  avgFps: number
  minFps: number
  p10Fps: number
  dropped: number
}

export interface PerfProgress {
  slide: number
  total: number
}

const ENTRANCES = ['fade-in', 'slide-in-bottom', 'rise', 'zoom-in']
const EMPHASIS = ['pulse', 'bounce', 'swing', 'glow']
const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#0ea5e9', '#a855f7']

function rafNext(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()))
}

export async function runPerfTest(opts: { slides: number; elements: number; speed: number; onProgress?: (p: PerfProgress) => void }): Promise<PerfReport> {
  const { slides: slideCount, elements: elCount, speed } = opts
  const host = document.createElement('div')
  host.style.cssText = 'position:fixed;top:0;left:-99999px;width:1280px;height:720px;z-index:-1;pointer-events:none;overflow:hidden;background:#fff'
  document.body.appendChild(host)

  const frames: number[] = []
  let raf = 0
  const stamp = (now: number) => {
    frames.push(now)
    raf = requestAnimationFrame(stamp)
  }
  raf = requestAnimationFrame(stamp)

  let animsTotal = 0
  for (let s = 0; s < slideCount; s++) {
    opts.onProgress?.({ slide: s + 1, total: slideCount })
    await rafNext()
    host.innerHTML = ''
    const targets: Record<string, HTMLElement> = {}
    const elements: Record<string, ElementBaseInfo> = {}
    const anims: AnimSpec[] = []
    for (let i = 0; i < elCount; i++) {
      const w = 40 + ((i * 37) % 90)
      const h = 40 + ((i * 53) % 70)
      const x = 30 + ((i * 149) % Math.max(10, 1220 - w))
      const y = 30 + ((i * 97) % Math.max(10, 680 - h))
      const div = document.createElement('div')
      div.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-radius:10px;background:${COLORS[i % COLORS.length]};will-change:transform,opacity`
      host.appendChild(div)
      const id = `perf-${s}-${i}`
      targets[id] = div
      elements[id] = { x, y, w, h, rotation: 0 }
      anims.push(presetById(ENTRANCES[i % ENTRANCES.length])!.make(id, { delay: (i % 10) * 40, duration: 600 * speed }))
      anims.push(presetById(EMPHASIS[i % EMPHASIS.length])!.make(id, { delay: 900 * speed, duration: 1200 * speed, repeat: 0 }))
      animsTotal += 2
    }
    const engine = buildSlideEngine({ targets, elements, anims, textSplit: false })
    engine.play()
    await new Promise<void>((resolve) => {
      const t0 = performance.now()
      const check = () => {
        if (engine.getTime() >= engine.duration - 1 || performance.now() - t0 > engine.duration + 4000) resolve()
        else requestAnimationFrame(check)
      }
      requestAnimationFrame(check)
    })
    engine.destroy()
  }

  cancelAnimationFrame(raf)
  host.remove()

  const deltas: number[] = []
  for (let i = 1; i < frames.length; i++) deltas.push(frames[i] - frames[i - 1])
  const fps = deltas.map((d) => (d > 0 ? 1000 / d : 0))
  const avg = fps.length ? fps.reduce((a, b) => a + b, 0) / fps.length : 0
  const sorted = [...fps].sort((a, b) => a - b)
  return {
    label: `${slideCount}×${elCount}`,
    slides: slideCount,
    elements: elCount,
    anims: animsTotal,
    seconds: frames.length ? (frames[frames.length - 1] - frames[0]) / 1000 : 0,
    avgFps: avg,
    minFps: sorted[0] ?? 0,
    p10Fps: sorted[Math.floor(sorted.length * 0.1)] ?? 0,
    dropped: deltas.filter((d) => d > 1.8 * (1000 / 60)).length,
  }
}
