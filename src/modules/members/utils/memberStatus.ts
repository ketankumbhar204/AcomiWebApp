import type { MemberOccupancyStatus, MemberStatus } from '@/shared/types/member';

export const MEMBER_STATUS_OPTIONS: MemberStatus[] = [
  'ACTIVE',
  'VACATED',
  'SUSPENDED',
  'BLACKLISTED',
];

export function getMemberStatusLabelKey(status: MemberStatus): string {
  return `membership.status.${status}`;
}

export function getMemberOccupancyStatusLabelKey(status: MemberOccupancyStatus): string {
  return `occupancy.memberStatus.${status}`;
}

export function memberStatusTone(
  status: MemberStatus,
): 'success' | 'warning' | 'error' | 'neutral' {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'SUSPENDED':
      return 'warning';
    case 'BLACKLISTED':
      return 'error';
    case 'VACATED':
    default:
      return 'neutral';
  }
}

export function memberOccupancyStatusTone(
  status: MemberOccupancyStatus | null | undefined,
): 'success' | 'warning' | 'neutral' {
  switch (status) {
    case 'ALLOCATED':
      return 'success';
    case 'RESERVED':
      return 'warning';
    case 'VACATED':
    default:
      return 'neutral';
  }
}
