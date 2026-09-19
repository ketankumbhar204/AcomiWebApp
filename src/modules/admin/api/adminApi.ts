import apiClient from '@/shared/api/client';
import { unwrapApiResponse, unwrapVoidResponse } from '@/shared/api/apiRequest';
import type { ApiResponse, PagedResponse } from '@/shared/types/api';
import type {
  AdminActiveSpace,
  AdminActivityItem,
  AdminActivityType,
  AdminCreateMessRegistrationRequest,
  AdminCreatePropertyRegistrationRequest,
  AdminUpdateRegistrationContactRequest,
  AdminDashboardSummary,
  AdminEnquiriesTrend,
  AdminRegisteredUser,
  AdminRegisteredUsersSummary,
  AdminRegistrationConvertResponse,
  AdminPropertyRegistrationsSummary,
  AdminMessRegistrationsSummary,
  AdminSavedAddressesSummary,
  AdminUserRegistrationBreakdown,
  SavedAddress,
  SavedAddressRequest,
  MessRegistrationDetail,
  MessRegistrationListItem,
  MessRegistrationResponse,
  PropertyRegistrationDetail,
  PropertyRegistrationListItem,
  PropertyRegistrationResponse,
} from '@/shared/types/admin';
import type {
  PropertyBulkImportAnalyzeResponse,
  PropertyBulkImportMapping,
  PropertyBulkImportPreviewResponse,
  PropertyBulkImportResultResponse,
} from '@/shared/types/adminBulkImport';
import type { MembershipRole, SpaceType } from '@/shared/types/space';

const BULK_IMPORT_BASE = '/admin/property-registrations/bulk-import';

function toBulkImportFormData(
  file: File,
  mapping?: PropertyBulkImportMapping,
  markAsTestLead?: boolean,
  keepDuplicateRowNumbers?: number[],
): FormData {
  const formData = new FormData();
  formData.append('file', file);
  if (mapping) {
    formData.append('mapping', JSON.stringify(mapping));
  }
  if (markAsTestLead) {
    formData.append('markAsTestLead', 'true');
  }
  if (keepDuplicateRowNumbers) {
    formData.append('keepDuplicateRowNumbers', JSON.stringify(keepDuplicateRowNumbers));
  }
  return formData;
}

