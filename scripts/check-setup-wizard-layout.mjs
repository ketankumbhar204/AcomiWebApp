import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decideWizardLayout, isSubmittableSetupLayout } from '../src/modules/accommodation/utils/setupWizardLayout.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const wizard = readFileSync(
  join(root, 'src/modules/accommodation/pages/QuickSetupWizardPage.tsx'),
  'utf8',
);
const workspace = readFileSync(
  join(root, 'src/modules/accommodation/pages/AccommodationWorkspacePage.tsx'),
  'utf8',
);

const pending = {
  previousSpaceId: 'space-1',
  spaceId: 'space-1',
  spaceType: undefined,
  layoutMode: null,
  userChoseLayout: false,
};

assert.equal(decideWizardLayout(pending).layoutMode, null);

const loadedCoLiving = decideWizardLayout({
  ...pending,
  spaceType: 'CO_LIVING',
  layoutMode: 'CORRIDOR_PG',
});
assert.equal(loadedCoLiving.layoutMode, 'CO_LIVING');
assert.equal(loadedCoLiving.userChoseLayout, false);

const loadedRental = decideWizardLayout({
  ...pending,
  spaceType: 'RENTAL',
});
assert.equal(loadedRental.layoutMode, 'RENTAL');

const loadedCorporate = decideWizardLayout({
  ...pending,
  spaceType: 'CORPORATE_STAY',
});
assert.equal(loadedCorporate.layoutMode, 'RENTAL');

const loadedPg = decideWizardLayout({
  ...pending,
  spaceType: 'PG',
});
assert.equal(loadedPg.layoutMode, 'CORRIDOR_PG');

const loadedHostel = decideWizardLayout({
  ...pending,
  spaceType: 'HOSTEL',
});
assert.equal(loadedHostel.layoutMode, 'CORRIDOR_PG');

const keptApartment = decideWizardLayout({
  previousSpaceId: 'space-1',
  spaceId: 'space-1',
  spaceType: 'PG',
  layoutMode: 'APARTMENT_PG',
  userChoseLayout: true,
});
assert.equal(keptApartment.layoutMode, 'APARTMENT_PG');
assert.equal(keptApartment.userChoseLayout, true);

const refreshed = decideWizardLayout({
  ...keptApartment,
  previousSpaceId: 'space-1',
  spaceId: 'space-1',
  spaceType: 'HOSTEL',
});
assert.equal(refreshed.layoutMode, 'APARTMENT_PG');

const dropped = decideWizardLayout({
  previousSpaceId: 'space-1',
  spaceId: 'space-1',
  spaceType: 'CO_LIVING',
  layoutMode: 'APARTMENT_PG',
  userChoseLayout: true,
});
assert.equal(dropped.layoutMode, 'CO_LIVING');
assert.equal(dropped.userChoseLayout, false);

const switched = decideWizardLayout({
  previousSpaceId: 'space-1',
  spaceId: 'space-2',
  spaceType: 'PG',
  layoutMode: 'APARTMENT_PG',
  userChoseLayout: true,
});
assert.equal(switched.spaceChanged, true);
assert.equal(switched.layoutMode, null);
assert.equal(switched.userChoseLayout, false);

const mess = decideWizardLayout({
  ...pending,
  spaceType: 'MESS',
  layoutMode: 'CORRIDOR_PG',
});
assert.equal(mess.layoutMode, null);
assert.equal(isSubmittableSetupLayout('MESS', 'CORRIDOR_PG'), false);
assert.equal(isSubmittableSetupLayout('CO_LIVING', 'CORRIDOR_PG'), false);
assert.equal(isSubmittableSetupLayout('RENTAL', 'RENTAL'), true);
assert.equal(isSubmittableSetupLayout('PG', 'APARTMENT_PG'), true);
assert.equal(isSubmittableSetupLayout(undefined, 'CORRIDOR_PG'), false);

assert.match(wizard, /decideWizardLayout/);
assert.match(wizard, /isSubmittableSetupLayout/);
assert.match(wizard, /chooseLayout/);
assert.doesNotMatch(wizard, /spaceType \?\? 'PG'/);
assert.match(wizard, /spaceId !== boundSpaceId/);
assert.match(workspace, /spaceAccommodationQuickSetupPath\(spaceId\)/);
assert.match(workspace, /setFormMode\(\{ kind: 'create', parent: null \}\)/);
assert.match(workspace, /onStartSetup=\{\(\) => navigate\(spaceAccommodationQuickSetupPath\(spaceId\)\)\}/);
assert.match(workspace, /onAddManually=\{\(\) => setFormMode\(\{ kind: 'create', parent: null \}\)\}/);
