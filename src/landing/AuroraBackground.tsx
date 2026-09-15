/**
 * AuroraBackground — the atmospheric canvas of the whole landing page.
 * Deep midnight gradient base + four huge blurred light ribbons
 * (blue→cyan, violet→purple, purple→magenta) drifting on very slow
 * independent loops, two twinkling star fields, and a vignette so text
 * always stays readable. Purely decorative.
 */
export function AuroraBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Base: deep midnight navy → black-blue atmospheric space */}
      <div className="slf-bg-base absolute inset-0" />

      {/* Aurora ribbons — flowing diagonally behind all content */}
      <div
        className="slf-ribbon slf-ribbon-blue"
        style={{ top: '-2%', insetInlineStart: '-18%', width: '135%', height: 420 }}
      />
      <div
        className="slf-ribbon slf-ribbon-cyan"
        style={{ top: '9%', insetInlineEnd: '-22%', width: '110%', height: 340, opacity: 0.8 }}
      />
      <div
        className="slf-ribbon slf-ribbon-violet"
        style={{ top: '34%', insetInlineStart: '-16%', width: '120%', height: 380, opacity: 0.75 }}
      />
      <div
        className="slf-ribbon slf-ribbon-purple"
        style={{ top: '58%', insetInlineEnd: '-18%', width: '115%', height: 340, opacity: 0.7 }}
      />
      <div
        className="slf-ribbon slf-ribbon-magenta"
        style={{ top: '80%', insetInlineStart: '-12%', width: '105%', height: 320, opacity: 0.6 }}
      />

      {/* Soft radial light fields */}
      <div
        className="slf-glow"
        style={{ top: '-12%', insetInlineStart: '18%', width: '56%', height: 420, background: 'radial-gradient(closest-side, rgba(59,130,246,0.30), transparent)' }}
      />
      <div
        className="slf-glow"
        style={{ top: '30%', insetInlineEnd: '-8%', width: '44%', height: 480, background: 'radial-gradient(closest-side, rgba(139,92,246,0.24), transparent)', animationDelay: '-7s' }}
      />
      <div
        className="slf-glow"
        style={{ top: '64%', insetInlineStart: '-6%', width: '42%', height: 460, background: 'radial-gradient(closest-side, rgba(34,211,238,0.17), transparent)', animationDelay: '-3s' }}
      />

      {/* Stars — two layers, subtle twinkle */}
      <div className="slf-stars" />
      <div className="slf-stars slf-stars-2" />

      {/* Cinematic vignette */}
      <div className="slf-vignette" />
    </div>
  )
}
