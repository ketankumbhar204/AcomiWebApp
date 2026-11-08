import { readFileSync } from 'node:fs';

const webLinks = readFileSync('src/shared/utils/notificationDeepLinks.ts', 'utf8');
const webOwner = readFileSync('src/shared/utils/ownerOnlyNotifications.ts', 'utf8');
const webPending = readFileSync('src/modules/dashboard/pages/PendingActionsPage.tsx', 'utf8');

if (!webLinks.includes("case 'STAY_OVERDUE_ACTIVE':")) {
  throw new Error('overdue stay alert must have its own navigation case');
}
const overdueCase = webLinks.slice(webLinks.indexOf("case 'STAY_OVERDUE_ACTIVE':"));
if (overdueCase.slice(0, 400).includes('Complete Vacate')) {
  throw new Error('the overdue alert must not be labeled as a vacate');
}
if (!webOwner.includes("'STAY_OVERDUE_ACTIVE'")) {
  throw new Error('tenants must not see the overdue stay alert');
}
const todayFilter = webPending.slice(
  webPending.indexOf('const todayActionTypes'),
  webPending.indexOf('const filteredRows'),
);
if (todayFilter.includes('STAY_OVERDUE_ACTIVE')) {
  throw new Error('the overdue alert must stay out of the checkout-today filter');
}
if (!webPending.includes("type === 'STAY_OVERDUE_ACTIVE'")) {
  throw new Error('the overdue alert belongs in the occupancy category');
}

console.log('overdue stay alert web checks passed');
