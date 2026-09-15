/**
 * Aurova — AI provider catalog + unified chat client.
 *
 * The user never types an endpoint: they pick a provider, pick a model from that provider's
 * list, and paste their own API key (stored in this browser only). Every provider is reached
 * through one function, `chat()`, which hides the wire-format differences (OpenAI-compatible,
 * Anthropic Messages, Google Gemini) from the generation/refine/review services.
 *
 * `aurova` is our own model: it speaks the same OpenAI-compatible schema but is served from
 * our backend (see `services/ai/aurova.ts` + docs/AUROVA_MODEL.md) and needs no user key.
 */

export type ProviderId = 'local' | 'aurova' | 'openai' | 'anthropic' | 'gemini' | 'mistral' | 'groq' | 'deepseek' | 'openrouter' | 'custom'

export type WireFormat = 'openai' | 'anthropic' | 'gemini'

export interface ModelDef {
  id: string
  label: string
  /** Short hint shown next to the model in the picker. */
  hint?: string
  /** Supports `response_format: json_object` (OpenAI wire only). */
  json?: boolean
}

export interface ProviderDef {
  id: ProviderId
  label: string
  /** Where to get a key; shown as a link in settings. */
  keysUrl?: string
  /** Fixed chat endpoint. For `custom` the user supplies it; for `local` there is none. */
  endpoint: string
  wire: WireFormat
  needsKey: boolean
  keyPlaceholder?: string
  models: ModelDef[]
  /** One-line description shown in settings. */
  blurb: string
}

const AUROVA_ENDPOINT = (import.meta.env.VITE_AUROVA_API_URL as string | undefined)?.replace(/\/$/, '') || '/api/aurova/v1/chat/completions'

