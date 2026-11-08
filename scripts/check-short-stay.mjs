import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const webStay = readFileSync(join(root, '../src/modules/accommodation/utils/shortStay.ts'), 'utf8');
const mobileStay = readFileSync(join(root, '../../AcomiMobile/src/utils/shortStay.ts'), 'utf8');
const webWizard = readFileSync(
  join(root, '../src/modules/accommodation/pages/OccupancyWizardPage.tsx'),
  'utf8',
);
const mobileWizard = readFileSync(
  join(root, '../../AcomiMobile/src/features/occupancy/OccupancyWizard/OccupancyWizardScreen.tsx'),
  'utf8',
);
const mobileSubmit = readFileSync(
  join(root, '../../AcomiMobile/src/features/occupancy/OccupancyWizard/useOccupancyWizardSubmit.ts'),
  'utf8',
);
const webSettings = readFileSync(
  join(root, '../src/modules/onboarding/pages/EditSpacePage.tsx'),
  'utf8',
);
const mobileSettings = readFileSync(
  join(root, '../../AcomiMobile/src/screens/EditSpaceScreen.tsx'),
  'utf8',
);

for (const source of [webStay, mobileStay]) {
  assert.match(source, /stayKind: 'SHORT'/);
  assert.match(source, /agreedTotal: input.agreedTotal/);
  assert.match(source, /rentSnapshot: undefined/);
  assert.match(source, /choice === 'MONTHLY'/);
}

for (const source of [webWizard, mobileWizard, webSettings, mobileSettings]) {
  assert.match(source, /shortStayEnabled/);
}

assert.match(webWizard, /applyStayChoice/);
assert.match(mobileSubmit, /applyStayChoice/);

console.log('short stay is gated by the space flag and sends one agreed total');
