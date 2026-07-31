import apiClient from '@/shared/api/client';
import { unwrapApiResponse } from '@/shared/api/apiRequest';
import type { ApiResponse } from '@/shared/types/api';
import type {
  AcceptInvitationRequest,
  MyInvitationResponse,
  SpaceMembershipResponse,
} from '@/shared/types/space';

/** Invitee-facing invitation APIs (mobile memberApi.getMyInvitations / acceptInvitation). */
export const invitationApi = {
  getMyInvitations: () =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<MyInvitationResponse[]>>('/invitations/my'),
    ),

  acceptInvitation: (invitationId: string, body: AcceptInvitationRequest) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<SpaceMembershipResponse>>(
        `/invitations/${invitationId}/accept`,
        body,
      ),
    ),
};
