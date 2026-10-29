/** Shared contract amount parsing. Empty and invalid text stay unset. */
export function parseContractAmount(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount < 0) {
    return null;
  }
  return amount;
}

/** Prefill text for a catalog price. Zero stays blank so the user must enter rent. */
export function catalogRentText(value: number | null | undefined): string {
  return value != null && value > 0 ? String(value) : '';
}

export function catalogDepositText(value: number | null | undefined): string {
  return value != null && value >= 0 ? String(value) : '';
}
