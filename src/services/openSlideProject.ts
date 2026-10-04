import JSZip from 'jszip'
import runtimeSource from './openSlideRuntime.tsx?raw'
import { shapePath, maskToClipPath } from '../document/shapes'
import { sanitizeHtml, safeHref } from '../document/text'
import { iconSvg } from '../lib/iconLibrary'
import { sanitizeSvg } from '../lib/svg'
import { toHex } from '../lib/colors'
import { fileNameSafe } from '../lib/cn'
import type { Presentation } from '../document/types'
import { OPENSLIDE_ASSET_MANIFEST_PATH, OPENSLIDE_DOCUMENT_PATH, OPENSLIDE_HINTS_PATH } from './openSlideFormat'

export interface OpenSlideExportResult {
  blob: Blob
  fileName: string
  projectId: string
  slides: number
  assets: number
  warnings: string[]
}

type AssetFile = { path: string; bytes: Uint8Array }
type AssetManifest = { version: 1; assets: Record<string, string>; media: Record<string, string> }
type RenderHints = {
  version: 1
  paths: Record<string, { d: string; w: number; h: number; strokeOnly?: boolean }>
  icons: Record<string, string>
  masks: Record<string, string>
}

/**
 * Export one Aurova document as a runnable @open-slide/core workspace.
 * The ZIP includes the editable Aurova document as a sidecar, so the bridge works in both
 * directions without evaluating user-provided TSX in this app.
 */
