import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  pendingHasNoPublicLink,
  showsAccommodation,
  showsMeals,
  showsPublicListing,
} from '../src/modules/onboarding/utils/listingActions.ts';

const page = readFileSync(new URL('../src/modules/onboarding/pages/MySpacesPage.tsx', import.meta.url), 'utf8');
assert.match(page, /PendingListingsPanel/);
assert.match(page, /mySpacesApi\.getMySpaces|mySpacesApi/);
assert.match(page, /getMySpaces/);

const panel = readFileSync(new URL('../src/modules/onboarding/components/PendingListingsPanel.tsx', import.meta.url), 'utf8');
assert.match(panel, /listMyListings\(\{ status: 'PENDING' \}\)/);
assert.match(panel, /updatePropertyLead/);
assert.match(panel, /updateMessLead/);
assert.doesNotMatch(panel, /accommodationPath|\/spaces\/\$\{/);

const edit = readFileSync(new URL('../src/modules/onboarding/pages/EditSpacePage.tsx', import.meta.url), 'utf8');
assert.match(edit, /genderPolicy/);
assert.match(edit, /spaceApi\.updateSpace/);

const api = readFileSync(new URL('../src/shared/api/mySpacesApi.ts', import.meta.url), 'utf8');
assert.match(api, /\/spaces\/my/);
assert.match(api, /\/me\/listings/);

assert.equal(
  showsPublicListing({ publication: 'PENDING', spaceId: null, publicPath: null }),
  false,
);
assert.equal(
  showsAccommodation({
    publication: 'LIVE',
    kind: 'MESS',
    spaceType: 'MESS',
    operationalManagementAvailable: true,
    accommodationPath: '/spaces/1/accommodation',
  }),
  false,
);
assert.equal(
  showsMeals({
    publication: 'LIVE',
    kind: 'MESS',
    spaceType: 'MESS',
    operationalManagementAvailable: true,
    mealsPath: '/spaces/1/meals',
  }),
  true,
);
assert.equal(pendingHasNoPublicLink({ publication: 'PENDING', kind: 'PROPERTY' }), true);

console.log('web my spaces checks passed');
