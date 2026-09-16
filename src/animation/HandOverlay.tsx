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
        transition: 'opacity 0.12s ease-out',
      }}
    >
      <HandSvg style={frame.style} pressing={frame.pressing} />
    </div>
  )
})

function HandSvg({ style, pressing }: { style: WhiteboardHandStyle; pressing: boolean }) {
  if (style === 'eraser') {
    return <EraserHand pressing={pressing} />
  }
  if (style === 'pencil') {
    return <PencilHand pressing={pressing} />
  }
  if (style === 'chalk') {
    return <ChalkHand pressing={pressing} />
  }
  return <MarkerHand color={style === 'marker-blue' ? '#2563eb' : '#111827'} label={style === 'marker-blue' ? 'BLUE' : 'EXPO'} pressing={pressing} />
}

/**
 * Ultra-realistic hand holding a whiteboard marker.
 * Origin (0,0) is the exact marker nib tip touching the board.
 * ViewBox: -20 -20 320 360 - hand extends down-right from tip.
 * 
 * Design goals:
 * - Photorealistic skin with subsurface scattering gradients
 * - Visible anatomy: knuckles, tendons, fingernails with cuticles, skin folds
 * - Real marker with chisel tip, metal ferrule, plastic barrel with highlight
 * - Soft contact shadow + hand drop shadow on whiteboard
 * - Forearm with subtle hair and shirt cuff
 */
