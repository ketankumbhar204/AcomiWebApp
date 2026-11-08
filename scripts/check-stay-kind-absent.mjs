import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const webRules = readFileSync(
  join(root, '../src/modules/accommodation/utils/occupancyRules.ts'),
  'utf8',
);
const webDisplay = readFileSync(
  join(root, '../src/modules/members/utils/memberStayDisplay.ts'),
  'utf8',
);
const mobileRules = readFileSync(
  join(root, '../../AcomiMobile/src/utils/occupancyRules.ts'),
  'utf8',
);
const mobileContract = readFileSync(
  join(root, '../../AcomiMobile/src/utils/occupancyContract.ts'),
  'utf8',
);

const stayedOut = /stayKind|stay_kind|agreedTotal|agreed_total|pricingBasis|pricing_basis/;

for (const source of [webRules, webDisplay, mobileRules, mobileContract]) {
  assert.doesNotMatch(source, stayedOut);
}

assert.match(webRules, /expectedExitDate: options\.expectedExitDate/);
assert.match(mobileRules, /expectedCheckoutDate: getExpectedExitDate\(options\)/);
assert.match(mobileRules, /expectedExitDate: getExpectedExitDate\(options\)/);
assert.match(webDisplay, /stay\.rentSnapshot == null/);
assert.match(mobileContract, /occupancy\.rentSnapshot == null/);

console.log('stay kind remains off the allocate builders and monthly rent displays');