export async function exportOpenSlideProject(
  source: Presentation,
  onProgress?: (percent: number) => void,
): Promise<OpenSlideExportResult> {
  const doc = sanitizeDocument(structuredClone(source))
  const projectId = openSlideId(doc.metadata.title, doc.id)
  const warnings: string[] = []
  const zip = new JSZip()
  const manifest: AssetManifest = { version: 1, assets: {}, media: {} }
  const hints: RenderHints = { version: 1, paths: {}, icons: {}, masks: {} }
  const assetFiles: AssetFile[] = []
  const assetVariables: string[] = []
  const assetEntries: [string, string][] = []
  const mediaEntries: [string, string][] = []
  const sourceFileMap = new Map<string, { path: string; variable: string }>()
  let mediaIndex = 0

  const packageSource = (src: string, mime: string, key: string, group: 'assets' | 'media'): string | null => {
    if (!src.startsWith('data:')) return null
    const parsed = decodeDataUrl(src)
    if (!parsed) {
      warnings.push(`تعذّر تضمين وسيط غير صالح (${key}).`)
      return ''
    }
    const resolvedMime = parsed.mime || mime || 'application/octet-stream'
    if (!/^(image|video|audio|font)\//i.test(resolvedMime)) {
      warnings.push(`تُرك وسيط بنوع غير مدعوم: ${key} (${resolvedMime}).`)
      return ''
    }
    if (resolvedMime.toLowerCase() === 'image/svg+xml') {
      const text = new TextDecoder().decode(parsed.bytes)
      parsed.bytes = new TextEncoder().encode(sanitizeSvg(text))
    }
    const cached = sourceFileMap.get(src)
    if (cached) {
      if (group === 'assets') assetEntries.push([key, cached.variable])
      else mediaEntries.push([key, cached.variable])
      return cached.path
    }
    const fileName = `${group === 'assets' ? 'asset' : 'media'}-${String(mediaIndex++).padStart(3, '0')}-${safePart(key)}.${extensionForMime(resolvedMime)}`
    const path = `assets/${fileName}`
    const variable = `media_${assetVariables.length}`
    assetFiles.push({ path, bytes: parsed.bytes })
    assetVariables.push(`import ${variable} from '../${path}';`)
    sourceFileMap.set(src, { path, variable })
    if (group === 'assets') assetEntries.push([key, variable])
    else mediaEntries.push([key, variable])
    return path
  }

  for (const [assetId, asset] of Object.entries(doc.assets ?? {})) {
    const src = String(asset.src ?? '')
    if (src.startsWith('data:')) {
      const path = packageSource(src, asset.mime, assetId, 'assets')
      if (path) {
        manifest.assets[assetId] = path
        asset.src = `asset://${assetId}`
      } else {
        asset.src = ''
      }
    } else if (isExternalMediaUrl(src)) {
      assetEntries.push([assetId, JSON.stringify(src)])
      if (/^https?:/i.test(src)) warnings.push(`الوسيط «${asset.name || assetId}» يعتمد على رابط خارجي.`)
    } else if (src) {
      asset.src = ''
      warnings.push(`لم يُضمَّن وسيط محلي مؤقت «${asset.name || assetId}»؛ أعد رفعه قبل التصدير.`)
    }
  }

  for (const slide of doc.slides) {
    for (const el of slide.elements) {
      if (el.kind === 'video') {
        const src = String(el.src ?? '')
        if (src.startsWith('data:')) {
          const path = packageSource(src, 'video/mp4', el.id, 'media')
          if (path) {
            manifest.media[el.id] = path
            el.src = `asset://media/${el.id}`
          } else {
            el.src = ''
          }
        } else if (src.startsWith('blob:')) {
          el.src = ''
          warnings.push(`الفيديو «${el.name || el.id}» محفوظ كرابط مؤقت ولم يُضمَّن.`)
        } else if (src && !isExternalMediaUrl(src)) {
          el.src = ''
          warnings.push(`تعذّر تضمين مصدر الفيديو «${el.name || el.id}».`)
        }
      }

      if (el.kind === 'shape') {
        const path = shapePath(el.shape, Math.max(1, el.w), Math.max(1, el.h), el.radius, el.adj)
        hints.paths[el.id] = { d: path.d, w: Math.max(1, el.w), h: Math.max(1, el.h), strokeOnly: path.strokeOnly }
      } else if (el.kind === 'icon') {
        hints.icons[el.id] = sanitizeSvg(
          iconSvg(el.icon, {
            color: toHex(el.color, '#111114'),
            strokeWidth: Math.max(0.5, Math.min(8, Number(el.strokeWidth) || 2)),
            size: Math.max(16, Math.min(512, Math.round(Math.min(el.w, el.h)))),
          }),
        )
      } else if (el.kind === 'image' && el.mask) {
        hints.masks[el.id] = maskToClipPath(el.mask.shape, el.mask.inset ?? 0, el.w, el.h)
      }
      if (el.zoom) warnings.push(`رابط الزوم على «${el.name || el.id}» محفوظ في ملف Aurova، لكنه لا ينتقل كسلوك داخل Open Slide.`)
    }
    if ((slide.animations?.length ?? 0) > 0) {
      warnings.push(`حركات العناصر في «${slide.name || slide.id}» لا تنتقل إلى Open Slide؛ انتقال الشريحة وملاحظاتها محفوظان.`)
    }
    if (slide.hidden) warnings.push(`الشريحة المخفية «${slide.name || slide.id}» ستظهر ضمن العرض في Open Slide.`)
    if (slide.transition?.type === 'morph') warnings.push(`تحويل Morph في «${slide.name || slide.id}» سيُعرض كتلاشي في Open Slide.`)
  }

  for (const item of assetFiles) zip.file(item.path, item.bytes, { binary: true, compression: 'STORE' })

  const runtimeDoc = JSON.stringify(doc, null, 2)
  const hintsJson = JSON.stringify(hints, null, 2)
  const manifestJson = JSON.stringify(manifest, null, 2)
  const title = doc.metadata.title || 'عرض أوروفا'
  const safeTitle = fileNameSafe(title)
  const createdAt = new Date(doc.metadata.createdAt || Date.now()).toISOString()

  zip.file('package.json', JSON.stringify({
    name: projectId,
    private: true,
    version: '0.1.0',
    type: 'module',
    description: `${title} — exported from Aurova Studio`,
    scripts: {
      dev: 'open-slide dev --host 0.0.0.0',
      build: 'open-slide build',
      preview: 'open-slide preview --host 0.0.0.0',
    },
    dependencies: {
      '@open-slide/core': '2.0.1',
      react: '^19.2.8',
      'react-dom': '^19.2.8',
    },
    devDependencies: {
      '@types/react': '^19.2.18',
      '@types/react-dom': '^19.2.5',
    },
  }, null, 2))

  zip.file('open-slide.config.ts', `import type { OpenSlideConfig } from '@open-slide/core';\n\nconst config: OpenSlideConfig = {\n  port: 5173,\n  allowedHosts: true,\n};\n\nexport default config;\n`)
  zip.file('tsconfig.json', JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      lib: ['ES2022', 'DOM', 'DOM.Iterable'],
      module: 'ESNext',
      moduleResolution: 'bundler',
      jsx: 'react-jsx',
      resolveJsonModule: true,
      isolatedModules: true,
      moduleDetection: 'force',
      noEmit: true,
      strict: true,
      skipLibCheck: true,
      types: ['@open-slide/core/env'],
    },
    include: ['slides/**/*', 'aurova/**/*.tsx', 'open-slide.config.ts'],
  }, null, 2))
  zip.file('slides/.folders.json', JSON.stringify({ folders: [], assignments: {} }, null, 2))
  zip.file(OPENSLIDE_DOCUMENT_PATH, runtimeDoc)
  zip.file(OPENSLIDE_ASSET_MANIFEST_PATH, manifestJson)
  zip.file(OPENSLIDE_HINTS_PATH, hintsJson)
  zip.file('aurova/export-report.json', JSON.stringify({ version: 1, generatedAt: new Date().toISOString(), warnings: [...new Set(warnings)] }, null, 2))
  zip.file('aurova/renderer.tsx', runtimeSource)
  zip.file('aurova/assets.ts', createAssetImports(assetVariables, assetEntries, mediaEntries))
  zip.file('aurova/theme.css', createThemeCss(doc))
  zip.file(`slides/${projectId}/index.tsx`, createSlideEntry(title, createdAt))
  zip.file('README.md', createReadme(title, projectId))
  zip.file('AGENTS.md', createAgentGuide(projectId))
  zip.file('THIRD_PARTY.md', createThirdPartyNotice())

  const blob = await zip.generateAsync(
    { type: 'blob', mimeType: 'application/zip', compression: 'DEFLATE', compressionOptions: { level: 6 } },
    (metadata) => onProgress?.(metadata.percent),
  )
  return {
    blob,
    fileName: `${safeTitle}-open-slide.zip`,
    projectId,
    slides: doc.slides.length,
    assets: Object.keys(manifest.assets).length + Object.keys(manifest.media).length,
    warnings: [...new Set(warnings)],
  }
}

