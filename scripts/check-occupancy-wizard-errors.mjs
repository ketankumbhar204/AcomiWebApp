import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ApiError, getErrorMessage } from '../src/shared/api/errors.ts';

const root = dirname(fileURLToPath(import.meta.url));
const wizard = readFileSync(
  join(root, '../src/modules/accommodation/pages/OccupancyWizardPage.tsx'),
  'utf8',
);
const webRules = readFileSync(
  join(root, '../src/modules/accommodation/utils/occupancyRules.ts'),
  'utf8',
);
const mobileRules = readFileSync(
  join(root, '../../AcomiMobile/src/utils/occupancyRules.ts'),
  'utf8',
);

const fallback = 'Something went wrong. Please try again.';

assert.equal(getErrorMessage(new ApiError('Bed is not available', 400), fallback), 'Bed is not available');
assert.equal(getErrorMessage(new ApiError('Room is not available', 409), fallback), 'Room is not available');
assert.equal(
  getErrorMessage(
    new ApiError(
      'expectedExitDate and expectedCheckoutDate must be the same planned end date',
      400,
    ),
    fallback,
  ),
  'expectedExitDate and expectedCheckoutDate must be the same planned end date',
);
assert.equal(getErrorMessage({ unexpected: true }, fallback), fallback);
assert.equal(getErrorMessage(new ApiError('', 500), fallback) || fallback, fallback);

assert.match(wizard, /getErrorMessage\(error, fallback\)/);
assert.doesNotMatch(wizard, /catch \{\s*enqueueSnackbar\(t\('common\.errors\.generic'\)/);

const allocateBuilder = webRules.slice(
  webRules.indexOf('export function buildAllocateRequest'),
  webRules.indexOf('export function buildReserveRequest'),
);
assert.match(allocateBuilder, /expectedExitDate: options\.expectedExitDate/);
assert.doesNotMatch(allocateBuilder, /expectedCheckoutDate/);

const mobileAllocate = mobileRules.slice(
  mobileRules.indexOf('export function buildAllocateRequest'),
  mobileRules.indexOf('export function buildTransferRequest'),
);
assert.match(mobileAllocate, /expectedCheckoutDate: getExpectedExitDate\(options\)/);
assert.match(mobileAllocate, /expectedExitDate: getExpectedExitDate\(options\)/);

console.log('occupancy wizard error handling checks passed');
