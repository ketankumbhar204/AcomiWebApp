import { shortStayNightCount } from './shortStay';

export type StayKind = 'MONTHLY' | 'SHORT' | 'OPEN_ENDED';

export type StayFinancialSource = {
  stayKind?: StayKind | null;
  pricingBasis?: string | null;
  rentSnapshot?: number | null;
  priorRentSnapshot?: number | null;
  rentEffectiveMonth?: string | null;
  agreedTotal?: number | null;
  depositSnapshot?: number | null;
  foodEnabled?: boolean;
  foodIncludedInRent?: boolean;
  foodChargeSnapshot?: number | null;
  moveInDate?: string | null;
  actualMoveInAt?: string | null;
  expectedExitDate?: string | null;
  expectedCheckoutDate?: string | null;
};

export type StayFinancialRow = {
  key: string;
  labelKey: string;
  labelDefault: string;
  value: string;
  emphasize?: boolean;
};

export type StayFinancialPresentation = {
  stayKind: StayKind;
  stayTypeLabelKey: string;
  stayTypeLabelDefault: string;
  rows: StayFinancialRow[];
};

function formatInr(value: number | null | undefined, notRecorded: string): string {
  if (value == null || !Number.isFinite(value)) {
    return notRecorded;
  }
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

export function resolveOccupancyStayKind(
  source: Pick<StayFinancialSource, 'stayKind' | 'pricingBasis'>,
): StayKind {
  if (source.stayKind === 'SHORT' || source.stayKind === 'OPEN_ENDED' || source.stayKind === 'MONTHLY') {
    return source.stayKind;
  }
  if (source.pricingBasis === 'DAILY_RATE') {
    return 'OPEN_ENDED';
  }
  if (source.pricingBasis === 'FIXED_TOTAL') {
    return 'SHORT';
  }
  return 'MONTHLY';
}

/** OPEN_ENDED daily-rate stays bill after the period closes. */
export function isOpenEndedDailyRate(
  occupancy?: Pick<StayFinancialSource, 'stayKind' | 'pricingBasis'> | null,
): boolean {
  return occupancy?.stayKind === 'OPEN_ENDED' && occupancy?.pricingBasis === 'DAILY_RATE';
}

/** Compact rent rate line for occupied bed cards (mobile formatOccupancyRentRate). */
export function formatOccupancyRentRate(
  occupancy: Pick<StayFinancialSource, 'stayKind' | 'pricingBasis' | 'rentSnapshot' | 'agreedTotal'>,
  notRecorded = 'Not recorded',
): { labelKey: string; labelDefault: string; value: string } {
  const stayKind = resolveOccupancyStayKind(occupancy);
  if (stayKind === 'SHORT') {
    const daily = occupancy.rentSnapshot;
    return {
      labelKey: 'occupancy.contract.dailyRentPerNight',
      labelDefault: 'Daily rent (per night)',
      value:
        daily != null
          ? `${formatInr(daily, notRecorded)} / night`
          : occupancy.agreedTotal != null
            ? formatInr(occupancy.agreedTotal, notRecorded)
            : notRecorded,
    };
  }
  if (stayKind === 'OPEN_ENDED') {
    return {
      labelKey: 'occupancy.contract.dailyRent',
      labelDefault: 'Daily rent',
      value:
        occupancy.rentSnapshot != null
          ? `${formatInr(occupancy.rentSnapshot, notRecorded)} / day`
          : notRecorded,
    };
  }
  return {
    labelKey: 'accommodation.fields.rent',
    labelDefault: 'Monthly rent',
    value: formatInr(occupancy.rentSnapshot ?? null, notRecorded),
  };
}

export function buildStayFinancialPresentation(
  source: StayFinancialSource,
  options?: { notRecorded?: string },
): StayFinancialPresentation {
  const notRecorded = options?.notRecorded ?? 'Not recorded';
  const stayKind = resolveOccupancyStayKind(source);
  const deposit = formatInr(source.depositSnapshot ?? 0, notRecorded);
  const foodIncluded = Boolean(source.foodIncludedInRent) || Boolean(source.foodEnabled);
  const foodRow: StayFinancialRow = {
    key: 'food',
    labelKey: 'occupancy.contract.foodIncluded',
    labelDefault: 'Food included',
    value: foodIncluded ? 'yes' : 'no',
  };

  if (stayKind === 'SHORT') {
    const checkIn = (source.actualMoveInAt ?? source.moveInDate)?.slice(0, 10) ?? null;
    const checkout =
      (source.expectedCheckoutDate ?? source.expectedExitDate)?.slice(0, 10) ?? null;
    const nights = checkIn && checkout ? shortStayNightCount(checkIn, checkout) : null;
    const daily =
      source.rentSnapshot != null && source.rentSnapshot > 0
        ? source.rentSnapshot
        : source.agreedTotal != null && nights != null && nights > 0
          ? source.agreedTotal / nights
          : null;
    const stayRent =
      source.agreedTotal != null && source.agreedTotal > 0
        ? source.agreedTotal
        : daily != null && nights != null
          ? daily * nights
          : null;
    const rows: StayFinancialRow[] = [
      {
        key: 'dailyRent',
        labelKey: 'occupancy.contract.dailyRentPerNight',
        labelDefault: 'Daily rent (per night)',
        value: daily != null ? `${formatInr(daily, notRecorded)} / night` : notRecorded,
      },
    ];
    if (nights != null) {
      rows.push({
        key: 'duration',
        labelKey: 'occupancy.section.duration',
        labelDefault: 'Duration',
        value: `${nights} nights`,
      });
    }
    rows.push({
      key: 'stayRent',
      labelKey: 'occupancy.contract.stayRent',
      labelDefault: 'Total stay rent',
      value: formatInr(stayRent, notRecorded),
    });
    rows.push(foodRow);
    rows.push({
      key: 'deposit',
      labelKey: 'occupancy.contract.deposit',
      labelDefault: 'Security deposit (one-time)',
      value: deposit,
    });
    if (stayRent != null) {
      rows.push({
        key: 'totalPayable',
        labelKey: 'occupancy.contract.totalPayableAtMoveIn',
        labelDefault: 'Total payable at move-in',
        value: formatInr(stayRent + Math.max(0, source.depositSnapshot ?? 0), notRecorded),
        emphasize: true,
      });
    }
    return {
      stayKind,
      stayTypeLabelKey: 'occupancy.section.shortStayChoice',
      stayTypeLabelDefault: 'Daily',
      rows,
    };
  }

  if (stayKind === 'OPEN_ENDED') {
    const rows: StayFinancialRow[] = [
      {
        key: 'pricingBasis',
        labelKey: 'occupancy.contract.pricingBasis',
        labelDefault: 'Pricing basis',
        value: 'Daily',
      },
      {
        key: 'dailyRent',
        labelKey: 'occupancy.contract.dailyRent',
        labelDefault: 'Daily rent',
        value:
          source.rentSnapshot != null
            ? `${formatInr(source.rentSnapshot, notRecorded)} / day`
            : notRecorded,
      },
    ];
    if (source.rentEffectiveMonth) {
      rows.push({
        key: 'rentEffectiveFrom',
        labelKey: 'occupancy.reviseRent.effectiveFrom',
        labelDefault: 'Rate effective from',
        value: source.rentEffectiveMonth,
      });
    }
    if (source.priorRentSnapshot != null) {
      rows.push({
        key: 'priorDailyRent',
        labelKey: 'occupancy.reviseRent.priorDaily',
        labelDefault: 'Previous daily rent',
        value: `${formatInr(source.priorRentSnapshot, notRecorded)} / day`,
      });
    }
    rows.push(foodRow, {
      key: 'deposit',
      labelKey: 'occupancy.contract.deposit',
      labelDefault: 'Security deposit (one-time)',
      value: deposit,
    });
    return {
      stayKind,
      stayTypeLabelKey: 'occupancy.section.openEndedStayChoice',
      stayTypeLabelDefault: 'No Fixed Move-Out Date',
      rows,
    };
  }

  let monthlyTotal: number | null = source.rentSnapshot ?? null;
  if (
    monthlyTotal != null &&
    source.foodEnabled &&
    !source.foodIncludedInRent
  ) {
    monthlyTotal += source.foodChargeSnapshot ?? 0;
  }
  const rows: StayFinancialRow[] = [
    {
      key: 'monthlyRent',
      labelKey: 'occupancy.contract.rent',
      labelDefault: 'Monthly rent',
      value: formatInr(source.rentSnapshot, notRecorded),
    },
    foodRow,
    {
      key: 'deposit',
      labelKey: 'occupancy.contract.deposit',
      labelDefault: 'Security deposit (one-time)',
      value: deposit,
    },
  ];
  if (monthlyTotal != null) {
    rows.push({
      key: 'monthlyTotal',
      labelKey:
        source.foodEnabled && !source.foodIncludedInRent
          ? 'occupancy.contract.monthlyTotalWithFood'
          : 'occupancy.contract.monthlyTotal',
      labelDefault:
        source.foodEnabled && !source.foodIncludedInRent
          ? 'Monthly total (rent + food)'
          : 'Monthly total',
      value: formatInr(monthlyTotal, notRecorded),
      emphasize: true,
    });
  }
  return {
    stayKind,
    stayTypeLabelKey: 'occupancy.section.monthlyStayChoice',
    stayTypeLabelDefault: 'Monthly',
    rows,
  };
}
