import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mealsApi } from '../api/mealsApi';
import type {
  CreateFoodCategoryRequest,
  CreateFoodItemRequest,
  CreateMealComboRequest,
  CreateMealParticipationRequest,
  MealParticipationSearchParams,
  MealType,
  UpdateFoodItemDefaultPriceRequest,
  UpdateFoodItemExtraRequest,
  UpdateFoodItemRequest,
  UpdateMealComboRequest,
  UpdateMealParticipationRequest,
  UpsertDailyMenuRequest,
} from '@/shared/types/meals';

export function useDailyMenus(spaceId: string | undefined, menuDate: string, enabled = true) {
  const query = useQuery({
    queryKey: ['daily-menus', spaceId, menuDate],
    queryFn: () => mealsApi.getDailyMenusByDate(spaceId!, menuDate),
    enabled: Boolean(enabled && spaceId && menuDate),
    staleTime: 10_000,
  });
  return {
    menus: query.data ?? [],
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}

export function useMealPolls(spaceId: string | undefined, menuDate: string, enabled = true) {
  const query = useQuery({
    queryKey: ['meal-polls', spaceId, menuDate],
    queryFn: () => mealsApi.getMealPolls(spaceId!, menuDate),
    enabled: Boolean(enabled && spaceId && menuDate),
    staleTime: 10_000,
  });
  return {
    pollDay: query.data ?? null,
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}

export function useEligibilitySummary(
  spaceId: string | undefined,
  menuDate: string,
  enabled = true,
) {
  const query = useQuery({
    queryKey: ['meal-eligibility', spaceId, menuDate],
    queryFn: () => mealsApi.getEligibilitySummary(spaceId!, menuDate),
    enabled: Boolean(enabled && spaceId && menuDate),
    staleTime: 15_000,
  });
  return {
    summary: query.data ?? null,
    loading: query.isLoading || query.isFetching,
    reload: () => query.refetch(),
  };
}

export function useMealHeadcountDay(
  spaceId: string | undefined,
  menuDate: string,
  enabled = true,
) {
  const query = useQuery({
    queryKey: ['meal-headcount', spaceId, menuDate],
    queryFn: () => mealsApi.getMealHeadcountDay(spaceId!, menuDate),
    enabled: Boolean(enabled && spaceId && menuDate),
    staleTime: 10_000,
  });
  return {
    headcount: query.data ?? null,
    loading: query.isLoading || query.isFetching,
    reload: () => query.refetch(),
  };
}

export function useFoodCategories(spaceId: string | undefined, enabled = true) {
  const query = useQuery({
    queryKey: ['food-categories', spaceId],
    queryFn: () => mealsApi.getFoodCategories(spaceId!),
    enabled: Boolean(enabled && spaceId),
    staleTime: 30_000,
  });
  return {
    categories: query.data ?? [],
    loading: query.isLoading || query.isFetching,
    reload: () => query.refetch(),
  };
}

export function useFoodItems(
  spaceId: string | undefined,
  categoryId?: string,
  enabled = true,
) {
  const query = useQuery({
    queryKey: ['food-items', spaceId, categoryId ?? 'all'],
    queryFn: () => mealsApi.getFoodItems(spaceId!, categoryId),
    enabled: Boolean(enabled && spaceId),
    staleTime: 20_000,
  });
  return {
    items: query.data ?? [],
    loading: query.isLoading || query.isFetching,
    reload: () => query.refetch(),
  };
}

export function useMealCombos(spaceId: string | undefined, enabled = true) {
  const query = useQuery({
    queryKey: ['meal-combos', spaceId],
    queryFn: () => mealsApi.getMealCombos(spaceId!),
    enabled: Boolean(enabled && spaceId),
    staleTime: 20_000,
  });
  return {
    combos: query.data ?? [],
    loading: query.isLoading || query.isFetching,
    reload: () => query.refetch(),
  };
}

export function useMealPlans(spaceId: string | undefined, enabled = true) {
  const query = useQuery({
    queryKey: ['meal-plans', spaceId],
    queryFn: () => mealsApi.getMealPlans(spaceId!),
    enabled: Boolean(enabled && spaceId),
    staleTime: 60_000,
  });
  return {
    plans: query.data ?? [],
    loading: query.isLoading || query.isFetching,
    reload: () => query.refetch(),
  };
}

export function useMealParticipations(
  spaceId: string | undefined,
  params?: MealParticipationSearchParams,
  enabled = true,
) {
  const query = useQuery({
    queryKey: ['meal-participations', spaceId, params],
    queryFn: () => mealsApi.getMealParticipations(spaceId!, params),
    enabled: Boolean(enabled && spaceId),
    staleTime: 15_000,
  });
  return {
    participations: query.data ?? [],
    loading: query.isLoading || query.isFetching,
    reload: () => query.refetch(),
  };
}

export function useDeliveryLocations(
  spaceId: string | undefined,
  manage = false,
  enabled = true,
) {
  const query = useQuery({
    queryKey: ['meal-delivery-locations', spaceId, manage ? 'manage' : 'active'],
    queryFn: () =>
      manage
        ? mealsApi.getMealDeliveryLocationsManage(spaceId!)
        : mealsApi.getMealDeliveryLocations(spaceId!),
    enabled: Boolean(enabled && spaceId),
    staleTime: 30_000,
  });
  return {
    locations: query.data ?? [],
    loading: query.isLoading || query.isFetching,
    reload: () => query.refetch(),
  };
}

export function useMealMutations(spaceId: string | undefined) {
  const queryClient = useQueryClient();

  const invalidateMenus = async () => {
    await queryClient.invalidateQueries({
      predicate: (q) =>
        String(q.queryKey[0]).includes('daily-menu') ||
        String(q.queryKey[0]).includes('meal-poll') ||
        String(q.queryKey[0]).includes('meal-headcount') ||
        String(q.queryKey[0]).includes('meal-eligibility'),
    });
  };

  const invalidateLibrary = async () => {
    await queryClient.invalidateQueries({
      predicate: (q) =>
        String(q.queryKey[0]).includes('food-') || String(q.queryKey[0]).includes('meal-combo'),
    });
  };

  return {
    upsertDailyMenu: useMutation({
      mutationFn: ({
        menuDate,
        mealType,
        body,
      }: {
        menuDate: string;
        mealType: MealType;
        body: UpsertDailyMenuRequest;
      }) => mealsApi.upsertDailyMenu(spaceId!, menuDate, mealType, body),
      onSuccess: invalidateMenus,
    }),
    publishDailyMenu: useMutation({
      mutationFn: ({ menuDate, mealType }: { menuDate: string; mealType: MealType }) =>
        mealsApi.publishDailyMenu(spaceId!, menuDate, mealType),
      onSuccess: invalidateMenus,
    }),
    deleteDailyMenu: useMutation({
      mutationFn: ({ menuDate, mealType }: { menuDate: string; mealType: MealType }) =>
        mealsApi.deleteDailyMenu(spaceId!, menuDate, mealType),
      onSuccess: invalidateMenus,
    }),
    copyDailyMenu: useMutation({
      mutationFn: ({
        targetDate,
        mealType,
        sourceDate,
        publish,
      }: {
        targetDate: string;
        mealType: MealType;
        sourceDate: string;
        publish?: boolean;
      }) =>
        mealsApi.copyDailyMenu(spaceId!, targetDate, mealType, sourceDate, {
          force: true,
          publish,
        }),
      onSuccess: invalidateMenus,
    }),
    openMealPoll: useMutation({
      mutationFn: ({ menuDate, mealType }: { menuDate: string; mealType: MealType }) =>
        mealsApi.openMealPoll(spaceId!, menuDate, mealType),
      onSuccess: invalidateMenus,
    }),
    closeMealPoll: useMutation({
      mutationFn: ({ menuDate, mealType }: { menuDate: string; mealType: MealType }) =>
        mealsApi.closeMealPoll(spaceId!, menuDate, mealType),
      onSuccess: invalidateMenus,
    }),
    createFoodCategory: useMutation({
      mutationFn: (body: CreateFoodCategoryRequest) =>
        mealsApi.createFoodCategory(spaceId!, body),
      onSuccess: invalidateLibrary,
    }),
    deactivateFoodCategory: useMutation({
      mutationFn: (categoryId: string) => mealsApi.deactivateFoodCategory(spaceId!, categoryId),
      onSuccess: invalidateLibrary,
    }),
    createFoodItem: useMutation({
      mutationFn: (body: CreateFoodItemRequest) => mealsApi.createFoodItem(spaceId!, body),
      onSuccess: invalidateLibrary,
    }),
    updateFoodItem: useMutation({
      mutationFn: ({ itemId, body }: { itemId: string; body: UpdateFoodItemRequest }) =>
        mealsApi.updateFoodItem(spaceId!, itemId, body),
      onSuccess: invalidateLibrary,
    }),
    updateFoodItemExtra: useMutation({
      mutationFn: ({ itemId, body }: { itemId: string; body: UpdateFoodItemExtraRequest }) =>
        mealsApi.updateFoodItemExtra(spaceId!, itemId, body),
      onSuccess: invalidateLibrary,
    }),
    updateFoodItemDefaultPrice: useMutation({
      mutationFn: ({
        itemId,
        body,
      }: {
        itemId: string;
        body: UpdateFoodItemDefaultPriceRequest;
      }) => mealsApi.updateFoodItemDefaultPrice(spaceId!, itemId, body),
      onSuccess: invalidateLibrary,
    }),
    deactivateFoodItem: useMutation({
      mutationFn: (itemId: string) => mealsApi.deactivateFoodItem(spaceId!, itemId),
      onSuccess: invalidateLibrary,
    }),
    createMealCombo: useMutation({
      mutationFn: (body: CreateMealComboRequest) => mealsApi.createMealCombo(spaceId!, body),
      onSuccess: invalidateLibrary,
    }),
    updateMealCombo: useMutation({
      mutationFn: ({ comboId, body }: { comboId: string; body: UpdateMealComboRequest }) =>
        mealsApi.updateMealCombo(spaceId!, comboId, body),
      onSuccess: invalidateLibrary,
    }),
    deactivateMealCombo: useMutation({
      mutationFn: (comboId: string) => mealsApi.deactivateMealCombo(spaceId!, comboId),
      onSuccess: invalidateLibrary,
    }),
    createParticipation: useMutation({
      mutationFn: (body: CreateMealParticipationRequest) =>
        mealsApi.createMealParticipation(spaceId!, body),
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ['meal-participations', spaceId] });
      },
    }),
    updateParticipation: useMutation({
      mutationFn: ({
        participationId,
        body,
      }: {
        participationId: string;
        body: UpdateMealParticipationRequest;
      }) => mealsApi.updateMealParticipation(spaceId!, participationId, body),
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ['meal-participations', spaceId] });
      },
    }),
    pauseParticipation: useMutation({
      mutationFn: (participationId: string) =>
        mealsApi.pauseMealParticipation(spaceId!, participationId),
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ['meal-participations', spaceId] });
      },
    }),
    resumeParticipation: useMutation({
      mutationFn: (participationId: string) =>
        mealsApi.resumeMealParticipation(spaceId!, participationId),
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ['meal-participations', spaceId] });
      },
    }),
    stopParticipation: useMutation({
      mutationFn: (participationId: string) =>
        mealsApi.stopMealParticipation(spaceId!, participationId),
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ['meal-participations', spaceId] });
      },
    }),
    createDeliveryLocation: useMutation({
      mutationFn: (body: {
        name: string;
        description?: string;
        address?: string;
        sortOrder?: number;
      }) => mealsApi.createMealDeliveryLocation(spaceId!, body),
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ['meal-delivery-locations', spaceId] });
      },
    }),
    updateDeliveryLocation: useMutation({
      mutationFn: ({
        locationId,
        body,
      }: {
        locationId: string;
        body: {
          name?: string;
          description?: string | null;
          address?: string | null;
          active?: boolean;
        };
      }) => mealsApi.updateMealDeliveryLocation(spaceId!, locationId, body),
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ['meal-delivery-locations', spaceId] });
      },
    }),
  };
}
