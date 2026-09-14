/**
 * Project library: the local "workspace". Deliberately mirrors what a REST API would return
 * (projects / folders / brand kits, soft-delete via `trashedAt`) so phase 7 (accounts + cloud)
 * is a transport swap rather than a rewrite.
 */
import { create } from 'zustand'
import { createPresentation, newId } from '../document/factory'
import { normalizePresentation } from '../document/factory'
import type { BrandKit, Folder, Presentation, ProjectRecord } from '../document/types'
import { DEMO_DECKS } from '../demo/decks'
import { instantiateDeck } from '../templates/engine'
import { storage } from './storage'

export type SortMode = 'recent' | 'name' | 'slides'

interface LibraryState {
  ready: boolean
  seeding: boolean
  projects: ProjectRecord[]
  folders: Folder[]
  brandKits: BrandKit[]
  search: string
  sort: SortMode
  scope: 'all' | 'recent' | 'favorite' | 'trash'
  folderFilter: string | null

  init: () => Promise<void>
  seedDemos: (force?: boolean) => Promise<number>
  createProject: (doc?: Presentation, thumbnail?: string) => Promise<ProjectRecord>
  saveProject: (record: ProjectRecord) => Promise<void>
  persistDoc: (projectId: string, doc: Presentation, thumbnail?: string) => Promise<void>
  openDoc: (id: string) => Promise<Presentation | null>
  renameProject: (id: string, title: string) => Promise<void>
  trashProject: (id: string) => Promise<void>
  restoreProject: (id: string) => Promise<void>
  destroyProject: (id: string) => Promise<void>
  duplicateProject: (id: string) => Promise<ProjectRecord | null>
  toggleFavorite: (id: string) => Promise<void>
  moveToFolder: (id: string, folderId?: string) => Promise<void>
  emptyTrash: () => Promise<void>
  addFolder: (name: string) => Promise<void>
  renameFolder: (id: string, name: string) => Promise<void>
  removeFolder: (id: string) => Promise<void>
  upsertBrandKit: (kit: BrandKit) => Promise<void>
  removeBrandKit: (id: string) => Promise<void>
  setSearch: (q: string) => void
  setSort: (s: SortMode) => void
  setScope: (s: LibraryState['scope']) => void
  setFolderFilter: (id: string | null) => void
}

function recordOf(doc: Presentation, thumbnail?: string, previous?: ProjectRecord): ProjectRecord {
  return {
    id: doc.id,
    doc,
    createdAt: previous?.createdAt ?? doc.metadata.createdAt,
    updatedAt: doc.metadata.updatedAt,
    thumbnail: thumbnail ?? previous?.thumbnail,
    folderId: doc.metadata.folderId ?? previous?.folderId,
    trashedAt: doc.metadata.trashedAt ?? previous?.trashedAt ?? null,
    favorite: doc.metadata.favorite ?? previous?.favorite ?? false,
    openCount: (previous?.openCount ?? 0) + (previous ? 0 : 1),
  }
}

