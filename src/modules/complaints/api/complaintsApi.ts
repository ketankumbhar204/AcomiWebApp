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
import { ensureUploadedFileId, uploadLocalFile } from '@/shared/services/fileUploadService';

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

  create: async (
    spaceId: string,
    body: CreateComplaintRequest & { localFiles?: File[] },
  ) => {
    const attachmentFileIds = [...(body.attachmentFileIds ?? [])];
    if (body.localFiles?.length) {
      for (const file of body.localFiles) {
        attachmentFileIds.push(
          await uploadLocalFile(file, { purpose: 'COMPLAINT_ATTACHMENT', spaceId }),
        );
      }
    }
    const { localFiles: _ignored, ...rest } = body;
    return unwrapApiResponse(
      apiClient.post<ApiResponse<ComplaintResponse>>(`/spaces/${spaceId}/complaints`, {
        ...rest,
        attachmentFileIds: attachmentFileIds.length ? attachmentFileIds : undefined,
      }),
    );
  },

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

  addAttachment: async (
    spaceId: string,
    complaintId: string,
    body: AddComplaintAttachmentRequest & { localFile?: File },
  ) => {
    const fileId = await ensureUploadedFileId(body.fileId, body.localFile, {
      purpose: 'COMPLAINT_ATTACHMENT',
      spaceId,
      complaintId,
    });
    const { localFile: _ignored, ...rest } = body;
    return unwrapApiResponse(
      apiClient.post<ApiResponse<ComplaintResponse>>(
        `/spaces/${spaceId}/complaints/${complaintId}/attachments`,
        { ...rest, fileId },
      ),
    );
  },

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
