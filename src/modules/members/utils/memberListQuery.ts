import type {
  MemberResponse,
  MemberStatus,
  PendingInvitationResponse,
} from '@/shared/types/member';
import type { MembershipRole, SpaceType } from '@/shared/types/space';

export type MemberSortOption =
  | 'name_asc'
  | 'name_desc'
  | 'created_desc'
  | 'created_asc'
  | 'role';

export const MEMBER_STATUSES: MemberStatus[] = [
  'ACTIVE',
  'VACATED',
  'SUSPENDED',
  'BLACKLISTED',
];

const ROLE_SORT_ORDER: Record<MembershipRole, number> = {
  OWNER: 0,
  MANAGER: 1,
  STAFF: 2,
  TENANT: 3,
  CUSTOMER: 4,
};

export const DEFAULT_MEMBER_SORT: MemberSortOption = 'name_asc';

export type MemberListFilterState = {
  roles: MembershipRole[];
  statuses: MemberStatus[];
  sort: MemberSortOption;
};

export function defaultMemberListFilters(): MemberListFilterState {
  return {
    roles: [],
    statuses: [],
    sort: DEFAULT_MEMBER_SORT,
  };
}

export function rolesForSpace(spaceType: SpaceType | undefined): MembershipRole[] {
  if (spaceType === 'MESS') {
    return ['CUSTOMER', 'STAFF', 'MANAGER', 'OWNER'];
  }
  return ['TENANT', 'STAFF', 'MANAGER', 'OWNER'];
}

function compareByCreatedAt(a?: string, b?: string, sort: 'created_desc' | 'created_asc' = 'created_desc') {
  const aTime = a ? new Date(a).getTime() : 0;
  const bTime = b ? new Date(b).getTime() : 0;
  return sort === 'created_desc' ? bTime - aTime : aTime - bTime;
}

function matchesMemberSearch(member: MemberResponse, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) {
    return true;
  }
  return (
    member.fullName.toLowerCase().includes(q) ||
    member.mobileNumber.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
  );
}

function matchesRoleFilter(
  role: MembershipRole,
  selected: MembershipRole[],
  allRoles: MembershipRole[],
): boolean {
  if (selected.length === 0 || selected.length >= allRoles.length) {
    return true;
  }
  return selected.includes(role);
}

function matchesStatusFilter(status: MemberStatus, selected: MemberStatus[]): boolean {
  if (selected.length === 0 || selected.length >= MEMBER_STATUSES.length) {
    return true;
  }
  return selected.includes(status);
}

export function filterAndSortMembers(
  members: MemberResponse[],
  options: {
    search: string;
    filters: MemberListFilterState;
    spaceType?: SpaceType;
  },
): MemberResponse[] {
  const allRoles = rolesForSpace(options.spaceType);

  const filtered = members.filter((member) => {
    if (!matchesMemberSearch(member, options.search)) {
      return false;
    }
    if (!matchesRoleFilter(member.role, options.filters.roles, allRoles)) {
      return false;
    }
    if (!matchesStatusFilter(member.status ?? 'ACTIVE', options.filters.statuses)) {
      return false;
    }
    return true;
  });

  return [...filtered].sort((a, b) => {
    switch (options.filters.sort) {
      case 'name_desc':
        return b.fullName.localeCompare(a.fullName);
      case 'created_desc':
      case 'created_asc':
        return compareByCreatedAt(a.createdAt, b.createdAt, options.filters.sort);
      case 'role': {
        const roleDiff = ROLE_SORT_ORDER[a.role] - ROLE_SORT_ORDER[b.role];
        return roleDiff !== 0 ? roleDiff : a.fullName.localeCompare(b.fullName);
      }
      case 'name_asc':
      default:
        return a.fullName.localeCompare(b.fullName);
    }
  });
}

export function filterPendingInvitations(
  invitations: PendingInvitationResponse[],
  options: {
    search: string;
    roles: MembershipRole[];
    spaceType?: SpaceType;
  },
): PendingInvitationResponse[] {
  const q = options.search.trim().toLowerCase();
  const allRoles = rolesForSpace(options.spaceType);

  return invitations
    .filter((invitation) => {
      if (!matchesRoleFilter(invitation.role, options.roles, allRoles)) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        invitation.mobileNumber.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
        invitation.invitedBy.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function countMemberListFilters(
  filters: MemberListFilterState,
  spaceType: SpaceType | undefined,
): number {
  const allRoles = rolesForSpace(spaceType);
  let count = 0;
  if (filters.roles.length > 0 && filters.roles.length < allRoles.length) {
    count += 1;
  }
  if (filters.statuses.length > 0 && filters.statuses.length < MEMBER_STATUSES.length) {
    count += 1;
  }
  if (filters.sort !== DEFAULT_MEMBER_SORT) {
    count += 1;
  }
  return count;
}
