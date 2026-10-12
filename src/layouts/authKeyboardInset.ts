/**
 * How much of the layout viewport is covered by the on-screen keyboard.
 * Returns 0 when the layout viewport already shrank with the keyboard,
 * so padding is not applied twice.
 */
export function keyboardCoveredHeight(
  layoutHeight: number,
  visualHeight: number,
  offsetTop: number,
): number {
  if (!Number.isFinite(layoutHeight) || !Number.isFinite(visualHeight) || layoutHeight <= 0) {
    return 0;
  }
  const offset = Number.isFinite(offsetTop) ? offsetTop : 0;
  const covered = layoutHeight - visualHeight - offset;
  return covered > 80 ? Math.round(covered) : 0;
}
