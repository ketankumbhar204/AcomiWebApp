import type { MembershipRole, SpacePermissionsResponse, SpaceType } from '@/shared/types/space';

export function isAccommodationApplicable(spaceType: SpaceType): boolean {
  return spaceType !== 'MESS';
}

function deriveMealPermissions(role: MembershipRole | undefined) {
  const isOwner = role === 'OWNER';
  const isManager = role === 'MANAGER';
  const isResident = role === 'TENANT' || role === 'CUSTOMER';
  return {
    canManageMeals: isOwner || isManager,
    canViewMeals: role != null,
    canManageMealParticipation: isOwner || isManager,
    canViewOwnMealParticipation: isOwner || isManager || isResident,
  };
}

function deriveInventoryPermissions(role: MembershipRole | undefined) {
  const isOwner = role === 'OWNER';
  const isManager = role === 'MANAGER';
  const isStaff = role === 'STAFF';
  return {
    canViewInventory: isOwner || isManager || isStaff,
    canManageInventory: isOwner || isManager,
  };
}

/** Local fallback when GET /spaces/my omits the permissions block. */
export function deriveSpacePermissions(
  role: MembershipRole | undefined,
  spaceType: SpaceType | undefined,
): SpacePermissionsResponse {
  const accommodationApplicable = spaceType ? isAccommodationApplicable(spaceType) : true;
  const isOwner = role === 'OWNER';
  const isManager = role === 'MANAGER';
  const isStaff = role === 'STAFF';

  return {
    canViewAccommodation: accommodationApplicable && (isOwner || isManager || isStaff),
    canManageAccommodation: accommodationApplicable && (isOwner || isManager),
    canDeactivateAccommodation: accommodationApplicable && isOwner,
    canManageOccupancy: isOwner || isManager,
    canViewSpaceOccupancies: isOwner || isManager || isStaff,
    canManageMembers: isOwner || isManager,
    canRemoveMember: isOwner,
    ...deriveMealPermissions(role),
    canRaiseComplaint: isOwner || isManager || role === 'TENANT' || role === 'CUSTOMER',
    canViewAllComplaints: isOwner || isManager,
    canManageComplaints: isOwner || isManager,
    ...deriveInventoryPermissions(role),
  };
}

export function resolveSpacePermissions(entry: {
  membershipRole: MembershipRole;
  spaceType: SpaceType;
  permissions?: SpacePermissionsResponse;
} | undefined): SpacePermissionsResponse {
  if (!entry) {
    return deriveSpacePermissions(undefined, undefined);
  }
  const derived = deriveSpacePermissions(entry.membershipRole, entry.spaceType);
  if (!entry.permissions) {
    return derived;
  }
  return {
    ...derived,
    ...entry.permissions,
    canViewInventory: entry.permissions.canViewInventory ?? derived.canViewInventory,
    canManageInventory: entry.permissions.canManageInventory ?? derived.canManageInventory,
  };
}

export function findMySpaceEntry<T extends { spaceId: string }>(
  spaces: T[] | undefined,
  spaceId: string,
): T | undefined {
  return (spaces ?? []).find((space) => space.spaceId === spaceId);
}
