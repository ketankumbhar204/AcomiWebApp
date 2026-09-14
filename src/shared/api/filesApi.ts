import apiClient from '@/shared/api/client';
import { unwrapApiResponse, unwrapVoidResponse } from '@/shared/api/apiRequest';
import type { ApiResponse } from '@/shared/types/api';

export type FilePurpose =
  | 'PROFILE_PHOTO'
  | 'IDENTITY_DOCUMENT'
  | 'ADDRESS_PROOF'
  | 'MEMBER_DOCUMENT'
  | 'PAYMENT_PROOF'
  | 'MEAL_PAYMENT_PROOF'
  | 'SUBSCRIPTION_PAYMENT_PROOF'
  | 'COMPLAINT_ATTACHMENT';

export type FileStatus = 'PENDING' | 'ACTIVE' | 'PENDING_DELETE' | 'DELETED' | 'FAILED';

export type CreateUploadSessionRequest = {
  purpose: FilePurpose;
  spaceId?: string;
  memberId?: string;
  paymentId?: string;
  complaintId?: string;
  pollDate?: string;
  contentType: string;
  byteSize: number;
  originalFilename?: string;
};

export type UploadSessionResponse = {
  fileId: string;
  purpose: FilePurpose;
  status: FileStatus;
  uploadUrl: string;
  uploadMethod: string;
  uploadHeaders?: Record<string, string> | null;
  expiresAt?: string | null;
  useAcomiUploadProxy: boolean;
};

export type StoredFileResponse = {
  fileId: string;
  purpose: FilePurpose;
  status: FileStatus;
  contentType: string;
  byteSize?: number | null;
  originalFilename?: string | null;
};

export type ContentUrlResponse = {
  fileId: string;
  contentUrl: string;
  contentType: string;
  expiresAt: string;
};

export const filesApi = {
  createUploadSession: (body: CreateUploadSessionRequest) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<UploadSessionResponse>>('/files/upload-sessions', body),
    ),

  complete: (fileId: string) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<StoredFileResponse>>(`/files/${fileId}/complete`),
    ),

  getMetadata: (fileId: string) =>
    unwrapApiResponse(apiClient.get<ApiResponse<StoredFileResponse>>(`/files/${fileId}`)),

  getContentUrl: (fileId: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<ContentUrlResponse>>(`/files/${fileId}/content-url`),
    ),

  putContent: async (fileId: string, body: Blob, contentType: string): Promise<void> => {
    await unwrapVoidResponse(
      apiClient.put<ApiResponse<unknown>>(`/files/${fileId}/content`, body, {
        headers: {
          'Content-Type': contentType,
          Accept: 'application/json',
        },
        transformRequest: [(data) => data],
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }),
    );
  },

  delete: async (fileId: string): Promise<void> => {
    await unwrapVoidResponse(apiClient.delete(`/files/${fileId}`));
  },
};
