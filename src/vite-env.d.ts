/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Absolute URL of the Aurova Model chat endpoint; defaults to the relative /api/aurova path. */
  readonly VITE_AUROVA_API_URL?: string
}
