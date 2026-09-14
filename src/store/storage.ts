/**
 * Local-first persistence.
 *
 * Everything is stored in IndexedDB so a refresh never loses work, and the repository API is
 * intentionally the same shape a REST/CRUD backend would expose — swapping in Supabase/Postgres
 * later means replacing this file only (see ARCHITECTURE.md §Backend).
 */
import { openDB, type IDBPDatabase } from 'idb'
import type { BrandKit, Folder, ProjectRecord } from '../document/types'

const DB_NAME = 'kadmati-studio'
const DB_VERSION = 1
export const STORE = {
  projects: 'projects',
  brandKits: 'brandKits',
  folders: 'folders',
  settings: 'settings',
} as const

let dbPromise: Promise<IDBPDatabase> | null = null

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE.projects)) {
          const s = db.createObjectStore(STORE.projects, { keyPath: 'id' })
          s.createIndex('updatedAt', 'updatedAt')
          s.createIndex('trashedAt', 'trashedAt')
        }
        if (!db.objectStoreNames.contains(STORE.brandKits)) db.createObjectStore(STORE.brandKits, { keyPath: 'id' })
        if (!db.objectStoreNames.contains(STORE.folders)) db.createObjectStore(STORE.folders, { keyPath: 'id' })
        if (!db.objectStoreNames.contains(STORE.settings)) db.createObjectStore(STORE.settings)
      },
    })
  }
  return dbPromise
}

async function fallbackGet<T>(key: string): Promise<T | undefined> {
  try {
    const raw = localStorage.getItem(`${DB_NAME}:${key}`)
    return raw ? (JSON.parse(raw) as T) : undefined
  } catch {
    return undefined
  }
}

async function fallbackSet(key: string, value: unknown): Promise<void> {
  try {
    localStorage.setItem(`${DB_NAME}:${key}`, JSON.stringify(value))
  } catch {
    /* quota — IndexedDB is the real store, this is only the safety net */
  }
}

export const storage = {
  async listProjects(): Promise<ProjectRecord[]> {
    try {
      const db = await getDb()
      const all = (await db.getAll(STORE.projects)) as ProjectRecord[]
      return all.sort((a, b) => b.updatedAt - a.updatedAt)
    } catch {
      return (await fallbackGet<ProjectRecord[]>('projects')) ?? []
    }
  },

  async putProject(record: ProjectRecord): Promise<void> {
    try {
      const db = await getDb()
      await db.put(STORE.projects, record)
    } catch {
      const list = (await fallbackGet<ProjectRecord[]>('projects')) ?? []
      const i = list.findIndex((p) => p.id === record.id)
      if (i >= 0) list[i] = record
      else list.unshift(record)
      await fallbackSet('projects', list.slice(0, 40))
    }
  },

  async getProject(id: string): Promise<ProjectRecord | undefined> {
    try {
      const db = await getDb()
      return (await db.get(STORE.projects, id)) as ProjectRecord | undefined
    } catch {
      const list = (await fallbackGet<ProjectRecord[]>('projects')) ?? []
      return list.find((p) => p.id === id)
    }
  },

  async deleteProject(id: string): Promise<void> {
    try {
      const db = await getDb()
      await db.delete(STORE.projects, id)
    } catch {
      const list = ((await fallbackGet<ProjectRecord[]>('projects')) ?? []).filter((p) => p.id !== id)
      await fallbackSet('projects', list)
    }
  },

  async listBrandKits(): Promise<BrandKit[]> {
    try {
      const db = await getDb()
      return (await db.getAll(STORE.brandKits)) as BrandKit[]
    } catch {
      return (await fallbackGet<BrandKit[]>('brandKits')) ?? []
    }
  },

  async putBrandKit(kit: BrandKit): Promise<void> {
    try {
      const db = await getDb()
      await db.put(STORE.brandKits, kit)
    } catch {
      const list = (await fallbackGet<BrandKit[]>('brandKits')) ?? []
      const i = list.findIndex((k) => k.id === kit.id)
      if (i >= 0) list[i] = kit
      else list.push(kit)
      await fallbackSet('brandKits', list)
    }
  },

  async deleteBrandKit(id: string): Promise<void> {
    try {
      const db = await getDb()
      await db.delete(STORE.brandKits, id)
    } catch {
      const list = ((await fallbackGet<BrandKit[]>('brandKits')) ?? []).filter((k) => k.id !== id)
      await fallbackSet('brandKits', list)
    }
  },

  async listFolders(): Promise<Folder[]> {
    try {
      const db = await getDb()
      return (await db.getAll(STORE.folders)) as Folder[]
    } catch {
      return (await fallbackGet<Folder[]>('folders')) ?? []
    }
  },

  async putFolder(folder: Folder): Promise<void> {
    try {
      const db = await getDb()
      await db.put(STORE.folders, folder)
    } catch {
      const list = (await fallbackGet<Folder[]>('folders')) ?? []
      const i = list.findIndex((f) => f.id === folder.id)
      if (i >= 0) list[i] = folder
      else list.push(folder)
      await fallbackSet('folders', list)
    }
  },

  async deleteFolder(id: string): Promise<void> {
    try {
      const db = await getDb()
      await db.delete(STORE.folders, id)
    } catch {
      const list = ((await fallbackGet<Folder[]>('folders')) ?? []).filter((f) => f.id !== id)
      await fallbackSet('folders', list)
    }
  },

  async getSetting<T>(key: string): Promise<T | undefined> {
    try {
      const db = await getDb()
      return await db.get(STORE.settings, key)
    } catch {
      return await fallbackGet<T>(`settings:${key}`)
    }
  },

  async putSetting<T>(key: string, value: T): Promise<void> {
    try {
      const db = await getDb()
      await db.put(STORE.settings, value, key)
    } catch {
      await fallbackSet(`settings:${key}`, value)
    }
  },

  async wipe(): Promise<void> {
    try {
      const db = await getDb()
      await Promise.all([db.clear(STORE.projects), db.clear(STORE.brandKits), db.clear(STORE.folders), db.clear(STORE.settings)])
    } catch {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(`${DB_NAME}:`))
        .forEach((k) => localStorage.removeItem(k))
    }
  },
}

/* ------------------------------------------------------------------ media */

/**
 * Uploaded media becomes a compact data URL so the presentation JSON stays self-contained
 * (and thus trivially exportable / syncable / CRDT-able later).
 */
export async function fileToDataUrl(file: File, opts: { maxSide?: number; quality?: number; mime?: string } = {}): Promise<{ src: string; w: number; h: number; bytes: number }> {
  const maxSide = opts.maxSide ?? 2048
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    const src = await readAsDataUrl(file)
    return { src, w: 0, h: 0, bytes: file.size }
  }
  const objectUrl = URL.createObjectURL(file)
  let img: HTMLImageElement
  try {
    img = await loadImage(objectUrl)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.max(1, Math.round(img.naturalWidth * scale))
  const h = Math.max(1, Math.round(img.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return { src: await readAsDataUrl(file), w: img.naturalWidth, h: img.naturalHeight, bytes: file.size }
  ctx.drawImage(img, 0, 0, w, h)
  const keepPng = /png|webp|svg/.test(file.type) && file.size < 250_000
  const out = keepPng ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', opts.quality ?? 0.85)
  return { src: out, w, h, bytes: Math.round(out.length * 0.75) }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(String(fr.result))
    fr.onerror = () => reject(fr.error)
    fr.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image decode failed'))
    img.src = src
  })
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  downloadUrl(url, filename)
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

export function downloadUrl(url: string, filename: string): void {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
}