function sanitizeDocument(doc: Presentation): Presentation {
  for (const slide of doc.slides ?? []) {
    for (const el of slide.elements ?? []) {
      if (el.kind === 'text') el.content = sanitizeHtml(el.content)
      if (el.kind === 'shape' && el.text !== undefined) el.text = sanitizeHtml(el.text)
      if (el.kind === 'svg') el.markup = sanitizeSvg(el.markup)
      if (el.link) el.link = safeHref(el.link) ?? undefined
      if (el.kind === 'table') {
        for (const row of el.cells) for (const cell of row) cell.text = String(cell.text ?? '')
      }
    }
  }
  return doc
}

function createAssetImports(imports: string[], assets: [string, string][], media: [string, string][]): string {
  const assetObject = assets.map(([key, value]) => `  ${JSON.stringify(key)}: ${value},`).join('\n')
  const mediaObject = media.map(([key, value]) => `  ${JSON.stringify(key)}: ${value},`).join('\n')
  return [
    ...imports,
    '',
    'export const assetMap: Record<string, string> = {',
    assetObject,
    '};',
    '',
    'export const mediaMap: Record<string, string> = {',
    mediaObject,
    '};',
    '',
  ].join('\n')
}

function createSlideEntry(title: string, createdAt: string): string {
  return `import type { Page } from '@open-slide/core';
import presentation from '../../aurova/presentation.aurova.json';
import hints from '../../aurova/render-hints.json';
import { assetMap, mediaMap } from '../../aurova/assets';
import { makeAurovaPage } from '../../aurova/renderer';
import '../../aurova/theme.css';

const doc = presentation as unknown as Record<string, any>;
const slides = doc.slides as Record<string, any>[];
const pages: Page[] = slides.map((slide: Record<string, any>) => makeAurovaPage(doc, slide, assetMap, mediaMap, hints));

export const meta = { title: ${JSON.stringify(title)}, createdAt: ${JSON.stringify(createdAt)} };
export const notes: (string | undefined)[] = slides.map((slide: Record<string, any>) => slide.notes || undefined);
export default pages;
`
}

