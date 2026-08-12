/** Next unused "Combo N" name — parity with mobile `utils/comboNaming.ts`. */
const COMBO_NUMBER_PATTERN = /^Combo (\d+)$/i;
const LEGACY_PACKAGE_NUMBER_PATTERN = /^Package (\d+)$/i;

export function nextComboName(labels: string[]): string {
  const usedNumbers = new Set<number>();
  for (const label of labels) {
    const trimmed = label.trim();
    const comboMatch = COMBO_NUMBER_PATTERN.exec(trimmed);
    const legacyPackageMatch = LEGACY_PACKAGE_NUMBER_PATTERN.exec(trimmed);
    const comboNumber = comboMatch?.[1];
    const legacyPackageNumber = legacyPackageMatch?.[1];
    if (comboNumber) usedNumbers.add(parseInt(comboNumber, 10));
    if (legacyPackageNumber) usedNumbers.add(parseInt(legacyPackageNumber, 10));
  }
  let n = 1;
  while (usedNumbers.has(n)) n += 1;
  return `Combo ${n}`;
}
