import apiClient from '@/shared/api/client';
import { unwrapApiResponse, unwrapVoidResponse } from '@/shared/api/apiRequest';
import type { ApiResponse } from '@/shared/types/api';
import type {
  CreateInvitationRequest,
  CreateMemberDocumentRequest,
  CreateMemberNoteRequest,
  CreateMemberRequest,
  ImportMemberRequest,
  InvitationResponse,
  MemberDetailsResponse,
  MemberDocumentResponse,
  MemberHistoryResponse,
  MemberImportCandidateResponse,
  MemberNoteResponse,
  MemberResponse,
  MemberSearchParams,
  PendingInvitationResponse,
  UpdateDepositRequest,
  UpdateEmergencyContactRequest,
  UpdateMemberRequest,
  UpdateMemberStatusRequest,
} from '@/shared/types/member';

/** Matches mobile admin document create — metadata only, no real file upload. */
export const PENDING_UPLOAD_FILE_URL = 'pending-upload';

function buildMemberListQuery(params?: MemberSearchParams): string {
  if (!params) {
    return '';
  }
  const parts: string[] = [];
  if (params.search?.trim()) {
    parts.push(`search=${encodeURIComponent(params.search.trim())}`);
  }
  if (params.occupancyStatus) {
    parts.push(`occupancyStatus=${encodeURIComponent(params.occupancyStatus)}`);
  }
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

export const memberApi = {
  getMembers: async (spaceId: string, params?: MemberSearchParams): Promise<MemberResponse[]> => {
    const query = buildMemberListQuery(params);
    return unwrapApiResponse(
      apiClient.get<ApiResponse<MemberResponse[]>>(`/spaces/${spaceId}/members${query}`),
    );
  },

  getMyLinkedMember: async (spaceId: string): Promise<MemberResponse> => {
    return unwrapApiResponse(
      apiClient.get<ApiResponse<MemberResponse>>(`/spaces/${spaceId}/members/me`),
    );
  },

  getMember: async (spaceId: string, memberId: string): Promise<MemberDetailsResponse> => {
    return unwrapApiResponse(
      apiClient.get<ApiResponse<MemberDetailsResponse>>(
        `/spaces/${spaceId}/members/${memberId}`,
      ),
    );
  },

  createMember: async (
    spaceId: string,
    body: CreateMemberRequest,
  ): Promise<MemberResponse> => {
    return unwrapApiResponse(
      apiClient.post<ApiResponse<MemberResponse>>(`/spaces/${spaceId}/members`, body),
    );
  },

  updateMember: async (
    spaceId: string,
    memberId: string,
    body: UpdateMemberRequest,
  ): Promise<MemberDetailsResponse> => {
    return unwrapApiResponse(
      apiClient.put<ApiResponse<MemberDetailsResponse>>(
        `/spaces/${spaceId}/members/${memberId}`,
        body,
      ),
    );
  },

  removeMember: async (spaceId: string, memberId: string): Promise<void> => {
    await unwrapVoidResponse(apiClient.delete(`/spaces/${spaceId}/members/${memberId}`));
  },

  updateMemberStatus: async (
    spaceId: string,
    memberId: string,
    body: UpdateMemberStatusRequest,
  ): Promise<MemberDetailsResponse> => {
    return unwrapApiResponse(
      apiClient.put<ApiResponse<MemberDetailsResponse>>(
        `/spaces/${spaceId}/members/${memberId}/status`,
        body,
      ),
    );
  },

  updateEmergencyContact: async (
    spaceId: string,
    memberId: string,
    body: UpdateEmergencyContactRequest,
  ): Promise<MemberDetailsResponse> => {
    return unwrapApiResponse(
      apiClient.put<ApiResponse<MemberDetailsResponse>>(
        `/spaces/${spaceId}/members/${memberId}/emergency-contact`,
        body,
      ),
    );
  },

  updateDeposit: async (
    spaceId: string,
    memberId: string,
    body: UpdateDepositRequest,
  ): Promise<MemberDetailsResponse> => {
    return unwrapApiResponse(
      apiClient.put<ApiResponse<MemberDetailsResponse>>(
        `/spaces/${spaceId}/members/${memberId}/deposit`,
        body,
      ),
    );
  },

  searchImportCandidates: async (
    spaceId: string,
    search?: string,
  ): Promise<MemberImportCandidateResponse[]> => {
    return unwrapApiResponse(
      apiClient.get<ApiResponse<MemberImportCandidateResponse[]>>(
        `/spaces/${spaceId}/members/import-candidates`,
        { params: search?.trim() ? { search: search.trim() } : undefined },
      ),
    );
  },

  importMember: async (
    spaceId: string,
    body: ImportMemberRequest,
  ): Promise<MemberResponse> => {
    return unwrapApiResponse(
      apiClient.post<ApiResponse<MemberResponse>>(`/spaces/${spaceId}/members/import`, body),
    );
  },

  getMemberDocuments: async (
    spaceId: string,
    memberId: string,
  ): Promise<MemberDocumentResponse[]> => {
    return unwrapApiResponse(
      apiClient.get<ApiResponse<MemberDocumentResponse[]>>(
        `/spaces/${spaceId}/members/${memberId}/documents`,
      ),
    );
  },

  addMemberDocument: async (
    spaceId: string,
    memberId: string,
    body: CreateMemberDocumentRequest,
  ): Promise<MemberDocumentResponse> => {
    return unwrapApiResponse(
      apiClient.post<ApiResponse<MemberDocumentResponse>>(
        `/spaces/${spaceId}/members/${memberId}/documents`,
        body,
      ),
    );
  },

  deleteMemberDocument: async (
    spaceId: string,
    memberId: string,
    documentId: string,
  ): Promise<void> => {
    await unwrapVoidResponse(
      apiClient.delete(`/spaces/${spaceId}/members/${memberId}/documents/${documentId}`),
    );
  },

  getMemberNotes: async (spaceId: string, memberId: string): Promise<MemberNoteResponse[]> => {
    return unwrapApiResponse(
      apiClient.get<ApiResponse<MemberNoteResponse[]>>(
        `/spaces/${spaceId}/members/${memberId}/notes`,
      ),
    );
  },

  addMemberNote: async (
    spaceId: string,
    memberId: string,
    body: CreateMemberNoteRequest,
  ): Promise<MemberNoteResponse> => {
    return unwrapApiResponse(
      apiClient.post<ApiResponse<MemberNoteResponse>>(
        `/spaces/${spaceId}/members/${memberId}/notes`,
        body,
      ),
    );
  },

  getMemberHistory: async (
    spaceId: string,
    memberId: string,
  ): Promise<MemberHistoryResponse[]> => {
    return unwrapApiResponse(
      apiClient.get<ApiResponse<MemberHistoryResponse[]>>(
        `/spaces/${spaceId}/members/${memberId}/history`,
      ),
    );
  },

  getPendingInvitations: async (spaceId: string): Promise<PendingInvitationResponse[]> => {
    return unwrapApiResponse(
      apiClient.get<ApiResponse<PendingInvitationResponse[]>>(
        `/spaces/${spaceId}/invitations`,
      ),
    );
  },

  createInvitation: async (body: CreateInvitationRequest): Promise<InvitationResponse> => {
    return unwrapApiResponse(
      apiClient.post<ApiResponse<InvitationResponse>>('/invitations', body),
    );
  },

  cancelInvitation: async (invitationId: string): Promise<void> => {
    await unwrapVoidResponse(apiClient.delete(`/invitations/${invitationId}`));
  },
};
