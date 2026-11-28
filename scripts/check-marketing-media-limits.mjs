import assert from 'node:assert/strict';

const MARKETING_MEDIA_MAX_FILES = 10;
const MARKETING_MEDIA_MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MARKETING_MEDIA_MAX_VIDEO_BYTES = 100 * 1024 * 1024;

function marketingMediaKind(mime) {
  const normalized = ((mime ?? '').split(';')[0] ?? '').trim().toLowerCase();
  if (['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(normalized)) return 'image';
  if (['video/mp4', 'video/quicktime', 'video/webm', 'video/3gpp'].includes(normalized)) return 'video';
  return null;
}

function validateMarketingMediaAddition(existingCount, candidates) {
  if (existingCount + candidates.length > MARKETING_MEDIA_MAX_FILES) {
    return { ok: false, code: 'TOO_MANY' };
  }
  for (const candidate of candidates) {
    const kind = marketingMediaKind(candidate.mime);
    if (!kind) return { ok: false, code: 'UNSUPPORTED' };
    if (kind === 'image' && candidate.size > MARKETING_MEDIA_MAX_IMAGE_BYTES) {
      return { ok: false, code: 'IMAGE_TOO_LARGE' };
    }
    if (kind === 'video' && candidate.size > MARKETING_MEDIA_MAX_VIDEO_BYTES) {
      return { ok: false, code: 'VIDEO_TOO_LARGE' };
    }
  }
  return { ok: true, accepted: candidates };
}

assert.equal(marketingMediaKind('image/jpeg'), 'image');
assert.equal(marketingMediaKind('video/mp4'), 'video');
assert.equal(marketingMediaKind('image/gif'), null);

assert.equal(
  validateMarketingMediaAddition(0, [
    { name: 'a.jpg', mime: 'image/jpeg', size: 100 },
    { name: 'b.mp4', mime: 'video/mp4', size: 200 },
  ]).ok,
  true,
);

assert.equal(
  validateMarketingMediaAddition(MARKETING_MEDIA_MAX_FILES, [
    { name: 'a.jpg', mime: 'image/jpeg', size: 100 },
  ]).code,
  'TOO_MANY',
);

assert.equal(
  validateMarketingMediaAddition(0, [
    { name: 'big.jpg', mime: 'image/jpeg', size: MARKETING_MEDIA_MAX_IMAGE_BYTES + 1 },
  ]).code,
  'IMAGE_TOO_LARGE',
);

assert.equal(
  validateMarketingMediaAddition(0, [
    { name: 'big.mp4', mime: 'video/mp4', size: MARKETING_MEDIA_MAX_VIDEO_BYTES + 1 },
  ]).code,
  'VIDEO_TOO_LARGE',
);

assert.equal(
  validateMarketingMediaAddition(0, [{ name: 'x.gif', mime: 'image/gif', size: 10 }]).code,
  'UNSUPPORTED',
);

console.log('marketing-media-limits ok');
