import apiClient from '@/shared/api/client';
import { unwrapApiResponse } from '@/shared/api/apiRequest';
import type { ApiResponse } from '@/shared/types/api';
import type {
  SpaceBillingSettings,
  UpdateSpaceBillingSettingsRequest,
} from '@/shared/types/payments';

export const billingSettingsApi = {
  getSettings: (spaceId: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<SpaceBillingSettings>>(
        `/spaces/${spaceId}/billing-settings`,
      ),
    ),

  updateSettings: (spaceId: string, payload: UpdateSpaceBillingSettingsRequest) =>
    unwrapApiResponse(
      apiClient.put<ApiResponse<SpaceBillingSettings>>(
        `/spaces/${spaceId}/billing-settings`,
        payload,
      ),
    ),
};
