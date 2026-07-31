import { useMemo } from 'react';
import { useSpaceStore } from '@/store/spaceStore';
import { resolveSpacePermissions } from '@/shared/utils/spacePermissions';
import type { MembershipRole, MySpaceResponse, SpacePermissionsResponse } from '@/shared/types/space';

export type SpacePermissionsView = SpacePermissionsResponse & {
  membershipRole: MembershipRole | undefined;
  space: MySpaceResponse | undefined;
};

export function useSpacePermissions(spaceId: string | undefined): SpacePermissionsView {
  const mySpaces = useSpaceStore((state) => state.mySpaces);
  const space = useMemo(
    () => mySpaces.find((entry) => entry.spaceId === spaceId),
    [mySpaces, spaceId],
  );
  const permissions = useMemo(() => resolveSpacePermissions(space), [space]);

  return {
    ...permissions,
    membershipRole: space?.membershipRole,
    space,
  };
}