function MarkerHand({ color, label, pressing }: { color: string; label: string; pressing: boolean }) {
  const pressScale = pressing ? 0.97 : 1
  const tipPress = pressing ? 1.2 : 0

  return (
    <svg width="320" height="380" viewBox="-24 -24 320 380" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
      <defs>
        {/* Realistic skin gradients */}
        <radialGradient id="skinBase" cx="0.35" cy="0.3" r="0.85">
          <stop offset="0%" stopColor="#ffddc2" />
          <stop offset="25%" stopColor="#f8c4a0" />
          <stop offset="55%" stopColor="#e8a67c" />
          <stop offset="85%" stopColor="#c67d52" />
          <stop offset="100%" stopColor="#a85a32" />
        </radialGradient>
        <linearGradient id="skinLight" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffe8d6" />
          <stop offset="100%" stopColor="#e8a67c" />
        </linearGradient>
        <linearGradient id="skinMid" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5b994" />
          <stop offset="100%" stopColor="#d4845a" />
        </linearGradient>
        <linearGradient id="skinShadow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c67d52" />
          <stop offset="100%" stopColor="#8b4a2a" />
        </linearGradient>
        <linearGradient id="skinDeepShadow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8b4a2a" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#5a2e18" stopOpacity="0.9" />
        </linearGradient>
        {/* Forearm */}
        <linearGradient id="forearmGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#e8a67c" />
          <stop offset="20%" stopColor="#f3c4a0" />
          <stop offset="60%" stopColor="#e8a67c" />
          <stop offset="100%" stopColor="#c67d52" />
        </linearGradient>
        {/* Nail */}
        <linearGradient id="nailGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff5eb" />
          <stop offset="30%" stopColor="#ffe4cc" />
          <stop offset="100%" stopColor="#f5c4a8" />
        </linearGradient>
        <radialGradient id="nailHighlight" cx="0.3" cy="0.2" r="0.8">
          <stop offset="0%" stopColor="white" stopOpacity="0.9" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        {/* Marker barrel */}
        <linearGradient id="markerBarrel" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1f2937" />
          <stop offset="12%" stopColor="#374151" />
          <stop offset="35%" stopColor={color} />
          <stop offset="65%" stopColor={color} />
          <stop offset="88%" stopColor="#111827" />
          <stop offset="100%" stopColor="#030712" />
        </linearGradient>
        <linearGradient id="markerHighlight" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="20%" stopColor="white" stopOpacity="0.35" />
          <stop offset="50%" stopColor="white" stopOpacity="0.15" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="ferruleGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#9ca3af" />
          <stop offset="25%" stopColor="#e5e7eb" />
          <stop offset="50%" stopColor="#f9fafb" />
          <stop offset="75%" stopColor="#9ca3af" />
          <stop offset="100%" stopColor="#4b5563" />
        </linearGradient>
        {/* Shadows */}
        <radialGradient id="contactShadow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="black" stopOpacity="0.45" />
          <stop offset="40%" stopColor="black" stopOpacity="0.15" />
          <stop offset="100%" stopColor="black" stopOpacity="0" />
        </radialGradient>
        <filter id="handShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="8" dy="14" stdDeviation="10" floodColor="black" floodOpacity="0.32" />
          <feDropShadow dx="3" dy="6" stdDeviation="3" floodColor="black" floodOpacity="0.2" />
        </filter>
        <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="black" floodOpacity="0.18" />
        </filter>
        <filter id="skinTexture">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" result="noise" />
          <feColorMatrix type="saturate" values="0" in="noise" result="desat" />
          <feComponentTransfer in="desat" result="softNoise">
            <feFuncA type="table" tableValues="0 0 0 0.04 0.08 0.04 0 0" />
          </feComponentTransfer>
          <feBlend in="SourceGraphic" in2="softNoise" mode="multiply" />
        </filter>
      </defs>

      {/* Contact shadow on whiteboard at nib tip */}
      <ellipse cx={1 + tipPress * 0.5} cy={1 + tipPress} rx={12 + tipPress * 2} ry={5 + tipPress} fill="url(#contactShadow)" opacity={pressing ? 0.85 : 0.5} />

      {/* Forearm - back layer (shadow side) */}
      <g filter="url(#handShadow)">
        {/* Shirt cuff */}
        <path
          d="M 165 195 C 190 225, 240 285, 295 355 L 260 365 C 215 300, 175 250, 150 220 Z"
          fill="#1f2937"
          stroke="#111827"
          strokeWidth="1"
        />
        <path
          d="M 162 192 C 188 222, 235 282, 290 350 L 295 355 L 260 365 L 150 220 Z"
          fill="#374151"
          opacity="0.9"
        />
        {/* Forearm main */}
        <path
          d="M 85 125 C 115 150, 165 195, 195 230 C 210 250, 250 295, 285 340 L 315 325 C 285 275, 235 220, 200 185 C 165 150, 125 115, 95 100 Z"
          fill="url(#forearmGrad)"
          stroke="#a86a44"
          strokeWidth="0.8"
        />
        {/* Forearm highlight (top edge light) */}
        <path
          d="M 95 100 C 125 115, 165 150, 200 185 L 195 195 C 165 165, 120 125, 92 108 Z"
          fill="#ffddc2"
          opacity="0.6"
        />
        {/* Tendon / vein subtle */}
        <path d="M 110 115 C 140 135, 175 170, 200 200" stroke="#b56a42" strokeWidth="0.7" opacity="0.35" fill="none" />
        <path d="M 125 120 C 150 140, 180 170, 205 205" stroke="#8b4a2a" strokeWidth="0.5" opacity="0.25" fill="none" />
      </g>

      {/* Marker barrel - behind fingers, at 45 degrees from tip */}
      <g transform={`scale(${pressScale})`} style={{ transformOrigin: '0 0' }}>
        {/* Barrel shadow */}
        <path d="M 14 20 L 18 16 L 112 110 L 108 114 Z" fill="black" opacity="0.2" transform="translate(2,3)" />
        {/* Main barrel */}
        <path d="M 14 20 L 18 16 L 112 110 L 108 114 Z" fill="url(#markerBarrel)" stroke="#111827" strokeWidth="0.8" />
        {/* Highlight stripe */}
        <path d="M 20 18 L 24 14 L 108 98 L 104 102 Z" fill="url(#markerHighlight)" />
        {/* Brand label area */}
        <g transform="rotate(45, 60, 60)">
          <rect x="32" y="54" width="38" height="12" rx="2" fill="white" opacity="0.92" />
          <text x="51" y="62.5" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize="7" fontWeight="900" fill={color} letterSpacing="0.5">{label}</text>
        </g>
        {/* Cap clip */}
        <path d="M 78 78 L 82 74 L 95 87 L 91 91 Z" fill="#e5e7eb" stroke="#6b7280" strokeWidth="0.5" />
      </g>

      {/* Hand palm and fingers - realistic anatomy */}
      <g filter="url(#softShadow)">
        {/* Palm base - main mass */}
        <path
          d="M 52 58 C 48 62, 44 72, 46 84 C 48 96, 58 108, 72 118 C 86 128, 102 135, 118 142 C 134 149, 148 155, 158 165 L 145 185 C 130 175, 110 165, 92 152 C 74 139, 58 124, 50 108 C 42 92, 42 74, 52 58 Z"
          fill="url(#skinBase)"
          stroke="#a86a44"
          strokeWidth="1"
        />
        {/* Palm crease - life line */}
        <path d="M 58 85 C 65 95, 78 108, 95 118" stroke="#b56a42" strokeWidth="0.8" opacity="0.5" fill="none" strokeLinecap="round" />
        {/* Palm highlight */}
        <path
          d="M 55 65 C 58 75, 68 90, 82 100 C 96 110, 112 118, 125 125 L 120 132 C 105 125, 88 115, 74 102 C 60 89, 52 75, 55 65 Z"
          fill="#ffe8d6"
          opacity="0.55"
        />

        {/* Pinky finger - curled behind, smallest */}
        <g>
          <path
            d="M 88 138 C 82 145, 80 155, 85 162 C 90 169, 100 168, 108 162 L 125 148 C 122 142, 115 136, 108 134 C 100 132, 92 134, 88 138 Z"
            fill="url(#skinShadow)"
            stroke="#8b4a2a"
            strokeWidth="0.9"
          />
          {/* Pinky nail */}
          <ellipse cx="98" cy="150" rx="4" ry="5.5" fill="url(#nailGrad)" stroke="#a86a44" strokeWidth="0.4" transform="rotate(-25,98,150)" />
          <ellipse cx="97" cy="148" rx="2" ry="2.5" fill="url(#nailHighlight)" transform="rotate(-25,98,150)" />
          {/* Knuckle wrinkle */}
          <path d="M 86 142 C 90 144, 95 145, 100 144" stroke="#8b4a2a" strokeWidth="0.5" opacity="0.4" fill="none" />
        </g>

        {/* Ring finger - curled */}
        <g>
          <path
            d="M 72 118 C 62 126, 58 138, 64 147 C 70 156, 84 155, 94 147 L 115 128 C 112 120, 104 114, 96 112 C 86 110, 76 112, 72 118 Z"
            fill="url(#skinMid)"
            stroke="#a86a44"
            strokeWidth="0.9"
          />
          <ellipse cx="84" cy="132" rx="5" ry="6.5" fill="url(#nailGrad)" stroke="#a86a44" strokeWidth="0.4" transform="rotate(-20,84,132)" />
          <ellipse cx="83" cy="130" rx="2.2" ry="3" fill="url(#nailHighlight)" transform="rotate(-20,84,132)" />
          <path d="M 70 122 C 75 124, 82 125, 88 124" stroke="#8b4a2a" strokeWidth="0.5" opacity="0.4" fill="none" />
          <path d="M 68 135 C 73 137, 80 138, 86 137" stroke="#8b4a2a" strokeWidth="0.5" opacity="0.35" fill="none" />
        </g>

        {/* Middle finger - supporting marker from below */}
        <g>
          <path
            d="M 58 98 C 48 106, 44 118, 50 128 C 56 138, 70 138, 82 130 L 108 108 C 105 100, 96 92, 86 90 C 76 88, 64 90, 58 98 Z"
            fill="url(#skinBase)"
            stroke="#a86a44"
            strokeWidth="0.9"
          />
          {/* Middle finger nail - visible side */}
          <path
            d="M 68 112 C 66 116, 68 120, 72 122 C 76 124, 80 122, 82 118 C 84 114, 82 110, 78 108 C 74 106, 70 108, 68 112 Z"
            fill="url(#nailGrad)"
            stroke="#a86a44"
            strokeWidth="0.4"
          />
          <path d="M 56 102 C 62 104, 70 105, 76 104" stroke="#8b4a2a" strokeWidth="0.5" opacity="0.4" fill="none" />
          <path d="M 52 116 C 58 118, 66 119, 72 118" stroke="#8b4a2a" strokeWidth="0.5" opacity="0.35" fill="none" />
          {/* Finger pad highlight */}
          <ellipse cx="62" cy="122" rx="6" ry="4" fill="#ffddc2" opacity="0.4" transform="rotate(-15,62,122)" />
        </g>

        {/* Index finger - over marker, guiding */}
        <g>
          <path
            d="M 32 38 C 26 42, 22 52, 26 62 C 30 72, 42 74, 54 68 L 78 88 C 84 84, 88 76, 86 68 C 84 60, 76 52, 66 48 C 56 44, 40 40, 32 38 Z"
            fill="url(#skinBase)"
            stroke="#a86a44"
            strokeWidth="1"
          />
          {/* Index fingertip pad - pressing marker */}
          <path
            d="M 28 42 C 24 48, 26 56, 32 60 C 38 64, 46 62, 50 56 C 54 50, 52 42, 46 38 C 40 34, 32 36, 28 42 Z"
            fill="#ffd8be"
            stroke="#a86a44"
            strokeWidth="0.6"
          />
          {/* Index nail - top view */}
          <path
            d="M 30 38 C 28 42, 30 46, 34 47 C 38 48, 42 46, 44 42 C 46 38, 44 34, 40 32 C 36 30, 32 32, 30 38 Z"
            fill="url(#nailGrad)"
            stroke="#a86a44"
            strokeWidth="0.5"
          />
          <ellipse cx="36" cy="38" rx="2.5" ry="2" fill="white" opacity="0.7" />
          {/* Knuckle */}
          <ellipse cx="62" cy="58" rx="7" ry="5" fill="#e8a67c" opacity="0.3" />
          <path d="M 52 50 C 58 52, 66 53, 72 52" stroke="#8b4a2a" strokeWidth="0.6" opacity="0.35" fill="none" />
          <path d="M 40 44 C 44 45, 48 46, 52 45" stroke="#8b4a2a" strokeWidth="0.5" opacity="0.3" fill="none" />
        </g>

        {/* Thumb - opposition grip, crossing over */}
        <g>
          {/* Thumb base / thenar eminence */}
          <path
            d="M 42 68 C 38 76, 40 88, 48 96 C 56 104, 68 104, 78 98 C 88 92, 92 82, 88 72 C 84 62, 74 54, 64 54 C 54 54, 46 60, 42 68 Z"
            fill="url(#skinLight)"
            stroke="#a86a44"
            strokeWidth="0.9"
          />
          {/* Thumb - main */}
          <path
            d="M 18 48 C 12 54, 10 66, 16 74 C 22 82, 34 84, 44 78 L 58 66 C 56 58, 50 50, 42 46 C 34 42, 24 42, 18 48 Z"
            fill="url(#skinBase)"
            stroke="#a86a44"
            strokeWidth="1"
          />
          {/* Thumb nail - large, visible */}
          <path
            d="M 14 50 C 10 56, 12 64, 18 68 C 24 72, 32 70, 36 64 C 40 58, 38 50, 32 46 C 26 42, 18 44, 14 50 Z"
            fill="url(#nailGrad)"
            stroke="#a86a44"
            strokeWidth="0.6"
          />
          <path d="M 16 52 C 14 56, 16 60, 20 62 C 24 64, 28 62, 30 58" fill="none" stroke="#d4a080" strokeWidth="0.4" opacity="0.6" />
          <ellipse cx="20" cy="54" rx="3" ry="2.5" fill="white" opacity="0.65" />
          {/* Thumb knuckle crease */}
          <path d="M 22 60 C 28 62, 36 62, 42 60" stroke="#8b4a2a" strokeWidth="0.6" opacity="0.4" fill="none" />
          <path d="M 38 72 C 44 74, 52 74, 58 72" stroke="#b56a42" strokeWidth="0.5" opacity="0.35" fill="none" />
          {/* Thumb pad */}
          <ellipse cx="28" cy="70" rx="7" ry="5" fill="#ffddc2" opacity="0.35" transform="rotate(-20,28,70)" />
        </g>

        {/* Marker tip - precise */}
        <g>
          {/* Ferrule */}
          <path d="M 8 12 L 12 8 L 20 16 L 16 20 Z" fill="url(#ferruleGrad)" stroke="#4b5563" strokeWidth="0.7" />
          <line x1="10" y1="14" x2="18" y2="10" stroke="white" strokeWidth="0.6" opacity="0.6" />
          {/* Nib - chisel tip */}
          <path d="M 0 0 L 10 7 L 7 11 L 2 6 Z" fill={color} stroke="#111827" strokeWidth="0.5" strokeLinejoin="round" />
          {/* Ink at tip when pressing */}
          {pressing && <ellipse cx="0.5" cy="0.5" rx="2.2" ry="1.8" fill={color} opacity="0.9" />}
          {/* Nib highlight */}
          <path d="M 1 1 L 8 6 L 6 8 L 1.5 3 Z" fill="white" opacity="0.25" />
        </g>

        {/* Skin details - knuckle highlights, wrinkles */}
        <g opacity="0.5">
          <path d="M 45 88 C 50 90, 58 91, 64 90" stroke="#8b4a2a" strokeWidth="0.4" fill="none" />
          <path d="M 60 108 C 66 110, 74 110, 80 108" stroke="#8b4a2a" strokeWidth="0.35" fill="none" />
        </g>
      </g>

      {/* Ink dot where marker touches */}
      <circle cx="0" cy="0" r={pressing ? 2.8 : 1.5} fill={color} opacity={pressing ? 0.95 : 0.6} />
      <circle cx="0.3" cy="0.3" r={pressing ? 1 : 0.5} fill="white" opacity={0.4} />
    </svg>
  )
}

