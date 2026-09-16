/**
 * Icon element support, powered by `lucide` (ISC licence, https://lucide.dev).
 * We reuse lucide's raw vector node trees rather than the React components so the
 * exact same markup can be rendered in the DOM *and* serialized for PPTX/PNG export.
 *
 * The icon set is a generated static map (see scripts/gen-icon-set.mjs), not a namespace
 * import: `import * as lucide` forces the bundler to keep all 1861 icons (~453 kB raw),
 * because it cannot tell which ones a dynamic `lucide[key]` lookup will touch.
 */
import { ICON_NODES, type IconNode } from './iconSet'
export { ICON_CATEGORIES, ALL_ICONS } from './iconCatalog'

const cache = new Map<string, IconNode | null>()

export function iconNode(name: string): IconNode | null {
  if (!name) return null
  if (cache.has(name)) return cache.get(name) ?? null
  const node = ICON_NODES[name] ?? null
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
