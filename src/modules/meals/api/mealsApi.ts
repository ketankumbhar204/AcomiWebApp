import apiClient from '@/shared/api/client';
import { unwrapApiResponse, unwrapVoidResponse } from '@/shared/api/apiRequest';
import type { ApiResponse, PagedResponse } from '@/shared/types/api';
import type {
  CopyDailyMenuRequest,
  CreateFoodCategoryRequest,
  CreateFoodItemRequest,
  CreateMealComboRequest,
  CreateMealParticipationRequest,
  CreateMealPlanRequest,
  DailyMenuResponse,
  FoodCategoryResponse,
  FoodItemResponse,
  MealComboResponse,
  MealDeliveryLocation,
  MealEligibilitySummaryResponse,
  MealEligibleParticipantResponse,
  MealHeadcountDayResponse,
  MealHeadcountDetailResponse,
  MealParticipationResponse,
  MealParticipationSearchParams,
  MealPlanResponse,
  MealPollDayResponse,
  MealPollSlot,
  MealSharePreviewResponse,
  MealType,
  MemberMealActivityDayDetail,
  MemberMealActivityMonth,
  MealPollPaymentChoice,
  MealPollPaymentEvent,
  BulkMealPollPaymentProofResponse,
  SubmitMealPollSelection,
  UpdateFoodItemDefaultPriceRequest,
  UpdateFoodItemExtraRequest,
  UpdateFoodItemRequest,
  UpdateMealComboRequest,
  UpdateMealParticipationRequest,
  UpsertDailyMenuRequest,
} from '@/shared/types/meals';
import type { SubmitPaymentProofRequest } from '@/shared/types/payments';

