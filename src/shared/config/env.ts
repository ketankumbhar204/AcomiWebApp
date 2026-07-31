/**
 * Runtime environment configuration.
 * Values come from Vite `import.meta.env` (see `.env.example`).
 */
export type AppEnvironment = 'development' | 'staging' | 'production';

function readString(key: keyof ImportMetaEnv, fallback: string): string {
  const value = import.meta.env[key];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function readNumber(key: keyof ImportMetaEnv, fallback: number): number {
  const raw = import.meta.env[key];
  if (typeof raw !== 'string' || raw.length === 0) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readEnvironment(): AppEnvironment {
  const value = readString('VITE_APP_ENV', 'development');
  if (value === 'staging' || value === 'production' || value === 'development') {
    return value;
  }
  return 'development';
}

export const env = {
  environment: readEnvironment(),
  /** Must include `/api/v1` — matches mobile `env.apiBaseUrl`. */
  apiBaseUrl: readString('VITE_API_BASE_URL', 'http://localhost:8080/api/v1'),
  apiTimeoutMs: readNumber('VITE_API_TIMEOUT_MS', 30_000),
  isDevelopment: import.meta.env.DEV,
} as const;