function PencilHand({ pressing }: { pressing: boolean }) {
  const pressScale = pressing ? 0.97 : 1
  return (
    <svg width="320" height="380" viewBox="-24 -24 320 380" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id="pSkinBase" cx="0.35" cy="0.3" r="0.85">
          <stop offset="0%" stopColor="#ffddc2" />
          <stop offset="55%" stopColor="#e8a67c" />
          <stop offset="100%" stopColor="#a85a32" />
        </radialGradient>
        <linearGradient id="pWood" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="pShaft" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="25%" stopColor="#facc15" />
          <stop offset="75%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#a16207" />
        </linearGradient>
        <filter id="pShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="8" dy="14" stdDeviation="10" floodColor="black" floodOpacity="0.32" />
        </filter>
        <linearGradient id="pNail" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff5eb" />
          <stop offset="100%" stopColor="#f5c4a8" />
        </linearGradient>
      </defs>

      <ellipse cx="1" cy="1" rx="10" ry="4" fill="black" opacity={pressing ? 0.35 : 0.18} />

      <g filter="url(#pShadow)">
        <path d="M 165 195 C 190 225, 240 285, 295 355 L 260 365 C 215 300, 175 250, 150 220 Z" fill="#1f2937" />
        <path d="M 85 125 C 115 150, 165 195, 195 230 C 210 250, 250 295, 285 340 L 315 325 C 285 275, 235 220, 200 185 C 165 150, 125 115, 95 100 Z" fill="#e8a67c" stroke="#a86a44" strokeWidth="0.8" />
      </g>

      <g transform={`scale(${pressScale})`} style={{ transformOrigin: '0 0' }}>
        <path d="M 0 0 L 7 3 L 4 7 Z" fill="#1e293b" />
        <path d="M 4 7 L 7 3 L 18 12 L 13 18 Z" fill="url(#pWood)" stroke="#92400e" strokeWidth="0.6" />
        <path d="M 13 18 L 18 12 L 115 109 L 110 114 Z" fill="url(#pShaft)" stroke="#854d0e" strokeWidth="0.7" />
        <line x1="15" y1="15" x2="112" y2="112" stroke="#fde047" strokeWidth="0.8" opacity="0.7" />
        <path d="M 105 102 L 109 98 L 115 104 L 111 108 Z" fill="#e5e7eb" stroke="#6b7280" strokeWidth="0.5" />
        <path d="M 111 108 L 115 104 L 122 111 L 118 115 Z" fill="#f87171" />
      </g>

      <g>
        <path d="M 52 58 C 48 62, 44 72, 46 84 C 48 96, 58 108, 72 118 C 86 128, 102 135, 118 142 L 145 125 C 130 115, 110 105, 92 92 C 74 79, 60 66, 52 58 Z" fill="url(#pSkinBase)" stroke="#a86a44" strokeWidth="1" />
        <path d="M 58 98 C 48 106, 44 118, 50 128 C 56 138, 70 138, 82 130 L 108 108 C 105 100, 96 92, 86 90 C 76 88, 64 90, 58 98 Z" fill="url(#pSkinBase)" stroke="#a86a44" strokeWidth="0.9" />
        <path d="M 32 38 C 26 42, 22 52, 26 62 C 30 72, 42 74, 54 68 L 78 88 C 84 84, 88 76, 86 68 C 84 60, 76 52, 66 48 C 56 44, 40 40, 32 38 Z" fill="url(#pSkinBase)" stroke="#a86a44" strokeWidth="1" />
        <path d="M 18 48 C 12 54, 10 66, 16 74 C 22 82, 34 84, 44 78 L 58 66 C 56 58, 50 50, 42 46 C 34 42, 24 42, 18 48 Z" fill="url(#pSkinBase)" stroke="#a86a44" strokeWidth="1" />
        <path d="M 14 50 C 10 56, 12 64, 18 68 C 24 72, 32 70, 36 64 C 40 58, 38 50, 32 46 C 26 42, 18 44, 14 50 Z" fill="url(#pNail)" stroke="#a86a44" strokeWidth="0.5" />
      </g>

      <circle cx="0" cy="0" r={pressing ? 1.8 : 1} fill="#1e293b" opacity={pressing ? 0.9 : 0.5} />
    </svg>
  )
}

