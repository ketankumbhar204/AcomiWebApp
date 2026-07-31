import { mealsApi } from '@/modules/meals/api/mealsApi';
import { todayIsoDate } from '@/modules/meals/utils/mealDates';
import type { MealParticipationResponse } from '@/shared/types/meals';

/** Best-effort FULL meal plan enrollment after import (mobile `enrollMemberInFullMeals`). */
export async function enrollMemberInFullMeals(
  spaceId: string,
  memberId: string,
): Promise<MealParticipationResponse | null> {
  const plans = await mealsApi.getMealPlans(spaceId);
  const fullPlan = plans.find((plan) => plan.code === 'FULL' && plan.isActive);
  if (!fullPlan) {
    return null;
  }
  return mealsApi.createMealParticipation(spaceId, {
    memberId,
    mealPlanId: fullPlan.mealPlanId,
    effectiveFrom: todayIsoDate(),
  });
}
