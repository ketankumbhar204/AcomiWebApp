/** Next unused "Combo N" name — parity with mobile `utils/comboNaming.ts`. */
const COMBO_NUMBER_PATTERN = /^Combo (\d+)$/i;
const LEGACY_PACKAGE_NUMBER_PATTERN = /^Package (\d+)$/i;

export function nextComboName(labels: string[]): string {
  const usedNumbers = new Set<number>();
  for (const label of labels) {
    const trimmed = label.trim();
    const comboMatch = COMBO_NUMBER_PATTERN.exec(trimmed);
    const legacyPackageMatch = LEGACY_PACKAGE_NUMBER_PATTERN.exec(trimmed);
    if (comboMatch) usedNumbers.add(parseInt(comboMatch[1], 10));
    if (legacyPackageMatch) usedNumbers.add(parseInt(legacyPackageMatch[1], 10));
  }
  let n = 1;
  while (usedNumbers.has(n)) n += 1;
  return `Combo ${n}`;
}
