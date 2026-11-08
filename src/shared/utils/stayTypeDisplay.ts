/**
 * Shared owner-facing Stay Type labels and compact supporting copy.
 * API enums stay MONTHLY / SHORT / OPEN_ENDED — never show those to owners.
 *
 * Source of truth for labels: accommodation shortStay + stayFinancialDisplay.
 * This module is the cross-module entry point (members, payments, dashboard, accommodation).
 */

import {
  stayChoiceDefaultLabel,
  stayChoiceLabelKey,
  type StayChoice,
} from '@/modules/accommodation/utils/shortStay';
import {
  buildStayFinancialPresentation,
  resolveOccupancyStayKind,
  type StayFinancialSource,
  type StayKind,
} from '@/modules/accommodation/utils/stayFinancialDisplay';

export type { StayChoice, StayKind };

export { stayChoiceDefaultLabel, stayChoiceLabelKey, resolveOccupancyStayKind };

/** True when the payload has an explicit stayKind enum (not pricingBasis-inferred). */
export function hasExplicitStayKind(
  source: Pick<StayFinancialSource, 'stayKind'> | null | undefined,
): boolean {
  return (
    source?.stayKind === 'MONTHLY' ||
    source?.stayKind === 'SHORT' ||
    source?.stayKind === 'OPEN_ENDED'
  );
}

/**
 * Resolves stay kind for display.
 * Prefer explicit stayKind; otherwise use established pricingBasis legacy mapping
 * (DAILY_RATE → OPEN_ENDED, FIXED_TOTAL → SHORT, else MONTHLY).
 */
export function resolveStayTypeForDisplay(
  source: Pick<StayFinancialSource, 'stayKind' | 'pricingBasis'> | null | undefined,
): StayKind | null {
  if (!source) {
    return null;
  }
  if (hasExplicitStayKind(source)) {
    return source.stayKind as StayKind;
  }
  if (source.pricingBasis === 'DAILY_RATE' || source.pricingBasis === 'FIXED_TOTAL') {
    return resolveOccupancyStayKind(source);
  }
  // Null stayKind with no pricingBasis: do not invent a label at call sites that
  // require explicit data. Callers that need legacy MONTHLY may use resolveOccupancyStayKind.
  return null;
}

export function stayTypeLabelKey(kind: StayKind): string {
  return stayChoiceLabelKey(kind);
}

export function stayTypeDefaultLabel(kind: StayKind): string {
  return stayChoiceDefaultLabel(kind);
}

/** Compact pricing / checkout supporting line for cards and tables. */
export function stayTypeSupportingText(
  source: StayFinancialSource,
  options?: { notRecorded?: string },
): string | null {
  const presentation = buildStayFinancialPresentation(source, options);
  if (presentation.stayKind === 'SHORT') {
    const daily = presentation.rows.find((r) => r.key === 'dailyRent')?.value;
    const checkout =
      (source.expectedCheckoutDate ?? source.expectedExitDate)?.slice(0, 10) ?? null;
    const parts = [daily, checkout ? `Checkout ${checkout}` : null].filter(Boolean);
    return parts.length > 0 ? parts.join(' · ') : null;
  }
  if (presentation.stayKind === 'OPEN_ENDED') {
    const daily = presentation.rows.find((r) => r.key === 'dailyRent')?.value;
    const parts = [daily, 'Move-out not fixed'].filter(Boolean);
    return parts.length > 0 ? parts.join(' · ') : null;
  }
  const rent = presentation.rows.find((r) => r.key === 'monthlyRent')?.value;
  const notRecorded = options?.notRecorded ?? 'Not recorded';
  if (!rent || rent === notRecorded) {
    return null;
  }
  return rent.includes('/month') ? rent : `${rent}/month`;
}

export type StayTypeChipModel = {
  kind: StayKind;
  labelKey: string;
  labelDefault: string;
  supportingText: string | null;
};

/**
 * Builds a compact Stay Type chip model when stay information is available.
 * Returns null when neither stayKind nor pricingBasis can identify a stay type.
 */
export function buildStayTypeChipModel(
  source: StayFinancialSource | null | undefined,
  options?: { notRecorded?: string; requireExplicitStayKind?: boolean },
): StayTypeChipModel | null {
  if (!source) {
    return null;
  }
  if (options?.requireExplicitStayKind && !hasExplicitStayKind(source)) {
    return null;
  }
  const kind = options?.requireExplicitStayKind
    ? (source.stayKind as StayKind)
    : resolveOccupancyStayKind(source);
  if (options?.requireExplicitStayKind && !kind) {
    return null;
  }
  return {
    kind,
    labelKey: stayTypeLabelKey(kind),
    labelDefault: stayTypeDefaultLabel(kind),
    supportingText: stayTypeSupportingText(source, options),
  };
}
