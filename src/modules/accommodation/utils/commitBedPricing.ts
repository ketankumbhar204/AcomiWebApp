import type { BedResponse, UpdateBedRequest } from '@/shared/types/accommodation';
import { accommodationApi } from '../api/accommodationApi';
import type { PricingField } from '../setup-preview/setupPricingAutofill';

export function moneyEquals(
  left: number | null | undefined,
  right: number | null | undefined,
): boolean {
  return (left ?? null) === (right ?? null);
}

export function formatPricingMoney(value: number | null | undefined, notSet = 'Not set'): string {
  if (value == null || Number.isNaN(value)) {
    return notSet;
  }
  return `₹${value.toLocaleString('en-IN')}`;
}

export function buildSubmittedBedPricingValues(
  nextRent: number | null | undefined,
  nextDeposit: number | null | undefined,
): { defaultRent: number | null; defaultDeposit: number | null } {
  return {
    defaultRent: nextRent ?? null,
    defaultDeposit: nextDeposit ?? null,
  };
}

export function changedPricingFields(
  currentRent: number | null | undefined,
  currentDeposit: number | null | undefined,
  nextRent: number | null | undefined,
  nextDeposit: number | null | undefined,
): PricingField[] {
  const changed: PricingField[] = [];
  if (!moneyEquals(currentRent, nextRent)) {
    changed.push('defaultRent');
  }
  if (!moneyEquals(currentDeposit, nextDeposit)) {
    changed.push('defaultDeposit');
  }
  return changed;
}

/** Pricing fields the existing PUT will send for a single-field edit. */
export function buildSubmittedBedPricing(
  currentRent: number | null | undefined,
  currentDeposit: number | null | undefined,
  field: PricingField,
  value: number | null,
): { defaultRent: number | null; defaultDeposit: number | null } {
  return buildSubmittedBedPricingValues(
    field === 'defaultRent' ? value : (currentRent ?? null),
    field === 'defaultDeposit' ? value : (currentDeposit ?? null),
  );
}

export async function previewBedPricingScope(options: {
  spaceId: string;
  roomId: string;
  bedId: string;
  defaultRent: number | null;
  defaultDeposit: number | null;
}): Promise<{ affectedBedCount: number; affectedLocations: string[] }> {
  const result = await accommodationApi.previewBedPricing(
    options.spaceId,
    options.roomId,
    options.bedId,
    {
      defaultRent: options.defaultRent,
      defaultDeposit: options.defaultDeposit,
    },
  );
  return {
    affectedBedCount: result.affectedBedCount,
    affectedLocations: result.affectedLocations ?? [],
  };
}

export async function commitBedPricingField(options: {
  spaceId: string;
  roomId: string;
  bedId: string;
  defaultRent: number | null;
  defaultDeposit: number | null;
  name?: string;
  bedNumber?: string;
}): Promise<BedResponse> {
  const { spaceId, roomId, bedId, defaultRent, defaultDeposit } = options;
  const bed = await accommodationApi.getBed(spaceId, bedId);
  const body: UpdateBedRequest = {
    name: options.name ?? bed.name,
    bedNumber: options.bedNumber ?? bed.bedNumber,
    status: bed.status,
    defaultRent,
    defaultDeposit,
  };
  return accommodationApi.updateBed(spaceId, roomId, bedId, body);
}

export async function updateBedNumberOnly(options: {
  spaceId: string;
  roomId: string;
  bedId: string;
  bedNumber: string;
}): Promise<BedResponse> {
  const bed = await accommodationApi.getBed(options.spaceId, options.bedId);
  return accommodationApi.updateBed(options.spaceId, options.roomId, options.bedId, {
    name: options.bedNumber,
    bedNumber: options.bedNumber,
    status: bed.status,
    defaultRent: bed.defaultRent ?? null,
    defaultDeposit: bed.defaultDeposit ?? null,
  });
}