export const useLibrary = create<LibraryState>()((set, get) => ({
  ready: false,
  seeding: false,
  projects: [],
  folders: [],
  brandKits: [],
  search: '',
  sort: 'recent',
  scope: 'all',
  folderFilter: null,

  init: async () => {
    const [projects, folders, brandKits] = await Promise.all([storage.listProjects(), storage.listFolders(), storage.listBrandKits()])
    set({ projects, folders, brandKits, ready: true })
    if (!projects.length) await get().seedDemos()
  },

  seedDemos: async (force = false) => {
    if (!force && get().projects.length) return 0
    set({ seeding: true })
    let added = 0
    for (const spec of DEMO_DECKS) {
      const doc = instantiateDeck(spec)
      doc.id = spec.id
      const record = recordOf(doc, undefined, undefined)
      record.thumbnail = undefined
      await storage.putProject(record)
      added++
    }
    const starter = createPresentation({ title: 'عرضي الأول' })
    starter.id = 'demo-blank'
    await storage.putProject(recordOf(starter))
    const projects = await storage.listProjects()
    set({ projects, seeding: false })
    return added
  },

  createProject: async (doc, thumbnail) => {
    const record = recordOf(doc ?? createPresentation({ title: 'عرض بدون عنوان' }), thumbnail)
    await storage.putProject(record)
    set((s) => ({ projects: [record, ...s.projects.filter((p) => p.id !== record.id)] }))
    return record
  },

  saveProject: async (record) => {
    await storage.putProject(record)
    set((s) => ({ projects: [record, ...s.projects.filter((p) => p.id !== record.id)].sort((a, b) => b.updatedAt - a.updatedAt) }))
  },

  persistDoc: async (projectId, doc, thumbnail) => {
    const previous = get().projects.find((p) => p.id === projectId) ?? (await storage.getProject(projectId))
    const record = recordOf({ ...doc, id: projectId }, thumbnail, previous ?? undefined)
    await storage.putProject(record)
    set((s) => ({ projects: [record, ...s.projects.filter((p) => p.id !== record.id)].sort((a, b) => b.updatedAt - a.updatedAt) }))
  },

  openDoc: async (id) => {
    const record = await storage.getProject(id)
    if (!record) return null
    await storage.putProject({ ...record, openCount: (record.openCount ?? 0) + 1 })
    return normalizePresentation(record.doc)
  },

  renameProject: async (id, title) => {
    const record = get().projects.find((p) => p.id === id)
    if (!record) return
    const next = recordOf({ ...record.doc, metadata: { ...record.doc.metadata, title, updatedAt: Date.now() } }, record.thumbnail, record)
    await storage.putProject(next)
    set((s) => ({ projects: s.projects.map((p) => (p.id === id ? next : p)) }))
  },

  trashProject: async (id) => {
    const record = get().projects.find((p) => p.id === id)
    if (!record) return
    const next = { ...record, trashedAt: Date.now(), doc: { ...record.doc, metadata: { ...record.doc.metadata, trashedAt: Date.now() } } }
    await storage.putProject(next)
    set((s) => ({ projects: s.projects.map((p) => (p.id === id ? next : p)) }))
  },

  restoreProject: async (id) => {
    const record = get().projects.find((p) => p.id === id)
    if (!record) return
    const next = { ...record, trashedAt: null, doc: { ...record.doc, metadata: { ...record.doc.metadata, trashedAt: null } } }
    await storage.putProject(next)
    set((s) => ({ projects: s.projects.map((p) => (p.id === id ? next : p)) }))
  },

  destroyProject: async (id) => {
    await storage.deleteProject(id)
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }))
  },

  duplicateProject: async (id) => {
    const record = get().projects.find((p) => p.id === id)
    if (!record) return null
    const doc = structuredClone(record.doc)
    doc.id = newId('p')
    doc.metadata = { ...doc.metadata, title: `${doc.metadata.title} — نسخة`, createdAt: Date.now(), updatedAt: Date.now() }
    const next = recordOf(doc, record.thumbnail)
    await storage.putProject(next)
    set((s) => ({ projects: [next, ...s.projects] }))
    return next
  },

  toggleFavorite: async (id) => {
    const record = get().projects.find((p) => p.id === id)
    if (!record) return
    const next = { ...record, favorite: !record.favorite, doc: { ...record.doc, metadata: { ...record.doc.metadata, favorite: !record.favorite } } }
    await storage.putProject(next)
    set((s) => ({ projects: s.projects.map((p) => (p.id === id ? next : p)) }))
  },

  moveToFolder: async (id, folderId) => {
    const record = get().projects.find((p) => p.id === id)
    if (!record) return
    const next = { ...record, folderId, doc: { ...record.doc, metadata: { ...record.doc.metadata, folderId } } }
    await storage.putProject(next)
    set((s) => ({ projects: s.projects.map((p) => (p.id === id ? next : p)) }))
  },

  emptyTrash: async () => {
    const doomed = get().projects.filter((p) => p.trashedAt)
    await Promise.all(doomed.map((p) => storage.deleteProject(p.id)))
    set((s) => ({ projects: s.projects.filter((p) => !p.trashedAt) }))
  },

  addFolder: async (name) => {
    const folder: Folder = { id: newId('f'), name, createdAt: Date.now() }
    await storage.putFolder(folder)
    set((s) => ({ folders: [...s.folders, folder] }))
  },

  renameFolder: async (id, name) => {
    const folder = get().folders.find((f) => f.id === id)
    if (!folder) return
    const next = { ...folder, name }
    await storage.putFolder(next)
    set((s) => ({ folders: s.folders.map((f) => (f.id === id ? next : f)) }))
  },

  removeFolder: async (id) => {
    await storage.deleteFolder(id)
    set((s) => ({
      folders: s.folders.filter((f) => f.id !== id),
      projects: s.projects.map((p) => (p.folderId === id ? { ...p, folderId: undefined } : p)),
    }))
  },

  upsertBrandKit: async (kit) => {
    await storage.putBrandKit(kit)
    set((s) => {
      const exists = s.brandKits.some((k) => k.id === kit.id)
      return { brandKits: exists ? s.brandKits.map((k) => (k.id === kit.id ? kit : k)) : [...s.brandKits, kit] }
    })
  },

  removeBrandKit: async (id) => {
    await storage.deleteBrandKit(id)
    set((s) => ({ brandKits: s.brandKits.filter((k) => k.id !== id) }))
  },

  setSearch: (search) => set({ search }),
  setSort: (sort) => set({ sort }),
  setScope: (scope) => set({ scope }),
  setFolderFilter: (folderFilter) => set({ folderFilter }),
}))

export function selectVisibleProjects(s: LibraryState): ProjectRecord[] {
  const q = s.search.trim().toLowerCase()
  let list = s.projects.filter((p) => (s.scope === 'trash' ? !!p.trashedAt : !p.trashedAt))
  if (s.scope === 'favorite') list = list.filter((p) => p.favorite)
  if (s.scope === 'recent') {
    const week = Date.now() - 1000 * 60 * 60 * 24 * 7
    list = list.filter((p) => p.updatedAt > week)
  }
  if (s.folderFilter) list = list.filter((p) => p.folderId === s.folderFilter)
  if (q) {
    list = list.filter((p) => {
      const hay = `${p.doc.metadata.title} ${p.doc.metadata.subject ?? ''} ${p.doc.metadata.tags.join(' ')} ${p.doc.slides.length}`.toLowerCase()
      return hay.includes(q)
    })
  }
  const sorted = [...list]
  if (s.sort === 'name') sorted.sort((a, b) => a.doc.metadata.title.localeCompare(b.doc.metadata.title, 'ar'))
  else if (s.sort === 'slides') sorted.sort((a, b) => b.doc.slides.length - a.doc.slides.length)
  else sorted.sort((a, b) => b.updatedAt - a.updatedAt)
  return sorted
}
