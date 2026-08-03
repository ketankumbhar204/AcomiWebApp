import { addDaysIso, todayIsoDate } from './mealDates';

/** How far back customers may browse past menus / orders. */
export const CUSTOMER_MEAL_DATE_MIN_OFFSET = -90;
export const CUSTOMER_MEAL_DATE_MAX_OFFSET = 7;

/** Customers always land on today when opening the dashboard. */
export function resolveCustomerMealFocusDate(): string {
  return todayIsoDate();
}

export function customerMealDateBounds(): { minDate: string; maxDate: string } {
  const today = todayIsoDate();
  return {
    minDate: addDaysIso(today, CUSTOMER_MEAL_DATE_MIN_OFFSET),
    maxDate: addDaysIso(today, CUSTOMER_MEAL_DATE_MAX_OFFSET),
  };
}

export function canShiftCustomerMealDate(menuDate: string, delta: number): boolean {
  const { minDate, maxDate } = customerMealDateBounds();
  const nextDate = addDaysIso(menuDate, delta);
  return nextDate >= minDate && nextDate <= maxDate;
}
