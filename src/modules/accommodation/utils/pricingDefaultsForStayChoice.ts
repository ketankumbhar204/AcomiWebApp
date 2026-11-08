import type { StayChoice } from './shortStay';

/**
 * When the owner changes stay type, drop values that belong to the previous kind
 * so monthly catalog rent cannot leak into Short Stay or Until I Leave daily rent.
 */
export function pricingDefaultsForStayChoice(input: {
  choice: StayChoice;
  catalogRent?: number | null;
  catalogDeposit?: number | null;
}): {
  rentSnapshot: string;
  depositSnapshot: string;
  agreedTotal: string;
  clearExpectedExit: boolean;
} {
  const deposit =
    input.catalogDeposit != null && input.catalogDeposit > 0
      ? String(input.catalogDeposit)
      : '0';
  if (input.choice === 'SHORT') {
    return {
      rentSnapshot: '',
      depositSnapshot: deposit,
      agreedTotal: '',
      clearExpectedExit: true,
    };
  }
  if (input.choice === 'OPEN_ENDED') {
    // Daily rent is owner-entered; never prefill from monthly catalog rent.
    return {
      rentSnapshot: '',
      depositSnapshot: deposit,
      agreedTotal: '',
      clearExpectedExit: true,
    };
  }
  const rent =
    input.catalogRent != null && input.catalogRent > 0 ? String(input.catalogRent) : '';
  return {
    rentSnapshot: rent,
    depositSnapshot: deposit,
    agreedTotal: '',
    clearExpectedExit: false,
  };
}
