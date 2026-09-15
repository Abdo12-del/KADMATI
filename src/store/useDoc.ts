/**
 * The document store — single source of truth for the presentation being edited.
 *
 * Design notes:
 * • immer gives structural sharing, so editing one element only invalidates that element's
 *   memo boundary (a 50-slide deck re-renders one slide, not the deck).
 * • zundo tracks ONLY `{ doc }`, so selection/zoom/tool changes never pollute the undo stack.
 * • Continuous gestures (drag, resize, colour scrubbing, text typing) run between
 *   `beginTransaction()` / `endTransaction()`: tracking is paused during the gesture and one
 *   pre-gesture snapshot is pushed at the end — exactly one Ctrl+Z per gesture.
 */
import { produce } from 'immer'
import { create } from 'zustand'
import { temporal } from 'zundo'
import {
  createChart,
  createEmptyDoc,
  createFrame,
  createIcon,
  createImage,
  createLine,
  createShape,
  createSlide,
  createSvg,
  createTable,
  createText,
  createVideo,
  newId,
} from '../document/factory'
import { alignRects, clamp, distribute, type AlignEdge } from '../document/geometry'
import type { LayoutDef } from '../templates/layouts'
import { buildLayout } from '../templates/layouts'
import type {
  AnyElement,
  AssetRef,
  Background,
  BrandKit,
  ChartKind,
  ElementKind,
  ElementRole,
  ImageElement,
  LineElement,
  Presentation,
  ShapeId,
  Slide,
  TextStyle,
  Theme,
  TransitionSpec,
} from '../document/types'

export type ToolId =
  | 'select'
  | 'text'
  | 'shape'
  | 'line'
  | 'image'
  | 'icon'
  | 'chart'
  | 'table'
  | 'frame'

export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'offline' | 'error'

type HistoryState = { doc: Presentation }

export interface DocState {
  doc: Presentation
  projectId: string
  slideIndex: number
  selection: string[]
  editingId: string | null
  hoverId: string | null
  clipboard: AnyElement[]
  tool: ToolId
  pendingShape: ShapeId
  pendingIcon: string
  pendingChart: ChartKind
  zoom: number
  zoomMode: 'fit' | 'manual'
  saveStatus: SaveStatus
  savedAt: number | null
  gesture: null | 'drag' | 'resize' | 'rotate' | 'marquee'
  snapshot: Presentation | null
  historyLabel: string | null

  load: (doc: Presentation, projectId?: string) => void

  setTool: (t: ToolId) => void
  setPendingShape: (s: ShapeId) => void
  setPendingIcon: (i: string) => void
  setPendingChart: (c: ChartKind) => void
  setZoom: (z: number) => void
  zoomBy: (delta: number) => void
  fitZoom: (availW: number, availH: number) => void
  toggleGrid: () => void
  setGesture: (g: DocState['gesture']) => void

  beginTransaction: () => void
  endTransaction: (label?: string) => void

  mutate: (fn: (doc: Presentation) => void, label?: string) => void
  mutateSilently: (fn: (doc: Presentation) => void) => void

  gotoSlide: (index: number) => void
  nextSlide: () => void
  prevSlide: () => void
  addSlide: (at?: number, layout?: LayoutDef | null) => string
  duplicateSlide: (index?: number) => void
  removeSlide: (index: number) => void
  reorderSlide: (from: number, to: number) => void
  moveSlide: (index: number, dir: -1 | 1) => void
  updateSlide: (id: string, fn: (slide: Slide) => void, label?: string) => void
  setSlideBackground: (background: Background) => void
  setSlideTransition: (transition: Partial<TransitionSpec>) => void
  setNotes: (notes: string) => void
  setSlideName: (name: string) => void
  toggleSlideHidden: () => void

  select: (ids: string[], opts?: { toggle?: boolean; additive?: boolean }) => void
  selectAll: () => void
  clearSelection: () => void
  setHover: (id: string | null) => void
  startEditing: (id: string) => void
  stopEditing: () => void
  focusNext: (rev?: boolean) => void

