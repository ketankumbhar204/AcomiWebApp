import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ROUTES } from '../src/routes/paths.ts';

function accountHomePath(hasSpaces) {
  return hasSpaces ? ROUTES.mySpaces : ROUTES.memberHome;
}

function isSpaceDashboardPath(pathname) {
  return /^\/spaces\/[^/]+(?:\/|$)/.test(pathname);
}

assert.equal(accountHomePath(true), '/my-spaces');
assert.equal(accountHomePath(false), '/member-home');
assert.equal(accountHomePath(true) === '/', false);
assert.equal(isSpaceDashboardPath('/spaces/abc/dashboard'), true);
assert.equal(isSpaceDashboardPath(accountHomePath(true)), false);
assert.equal(isSpaceDashboardPath(accountHomePath(false)), false);

const homePathSource = readFileSync(
  new URL('../src/shared/utils/accountHomePath.ts', import.meta.url),
  'utf8',
);
assert.match(homePathSource, /hasSpaces \? ROUTES\.mySpaces : ROUTES\.memberHome/);
assert.match(homePathSource, /isSpaceDashboardPath/);

const shell = readFileSync(
  new URL('../src/modules/dashboard/layouts/SpaceShellLayout.tsx', import.meta.url),
  'utf8',
);
const button = readFileSync(
  new URL('../src/modules/dashboard/components/SpaceDashboardHomeButton.tsx', import.meta.url),
  'utf8',
);
assert.match(shell, /SpaceDashboardHomeButton/);
assert.match(button, /accountHomePath/);
assert.doesNotMatch(button, /ROUTES\.root/);
assert.match(button, /aria-label/);

const mobileHeader = readFileSync(
  new URL('../../AcomiMobile/src/hooks/useSpaceTabHeader.tsx', import.meta.url),
  'utf8',
);
const mobileBack = readFileSync(
  new URL('../../AcomiMobile/src/components/ui/SpaceTabBackButton.tsx', import.meta.url),
  'utf8',
);
const mobileHome = readFileSync(
  new URL('../../AcomiMobile/src/components/ui/SpaceTabHomeButton.tsx', import.meta.url),
  'utf8',
);
assert.match(mobileHeader, /SpaceDashboardHeader/);
const mobileChrome = readFileSync(
  new URL('../../AcomiMobile/src/components/ui/SpaceDashboardHeader.tsx', import.meta.url),
  'utf8',
);
const mobileActions = readFileSync(
  new URL('../../AcomiMobile/src/components/ui/SpaceTabHeaderActions.tsx', import.meta.url),
  'utf8',
);
const mobileBell = readFileSync(
  new URL('../../AcomiMobile/src/components/notifications/NotificationBellButton.tsx', import.meta.url),
  'utf8',
);
assert.match(mobileChrome, /SpaceTabHeaderLeading/);
assert.match(mobileActions, /NotificationBellButton/);
assert.doesNotMatch(mobileActions, /HeaderLanguageButton/);
assert.match(mobileBell, /Bell/);
assert.doesNotMatch(mobileBell, /🔔/);
const mobileTabs = readFileSync(
  new URL('../../AcomiMobile/src/navigation/SpaceTabNavigator.tsx', import.meta.url),
  'utf8',
);
assert.match(mobileTabs, /headerLeft: \(\) => <SpaceTabHeaderLeading \/>/);
assert.match(mobileBack, /goBackInStack/);
assert.match(mobileBack, /spaceDashboardHeaderDestination\('back'/);
assert.match(mobileHome, /resetToMySpaces/);

console.log('space dashboard home checks passed');
