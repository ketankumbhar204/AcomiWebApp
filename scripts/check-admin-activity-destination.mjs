import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const resolver = read('src/modules/admin/utils/resolveAdminActivityDestination.ts');
const paths = read('src/routes/paths.ts');
const routes = read('src/app/router/routes.tsx');
const dashboard = read('src/modules/admin/pages/AdminDashboardPage.tsx');
const activityPage = read('src/modules/admin/pages/AdminActivityPage.tsx');
const userDetail = read('src/modules/admin/pages/AdminRegisteredUserDetailPage.tsx');
const panel = read('src/modules/admin/components/AdminRecentActivityPanel.tsx');
const row = read('src/modules/admin/components/AdminActivityRow.tsx');
const adminApi = read('src/modules/admin/api/adminApi.ts');
const en = JSON.parse(read('src/i18n/locales/en.json'));

assert(resolver.includes('export function resolveAdminActivityDestination'), 'resolver export missing');
assert(resolver.includes("case 'NEW_ENQUIRY':"), 'NEW_ENQUIRY mapping missing');
assert(resolver.includes('adminEnquiryDetailPath(activity.targetId)'), 'enquiry destination missing');
assert(resolver.includes("case 'NEW_USER_REGISTRATION':"), 'NEW_USER_REGISTRATION mapping missing');
assert(resolver.includes('adminRegisteredUserDetailPath(activity.targetId)'), 'user destination missing');
assert(resolver.includes("case 'NEW_PROPERTY_REGISTRATION':"), 'property registration mapping missing');
assert(resolver.includes('adminPropertyDetailPath(activity.targetId)'), 'property destination missing');
assert(resolver.includes("case 'NEW_MESS_REGISTRATION':"), 'mess registration mapping missing');
assert(resolver.includes('adminMessDetailPath(activity.targetId)'), 'mess destination missing');
assert(resolver.includes("case 'ADDRESS_SAVED':"), 'address mapping missing');
assert(resolver.includes('adminSavedAddressesPath({ highlight: activity.targetId })'), 'address highlight missing');
assert(resolver.includes("case 'LEAD_CLAIMED_PROPERTY':"), 'property claim mapping missing');
assert(resolver.includes("case 'LEAD_CLAIMED_MESS':"), 'mess claim mapping missing');

assert(paths.includes("adminActivity: '/admin/activity'"), 'activity route missing');
assert(paths.includes('adminRegisteredUserDetailPath'), 'user detail path helper missing');
assert(paths.includes('adminSavedAddressesPath'), 'saved addresses path helper missing');
assert(routes.includes('AdminActivityPage'), 'activity page route wiring missing');
assert(routes.includes('AdminRegisteredUserDetailPage'), 'user detail route wiring missing');
assert(
  routes.includes('${ROUTES.adminRegisteredUsers}/:id') ||
    routes.includes("adminRegisteredUsers}/:id"),
  'user detail path segment missing',
);

assert(dashboard.includes('AdminRecentActivityPanel'), 'dashboard activity panel missing');
assert(dashboard.includes('AdminEnquiriesTrendChart'), 'enquiries trend chart missing');
assert(dashboard.includes('AdminUserRegistrationBreakdownChart'), 'user breakdown chart missing');
assert(dashboard.includes('adminAddPropertyPath()'), 'add property quick action missing');
assert(dashboard.includes('adminAddMessPath()'), 'add mess quick action missing');
assert(
  dashboard.includes("quickActions.addUser") || dashboard.includes('Add User'),
  'add user quick action (users list) missing',
);
assert(!dashboard.includes('createUser') && !dashboard.includes('create-user'), 'must not invent create-user API');
assert(activityPage.includes('AdminActivityRow'), 'activity page must reuse AdminActivityRow');
assert(panel.includes('resolveAdminActivityDestination') || row.includes('resolveAdminActivityDestination'), 'row/panel must use destination resolver');
assert(userDetail.includes('admin.users.detail.back'), 'user detail back link missing');
assert(adminApi.includes("'/admin/activity'"), 'activity API client missing');
assert(adminApi.includes("'/admin/dashboard/enquiries-trend'"), 'enquiries trend API client missing');
assert(adminApi.includes("'/admin/dashboard/user-registration-breakdown'"), 'user breakdown API client missing');

assert(en.admin?.dashboard?.activity?.emptyTitle === 'No recent activity', 'activity empty i18n missing');
assert(en.admin?.dashboard?.stats?.totalEnquiries === 'Total Enquiries', 'total enquiries i18n missing');
assert(en.admin?.activity?.types?.NEW_ENQUIRY === 'New Enquiry', 'activity type i18n missing');

console.log('admin activity destination checks passed');
