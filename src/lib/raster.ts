/**
 * Raster helpers shared by exporters.
 *
 * PowerPoint cannot embed SVG (reliably), LaTeX or CSS-filtered images, so those go through a
 * canvas in the browser and come out as PNG. Everything degrades to `null` when there is no DOM
 * (tests, future server export) so callers can fall back rather than throw.
 */

const isBrowser = typeof document !== 'undefined' && typeof Image !== 'undefined'

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (!isBrowser) {
      reject(new Error('no-dom'))
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('decode'))
    img.src = src
    // Some environments (jsdom, blocked decoders) never fire load OR error — fail loudly
    // instead of hanging the export forever.
    const timer = setTimeout(() => reject(new Error('decode-timeout')), 4000)
    img.onload = () => { clearTimeout(timer); resolve(img) }
    img.onerror = () => { clearTimeout(timer); reject(new Error('decode')) }
  })
}

/**
 * Rasterize an SVG string to a PNG data URL.
 * `width`/`height` are the target pixel size; the SVG is scaled to fit exactly.
 */
export async function svgToPngDataUrl(
  markup: string,
  width: number,
  height: number,
  opts: { scale?: number; background?: string } = {},
): Promise<string | null> {
  if (!isBrowser) return null
  // No real 2D canvas (jsdom/node without node-canvas) → rasterization is impossible; skip
  // straight to the caller's fallback instead of waiting on an image that never decodes.
  if (!document.createElement('canvas').getContext('2d')) return null
  try {
    const scale = opts.scale ?? 2
    const w = Math.max(2, Math.round(width * scale))
    const h = Math.max(2, Math.round(height * scale))
    const svg = ensureSizing(markup, w, h)
    const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    const img = await loadImage(url)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    if (opts.background) {
      ctx.fillStyle = opts.background
      ctx.fillRect(0, 0, w, h)
    }
    ctx.drawImage(img, 0, 0, w, h)
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}

/** Give the SVG explicit pixel dimensions so browsers rasterize it at the size we asked for. */
function ensureSizing(markup: string, w: number, h: number): string {
  let out = markup.trim()
  if (!/^<svg/i.test(out)) out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${out}</svg>`
  out = out.replace(/\swidth="[^"]*"/i, '').replace(/\sheight="[^"]*"/i, '')
  out = out.replace(
    /<svg/i,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"`,
  )
  if (!/viewBox/i.test(out)) {
    out = out.replace(/<svg[^>]*>/i, (m) => `${m.replace(/>$/, '')} viewBox="0 0 ${w} ${h}">`)
  }
  return out
}

/**
 * Normalize any image reference into a `data:<mime>;base64,` URL that PptxGenJS accepts.
 * Returns `null` for references it can never embed (e.g. `blob:` object URLs).
 */
export async function toEmbeddableImageData(src: string): Promise<string | null> {
  if (!src) return null
  if (src.startsWith('data:')) return src
  if (src.startsWith('blob:')) {
    if (!isBrowser) return null
    try {
      const blob = await (await fetch(src)).blob()
      return await blobToDataUrl(blob)
    } catch {
      return null
    }
  }
  if (/^https?:/i.test(src)) {
    if (!isBrowser) return src
    try {
      const blob = await (await fetch(src, { mode: 'cors' })).blob()
      return await blobToDataUrl(blob)
    } catch {
      // Remote URLs are legal in PPTX as external relationships — hand the URL over instead.
      return null
    }
  }
  // Bare base64
  return `data:image/png;base64,${src}`
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('read-failed'))
    reader.readAsDataURL(blob)
  })
}

/** `data:image/jpeg;base64,xxx` → `image/jpeg;base64,xxx` (the form `addMedia` wants). */
export function toMediaDataValue(dataUrl: string, fallbackMime = 'video/mp4'): string | null {
  if (!dataUrl) return null
  if (dataUrl.startsWith('data:')) return dataUrl.slice('data:'.length)
  if (/^(video|audio|image)\//.test(dataUrl)) return dataUrl
  if (/^https?:/i.test(dataUrl)) return null
  return `${fallbackMime};base64,${dataUrl}`
}
