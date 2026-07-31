import type { SpaceType } from '@/shared/types/space';

export type MealPricingContext = {
  spaceType?: SpaceType;
  foodIncludedInRent?: boolean;
};

/** MESS bills meals separately; accommodation spaces use polls mainly for headcount. */
export function usesSeparateMealBilling(ctx: MealPricingContext): boolean {
  return ctx.spaceType === 'MESS';
}

export function requiresMealPrices(ctx: MealPricingContext): boolean {
  return usesSeparateMealBilling(ctx);
}

export function showMealPrices(ctx: MealPricingContext): boolean {
  return usesSeparateMealBilling(ctx);
}

export function mealPricingContextFromSpaceType(spaceType?: SpaceType): MealPricingContext {
  return { spaceType };
}
