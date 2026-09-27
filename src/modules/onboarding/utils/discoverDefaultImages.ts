import { resolveListingCover } from '@/shared/utils/representativeImage';
import type { SpaceType } from '@/shared/types/space';

/** Category representative cover. Real verified listing photos still win when passed in. */
export function discoverDefaultImageUrl(
  type: SpaceType | string | undefined,
  listingId?: string | null,
  listingImageUrl?: string | null,
): string {
  return resolveListingCover({
    listingId,
    spaceType: type,
    listingImageUrl,
  }).url;
}