  addElement: (el: AnyElement, opts?: { select?: boolean; history?: boolean }) => string
  insertText: (role?: ElementRole, text?: string) => string
  insertShape: (shape: ShapeId, at?: { x: number; y: number }) => string
  insertImage: (asset: AssetRef, opts?: { full?: boolean }) => string
  insertIcon: (icon: string) => string
  insertSvg: (markup: string) => string
  insertChart: (chart?: ChartKind) => string
  insertTable: (rows?: number, cols?: number) => string
  insertFrame: () => string
  insertLine: () => string
  insertVideo: (asset: AssetRef) => string
  updateElement: (id: string, patch: Partial<AnyElement>, label?: string) => void
  updateSelected: (patch: Partial<AnyElement> | ((el: AnyElement) => Partial<AnyElement>), label?: string) => void
  updateTextStyle: (patch: Partial<TextStyle>) => void
  updateElementText: (id: string, html: string) => void
  removeSelected: () => void
  removeElement: (id: string) => void
  duplicateSelected: () => void
  zOrder: (op: 'front' | 'back' | 'forward' | 'backward') => void
  alignSelected: (edge: AlignEdge) => void
  distributeSelected: (axis: 'x' | 'y') => void
  groupSelected: () => void
  ungroupSelected: () => void
  toggleLock: () => void
  toggleVisible: () => void
  renameElement: (id: string, name: string) => void
  nudge: (dx: number, dy: number) => void
  setPositions: (map: Record<string, { x: number; y: number }>, opts?: { history?: boolean }) => void
  setGeometry: (id: string, geo: { x?: number; y?: number; w?: number; h?: number; rotation?: number }) => void
  copySelected: () => void
  cutSelected: () => void
  paste: (offset?: { x: number; y: number }) => void
  applyLayout: (layout: LayoutDef) => void
  applyTheme: (theme: Theme) => void
  applyBrandKit: (kit: BrandKit) => void
  updateTheme: (fn: (theme: Theme) => void) => void
  setBackgroundForAll: (bg: Background) => void
  addAsset: (asset: AssetRef) => void
  removeAsset: (id: string) => void
  setMetadata: (patch: Partial<Presentation['metadata']>) => void
  setSettings: (patch: Partial<Presentation['settings']>) => void

  undo: () => void
  redo: () => void

  markSaved: (status?: SaveStatus) => void
  markDirty: () => void
}

const HISTORY_LIMIT = 150

