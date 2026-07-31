import apiClient from '@/shared/api/client';
import { unwrapApiResponse } from '@/shared/api/apiRequest';
import type { ApiResponse } from '@/shared/types/api';
import type {
  MealPollClosingSettings,
  UpdateMealPollClosingSettingsRequest,
} from '@/shared/types/space';

export const mealPollClosingApi = {
  getSettings: (spaceId: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<MealPollClosingSettings>>(
        `/spaces/${spaceId}/meal-poll-closing-settings`,
      ),
    ),

  updateSettings: (spaceId: string, payload: UpdateMealPollClosingSettingsRequest) =>
    unwrapApiResponse(
      apiClient.put<ApiResponse<MealPollClosingSettings>>(
        `/spaces/${spaceId}/meal-poll-closing-settings`,
        payload,
      ),
    ),
};
