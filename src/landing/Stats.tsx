/**
 * Stats — "+500 قالب احترافي · +50K مستخدم سعيد · 99% دقة التحليل · 3x أسرع في التصميم"
 * integrated into a single premium glass panel (not a dashboard).
 */
import { Reveal } from './Reveal'

const STATS = [
  { value: '+500', label: 'قالب احترافي', grad: 'linear-gradient(120deg,#6fa5ff,#8b5cf6)' },
  { value: '+50K', label: 'مستخدم سعيد', grad: 'linear-gradient(120deg,#22d3ee,#6fa5ff)' },
  { value: '99%', label: 'دقة التحليل', grad: 'linear-gradient(120deg,#a855f7,#e879f9)' },
  { value: '3x', label: 'أسرع في التصميم', grad: 'linear-gradient(120deg,#7c5cfc,#2fd4f6)' },
]

export function Stats() {
  return (
    <Reveal delay="120ms">
      <div className="slf-glass relative mx-auto mt-16 max-w-5xl overflow-hidden rounded-3xl">
        {/* inner aurora sheen */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(42% 90% at 12% 0%, rgba(62,109,255,0.14), transparent 60%), radial-gradient(42% 90% at 88% 100%, rgba(124,92,252,0.14), transparent 60%)',
          }}
        />
        <div className="relative grid grid-cols-2 lg:grid-cols-4">
          {STATS.map(({ value, label, grad }, i) => (
            <div
              key={label}
              className={[
                'flex flex-col items-center gap-1.5 border-white/8 px-4 py-8 text-center md:py-10',
                i % 2 === 1 ? 'max-lg:border-s' : '',
                i >= 2 ? 'max-lg:border-t' : '',
                i > 0 ? 'lg:border-s' : '',
              ].join(' ')}
            >
              <span
                className="slf-display-en text-[38px] font-extrabold leading-none tracking-tight md:text-[44px]"
                style={{ backgroundImage: grad, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 0 22px rgba(110,140,255,0.35))' }}
              >
                {value}
              </span>
              <span className="text-[13px] font-medium text-[#9dabcd] md:text-[14px]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  )
}
