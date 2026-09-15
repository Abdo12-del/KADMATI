/**
 * Header — transparent floating bar over the aurora.
 * Left: glowing 4-point star + SlideFlow wordmark · Center: Features /
 * Templates / Pricing / Blog · Right: translucent glass "Get Started" pill.
 */
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
          <svg
            viewBox="0 0 24 24"
            className="h-7 w-7 drop-shadow-[0_0_10px_rgba(139,120,255,0.9)] transition-transform duration-300 group-hover:scale-110"
            aria-hidden
          >
            <defs>
              <linearGradient id="slf-logo-star" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#8be9ff" />
                <stop offset="0.5" stopColor="#6d6dff" />
                <stop offset="1" stopColor="#a855f7" />
              </linearGradient>
            </defs>
            <path d="M12 1.5l2.7 7.8 7.8 2.7-7.8 2.7L12 22.5l-2.7-7.8-7.8-2.7 7.8-2.7z" fill="url(#slf-logo-star)" />
          </svg>
          <span className="slf-display-en text-[19px] font-bold tracking-tight text-white">SlideFlow</span>
        </a>

        {/* Navigation */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-10 md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={item.inert ? (e) => e.preventDefault() : undefined}
              className="slf-display-en text-[13.5px] font-medium text-[#aab6d9] transition-colors duration-200 hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <button type="button" onClick={onStart} className="slf-btn slf-btn-pill-glass h-10 px-6 text-[13.5px]">
          Get Started
        </button>
      </div>
    </header>
  )
}
