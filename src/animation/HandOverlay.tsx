import { memo, useEffect, useState } from 'react'
import { subscribeHandFrame, type HandFrame } from './hand'
import type { WhiteboardHandStyle } from './types'

export const HandOverlay = memo(function HandOverlay({ slideId }: { slideId?: string }) {
  void slideId
  const [frame, setFrame] = useState<HandFrame>({
    active: false,
    x: 0,
    y: 0,
    angle: 0,
    opacity: 0,
    style: 'marker-dark',
    side: 'right',
    pressing: false,
  })

  useEffect(() => {
    return subscribeHandFrame(setFrame)
  }, [])

  if (!frame.active || frame.opacity <= 0.01) return null

  const isLeft = frame.side === 'left'

  return (
    <div
      className="pointer-events-none absolute z-50 select-none will-change-transform"
      style={{
        left: frame.x,
        top: frame.y,
        opacity: frame.opacity,
        transform: `rotate(${frame.angle}deg) ${isLeft ? 'scaleX(-1)' : ''}`,
        transformOrigin: '0px 0px',
        transition: 'opacity 0.08s ease-out',
        filter: 'drop-shadow(4px 8px 14px rgba(0, 0, 0, 0.28))',
      }}
    >
      <HandSvg style={frame.style} />
    </div>
  )
})

function HandSvg({ style }: { style: WhiteboardHandStyle }) {
  if (style === 'eraser') {
    return <EraserHand />
  }
  if (style === 'pencil') {
    return <PencilHand />
  }
  if (style === 'chalk') {
    return <ChalkHand />
  }
  return <MarkerHand color={style === 'marker-blue' ? '#2563eb' : '#18181b'} label={style === 'marker-blue' ? 'BLUE' : 'AUROVA'} />
}

/**
 * Realistic hand holding a marker.
 * Coordinate origin (0, 0) is positioned EXACTLY at the marker nib tip.
 */
function MarkerHand({ color, label }: { color: string; label: string }) {
  return (
    <svg width="240" height="240" viewBox="-15 -15 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Skin gradient */}
        <linearGradient id="skin" x1="40" y1="50" x2="190" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffd8be" />
          <stop offset="50%" stopColor="#f3be9b" />
          <stop offset="100%" stopColor="#dda078" />
        </linearGradient>
        {/* Skin shadow */}
        <linearGradient id="skinShadow" x1="80" y1="100" x2="160" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#d59067" />
          <stop offset="100%" stopColor="#b6714a" />
        </linearGradient>
        {/* Marker body gradient */}
        <linearGradient id="markerGrad" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor={color} />
          <stop offset="100%" stopColor="#09090b" />
        </linearGradient>
        {/* Metal collar */}
        <linearGradient id="metal" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="50%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
      </defs>

      {/* Marker nib touching (0, 0) */}
      <path d="M0 0 L10 6 L6 10 Z" fill={color} />
      <path d="M6 10 L10 6 L18 14 L14 18 Z" fill="url(#metal)" stroke="#475569" strokeWidth="0.8" />
      
      {/* Marker barrel */}
      <path d="M14 18 L18 14 L85 81 L81 85 Z" fill="url(#markerGrad)" />
      <path d="M22 22 L26 18 L32 24 L28 28 Z" fill="#38bdf8" opacity="0.8" />
      <text x="36" y="32" transform="rotate(45, 36, 32)" fill="#ffffff" fontSize="5.5" fontWeight="bold" letterSpacing="0.8" opacity="0.9">
        {label}
      </text>

      {/* Forearm entering from bottom-right */}
      <path
        d="M145 160 C160 175, 200 215, 225 240 L180 240 C155 210, 125 180, 115 165 Z"
        fill="url(#skinShadow)"
      />
      <path
        d="M130 145 C150 165, 195 210, 220 235 L240 220 C220 185, 175 140, 155 125 Z"
        fill="url(#skin)"
      />

      {/* Palm & Thumb gripping marker */}
      {/* Index finger */}
      <path
        d="M26 30 C20 34, 18 42, 22 48 C28 54, 40 50, 48 42 L65 58 C62 62, 55 68, 48 64 C38 60, 28 66, 30 76 C32 84, 42 86, 52 82 L78 72 C88 68, 92 58, 86 48 C80 38, 62 26, 44 24 C36 24, 30 26, 26 30 Z"
        fill="url(#skin)"
        stroke="#c98256"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Middle, Ring, Pinky curled */}
      <path
        d="M50 78 C42 84, 40 94, 46 100 C52 106, 64 102, 72 94 L86 80"
        fill="url(#skin)"
        stroke="#c98256"
        strokeWidth="1.2"
      />
      <path
        d="M66 98 C60 104, 58 114, 64 120 C70 126, 82 122, 90 114 L104 100"
        fill="url(#skin)"
        stroke="#c98256"
        strokeWidth="1.2"
      />
      <path
        d="M82 118 C78 124, 76 132, 82 138 C88 144, 98 140, 106 132 L120 118"
        fill="url(#skinShadow)"
        stroke="#b6714a"
        strokeWidth="1.2"
      />

      {/* Thumb crossing over */}
      <path
        d="M32 38 C30 46, 38 52, 48 48 C58 44, 62 36, 58 30 C54 24, 42 22, 36 26 Z"
        fill="#ffe1cc"
        stroke="#c98256"
        strokeWidth="1"
      />
      {/* Fingernail */}
      <path d="M34 29 C33 33, 36 36, 40 34 C43 32, 42 28, 38 27 Z" fill="#fff5ea" opacity="0.8" />
    </svg>
  )
}

