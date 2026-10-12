/** Move In starts on vacant beds until an available bed or whole unit is chosen. */
export function allocateNeedsVacantBedPick(
  mode: string,
  ids?: { bedId?: string | null; unitId?: string | null },
): boolean {
  if (mode !== 'ALLOCATE') {
    return false;
  }
  return !ids?.bedId && !ids?.unitId;
}

export function bedIsSelectableForMoveIn(status: string | null | undefined): boolean {
  return status === 'AVAILABLE';
}
