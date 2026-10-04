import JSZip from 'jszip'
import { createPresentation, normalizePresentation, newId } from '../document/factory'
import { ELEMENT_KINDS, DOC_VERSION, type Presentation } from '../document/types'
import { safeHref, sanitizeHtml } from '../document/text'
import { sanitizeSvg } from '../lib/svg'
import { requestOpenProject } from './openDeck'
import { OPENSLIDE_ASSET_MANIFEST_PATH, OPENSLIDE_DOCUMENT_PATH } from './openSlideFormat'
import { toast } from '../store/useUI'

const MAX_ARCHIVE_BYTES = 120 * 1024 * 1024
const MAX_DOCUMENT_BYTES = 48 * 1024 * 1024
const MAX_TOTAL_MEDIA_BYTES = 90 * 1024 * 1024
const MAX_SLIDES = 500
const MAX_ELEMENTS_PER_SLIDE = 1200

interface ImportProgress {
  (label: string, done: number, total: number): void
}

interface SidecarManifest {
  version: number
  assets?: Record<string, string>
  media?: Record<string, string>
}

/**
 * Import an Aurova JSON file or an Open Slide ZIP exported by Aurova.
 * Arbitrary TSX is intentionally never evaluated or reverse-parsed in the browser.
 */
export async function importAurovaFile(file: File, onProgress?: ImportProgress): Promise<Presentation> {
  try {
    if (file.size > MAX_ARCHIVE_BYTES) throw new Error('حجم الملف أكبر من الحد الآمن للاستيراد (120 ميغابايت).')
    onProgress?.('قراءة الملف', 0, 3)

    const isZip = /\.zip$/i.test(file.name)
    let raw: unknown
    let source = 'aurova-json'

    if (isZip) {
      const zip = await JSZip.loadAsync(await file.arrayBuffer())
      const documentFile = zip.file(OPENSLIDE_DOCUMENT_PATH)
      if (!documentFile) {
        throw new Error('هذا ZIP لا يحتوي مستند Aurova الجانبي. صدّر المشروع من Aurova أو صدّره من Open Slide إلى PPTX ثم استورده.')
      }
      const size = uncompressedSize(documentFile)
      if (size !== null && size > MAX_DOCUMENT_BYTES) throw new Error('مستند المشروع داخل ZIP أكبر من الحد الآمن.')
      const json = await documentFile.async('string')
      if (json.length > MAX_DOCUMENT_BYTES) throw new Error('مستند المشروع داخل ZIP أكبر من الحد الآمن.')
      raw = parseJson(json)
      onProgress?.('استعادة الوسائط', 1, 3)
      raw = await restoreZipAssets(zip, raw)
      source = 'open-slide-zip'
    } else {
      if (!/\.(?:aurova\.)?json$/i.test(file.name)) {
        throw new Error('اختر ملف .aurova.json أو ZIP لمشروع Open Slide صادر من Aurova، أو ملف PowerPoint (.pptx).')
      }
      const json = await file.text()
      if (new TextEncoder().encode(json).byteLength > MAX_DOCUMENT_BYTES) throw new Error('ملف JSON أكبر من الحد الآمن للاستيراد.')
      raw = parseJson(json)
      onProgress?.('فحص المستند', 1, 3)
    }

    const doc = normalizeImportedDocument(raw)
    onProgress?.('فتح العرض', 2, 3)
    requestOpenProject({ doc })
    const elementCount = doc.slides.reduce((sum, slide) => sum + slide.elements.length, 0)
    const importedAssets = Object.keys(doc.assets).length
    toast({
      kind: 'success',
      title: `تم استيراد ${doc.slides.length} شريحة`,
      body: source === 'open-slide-zip'
        ? `${elementCount} عنصرًا و${importedAssets} وسيطًا — المشروع قابل للفتح في Aurova وOpen Slide.`
        : `${elementCount} عنصرًا و${importedAssets} وسيطًا — كل العناصر قابلة للتحرير.`,
    })
    onProgress?.('تم', 3, 3)
    return doc
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    toast({ kind: 'error', title: 'تعذّر استيراد المشروع', body: /zip|central directory|corrupt/i.test(message) ? 'الملف ليس ZIP أو JSON صالحًا.' : message })
    throw error
  }
}

