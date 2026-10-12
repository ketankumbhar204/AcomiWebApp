import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function source(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8');
}

const workspace = source('src/modules/payments/pages/PaymentsWorkspacePage.tsx');
const dialog = source('src/modules/payments/components/AddPaymentRecordDialog.tsx');
const rowActions = source('src/modules/payments/components/OwnerPaymentRowActions.tsx');
const memberPanel = source('src/modules/members/components/panels/MemberPaymentsPanel.tsx');
const mutations = source('src/modules/payments/hooks/usePayments.ts');
const catalog = source('src/modules/payments/chargeCatalog.ts');

assert.match(workspace, /if \(!isOwner\) \{\s*return <TenantPaymentsPage \/>;/);
assert.match(workspace, /paymentCollection\.addRecord\.createAction/);
assert.match(workspace, /setCreatePaymentOpen\(true\)/);
assert.match(workspace, /<AddPaymentRecordDialog/);
assert.doesNotMatch(workspace, /lockedMember=/);
assert.doesNotMatch(workspace, /onAddPayment/);
assert.match(workspace, /onCreated=\{\(paymentId\)/);
assert.match(workspace, /paymentCollection\.received\.action|OwnerPaymentRowActions/);
assert.match(workspace, /onReminder=/);
assert.match(workspace, /matchesIndividualPayment/);
assert.match(workspace, /useSpacePaymentsList/);
assert.doesNotMatch(workspace, /memberRowShowsOwnerPaymentActions/);
assert.doesNotMatch(workspace, /usePaymentsMembers/);
assert.match(workspace, /payments\.records\.emptyTitle/);

assert.match(dialog, /memberMatchesPaymentSearch/);
assert.match(dialog, /isChargeablePaymentMember/);
assert.match(dialog, /paymentCollection\.addRecord\.errors\.member/);
assert.match(dialog, /paymentCollection\.addRecord\.errors\.category/);
assert.match(dialog, /paymentCollection\.addRecord\.errors\.type/);
assert.match(dialog, /paymentCollection\.addRecord\.errors\.amount/);
assert.match(dialog, /lockedMember \? 'paymentCollection\.addRecord\.title'/);
assert.match(dialog, /createPayment\.mutateAsync/);
assert.match(dialog, /if \(saving\)/);
assert.match(dialog, /paymentCollection\.addRecord\.createSubmit/);
assert.match(dialog, /<ChargeTypeField/);
assert.match(dialog, /paymentCollection\.addRecord\.categoryDerived/);
assert.match(dialog, /rememberChargeType/);
assert.doesNotMatch(dialog, /setCategory\(/);
assert.doesNotMatch(dialog, /paymentStatus:\s*'PAID'/);

assert.match(memberPanel, /canManagePayments/);
assert.match(memberPanel, /paymentCollection\.addRecord\.action/);
assert.match(memberPanel, /lockedMember=\{\{/);
assert.match(memberPanel, /memberId,/);
assert.match(memberPanel, /<AddPaymentRecordDialog/);
assert.match(memberPanel, /void reload\(\)/);

assert.doesNotMatch(rowActions, /addRecord/);
assert.doesNotMatch(rowActions, /Plus/);
assert.match(rowActions, /direction=\{stackActions \? 'column' : 'row'\}/);
assert.match(rowActions, /flexWrap: 'nowrap'/);
assert.doesNotMatch(workspace, /width: 168, minWidth: 168, maxWidth: 168/);
assert.match(rowActions, /paymentCollection\.received\.action/);
assert.match(rowActions, /paymentCollection\.reminder\.send/);

assert.match(mutations, /createPayment: useMutation/);
assert.match(mutations, /onSuccess: invalidate/);
assert.match(mutations, /includes\('payment'\)/);

assert.match(catalog, /export function listCatalogChargeTypes/);
assert.match(catalog, /export function chargeTypeMatchesQuery/);
assert.match(catalog, /export function memberMatchesPaymentSearch/);
assert.match(catalog, /export function isChargeablePaymentMember/);
assert.match(catalog, /paymentCategory: 'EXTRA'/);
assert.doesNotMatch(catalog, /paymentCategory: 'MONTHLY'/);

for (const locale of ['en', 'hi', 'mr']) {
  const messages = JSON.parse(source(`src/i18n/locales/${locale}.json`));
  const addRecord = messages.paymentCollection.addRecord;
  assert.equal(typeof addRecord.createAction, 'string');
  assert.equal(typeof addRecord.createTitle, 'string');
  assert.equal(typeof addRecord.action, 'string');
  assert.equal(typeof addRecord.errors.member, 'string');
  assert.notEqual(addRecord.createAction, addRecord.action);
}

console.log('payment create UX checks passed');
