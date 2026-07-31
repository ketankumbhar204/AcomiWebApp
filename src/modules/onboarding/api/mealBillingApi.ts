import apiClient from '@/shared/api/client';
import { unwrapApiResponse } from '@/shared/api/apiRequest';
import type { ApiResponse } from '@/shared/types/api';
import type {
  MealBillingSettings,
  UpdateMealBillingSettingsRequest,
} from '@/shared/types/space';

export const mealBillingApi = {
  getSettings: (spaceId: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<MealBillingSettings>>(
        `/spaces/${spaceId}/meal-billing-settings`,
      ),
    ),

  updateSettings: (spaceId: string, payload: UpdateMealBillingSettingsRequest) =>
    unwrapApiResponse(
      apiClient.put<ApiResponse<MealBillingSettings>>(
        `/spaces/${spaceId}/meal-billing-settings`,
        payload,
      ),
    ),
};