export const useDoc = create<DocState>()(
  temporal(
    (set, get) => {
      const touch = () => {
        // The timestamp alone must never enter undo history: pause tracking for this set, so the
        // history holds content changes only (the mutation that called touch() already pushed).
        const temporalApi = useDoc.temporal.getState()
        const wasTracking = temporalApi.isTracking
        temporalApi.pause()
        set((s) => ({
          doc: { ...s.doc, metadata: { ...s.doc.metadata, updatedAt: Date.now() } },
          saveStatus: 'dirty' as SaveStatus,
        }))
        if (wasTracking) temporalApi.resume()
      }

      const slideIdOf = () => {
        const { doc, slideIndex } = get()
        return doc.slides[clamp(slideIndex, 0, doc.slides.length - 1)]?.id ?? ''
      }
      const currentSlide = () => {
        const { doc, slideIndex } = get()
        return doc.slides[clamp(slideIndex, 0, doc.slides.length - 1)]
      }

      const updateSlide = (id: string, fn: (slide: Slide) => void, label?: string) => {
        if (!id) return
        set((s) => ({
          doc: produce(s.doc, (doc) => {
            const slide = doc.slides.find((x) => x.id === id)
            if (slide) fn(slide)
          }),
          ...(label ? { historyLabel: label } : {}),
        } as Partial<DocState>))
        touch()
      }

      const setPositions = (map: Record<string, { x: number; y: number }>, opts?: { history?: boolean }) => {
        const id = slideIdOf()
        const apply = (slide: Slide) => {
          for (const el of slide.elements) {
            const p = map[el.id]
            if (p) {
              el.x = Math.round(p.x)
              el.y = Math.round(p.y)
            }
          }
        }
        if (opts?.history === false) {
          mutateSilently((doc) => {
            const slide = doc.slides.find((s) => s.id === id)
            if (slide) apply(slide)
          })
          set({ saveStatus: 'dirty' })
          return
        }
        updateSlide(id, apply, 'تحريك العناصر')
      }

      const mutateSilently = (fn: (doc: Presentation) => void) => {
        const temporalApi = useDoc.temporal.getState()
        temporalApi.pause()
        set((s) => ({ doc: produce(s.doc, fn) }))
        temporalApi.resume()
      }

      const pruneSelection = () => {
        const { doc, selection, slideIndex } = get()
        const slide = doc.slides[clamp(slideIndex, 0, doc.slides.length - 1)]
        if (!slide) return
        const ids = new Set(slide.elements.map((e) => e.id))
        const next = selection.filter((id) => ids.has(id))
        if (next.length !== selection.length) set({ selection: next, editingId: null })
      }

      const centered = <T extends AnyElement>(el: T): T => {
        const { size } = get().doc
        return { ...el, x: Math.round(size.w / 2 - el.w / 2), y: Math.round(size.h / 2 - el.h / 2) } as T
      }

      const addElement: DocState['addElement'] = (el, opts) => {
        const id = slideIdOf()
        if (opts?.select !== false) set({ selection: [el.id], editingId: null })
        updateSlide(
          id,
          (slide) => {
            slide.elements.push(el)
          },
          `إضافة ${ELEMENT_LABELS[el.kind]}`,
        )
        return el.id
      }

      return {
        doc: createEmptyDoc(),
        projectId: 'draft',
        slideIndex: 0,
        selection: [],
        editingId: null,
        hoverId: null,
        clipboard: [],
        tool: 'select',
        pendingShape: 'rect',
        pendingIcon: 'sparkles',
        pendingChart: 'bar',
        zoom: 1,
        zoomMode: 'fit',
        saveStatus: 'idle',
        savedAt: null,
        gesture: null,
        snapshot: null,
        historyLabel: null as string | null,

        load: (doc, projectId) => {
          useDoc.temporal.getState().clear()
          set({
            doc,
            projectId: projectId ?? doc.id,
            slideIndex: 0,
            selection: [],
            editingId: null,
            zoomMode: 'fit',
            saveStatus: 'saved',
            savedAt: doc.metadata.updatedAt,
            snapshot: null,
          })
        },

        setTool: (tool) => set({ tool, editingId: null }),
        setPendingShape: (pendingShape) => set({ pendingShape, tool: 'shape' }),
        setPendingIcon: (pendingIcon) => set({ pendingIcon, tool: 'icon' }),
        setPendingChart: (pendingChart) => set({ pendingChart, tool: 'chart' }),
        setZoom: (zoom) => set({ zoom: clamp(Math.round(zoom * 100) / 100, 0.08, 4), zoomMode: 'manual' }),
        zoomBy: (delta) => get().setZoom(get().zoom + delta),
        fitZoom: (availW, availH) => {
          if (get().zoomMode !== 'fit') return
          const { w, h } = get().doc.size
          const z = Math.min((availW - 80) / w, (availH - 96) / h)
          set({ zoom: clamp(Math.floor(z * 100) / 100, 0.1, 4) })
        },
        toggleGrid: () =>
          mutateSilently((doc) => {
            doc.settings.gridVisible = !doc.settings.gridVisible
          }),
        setGesture: (gesture) => set({ gesture }),

        beginTransaction: () => {
          useDoc.temporal.getState().pause()
          set((s) => ({ snapshot: s.doc }))
        },
        endTransaction: (label) => {
          const snapshot = get().snapshot
          useDoc.temporal.getState().resume()
          set({ snapshot: null })
          if (snapshot && snapshot !== get().doc) {
            useDoc.temporal.setState((t) => ({
              pastStates: [...t.pastStates.slice(-(HISTORY_LIMIT - 1)), { doc: snapshot } as HistoryState],
              futureStates: [],
            }))
            if (label) set({ historyLabel: label } as Partial<DocState>)
          }
        },

        mutate: (fn, label) => {
          set((s) => ({ doc: produce(s.doc, fn), ...(label ? { historyLabel: label } : {}) }) as Partial<DocState>)
          touch()
        },
        mutateSilently,

        gotoSlide: (index) => {
          const max = get().doc.slides.length - 1
          set({ slideIndex: clamp(index, 0, max), selection: [], editingId: null })
        },
        nextSlide: () => get().gotoSlide(get().slideIndex + 1),
        prevSlide: () => get().gotoSlide(get().slideIndex - 1),

        addSlide: (at, layout) => {
          const id = newId('s')
          set((s) => {
            const index = clamp(at ?? s.slideIndex + 1, 0, s.doc.slides.length)
            const base = createSlide({ id })
            const slide = layout ? { ...buildLayout(layout, s.doc.theme), id } : base
            const slides = [...s.doc.slides]
            slides.splice(index, 0, slide)
            return { doc: { ...s.doc, slides }, slideIndex: index, selection: [], editingId: null }
          })
          touch()
          return id
        },

        duplicateSlide: (index) => {
          set((s) => {
            const i = index ?? s.slideIndex
            const src = s.doc.slides[i]
            if (!src) return {}
            const copy: Slide = {
              ...structuredClone(src),
              id: newId('s'),
              elements: src.elements.map((e) => ({ ...structuredClone(e), id: newId(e.kind) })),
            }
            const slides = [...s.doc.slides]
            slides.splice(i + 1, 0, copy)
            return { doc: { ...s.doc, slides }, slideIndex: i + 1, selection: [] }
          })
          touch()
        },

        removeSlide: (index) => {
          set((s) => {
            if (s.doc.slides.length <= 1) return {}
            const slides = s.doc.slides.filter((_, i) => i !== index)
            return { doc: { ...s.doc, slides }, slideIndex: clamp(Math.min(index, slides.length - 1), 0, slides.length - 1), selection: [] }
          })
          touch()
        },

        reorderSlide: (from, to) => {
          set((s) => {
            const slides = [...s.doc.slides]
            const [moved] = slides.splice(from, 1)
            if (!moved) return {}
            slides.splice(clamp(to, 0, slides.length), 0, moved)
            return { doc: { ...s.doc, slides }, slideIndex: clamp(to, 0, slides.length - 1) }
          })
          touch()
        },
        moveSlide: (index, dir) => {
          const to = index + dir
          if (to < 0 || to >= get().doc.slides.length) return
          get().reorderSlide(index, to)
        },
        updateSlide,

        setSlideBackground: (background) => updateSlide(slideIdOf(), (slide) => void (slide.background = background), 'خلفية الشريحة'),
        setSlideTransition: (transition) =>
          updateSlide(
            slideIdOf(),
            (slide) => {
              Object.assign(slide.transition, transition)
            },
            'انتقال',
          ),
        setNotes: (notes) => {
          mutateSilently((doc) => {
            const slide = doc.slides.find((s) => s.id === slideIdOf())
            if (slide) slide.notes = notes
          })
          set({ saveStatus: 'dirty' })
        },
        setSlideName: (name) => updateSlide(slideIdOf(), (slide) => void (slide.name = name), 'اسم الشريحة'),
        toggleSlideHidden: () => updateSlide(slideIdOf(), (slide) => void (slide.hidden = !slide.hidden), 'إظهار/إخفاء شريحة'),

        select: (ids, opts) =>
          set((s) => {
            let selection = ids
            if (opts?.additive) {
              const acc = new Set(s.selection)
              ids.forEach((id) => (acc.has(id) ? acc.delete(id) : acc.add(id)))
              selection = Array.from(acc)
            } else if (opts?.toggle && s.selection.length === ids.length && ids.every((i) => s.selection.includes(i))) {
              selection = []
            }
            return { selection, editingId: selection.length === 1 ? s.editingId : null }
          }),
        selectAll: () => {
          const slide = currentSlide()
          set({ selection: slide ? slide.elements.filter((e) => !e.locked && e.visible).map((e) => e.id) : [] })
        },
        clearSelection: () => set({ selection: [], editingId: null }),
        setHover: (hoverId) => set({ hoverId }),
        startEditing: (id) => {
          get().beginTransaction()
          set({ editingId: id, selection: [id] })
        },
        stopEditing: () => {
          if (get().editingId) get().endTransaction('تحرير النص')
          set({ editingId: null })
        },
        focusNext: (rev) => {
          const slide = currentSlide()
          if (!slide?.elements.length) return
          const openable = slide.elements.filter((e) => e.kind === 'text' || (e.kind === 'shape' && e.text))
          const list = rev ? [...openable].reverse() : openable
          const cur = list.findIndex((e) => e.id === get().selection[0])
          const next = list[(cur + 1 + list.length) % list.length] ?? list[0]
          if (next) set({ selection: [next.id] })
        },

        addElement,
        insertText: (role = 'body', text) => {
          const el = createText(get().doc.theme, { role, text: text || placeholderFor(role, get().doc.metadata.dir) })
          return addElement(centered(el))
        },
        insertShape: (shape, at) => {
          const el = createShape(get().doc.theme, { shape, ...(at ? { x: at.x - 140, y: at.y - 90 } : {}) })
          return addElement(at ? el : centered(el))
        },
        insertImage: (asset, opts) => {
          const { w: cw, h: ch } = get().doc.size
          const ratio = asset.w && asset.h ? asset.w / asset.h : 16 / 9
          let w = opts?.full ? cw : Math.min(cw * 0.5, 640)
          let h = w / ratio
          if (!opts?.full && h > ch * 0.7) {
            h = ch * 0.7
            w = h * ratio
          }
          get().addAsset(asset)
          const el = createImage({
            assetId: asset.id,
            x: (cw - w) / 2,
            y: (ch - h) / 2,
            w,
            h,
            role: 'image',
          })
          return addElement(el)
        },
        insertIcon: (icon) => addElement(centered(createIcon({ icon, color: get().doc.theme.palette.text, w: 88, h: 88 }))),
        insertSvg: (markup) => addElement(centered(createSvg({ markup, w: 260, h: 260 }))),
        insertChart: (chart) => addElement(centered(createChart({ chart: chart ?? get().pendingChart, theme: get().doc.theme }))),
        insertTable: (rows, cols) => addElement(centered(createTable({ theme: get().doc.theme, rows, cols }))),
        insertFrame: () => addElement(centered(createFrame({ w: 560, h: 340 }))),
        insertLine: () => {
          const { w, h } = get().doc.size
          return addElement(
            createLine({
              x: Math.round(w * 0.2),
              y: Math.round(h / 2),
              w: Math.round(w * 0.6),
              h: 2,
              stroke: { color: get().doc.theme.palette.text, width: 3, dash: 'solid', cap: 'round' },
            }),
          )
        },
        insertVideo: (asset) =>
          addElement(
            centered(
              createVideo({
                src: asset.src,
                posterAssetId: asset.kind === 'image' ? asset.id : undefined,
                w: 640,
                h: 360,
              }),
            ),
          ),

        updateElement: (id, patch, label) =>
          updateSlide(
            slideIdOf(),
            (slide) => {
              const el = slide.elements.find((e) => e.id === id)
              if (el) Object.assign(el, patch)
            },
            label ?? 'تعديل العنصر',
          ),

        updateSelected: (patch, label) => {
          const ids = get().selection
          if (!ids.length) return
          updateSlide(
            slideIdOf(),
            (slide) => {
              for (const el of slide.elements) {
                if (!ids.includes(el.id)) continue
                Object.assign(el, typeof patch === 'function' ? patch(el) : patch)
              }
            },
            label ?? 'تعديل العناصر',
          )
        },

        updateTextStyle: (patch) => {
          const ids = get().selection
          if (!ids.length) return
          updateSlide(
            slideIdOf(),
            (slide) => {
              for (const el of slide.elements) {
                if (!ids.includes(el.id)) continue
                if (el.kind === 'text') Object.assign(el.font, patch)
                else if (el.kind === 'shape' && el.textStyle) Object.assign(el.textStyle, patch)
                else if (el.kind === 'table') Object.assign(el.font, patch)
              }
            },
            'تنسيق النص',
          )
        },

        updateElementText: (id, html) => {
          const sid = slideIdOf()
          mutateSilently((doc) => {
            const slide = doc.slides.find((s) => s.id === sid)
            const el = slide?.elements.find((e) => e.id === id)
            if (el && el.kind === 'text') el.content = html
          })
          set({ saveStatus: 'dirty' })
        },

        removeSelected: () => {
          const ids = get().selection
          if (!ids.length) return
          updateSlide(
            slideIdOf(),
            (slide) => {
              slide.elements = slide.elements.filter((e) => !ids.includes(e.id) || e.locked)
            },
            ids.length === 1 ? 'حذف العنصر' : `حذف ${ids.length} عناصر`,
          )
          set({ selection: [], editingId: null })
        },
        removeElement: (id) => {
          updateSlide(
            slideIdOf(),
            (slide) => {
              slide.elements = slide.elements.filter((e) => e.id !== id)
            },
            'حذف العنصر',
          )
          set((s) => ({ selection: s.selection.filter((x) => x !== id) }))
        },

        duplicateSelected: () => {
          const ids = get().selection
          if (!ids.length) return
          const created: string[] = []
          updateSlide(
            slideIdOf(),
            (slide) => {
              const gidMap = new Map<string, string>()
              for (const el of slide.elements.filter((e) => ids.includes(e.id))) {
                const copy = structuredClone(el)
                copy.id = newId(el.kind)
                copy.x += 24
                copy.y += 24
                if (copy.gid) {
                  if (!gidMap.has(copy.gid)) gidMap.set(copy.gid, newId('g'))
                  copy.gid = gidMap.get(copy.gid)
                }
                created.push(copy.id)
                slide.elements.push(copy)
              }
            },
            'تكرار العنصر',
          )
          if (created.length) set({ selection: created, editingId: null })
        },

        zOrder: (op) => {
          const ids = get().selection
          if (!ids.length) return
          updateSlide(
            slideIdOf(),
            (slide) => {
              const els = slide.elements
              const picked = els.filter((e) => ids.includes(e.id))
              const rest = els.filter((e) => !ids.includes(e.id))
              if (op === 'front') slide.elements = [...rest, ...picked] as AnyElement[]
              else if (op === 'back') slide.elements = [...picked, ...rest] as AnyElement[]
              else {
                const dir = op === 'forward' ? 1 : -1
                const arr = [...els]
                const order = arr.map((e, i) => ({ e, i })).filter(({ e }) => ids.includes(e.id))
                for (const { e, i } of dir > 0 ? [...order].reverse() : order) {
                  const j = i + dir
                  if (j < 0 || j >= arr.length || ids.includes(arr[j].id)) continue
                  arr[i] = arr[j]
                  arr[j] = e
                }
                slide.elements = arr as AnyElement[]
              }
            },
            op === 'front' ? 'إحضار للأمام' : op === 'back' ? 'إرسال للخلف' : 'تحريك في الترتيب',
          )
        },

        alignSelected: (edge) => {
          const slide = currentSlide()
          const ids = get().selection
          if (!slide || !ids.length) return
          const els = slide.elements.filter((e) => ids.includes(e.id))
          const { size } = get().doc
          const anchor = els.length < 2 ? { x: 0, y: 0, w: size.w, h: size.h } : boundsOf(els)
          const rects = alignRects(
            els.map((e) => ({ x: e.x, y: e.y, w: e.w, h: e.h })),
            edge,
            anchor,
          )
          const map: Record<string, { x: number; y: number }> = {}
          els.forEach((e, i) => {
            map[e.id] = { x: Math.round(rects[i].x), y: Math.round(rects[i].y) }
          })
          setPositions(map)
        },

        distributeSelected: (axis) => {
          const slide = currentSlide()
          const ids = get().selection
          if (!slide || ids.length < 3) return
          const sorted = slide.elements.filter((e) => ids.includes(e.id)).sort((a, b) => (axis === 'x' ? a.x - b.x : a.y - b.y))
          const last = sorted[sorted.length - 1]
          const first = sorted[0]
          const total = axis === 'x' ? { start: first.x, size: last.x + last.w - first.x } : { start: first.y, size: last.y + last.h - first.y }
          const out = distribute(
            sorted.map((e) => ({ start: axis === 'x' ? e.x : e.y, size: axis === 'x' ? e.w : e.h })),
            total.start,
            total.size,
          )
          const map: Record<string, { x: number; y: number }> = {}
          sorted.forEach((e, i) => {
            map[e.id] = axis === 'x' ? { x: out[i].offset, y: e.y } : { x: e.x, y: out[i].offset }
          })
          setPositions(map)
        },

        groupSelected: () => {
          const ids = get().selection
          if (ids.length < 2) return
          const gid = newId('g')
          updateSlide(
            slideIdOf(),
            (slide) => {
              for (const el of slide.elements) if (ids.includes(el.id)) el.gid = gid
            },
            'تجميع',
          )
        },
        ungroupSelected: () => {
          const ids = get().selection
          if (!ids.length) return
          updateSlide(
            slideIdOf(),
            (slide) => {
              for (const el of slide.elements) if (ids.includes(el.id)) el.gid = undefined
            },
            'إلغاء التجميع',
          )
        },
        toggleLock: () => {
          const slide = currentSlide()
          const ids = get().selection
          if (!slide || !ids.length) return
          const allLocked = ids.every((id) => slide.elements.find((e) => e.id === id)?.locked)
          get().updateSelected({ locked: !allLocked }, allLocked ? 'إلغاء القفل' : 'قفل العنصر')
        },
        toggleVisible: () => {
          const slide = currentSlide()
          const ids = get().selection
          if (!slide || !ids.length) return
          const allHidden = ids.every((id) => slide.elements.find((e) => e.id === id)?.visible === false)
          get().updateSelected({ visible: allHidden }, allHidden ? 'إظهار' : 'إخفاء')
        },
        renameElement: (id, name) => get().updateElement(id, { name }, 'إعادة تسمية'),

        nudge: (dx, dy) => {
          const slide = currentSlide()
          const ids = get().selection
          if (!slide || !ids.length) return
          const map: Record<string, { x: number; y: number }> = {}
          for (const e of slide.elements) {
            if (ids.includes(e.id) && !e.locked) map[e.id] = { x: e.x + dx, y: e.y + dy }
          }
          setPositions(map)
        },
        setPositions,

        setGeometry: (id, geo) =>
          updateSlide(
            slideIdOf(),
            (slide) => {
              const el = slide.elements.find((e) => e.id === id)
              if (!el) return
              if (geo.x !== undefined) el.x = Math.round(geo.x)
              if (geo.y !== undefined) el.y = Math.round(geo.y)
              if (geo.w !== undefined) el.w = Math.max(4, Math.round(geo.w))
              if (geo.h !== undefined) el.h = Math.max(4, Math.round(geo.h))
              if (geo.rotation !== undefined) el.rotation = Math.round(geo.rotation * 10) / 10
            },
            'تعديل المقاس',
          ),

        copySelected: () => {
          const slide = currentSlide()
          const els = slide?.elements.filter((e) => get().selection.includes(e.id)) ?? []
          set({ clipboard: structuredClone(els) as AnyElement[] })
        },
        cutSelected: () => {
          get().copySelected()
          get().removeSelected()
        },
        paste: (offset = { x: 24, y: 24 }) => {
          const clip = get().clipboard
          if (!clip.length) return
          const gidMap = new Map<string, string>()
          const els = clip.map((el) => {
            const copy = structuredClone(el)
            copy.id = newId(el.kind)
            copy.x += offset.x
            copy.y += offset.y
            if (copy.gid) {
              if (!gidMap.has(copy.gid)) gidMap.set(copy.gid, newId('g'))
              copy.gid = gidMap.get(copy.gid)
            }
            return copy
          })
          updateSlide(
            slideIdOf(),
            (slide) => {
              slide.elements.push(...els)
            },
            'لصق',
          )
          set({ selection: els.map((e) => e.id) })
        },

        applyLayout: (layout) => {
          const slide = currentSlide()
          if (!slide) return
          const next = buildLayout(layout, get().doc.theme)
          const byRole = new Map<ElementRole, AnyElement[]>()
          for (const el of slide.elements) {
            if (!el.role) continue
            const list = byRole.get(el.role) ?? []
            list.push(el)
            byRole.set(el.role, list)
          }
          const taken = new Set<string>()
          const merged: AnyElement[] = []
          for (const slot of next.elements) {
            const pool = slot.role ? byRole.get(slot.role) : undefined
            const found = pool?.find((e) => !taken.has(e.id))
            if (found) {
              taken.add(found.id)
              merged.push({ ...found, x: slot.x, y: slot.y, w: slot.w, h: slot.h })
            } else merged.push(slot)
          }
          // Elements whose role is not represented in the new layout are kept where they are.
          const orphans = slide.elements.filter((e) => !(e.role && layout.roles.includes(e.role)))
          updateSlide(
            slide.id,
            (s) => {
              s.elements = [...merged, ...orphans] as AnyElement[]
              s.layoutId = layout.id
            },
            'تغيير التخطيط',
          )
        },

        applyTheme: (theme) =>
          get().mutate((doc) => {
            const prev = doc.theme
            doc.theme = theme
            for (const slide of doc.slides) {
              if (slide.background.type === 'solid') slide.background.color = theme.palette.background
              for (const el of slide.elements) {
                if (el.kind === 'text') {
                  const isHeading = el.role === 'title' || el.role === 'kicker' || el.role === 'quote' || el.role === 'stat'
                  el.font.fontFamily = isHeading || el.font.fontFamily === prev.fonts.heading ? theme.fonts.heading : theme.fonts.body
                  if (el.font.color === prev.palette.text) el.font.color = theme.palette.text
                  if (el.font.color === prev.palette.accent) el.font.color = theme.palette.accent
                }
                if (el.kind === 'shape') {
                  el.radius = [theme.radius, theme.radius, theme.radius, theme.radius]
                  repaintFrom(el, prev, theme)
                }
                if (el.kind === 'table') {
                  el.font.fontFamily = theme.fonts.body
                  el.cells.forEach((row) =>
                    row.forEach((cell) => {
                      if (cell.fill === prev.palette.primary) cell.fill = theme.palette.primary
                      if (cell.color === prev.palette.onPrimary) cell.color = theme.palette.onPrimary
                    }),
                  )
                }
                if (el.kind === 'chart') el.colors = [theme.palette.secondary, theme.palette.accent, theme.palette.primary, theme.palette.success]
                if (el.kind === 'icon' && el.color === prev.palette.text) el.color = theme.palette.text
              }
            }
          }, 'تطبيق السمة'),

        applyBrandKit: (kit) =>
          get().mutate((doc) => {
            doc.brandKitId = kit.id
            doc.theme = { ...doc.theme, name: kit.name, palette: { ...kit.colors }, fonts: { ...kit.fonts } }
          }, 'تطبيق العلامة التجارية'),

        updateTheme: (fn) =>
          get().mutate((doc) => {
            fn(doc.theme)
          }, 'تعديل السمة'),

        setBackgroundForAll: (bg) =>
          get().mutate((doc) => {
            for (const slide of doc.slides) slide.background = structuredClone(bg)
          }, 'تطبيق الخلفية على العرض'),

        addAsset: (asset) =>
          get().mutate((doc) => {
            doc.assets[asset.id] = asset
          }, 'إضافة أصل'),
        removeAsset: (id) =>
          get().mutate((doc) => {
            delete doc.assets[id]
          }, 'حذف أصل'),

        setMetadata: (patch) =>
          get().mutate((doc) => {
            Object.assign(doc.metadata, patch)
          }, 'بيانات العرض'),
        setSettings: (patch) =>
          mutateSilently((doc) => {
            Object.assign(doc.settings, patch)
          }),

        undo: () => {
          // Pause tracking while the temporal store applies the previous snapshot, otherwise the
          // wrapped set re-pushes the pre-undo doc and multi-step undo ping-pongs.
          const temporalApi = useDoc.temporal.getState()
          temporalApi.pause()
          try {
            temporalApi.undo()
          } finally {
            temporalApi.resume()
          }
          pruneSelection()
          touch()
        },
        redo: () => {
          const temporalApi = useDoc.temporal.getState()
          temporalApi.pause()
          try {
            temporalApi.redo()
          } finally {
            temporalApi.resume()
          }
          pruneSelection()
          touch()
        },

        markSaved: (status = 'saved') => set({ saveStatus: status, savedAt: status === 'saved' ? Date.now() : get().savedAt }),
        markDirty: () => set({ saveStatus: 'dirty' }),
      } as DocState
    },
    {
      limit: HISTORY_LIMIT,
      partialize: (state): HistoryState => ({ doc: state.doc }),
      // A set that left the document untouched (selection, zoom, save flags…) is not history.
      equality: (past, current) => past.doc === current.doc,
    },
  ),
)

