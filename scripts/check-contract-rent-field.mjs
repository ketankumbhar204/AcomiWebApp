import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  catalogDepositText,
  catalogRentText,
  parseContractAmount,
} from '../src/modules/accommodation/utils/contractRentField.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const wizard = readFileSync(
  join(root, 'src/modules/accommodation/pages/OccupancyWizardPage.tsx'),
  'utf8',
);
const review = readFileSync(
  join(root, 'src/modules/accommodation/components/RentalUnitsReview.tsx'),
  'utf8',
);

assert.equal(parseContractAmount(''), null);
assert.equal(parseContractAmount('  '), null);
assert.equal(parseContractAmount('abc'), null);
assert.equal(parseContractAmount('-1'), null);
assert.equal(parseContractAmount('0'), 0);
assert.equal(parseContractAmount('10000'), 10000);
assert.equal(catalogRentText(null), '');
assert.equal(catalogRentText(0), '');
assert.equal(catalogRentText(7000), '7000');
assert.equal(catalogDepositText(0), '0');
assert.equal(catalogDepositText(null), '');

assert.match(wizard, /parseContractAmount\(rent\)/);
assert.match(wizard, /variant: 'error'/);
assert.doesNotMatch(wizard, /effectiveTarget\?\.defaultRent != null \? String/);
assert.match(review, /const unitOnly = roomCount === 0 && bedCount === 0/);
assert.match(review, /unitOnlyOverviewSubtitle/);

console.log('contract rent and unit-only overview checks passed');
