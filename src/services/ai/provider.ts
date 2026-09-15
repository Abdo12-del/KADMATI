/**
 * AI provider abstraction — the pipeline never talks to a vendor directly.
 *
 *   AIProvider
 *   ├── local (deterministic planner — offline, free, private; lives in planner.ts)
 *   ├── ollama (local LLM runtime — structured outputs via JSON Schema, data never leaves the machine)
 *   └── openai-compatible (any cloud/self-hosted endpoint speaking /chat/completions)
 *
 * Each provider answers ONE question: given a system+user prompt and a JSON schema, return parsed
 * JSON or null. Validation/repair happens upstream (schema.ts), so providers stay dumb and
 * swappable. The frontend never contacts Ollama except through this layer.
 */
import type { useUI } from '../../store/useUI'

type AiSettings = ReturnType<typeof useUI.getState>['ai']

export interface GenerateJSONRequest {
  system: string
  user: string
  /** json schema for runtimes with native structured output (Ollama). */
  jsonSchema?: Record<string, unknown>
  temperature?: number
  timeoutMs?: number
  signal?: AbortSignal
}

export interface ProviderJSONResult {
  data: unknown
  model: string
  raw: string
}

export interface AIProvider {
  id: 'ollama' | 'openai-compatible'
  label: string
  privacy: 'local' | 'cloud'
  /** the model name reported back to the UI */
  model: () => string
  /** return parsed JSON, or null on ANY failure (caller decides the fallback) */
  generateJSON: (req: GenerateJSONRequest) => Promise<ProviderJSONResult | null>
}

/* ------------------------------------------------------------------ ollama */

export interface OllamaStatus {
  ok: boolean
  version?: string
  models: { name: string; sizeBytes?: number }[]
  error?: string
}

const OLLAMA_DEFAULT = 'http://localhost:11434'

export function ollamaUrl(ai?: AiSettings): string {
  return (ai?.ollamaUrl || OLLAMA_DEFAULT).replace(/\/$/, '')
}

export async function detectOllama(url = OLLAMA_DEFAULT, timeoutMs = 2500): Promise<OllamaStatus> {
  const base = url.replace(/\/$/, '')
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)
    const [tagsRes, verRes] = await Promise.all([
      fetch(`${base}/api/tags`, { signal: ctrl.signal }),
      fetch(`${base}/api/version`, { signal: ctrl.signal }).catch(() => null),
    ])
    clearTimeout(timer)
    if (!tagsRes.ok) return { ok: false, models: [], error: `HTTP ${tagsRes.status}` }
    const tags = (await tagsRes.json()) as { models?: { name?: string; size?: number }[] }
    let version: string | undefined
    if (verRes?.ok) {
      try {
        version = ((await verRes.json()) as { version?: string }).version
      } catch {
        /* version is cosmetic */
      }
    }
    return {
      ok: true,
      version,
      models: (tags.models ?? []).map((m) => ({ name: String(m.name ?? ''), sizeBytes: m.size })).filter((m) => m.name),
    }
  } catch (err) {
    return { ok: false, models: [], error: (err as Error).name === 'AbortError' ? 'timeout' : 'unreachable' }
  }
}

/* ------------------------------------------------------------------ hardware awareness */

export type HardwareTier = 'high' | 'mid' | 'low'

export interface HardwareProfile {
  cores: number
  memoryGB: number | null
  tier: HardwareTier
  note: string
}

/**
 * Browser-visible signals only (cores + deviceMemory). We never pretend to see the GPU:
 * the tier is a recommendation the user can override by picking any installed model.
 */
export function hardwareProfile(): HardwareProfile {
  const cores = typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 4
  const mem = (typeof navigator !== 'undefined' && (navigator as { deviceMemory?: number }).deviceMemory) || null
  let tier: HardwareTier = 'low'
  if (cores >= 12 || (mem !== null && mem >= 16)) tier = 'high'
  else if (cores >= 6 || (mem !== null && mem >= 8)) tier = 'mid'
  return {
    cores,
    memoryGB: mem,
    tier,
    note: tier === 'high' ? 'جهاز قوي — نموذج 14B مناسب' : tier === 'mid' ? 'جهاز متوسط — نموذج 8B مناسب' : 'جهاز محدود — نموذج 4B المكمّم مناسب',
  }
}

/** Preference ladder per hardware tier (research: §نموذج محلي). */
const MODEL_LADDER: Record<HardwareTier, string[]> = {
  high: ['qwen3:14b', 'qwen3.8:27b', 'qwen3:30b', 'qwen2.5:14b', 'gpt-oss:20b', 'qwen3:8b'],
  mid: ['qwen3:8b', 'qwen3:14b', 'qwen2.5:7b', 'gemma3:12b', 'llama3.1:8b', 'mistral:7b'],
  low: ['qwen3:4b', 'qwen3:8b', 'gemma3:4b', 'qwen2.5:3b', 'llama3.2:3b'],
}

