import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MARKETING_MEDIA_MAX_FILES,
  MARKETING_MEDIA_MAX_IMAGE_BYTES,
  MARKETING_MEDIA_MAX_VIDEO_BYTES,
  canShareMarketingFiles,
  canShareMarketingText,
  marketingMediaKind,
  prepareMarketingSystemShare,
  shareMarketingFilesViaWebShare,
  validateMarketingMediaAddition,
} from './marketingMediaLimits';

describe('marketingMediaLimits', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('classifies supported mime types', () => {
    expect(marketingMediaKind('image/webp')).toBe('image');
    expect(marketingMediaKind('video/webm')).toBe('video');
    expect(marketingMediaKind('image/gif')).toBeNull();
  });

  it('accepts mixed valid media under the file count limit', () => {
    const result = validateMarketingMediaAddition(2, [
      { name: 'a.png', mime: 'image/png', size: 1024 },
      { name: 'b.mp4', mime: 'video/mp4', size: 2048 },
    ]);
    expect(result.ok).toBe(true);
  });

  it('rejects too many files, oversized media, and unsupported types', () => {
    const tooMany = validateMarketingMediaAddition(MARKETING_MEDIA_MAX_FILES, [
      { name: 'a.jpg', mime: 'image/jpeg', size: 10 },
    ]);
    expect(tooMany.ok).toBe(false);
    if (!tooMany.ok) expect(tooMany.code).toBe('TOO_MANY');

    const image = validateMarketingMediaAddition(0, [
      { name: 'big.jpg', mime: 'image/jpeg', size: MARKETING_MEDIA_MAX_IMAGE_BYTES + 1 },
    ]);
    expect(image.ok).toBe(false);
    if (!image.ok) expect(image.code).toBe('IMAGE_TOO_LARGE');

    const video = validateMarketingMediaAddition(0, [
      { name: 'big.mp4', mime: 'video/mp4', size: MARKETING_MEDIA_MAX_VIDEO_BYTES + 1 },
    ]);
    expect(video.ok).toBe(false);
    if (!video.ok) expect(video.code).toBe('VIDEO_TOO_LARGE');

    const unsupported = validateMarketingMediaAddition(0, [
      { name: 'x.bmp', mime: 'image/bmp', size: 10 },
    ]);
    expect(unsupported.ok).toBe(false);
    if (!unsupported.ok) expect(unsupported.code).toBe('UNSUPPORTED');
  });

  it('detects Web Share file and text support via canShare', () => {
    const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
    vi.stubGlobal('navigator', {
      share: vi.fn(),
      canShare: (payload: { files?: File[]; text?: string }) =>
        Boolean(payload.files?.length || payload.text),
    });
    expect(canShareMarketingFiles([file])).toBe(true);
    expect(canShareMarketingText('Hello')).toBe(true);
    expect(canShareMarketingText('  ')).toBe(false);
  });

  it('shares a single file without text so WhatsApp Desktop can show Send message to', async () => {
    const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      userAgentData: { platform: 'Windows', brands: [{ brand: 'Chrome' }] },
      share,
      canShare: (payload: { files?: File[]; text?: string }) =>
        Boolean(payload.files?.length === 1),
    });
    const { result, capability } = await shareMarketingFilesViaWebShare([file], 'Promo text');
    expect(result).toBe('shared');
    expect(share).toHaveBeenCalledWith({
      files: [file],
    });
    expect(share.mock.calls[0][0].text).toBeUndefined();
    expect(share.mock.calls[0][0].title).toBeUndefined();
    expect(capability.canShareFiles).toBe(true);
    expect(capability.attemptedPayload).toBe('files');
    expect(capability.fallbackReason).toBe('none');
  });

  it('shares multiple files one-by-one', async () => {
    const a = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
    const b = new File(['y'], 'b.jpg', { type: 'image/jpeg' });
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      share,
      canShare: (payload: { files?: File[]; text?: string }) =>
        Boolean(payload.files && payload.files.length === 1) && !payload.text,
    });
    const { result } = await shareMarketingFilesViaWebShare([a, b], 'Hello');
    expect(result).toBe('shared');
    expect(share).toHaveBeenCalledTimes(2);
    expect(share.mock.calls[0][0].files).toEqual([a]);
    expect(share.mock.calls[1][0].files).toEqual([b]);
  });

  it('returns cancelled when the system share sheet is dismissed', async () => {
    const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
    vi.stubGlobal('navigator', {
      share: vi.fn().mockRejectedValue(new DOMException('AbortError', 'AbortError')),
      canShare: () => true,
    });
    const { result, capability } = await shareMarketingFilesViaWebShare([file], 'Hi');
    expect(result).toBe('cancelled');
    expect(capability.fallbackReason).toBe('cancelled');
    expect(capability.shareErrorName).toBe('AbortError');
  });

  it('returns unsupported when canShare({ files }) is false', async () => {
    const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
    const share = vi.fn();
    vi.stubGlobal('navigator', {
      share,
      canShare: () => false,
    });
    const { result, capability } = await shareMarketingFilesViaWebShare([file], 'Hi');
    expect(result).toBe('unsupported');
    expect(share).not.toHaveBeenCalled();
    expect(capability.canShareFiles).toBe(false);
    expect(capability.fallbackReason).toBe('can_share_files_false');
  });

  it('falls back to download_share when Web Share is unavailable', async () => {
    const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
    const click = vi.fn();
    vi.stubGlobal('navigator', {
      share: undefined,
      canShare: undefined,
      userAgent: 'Mozilla/5.0',
    });
    vi.stubGlobal('URL', {
      createObjectURL: () => 'blob:test',
      revokeObjectURL: vi.fn(),
    });
    vi.stubGlobal('document', {
      createElement: () => ({ href: '', download: '', rel: '', click, remove: vi.fn() }),
      body: { appendChild: vi.fn((node: unknown) => node) },
    });
    vi.stubGlobal(
      'setTimeout',
      ((fn: (...args: unknown[]) => void) => {
        fn();
        return 0;
      }) as unknown as typeof setTimeout,
    );

    const prep = await prepareMarketingSystemShare([file], 'Hello');
    expect(prep.mode).toBe('download_share');
    if (prep.mode === 'download_share') {
      expect(prep.reason).toBe('no_share_api');
      expect(prep.capability.hasShare).toBe(false);
    }
    expect(click).toHaveBeenCalled();
  });

  it('uses navigator.share on Windows when canShare files is true', async () => {
    const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      userAgentData: { platform: 'Windows', brands: [{ brand: 'Google Chrome' }] },
      share,
      canShare: (payload: { files?: File[]; text?: string }) =>
        Boolean(payload.files?.length === 1),
    });
    const prep = await prepareMarketingSystemShare([file], 'Hello');
    expect(prep.mode).toBe('web_share');
    expect(share).toHaveBeenCalledWith({ files: [file] });
    if (prep.mode === 'web_share') {
      expect(prep.result).toBe('shared');
      expect(prep.capability.platform).toBe('Windows');
    }
  });
});
