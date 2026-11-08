import type {
  MemberOccupancyStatus,
  MemberResponse,
  MemberStatus,
  PendingInvitationResponse,
} from '@/shared/types/member';
import type { MembershipRole, SpaceType } from '@/shared/types/space';
import { isAccommodationApplicable } from '@/shared/utils/spacePermissions';
import {
  matchesPaymentDuesFilter,
  memberDuesCue,
  type MemberDuesSnapshot,
  type MemberPaymentDuesFilter,
} from './memberDues';

export type MemberSortOption =
  | 'name_asc'
  | 'name_desc'
  | 'created_desc'
  | 'created_asc'
  | 'role';

/** Account status options (mess / staff / KPI Active). */
export const MEMBER_STATUSES: MemberStatus[] = [
  'ACTIVE',
  'VACATED',
  'SUSPENDED',
  'BLACKLISTED',
];

/** Stay status options shown for lodging tenants. */
export const ACCOMMODATION_STAY_STATUSES: MemberOccupancyStatus[] = [
  'ALLOCATED',
  'RESERVED',
  'VACATED',
];

export type MemberListStatusOption = MemberStatus | MemberOccupancyStatus;

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
  statuses: MemberListStatusOption[];
  sort: MemberSortOption;
  /** When true, only members whose createdAt falls in the current calendar month. */
  joinedThisMonthOnly?: boolean;
  /** Outstanding-dues filter. Uses the payment-month ledger, not contract rent. */
  paymentDues?: MemberPaymentDuesFilter;
};

export function defaultMemberListFilters(): MemberListFilterState {
  return {
    roles: [],
    statuses: [],
    sort: DEFAULT_MEMBER_SORT,
    joinedThisMonthOnly: false,
    paymentDues: 'all',
  };
}

export function isJoinedThisMonth(iso?: string | null): boolean {
  if (!iso) return false;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

export function rolesForSpace(spaceType: SpaceType | undefined): MembershipRole[] {
  if (spaceType === 'MESS') {
    return ['CUSTOMER', 'STAFF', 'MANAGER', 'OWNER'];
  }
  return ['TENANT', 'STAFF', 'MANAGER', 'OWNER'];
}

/** Status chips in filters — stay status for lodging, account status for mess. */
export function statusesForSpace(spaceType: SpaceType | undefined): MemberListStatusOption[] {
  if (spaceType != null && isAccommodationApplicable(spaceType)) {
    return [...ACCOMMODATION_STAY_STATUSES];
  }
  return [...MEMBER_STATUSES];
}

export function memberListStatusLabelKey(
  status: MemberListStatusOption,
  spaceType: SpaceType | undefined,
): string {
  if (spaceType != null && isAccommodationApplicable(spaceType)) {
    if (status === 'ALLOCATED' || status === 'RESERVED' || status === 'VACATED') {
      return `occupancy.memberStatus.${status}`;
    }
  }
  return `membership.status.${status}`;
}

function compareByCreatedAt(
  a?: string,
  b?: string,
  sort: 'created_desc' | 'created_asc' = 'created_desc',
) {
  const aTime = a ? new Date(a).getTime() : 0;
  const bTime = b ? new Date(b).getTime() : 0;
  return sort === 'created_desc' ? bTime - aTime : aTime - bTime;
}

function matchesMemberSearch(member: MemberResponse, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) {
    return true;
  }
  const digits = q.replace(/\D/g, '');
  return (
    member.fullName.toLowerCase().includes(q) ||
    (digits.length > 0 && member.mobileNumber.replace(/\D/g, '').includes(digits))
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

/**
 * Accommodation tenants are filtered by stay (Moved in / Reserved / Vacated).
 * Other roles and mess use account status. KPI Active still passes account ACTIVE.
 */
function matchesStatusFilter(
  member: MemberResponse,
  selected: MemberListStatusOption[],
  spaceType: SpaceType | undefined,
): boolean {
  const allStatuses = statusesForSpace(spaceType);
  if (selected.length === 0) {
    return true;
  }
  const onlySpaceOptions = selected.every((status) =>
    (allStatuses as string[]).includes(status),
  );
  if (onlySpaceOptions && selected.length >= allStatuses.length) {
    return true;
  }

  const usesStayFilter =
    spaceType != null &&
    isAccommodationApplicable(spaceType) &&
    member.role === 'TENANT' &&
    selected.some(
      (status) =>
        status === 'ALLOCATED' || status === 'RESERVED' || status === 'VACATED',
    ) &&
    !selected.some(
      (status) =>
        status === 'ACTIVE' || status === 'SUSPENDED' || status === 'BLACKLISTED',
    );

  if (usesStayFilter) {
    const stay = member.occupancyStatus ?? 'VACATED';
    return selected.includes(stay);
  }

  return selected.includes(member.status ?? 'ACTIVE');
}

export function filterAndSortMembers(
  members: MemberResponse[],
  options: {
    search: string;
    filters: MemberListFilterState;
    spaceType?: SpaceType;
    duesByMemberId?: Map<string, MemberDuesSnapshot>;
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
    if (!matchesStatusFilter(member, options.filters.statuses, options.spaceType)) {
      return false;
    }
    if (options.filters.joinedThisMonthOnly && !isJoinedThisMonth(member.createdAt)) {
      return false;
    }
    if (
      !matchesPaymentDuesFilter(
        memberDuesCue(options.duesByMemberId?.get(member.memberId)),
        options.filters.paymentDues,
      )
    ) {
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
      const digits = q.replace(/\D/g, '');
      return (
        (digits.length > 0 &&
          invitation.mobileNumber.replace(/\D/g, '').includes(digits)) ||
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
  const allStatuses = statusesForSpace(spaceType);
  let count = 0;
  if (filters.roles.length > 0 && filters.roles.length < allRoles.length) {
    count += 1;
  }
  if (filters.statuses.length > 0 && filters.statuses.length < allStatuses.length) {
    count += 1;
  }
  if (filters.joinedThisMonthOnly) {
    count += 1;
  }
  if (filters.paymentDues && filters.paymentDues !== 'all') {
    count += 1;
  }
  if (filters.sort !== DEFAULT_MEMBER_SORT) {
    count += 1;
  }
  return count;
}