async function restoreZipAssets(zip: JSZip, payload: unknown): Promise<unknown> {
  if (!isRecord(payload)) throw new Error('مستند المشروع غير صالح.')
  const manifestFile = zip.file(OPENSLIDE_ASSET_MANIFEST_PATH)
  const manifest = manifestFile ? parseJson(await manifestFile.async('string')) as SidecarManifest : null
  if (manifest && manifest.version !== 1) throw new Error('نسخة بيان الوسائط غير مدعومة.')
  const assets = payload.assets
  const slides = payload.slides
  if (!isRecord(assets) || !Array.isArray(slides)) throw new Error('مستند المشروع لا يحتوي الشرائح أو الوسائط المطلوبة.')

  let restoredBytes = 0
  const readAsset = async (path: string, mime: string): Promise<{ src: string; bytes: number }> => {
    const safePath = safeArchivePath(path)
    const entry = zip.file(safePath)
    if (!entry) throw new Error(`ملف وسيط مفقود من المشروع: ${safePath}`)
    const declaredSize = uncompressedSize(entry)
    if (declaredSize !== null && declaredSize > MAX_TOTAL_MEDIA_BYTES - restoredBytes) throw new Error('مجموع الوسائط أكبر من الحد الآمن للاستيراد.')
    const bytes = await entry.async('uint8array')
    restoredBytes += bytes.byteLength
    if (restoredBytes > MAX_TOTAL_MEDIA_BYTES) throw new Error('مجموع الوسائط أكبر من الحد الآمن للاستيراد.')
    return { src: bytesToDataUrl(bytes, mime || mimeFromPath(safePath)), bytes: bytes.byteLength }
  }

  for (const [assetId, value] of Object.entries(assets)) {
    if (!isRecord(value)) continue
    const src = String(value.src ?? '')
    if (!src.startsWith('asset://')) continue
    const path = manifest?.assets?.[assetId]
    if (!path) throw new Error(`تعذّر العثور على ملف الوسيط ${assetId} في بيان المشروع.`)
    const restored = await readAsset(path, String(value.mime ?? ''))
    value.src = restored.src
    value.bytes = restored.bytes
  }

  const mediaManifest = manifest?.media ?? {}
  for (const slide of slides) {
    if (!isRecord(slide) || !Array.isArray(slide.elements)) continue
    for (const element of slide.elements) {
      if (!isRecord(element) || element.kind !== 'video') continue
      const src = String(element.src ?? '')
      if (!src.startsWith('asset://media/')) continue
      const elementId = String(element.id ?? '')
      const path = mediaManifest[elementId]
      if (!path) throw new Error(`تعذّر العثور على ملف فيديو ${elementId} في بيان المشروع.`)
      element.src = (await readAsset(path, mimeFromPath(path))).src
    }
  }

  return payload
}