export const PROVIDERS: ProviderDef[] = [
  {
    id: 'local',
    label: 'محلي (في المتصفح)',
    endpoint: '',
    wire: 'openai',
    needsKey: false,
    models: [],
    blurb: 'مخطِّط حتمي يعمل بلا اتصال: يبني الهيكل ويعيد الصياغة بقواعد لغوية، ولا يرسل أي بيانات.',
  },
  {
    id: 'aurova',
    label: 'Aurova Model — نموذجنا',
    endpoint: AUROVA_ENDPOINT,
    wire: 'openai',
    needsKey: false,
    models: [
      { id: 'aurova-deck-1', label: 'Aurova Deck 1', hint: 'مضبوط على هيكلة العروض العربية/الإنجليزية', json: true },
      { id: 'aurova-deck-1-mini', label: 'Aurova Deck 1 Mini', hint: 'أسرع وأخف — لإعادة الصياغة والمراجعة', json: true },
    ],
    blurb: 'نموذج Aurova الخاص، مدرَّب على بنية العروض التقديمية (شريحة/تخطيط/نقاط) والعربية RTL. يعمل عبر خادم Aurova بلا مفتاح من المستخدم.',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    keysUrl: 'https://platform.openai.com/api-keys',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    wire: 'openai',
    needsKey: true,
    keyPlaceholder: 'sk-…',
    models: [
      { id: 'gpt-4.1', label: 'GPT-4.1', json: true },
      { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', hint: 'سريع واقتصادي', json: true },
      { id: 'gpt-4o', label: 'GPT-4o', json: true },
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini', json: true },
      { id: 'o4-mini', label: 'o4-mini', hint: 'استدلال', json: true },
    ],
    blurb: 'واجهة Chat Completions الرسمية من OpenAI.',
  },
  {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    keysUrl: 'https://console.anthropic.com/settings/keys',
    endpoint: 'https://api.anthropic.com/v1/messages',
    wire: 'anthropic',
    needsKey: true,
    keyPlaceholder: 'sk-ant-…',
    models: [
      { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
      { id: 'claude-opus-4-20250514', label: 'Claude Opus 4', hint: 'الأقوى' },
      { id: 'claude-3-5-haiku-latest', label: 'Claude 3.5 Haiku', hint: 'الأسرع' },
    ],
    blurb: 'Messages API من Anthropic مع تفعيل الوصول من المتصفح.',
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    keysUrl: 'https://aistudio.google.com/app/apikey',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    wire: 'gemini',
    needsKey: true,
    keyPlaceholder: 'AIza…',
    models: [
      { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', hint: 'سريع' },
      { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    ],
    blurb: 'Gemini API عبر Google AI Studio.',
  },
  {
    id: 'mistral',
    label: 'Mistral',
    keysUrl: 'https://console.mistral.ai/api-keys',
    endpoint: 'https://api.mistral.ai/v1/chat/completions',
    wire: 'openai',
    needsKey: true,
    models: [
      { id: 'mistral-large-latest', label: 'Mistral Large', json: true },
      { id: 'mistral-medium-latest', label: 'Mistral Medium', json: true },
      { id: 'mistral-small-latest', label: 'Mistral Small', hint: 'اقتصادي', json: true },
    ],
    blurb: 'نماذج Mistral الأوروبية بواجهة متوافقة مع OpenAI.',
  },
  {
    id: 'groq',
    label: 'Groq',
    keysUrl: 'https://console.groq.com/keys',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    wire: 'openai',
    needsKey: true,
    keyPlaceholder: 'gsk_…',
    models: [
      { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B', json: true },
      { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B', hint: 'فوري', json: true },
      { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B', json: true },
    ],
    blurb: 'استدلال فائق السرعة لنماذج مفتوحة.',
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    keysUrl: 'https://platform.deepseek.com/api_keys',
    endpoint: 'https://api.deepseek.com/chat/completions',
    wire: 'openai',
    needsKey: true,
    models: [
      { id: 'deepseek-chat', label: 'DeepSeek V3', json: true },
      { id: 'deepseek-reasoner', label: 'DeepSeek R1', hint: 'استدلال' },
    ],
    blurb: 'نماذج DeepSeek بواجهة متوافقة مع OpenAI.',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    keysUrl: 'https://openrouter.ai/keys',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    wire: 'openai',
    needsKey: true,
    keyPlaceholder: 'sk-or-…',
    models: [
      { id: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4' },
      { id: 'openai/gpt-4.1', label: 'GPT-4.1', json: true },
      { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
      { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B' },
      { id: 'qwen/qwen3-235b-a22b', label: 'Qwen3 235B' },
    ],
    blurb: 'بوابة واحدة لعشرات النماذج بمفتاح واحد.',
  },
  {
    id: 'custom',
    label: 'متوافق مع OpenAI (مخصّص)',
    endpoint: '',
    wire: 'openai',
    needsKey: false,
    models: [],
    blurb: 'أي خادم يطبّق /v1/chat/completions — للفرق التي تستضيف نماذجها بنفسها.',
  },
]

export const PROVIDER_MAP: Record<ProviderId, ProviderDef> = Object.fromEntries(PROVIDERS.map((p) => [p.id, p])) as Record<ProviderId, ProviderDef>

export function providerDef(id: ProviderId): ProviderDef {
  return PROVIDER_MAP[id] ?? PROVIDER_MAP.local
}

export function defaultModel(id: ProviderId): string {
  return providerDef(id).models[0]?.id ?? ''
}

/* ------------------------------------------------------------------ unified client */

export interface AiConn {
  provider: ProviderId
  model: string
  apiKey?: string
  /** Only meaningful for `custom`. */
  endpoint?: string
}

export interface ChatRequest {
  system: string
  user: string
  temperature?: number
  /** Ask for a JSON object where the wire supports it. */
  json?: boolean
  timeoutMs?: number
  maxTokens?: number
}

/** True when the connection can actually make a remote call. */
export function isRemoteReady(conn: AiConn): boolean {
  const def = providerDef(conn.provider)
  if (def.id === 'local') return false
  if (def.id === 'custom') return !!conn.endpoint?.trim()
  if (def.needsKey && !conn.apiKey?.trim()) return false
  return true
}

/** Human label used in toasts ("المصدر: …"). */
export function connLabel(conn: AiConn): string {
  const def = providerDef(conn.provider)
  if (def.id === 'local') return 'محرك Aurova المحلي'
  if (def.id === 'custom') return conn.model || conn.endpoint || 'مزوّد مخصّص'
  const m = def.models.find((x) => x.id === conn.model)
  return `${def.label}${m ? ` · ${m.label}` : conn.model ? ` · ${conn.model}` : ''}`
}

/**
 * Send one system+user exchange and return the assistant text, or `null` on any failure.
 * Callers always have a local fallback, so errors are swallowed on purpose.
 */
export async function chat(conn: AiConn, req: ChatRequest): Promise<string | null> {
  if (!isRemoteReady(conn)) return null
  const def = providerDef(conn.provider)
  const model = conn.model || defaultModel(def.id)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), req.timeoutMs ?? 25000)
  try {
    switch (def.wire) {
      case 'anthropic':
        return await callAnthropic(def, conn, model, req, controller.signal)
      case 'gemini':
        return await callGemini(def, conn, model, req, controller.signal)
      default:
        return await callOpenAI(def, conn, model, req, controller.signal)
    }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

async function callOpenAI(def: ProviderDef, conn: AiConn, model: string, req: ChatRequest, signal: AbortSignal): Promise<string | null> {
  const endpoint = (def.id === 'custom' ? conn.endpoint ?? '' : def.endpoint).replace(/\/$/, '')
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (conn.apiKey?.trim()) headers.Authorization = `Bearer ${conn.apiKey.trim()}`
  if (def.id === 'openrouter') {
    headers['HTTP-Referer'] = location.origin
    headers['X-Title'] = 'Aurova Studio'
  }
  const supportsJson = def.models.find((m) => m.id === model)?.json ?? (def.id === 'custom' || def.id === 'aurova')
  const res = await fetch(endpoint, {
    method: 'POST',
    signal,
    headers,
    body: JSON.stringify({
      model,
      temperature: req.temperature ?? 0.5,
      ...(req.maxTokens ? { max_tokens: req.maxTokens } : {}),
      ...(req.json && supportsJson ? { response_format: { type: 'json_object' } } : {}),
      messages: [
        { role: 'system', content: req.system },
        { role: 'user', content: req.user },
      ],
    }),
  })
  if (!res.ok) return null
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  const content = json.choices?.[0]?.message?.content
  return typeof content === 'string' ? content.trim() : null
}

async function callAnthropic(def: ProviderDef, conn: AiConn, model: string, req: ChatRequest, signal: AbortSignal): Promise<string | null> {
  const res = await fetch(def.endpoint, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': conn.apiKey?.trim() ?? '',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: req.maxTokens ?? 2048,
      temperature: req.temperature ?? 0.5,
      system: req.system + (req.json ? '\nأعد كائن JSON صالحًا فقط دون أي نص آخر.' : ''),
      messages: [{ role: 'user', content: req.user }],
    }),
  })
  if (!res.ok) return null
  const json = (await res.json()) as { content?: { type: string; text?: string }[] }
  const text = json.content?.filter((c) => c.type === 'text').map((c) => c.text ?? '').join('')
  return text?.trim() || null
}

async function callGemini(def: ProviderDef, conn: AiConn, model: string, req: ChatRequest, signal: AbortSignal): Promise<string | null> {
  const url = `${def.endpoint}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(conn.apiKey?.trim() ?? '')}`
  const res = await fetch(url, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: req.system }] },
      contents: [{ role: 'user', parts: [{ text: req.user }] }],
      generationConfig: {
        temperature: req.temperature ?? 0.5,
        ...(req.maxTokens ? { maxOutputTokens: req.maxTokens } : {}),
        ...(req.json ? { responseMimeType: 'application/json' } : {}),
      },
    }),
  })
  if (!res.ok) return null
  const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('')
  return text?.trim() || null
}

/** Build a connection from the persisted settings shape (keys are stored per provider). */
export function toConn(ai: { provider: ProviderId; model: string; endpoint: string; keys: Partial<Record<ProviderId, string>> }): AiConn {
  return { provider: ai.provider, model: ai.model, endpoint: ai.endpoint, apiKey: ai.keys[ai.provider] }
}
