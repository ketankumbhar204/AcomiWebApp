/** Configurable limits for admin promotional media shared via WhatsApp (local only). */

export const MARKETING_MEDIA_MAX_FILES = 10;
export const MARKETING_MEDIA_MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MARKETING_MEDIA_MAX_VIDEO_BYTES = 100 * 1024 * 1024;

export const MARKETING_MEDIA_IMAGE_MIMES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

export const MARKETING_MEDIA_VIDEO_MIMES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/3gpp',
] as const;

export const MARKETING_MEDIA_ACCEPT =
  'image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm,video/3gpp';

export type MarketingMediaKind = 'image' | 'video';

export type MarketingMediaValidationCode =
  | 'TOO_MANY'
  | 'UNSUPPORTED'
  | 'IMAGE_TOO_LARGE'
  | 'VIDEO_TOO_LARGE';

export type MarketingMediaCandidate = {
  name: string;
  mime: string;
  size: number;
};

function normalizeMime(mime: string | null | undefined): string {
  return ((mime ?? '').split(';')[0] ?? '').trim().toLowerCase();
}

export function marketingMediaKind(mime: string | null | undefined): MarketingMediaKind | null {
  const normalized = normalizeMime(mime);
  if (
    normalized === 'image/jpeg' ||
    normalized === 'image/jpg' ||
    normalized === 'image/png' ||
    normalized === 'image/webp'
  ) {
    return 'image';
  }
  if (
    normalized === 'video/mp4' ||
    normalized === 'video/quicktime' ||
    normalized === 'video/webm' ||
    normalized === 'video/3gpp'
  ) {
    return 'video';
  }
  return null;
}

export function marketingMediaMaxMb(kind: MarketingMediaKind): number {
  const bytes = kind === 'image' ? MARKETING_MEDIA_MAX_IMAGE_BYTES : MARKETING_MEDIA_MAX_VIDEO_BYTES;
  return Math.max(1, Math.floor(bytes / (1024 * 1024)));
}

export function validateMarketingMediaAddition(
  existingCount: number,
  candidates: MarketingMediaCandidate[],
): { ok: true; accepted: MarketingMediaCandidate[] } | { ok: false; code: MarketingMediaValidationCode } {
  if (existingCount + candidates.length > MARKETING_MEDIA_MAX_FILES) {
    return { ok: false, code: 'TOO_MANY' };
  }
  for (const candidate of candidates) {
    const kind = marketingMediaKind(candidate.mime);
    if (!kind) {
      return { ok: false, code: 'UNSUPPORTED' };
    }
    if (kind === 'image' && candidate.size > MARKETING_MEDIA_MAX_IMAGE_BYTES) {
      return { ok: false, code: 'IMAGE_TOO_LARGE' };
    }
    if (kind === 'video' && candidate.size > MARKETING_MEDIA_MAX_VIDEO_BYTES) {
      return { ok: false, code: 'VIDEO_TOO_LARGE' };
    }
  }
  return { ok: true, accepted: candidates };
}

function mimeFromFileName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.mov')) return 'video/quicktime';
  if (lower.endsWith('.webm')) return 'video/webm';
  if (lower.endsWith('.3gp') || lower.endsWith('.3gpp')) return 'video/3gpp';
  if (lower.endsWith('.mp4') || lower.endsWith('.m4v')) return 'video/mp4';
  return 'application/octet-stream';
}

/**
 * Ensure File objects have a usable MIME type for Web Share.
 * Prefer the original input File (disk-backed). Avoid arrayBuffer clones — Windows Share
 * to WhatsApp Desktop often drops in-memory reconstructed files.
 */
export async function normalizeMarketingShareFiles(files: File[]): Promise<File[]> {
  const normalized: File[] = [];
  for (const file of files) {
    const type = normalizeMime(file.type) || mimeFromFileName(file.name);
    if (file.type && normalizeMime(file.type) === type) {
      normalized.push(file);
      continue;
    }
    // Same blob bits, corrected MIME — do not re-read via arrayBuffer.
    normalized.push(new File([file], file.name || `media-${normalized.length + 1}`, { type }));
  }
  return normalized;
}

