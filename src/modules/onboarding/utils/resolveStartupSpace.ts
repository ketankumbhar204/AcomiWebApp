import { invitationApi } from '@/modules/onboarding/api/invitationApi';
import { mySpacesApi } from '@/shared/api/mySpacesApi';
import type {
  DefaultSpaceResponse,
  MyInvitationResponse,
  MySpaceResponse,
} from '@/shared/types/space';

export type StartupSpaceResolution =
  | { kind: 'dashboard'; spaceId: string; space: DefaultSpaceResponse }
  | { kind: 'picker'; spaces: MySpaceResponse[] }
  | { kind: 'invitations'; invitations: MyInvitationResponse[] }
  | { kind: 'onboardingChoice' };

/**
 * Resolves post-auth destination — mirrors mobile `resolveStartupSpace`.
 *
 * 1. GET /spaces/default → dashboard
 * 2. Else GET /spaces/my:
 *    - 0 spaces → GET /invitations/my; pending → accept-invitations
 *    - 0 spaces, no invites → onboarding choice
 *    - 1 → PUT /spaces/{id}/default, then dashboard
 *    - 2+ → space picker
 */
export async function resolveStartupSpace(): Promise<StartupSpaceResolution> {
  const defaultSpace = await mySpacesApi.getDefaultSpace();
  if (defaultSpace) {
    return {
      kind: 'dashboard',
      spaceId: defaultSpace.spaceId,
      space: defaultSpace,
    };
  }

  const spaces = await mySpacesApi.getMySpaces();
  if (spaces.length === 0) {
    const invitations = await invitationApi.getMyInvitations().catch(() => []);
    if (invitations.length > 0) {
      return { kind: 'invitations', invitations };
    }
    return { kind: 'onboardingChoice' };
  }

  if (spaces.length === 1) {
    const only = spaces[0]!;
    let space: DefaultSpaceResponse = {
      spaceId: only.spaceId,
      spaceName: only.spaceName,
      spaceType: only.spaceType,
    };

    try {
      const result = await mySpacesApi.setDefaultSpace(only.spaceId);
      space = {
        spaceId: result.spaceId,
        spaceName: result.spaceName,
        spaceType: only.spaceType,
      };
    } catch {
      // Open dashboard even if default persistence fails; retry on next launch.
    }

    return { kind: 'dashboard', spaceId: space.spaceId, space };
  }

  return { kind: 'picker', spaces };
}
