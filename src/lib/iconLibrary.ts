/**
 * Icon element support, powered by `lucide` (ISC licence, https://lucide.dev).
 * We reuse lucide's raw vector node trees rather than the React components so the
 * exact same markup can be rendered in the DOM *and* serialized for PPTX/PNG export.
 */
import * as lucide from 'lucide'

type IconNode = [tag: string, attrs: Record<string, string | number>][]

const cache = new Map<string, IconNode | null>()

export function iconNode(name: string): IconNode | null {
  if (cache.has(name)) return cache.get(name) ?? null
  const key = name
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join('')
  const raw = (lucide as unknown as Record<string, unknown>)[key] ?? (lucide as unknown as Record<string, unknown>)[name]
  const node = Array.isArray(raw) ? (raw as IconNode) : null
  cache.set(name, node)
  return node
}

export interface IconSvgOptions {
  color?: string
  strokeWidth?: number
  size?: number
  fill?: string
}

/** Deterministic, self-contained SVG markup for an icon (used for DOM + export). */
export function iconSvg(name: string, opts: IconSvgOptions = {}): string {
  const node = iconNode(name)
  const size = opts.size ?? 24
  if (!node) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}"><rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="${opts.color ?? 'currentColor'}" stroke-width="${opts.strokeWidth ?? 2}"/></svg>`
  }
  const body = node
    .map(([tag, attrs]) => {
      const rest = Object.entries(attrs)
        .map(([k, v]) => `${k}="${String(v).replace(/"/g, '&quot;')}"`)
        .join(' ')
      return `<${tag} ${rest}/>`
    })
    .join('')
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="${opts.fill ?? 'none'}" stroke="${opts.color ?? 'currentColor'}" stroke-width="${opts.strokeWidth ?? 2}" stroke-linecap="round" stroke-linejoin="round">`,
    body,
    '</svg>',
  ].join('')
}

export interface IconCategory {
  id: string
  label: string
  icons: string[]
}

export const ICON_CATEGORIES: IconCategory[] = [
  {
    id: 'ui',
    label: 'واجهة',
    icons: ['search', 'settings', 'bell', 'star', 'heart', 'check-circle', 'x-circle', 'alert-triangle', 'info', 'menu', 'grid-2x2', 'layers', 'eye', 'lock', 'trash-2', 'download', 'upload', 'share-2', 'link', 'clock'],
  },
  {
    id: 'business',
    label: 'أعمال',
    icons: ['briefcase', 'target', 'trending-up', 'trending-down', 'bar-chart-3', 'pie-chart', 'line-chart', 'wallet', 'credit-card', 'receipt', 'users', 'user', 'building-2', 'handshake', 'lightbulb', 'rocket', 'flag', 'award', 'percent', 'globe'],
  },
  {
    id: 'tech',
    label: 'تقنية',
    icons: ['cpu', 'database', 'server', 'cloud', 'code-2', 'terminal', 'wifi', 'smartphone', 'monitor', 'battery-charging', 'git-branch', 'bug', 'shield-check', 'fingerprint', 'cpu-cog', 'cpu'],
  },
  {
    id: 'education',
    label: 'تعليم',
    icons: ['book-open', 'graduation-cap', 'backpack', 'pencil', 'notebook-pen', 'clipboard-list', 'school', 'library', 'pen-line', 'highlighter', 'ruler', 'compass'],
  },
  {
    id: 'marketing',
    label: 'تسويق',
    icons: ['megaphone', 'mail', 'send', 'message-circle', 'at-sign', 'thumbs-up', 'shopping-cart', 'shopping-bag', 'store', 'campaign', 'badge-percent', 'sparkles', 'wand-sparkles', 'video', 'camera', 'image'],
  },
  {
    id: 'science',
    label: 'علوم',
    icons: ['flask-conical', 'atom', 'microscope', 'dna', 'brain', 'activity', 'heart-pulse', 'test-tubes', 'orbit', 'telescope', 'moon-star', 'sun'],
  },
  {
    id: 'arrows',
    label: 'أسهم وتدفق',
    icons: ['arrow-right', 'arrow-left', 'arrow-up', 'arrow-down', 'chevron-right', 'chevron-down', 'move-right', 'corner-down-right', 'arrow-right-left', 'git-commit-horizontal', 'play', 'pause', 'plus', 'minus'],
  },
  {
    id: 'nature',
    label: 'بيئة ومدينة',
    icons: ['leaf', 'trees', 'droplet', 'snowflake', 'wind', 'mountain', 'building', 'factory', 'car', 'plane', 'train-front', 'bike', 'house', 'tractor', 'wheat'],
  },
  {
    id: 'finance',
    label: 'مال',
    icons: ['dollar-sign', 'euro', 'banknote', 'coins', 'piggy-bank', 'chart-pie', 'chart-column-increasing', 'chart-no-axes-combined', 'circle-dollar-sign', 'landmark', 'scale', 'calculator'],
  },
  {
    id: 'health',
    label: 'صحة',
    icons: ['heart', 'stethoscope', 'pill', 'syringe', 'apple', 'utensils', 'dumbbell', 'baby', 'smile', 'accessibility'],
  },
]

export const ALL_ICONS = Array.from(new Set(ICON_CATEGORIES.flatMap((c) => c.icons)))

export function isValidIcon(name: string): boolean {
  return iconNode(name) !== null
}

/** Rasterize icon SVG → data URL for PPTX (PowerPoint cannot embed raw SVG reliably). */
export async function iconSvgToPngDataUrl(markup: string, px = 256): Promise<string | null> {
  try {
    const blob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.decoding = 'sync'
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('icon render failed'))
      img.src = url
    })
    const ratio = img.width / img.height || 1
    const w = ratio >= 1 ? px : Math.round(px * ratio)
    const h = ratio >= 1 ? Math.round(px / ratio) : px
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(img, 0, 0, w, h)
    URL.revokeObjectURL(url)
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}