export function canShareMarketingFiles(files: File[]): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    return false;
  }
  if (files.length === 0) {
    return false;
  }
  if (typeof navigator.canShare !== 'function') {
    return true;
  }
  try {
    if (navigator.canShare({ files })) {
      return true;
    }
    return navigator.canShare({ files: [files[0]] });
  } catch {
    return false;
  }
}

export function canShareMarketingText(text?: string): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    return false;
  }
  const trimmed = text?.trim();
  if (!trimmed) {
    return false;
  }
  if (typeof navigator.canShare === 'function') {
    try {
      return navigator.canShare({ text: trimmed });
    } catch {
      return false;
    }
  }
  return true;
}

export type MarketingMediaShareResult =
  | 'shared'
  | 'cancelled'
  | 'unsupported'
  | 'failed'
  | 'partial';

/** Safe diagnostics only — no file contents, paths, or personal data. */
export type MarketingShareCapabilityReport = {
  hasShare: boolean;
  hasCanShare: boolean;
  fileCount: number;
  fileMimeTypes: string[];
  canShareFiles: boolean | null;
  canShareFilesAndText: boolean | null;
  canShareText: boolean | null;
  platform: string;
  userAgentBrand: string;
  attemptedPayload: 'none' | 'files' | 'files_and_text' | 'text';
  shareErrorName: string | null;
  shareErrorMessage: string | null;
  fallbackReason:
    | 'none'
    | 'no_share_api'
    | 'can_share_files_false'
    | 'share_threw'
    | 'share_failed'
    | 'cancelled';
};

function detectPlatformLabel(): string {
  if (typeof navigator === 'undefined') {
    return 'unknown';
  }
  const platform = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData
    ?.platform;
  if (platform) {
    return platform;
  }
  const ua = navigator.userAgent || '';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Mac OS X|Macintosh/i.test(ua)) return 'macOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'unknown';
}

