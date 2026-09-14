import type { CSSProperties } from 'react'
import { backgroundToCss, paintToCss, shadowCss, strokeCss } from '../lib/colors'
import { fontStack } from '../lib/fonts'
import { alignToTextAlign } from '../document/text'
import { shapePath, maskToClipPath } from '../document/shapes'
import type { AnyElement, Background, ImageElement, Paint, ShapeElement, TextStyle } from '../document/types'

/** One place that turns model + theme into CSS, so screen, thumbnail and print never disagree. */

export function elementBoxStyle(el: AnyElement): CSSProperties {
  return {
    left: el.x,
    top: el.y,
    width: el.w,
    height: el.h,
    opacity: el.opacity,
    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
    display: el.visible ? undefined : 'none',
    mixBlendMode: el.blendMode && el.blendMode !== 'normal' ? (el.blendMode as CSSProperties['mixBlendMode']) : undefined,
  }
}

export function textStyleCss(font: TextStyle, opts: { editable?: boolean; colorFallback?: string } = {}): CSSProperties {
  const dir = font.dir === 'rtl' ? 'rtl' : 'ltr'
  return {
    fontFamily: fontStack(font.fontFamily, dir === 'rtl' ? 'tajawal' : 'inter'),
    fontSize: font.fontSize,
    fontWeight: font.bold ? 700 : font.italic ? 500 : undefined,
    fontStyle: font.italic ? 'italic' : undefined,
    color: font.color || opts.colorFallback,
    textAlign: alignToTextAlign(font.align, dir),
    direction: dir,
    lineHeight: font.lineHeight,
    letterSpacing: font.letterSpacing ? `${font.letterSpacing}px` : undefined,
    textTransform: font.transform && font.transform !== 'none' ? font.transform : undefined,
    whiteSpace: font.wrap ? 'pre-wrap' : 'pre',
    overflowWrap: 'break-word',
    wordBreak: 'normal',
    WebkitFontSmoothing: 'antialiased',
    fontKerning: 'normal',
    fontFeatureSettings: "'kern' 1, 'liga' 1, 'calt' 1",
    cursor: opts.editable ? 'text' : undefined,
  }
}

export function shapeFillStyle(el: ShapeElement): CSSProperties {
  return {
    background: paintToCss(el.fill),
    boxShadow: shadowCss(el.shadow),
  }
}

export function shapeSvgProps(el: ShapeElement) {
  const path = shapePath(el.shape, el.w, el.h, el.radius, el.adj)
  return {
    path: path.d,
    stroke: el.stroke && el.stroke.width ? strokeCss(el.stroke) : undefined,
    strokeWidth: el.stroke?.width,
  }
}

export function imageStyle(el: ImageElement): CSSProperties {
  const f = el.filters
  const filters: string[] = []
  if (f.brightness !== 100) filters.push(`brightness(${f.brightness}%)`)
  if (f.contrast !== 100) filters.push(`contrast(${f.contrast}%)`)
  if (f.saturation !== 100) filters.push(`saturate(${f.saturation}%)`)
  if (f.grayscale) filters.push(`grayscale(${f.grayscale}%)`)
  if (f.sepia) filters.push(`sepia(${f.sepia}%)`)
  if (f.hueRotate) filters.push(`hue-rotate(${f.hueRotate}deg)`)
  if (f.blur) filters.push(`blur(${f.blur}px)`)
  const radius = el.radius ?? [0, 0, 0, 0]
  return {
    objectFit: el.fit,
    filter: filters.length ? filters.join(' ') : undefined,
    borderRadius: radius.some((r) => r > 0) ? radius.map((r) => `${r}px`).join(' ') : undefined,
    clipPath: el.mask ? maskToClipPath(el.mask.shape, el.mask.inset ?? 0, el.w, el.h) : undefined,
    boxShadow: shadowCss(el.shadow),
    width: '100%',
    height: '100%',
  }
}

export function backgroundStyle(bg: Background | undefined, assetSrc?: string): CSSProperties {
  const style: CSSProperties = { background: backgroundToCss(bg) }
  if (bg?.type === 'image' && bg.image && assetSrc) {
    style.backgroundImage = `${bg.image.overlay ? `linear-gradient(${overlayCss(bg.image.overlay)}),` : ''}url("${assetSrc}")`
    style.backgroundSize = bg.image.fit === 'fill' ? '100% 100%' : bg.image.fit
    style.backgroundPosition = bg.image.position ?? 'center'
    style.backgroundRepeat = 'no-repeat'
  }
  return style
}

function overlayCss(paint: Paint): string {
  return paintToCss(paint)
}