/** Hand holding a wooden sketching pencil */
function PencilHand() {
  return (
    <svg width="240" height="240" viewBox="-15 -15 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pencilWood" x1="0" y1="0" x2="20" y2="20">
          <stop offset="0%" stopColor="#fed7aa" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="pencilShaft" x1="0" y1="0" x2="80" y2="80">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="40%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
      </defs>
      {/* Lead tip at (0, 0) */}
      <path d="M0 0 L6 3 L3 6 Z" fill="#1e293b" />
      {/* Sharpened wood cone */}
      <path d="M3 6 L6 3 L16 11 L11 16 Z" fill="url(#pencilWood)" stroke="#b45309" strokeWidth="0.6" />
      {/* Hexagonal pencil shaft */}
      <path d="M11 16 L16 11 L85 80 L80 85 Z" fill="url(#pencilShaft)" stroke="#854d0e" strokeWidth="0.8" />
      <line x1="13" y1="13" x2="82" y2="82" stroke="#facc15" strokeWidth="1.2" />

      {/* Hand gripping pencil */}
      <path
        d="M130 145 C150 165, 195 210, 220 235 L240 220 C220 185, 175 140, 155 125 Z"
        fill="#f3be9b"
      />
      <path
        d="M24 28 C18 32, 16 40, 20 46 C26 52, 38 48, 46 40 L65 58 C62 62, 55 68, 48 64 C38 60, 28 66, 30 76 C32 84, 42 86, 52 82 L78 72 C88 68, 92 58, 86 48 C80 38, 62 26, 44 24 Z"
        fill="#ffd8be"
        stroke="#c98256"
        strokeWidth="1.2"
      />
      <path d="M30 36 C28 44, 36 50, 46 46 C54 42, 58 34, 54 28 Z" fill="#ffe1cc" stroke="#c98256" strokeWidth="1" />
    </svg>
  )
}

/** Hand holding a chalk stick */
function ChalkHand() {
  return (
    <svg width="240" height="240" viewBox="-15 -15 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Chalk stick at (0, 0) */}
      <path d="M0 0 C1 -2, 6 -1, 7 2 L38 33 L31 40 L2 7 Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />
      <path d="M1 1 C3 0, 5 1, 6 3" stroke="#e2e8f0" strokeWidth="1" />
      {/* Hand gripping chalk closer to tip */}
      <path
        d="M130 145 C150 165, 195 210, 220 235 L240 220 C220 185, 175 140, 155 125 Z"
        fill="#f3be9b"
      />
      <path
        d="M18 20 C12 24, 12 32, 16 38 C22 44, 32 40, 40 32 L58 48 C55 52, 48 58, 42 54 C32 50, 24 56, 26 64 C28 72, 38 74, 48 70 L72 60 C80 56, 84 48, 78 40 Z"
        fill="#ffd8be"
        stroke="#c98256"
        strokeWidth="1.2"
      />
    </svg>
  )
}

/** Hand holding a whiteboard felt eraser / sponge */
function EraserHand() {
  return (
    <svg width="260" height="260" viewBox="-50 -30 260 260" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="eraserGrip" x1="0" y1="0" x2="60" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      {/* Felt bottom wiping surface (centered near 0, 0) */}
      <rect x="-35" y="-14" width="70" height="28" rx="6" fill="#334155" stroke="#1e293b" strokeWidth="1.5" />
      <rect x="-33" y="-12" width="66" height="8" rx="3" fill="#64748b" />
      {/* Blue ergonomic grip on top */}
      <rect x="-30" y="-8" width="60" height="20" rx="8" fill="url(#eraserGrip)" stroke="#1e40af" strokeWidth="1.5" />
      {/* Hand holding the grip from above */}
      <path
        d="M-15 10 C-18 24, -10 40, 0 45 C15 50, 30 42, 35 30 L60 55 C65 52, 70 45, 65 38 C55 28, 45 15, 30 10 Z"
        fill="#ffd8be"
        stroke="#c98256"
        strokeWidth="1.2"
      />
      {/* Forearm extending upwards/right */}
      <path d="M40 45 C60 70, 110 130, 140 170 L170 150 C140 110, 80 50, 60 30 Z" fill="#f3be9b" stroke="#c98256" strokeWidth="1" />
    </svg>
  )
}
