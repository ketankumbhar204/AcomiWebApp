/** Same rule as mobile: only an existing owner, or an account with no membership, may create a space. */
export function canCreateSpace(
  memberships: ReadonlyArray<{ membershipRole?: string | null }>,
): boolean {
  if (memberships.length === 0) {
    return true;
  }
  return memberships.some((membership) => membership.membershipRole === 'OWNER');
}
