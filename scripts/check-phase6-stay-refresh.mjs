import { readFileSync } from 'node:fs';

const hook = readFileSync(
  'src/modules/accommodation/hooks/useAccommodation.ts',
  'utf8',
);
const dialog = readFileSync(
  'src/modules/accommodation/components/ExtendStayDialog.tsx',
  'utf8',
);
const wizard = readFileSync(
  'src/modules/accommodation/pages/OccupancyWizardPage.tsx',
  'utf8',
);
const rules = readFileSync(
  'src/modules/accommodation/utils/occupancyRules.ts',
  'utf8',
);

const invalidate = hook.slice(hook.indexOf('export function useOccupancyMutations'));
if (!invalidate.includes("key.includes('payment')")) {
  throw new Error('occupancy mutations must invalidate payment query keys');
}
if (!invalidate.includes("key.includes('occupanc')")) {
  throw new Error('occupancy mutations must still invalidate occupancy query keys');
}
if (invalidate.includes('setIdempotencyKey(createExtensionIdempotencyKey())') && dialog.includes('catch')) {
  const catchBody = dialog.slice(dialog.indexOf('} catch'));
  if (catchBody.includes('createExtensionIdempotencyKey')) {
    throw new Error('a failed extend must retry the same idempotency key');
  }
}
if (!dialog.includes('disabled={pending')) {
  throw new Error('extend submit must stay disabled while the request is in flight');
}
if (!wizard.includes('shortStayEnabled')) {
  throw new Error('short stay must stay behind the space flag');
}
if (!wizard.includes('shortStayPreview')) {
  throw new Error('the review total must be labeled as a preview before save');
}
if (!rules.includes("case 'RENTAL':") || !rules.includes("return ['UNIT']")) {
  throw new Error('rental stays stay on units');
}
if (rules.includes("case 'MESS'")) {
  throw new Error('mess must not gain a stay target');
}

console.log('phase 6 stay refresh and wizard parity checks passed');
