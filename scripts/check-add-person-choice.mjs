import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function source(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8');
}

const dialog = source('src/modules/members/components/AddPersonChoiceDialog.tsx');
const choice = source('src/modules/members/addPersonChoice.ts');
const members = source('src/modules/members/pages/MembersWorkspacePage.tsx');
const drawer = source('src/modules/members/components/MemberFormDrawer.tsx');
const picker = source('src/modules/members/components/form/MemberCustomerReusePicker.tsx');
const hub = source('src/modules/members/pages/AddCustomersHubPage.tsx');
const dashboard = source('src/modules/dashboard/components/DashboardQuickActions.tsx');
const health = source('src/spaceLifecycle/navigateHealthAction.ts');
const en = source('src/i18n/locales/en.json');

assert.match(choice, /spaceType === 'MESS' \? 'customer' : 'member'/);
assert.match(choice, /pickerMode: 'new'/);
assert.match(choice, /pickerMode: 'search'/);
assert.match(choice, /type: 'import-page'/);
assert.match(choice, /alreadyInTargetSpace !== true/);
assert.doesNotMatch(choice, /availableForMoveIn !== false && candidate\.alreadyInTargetSpace/);

const importPage = source('src/modules/members/pages/ImportExistingPeoplePage.tsx');
const importHook = source('src/modules/members/hooks/useResidentImportSearch.ts');
assert.match(importPage, /mealsApplicableForSpace/);
assert.match(importPage, /alreadyInTargetSpace/);
assert.match(importPage, /useResidentImportSearch\(spaceId, query, true, true\)/);
assert.match(importHook, /includeUnavailable/);
assert.match(members, /includeUnavailable: true/);

assert.match(dialog, /membership\.add\.choice\.titleCustomer/);
assert.match(dialog, /membership\.add\.choice\.titleMember/);
assert.match(dialog, /membership\.add\.choice\.addNewCustomer/);
assert.match(dialog, /membership\.add\.choice\.addNewMember/);
assert.match(dialog, /membership\.add\.choice\.import/);
assert.match(dialog, /importableCount/);
assert.match(dialog, /membership\.add\.choice\.subtitle/);
assert.match(dialog, /onClose=\{onClose\}/);
assert.match(dialog, /common\.cancel/);
assert.doesNotMatch(dialog, /createMember|memberApi|mealBillingApi/);

assert.match(members, /<AddPersonChoiceDialog/);
assert.match(members, /shouldOfferImportChoice/);
assert.match(members, /loadImportPickerItems/);
assert.match(members, /open=\{choiceOpen \|\| deepLinkChoice\}/);
assert.doesNotMatch(members, /choiceOpen \|\| choiceFromQuery/);
assert.match(members, /deepLinkForm/);
assert.match(members, /onAddNew=\{chooseAddNew\}/);
assert.match(members, /onImportFromAnotherSpace=\{chooseImport\}/);
assert.match(members, /onClick=\{openAddChoice\}/);
assert.match(members, /searchParams\.get\('addChoice'\) === '1'/);
assert.match(members, /searchParams\.get\('create'\) === '1'/);
assert.match(members, /initialPickerMode=\{createPickerMode\}/);
assert.match(members, /spaceImportPeoplePath\(spaceId\)/);
assert.doesNotMatch(members, /spaceAddCustomersHubPath/);

assert.match(drawer, /initialPickerMode/);
assert.match(drawer, /<RolePicker/);
assert.match(drawer, /const validateCreate = \(\): boolean =>/);
assert.match(drawer, /createMember\.mutateAsync/);
assert.match(drawer, /mealBillingApi\.getSettings/);
assert.doesNotMatch(drawer, /setPickerMode\('search'\)/);
assert.doesNotMatch(drawer, /onPickerModeChange/);

assert.match(picker, /pickerMode === 'search'/);
assert.match(picker, /searchCustomerPlaceholder/);
assert.match(picker, /createNewHint/);
assert.doesNotMatch(picker, /memberMode\.search/);
assert.doesNotMatch(picker, /memberMode\.addNew/);
assert.doesNotMatch(picker, /onPickerModeChange/);

assert.match(hub, /spaceMembersAddChoicePath/);
assert.match(hub, /<Navigate /);
assert.doesNotMatch(hub, /addCardTitle/);

assert.match(dashboard, /spaceMembersAddChoicePath\(spaceId\)/);
assert.doesNotMatch(dashboard, /spaceAddCustomersHubPath/);

assert.match(health, /case 'addMember':/);
assert.match(health, /case 'addCustomersHub':/);
assert.match(health, /spaceMembersAddChoicePath\(spaceId\)/);
assert.doesNotMatch(health, /spaceAddCustomersHubPath/);

assert.match(en, /"titleCustomer": "Add a customer"/);
assert.match(en, /"import": "Import from another space"/);
assert.match(en, /"importAvailable_other": "\{\{count\}\} members available"/);
assert.match(en, /"addNewDescription": "Enter their details and add them to this space."/);

console.log('add-person-choice: ok');