export const mealsApi = {
  getMealPlans: (spaceId: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<MealPlanResponse[]>>(`/spaces/${spaceId}/meal-plans`),
    ),

  createMealPlan: (spaceId: string, body: CreateMealPlanRequest) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<MealPlanResponse>>(`/spaces/${spaceId}/meal-plans`, body),
    ),

  getMealParticipations: async (spaceId: string, params?: MealParticipationSearchParams) => {
    const page = await unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<MealParticipationResponse>>>(
        `/spaces/${spaceId}/meal-participations`,
        { params },
      ),
    );
    return page.content ?? [];
  },

  createMealParticipation: (spaceId: string, body: CreateMealParticipationRequest) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<MealParticipationResponse>>(
        `/spaces/${spaceId}/meal-participations`,
        body,
      ),
    ),

  updateMealParticipation: (
    spaceId: string,
    participationId: string,
    body: UpdateMealParticipationRequest,
  ) =>
    unwrapApiResponse(
      apiClient.put<ApiResponse<MealParticipationResponse>>(
        `/spaces/${spaceId}/meal-participations/${participationId}`,
        body,
      ),
    ),

  pauseMealParticipation: (spaceId: string, participationId: string) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<MealParticipationResponse>>(
        `/spaces/${spaceId}/meal-participations/${participationId}/pause`,
      ),
    ),

  resumeMealParticipation: (spaceId: string, participationId: string) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<MealParticipationResponse>>(
        `/spaces/${spaceId}/meal-participations/${participationId}/resume`,
      ),
    ),

  stopMealParticipation: async (spaceId: string, participationId: string) => {
    await unwrapVoidResponse(
      apiClient.post(`/spaces/${spaceId}/meal-participations/${participationId}/stop`),
    );
  },

  getMealCombos: (spaceId: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<MealComboResponse[]>>(`/spaces/${spaceId}/meal-combos`),
    ),

  createMealCombo: (spaceId: string, body: CreateMealComboRequest) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<MealComboResponse>>(`/spaces/${spaceId}/meal-combos`, body),
    ),

  updateMealCombo: (spaceId: string, comboId: string, body: UpdateMealComboRequest) =>
    unwrapApiResponse(
      apiClient.put<ApiResponse<MealComboResponse>>(
        `/spaces/${spaceId}/meal-combos/${comboId}`,
        body,
      ),
    ),

  updateMealComboPrice: (
    spaceId: string,
    comboId: string,
    body: UpdateFoodItemDefaultPriceRequest,
  ) =>
    unwrapApiResponse(
      apiClient.put<ApiResponse<MealComboResponse>>(
        `/spaces/${spaceId}/meal-combos/${comboId}/price`,
        body,
      ),
    ),

  deactivateMealCombo: async (spaceId: string, comboId: string) => {
    await unwrapVoidResponse(
      apiClient.post(`/spaces/${spaceId}/meal-combos/${comboId}/deactivate`),
    );
  },

  getFoodCategories: (spaceId: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<FoodCategoryResponse[]>>(
        `/spaces/${spaceId}/food-categories`,
      ),
    ),

  createFoodCategory: (spaceId: string, body: CreateFoodCategoryRequest) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<FoodCategoryResponse>>(
        `/spaces/${spaceId}/food-categories`,
        body,
      ),
    ),

  deactivateFoodCategory: async (spaceId: string, categoryId: string) => {
    await unwrapVoidResponse(
      apiClient.post(`/spaces/${spaceId}/food-categories/${categoryId}/deactivate`),
    );
  },

  getFoodItems: (spaceId: string, categoryId?: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<FoodItemResponse[]>>(`/spaces/${spaceId}/food-items`, {
        params: categoryId ? { categoryId } : undefined,
      }),
    ),

  createFoodItem: (spaceId: string, body: CreateFoodItemRequest) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<FoodItemResponse>>(`/spaces/${spaceId}/food-items`, body),
    ),

  updateFoodItem: (spaceId: string, itemId: string, body: UpdateFoodItemRequest) =>
    unwrapApiResponse(
      apiClient.put<ApiResponse<FoodItemResponse>>(
        `/spaces/${spaceId}/food-items/${itemId}`,
        body,
      ),
    ),

  updateFoodItemDefaultPrice: (
    spaceId: string,
    itemId: string,
    body: UpdateFoodItemDefaultPriceRequest,
  ) =>
    unwrapApiResponse(
      apiClient.put<ApiResponse<FoodItemResponse>>(
        `/spaces/${spaceId}/food-items/${itemId}/default-price`,
        body,
      ),
    ),

  updateFoodItemExtra: (spaceId: string, itemId: string, body: UpdateFoodItemExtraRequest) =>
    unwrapApiResponse(
      apiClient.put<ApiResponse<FoodItemResponse>>(
        `/spaces/${spaceId}/food-items/${itemId}/extra`,
        body,
      ),
    ),

  deactivateFoodItem: async (spaceId: string, itemId: string) => {
    await unwrapVoidResponse(
      apiClient.post(`/spaces/${spaceId}/food-items/${itemId}/deactivate`),
    );
  },

  getDailyMenusToday: (spaceId: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<DailyMenuResponse[]>>(`/spaces/${spaceId}/daily-menus/today`),
    ),

  getDailyMenusByDate: (spaceId: string, menuDate: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<DailyMenuResponse[]>>(
        `/spaces/${spaceId}/daily-menus/${menuDate}`,
      ),
    ),

  getDailyMenusRange: (spaceId: string, from: string, to: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<DailyMenuResponse[]>>(`/spaces/${spaceId}/daily-menus`, {
        params: { from, to },
      }),
    ),

  getDailyMenu: (spaceId: string, menuDate: string, mealType: MealType) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<DailyMenuResponse>>(
        `/spaces/${spaceId}/daily-menus/${menuDate}/${mealType}`,
      ),
    ),

  upsertDailyMenu: (
    spaceId: string,
    menuDate: string,
    mealType: MealType,
    body: UpsertDailyMenuRequest,
  ) =>
    unwrapApiResponse(
      apiClient.put<ApiResponse<DailyMenuResponse>>(
        `/spaces/${spaceId}/daily-menus/${menuDate}/${mealType}`,
        body,
      ),
    ),

  publishDailyMenu: (spaceId: string, menuDate: string, mealType: MealType) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<DailyMenuResponse>>(
        `/spaces/${spaceId}/daily-menus/${menuDate}/${mealType}/publish`,
      ),
    ),

  deleteDailyMenu: async (spaceId: string, menuDate: string, mealType: MealType) => {
    await unwrapVoidResponse(
      apiClient.delete(`/spaces/${spaceId}/daily-menus/${menuDate}/${mealType}`),
    );
  },

  copyDailyMenu: (
    spaceId: string,
    targetDate: string,
    mealType: MealType,
    sourceDate: string,
    body?: CopyDailyMenuRequest,
  ) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<DailyMenuResponse>>(
        `/spaces/${spaceId}/daily-menus/${targetDate}/${mealType}/copy-from/${sourceDate}`,
        body ?? {},
      ),
    ),

  getSharePreview: (spaceId: string, menuDate: string, mealType?: MealType) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<MealSharePreviewResponse>>(
        `/spaces/${spaceId}/meals/share-preview`,
        { params: { date: menuDate, mealType } },
      ),
    ),

  getEligibilitySummary: (spaceId: string, date: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<MealEligibilitySummaryResponse>>(
        `/spaces/${spaceId}/meals/eligibility-summary`,
        { params: { date } },
      ),
    ),

  getEligibleParticipants: (spaceId: string, menuDate: string, mealType: MealType) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<MealEligibleParticipantResponse[]>>(
        `/spaces/${spaceId}/meals/eligible-participants`,
        { params: { date: menuDate, mealType } },
      ),
    ),

  getMealHeadcountDay: (spaceId: string, menuDate: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<MealHeadcountDayResponse>>(
        `/spaces/${spaceId}/meals/headcount`,
        { params: { date: menuDate } },
      ),
    ),

  getMealHeadcountDetail: (spaceId: string, menuDate: string, mealType: MealType) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<MealHeadcountDetailResponse>>(
        `/spaces/${spaceId}/meals/headcount`,
        { params: { date: menuDate, mealType } },
      ),
    ),

  getMealPolls: (spaceId: string, menuDate: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<MealPollDayResponse>>(`/spaces/${spaceId}/meal-polls`, {
        params: { date: menuDate },
      }),
    ),

  openMealPoll: (spaceId: string, menuDate: string, mealType: MealType) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<MealPollSlot>>(
        `/spaces/${spaceId}/meal-polls/${menuDate}/${mealType}/open`,
      ),
    ),

  closeMealPoll: (spaceId: string, menuDate: string, mealType: MealType) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<MealPollSlot>>(
        `/spaces/${spaceId}/meal-polls/${menuDate}/${mealType}/close`,
      ),
    ),

  submitMealPollResponses: (
    spaceId: string,
    menuDate: string,
    selections: SubmitMealPollSelection[],
    paymentChoice?: MealPollPaymentChoice,
    proofImageBase64?: string,
  ) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<MealPollDayResponse>>(
        `/spaces/${spaceId}/meal-polls/${menuDate}/responses`,
        {
          selections,
          ...(paymentChoice ? { paymentChoice } : {}),
          ...(proofImageBase64 ? { proofImageBase64 } : {}),
        },
      ),
    ),

  getMemberMealActivity: (spaceId: string, memberId: string, month?: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<MemberMealActivityMonth>>(
        `/spaces/${spaceId}/members/${memberId}/meal-activity`,
        { params: month ? { month } : undefined },
      ),
    ),

  getMemberMealActivityDay: async (spaceId: string, memberId: string, date: string) => {
    const encoded = encodeURIComponent(date);
    try {
      return await unwrapApiResponse(
        apiClient.get<ApiResponse<MemberMealActivityDayDetail>>(
          `/spaces/${spaceId}/members/${memberId}/meal-activity/${encoded}`,
        ),
      );
    } catch {
      return unwrapApiResponse(
        apiClient.get<ApiResponse<MemberMealActivityDayDetail>>(
          `/spaces/${spaceId}/members/${memberId}/meal-activity`,
          { params: { date } },
        ),
      );
    }
  },

  submitMealPollPaymentProof: (
    spaceId: string,
    menuDate: string,
    proof: string | SubmitPaymentProofRequest,
  ) => {
    const body: SubmitPaymentProofRequest =
      typeof proof === 'string' ? { proofImageBase64: proof } : proof;
    return unwrapApiResponse(
      apiClient.post<ApiResponse<MealPollDayResponse>>(
        `/spaces/${spaceId}/meal-polls/${menuDate}/payment-proof`,
        body,
      ),
    );
  },

  submitBulkMealPollPaymentProof: (
    spaceId: string,
    dates: string[],
    proof: string | SubmitPaymentProofRequest,
  ) => {
    const body: SubmitPaymentProofRequest =
      typeof proof === 'string' ? { proofImageBase64: proof } : proof;
    return unwrapApiResponse(
      apiClient.post<ApiResponse<BulkMealPollPaymentProofResponse>>(
        `/spaces/${spaceId}/meal-polls/payment-proof/bulk`,
        { dates, ...body },
      ),
    );
  },

  approveMealPollPayment: (
    spaceId: string,
    menuDate: string,
    memberId: string,
    approvalRemarks?: string,
  ) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<MealPollDayResponse>>(
        `/spaces/${spaceId}/meal-polls/${menuDate}/payments/${memberId}/approve`,
        approvalRemarks ? { approvalRemarks } : {},
      ),
    ),

  rejectMealPollPayment: (
    spaceId: string,
    menuDate: string,
    memberId: string,
    rejectionReason?: string,
  ) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<MealPollDayResponse>>(
        `/spaces/${spaceId}/meal-polls/${menuDate}/payments/${memberId}/reject`,
        rejectionReason ? { rejectionReason } : {},
      ),
    ),

  sendMealPollPaymentReminder: (spaceId: string, menuDate: string, memberId: string) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<MealPollDayResponse>>(
        `/spaces/${spaceId}/meal-polls/${menuDate}/payments/${memberId}/remind`,
      ),
    ),

  getMemberMealPaymentEvents: (spaceId: string, memberId: string, month: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<MealPollPaymentEvent[]>>(
        `/spaces/${spaceId}/members/${memberId}/meal-payment-events`,
        { params: { month } },
      ),
    ),

  getMealDeliveryLocations: (spaceId: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<MealDeliveryLocation[]>>(
        `/spaces/${spaceId}/meal-delivery-locations`,
      ),
    ),

  getMealDeliveryLocationsManage: (spaceId: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<MealDeliveryLocation[]>>(
        `/spaces/${spaceId}/meal-delivery-locations/manage`,
      ),
    ),

  createMealDeliveryLocation: (
    spaceId: string,
    body: { name: string; description?: string; address?: string; sortOrder?: number },
  ) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<MealDeliveryLocation>>(
        `/spaces/${spaceId}/meal-delivery-locations`,
        body,
      ),
    ),

  updateMealDeliveryLocation: (
    spaceId: string,
    locationId: string,
    body: {
      name?: string;
      description?: string | null;
      address?: string | null;
      active?: boolean;
      sortOrder?: number;
    },
  ) =>
    unwrapApiResponse(
      apiClient.put<ApiResponse<MealDeliveryLocation>>(
        `/spaces/${spaceId}/meal-delivery-locations/${locationId}`,
        body,
      ),
    ),

  reorderMealDeliveryLocations: (spaceId: string, locationIdsInOrder: string[]) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<MealDeliveryLocation[]>>(
        `/spaces/${spaceId}/meal-delivery-locations/reorder`,
        { locationIdsInOrder },
      ),
    ),
};
