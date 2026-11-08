import { describe, expect, it } from 'vitest';
import { getWizardSteps } from '../occupancyWizardSteps';
import { pricingDefaultsForStayChoice } from '../pricingDefaultsForStayChoice';

describe('getWizardSteps stay-type-first', () => {
  it('puts stay_type before member for ALLOCATE when a bed is known', () => {
    expect(getWizardSteps('ALLOCATE', { bedId: 'b1' })).toEqual([
      'stay_type',
      'member',
      'stay_details',
      'contract',
      'review',
    ]);
  });

  it('always includes stay_type for ALLOCATE even when shortStayEnabled is false', () => {
    expect(
      getWizardSteps('ALLOCATE', { bedId: 'b1', memberId: 'm1' }, { shortStayEnabled: false }),
    ).toEqual(['stay_type', 'stay_details', 'contract', 'review']);
  });

  it('puts stay_type before member for RESERVE', () => {
    expect(getWizardSteps('RESERVE', { bedId: 'b1' })).toEqual([
      'stay_type',
      'member',
      'reserve_dates',
      'contract',
      'review',
    ]);
  });

  it('includes stay_type for TRANSFER before destination pricing', () => {
    expect(getWizardSteps('TRANSFER', { memberId: 'm1', bedId: 'b1' })).toEqual([
      'transfer_current',
      'target',
      'stay_type',
      'stay_details',
      'contract',
      'review',
    ]);
  });

  it('does not add stay_type for VACATE', () => {
    expect(getWizardSteps('VACATE', { memberId: 'm1' })).toEqual(['vacate_confirm']);
  });
});

describe('pricingDefaultsForStayChoice', () => {
  it('does not carry monthly rent into Short Stay', () => {
    expect(
      pricingDefaultsForStayChoice({
        choice: 'SHORT',
        catalogRent: 6000,
        catalogDeposit: 3000,
      }),
    ).toEqual({
      rentSnapshot: '',
      depositSnapshot: '3000',
      agreedTotal: '',
      clearExpectedExit: true,
    });
  });

  it('prefills monthly catalog defaults for Monthly only', () => {
    expect(
      pricingDefaultsForStayChoice({
        choice: 'MONTHLY',
        catalogRent: 6000,
        catalogDeposit: 3000,
      }).rentSnapshot,
    ).toBe('6000');
    expect(
      pricingDefaultsForStayChoice({
        choice: 'OPEN_ENDED',
        catalogRent: 6000,
        catalogDeposit: 3000,
      }).rentSnapshot,
    ).toBe('');
  });
});
