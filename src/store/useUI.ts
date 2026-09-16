/** Transient app state: toasts, preferences, dialogs, local profile. */
import { create } from 'zustand'
import { storage } from './storage'
import { PROVIDER_MAP, defaultModel, type ProviderId } from '../services/ai/providers'

export type ToastKind = 'info' | 'success' | 'error' | 'ai'

export interface Toast {
  id: string
  kind: ToastKind
  title: string
  body?: string
  action?: { label: string; run: () => void }
  ttl?: number
}

export interface AiSettings {
  /** Which backend answers AI requests. `local` = deterministic in-browser planner. */
  provider: ProviderId
  /** Endpoint is only user-editable for `custom`; other providers have fixed endpoints. */
  endpoint: string
  model: string
  /** Per-provider keys so switching providers does not lose them. Stored in this browser only. */
  keys: Partial<Record<ProviderId, string>>
  /** @deprecated kept for migration of older settings blobs. */
  apiKey?: string
  tone: 'neutral' | 'formal' | 'friendly' | 'punchy'
  density: 'short' | 'balanced' | 'rich'
}

export interface Prefs {
  leftPanelWidth: number
  rightPanelWidth: number
  showRulers: boolean
  showNotes: boolean
  uiDir: 'rtl' | 'ltr'
  themeMode: 'dark' | 'light'
}

export interface Profile {
  name: string
  email: string
  role: string
}

interface UIState {
  toasts: Toast[]
  prefs: Prefs
  profile: Profile | null
  ai: AiSettings
  hydrated: boolean
  /** Panel content shown in the left rail (thumbnails by default, browse panels override it). */
  leftPanel: 'slides' | 'templates' | 'images' | 'shapes' | 'icons' | 'tables-charts' | 'layers'
  rightPanel: 'design' | 'element' | 'animate' | 'transition' | 'brand' | 'notes' | 'ai'
  dialog: null | 'new-presentation' | 'import' | 'shortcuts' | 'share' | 'profile' | 'ai-settings' | 'export'
  hydrate: () => Promise<void>
  toast: (t: Omit<Toast, 'id'>) => string
  dismiss: (id: string) => void
  setPrefs: (p: Partial<Prefs>) => void
  setAi: (a: Partial<AiSettings>) => void
  setProfile: (p: Profile | null) => void
  setLeftPanel: (p: UIState['leftPanel']) => void
  setRightPanel: (p: UIState['rightPanel']) => void
  openDialog: (d: UIState['dialog']) => void
  closeDialog: () => void
}

const DEFAULT_PREFS: Prefs = {
  leftPanelWidth: 232,
  rightPanelWidth: 316,
  showRulers: false,
  showNotes: true,
  uiDir: 'rtl',
  themeMode: 'dark',
}

const DEFAULT_AI: AiSettings = {
  provider: 'local',
  endpoint: '',
  model: '',
  keys: {},
  tone: 'neutral',
  density: 'balanced',
}

/** Older blobs had `provider: 'custom'` + a single `apiKey`; fold them into the new shape. */
function migrateAi(raw: Partial<AiSettings> | null | undefined): AiSettings {
  const ai: AiSettings = { ...DEFAULT_AI, ...(raw ?? {}), keys: { ...(raw?.keys ?? {}) } }
  if (!(ai.provider in PROVIDER_MAP)) ai.provider = 'local'
  if (raw?.apiKey && !ai.keys[ai.provider]) ai.keys[ai.provider] = raw.apiKey
  delete ai.apiKey
  if (!ai.model) ai.model = defaultModel(ai.provider)
  return ai
}

async function persist(key: string, value: unknown) {
  try {
    await storage.putSetting(key, value)
  } catch {
    /* non fatal: preferences are a nicety, not data */
  }
}

export const useUI = create<UIState>()((set, get) => ({
  toasts: [],
  prefs: DEFAULT_PREFS,
  profile: null,
  ai: DEFAULT_AI,
  hydrated: false,
  leftPanel: 'slides',
  rightPanel: 'design',
  dialog: null,

  hydrate: async () => {
    const [prefs, ai, profile] = await Promise.all([
      storage.getSetting<Prefs>('prefs'),
      storage.getSetting<AiSettings>('ai'),
      storage.getSetting<Profile>('profile'),
    ])
    set({
      prefs: { ...DEFAULT_PREFS, ...(prefs ?? {}) },
      ai: migrateAi(ai),
      profile: profile ?? null,
      hydrated: true,
    })
  },

  toast: (t) => {
    const id = Math.random().toString(36).slice(2)
    set((s) => ({ toasts: [...s.toasts.slice(-4), { ...t, id }] }))
    const ttl = t.ttl ?? (t.kind === 'error' ? 7000 : 3600)
    if (ttl > 0) setTimeout(() => get().dismiss(id), ttl)
    return id
  },

  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  setPrefs: (p) => {
    const prefs = { ...get().prefs, ...p }
    set({ prefs })
    void persist('prefs', prefs)
  },

  setAi: (a) => {
    const prev = get().ai
    const ai = { ...prev, ...a }
    // Switching provider: pick that provider's default model unless the caller set one.
    if (a.provider && a.provider !== prev.provider && a.model === undefined) ai.model = defaultModel(a.provider)
    set({ ai })
    void persist('ai', ai)
  },

  setProfile: (profile) => {
    set({ profile })
    void persist('profile', profile)
  },

  setLeftPanel: (leftPanel) => set((s) => ({ leftPanel: s.leftPanel === leftPanel ? 'slides' : leftPanel })),
  setRightPanel: (rightPanel) => set({ rightPanel }),
  openDialog: (dialog) => set({ dialog }),
  closeDialog: () => set({ dialog: null }),
}))

export function toast(t: Omit<Toast, 'id'>) {
  return useUI.getState().toast(t)
}
