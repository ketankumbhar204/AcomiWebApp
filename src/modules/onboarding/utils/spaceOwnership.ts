import type { MembershipRole } from '@/shared/types/space';

type SpaceOwnershipLike = {
  ownerId?: string | null;
  membershipRole?: MembershipRole;
  role?: MembershipRole;
};

/** Owner-only actions (edit / deactivate / meal settings) — mirrors mobile. */
export function isSpaceOwner(
  space: SpaceOwnershipLike | null | undefined,
  userId: string | null | undefined,
): boolean {
  if (!space || !userId) {
    return false;
  }

  if (space.ownerId && space.ownerId === userId) {
    return true;
  }

  return space.membershipRole === 'OWNER' || space.role === 'OWNER';
}
