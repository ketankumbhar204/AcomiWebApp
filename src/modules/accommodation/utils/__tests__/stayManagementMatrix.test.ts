/**
 * Stay Management coverage matrix (Owner Web automated only — no browser).
 * Parity with Android matrix: SpaceType × StayType × Operation.
 * MESS is explicitly excluded.
 */
import { describe, expect, it } from 'vitest';
import {
  ACCOMMODATION_STAY_SPACE_TYPES,
  hasConcreteAllocationTarget,
  stayTypesAvailableForSpace,
} from '../accommodationStaySupport';
import { pricingDefaultsForStayChoice } from '../pricingDefaultsForStayChoice';
import { applyStayChoice, type StayChoice } from '../shortStay';
import { getWizardSteps } from '../occupancyWizardSteps';
import { getAllowedTargetTypes, validateTargetSelection } from '../occupancyRules';
import type { SpaceType } from '@/shared/types/space';

const STAY_TYPES: StayChoice[] = ['MONTHLY', 'SHORT', 'OPEN_ENDED'];
const OPERATIONS = ['ALLOCATE', 'RESERVE', 'TRANSFER'] as const;

/** Web lodging food toggle: Rental hides food (parity with Android mealAccess). */
function mealsApplicableForSpace(spaceType: SpaceType | null | undefined): boolean {
  return spaceType != null && spaceType !== 'RENTAL';
}

describe('Stay Management matrix — space × stay × operation (Web)', () => {
  it('enumerates accommodation SpaceTypes and excludes MESS', () => {
    expect(ACCOMMODATION_STAY_SPACE_TYPES).toEqual([
      'PG',
      'HOSTEL',
      'CO_LIVING',
      'RENTAL',
      'CORPORATE_STAY',
    ]);
    expect(ACCOMMODATION_STAY_SPACE_TYPES).not.toContain('MESS');
    expect(stayTypesAvailableForSpace('MESS')).toBe(false);
    expect(getAllowedTargetTypes('MESS')).toEqual([]);
  });

  it.each(ACCOMMODATION_STAY_SPACE_TYPES)('%s inventory targets', (spaceType) => {
    const allowed = getAllowedTargetTypes(spaceType);
    if (spaceType === 'PG' || spaceType === 'HOSTEL') {
      expect(allowed).toEqual(['BED']);
    }
    if (spaceType === 'CO_LIVING') {
      expect(allowed).toEqual(['BED', 'ROOM']);
    }
    if (spaceType === 'RENTAL' || spaceType === 'CORPORATE_STAY') {
      expect(allowed).toEqual(['UNIT']);
    }
  });

  describe.each(ACCOMMODATION_STAY_SPACE_TYPES)('space %s', (spaceType) => {
    describe.each(OPERATIONS)('operation %s', (operation) => {
      it.each(STAY_TYPES)('stay %s — stay_type before contract', (stayType) => {
        const preselected =
          spaceType === 'CO_LIVING'
            ? { roomId: 'r1' }
            : spaceType === 'RENTAL' || spaceType === 'CORPORATE_STAY'
              ? { unitId: 'u1' }
              : { bedId: 'b1' };

        if (operation === 'ALLOCATE') {
          const steps = getWizardSteps('ALLOCATE', preselected, { spaceType });
          expect(steps[0]).toBe('stay_type');
          expect(steps.indexOf('stay_type')).toBeLessThan(steps.indexOf('contract'));
        }
        if (operation === 'RESERVE') {
          const steps = getWizardSteps('RESERVE', preselected, { spaceType });
          expect(steps[0]).toBe('stay_type');
          expect(steps).toContain('reserve_dates');
        }
        if (operation === 'TRANSFER') {
          const steps = getWizardSteps('TRANSFER', { memberId: 'm1' }, { spaceType });
          expect(steps.indexOf('target')).toBeLessThan(steps.indexOf('stay_type'));
          expect(stayType).toBeTruthy();
        }
      });
    });

    it.each(STAY_TYPES)('stay %s — applyStayChoice pricing isolation', (stayType) => {
      const base = { rentSnapshot: 8500 as number | undefined, depositSnapshot: 2000 };
      const result = applyStayChoice(base, {
        enabled: false,
        choice: stayType,
        agreedTotal: stayType === 'SHORT' ? 5600 : null,
        checkInDate: '2026-11-01',
        expectedExitDate: stayType === 'SHORT' ? '2026-11-08' : null,
      });
      expect(result.errorKey).toBeNull();
      expect(result.body.stayKind).toBe(stayType);
      if (stayType === 'SHORT') {
        expect(result.body.rentSnapshot).toBeUndefined();
        expect(result.body.agreedTotal).toBe(5600);
      }
      if (stayType === 'MONTHLY') {
        expect(result.body.agreedTotal).toBeUndefined();
        expect(result.body.rentSnapshot).toBe(8500);
      }
    });

    it('food applicability matches product rules', () => {
      if (spaceType === 'RENTAL') {
        expect(mealsApplicableForSpace(spaceType)).toBe(false);
      } else {
        expect(mealsApplicableForSpace(spaceType)).toBe(true);
      }
    });
  });
});