function ChalkHand({ pressing }: { pressing: boolean }) {
  return (
    <svg width="320" height="380" viewBox="-24 -24 320 380" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id="cSkin" cx="0.35" cy="0.3" r="0.85">
          <stop offset="0%" stopColor="#ffddc2" />
          <stop offset="55%" stopColor="#e8a67c" />
          <stop offset="100%" stopColor="#a85a32" />
        </radialGradient>
        <filter id="cShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="8" dy="14" stdDeviation="10" floodColor="black" floodOpacity="0.3" />
        </filter>
        <linearGradient id="chalkGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
      </defs>

      <ellipse cx="1" cy="2" rx="14" ry="5" fill="black" opacity={pressing ? 0.3 : 0.15} />

      <g filter="url(#cShadow)">
        <path d="M 165 195 C 190 225, 240 285, 295 355 L 260 365 C 215 300, 175 250, 150 220 Z" fill="#1f2937" />
        <path d="M 85 125 C 115 150, 165 195, 195 230 C 210 250, 250 295, 285 340 L 315 325 C 285 275, 235 220, 200 185 C 165 150, 125 115, 95 100 Z" fill="#e8a67c" stroke="#a86a44" strokeWidth="0.8" />
      </g>

      {/* Chalk stick */}
      <g>
        <path d="M 0 0 C 1 -2, 6 -1, 8 2 L 42 36 L 34 44 L 2 8 Z" fill="url(#chalkGrad)" stroke="#94a3b8" strokeWidth="0.8" />
        <path d="M 0 0 C 2 1, 4 2, 6 3" stroke="white" strokeWidth="0.8" opacity="0.8" />
        {/* Chalk dust */}
        {pressing && (
          <>
            <circle cx="0" cy="0" r="3" fill="white" opacity="0.3" />
            <circle cx="-2" cy="1" r="1.5" fill="white" opacity="0.2" />
            <circle cx="1" cy="-1" r="1" fill="white" opacity="0.25" />
          </>
        )}
      </g>

      <g>
        <path d="M 52 58 C 48 62, 44 72, 46 84 C 48 96, 58 108, 72 118 C 86 128, 102 135, 118 142 L 145 125 C 130 115, 110 105, 92 92 C 74 79, 60 66, 52 58 Z" fill="url(#cSkin)" stroke="#a86a44" strokeWidth="1" />
        <path d="M 32 38 C 26 42, 22 52, 26 62 C 30 72, 42 74, 54 68 L 78 88 C 84 84, 88 76, 86 68 C 84 60, 76 52, 66 48 C 56 44, 40 40, 32 38 Z" fill="url(#cSkin)" stroke="#a86a44" strokeWidth="1" />
        <path d="M 18 48 C 12 54, 10 66, 16 74 C 22 82, 34 84, 44 78 L 58 66 C 56 58, 50 50, 42 46 C 34 42, 24 42, 18 48 Z" fill="url(#cSkin)" stroke="#a86a44" strokeWidth="1" />
      </g>
    </svg>
  )
}

