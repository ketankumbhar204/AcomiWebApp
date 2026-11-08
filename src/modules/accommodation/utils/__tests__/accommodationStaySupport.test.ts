import { describe, expect, it } from 'vitest';
import {
  ACCOMMODATION_STAY_SPACE_TYPES,
  hasConcreteAllocationTarget,
  stayTypesAvailableForSpace,
} from '../accommodationStaySupport';
import { getAllowedTargetTypes } from '../occupancyRules';
import { getWizardSteps } from '../occupancyWizardSteps';
import { pricingDefaultsForStayChoice } from '../pricingDefaultsForStayChoice';
import { mealsApplicableForSpace } from '@/spaceLifecycle/capabilities';

describe('accommodation stay support across SpaceTypes', () => {
  it('offers stay types for every accommodation type and not Mess', () => {
    for (const spaceType of ACCOMMODATION_STAY_SPACE_TYPES) {
      expect(stayTypesAvailableForSpace(spaceType)).toBe(true);
      expect(getAllowedTargetTypes(spaceType).length).toBeGreaterThan(0);
    }
    expect(stayTypesAvailableForSpace('MESS')).toBe(false);
  });

  it('maps inventory levels and skips target for concrete ids', () => {
    expect(getAllowedTargetTypes('PG')).toEqual(['BED']);
    expect(getAllowedTargetTypes('CO_LIVING')).toEqual(['BED', 'ROOM']);
    expect(getAllowedTargetTypes('RENTAL')).toEqual(['UNIT']);
    expect(getAllowedTargetTypes('CORPORATE_STAY')).toEqual(['UNIT']);
    expect(hasConcreteAllocationTarget('CO_LIVING', { roomId: 'r1' })).toBe(true);
    expect(hasConcreteAllocationTarget('PG', { roomId: 'r1' })).toBe(false);
  });

  it('uses stay-type-first allocate for bed, room, and unit', () => {
    expect(getWizardSteps('ALLOCATE', { bedId: 'b1' }, { spaceType: 'HOSTEL' })[0]).toBe(
      'stay_type',
    );
    expect(getWizardSteps('ALLOCATE', { roomId: 'r1' }, { spaceType: 'CO_LIVING' })[0]).toBe(
      'stay_type',
    );
    expect(getWizardSteps('ALLOCATE', { unitId: 'u1' }, { spaceType: 'RENTAL' })[0]).toBe(
      'stay_type',
    );
  });

  it('never prefills monthly catalog rent for Short Stay or Until I Leave', () => {
    expect(
      pricingDefaultsForStayChoice({
        choice: 'SHORT',
        catalogRent: 8500,
        catalogDeposit: 1000,
      }).rentSnapshot,
    ).toBe('');
    expect(
      pricingDefaultsForStayChoice({
        choice: 'OPEN_ENDED',
        catalogRent: 8500,
        catalogDeposit: 1000,
      }).rentSnapshot,
    ).toBe('');
  });

  it('matches rental meal exclusion with Web capabilities', () => {
    expect(mealsApplicableForSpace('RENTAL')).toBe(false);
    expect(mealsApplicableForSpace('CORPORATE_STAY')).toBe(true);
  });
});