/* ------------------------------------------------------------------ selectors */

export function useCurrentSlide(): Slide | undefined {
  return useDoc((s) => s.doc.slides[clamp(s.slideIndex, 0, s.doc.slides.length - 1)])
}

export function useSelectedElements(): AnyElement[] {
  const slide = useCurrentSlide()
  const selection = useDoc((s) => s.selection)
  return (slide?.elements ?? []).filter((e) => selection.includes(e.id))
}

export function useSelectedElement(): AnyElement | null {
  const els = useSelectedElements()
  return els.length === 1 ? els[0] : null
}

export function imageAsset(doc: Presentation, el: ImageElement | LineElement): AssetRef | undefined {
  return el.kind === 'image' ? doc.assets[el.assetId] : undefined
}

/* ------------------------------------------------------------------ internals */

const ELEMENT_LABELS: Record<ElementKind, string> = {
  text: 'نص',
  image: 'صورة',
  shape: 'شكل',
  line: 'خط',
  icon: 'أيقونة',
  svg: 'SVG',
  table: 'جدول',
  chart: 'مخطط',
  video: 'فيديو',
  frame: 'إطار',
}

const PLACEHOLDERS: Record<'ar' | 'en', Record<string, string>> = {
  ar: {
    title: 'عنوان العرض',
    kicker: 'قسم',
    subtitle: 'سطر مساند قصير يوضّح الفكرة',
    body: 'هذه مساحة النص — انقر مرتين للتحرير واكتب ما تريد قوله.',
    quote: '«اكتب الاقتباس الذي يُلخّص فكرتك.»',
    stat: '١٢٤٪',
    footer: 'كدماتي ستوديو',
    list: 'النقطة الأولى',
    decoration: '',
    image: '',
  },
  en: {
    title: 'Presentation title',
    kicker: 'SECTION',
    subtitle: 'A short supporting line',
    body: 'This is the text area — double-click to edit and write your message.',
    quote: '“Put the quote that captures your idea.”',
    stat: '124%',
    footer: 'KADMATI Studio',
    list: 'First point',
    decoration: '',
    image: '',
  },
}

