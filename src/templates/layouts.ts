/**
 * Layout library.
 *
 * A layout is a *generator*, not an image: it produces real elements (with roles) from the
 * active theme. That is what makes "change the layout without losing my content" possible and
 * what makes every template in this app fully editable.
 */
import { createChart, createIcon, createImage, createLine, createShape, createTable, createText, createSlide, newId } from '../document/factory'
import { readableOn } from '../lib/colors'
import type { AnyElement, Background, ElementRole, Slide, Theme } from '../document/types'

export const W = 1280
export const H = 720

export interface LayoutDef {
  id: string
  name: string
  hint: string
  roles: ElementRole[]
  build: (t: Theme) => { elements: AnyElement[]; background?: Background }
}

const M = 96

/** Keep a box of width `w` inside the canvas with a small breathing margin. */
function clampX(x: number, w: number): number {
  const PAD = 24
  return Math.max(PAD, Math.min(W - PAD - w, x))
}

function text(t: Theme, role: ElementRole, box: { x: number; y: number; w: number; h?: number }, over: Parameters<typeof createText>[1] = {}) {
  return createText(t, { role, x: box.x, y: box.y, w: box.w, h: box.h ?? 80, ...over })
}

function accent(t: Theme, x: number, y: number, w = 72, h = 6) {
  return createShape(t, { shape: 'rect', x, y, w, h, fill: { type: 'solid', color: t.palette.accent }, radius: [0, 0, 0, 0], role: 'decoration', name: 'شريط' })
}