export const adminApi = {
  getDashboardSummary: async (params?: {
    from?: string;
    to?: string;
  }): Promise<AdminDashboardSummary> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<AdminDashboardSummary>>('/admin/dashboard/summary', { params }),
    ),

  getEnquiriesTrend: async (params?: {
    from?: string;
    to?: string;
  }): Promise<AdminEnquiriesTrend> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<AdminEnquiriesTrend>>('/admin/dashboard/enquiries-trend', {
        params,
      }),
    ),

  getUserRegistrationBreakdown: async (params?: {
    from?: string;
    to?: string;
  }): Promise<AdminUserRegistrationBreakdown> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<AdminUserRegistrationBreakdown>>(
        '/admin/dashboard/user-registration-breakdown',
        { params },
      ),
    ),

  listActivity: async (params?: {
    from?: string;
    to?: string;
    activityType?: AdminActivityType;
    page?: number;
    size?: number;
  }): Promise<PagedResponse<AdminActivityItem>> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<AdminActivityItem>>>('/admin/activity', { params }),
    ),

  listActiveSpaces: async (type?: SpaceType): Promise<AdminActiveSpace[]> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<AdminActiveSpace[]>>('/admin/dashboard/active-spaces', {
        params: type ? { type } : undefined,
      }),
    ),

  listPropertyRegistrations: async (params?: {
    q?: string;
    source?: 'ADMIN' | 'PUBLIC_WEBSITE';
    status?: string;
    leadsOnly?: boolean;
    claimed?: boolean;
    page?: number;
    size?: number;
  }): Promise<PagedResponse<PropertyRegistrationListItem>> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<PropertyRegistrationListItem>>>(
        '/admin/property-registrations',
        { params },
      ),
    ),

  getPropertyRegistrationsSummary: async (): Promise<AdminPropertyRegistrationsSummary> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<AdminPropertyRegistrationsSummary>>(
        '/admin/property-registrations/summary',
      ),
    ),

  getPropertyRegistration: async (id: string): Promise<PropertyRegistrationDetail> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<PropertyRegistrationDetail>>(
        `/admin/property-registrations/${id}`,
      ),
    ),

  createPropertyRegistration: async (
    payload: AdminCreatePropertyRegistrationRequest,
  ): Promise<PropertyRegistrationResponse> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<PropertyRegistrationResponse>>(
        '/admin/property-registrations',
        payload,
      ),
    ),

  updatePropertyRegistrationContact: async (
    id: string,
    payload: AdminUpdateRegistrationContactRequest,
  ): Promise<PropertyRegistrationDetail> =>
    unwrapApiResponse(
      apiClient.put<ApiResponse<PropertyRegistrationDetail>>(
        `/admin/property-registrations/${id}/contact`,
        payload,
      ),
    ),

  deletePropertyRegistration: async (id: string): Promise<void> =>
    unwrapVoidResponse(
      apiClient.delete(`/admin/property-registrations/${id}`),
    ),

  downloadPropertyBulkImportTemplate: async (): Promise<Blob> => {
    const response = await apiClient.get<Blob>(`${BULK_IMPORT_BASE}/template`, {
      responseType: 'blob',
    });
    return response.data;
  },

  analyzePropertyBulkImport: async (file: File): Promise<PropertyBulkImportAnalyzeResponse> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<PropertyBulkImportAnalyzeResponse>>(
        `${BULK_IMPORT_BASE}/analyze`,
        toBulkImportFormData(file),
        { headers: { 'Content-Type': 'multipart/form-data' } },
      ),
    ),

  previewPropertyBulkImport: async (
    file: File,
    mapping: PropertyBulkImportMapping,
    markAsTestLead = false,
  ): Promise<PropertyBulkImportPreviewResponse> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<PropertyBulkImportPreviewResponse>>(
        `${BULK_IMPORT_BASE}/preview`,
        toBulkImportFormData(file, mapping, markAsTestLead),
        { headers: { 'Content-Type': 'multipart/form-data' } },
      ),
    ),

  importPropertyBulkImport: async (
    file: File,
    mapping: PropertyBulkImportMapping,
    markAsTestLead = false,
    keepDuplicateRowNumbers: number[] = [],
  ): Promise<PropertyBulkImportResultResponse> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<PropertyBulkImportResultResponse>>(
        BULK_IMPORT_BASE,
        toBulkImportFormData(file, mapping, markAsTestLead, keepDuplicateRowNumbers),
        { headers: { 'Content-Type': 'multipart/form-data' } },
      ),
    ),

  listMessRegistrations: async (params?: {
    q?: string;
    source?: 'ADMIN' | 'PUBLIC_WEBSITE';
    status?: string;
    leadsOnly?: boolean;
    claimed?: boolean;
    page?: number;
    size?: number;
  }): Promise<PagedResponse<MessRegistrationListItem>> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<MessRegistrationListItem>>>(
        '/admin/mess-registrations',
        { params },
      ),
    ),

  getMessRegistrationsSummary: async (): Promise<AdminMessRegistrationsSummary> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<AdminMessRegistrationsSummary>>('/admin/mess-registrations/summary'),
    ),

  getMessRegistration: async (id: string): Promise<MessRegistrationDetail> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<MessRegistrationDetail>>(`/admin/mess-registrations/${id}`),
    ),

  createMessRegistration: async (
    payload: AdminCreateMessRegistrationRequest,
  ): Promise<MessRegistrationResponse> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<MessRegistrationResponse>>(
        '/admin/mess-registrations',
        payload,
      ),
    ),

  updateMessRegistrationContact: async (
    id: string,
    payload: AdminUpdateRegistrationContactRequest,
  ): Promise<MessRegistrationDetail> =>
    unwrapApiResponse(
      apiClient.put<ApiResponse<MessRegistrationDetail>>(
        `/admin/mess-registrations/${id}/contact`,
        payload,
      ),
    ),

  deleteMessRegistration: async (id: string): Promise<void> =>
    unwrapVoidResponse(apiClient.delete(`/admin/mess-registrations/${id}`)),

  listRegisteredUsers: async (params?: {
    q?: string;
    role?: string;
    onboarding?: string;
    spaceAssociation?: string;
    from?: string;
    to?: string;
    page?: number;
    size?: number;
  }): Promise<PagedResponse<AdminRegisteredUser>> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<AdminRegisteredUser>>>('/admin/registered-users', {
        params,
      }),
    ),

  getRegisteredUsersSummary: async (): Promise<AdminRegisteredUsersSummary> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<AdminRegisteredUsersSummary>>('/admin/registered-users/summary'),
    ),

  getRegisteredUser: async (id: string): Promise<AdminRegisteredUser> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<AdminRegisteredUser>>(`/admin/registered-users/${id}`),
    ),

  createRegisteredUser: async (payload: {
    fullName: string;
    mobileNumber: string;
    email?: string;
    password: string;
    confirmPassword: string;
    spaceRole: MembershipRole;
    spaceId?: string;
    spaceName?: string;
    spaceType?: SpaceType;
  }): Promise<AdminRegisteredUser> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<AdminRegisteredUser>>('/admin/registered-users', payload),
    ),

  setRegisteredUserTestFlag: async (
    id: string,
    testUser: boolean,
  ): Promise<AdminRegisteredUser> =>
    unwrapApiResponse(
      apiClient.put<ApiResponse<AdminRegisteredUser>>(`/admin/registered-users/${id}/test-user`, {
        testUser,
      }),
    ),

  deleteRegisteredUser: async (id: string): Promise<void> =>
    unwrapVoidResponse(apiClient.delete(`/admin/registered-users/${id}`)),

  linkPropertyOwner: async (
    id: string,
    payload: { userId: string },
  ): Promise<PropertyRegistrationDetail> =>
    unwrapApiResponse(
      apiClient.put<ApiResponse<PropertyRegistrationDetail>>(
        `/admin/property-registrations/${id}/link-owner`,
        payload,
      ),
    ),

  convertPropertyRegistration: async (id: string): Promise<AdminRegistrationConvertResponse> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<AdminRegistrationConvertResponse>>(
        `/admin/property-registrations/${id}/convert`,
      ),
    ),

  publishOpenAdminPropertyLeads: async (): Promise<{ published: number }> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<{ published: number }>>(
        '/admin/property-registrations/publish-open-admin-leads',
      ),
    ),

  publishOpenAdminMessLeads: async (): Promise<{ published: number }> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<{ published: number }>>(
        '/admin/mess-registrations/publish-open-admin-leads',
      ),
    ),

  linkMessOwner: async (
    id: string,
    payload: { userId: string },
  ): Promise<MessRegistrationDetail> =>
    unwrapApiResponse(
      apiClient.put<ApiResponse<MessRegistrationDetail>>(
        `/admin/mess-registrations/${id}/link-owner`,
        payload,
      ),
    ),

  convertMessRegistration: async (id: string): Promise<AdminRegistrationConvertResponse> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<AdminRegistrationConvertResponse>>(
        `/admin/mess-registrations/${id}/convert`,
      ),
    ),

  enableSpaceDiscovery: async (spaceId: string): Promise<{ discoverable: boolean }> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<{ discoverable: boolean }>>(
        `/admin/spaces/${spaceId}/enable-discovery`,
      ),
    ),

  getAdminSpace: async (spaceId: string): Promise<{ id: string; name: string; discoverable: boolean }> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<{ id: string; name: string; discoverable: boolean }>>(
        `/admin/spaces/${spaceId}`,
      ),
    ),

  deleteActiveSpace: async (spaceId: string): Promise<void> =>
    unwrapVoidResponse(apiClient.delete(`/admin/spaces/${spaceId}`)),

  listSavedAddresses: async (params?: {
    search?: string;
    city?: string;
    state?: string;
    usage?: string;
    page?: number;
    size?: number;
  }): Promise<PagedResponse<SavedAddress>> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<SavedAddress>>>('/admin/saved-addresses', {
        params,
      }),
    ),

  getSavedAddressesSummary: async (): Promise<AdminSavedAddressesSummary> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<AdminSavedAddressesSummary>>('/admin/saved-addresses/summary'),
    ),

  createSavedAddress: async (payload: SavedAddressRequest): Promise<SavedAddress> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<SavedAddress>>('/admin/saved-addresses', payload),
    ),

  updateSavedAddress: async (id: string, payload: SavedAddressRequest): Promise<SavedAddress> =>
    unwrapApiResponse(
      apiClient.put<ApiResponse<SavedAddress>>(`/admin/saved-addresses/${id}`, payload),
    ),

  deleteSavedAddress: async (id: string): Promise<void> =>
    unwrapVoidResponse(apiClient.delete(`/admin/saved-addresses/${id}`)),
};
