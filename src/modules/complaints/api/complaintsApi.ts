import apiClient from '@/shared/api/client';
import { unwrapApiResponse } from '@/shared/api/apiRequest';
import type { ApiResponse } from '@/shared/types/api';
import type {
  AddComplaintAttachmentRequest,
  AddComplaintCommentRequest,
  AssignComplaintRequest,
  ComplaintListResponse,
  ComplaintResponse,
  CreateComplaintRequest,
  ListComplaintsParams,
  ReopenComplaintRequest,
  UpdateComplaintResolutionRequest,
  UpdateComplaintStatusRequest,
} from '@/shared/types/complaints';

export const complaintsApi = {
  list: (spaceId: string, params?: ListComplaintsParams) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<ComplaintListResponse>>(`/spaces/${spaceId}/complaints`, {
        params,
      }),
    ),

  get: (spaceId: string, complaintId: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<ComplaintResponse>>(
        `/spaces/${spaceId}/complaints/${complaintId}`,
      ),
    ),

  create: (spaceId: string, body: CreateComplaintRequest) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<ComplaintResponse>>(`/spaces/${spaceId}/complaints`, body),
    ),

  updateStatus: (spaceId: string, complaintId: string, body: UpdateComplaintStatusRequest) =>
    unwrapApiResponse(
      apiClient.patch<ApiResponse<ComplaintResponse>>(
        `/spaces/${spaceId}/complaints/${complaintId}/status`,
        body,
      ),
    ),

  addComment: (spaceId: string, complaintId: string, body: AddComplaintCommentRequest) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<ComplaintResponse>>(
        `/spaces/${spaceId}/complaints/${complaintId}/comments`,
        body,
      ),
    ),

  addAttachment: (spaceId: string, complaintId: string, body: AddComplaintAttachmentRequest) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<ComplaintResponse>>(
        `/spaces/${spaceId}/complaints/${complaintId}/attachments`,
        body,
      ),
    ),

  reopen: (spaceId: string, complaintId: string, body?: ReopenComplaintRequest) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<ComplaintResponse>>(
        `/spaces/${spaceId}/complaints/${complaintId}/reopen`,
        body ?? {},
      ),
    ),

  assign: (spaceId: string, complaintId: string, body: AssignComplaintRequest) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<ComplaintResponse>>(
        `/spaces/${spaceId}/complaints/${complaintId}/assign`,
        body,
      ),
    ),

  updateResolution: (
    spaceId: string,
    complaintId: string,
    body: UpdateComplaintResolutionRequest,
  ) =>
    unwrapApiResponse(
      apiClient.patch<ApiResponse<ComplaintResponse>>(
        `/spaces/${spaceId}/complaints/${complaintId}/resolution`,
        body,
      ),
    ),
};