function placeholderFor(role: ElementRole | undefined, dir: 'rtl' | 'ltr'): string {
  const map = PLACEHOLDERS[dir === 'rtl' ? 'ar' : 'en']
  return map[String(role ?? 'body')] ?? map.body
}

function boundsOf(els: AnyElement[]) {
  let x1 = Infinity
  let y1 = Infinity
  let x2 = -Infinity
  let y2 = -Infinity
  for (const e of els) {
    x1 = Math.min(x1, e.x)
    y1 = Math.min(y1, e.y)
    x2 = Math.max(x2, e.x + e.w)
    y2 = Math.max(y2, e.y + e.h)
  }
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 }
}

/** Swap old theme colours for new ones in a shape fill/stroke when they match exactly. */
function repaintFrom(el: Extract<AnyElement, { kind: 'shape' }>, prev: Theme, next: Theme) {
  const swap = (color?: string): string | undefined => {
    if (!color) return color
    const map: Record<string, string> = {
      [prev.palette.primary]: next.palette.primary,
      [prev.palette.secondary]: next.palette.secondary,
      [prev.palette.accent]: next.palette.accent,
      [prev.palette.surface]: next.palette.surface,
      [prev.palette.background]: next.palette.background,
      [prev.palette.text]: next.palette.text,
    }
    return map[color] ?? color
  }
  if (el.fill.type === 'solid') el.fill = { type: 'solid', color: swap(el.fill.color) ?? el.fill.color }
  if (el.fill.type === 'gradient') el.fill = { ...el.fill, stops: el.fill.stops.map((s) => ({ ...s, color: swap(s.color) ?? s.color })) }
  if (el.stroke) el.stroke = { ...el.stroke, color: swap(el.stroke.color) ?? el.stroke.color }
  if (el.textStyle) el.textStyle = { ...el.textStyle, color: swap(el.textStyle.color) ?? el.textStyle.color, fontFamily: next.fonts.heading }
}