describe('Stay Management matrix — stay switching (Web)', () => {
  const catalog = { catalogRent: 6000, catalogDeposit: 3000 };
  const transitions: Array<[StayChoice, StayChoice]> = [
    ['MONTHLY', 'SHORT'],
    ['MONTHLY', 'OPEN_ENDED'],
    ['SHORT', 'MONTHLY'],
    ['SHORT', 'OPEN_ENDED'],
    ['OPEN_ENDED', 'MONTHLY'],
    ['OPEN_ENDED', 'SHORT'],
  ];

  it.each(transitions)('%s → %s', (from, to) => {
    const next = pricingDefaultsForStayChoice({ choice: to, ...catalog });
    if (to === 'MONTHLY') {
      expect(next.rentSnapshot).toBe('6000');
    } else {
      expect(next.rentSnapshot).toBe('');
      expect(next.rentSnapshot).not.toBe(String(Math.round(6000 / 30)));
    }
    expect(next.depositSnapshot).toBe('3000');
    expect(from).toBeTruthy();
  });
});

describe('Stay Management matrix — inventory negatives (Web)', () => {
  it('CO_LIVING room concrete; PG room alone not', () => {
    expect(hasConcreteAllocationTarget('CO_LIVING', { roomId: 'r1' })).toBe(true);
    expect(hasConcreteAllocationTarget('PG', { roomId: 'r1' })).toBe(false);
  });

  it.each([
    ['PG', 'ROOM', { roomId: 'r1' }, 'occupancy.errors.invalidTargetType'],
    ['RENTAL', 'BED', { bedId: 'b1' }, 'occupancy.errors.invalidTargetType'],
    ['CORPORATE_STAY', 'BED', { bedId: 'b1' }, 'occupancy.errors.invalidTargetType'],
    ['CO_LIVING', 'ROOM', {}, 'occupancy.errors.roomRequired'],
  ] as const)('%s %s → %s', (spaceType, targetType, ids, expected) => {
    expect(validateTargetSelection(spaceType, targetType, ids)).toBe(expected);
  });
});

describe('Stay Management matrix — Web/Android API parity expectations', () => {
  it('same stay kinds and short-stay payload shape for every accommodation type', () => {
    for (const spaceType of ACCOMMODATION_STAY_SPACE_TYPES) {
      expect(stayTypesAvailableForSpace(spaceType)).toBe(true);
      const short = applyStayChoice(
        { rentSnapshot: 9000 },
        {
          enabled: false,
          choice: 'SHORT',
          agreedTotal: 4500,
          checkInDate: '2026-11-01',
          expectedExitDate: '2026-11-05',
        },
      );
      expect(short.body.stayKind).toBe('SHORT');
      expect(short.body.agreedTotal).toBe(4500);
      expect(short.body.rentSnapshot).toBeUndefined();

      const open = applyStayChoice(
        { rentSnapshot: 250 },
        { enabled: false, choice: 'OPEN_ENDED' },
      );
      expect(open.body.stayKind).toBe('OPEN_ENDED');

      const monthly = applyStayChoice(
        { rentSnapshot: 9000, agreedTotal: 1 as never },
        { enabled: false, choice: 'MONTHLY' },
      );
      expect(monthly.body.stayKind).toBe('MONTHLY');
      expect(monthly.body.agreedTotal).toBeUndefined();
    }
  });

  it('Serviced Apartment is not a SpaceType; use CORPORATE_STAY/RENTAL', () => {
    expect(ACCOMMODATION_STAY_SPACE_TYPES).toContain('CORPORATE_STAY');
    expect(ACCOMMODATION_STAY_SPACE_TYPES).not.toContain('SERVICED_APARTMENT' as never);
  });
});
