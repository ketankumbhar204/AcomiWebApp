import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const en = JSON.parse(read('src/i18n/locales/en.json'));
const caps = read('src/spaceLifecycle/capabilities.ts');
const sample = read('src/spaceLifecycle/sampleMealCatalog.ts');
const guard = read('src/spaceLifecycle/capabilityGuard.ts');
const dashVis = read('src/spaceLifecycle/dashboardVisibility.ts');
const index = read('src/spaceLifecycle/index.ts');
const signals = read('src/modules/dashboard/hooks/useSpaceLifecycleSignals.ts');
const progressive = read('src/modules/dashboard/hooks/useSpaceProgressiveAccess.ts');
const locked = read('src/modules/dashboard/components/LockedCapabilityPanel.tsx');
const membersGate = read('src/modules/members/components/MembersPermissionGate.tsx');
const mealsGate = read('src/modules/meals/components/MealsPermissionGate.tsx');
const shell = read('src/modules/dashboard/layouts/SpaceShellLayout.tsx');
const payments = read('src/modules/payments/pages/PaymentsWorkspacePage.tsx');
const predicates = read('src/spaceLifecycle/predicates.ts');
const types = read('src/spaceLifecycle/types.ts');

assert(caps.includes('evaluateSpaceCapabilities'), 'capabilities export missing');
assert(caps.includes("'LOCKED'"), 'LOCKED mode missing');
assert(sample.includes('catalogHasCuratedMealLibrary'), 'sample catalog helper missing');
assert(sample.includes('activeCombos.length > 0'), 'D6 seed-item exclusion missing');
assert(guard.includes('getBlockingCapability'), 'capabilityGuard missing');
assert(dashVis.includes('dashboardVisibilityForLifecycle'), 'dashboardVisibility missing');
assert(index.includes('evaluateSpaceCapabilities'), 'index must export capabilities');
assert(index.includes('catalogHasCuratedMealLibrary'), 'index must export sample helpers');
assert(signals.includes('hasCuratedMealLibrary'), 'signals must set curated flag');
assert(signals.includes("m.role !== 'OWNER'"), 'signals must exclude OWNER from residents');
assert(progressive.includes('useSpaceProgressiveAccess'), 'progressive hook missing');
assert(locked.includes('LockedCapabilityFromAccess'), 'locked panel missing');
assert(membersGate.includes("getCapability('MEMBERS')"), 'members gate must check MEMBERS');
assert(mealsGate.includes("getCapability('MEAL_CONFIG')"), 'meals gate must check MEAL_CONFIG');
assert(shell.includes('useSpaceProgressiveAccess'), 'shell must use progressive access');
assert(shell.includes("getCapability('ACCOMMODATION')"), 'shell must hide accommodation by capability');
assert(payments.includes("getCapability('PAYMENTS')"), 'payments soft tip wiring missing');
assert(predicates.includes('hasMealLibrary'), 'predicates must unlock meals on any library (incl. samples)');
assert(
  !predicates.includes('hasCuratedMealLibrary'),
  'predicates must not require curated library for planning',
);
assert(
  caps.includes('return ctx.hasMealLibrary'),
  'MEAL_OPS library gate must use hasMealLibrary (samples count)',
);
assert(types.includes('allocatedMemberCount'), 'PredicateContext allocatedMemberCount missing');
assert(types.includes('hasBillableActivity'), 'PredicateContext hasBillableActivity missing');
assert(
  en.spaceLifecycle?.capabilities?.members?.lockedProperty?.includes('accommodation'),
  'en.json capability copy missing',
);

console.log('space-capabilities checks passed');