function createThemeCss(doc: Presentation): string {
  const families = new Set<string>([
    'Tajawal:wght@400;500;700;800',
    'IBM+Plex+Sans+Arabic:wght@400;500;600;700',
    'Cairo:wght@400;600;700',
    'Readex+Pro:wght@400;500;600',
    'Noto+Kufi+Arabic:wght@400;600;700',
    'Amiri:wght@400;700',
    'Inter:wght@400;500;600;700',
    'Space+Grotesk:wght@400;500;600;700',
    'Playfair+Display:wght@400;600;700',
    'Lora:wght@400;600',
    'JetBrains+Mono:wght@400;600',
  ])
  for (const value of [doc.theme.fonts.heading, doc.theme.fonts.body, doc.theme.fonts.mono]) {
    if (value && !/^(tajawal|plex-arabic|cairo|readex|noto-kufi|amiri|inter|grotesk|playfair|lora|jetbrains)$/i.test(value)) {
      const family = value.replace(/[^a-zA-Z0-9 ]/g, '').trim()
      if (family) families.add(`${family.replace(/\s+/g, '+')}:wght@400;500;600;700`)
    }
  }
  const href = `https://fonts.googleapis.com/css2?${[...families].map((family) => `family=${family}`).join('&')}&display=swap`
  return [
    '/* Exported Aurova font fallbacks. Fonts load from Google Fonts when online. */',
    `@import url(${JSON.stringify(href)});`,
    '',
    'html, body, #root { width: 100%; height: 100%; margin: 0; }',
    'body { overflow: hidden; }',
    '[data-aurova-slide-id] { box-sizing: border-box; }',
    '[data-aurova-element-id] { box-sizing: border-box; }',
    '',
  ].join('\n')
}

function createReadme(title: string, projectId: string): string {
  return [
    `# ${title} — Open Slide workspace`,
    '',
    'This is a runnable **Open Slide** project exported from Aurova Studio. It turns the Aurova presentation into React pages while keeping the editable Aurova document and media in the `aurova/` folder.',
    '',
    '## Run it',
    '',
    'Requires Node.js 20.19+ (or 22.12+).',
    '',
    '```bash',
    'npm install',
    'npm run dev',
    '```',
    '',
    'Open the URL printed by Open Slide. To build a static site, run `npm run build`; `dist/` can be deployed to a static host.',
    '',
    '## Keep the bridge round-trippable',
    '',
    `- The page entry is ` + '`' + `slides/${projectId}/index.tsx` + '`' + '; Open Slide handles slide navigation, thumbnails, presenter mode, notes, and the agent-oriented React workflow.',
    '- The Aurova document is `aurova/presentation.aurova.json`. Edit this file for text, layout, theme, and element-data changes that should remain editable when re-imported into Aurova.',
    '- Assets are stored under `assets/`; `aurova/assets-manifest.json` maps them back into the document. Do not remove that folder if you plan to re-import.',
    '- To return to Aurova, import this ZIP in **عرض جديد ← استيراد**. Arbitrary hand-written TSX is not executed or reverse-parsed by Aurova; export it from Open Slide to PPTX first if you want an approximate WYSIWYG import.',
    '',
    '## Notes',
    '',
    'Some Aurova-only behaviors (per-element animation timelines, zoom-navigation links, and hidden-slide state) do not have a one-to-one Open Slide equivalent. Their data remains in the Aurova sidecar; the export report identifies these differences.',
    '',
    'This workspace uses the MIT-licensed `@open-slide/core` package; see `THIRD_PARTY.md` and https://github.com/open-slide/open-slide.',
    '',
  ].join('\n')
}