/** Best installed model for presentation planning on this machine, or null to use whatever exists. */
export function recommendModel(installed: string[], tier: HardwareTier): string | null {
  if (!installed.length) return null
  for (const want of MODEL_LADDER[tier]) {
    const hit = installed.find((m) => m === want || m.startsWith(`${want}:`) || m.split(':')[0] === want)
    if (hit) return hit
  }
  // Prefer qwen-family instruction models among whatever is installed.
  const qwen = installed.find((m) => /qwen(?!.*coder)/i.test(m) && !/embed|guard|vision/i.test(m))
  return qwen ?? installed[0]
}

/** Bridge the caller's signal (if any) into a locally-owned controller we can also time out. */
function linkSignal(external?: AbortSignal): AbortController {
  const controller = new AbortController()
  if (!external) return controller
  if (external.aborted) controller.abort()
  else external.addEventListener('abort', () => controller.abort(), { once: true })
  return controller
}

function makeOllamaProvider(ai: AiSettings): AIProvider {
  const base = ollamaUrl(ai)
  return {
    id: 'ollama',
    label: 'Ollama (محلي)',
    privacy: 'local',
    model: () => ai.model || 'ollama',
    generateJSON: async (req) => {
      const controller = linkSignal(req.signal)
      const timer = setTimeout(() => controller.abort(), req.timeoutMs ?? 90_000)
      try {
        const res = await fetch(`${base}/api/chat`, {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: ai.model,
            stream: false,
            format: req.jsonSchema ?? 'json',
            options: { temperature: req.temperature ?? 0.6 },
            messages: [
              { role: 'system', content: req.system },
              { role: 'user', content: req.user },
            ],
          }),
        })
        clearTimeout(timer)
        if (!res.ok) return null
        const json = (await res.json()) as { message?: { content?: string } }
        const raw = json.message?.content
        if (!raw) return null
        return { data: parseLooseJson(raw), model: ai.model || 'ollama', raw }
      } catch {
        clearTimeout(timer)
        return null
      }
    },
  }
}

/* ------------------------------------------------------------------ openai-compatible */

function makeOpenAICompatibleProvider(ai: AiSettings): AIProvider {
  return {
    id: 'openai-compatible',
    label: ai.model || ai.endpoint || 'مزوّد خارجي',
    privacy: 'cloud',
    model: () => ai.model || 'openai-compatible',
    generateJSON: async (req) => {
      if (!ai.endpoint) return null
      const controller = linkSignal(req.signal)
      const timer = setTimeout(() => controller.abort(), req.timeoutMs ?? 60_000)
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (ai.apiKey) headers.Authorization = `Bearer ${ai.apiKey}`
        const res = await fetch(ai.endpoint.replace(/\/$/, ''), {
          method: 'POST',
          signal: controller.signal,
          headers,
          body: JSON.stringify({
            model: ai.model || undefined,
            temperature: req.temperature ?? 0.6,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: req.system },
              { role: 'user', content: req.user },
            ],
          }),
        })
        clearTimeout(timer)
        if (!res.ok) return null
        const json = (await res.json()) as { choices?: { message?: { content?: string } }[] }
        const raw = json.choices?.[0]?.message?.content
        if (!raw) return null
        return { data: parseLooseJson(raw), model: ai.model || 'openai-compatible', raw }
      } catch {
        clearTimeout(timer)
        return null
      }
    },
  }
}

/* ------------------------------------------------------------------ resolution */

export type EngineKind = 'local' | 'ollama' | 'openai-compatible'

export interface ResolvedProvider {
  /** null → use the deterministic local planner */
  provider: AIProvider | null
  engine: EngineKind
  reason: string
}

/**
 * Which engine should run? Explicit user choice first, then reachability probes.
 * The local planner is always the last resort so generation never breaks (requirement 16).
 */
export async function resolveProvider(ai: AiSettings): Promise<ResolvedProvider> {
  if (ai.provider === 'ollama') {
    const status = await detectOllama(ollamaUrl(ai))
    if (status.ok) {
      const model = ai.model && status.models.some((m) => m.name === ai.model) ? ai.model : recommendModel(status.models.map((m) => m.name), hardwareProfile().tier)
      if (model) return { provider: makeOllamaProvider({ ...ai, model }), engine: 'ollama', reason: model }
      return { provider: null, engine: 'local', reason: 'Ollama يعمل لكن لا يوجد نموذج مثبّت' }
    }
    return { provider: null, engine: 'local', reason: `Ollama غير متاح (${status.error ?? 'لا استجابة'})` }
  }
  if (ai.provider === 'custom' && ai.endpoint) {
    return { provider: makeOpenAICompatibleProvider(ai), engine: 'openai-compatible', reason: ai.model || ai.endpoint }
  }
  return { provider: null, engine: 'local', reason: 'المحرك القواعدي المحلي' }
}

/* ------------------------------------------------------------------ json parsing */

/** Extract JSON from a model answer: direct parse, fenced block, or first balanced object. */
export function parseLooseJson(raw: string): unknown {
  const text = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  try {
    return JSON.parse(text)
  } catch {
    /* keep digging */
  }
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1))
    } catch {
      /* give up below */
    }
  }
  return null
}
