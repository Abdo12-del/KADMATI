import type { Background, GradientStop, Paint, Shadow, Stroke } from '../document/types'

export interface Rgb {
  r: number
  g: number
  b: number
  a: number
}

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i

export function normalizeHex(input: string): string {
  const m = HEX_RE.exec(input.trim())
  if (!m) return input.trim()
  let hex = m[1]
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('')
  return `#${hex.slice(0, 6).toLowerCase()}`
}

export function parseColor(input: string | undefined): Rgb | null {
  if (!input) return null
  const s = input.trim()
  if (s === 'transparent' || s === 'none') return { r: 0, g: 0, b: 0, a: 0 }
  const hex = HEX_RE.exec(s)
  if (hex) {
    let h = hex[1]
    if (h.length === 3) h = h.split('').map((c) => c + c).join('')
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1
    return { r, g, b, a }
  }
  const rgb = /rgba?\(([^)]+)\)/i.exec(s)
  if (rgb) {
    const parts = rgb[1].split(/[,/\s]+/).filter(Boolean).map((p) => (p.endsWith('%') ? (parseFloat(p) / 100) * 255 : parseFloat(p)))
    return { r: parts[0] || 0, g: parts[1] || 0, b: parts[2] || 0, a: parts.length > 3 ? parts[3] / (parts[3] > 1 ? 255 : 1) : 1 }
  }
  return null
}

export function toHex(input: string | undefined, fallback = '#000000'): string {
  const c = parseColor(input)
  if (!c) return fallback
  const h = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0')
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`
}

export function withAlpha(input: string | undefined, alpha: number): string {
  const c = parseColor(input) ?? { r: 0, g: 0, b: 0, a: 1 }
  return `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${Math.round(alpha * 100) / 100})`
}

export function relLuminance(input: string): number {
  const c = parseColor(input) ?? { r: 0, g: 0, b: 0, a: 1 }
  const ch = [c.r, c.g, c.b].map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]
}

export function contrastRatio(a: string, b: string): number {
  const la = relLuminance(a)
  const lb = relLuminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

export function isLight(color: string): boolean {
  return relLuminance(color) > 0.45
}

export function readableOn(background: string, dark = '#111114', light = '#ffffff'): string {
  return isLight(background) ? dark : light
}

export function mix(a: string, b: string, amount: number): string {
  const ca = parseColor(a) ?? { r: 0, g: 0, b: 0, a: 1 }
  const cb = parseColor(b) ?? { r: 255, g: 255, b: 255, a: 1 }
  const t = Math.max(0, Math.min(1, amount))
  const h = (n: number) => Math.round(n).toString(16).padStart(2, '0')
  return `#${h(ca.r + (cb.r - ca.r) * t)}${h(ca.g + (cb.g - ca.g) * t)}${h(ca.b + (cb.b - ca.b) * t)}`
}

export function shade(color: string, amount: number): string {
  return mix(color, amount > 0 ? '#ffffff' : '#000000', Math.abs(amount))
}

export function hueRotate(color: string, deg: number): string {
  const c = parseColor(color) ?? { r: 0, g: 0, b: 0, a: 1 }
  const hsl = rgbToHsl(c.r, c.g, c.b)
  return hslToHex((hsl.h + deg + 360) % 360, hsl.s, hsl.l)
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
  else if (max === gn) h = ((bn - rn) / d + 2) / 6
  else h = ((rn - gn) / d + 4) / 6
  return { h: h * 360, s, l }
}

export function hslToHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360 / 360
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const conv = (t: number) => {
    let tt = t
    if (tt < 0) tt += 1
    if (tt > 1) tt -= 1
    if (tt < 1 / 6) return p + (q - p) * 6 * tt
    if (tt < 1 / 2) return q
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
    return p
  }
  const h2 = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0')
  return `#${h2(conv(hue + 1 / 3))}${h2(conv(hue))}${h2(conv(hue - 1 / 3))}`
}

/* --------------------------------------------------------------- CSS output */

export function paintToCss(paint: Paint | undefined): string {
  if (!paint || paint.type === 'none') return 'transparent'
  if (paint.type === 'solid') return paint.color
  if (paint.type === 'pattern') return patternCss(paint.pattern, paint.color, paint.background)
  const stops = paint.stops.map((s) => `${s.color} ${s.pos}%`).join(', ')
  return paint.kind === 'radial' ? `radial-gradient(circle at 50% 50%, ${stops})` : `linear-gradient(${paint.angle}deg, ${stops})`
}

export function patternCss(pattern: string, color: string, background: string): string {
  const c = withAlpha(color, 0.35)
  switch (pattern) {
    case 'dots':
      return `radial-gradient(${c} 1.5px, transparent 1.6px) 0 0 / 14px 14px, ${background}`
    case 'grid':
      return `linear-gradient(${c} 1px, transparent 1px) 0 0 / 26px 26px, linear-gradient(90deg, ${c} 1px, transparent 1px) 0 0 / 26px 26px, ${background}`
    case 'cross':
      return `repeating-linear-gradient(45deg, ${c} 0 1px, transparent 1px 9px), ${background}`
    default:
      return `repeating-linear-gradient(135deg, ${c} 0 2px, transparent 2px 10px), ${background}`
  }
}

export function backgroundToCss(bg: Background | undefined): string {
  if (!bg || bg.type === 'none') return 'transparent'
  if (bg.type === 'solid') return bg.color ?? 'transparent'
  if (bg.type === 'gradient' && bg.gradient) {
    const stops = bg.gradient.stops.map((s) => `${s.color} ${s.pos}%`).join(', ')
    return bg.gradient.kind === 'radial' ? `radial-gradient(120% 120% at 50% 40%, ${stops})` : `linear-gradient(${bg.gradient.angle}deg, ${stops})`
  }
  if (bg.type === 'pattern') return patternCss(bg.pattern ?? 'diagonal', bg.patternColor ?? '#ffffff', bg.color ?? '#111114')
  if (bg.type === 'image') return bg.color ?? 'transparent'
  return 'transparent'
}

export function gradientStopsCss(stops: GradientStop[], angle = 90): string {
  return `linear-gradient(${angle}deg, ${stops.map((s) => `${s.color} ${s.pos}%`).join(', ')})`
}

export function strokeCss(stroke: Stroke | undefined): string {
  if (!stroke || !stroke.width) return 'none'
  const dash = stroke.dash === 'dashed' ? `${stroke.width * 3}px ${stroke.width * 2}px` : stroke.dash === 'dotted' ? `0.1px ${stroke.width * 2}px` : 'none'
  return `${stroke.width}px ${stroke.dash === 'solid' || !stroke.dash ? 'solid' : dash} ${stroke.color}`
}

export function shadowCss(shadow: Shadow | undefined): string {
  if (!shadow) return 'none'
  return `${shadow.x}px ${shadow.y}px ${shadow.blur}px ${shadow.spread}px ${shadow.color}`
}

/** PowerPoint / OOXML wants `RRGGBB` without the hash. */
export function toOoxmlColor(color: string | undefined, fallback = '000000'): string {
  const hex = toHex(color, `#${fallback}`)
  return hex.replace('#', '').toUpperCase()
}
