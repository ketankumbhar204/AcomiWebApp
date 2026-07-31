import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { STORAGE_KEYS } from '@/shared/constants/storageKeys';
import en from './locales/en.json';
import hi from './locales/hi.json';
import kn from './locales/kn.json';
import mr from './locales/mr.json';
import ta from './locales/ta.json';
import te from './locales/te.json';

export const SUPPORTED_LANGUAGES = ['en', 'hi', 'mr', 'kn', 'te', 'ta'] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  mr: { translation: mr },
  kn: { translation: kn },
  te: { translation: te },
  ta: { translation: ta },
} as const;

function isSupportedLanguage(code: string): code is AppLanguage {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(code);
}

function detectBrowserLanguage(): AppLanguage {
  if (typeof navigator === 'undefined') {
    return 'en';
  }
  const candidates = [navigator.language, ...(navigator.languages ?? [])];
  for (const locale of candidates) {
    const code = locale.split('-')[0]?.toLowerCase();
    if (code && isSupportedLanguage(code)) {
      return code;
    }
  }
  return 'en';
}

function readStoredLanguage(): AppLanguage | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.appLanguage);
    if (stored && isSupportedLanguage(stored)) {
      return stored;
    }
  } catch {
    // ignore
  }
  return null;
}

const initialLanguage = readStoredLanguage() ?? detectBrowserLanguage();

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
  react: {
    useSuspense: false,
  },
});

export async function changeAppLanguage(language: AppLanguage): Promise<void> {
  await i18n.changeLanguage(language);
  try {
    localStorage.setItem(STORAGE_KEYS.appLanguage, language);
  } catch {
    // ignore
  }
}

export { i18n };