function createAgentGuide(projectId: string): string {
  return [
    `# Agent guide — ${projectId}`,
    '',
    'You are working in an Open Slide workspace exported from Aurova Studio. Use React/TSX and the Open Slide runtime for presentation behavior.',
    '',
    '## Keep the Aurova round-trip intact',
    '',
    '- For edits that should return to Aurova, change `aurova/presentation.aurova.json` (not arbitrary JSX). It is the source document consumed by the generated page. Keep element IDs stable, preserve the RTL/LTR direction, and keep rich-text HTML inside the existing restricted tag set.',
    '- Do not change `aurova/assets-manifest.json` or delete `assets/` unless you also update every matching asset reference.',
    "- `aurova/render-hints.json` contains derived SVG paths for Aurova shapes/icons. If you change a shape's type or geometry, update its hint as well; text, colors, and ordinary position changes need no hint update.",
    '- The Open Slide visual inspector can be used to inspect/comment on the rendered page. For persistent data changes, apply its feedback to the Aurova JSON source.',
    '',
    'If you intentionally replace a page with free-form React, it becomes Open Slide-only content and will not round-trip into Aurova\'s native elements. Keep the source JSON if you still need the original editable deck.',
    '',
  ].join('\n')
}

function createThirdPartyNotice(): string {
  return [
    '# Third-party notices',
    '',
    '- `@open-slide/core` is an external dependency from https://github.com/open-slide/open-slide and is distributed under the MIT License, copyright Yiwei Ho. This ZIP does not vendor or modify the Open Slide source code.',
    '- React and React DOM are external dependencies declared in `package.json`.',
    '- Aurova Studio\'s document, media, and generated renderer are included in this ZIP for local use and round-trip compatibility.',
    '',
  ].join('\n')
}

function openSlideId(title: string, docId: string): string {
  const titleSlug = title
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 34)
  const idSlug = String(docId).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(-12)
  return `${titleSlug || 'aurova-deck'}${idSlug ? `-${idSlug}` : ''}`.slice(0, 54)
}

function safePart(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-{2,}/g, '-').slice(0, 28) || 'file'
}

function isExternalMediaUrl(value: string): boolean {
  return /^(https?:|data:(?:image|video|audio|font)\/|asset:\/\/)/i.test(value)
}

function extensionForMime(mime: string): string {
  const type = mime.split(';')[0].trim().toLowerCase()
  const known: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/avif': 'avif',
    'image/svg+xml': 'svg',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'font/woff': 'woff',
    'font/woff2': 'woff2',
    'font/ttf': 'ttf',
    'font/otf': 'otf',
  }
  return known[type] ?? 'bin'
}

function decodeDataUrl(value: string): { mime: string; bytes: Uint8Array } | null {
  const match = /^data:([^;,]*)(;base64)?,([\s\S]*)$/i.exec(value)
  if (!match) return null
  const mime = match[1] || 'text/plain'
  try {
    if (match[2]) {
      const binary = atob(match[3])
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      return { mime, bytes }
    }
    return { mime, bytes: new TextEncoder().encode(decodeURIComponent(match[3])) }
  } catch {
    return null
  }
}
