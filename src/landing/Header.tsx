/**
 * Header — transparent floating bar over the aurora.
 * Left: SlideFlow logo + wordmark · Center: Features / Templates / Pricing / Blog
 * Right: glowing "Get Started" CTA. Visually lightweight — no solid nav bar.
 */
import { Sparkles } from 'lucide-react'

const NAV: { label: string; href: string; inert?: boolean }[] = [
  { label: 'Features', href: '#features' },
  { label: 'Templates', href: '#templates' },
  { label: 'Pricing', href: '#', inert: true },
  { label: 'Blog', href: '#', inert: true },
]

export function Header({ onStart }: { onStart: () => void }) {
  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <div dir="ltr" className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
        {/* Logo */}
        <a href="#" className="group flex items-center gap-2.5" onClick={(e) => e.preventDefault()} aria-label="SlideFlow home">
          <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl shadow-[0_0_22px_-4px_rgba(99,125,255,0.8),inset_0_1px_0_rgba(255,255,255,0.35)] transition-transform duration-300 group-hover:scale-105"
            style={{ backgroundImage: 'linear-gradient(135deg, #3e6dff 0%, #7c5cfc 55%, #2fd4f6 120%)' }}
          >
            <svg viewBox="0 0 20 20" className="h-[18px] w-[18px] text-white" fill="none" aria-hidden>
              <rect x="2.5" y="3.5" width="12" height="9" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
              <path d="M6.5 16h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M6.5 8.2c1.3-1.6 2.7-1.6 4 0s2.7 1.6 4 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </span>
          <span className="slf-display-en text-[19px] font-bold tracking-tight text-white">
            Slide<span className="slf-grad">Flow</span>
          </span>
        </a>

        {/* Navigation */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-9 md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={item.inert ? (e) => e.preventDefault() : undefined}
              className="slf-display-en text-[14px] font-medium text-[#aab6d9] transition-colors duration-200 hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <button type="button" onClick={onStart} className="slf-btn slf-btn-primary h-10 px-5 text-[14px]">
          <Sparkles className="h-4 w-4" strokeWidth={2.2} aria-hidden />
          Get Started
        </button>
      </div>
    </header>
  )
}
