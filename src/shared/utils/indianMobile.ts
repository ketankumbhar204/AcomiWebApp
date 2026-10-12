/** Valid 10-digit Indian mobile: first digit 6–9 (matches backend auth validation). */
export const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

/**
 * Strips spaces/dashes and a pasted +91 / 91 / 0 prefix so paste-from-contacts works.
 * Returns at most 10 digits for the national number (storage format).
 */
export function normalizeIndianMobileDigits(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) {
    return '';
  }
  if (digits.length > 10 && digits.startsWith('91')) {
    return digits.slice(-10);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits.slice(0, 10);
}

export function isValidIndianMobile(value: string): boolean {
  return INDIAN_MOBILE_REGEX.test(normalizeIndianMobileDigits(value));
}

/**
 * Owner-facing contact line. Valid Indian numbers use +91 and the full national number.
 * Returns null when nothing is stored so the caller can show a fallback.
 */
export function formatMemberContactNumber(value: string | null | undefined): string | null {
  const raw = value?.trim() ?? '';
  if (!raw) {
    return null;
  }
  const digits = raw.replace(/\D/g, '');
  let national = digits;
  if (digits.length > 10 && digits.startsWith('91')) {
    national = digits.slice(-10);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    national = digits.slice(1);
  }
  if (INDIAN_MOBILE_REGEX.test(national)) {
    return `+91 ${national}`;
  }
  return raw;
}

/** Display / dial form: +91XXXXXXXXXX (storage stays 10 digits). */
export function formatIndianMobileWithCountryCode(value: string | null | undefined): string {
  const digits = normalizeIndianMobileDigits(value ?? '');
  if (!INDIAN_MOBILE_REGEX.test(digits)) {
    return (value ?? '').trim();
  }
  return `+91${digits}`;
}

/** Display form: +91 XXXXXX3210 */
export function maskIndianMobile(value: string): string {
  const digits = normalizeIndianMobileDigits(value);
  if (digits.length !== 10) {
    return '+91 XXXXXXXXXX';
  }
  return `+91 XXXXXX${digits.slice(6)}`;
}
