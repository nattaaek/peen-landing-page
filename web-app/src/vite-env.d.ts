/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_PEEN_API_URL: string
  /** Local dev only (`vite dev`). Ignored in production builds. */
  readonly VITE_DEV_AUTH_BYPASS?: string
  readonly VITE_DEV_ACCESS_TOKEN?: string
  readonly VITE_DEV_USER_ID?: string
  readonly VITE_DEV_USER_EMAIL?: string
  readonly VITE_DEV_USER_NAME?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
