import type { MemberGender } from '@/shared/types/member';
import type { SpaceType } from '@/shared/types/space';

export const MEMBER_GENDER_OPTIONS: MemberGender[] = ['MALE', 'FEMALE', 'OTHER'];

export function isMemberGenderRequired(spaceType?: SpaceType): boolean {
  return spaceType === 'PG' || spaceType === 'HOSTEL';
}

export function memberGenderLabelKey(gender: MemberGender): string {
  return `membership.gender.${gender.toLowerCase()}`;
}
