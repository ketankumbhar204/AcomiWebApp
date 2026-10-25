import apiClient from '@/shared/api/client';
import { unwrapApiResponse } from '@/shared/api/apiRequest';
import type { ApiResponse } from '@/shared/types/api';
import { ApiError } from '@/shared/api/errors';
import type {
  DefaultSpaceResponse,
  MySpaceResponse,
  SetDefaultSpaceResponse,
} from '@/shared/types/space';

/** Jackson can emit boolean isDefault as "default". Keep the client field stable. */
function withDefaultFlag(space: MySpaceResponse): MySpaceResponse {
  const raw = space as MySpaceResponse & { default?: boolean };
  return {
    ...space,
    isDefault: Boolean(raw.isDefault || raw.default),
  };
}

export const mySpacesApi = {
  getMySpaces: async (): Promise<MySpaceResponse[]> => {
    const spaces = await unwrapApiResponse(
      apiClient.get<ApiResponse<MySpaceResponse[]>>('/spaces/my'),
    );
    return spaces.map(withDefaultFlag);
  },

  searchMySpaces: async (query: string): Promise<MySpaceResponse[]> => {
    const trimmed = query.trim();
    const spaces = await unwrapApiResponse(
      apiClient.get<ApiResponse<MySpaceResponse[]>>('/spaces/my', {
        params: { search: trimmed },
      }),
    );
    return spaces.map(withDefaultFlag);
  },

  getDefaultSpace: async (): Promise<DefaultSpaceResponse | null> => {
    try {
      return await unwrapApiResponse(
        apiClient.get<ApiResponse<DefaultSpaceResponse>>('/spaces/default'),
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return null;
      }
      throw err;
    }
  },

  setDefaultSpace: async (spaceId: string): Promise<SetDefaultSpaceResponse> => {
    return unwrapApiResponse(
      apiClient.put<ApiResponse<SetDefaultSpaceResponse>>(`/spaces/${spaceId}/default`),
    );
  },

  listMyListings: async (params?: { status?: 'LIVE' | 'PENDING'; kind?: 'PROPERTY' | 'MESS'; search?: string }) => {
    return unwrapApiResponse(
      apiClient.get<ApiResponse<MeListing[]>>('/me/listings', { params }),
    );
  },

  updatePropertyLead: async (registrationId: string, body: OwnedLeadUpdate) => {
    return unwrapApiResponse(
      apiClient.put<ApiResponse<MeListing>>(`/me/listings/property-registrations/${registrationId}`, body),
    );
  },

  updateMessLead: async (registrationId: string, body: OwnedLeadUpdate) => {
    return unwrapApiResponse(
      apiClient.put<ApiResponse<MeListing>>(`/me/listings/mess-registrations/${registrationId}`, body),
    );
  },
};

export type MeListing = {
  spaceId?: string | null;
  registrationId?: string | null;
  kind: 'PROPERTY' | 'MESS';
  spaceType?: string | null;
  name: string;
  address?: string | null;
  city?: string | null;
  publication: 'LIVE' | 'PENDING';
  registrationReference?: string | null;
  registrationStatus?: string | null;
  startingPrice?: number | string | null;
  monthlyPrice?: number | string | null;
  mealPrice?: number | string | null;
  operationalManagementAvailable?: boolean;
  publicPath?: string | null;
  managePath?: string | null;
  accommodationPath?: string | null;
  mealsPath?: string | null;
  description?: string | null;
  genderPolicy?: string | null;
};

export type OwnedLeadUpdate = {
  propertyName?: string;
  messName?: string;
  addressLine?: string;
  city?: string;
  description?: string;
  startingPrice?: number;
  monthlyPrice?: number;
  mealPrice?: number;
  genderPolicy?: string;
};
