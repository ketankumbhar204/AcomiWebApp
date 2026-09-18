/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_TIMEOUT_MS: string;
  readonly VITE_APP_ENV: string;
  /** Official Google Play listing for ACOMI Android (override when finalized). */
  readonly VITE_ANDROID_PLAY_STORE_URL?: string;
  readonly VITE_PUBLIC_SITE_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
