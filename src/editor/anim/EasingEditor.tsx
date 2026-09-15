/**
 * Visual cubic-bezier easing curve editor (drag the two control points).
 * Reference: gre/bezier-easing-editor (MIT) — implemented in-repo so the
 * animation core stays dependency-light. Includes a live motion preview.
 */
import { useEffect, useRef, useState } from 'react'

function makeBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t
  const sampleDX = (t: number) => (3 * ax * t + 2 * bx) * t + cx
  return (x: number) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let t = x
    for (let i = 0; i < 8; i++) {
      const err = sampleX(t) - x
      if (Math.abs(err) < 1e-5) break
      const d = sampleDX(t)
      if (Math.abs(d) < 1e-6) break
      t -= err / d
    }
    return sampleY(Math.max(0, Math.min(1, t)))
  }
}

const SIZE = 132
const PAD = 16
const INNER = SIZE - PAD * 2
const YMIN = -0.5
const YMAX = 1.5

export function EasingEditor({ value, onChange }: { value: [number, number, number, number]; onChange: (v: [number, number, number, number]) => void }) {
  const [x1, y1, x2, y2] = value
  const svgRef = useRef<SVGSVGElement>(null)
  const ballRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<0 | 1 | null>(null)

  const px = (x: number) => PAD + x * INNER
  const py = (y: number) => Math.max(4, Math.min(SIZE - 4, PAD + (1 - (y - 0) / 1) * INNER))
  const fromSvg = (clientX: number, clientY: number): { x: number; y: number } => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0.5, y: 0.5 }
    return {
      x: Math.max(0, Math.min(1, (clientX - rect.left - PAD) / INNER)),
      y: Math.max(YMIN, Math.min(YMAX, 1 - (clientY - rect.top - PAD) / INNER)),
    }
  }

  useEffect(() => {
    if (drag === null) return
    const move = (e: PointerEvent) => {
      const { x, y } = fromSvg(e.clientX, e.clientY)
      if (drag === 0) onChange([x, y, x2, y2])
      else onChange([x1, y1, x, y])
    }
    const up = () => setDrag(null)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag, x1, y1, x2, y2])

  // live preview ball
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = ((now - start) % 1500) / 1500
      const e = makeBezier(x1, y1, x2, y2)(p)
      if (ballRef.current) ballRef.current.style.left = `${(e * 92).toFixed(2)}%`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [x1, y1, x2, y2])

  const c1 = { x: px(x1), y: py(y1) }
  const c2 = { x: px(x2), y: py(y2) }
  const grid = [0, 0.25, 0.5, 0.75, 1]

  return (
    <div dir="ltr" className="flex items-center gap-3">
      <svg
        ref={svgRef}
        width={SIZE}
        height={SIZE}
        className="shrink-0 rounded-lg border border-white/10 bg-black/30"
        onPointerDown={(e) => e.preventDefault()}
      >
        {grid.map((g) => (
          <g key={g} stroke="rgba(255,255,255,0.08)">
            <line x1={px(g)} y1={PAD} x2={px(g)} y2={SIZE - PAD} />
            <line x1={PAD} y1={py(g)} x2={SIZE - PAD} y2={py(g)} />
          </g>
        ))}
        <line x1={PAD} y1={py(1)} x2={px(1)} y2={py(1)} stroke="rgba(255,255,255,0.12)" />
        <line x1={PAD} y1={py(0)} x2={px(1)} y2={py(0)} stroke="rgba(255,255,255,0.12)" />
        {/* control handles */}
        <line x1={px(0)} y1={py(0)} x2={c1.x} y2={c1.y} stroke="rgba(251,146,60,0.7)" strokeWidth={1.5} />
        <line x1={px(1)} y1={py(1)} x2={c2.x} y2={c2.y} stroke="rgba(56,189,248,0.7)" strokeWidth={1.5} />
        <path d={`M ${px(0)} ${py(0)} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${px(1)} ${py(1)}`} fill="none" stroke="#f59e0b" strokeWidth={2} />
        <circle cx={px(0)} cy={py(0)} r={3.5} fill="rgba(255,255,255,0.5)" />
        <circle cx={px(1)} cy={py(1)} r={3.5} fill="rgba(255,255,255,0.5)" />
        <circle
          cx={c1.x}
          cy={c1.y}
          r={6}
          fill="#fb923c"
          className="cursor-grab"
          onPointerDown={(e) => {
            e.preventDefault()
            setDrag(0)
          }}
        />
        <circle
          cx={c2.x}
          cy={c2.y}
          r={6}
          fill="#38bdf8"
          className="cursor-grab"
          onPointerDown={(e) => {
            e.preventDefault()
            setDrag(1)
          }}
        />
      </svg>
      <div className="min-w-0 flex-1">
        <div className="relative h-5 rounded bg-black/30">
          <div ref={ballRef} className="absolute top-0.5 size-3.5 rounded-full bg-amber-400" style={{ left: 0 }} />
        </div>
        <p className="mt-1.5 font-mono text-[10.5px] text-ink-400">
          cubic-bezier({x1.toFixed(2)}, {y1.toFixed(2)}, {x2.toFixed(2)}, {y2.toFixed(2)})
        </p>
        <p className="mt-1 text-[10.5px] leading-relaxed text-ink-500">اسحب المقبضين (برتقالي/أزرق) لتشكيل المنحنى.</p>
      </div>
    </div>
  )
}
