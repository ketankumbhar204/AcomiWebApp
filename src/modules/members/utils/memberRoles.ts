import type { MembershipRole, SpaceType } from '@/shared/types/space';

export function assignableRolesForSpaceType(
  spaceType: SpaceType | undefined,
): MembershipRole[] {
  if (spaceType === 'MESS') {
    return ['CUSTOMER', 'STAFF', 'MANAGER'];
  }
  return ['TENANT', 'CUSTOMER', 'STAFF', 'MANAGER'];
}

export function defaultRoleForSpaceType(spaceType: SpaceType | undefined): MembershipRole {
  return spaceType === 'MESS' ? 'CUSTOMER' : 'TENANT';
}

export function isRoleAssignableInSpace(
  role: MembershipRole,
  spaceType: SpaceType | undefined,
): boolean {
  return assignableRolesForSpaceType(spaceType).includes(role);
}
