import { parseOptionalMoney } from '../setup-preview/setupPricingAutofill';
import { moneyEquals } from './commitBedPricing';

export type BedInteractionDraft = {
  bedNumber: string;
  rent: number | null;
  deposit: number | null;
};

/**
 * Missing occupancy money: null, undefined, empty/whitespace, or unparsable.
 * ₹0 / "0" is populated and valid.
 */
export function isOccupancyMoneyMissing(
  value: string | number | null | undefined,
): boolean {
  if (value == null) {
    return true;
  }
  if (typeof value === 'number') {
    return Number.isNaN(value);
  }
  return parseOptionalMoney(value) == null;
}

export function isBedDraftUnchanged(
  current: BedInteractionDraft,
  next: BedInteractionDraft,
): boolean {
  return (
    current.bedNumber.trim() === next.bedNumber.trim() &&
    moneyEquals(current.rent, next.rent) &&
    moneyEquals(current.deposit, next.deposit)
  );
}

export function hasBedPricingChange(
  current: Pick<BedInteractionDraft, 'rent' | 'deposit'>,
  next: Pick<BedInteractionDraft, 'rent' | 'deposit'>,
): boolean {
  return !moneyEquals(current.rent, next.rent) || !moneyEquals(current.deposit, next.deposit);
}
