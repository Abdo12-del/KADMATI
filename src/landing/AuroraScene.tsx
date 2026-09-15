/**
 * AuroraScene — reusable CSS/SVG aurora-landscape artwork: gradient sky,
 * glowing ribbons, stars, layered mountain silhouettes and reflective water.
 * Every slide preview on the landing (editor canvas, thumbnails, template
 * cards, AI cards, showcase window) is drawn from this one component so the
 * whole page shares a single visual system, like the reference.
 */
import type { ReactNode } from 'react'

type Variant = 'blue' | 'purple' | 'pink' | 'teal'

const SKY: Record<Variant, [string, string, string]> = {
  blue: ['#0a1233', '#152054', '#1a1040'],
  purple: ['#150f38', '#2b1762', '#111a4c'],
  pink: ['#1d0f3d', '#3d1662', '#141b4e'],
  teal: ['#081431', '#102154', '#101a44'],
}

const RIBBONS: Record<Variant, [string, string, string]> = {
  blue: ['rgba(56,150,248,0.5)', 'rgba(99,102,241,0.45)', 'rgba(125,232,247,0.75)'],
  purple: ['rgba(139,92,246,0.6)', 'rgba(59,130,246,0.4)', 'rgba(196,181,253,0.7)'],
  pink: ['rgba(232,121,249,0.5)', 'rgba(168,85,247,0.55)', 'rgba(249,168,212,0.65)'],
  teal: ['rgba(45,212,191,0.38)', 'rgba(34,211,238,0.5)', 'rgba(125,232,247,0.65)'],
}

const MOUNT: Record<Variant, [string, string]> = {
  blue: ['rgba(14,22,54,0.94)', '#070d24'],
  purple: ['rgba(32,21,68,0.94)', '#0c0a28'],
  pink: ['rgba(40,21,68,0.94)', '#0e0a2a'],
  teal: ['rgba(13,25,54,0.94)', '#061024'],
}

const RIDGE_BACK = 'M0 150 L0 92 L44 44 L82 90 L122 32 L164 88 L206 50 L248 100 L292 58 L336 98 L400 60 L400 150 Z'
const RIDGE_FRONT = 'M0 150 L0 112 L60 76 L118 118 L178 86 L238 126 L300 94 L352 128 L400 104 L400 150 Z'

interface AuroraSceneProps {
  variant?: Variant
  children?: ReactNode
  water?: boolean
  className?: string
}

export function AuroraScene({ variant = 'blue', children, water = true, className }: AuroraSceneProps) {
  const [s0, s1, s2] = SKY[variant]
  const [r0, r1, core] = RIBBONS[variant]
  const [mBack, mFront] = MOUNT[variant]
  return (
    <div
      aria-hidden={children ? undefined : true}
      className={`absolute inset-0 overflow-hidden ${className ?? ''}`}
      style={{ background: `linear-gradient(180deg, ${s0} 0%, ${s1} 52%, ${s2} 100%)` }}
    >
      <div className="slf-stars" style={{ opacity: 0.5, backgroundSize: '260px 220px' }} />

      {/* aurora ribbons */}
      <i
        className="absolute"
        style={{ top: '-24%', left: '-16%', width: '88%', height: '80%', background: `radial-gradient(50% 55% at 50% 50%, ${r0}, transparent 70%)`, filter: 'blur(16px)', transform: 'rotate(-16deg)' }}
      />
      <i
        className="absolute"
        style={{ top: '-12%', right: '-22%', width: '92%', height: '74%', background: `radial-gradient(48% 52% at 50% 50%, ${r1}, transparent 70%)`, filter: 'blur(18px)', transform: 'rotate(14deg)' }}
      />
      <i
        className="absolute"
        style={{ top: '16%', left: '20%', width: '36%', height: '32%', background: `radial-gradient(50% 50% at 50% 50%, ${core}, transparent 72%)`, filter: 'blur(12px)' }}
      />

      {/* mountains */}
      <svg viewBox="0 0 400 150" preserveAspectRatio="none" className="absolute inset-x-0 bottom-[24%] h-[52%] w-full">
        <path d={RIDGE_BACK} fill={mBack} />
      </svg>
      <svg viewBox="0 0 400 150" preserveAspectRatio="none" className="absolute inset-x-0 bottom-[24%] h-[40%] w-full">
        <path d={RIDGE_FRONT} fill={mFront} />
      </svg>

      {/* water */}
      {water && (
        <div className="absolute inset-x-0 bottom-0 h-[25%]">
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(180deg, ${r0} 0%, rgba(4,8,24,0.2) 42%, rgba(2,5,16,0.72) 100%)`, opacity: 0.35 }}
          />
          <i className="slf-water-lines absolute inset-0" />
          <i
            className="absolute"
            style={{ top: '-34%', left: '28%', width: '44%', height: '140%', background: `radial-gradient(50% 60% at 50% 40%, ${core}, transparent 70%)`, filter: 'blur(14px)', opacity: 0.5 }}
          />
        </div>
      )}

      {children}
    </div>
  )
}
