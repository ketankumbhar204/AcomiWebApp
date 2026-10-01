import type { LocationAutocompleteSuggestion } from '@/modules/onboarding/utils/locationAutocomplete';
import apiClient from '@/shared/api/client';
import { unwrapApiResponse } from '@/shared/api/apiRequest';
import {
  LOCATION_SEARCH_LIMIT,
  buildLocationSearchParams,
  type LocationSearchQuery,
} from '@/shared/api/locationSearchQuery';
import type { ApiResponse } from '@/shared/types/api';
import type { LocationRecord } from '@/shared/types/location';

export type { LocationRecord } from '@/shared/types/location';

export const locationsApi = {
  listStates: async (): Promise<string[]> => {
    return unwrapApiResponse(apiClient.get<ApiResponse<string[]>>('/locations/states'));
  },

  listDistricts: async (state: string): Promise<string[]> => {
    return unwrapApiResponse(
      apiClient.get<ApiResponse<string[]>>('/locations/districts', {
        params: { state },
      }),
    );
  },

  listTalukas: async (state: string, district: string): Promise<string[]> => {
    return unwrapApiResponse(
      apiClient.get<ApiResponse<string[]>>('/locations/talukas', {
        params: { state, district },
      }),
    );
  },

  listAreas: async (
    state: string,
    district: string,
    taluk: string,
  ): Promise<LocationRecord[]> => {
    return unwrapApiResponse(
      apiClient.get<ApiResponse<LocationRecord[]>>('/locations/areas', {
        params: { state, district, taluk },
      }),
    );
  },

  search: async (
    q: string,
    options: Omit<LocationSearchQuery, 'q'> = {},
  ): Promise<LocationRecord[]> => {
    const params = buildLocationSearchParams({
      q,
      limit: options.limit ?? LOCATION_SEARCH_LIMIT,
      state: options.state,
      district: options.district,
      taluk: options.taluk,
    });
    return unwrapApiResponse(
      apiClient.get<ApiResponse<LocationRecord[]>>('/locations/search', { params }),
    );
  },

  autocomplete: async (
    q: string,
    options: Pick<LocationSearchQuery, 'state' | 'district'> = {},
  ): Promise<LocationAutocompleteSuggestion[]> => {
    const params: Record<string, string> = { q: q.trim() };
    const state = options.state?.trim();
    const district = options.district?.trim();
    if (state) params.state = state;
    if (district) params.district = district;
    return unwrapApiResponse(
      apiClient.get<ApiResponse<LocationAutocompleteSuggestion[]>>('/locations/autocomplete', {
        params,
      }),
    );
  },
};
