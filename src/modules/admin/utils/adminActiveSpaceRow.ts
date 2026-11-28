import { adminMessDetailPath, adminPropertyDetailPath } from '@/routes/paths';

/**
 * Active-list detail navigation uses the linked property/mess registration when present.
 * Spaces without a registrationId have no admin registration detail route on web.
 */
export function activeSpaceRegistrationDetailPath(
  registrationId: string | null | undefined,
  kind: 'property' | 'mess' = 'property',
): string | undefined {
  const id = typeof registrationId === 'string' ? registrationId.trim() : '';
  if (!id) {
    return undefined;
  }
  return kind === 'mess' ? adminMessDetailPath(id) : adminPropertyDetailPath(id);
}

/**
 * Share must stay available for every active space in the marketing workflow —
 * including admin-added and imported listings. Do not gate on registrationId/source.
 */
export function isActiveSpaceShareActionVisible(_space?: {
  registrationId?: string | null;
  source?: string | null;
}): boolean {
  return true;
}