function detectUserAgentBrand(): string {
  if (typeof navigator === 'undefined') {
    return 'unknown';
  }
  const brands = (navigator as Navigator & { userAgentData?: { brands?: Array<{ brand: string }> } })
    .userAgentData?.brands;
  if (brands?.length) {
    return brands.map((item) => item.brand).join(', ');
  }
  const ua = navigator.userAgent || '';
  if (/Edg\//i.test(ua)) return 'Edge';
  if (/Chrome\//i.test(ua)) return 'Chrome';
  if (/Firefox\//i.test(ua)) return 'Firefox';
  if (/Safari\//i.test(ua)) return 'Safari';
  return 'unknown';
}

export function probeMarketingShareCapability(
  files: File[],
  text?: string,
): MarketingShareCapabilityReport {
  const trimmed = text?.trim() || '';
  const report: MarketingShareCapabilityReport = {
    hasShare: typeof navigator !== 'undefined' && typeof navigator.share === 'function',
    hasCanShare: typeof navigator !== 'undefined' && typeof navigator.canShare === 'function',
    fileCount: files.length,
    fileMimeTypes: files.map((file) => normalizeMime(file.type) || mimeFromFileName(file.name)),
    canShareFiles: null,
    canShareFilesAndText: null,
    canShareText: null,
    platform: detectPlatformLabel(),
    userAgentBrand: detectUserAgentBrand(),
    attemptedPayload: 'none',
    shareErrorName: null,
    shareErrorMessage: null,
    fallbackReason: 'none',
  };

  if (!report.hasShare) {
    report.fallbackReason = 'no_share_api';
    return report;
  }

  if (report.hasCanShare) {
    try {
      report.canShareText = trimmed ? navigator.canShare({ text: trimmed }) : null;
    } catch {
      report.canShareText = false;
    }
    if (files.length > 0) {
      try {
        report.canShareFiles = navigator.canShare({ files });
      } catch {
        report.canShareFiles = false;
      }
      if (trimmed) {
        try {
          report.canShareFilesAndText = navigator.canShare({ files, text: trimmed });
        } catch {
          report.canShareFilesAndText = false;
        }
      }
    }
  }

  return report;
}

/** Trigger browser downloads when Web Share file transfer is unavailable. */
export function downloadMarketingFiles(files: File[]): void {
  files.forEach((file, index) => {
    setTimeout(() => {
      const href = URL.createObjectURL(file);
      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.download = file.name || `acomi-media-${index + 1}`;
      anchor.rel = 'noopener';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(href), 1500);
    }, index * 250);
  });
}

function errorName(error: unknown): string {
  if (error instanceof DOMException) return error.name;
  if (error instanceof Error) return error.name || 'Error';
  return 'UnknownError';
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message || error.name;
  return String(error);
}

async function shareTextOnly(text: string): Promise<{
  result: MarketingMediaShareResult;
  errorName: string | null;
  errorMessage: string | null;
}> {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    return { result: 'unsupported', errorName: null, errorMessage: null };
  }
  try {
    await navigator.share({
      text,
      title: 'ACOMI listing message',
    });
    return { result: 'shared', errorName: null, errorMessage: null };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { result: 'cancelled', errorName: 'AbortError', errorMessage: errorMessage(error) };
    }
    return {
      result: 'failed',
      errorName: errorName(error),
      errorMessage: errorMessage(error),
    };
  }
}

/**
 * Share files only (no text/title). WhatsApp Desktop opens “Send message to” with media when
 * the OS share hands it a bare file. Including text opens WhatsApp without that contact picker.
 * Callers must copy the caption to the clipboard separately.
 */
async function shareFilesOnly(files: File[]): Promise<{
  result: MarketingMediaShareResult;
  attemptedPayload: MarketingShareCapabilityReport['attemptedPayload'];
  errorName: string | null;
  errorMessage: string | null;
}> {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    return {
      result: 'unsupported',
      attemptedPayload: 'none',
      errorName: null,
      errorMessage: null,
    };
  }
  if (files.length === 0) {
    return {
      result: 'unsupported',
      attemptedPayload: 'none',
      errorName: null,
      errorMessage: null,
    };
  }

  try {
    await navigator.share({ files });
    return {
      result: 'shared',
      attemptedPayload: 'files',
      errorName: null,
      errorMessage: null,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        result: 'cancelled',
        attemptedPayload: 'files',
        errorName: 'AbortError',
        errorMessage: errorMessage(error),
      };
    }
    return {
      result: 'failed',
      attemptedPayload: 'files',
      errorName: errorName(error),
      errorMessage: errorMessage(error),
    };
  }
}

/**
 * System share for Share message and media mode.
 * Always shares one file at a time with NO caption text — that is what triggers WhatsApp Desktop’s
 * “Send message to” popup with the attachment. Callers must copy the message to the clipboard.
 */
