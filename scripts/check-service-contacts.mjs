import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { associableSpaces, canManageServiceContacts, canOpenServiceContacts } from '../src/modules/serviceContacts/utils/serviceContactAccess.ts';
import { mailtoHref, telHref, whatsappHref } from '../src/modules/serviceContacts/utils/serviceContactLinks.ts';
import { emptyDraft, validateServiceContactDraft } from '../src/modules/serviceContacts/utils/serviceContactForm.ts';

assert.equal(canOpenServiceContacts([{ membershipRole: 'TENANT' }]), false);
assert.equal(canOpenServiceContacts([{ membershipRole: 'STAFF' }]), true);
assert.equal(canOpenServiceContacts([], true), true);
assert.equal(canManageServiceContacts([{ membershipRole: 'STAFF' }]), false);
assert.equal(canManageServiceContacts([{ membershipRole: 'MANAGER' }]), true);
assert.equal(associableSpaces([{ membershipRole: 'STAFF' }, { membershipRole: 'OWNER' }]).length, 1);

assert.equal(telHref('9876543210'), 'tel:+919876543210');
assert.equal(whatsappHref('+91 98765 43210'), 'https://wa.me/919876543210');
assert.equal(mailtoHref('not-an-email'), null);
assert.equal(mailtoHref('owner@example.com'), 'mailto:owner@example.com');

const missing = validateServiceContactDraft(emptyDraft());
assert.equal(missing.businessName, 'name_required');
assert.equal(missing.category, 'category_required');
assert.equal(missing.contactMethod, 'method_required');

const custom = validateServiceContactDraft({
  ...emptyDraft(),
  businessName: 'Ramesh Electricals',
  category: 'OTHER',
  customCategoryName: 'x',
  primaryPhone: '9876543210',
});
assert.equal(custom.customCategoryName, 'custom_required');

const page = readFileSync(new URL('../src/modules/serviceContacts/pages/ServiceContactsPage.tsx', import.meta.url), 'utf8');
const mySpaces = readFileSync(new URL('../src/modules/onboarding/pages/MySpacesPage.tsx', import.meta.url), 'utf8');
assert.match(page, /serviceContactsApi\.list/);
assert.match(page, /whatsappHref/);
assert.match(page, /canArchive/);
assert.match(mySpaces, /ROUTES\.serviceContacts/);

console.log('service contact checks passed');
