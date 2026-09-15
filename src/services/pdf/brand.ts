/**
 * Brand detection — a light "document identity" pass.
 * Colors: quantized histogram over extracted page images (canvas-based; skipped
 * gracefully in non-DOM environments). Fonts: most frequent families mapped to
 * the closest fonts the platform ships.
 */
import type { BrandSuggestion, PdfImageData } from './types'
import type { FontStat } from './analyze'

/** Map a PDF font family name to the nearest platform font id (lib/fonts). */
export function mapFontFamily(pdfFamily: string): 'tajawal' | 'cairo' | 'readex' | 'noto-kufi' | 'amiri' | 'inter' | 'grotesk' | 'lora' | 'playfair' {
  const f = (pdfFamily || '').toLowerCase()
  if (/(amiri|scheherazade|naskh|traditional)/.test(f)) return 'amiri'
  if (/(cairo|genta|labrada)/.test(f)) return 'cairo'
  if (/(readex|lexend)/.test(f)) return 'readex'
  if (/(kufi|kufam)/.test(f)) return 'noto-kufi'
  if (/(tajawal|tajwal|dubai|almarai)/.test(f)) return 'tajawal'
  if (/(playfair|didot|garamond|bodoni)/.test(f)) return 'playfair'
  if (/(lora|georgia|times|serif|pt serif|noto serif)/.test(f)) return 'lora'
  if (/(grotesk|space|poppins|montserrat|nunito)/.test(f)) return 'grotesk'
  return 'inter'
}

const DEFAULT_BRAND: BrandSuggestion = { primary: '#243B7A', secondary: '#4C6FFF', accent: '#22D3A6', fonts: [] }

/** Extract dominant saturated colors from image data URLs (browser only). */
export async function extractBrand(images: PdfImageData[], stats: FontStat): Promise<BrandSuggestion> {
  const fonts = stats.families.slice(0, 2).map((f) => f.name)
  if (typeof document === 'undefined') return { ...DEFAULT_BRAND, fonts }

  const samples = images.filter((im) => im.dataUrl).slice(0, 12)
  if (!samples.length) return { ...DEFAULT_BRAND, fonts }

  const counts = new Map<string, number>()
  for (const im of samples) {
    try {
      const palette = await quantizeImage(im.dataUrl!)
      for (const hex of palette) counts.set(hex, (counts.get(hex) ?? 0) + 1)
    } catch {
      // undecodable image — skip
    }
  }
  if (!counts.size) return { ...DEFAULT_BRAND, fonts }

  const ranked = [...counts.entries()]
    .map(([hex, n]) => ({ hex, n, ...hslOf(hex) }))
    .filter((c) => c.s > 0.22 && c.l > 0.12 && c.l < 0.85) // saturated, not near-black/white
    .sort((a, b) => b.n * (0.5 + b.s) - a.n * (0.5 + a.s))

  const pick = (minHueDist: number, exclude: number[] = []) => {
    for (const c of ranked) {
      if (exclude.every((h) => hueDist(h, c.h) >= minHueDist)) return c
    }
    return ranked[exclude.length] ?? ranked[0]
  }
  const first = pick(0)
  const second = pick(70, [first.h])
  const third = pick(40, [first.h, second.h])

  return {
    primary: first?.hex ?? DEFAULT_BRAND.primary,
    secondary: second?.hex ?? DEFAULT_BRAND.secondary,
    accent: third?.hex ?? DEFAULT_BRAND.accent,
    fonts,
  }
}

async function quantizeImage(dataUrl: string): Promise<string[]> {
  const img = await loadImage(dataUrl)
  const size = 24
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('no 2d context')
  ctx.drawImage(img, 0, 0, size, size)
  const { data } = ctx.getImageData(0, 0, size, size)

  const buckets = new Map<string, number>()
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]
    if (a < 128) continue
    const key = `${r >> 4}-${g >> 4}-${b >> 4}`
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }
  return [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([key]) => {
      const [r, g, b] = key.split('-').map((v) => (Number(v) << 4) + 8)
      return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
    })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image load failed'))
    img.src = src
  })
}

function hslOf(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  let h = 0
  if (d !== 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6)
    else if (max === g) h = 60 * ((b - r) / d + 2)
    else h = 60 * ((r - g) / d + 4)
  }
  if (h < 0) h += 360
  return { h, s, l }
}

function hueDist(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}
