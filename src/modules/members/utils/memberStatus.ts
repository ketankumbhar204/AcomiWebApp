import type { MemberStatus } from '@/shared/types/member';

export const MEMBER_STATUS_OPTIONS: MemberStatus[] = [
  'ACTIVE',
  'VACATED',
  'SUSPENDED',
  'BLACKLISTED',
];

export function getMemberStatusLabelKey(status: MemberStatus): string {
  return `membership.status.${status}`;
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