function EraserHand({ pressing }: { pressing: boolean }) {
  return (
    <svg width="340" height="380" viewBox="-60 -40 340 380" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id="eSkin" cx="0.35" cy="0.3" r="0.85">
          <stop offset="0%" stopColor="#ffddc2" />
          <stop offset="55%" stopColor="#e8a67c" />
          <stop offset="100%" stopColor="#a85a32" />
        </radialGradient>
        <linearGradient id="eraserTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="eraserFelt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
        <filter id="eShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="8" dy="14" stdDeviation="10" floodColor="black" floodOpacity="0.32" />
        </filter>
      </defs>

      <ellipse cx="0" cy="4" rx="45" ry="12" fill="black" opacity={pressing ? 0.28 : 0.16} />

      <g filter="url(#eShadow)">
        {/* Forearm */}
        <path d="M 40 55 C 70 90, 130 160, 175 220 L 210 200 C 170 145, 110 85, 75 50 Z" fill="#e8a67c" stroke="#a86a44" strokeWidth="0.8" />
        {/* Hand gripping eraser from top */}
        <path d="M -25 10 C -32 24, -22 42, -8 48 C 8 54, 28 48, 36 36 L 68 60 C 74 56, 80 48, 74 40 C 60 28, 40 12, 20 6 C 8 2, -18 0, -25 10 Z" fill="url(#eSkin)" stroke="#a86a44" strokeWidth="1" />
      </g>

      {/* Eraser */}
      <g transform={`translate(0, ${pressing ? 2 : 0})`}>
        {/* Felt bottom */}
        <rect x="-42" y="-14" width="84" height="30" rx="7" fill="url(#eraserFelt)" stroke="#0f172a" strokeWidth="1.5" />
        <rect x="-40" y="-12" width="80" height="10" rx="3" fill="#64748b" />
        {/* Chalk dust on felt */}
        <g opacity="0.3">
          <circle cx="-20" cy="-2" r="1.5" fill="white" />
          <circle cx="5" cy="0" r="1" fill="white" />
          <circle cx="22" cy="-3" r="1.2" fill="white" />
        </g>
        {/* Plastic grip top */}
        <rect x="-38" y="-20" width="76" height="24" rx="9" fill="url(#eraserTop)" stroke="#1e40af" strokeWidth="1.5" />
        <rect x="-30" y="-16" width="60" height="4" rx="2" fill="white" opacity="0.25" />
      </g>
    </svg>
  )
}
