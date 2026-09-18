/**
 * Android app open + Play Store fallback for Web enquiry CTAs.
 *
 * Uses the custom URI scheme registered by AcomiMobile (`acomi://`) via Android Intent URLs.
 * No new browser tab — same browsing context only.
 *
 * Override Play Store URL with VITE_ANDROID_PLAY_STORE_URL when the listing is finalized.
 */

export const ACOMI_ANDROID_PACKAGE = 'com.acomi';

export const ACOMI_ANDROID_APP_SCHEME = 'acomi';

export const ACOMI_PLAY_STORE_URL = (
  import.meta.env.VITE_ANDROID_PLAY_STORE_URL?.trim() ||
  `https://play.google.com/store/apps/details?id=${ACOMI_ANDROID_PACKAGE}`
).replace(/\s+/g, '');

/** @deprecated Prefer openAcomiAndroidApp(); kept for any leftover href references. */
export const ACOMI_ANDROID_APP_URL = ACOMI_PLAY_STORE_URL;

function isAndroidBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent || '');
}

function buildDeepLinkPath(enquiryId?: string | null): string {
  const id = enquiryId?.trim();
  return id ? `enquiries/${encodeURIComponent(id)}` : 'enquiries';
}

/**
 * Attempt to open the ACOMI Android app (optionally deep-linked to an enquiry).
 * If the app is not installed on Android, the Intent browser_fallback_url opens Play Store.
 * Non-Android browsers navigate to Play Store in the same window (no target=_blank).
 */
export function openAcomiAndroidApp(options?: { enquiryId?: string | null }): void {
  const path = buildDeepLinkPath(options?.enquiryId);
  const playStoreUrl = ACOMI_PLAY_STORE_URL;

  if (isAndroidBrowser()) {
    const intentUrl =
      `intent://${path}` +
      `#Intent;scheme=${ACOMI_ANDROID_APP_SCHEME};package=${ACOMI_ANDROID_PACKAGE};` +
      `S.browser_fallback_url=${encodeURIComponent(playStoreUrl)};end`;
    window.location.assign(intentUrl);
    return;
  }

  window.location.assign(playStoreUrl);
}