export const LAYOUTS: LayoutDef[] = [
  {
    id: 'blank',
    name: 'فارغة',
    hint: 'مساحة بيضاء بالكامل',
    roles: [],
    build: () => ({ elements: [] }),
  },
  {
    id: 'title',
    name: 'عنوان',
    hint: 'غلاف العرض — عنوان + سطر مساند',
    roles: ['kicker', 'title', 'subtitle', 'footer'],
    build: (t) => ({
      elements: [
        accent(t, M, 168, 96, 6),
        text(t, 'kicker', { x: M, y: 200, w: 420, h: 34 }, { text: 'عرض تقديمي' }),
        text(t, 'title', { x: M, y: 248, w: W - M * 2, h: 168 }, { style: { fontSize: 76 } }),
        text(t, 'subtitle', { x: M, y: 432, w: 660, h: 76 }),
        text(t, 'footer', { x: M, y: 620, w: 360, h: 28 }),
      ],
    }),
  },
  {
    id: 'title-centered',
    name: 'عنوان موسَّط',
    hint: 'غلاف موسَّط ل العروض القصيرة',
    roles: ['kicker', 'title', 'subtitle'],
    build: (t) => ({
      elements: [
        text(t, 'kicker', { x: 200, y: 218, w: W - 400, h: 32 }, { style: { align: 'center' } }),
        text(t, 'title', { x: 160, y: 268, w: W - 320, h: 150 }, { style: { align: 'center', fontSize: 68 } }),
        text(t, 'subtitle', { x: 280, y: 440, w: W - 560, h: 72 }, { style: { align: 'center' } }),
        accent(t, W / 2 - 40, 540, 80, 5),
      ],
    }),
  },
  {
    id: 'title-content',
    name: 'عنوان + محتوى',
    hint: 'التخطيط الأكثر استخدامًا',
    roles: ['kicker', 'title', 'body', 'list'],
    build: (t) => ({
      elements: [
        text(t, 'kicker', { x: M, y: 68, w: 320, h: 26 }),
        text(t, 'title', { x: M, y: 102, w: W - M * 2, h: 84 }, { style: { fontSize: 48 } }),
        accent(t, M, 202, 64, 5),
        text(t, 'body', { x: M, y: 244, w: W - M * 2, h: 340 }, { role: 'list' }),
      ],
    }),
  },
  {
    id: 'two-columns',
    name: 'عمودان',
    hint: 'مقارنة أو فكرتان متوازيتان',
    roles: ['title', 'body'],
    build: (t) => ({
      elements: [
        text(t, 'title', { x: M, y: 72, w: W - M * 2, h: 76 }, { style: { fontSize: 44 } }),
        accent(t, M, 160, 64, 5),
        text(t, 'body', { x: M, y: 208, w: (W - M * 2 - 56) / 2, h: 380 }),
        text(t, 'body', { x: M + (W - M * 2 - 56) / 2 + 56, y: 208, w: (W - M * 2 - 56) / 2, h: 380 }),
      ],
    }),
  },
  {
    id: 'image-text',
    name: 'صورة + نص',
    hint: 'نصف بصري، نصف تحريري',
    roles: ['title', 'body', 'image'],
    build: (t) => ({
      elements: [
        createImage({ assetId: '', x: W / 2, y: 0, w: W / 2, h: H, role: 'image' }),
        text(t, 'title', { x: M, y: 168, w: W / 2 - M * 1.6, h: 120 }, { style: { fontSize: 46 } }),
        accent(t, M, 296, 64, 5),
        text(t, 'body', { x: M, y: 340, w: W / 2 - M * 1.6, h: 220 }),
      ],
    }),
  },
  {
    id: 'full-image',
    name: 'صورة كاملة',
    hint: 'صورة تملأ الشريحة مع طبقة نص',
    roles: ['title', 'body', 'image'],
    build: (t) => ({
      elements: [
        createImage({ assetId: '', x: 0, y: 0, w: W, h: H, role: 'image' }),
        createShape(t, { shape: 'rect', x: 0, y: H - 300, w: W, h: 300, fill: { type: 'gradient', kind: 'linear', angle: 90, stops: [{ pos: 0, color: 'rgba(0,0,0,0)' }, { pos: 100, color: 'rgba(0,0,0,0.72)' }] }, radius: [0, 0, 0, 0], role: 'decoration', name: 'تدرّج' }),
        text(t, 'title', { x: M, y: H - 216, w: W - M * 2, h: 100 }, { style: { fontSize: 52, color: '#FFFFFF', vAlign: 'end' } }),
        text(t, 'body', { x: M, y: H - 108, w: W - M * 2 - 200, h: 72 }, { style: { color: 'rgba(255,255,255,0.86)', fontSize: 22 } }),
      ],
    }),
  },
  {
    id: 'quote',
    name: 'اقتباس',
    hint: 'اقتباس بحجم كبير',
    roles: ['quote', 'footer'],
    build: (t) => ({
      elements: [
        createShape(t, { shape: 'rect', x: M, y: 150, w: 8, h: 300, fill: { type: 'solid', color: t.palette.accent }, radius: [0, 0, 0, 0], role: 'decoration' }),
        text(t, 'quote', { x: M + 48, y: 168, w: W - M * 2 - 48, h: 268 }),
        text(t, 'footer', { x: M + 48, y: 476, w: 460, h: 40 }, { style: { fontSize: 20, bold: true, color: t.palette.text } }),
      ],
    }),
  },
  {
    id: 'statistics',
    name: 'إحصاءات',
    hint: '٣ أرقام كبيرة',
    roles: ['title', 'stat', 'body'],
    build: (t) => {
      const items: AnyElement[] = []
      const cw = (W - M * 2 - 64) / 3
      for (let i = 0; i < 3; i++) {
        const x = M + i * (cw + 32)
        items.push(createShape(t, { shape: 'roundRect', x, y: 214, w: cw, h: 232, fill: { type: 'solid', color: t.palette.surface }, radius: [t.radius, t.radius, t.radius, t.radius], role: 'decoration', name: `بطاقة ${i + 1}` }))
        items.push(text(t, 'stat', { x: x + 32, y: 258, w: cw - 64, h: 96 }, { style: { align: 'start', color: t.palette.primary } }))
        items.push(text(t, 'body', { x: x + 32, y: 362, w: cw - 64, h: 68 }, { style: { fontSize: 19, color: t.palette.textMuted } }))
      }
      return { elements: [text(t, 'title', { x: M, y: 84, w: W - M * 2, h: 76 }, { style: { fontSize: 44 } }), ...items] }
    },
  },
  {
    id: 'timeline',
    name: 'خط زمني',
    hint: 'مراحل متتابعة أفقيًا',
    roles: ['title', 'kicker', 'body'],
    build: (t) => {
      const els: AnyElement[] = [text(t, 'title', { x: M, y: 72, w: W - M * 2, h: 76 }, { style: { fontSize: 44 } })]
      const line = createLine({ x: M, y: 372, w: W - M * 2, h: 2, stroke: { color: t.palette.textMuted, width: 2, dash: 'solid' } })
      els.push(line)
      const n = 4
      for (let i = 0; i < n; i++) {
        const x = M + ((W - M * 2) / (n - 1)) * i
        els.push(createShape(t, { shape: 'circle', x: x - 11, y: 361, w: 24, h: 24, fill: { type: 'solid', color: t.palette.accent }, role: 'decoration' }))
        const above = i % 2 === 0
        // Labels are centred on their node, then clamped inside the canvas — an end label that
        // hangs off the edge is the classic timeline bug, and PowerPoint shows it as a crop.
        els.push(text(t, 'kicker', { x: clampX(x - 110, 220), y: above ? 268 : 402, w: 220, h: 30 }, { style: { align: 'center' } }))
        els.push(text(t, 'body', { x: clampX(x - 120, 240), y: above ? 298 : 432, w: 240, h: 88 }, { style: { align: 'center', fontSize: 19 } }))
      }
      return { elements: els }
    },
  },
  {
    id: 'process',
    name: 'مراحل',
    hint: '٤ خطوات بأسهم',
    roles: ['title', 'stat', 'body'],
    build: (t) => {
      const els: AnyElement[] = [text(t, 'title', { x: M, y: 72, w: W - M * 2, h: 76 }, { style: { fontSize: 44 } })]
      const n = 4
      const cw = (W - M * 2 - 24 * (n - 1)) / n
      for (let i = 0; i < n; i++) {
        const x = M + i * (cw + 24)
        const cardFill = i === 0 ? t.palette.primary : t.palette.surface
        // Text on a card is derived from that card's fill, never from a hopeful token.
        const onCard = readableOn(cardFill, t.palette.text, t.palette.onPrimary)
        els.push(createShape(t, { shape: 'roundRect', x, y: 252, w: cw, h: 210, fill: { type: 'solid', color: cardFill }, radius: [t.radius, t.radius, t.radius, t.radius], role: 'decoration' }))
        els.push(
          text(t, 'stat', { x: x + 24, y: 280, w: 74, h: 56 }, {
            style: { fontSize: 34, color: i === 0 ? onCard : t.palette.accent },
            text: `0${i + 1}`,
          }),
        )
        els.push(
          text(t, 'body', { x: x + 24, y: 340, w: cw - 48, h: 96 }, {
            style: { fontSize: 19, color: onCard, lineHeight: 1.5 },
          }),
        )
      }
      return { elements: els }
    },
  },
  {
    id: 'comparison',
    name: 'مقارنة',
    hint: 'قبل / بعد أو خياران',
    roles: ['title', 'kicker', 'body'],
    build: (t) => {
      const cw = (W - M * 2 - 32) / 2
      const col = (x: number, color: string, title: string) => [
        createShape(t, { shape: 'roundRect', x, y: 200, w: cw, h: 384, fill: { type: 'solid', color: t.palette.surface }, radius: [t.radius, t.radius, t.radius, t.radius], role: 'decoration' }),
        createShape(t, { shape: 'rect', x, y: 200, w: cw, h: 8, fill: { type: 'solid', color }, radius: [0, 0, 0, 0], role: 'decoration' }),
        text(t, 'kicker', { x: x + 32, y: 240, w: cw - 64, h: 44 }, { text: title, style: { color, fontSize: 26, bold: true, letterSpacing: 0 } }),
        text(t, 'body', { x: x + 32, y: 300, w: cw - 64, h: 250 }),
      ]
      return {
        elements: [text(t, 'title', { x: M, y: 72, w: W - M * 2, h: 76 }, { style: { fontSize: 44 } }), ...col(M, t.palette.secondary, 'الحالة الراهنة'), ...col(M + cw + 32, t.palette.accent, 'بعد التطبيق')],
      }
    },
  },
  {
    id: 'chart',
    name: 'مخطط',
    hint: 'مخطط + قراءة نصية',
    roles: ['title', 'body'],
    build: (t) => ({
      elements: [
        text(t, 'title', { x: M, y: 72, w: W - M * 2, h: 76 }, { style: { fontSize: 44 } }),
        createChart({ x: M, y: 200, w: 660, h: 380, theme: t }),
        text(t, 'body', { x: M + 700, y: 220, w: W - M * 2 - 700, h: 320 }, { style: { fontSize: 21, color: t.palette.textMuted } }),
      ],
    }),
  },
  {
    id: 'table',
    name: 'جدول',
    hint: 'بيانات جدولية',
    roles: ['title', 'body'],
    build: (t) => ({
      elements: [
        text(t, 'title', { x: M, y: 72, w: W - M * 2, h: 76 }, { style: { fontSize: 44 } }),
        createTable({ x: M, y: 210, w: W - M * 2, h: 340, rows: 5, cols: 4, theme: t }),
      ],
    }),
  },
  {
    id: 'section',
    name: 'فاصل',
    hint: 'بداية قسم جديد',
    roles: ['kicker', 'title'],
    build: (t) => ({
      background: { type: 'solid', color: t.palette.primary },
      elements: [
        text(t, 'kicker', { x: M, y: 268, w: 300, h: 30 }, { style: { color: t.palette.onPrimary } }),
        text(t, 'title', { x: M, y: 312, w: W - M * 2 - 240, h: 150 }, { style: { color: t.palette.onPrimary, fontSize: 64 } }),
        accent(t, M, 494, 96, 6),
      ],
    }),
  },
  {
    id: 'closing',
    name: 'ختام',
    hint: 'شكرًا + بيانات تواصل',
    roles: ['title', 'body', 'footer'],
    build: (t) => ({
      elements: [
        text(t, 'title', { x: M, y: 232, w: W - M * 2, h: 140 }, { style: { fontSize: 72 } }),
        text(t, 'body', { x: M, y: 396, w: 560, h: 96 }),
        createIcon({ icon: 'mail', x: M, y: 530, w: 40, h: 40, color: t.palette.accent, strokeWidth: 1.75 }),
        text(t, 'footer', { x: M + 56, y: 536, w: 420, h: 30 }),
      ],
    }),
  },
]

export const LAYOUT_MAP = new Map(LAYOUTS.map((l) => [l.id, l]))

export function buildLayout(layout: LayoutDef, theme: Theme, slideId?: string): Slide {
  const built = layout.build(theme)
  const slide = createSlide({ id: slideId ?? newId('s'), layoutId: layout.id })
  slide.elements = built.elements
  if (built.background) slide.background = built.background
  return slide
}

export function layoutById(id: string): LayoutDef | undefined {
  return LAYOUT_MAP.get(id)
}
