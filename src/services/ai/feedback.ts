/**
 * Aurova Model — preference data capture (opt-in, local-first).
 *
 * The single best training signal we can get is what a user *changes* after generation. Each
 * generated deck is remembered with its prompt and the outline the model produced; when the
 * user later exports/saves that deck, we snapshot the edited outline next to it. The pair
 * (prompt, model_outline, user_outline) is a DPO/preference example: the edited version is the
 * "chosen" answer, the model's is "rejected". Explicit 👍/👎 is stored too.
 *
 * Nothing leaves the browser. `exportFeedback()` produces JSONL the user can hand over
 * (or that a future signed-in sync can upload with consent). `model/build-dataset.ts` accepts
 * this file via `model/data/feedback.jsonl`.
 */
import { storage } from '../../store/storage'
import { useUI } from '../../store/useUI'
import { htmlToPlainText } from '../../document/text'
import type { Presentation, TextElement } from '../../document/types'
import type { ProviderId } from './providers'

export interface OutlineSnapshot {
  slides: { layout: string; title: string; points: string[] }[]
}

export interface FeedbackRecord {
  id: string
  docId: string
  createdAt: number
  prompt: string
  lang: 'ar' | 'en'
  category: string
  provider: ProviderId
  model: string
  engine: 'local' | 'provider'
  /** What the model/planner produced, before the user touched anything. */
  generated: OutlineSnapshot
  /** Latest snapshot after user edits (updated on save/export). */
  edited?: OutlineSnapshot
  editedAt?: number
  rating?: 'up' | 'down'
  note?: string
}

const KEY = 'ai-feedback'
const OPT_KEY = 'ai-feedback-optin'
const MAX = 300

let cache: FeedbackRecord[] | null = null
async function load(): Promise<FeedbackRecord[]> {
  if (!cache) cache = (await storage.getSetting<FeedbackRecord[]>(KEY)) ?? []
  return cache
}
async function save(list: FeedbackRecord[]) {
  cache = list.slice(-MAX)
  await storage.putSetting(KEY, cache)
}

export async function isFeedbackEnabled(): Promise<boolean> {
  return (await storage.getSetting<boolean>(OPT_KEY)) ?? false
}
export async function setFeedbackEnabled(on: boolean): Promise<void> {
  await storage.putSetting(OPT_KEY, on)
  if (!on) await save([])
}

/** Compact, text-only view of a deck: exactly the granularity the outline model works at. */
export function snapshotOutline(doc: Presentation): OutlineSnapshot {
  return {
    slides: doc.slides.map((s) => {
      const texts = s.elements.filter((el): el is TextElement => el.kind === 'text')
      const title = texts.find((t) => t.role === 'title')
      const points = texts
        .filter((t) => t !== title && t.role !== 'footer' && t.role !== 'kicker' && t.role !== 'decoration')
        .flatMap((t) => htmlToPlainText(t.content).split(/\n+/))
        .map((x) => x.trim())
        .filter(Boolean)
        .slice(0, 8)
      return { layout: s.layoutId, title: title ? htmlToPlainText(title.content).trim() : '', points }
    }),
  }
}

export async function recordGeneration(input: { doc: Presentation; prompt: string; category: string; engine: 'local' | 'provider' }): Promise<void> {
  if (!(await isFeedbackEnabled())) return
  const ai = useUI.getState().ai
  const list = await load()
  list.push({
    id: `fb-${Date.now().toString(36)}`,
    docId: input.doc.id,
    createdAt: Date.now(),
    prompt: input.prompt,
    lang: /[\u0600-\u06FF]/.test(input.prompt) ? 'ar' : 'en',
    category: input.category,
    provider: input.engine === 'local' ? 'local' : ai.provider,
    model: input.engine === 'local' ? 'planner' : ai.model,
    engine: input.engine,
    generated: snapshotOutline(input.doc),
  })
  await save(list)
}

/** Call on save/export: refreshes the "edited" side for decks that came from generation. */
export async function recordEdit(doc: Presentation): Promise<void> {
  if (!(await isFeedbackEnabled())) return
  const list = await load()
  const rec = [...list].reverse().find((r) => r.docId === doc.id)
  if (!rec) return
  const edited = snapshotOutline(doc)
  if (JSON.stringify(edited) === JSON.stringify(rec.edited ?? rec.generated)) return
  rec.edited = edited
  rec.editedAt = Date.now()
  await save(list)
}

export async function rateGeneration(docId: string, rating: 'up' | 'down', note?: string): Promise<boolean> {
  if (!(await isFeedbackEnabled())) return false
  const list = await load()
  const rec = [...list].reverse().find((r) => r.docId === docId)
  if (!rec) return false
  rec.rating = rating
  if (note) rec.note = note
  await save(list)
  return true
}

export async function feedbackStats(): Promise<{ total: number; edited: number; up: number; down: number }> {
  const list = await load()
  return { total: list.length, edited: list.filter((r) => r.edited).length, up: list.filter((r) => r.rating === 'up').length, down: list.filter((r) => r.rating === 'down').length }
}

/** JSONL, one record per line — consumed by model/build-dataset.ts as preference pairs. */
export async function exportFeedback(): Promise<Blob> {
  const list = await load()
  return new Blob([list.map((r) => JSON.stringify(r)).join('\n') + '\n'], { type: 'application/x-ndjson' })
}

export async function clearFeedback(): Promise<void> {
  await save([])
}