function normalizeImportedDocument(payload: unknown): Presentation {
  if (!isRecord(payload)) throw new Error('ملف JSON لا يحتوي مستند Aurova صالحًا.')
  if (Number(payload.version) > DOC_VERSION) throw new Error(`نسخة المستند ${payload.version} أحدث من هذا الإصدار من Aurova.`)
  if (!isRecord(payload.metadata) || typeof payload.metadata.title !== 'string') throw new Error('بيانات العرض غير مكتملة (العنوان مفقود).')
  if (!Array.isArray(payload.slides) || payload.slides.length === 0 || payload.slides.length > MAX_SLIDES) throw new Error(`عدد الشرائح غير صالح (الحد الأقصى ${MAX_SLIDES}).`)
  if (!isRecord(payload.theme) || !isRecord(payload.theme.palette) || !isRecord(payload.theme.fonts)) throw new Error('السمة أو لوحة الألوان غير مكتملة.')
  if (!isRecord(payload.assets)) throw new Error('قائمة الوسائط غير صالحة.')
  if (Object.keys(payload.assets).length > 2000) throw new Error('عدد الوسائط كبير جدًا.')

  for (const [index, slide] of payload.slides.entries()) {
    if (!isRecord(slide) || !Array.isArray(slide.elements) || slide.elements.length > MAX_ELEMENTS_PER_SLIDE) {
      throw new Error(`محتوى الشريحة ${index + 1} غير صالح.`)
    }
    for (const [elementIndex, element] of slide.elements.entries()) {
      if (!isRecord(element) || !ELEMENT_KINDS.includes(element.kind as never) || typeof element.id !== 'string') {
        throw new Error(`العنصر ${elementIndex + 1} في الشريحة ${index + 1} غير صالح.`)
      }
      for (const key of ['x', 'y', 'w', 'h']) {
        if (!Number.isFinite(Number(element[key]))) throw new Error(`مقاس العنصر ${element.id} غير صالح.`)
      }
    }
  }

  const title = payload.metadata.title.trim() || 'عرض مستورد'
  const fallback = createPresentation({ title })
  const baseTheme = fallback.theme
  const incomingTheme = payload.theme
  const theme = {
    ...baseTheme,
    ...incomingTheme,
    palette: { ...baseTheme.palette, ...incomingTheme.palette },
    fonts: { ...baseTheme.fonts, ...incomingTheme.fonts },
  }
  const metadata = {
    ...fallback.metadata,
    ...payload.metadata,
    title,
    tags: Array.isArray(payload.metadata.tags) ? payload.metadata.tags.filter((tag: unknown) => typeof tag === 'string').slice(0, 100) : [],
    dir: payload.metadata.dir === 'ltr' ? 'ltr' : 'rtl',
    lang: payload.metadata.lang === 'en' || payload.metadata.lang === 'fr' ? payload.metadata.lang : 'ar',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    trashedAt: null,
    folderId: undefined,
    favorite: false,
  }
  const safeSize = isRecord(payload.size)
    ? { w: clamp(Number(payload.size.w), 240, 10000), h: clamp(Number(payload.size.h), 135, 10000) }
    : fallback.size

  const normalized = normalizePresentation({
    ...fallback,
    ...payload,
    id: newId('p'),
    version: DOC_VERSION,
    metadata,
    theme,
    size: safeSize,
    slides: payload.slides as Presentation['slides'],
    assets: payload.assets as Presentation['assets'],
    settings: { ...fallback.settings, ...(isRecord(payload.settings) ? payload.settings : {}) },
  } as Presentation)

  for (const slide of normalized.slides) {
    slide.notes = typeof slide.notes === 'string' ? slide.notes.slice(0, 20000) : ''
    for (const element of slide.elements) {
      if (element.kind === 'text') element.content = sanitizeHtml(element.content)
      if (element.kind === 'shape' && element.text !== undefined) element.text = sanitizeHtml(element.text)
      if (element.kind === 'svg') element.markup = sanitizeSvg(element.markup)
      if (element.link) element.link = safeHref(element.link) ?? undefined
      if (element.kind === 'video') element.src = safeMediaUrl(element.src)
    }
  }
  for (const asset of Object.values(normalized.assets)) asset.src = safeMediaUrl(asset.src)
  return normalized
}

function safeMediaUrl(value: string): string {
  const src = String(value ?? '').trim()
  if (/^(https?:\/\/|data:(?:image|video|audio|font)\/|blob:)/i.test(src)) return src
  if (/^(?:\.\.?\/|\/)[^\s]*$/.test(src) && !src.includes('..\\')) return src
  return ''
}

function safeArchivePath(path: string): string {
  const normalized = String(path ?? '').replace(/\\/g, '/')
  if (!normalized.startsWith('assets/') || normalized.startsWith('/') || normalized.split('/').some((part) => part === '..' || part === '.')) {
    throw new Error('مسار وسيط غير صالح داخل ملف ZIP.')
  }
  return normalized
}

function bytesToDataUrl(bytes: Uint8Array, mime: string): string {
  const chunkSize = 0x8000
  let binary = ''
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize))
  }
  return `data:${mime};base64,${btoa(binary)}`
}

function mimeFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase()
  const types: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', avif: 'image/avif', svg: 'image/svg+xml',
    mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf',
  }
  return types[ext ?? ''] ?? 'application/octet-stream'
}

function uncompressedSize(entry: JSZip.JSZipObject): number | null {
  const size = (entry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize
  return Number.isFinite(size) ? Number(size) : null
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new Error('ملف JSON غير صالح أو تالف.')
  }
}

function isRecord(value: unknown): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, value))
}
