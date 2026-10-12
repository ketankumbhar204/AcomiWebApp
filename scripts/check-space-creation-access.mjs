import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canCreateSpace } from '../src/modules/onboarding/utils/spaceCreationAccess.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

assert.equal(canCreateSpace([{ membershipRole: 'TENANT' }]), false);
assert.equal(canCreateSpace([{ membershipRole: 'CUSTOMER' }]), false);
assert.equal(
  canCreateSpace([{ membershipRole: 'TENANT' }, { membershipRole: 'CUSTOMER' }]),
  false,
);
assert.equal(canCreateSpace([{ membershipRole: 'STAFF' }]), false);
assert.equal(canCreateSpace([{ membershipRole: 'MANAGER' }]), false);
assert.equal(canCreateSpace([{ membershipRole: 'OWNER' }]), true);
assert.equal(
  canCreateSpace([{ membershipRole: 'CUSTOMER' }, { membershipRole: 'OWNER' }]),
  true,
);
assert.equal(canCreateSpace([]), true);

const mySpaces = readFileSync(join(root, 'src/modules/onboarding/pages/MySpacesPage.tsx'), 'utf8');
const createPage = readFileSync(join(root, 'src/modules/onboarding/pages/CreateSpacePage.tsx'), 'utf8');
assert.match(mySpaces, /canAddSpace/);
assert.match(createPage, /canCreateSpace\(mySpaces\)/);
