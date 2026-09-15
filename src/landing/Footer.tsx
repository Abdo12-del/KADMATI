/**
 * Footer — quiet, lightweight closer under the aurora landscape.
 */
export function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/6 bg-[#02060f]/80 py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <span
            className="grid h-7 w-7 place-items-center rounded-lg"
            style={{ backgroundImage: 'linear-gradient(135deg, #3e6dff 0%, #7c5cfc 55%, #2fd4f6 120%)' }}
          >
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-white" fill="none" aria-hidden>
              <rect x="2.5" y="3.5" width="12" height="9" rx="1.6" stroke="currentColor" strokeWidth="1.8" />
              <path d="M6.5 16h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <span className="slf-display-en text-[15px] font-bold tracking-tight text-white">
            Slide<span className="slf-grad">Flow</span>
          </span>
          <span className="text-[12px] text-[#7d8bb2]">— صمّم، صدِّر، اعرض.</span>
        </div>

        <nav dir="ltr" className="flex items-center gap-6" aria-label="Footer">
          {['Features', 'Templates', 'Pricing', 'Blog'].map((label) => (
            <a key={label} href="#" onClick={(e) => e.preventDefault()} className="slf-display-en text-[12.5px] text-[#7d8bb2] transition-colors hover:text-white">
              {label}
            </a>
          ))}
        </nav>

        <p className="text-[12px] text-[#66739c]">© 2026 SlideFlow — جميع الحقوق محفوظة</p>
      </div>
    </footer>
  )
}