export async function shareMarketingFilesViaWebShare(
  files: File[],
  text?: string,
): Promise<{
  result: MarketingMediaShareResult;
  capability: MarketingShareCapabilityReport;
}> {
  const normalized = files.length > 0 ? await normalizeMarketingShareFiles(files) : [];
  const capability = probeMarketingShareCapability(normalized, text);
  const trimmed = text?.trim() || undefined;

  if (normalized.length === 0) {
    if (!trimmed || !canShareMarketingText(trimmed)) {
      capability.fallbackReason = capability.hasShare ? 'can_share_files_false' : 'no_share_api';
      return { result: 'unsupported', capability };
    }
    capability.attemptedPayload = 'text';
    const textShare = await shareTextOnly(trimmed);
    capability.shareErrorName = textShare.errorName;
    capability.shareErrorMessage = textShare.errorMessage;
    if (textShare.result === 'cancelled') {
      capability.fallbackReason = 'cancelled';
    } else if (textShare.result === 'failed') {
      capability.fallbackReason = 'share_threw';
    }
    return { result: textShare.result, capability };
  }

  if (!capability.hasShare) {
    capability.fallbackReason = 'no_share_api';
    return { result: 'unsupported', capability };
  }

  // Multi-file canShare often returns false on desktop while single-file still works.
  if (capability.hasCanShare && capability.canShareFiles === false) {
    let singleFileAllowed = false;
    try {
      singleFileAllowed = navigator.canShare({ files: [normalized[0]] });
    } catch {
      singleFileAllowed = false;
    }
    if (!singleFileAllowed) {
      capability.fallbackReason = 'can_share_files_false';
      return { result: 'unsupported', capability };
    }
    capability.canShareFiles = true;
  }

  let sharedCount = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    const batch = [normalized[index]];
    if (typeof navigator.canShare === 'function') {
      try {
        if (!navigator.canShare({ files: batch })) {
          if (sharedCount === 0) {
            capability.canShareFiles = false;
            capability.fallbackReason = 'can_share_files_false';
            return { result: 'unsupported', capability };
          }
          break;
        }
      } catch {
        // try share anyway — some Chromium builds report false but share works
      }
    }

    // Never pass text here — file+text skips WhatsApp Desktop’s contact picker.
    const shareAttempt = await shareFilesOnly(batch);
    capability.attemptedPayload = shareAttempt.attemptedPayload;
    capability.shareErrorName = shareAttempt.errorName;
    capability.shareErrorMessage = shareAttempt.errorMessage;

    if (shareAttempt.result === 'cancelled' && sharedCount === 0) {
      capability.fallbackReason = 'cancelled';
      return { result: 'cancelled', capability };
    }
    if (shareAttempt.result === 'shared') {
      sharedCount += 1;
    } else if (sharedCount === 0) {
      capability.fallbackReason = 'share_threw';
      return { result: shareAttempt.result, capability };
    } else {
      capability.fallbackReason = 'share_failed';
      break;
    }
  }

  if (sharedCount === 0) {
    capability.fallbackReason =
      capability.fallbackReason === 'none' ? 'share_failed' : capability.fallbackReason;
    return { result: 'unsupported', capability };
  }

  capability.fallbackReason = 'none';
  return {
    result: sharedCount < normalized.length ? 'partial' : 'shared',
    capability,
  };
}

export type MarketingSystemSharePrep =
  | {
      mode: 'web_share';
      result: MarketingMediaShareResult;
      capability: MarketingShareCapabilityReport;
    }
  | {
      mode: 'download_share';
      downloaded: number;
      capability: MarketingShareCapabilityReport;
      reason: MarketingShareCapabilityReport['fallbackReason'];
    };

/**
 * Prefer navigator.share({ files }) (no text) when the browser supports it.
 * Fall back to downloads only when file sharing is unavailable or share fails.
 */
export async function prepareMarketingSystemShare(
  files: File[],
  text?: string,
): Promise<MarketingSystemSharePrep> {
  const normalized = files.length > 0 ? await normalizeMarketingShareFiles(files) : [];
  const { result, capability } = await shareMarketingFilesViaWebShare(normalized, text);

  if (result === 'cancelled') {
    return { mode: 'web_share', result, capability };
  }

  if (result === 'unsupported' || result === 'failed') {
    if (normalized.length > 0) {
      downloadMarketingFiles(normalized);
      return {
        mode: 'download_share',
        downloaded: normalized.length,
        capability,
        reason: capability.fallbackReason === 'none' ? 'share_failed' : capability.fallbackReason,
      };
    }
    return { mode: 'web_share', result, capability };
  }

  return { mode: 'web_share', result, capability };
}

/** @deprecated Prefer prepareMarketingSystemShare; kept for clarity in platform docs. */
export function isDesktopWindowsBrowser(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  const ua = navigator.userAgent || '';
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) {
    return false;
  }
  const platform = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData
    ?.platform;
  if (platform === 'Windows') {
    return true;
  }
  return /Windows/i.test(ua);
}
