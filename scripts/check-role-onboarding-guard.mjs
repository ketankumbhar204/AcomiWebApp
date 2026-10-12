import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveRoleOnboardingAccess } from '../src/modules/onboarding/utils/roleOnboardingAccess.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function source(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8');
}

assert.deepEqual(resolveRoleOnboardingAccess([]), { status: 'allowed' });
assert.deepEqual(resolveRoleOnboardingAccess([], null), { status: 'allowed' });
assert.deepEqual(resolveRoleOnboardingAccess(['owner-space']), {
  status: 'space',
  spaceId: 'owner-space',
});
assert.deepEqual(resolveRoleOnboardingAccess(['member-space']), {
  status: 'space',
  spaceId: 'member-space',
});
assert.deepEqual(resolveRoleOnboardingAccess(['a', 'b'], 'b'), {
  status: 'space',
  spaceId: 'b',
});
assert.deepEqual(resolveRoleOnboardingAccess(['a', 'b']), { status: 'picker' });
assert.deepEqual(resolveRoleOnboardingAccess(['a', 'b'], 'missing'), { status: 'picker' });
assert.deepEqual(resolveRoleOnboardingAccess([], 'default-space'), {
  status: 'space',
  spaceId: 'default-space',
});

const owner = resolveRoleOnboardingAccess(['owner-space'], 'owner-space');
const nextAccount = resolveRoleOnboardingAccess([]);
assert.equal(owner.status, 'space');
assert.deepEqual(nextAccount, { status: 'allowed' });

const routes = source('src/app/router/routes.tsx');
const gate = source('src/modules/onboarding/components/RoleOnboardingGate.tsx');
const choice = source('src/modules/onboarding/pages/OnboardingChoicePage.tsx');
const memberHome = source('src/modules/onboarding/pages/MemberHomePage.tsx');
const createSpace = source('src/modules/onboarding/pages/CreateSpacePage.tsx');
const rootRedirect = source('src/modules/onboarding/components/AuthenticatedRootRedirect.tsx');
const bootstrap = source('src/modules/dashboard/layouts/SpaceBootstrapOutlet.tsx');
const access = source('src/modules/onboarding/utils/roleOnboardingAccess.ts');

assert.match(routes, /<RoleOnboardingGate>/);
assert.match(gate, /<Navigate to=\{spaceDashboardPath\(access\.spaceId\)\} replace \/>/);
assert.match(gate, /<Navigate to=\{ROUTES\.mySpaces\} replace \/>/);
assert.match(gate, /LoadingFallback/);
assert.doesNotMatch(gate, /localStorage|accountIntent|hasSeenRoleSelection/);
assert.doesNotMatch(access, /localStorage|accountIntent|AsyncStorage/);

assert.match(choice, /navigate\(ROUTES\.createSpace, \{ replace: true \}\)/);
assert.match(choice, /navigate\(ROUTES\.memberHome, \{ replace: true \}\)/);
assert.match(memberHome, /navigate\(ROUTES\.createSpace\)/);
assert.doesNotMatch(memberHome, /navigate\(ROUTES\.onboarding\)/);
assert.match(createSpace, /resolveRoleOnboardingAccess/);
assert.match(createSpace, /navigate\(spaceDashboardPath\(space\.id\), \{ replace: true \}\)/);
assert.match(rootRedirect, /resolveRoleOnboardingAccess/);
assert.match(bootstrap, /if \(!bootstrapped\)/);

console.log('role-onboarding-guard: ok');
