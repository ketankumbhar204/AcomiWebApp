import type { BedResponse, UpdateBedRequest } from '@/shared/types/accommodation';
import { accommodationApi } from '../api/accommodationApi';
import type { PricingField } from '../setup-preview/setupPricingAutofill';

export async function commitBedPricingField(options: {
  spaceId: string;
  roomId: string;
  bedId: string;
  field: PricingField;
  value: number | null;
}): Promise<BedResponse> {
  const { spaceId, roomId, bedId, field, value } = options;
  const bed = await accommodationApi.getBed(spaceId, bedId);
  const body: UpdateBedRequest = {
    name: bed.name,
    bedNumber: bed.bedNumber,
    status: bed.status,
    defaultRent: field === 'defaultRent' ? value : (bed.defaultRent ?? null),
    defaultDeposit: field === 'defaultDeposit' ? value : (bed.defaultDeposit ?? null),
  };
  return accommodationApi.updateBed(spaceId, roomId, bedId, body);
}
