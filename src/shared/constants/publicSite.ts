/**
 * Public marketing website origin (www). Used for “Back to website” from auth.
 * Override with VITE_PUBLIC_SITE_ORIGIN when needed.
 */
export const PUBLIC_SITE_ORIGIN = (
  import.meta.env.VITE_PUBLIC_SITE_ORIGIN?.trim() ||
  (import.meta.env.DEV ? 'http://localhost:5174' : 'https://www.acomi.in')
).replace(/\/+$/, '');

export const PUBLIC_SITE = {
  home: `${PUBLIC_SITE_ORIGIN}/`,
  places: `${PUBLIC_SITE_ORIGIN}/places`,
  meals: `${PUBLIC_SITE_ORIGIN}/meals`,
} as const;

/** Re-export Play Store / app-open helpers used by enquiry CTAs. */
export {
  ACOMI_ANDROID_APP_URL,
  ACOMI_PLAY_STORE_URL,
  openAcomiAndroidApp,
} from '@/shared/utils/openAcomiAndroidApp';
