import type { BedResponse, UpdateBedRequest } from '@/shared/types/accommodation';
import { accommodationApi } from '../api/accommodationApi';
import type { PricingField } from '../setup-preview/setupPricingAutofill';

export function moneyEquals(
  left: number | null | undefined,
  right: number | null | undefined,
): boolean {
  return (left ?? null) === (right ?? null);
}

/** Pricing fields the existing PUT will send for a single-field edit. */
export function buildSubmittedBedPricing(
  currentRent: number | null | undefined,
  currentDeposit: number | null | undefined,
  field: PricingField,
  value: number | null,
): { defaultRent: number | null; defaultDeposit: number | null } {
  const currentDefaultRent = currentRent ?? null;
  const currentDefaultDeposit = currentDeposit ?? null;
  return {
    defaultRent: field === 'defaultRent' ? value : currentDefaultRent,
    defaultDeposit: field === 'defaultDeposit' ? value : currentDefaultDeposit,
  };
}

export async function commitBedPricingField(options: {
  spaceId: string;
  roomId: string;
  bedId: string;
  defaultRent: number | null;
  defaultDeposit: number | null;
}): Promise<BedResponse> {
  const { spaceId, roomId, bedId, defaultRent, defaultDeposit } = options;
  const bed = await accommodationApi.getBed(spaceId, bedId);
  const body: UpdateBedRequest = {
    name: bed.name,
    bedNumber: bed.bedNumber,
    status: bed.status,
    defaultRent,
    defaultDeposit,
  };
  return accommodationApi.updateBed(spaceId, roomId, bedId, body);
}
