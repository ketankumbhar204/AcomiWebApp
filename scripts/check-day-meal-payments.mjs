import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatPaymentAmount } from '../src/modules/meals/utils/paymentAmount.ts';

const root = dirname(fileURLToPath(import.meta.url));
const util = readFileSync(join(root, '../src/modules/meals/utils/dayMealPayments.ts'), 'utf8');
const page = readFileSync(join(root, '../src/modules/meals/pages/DayMealPaymentsPage.tsx'), 'utf8');

assert.equal(formatPaymentAmount(500), '₹500');
assert.equal(formatPaymentAmount(6000), '₹6,000');
assert.equal(formatPaymentAmount(0), '₹0');
assert.equal(formatPaymentAmount(null), null);

assert.match(util, /resolveDayMealPayableAmount/);
assert.match(util, /amountKnown === false/);
assert.match(util, /pendingCount: actionNeeded.length/);
assert.doesNotMatch(util, /pendingAmount \+= item.amount/);

assert.match(page, /paymentCollection\.dayMeals\.summary\.total/);
assert.match(page, /paymentCollection\.dayMeals\.summary\.collected/);
assert.match(page, /paymentCollection\.dayMeals\.summary\.pending/);
assert.match(page, /paymentCollection\.dayMeals\.summary\.payments/);
assert.match(page, /summary\.pendingCount/);
assert.match(page, /amountDue/);
assert.match(page, /amountUnavailable/);

console.log('day meal payment amounts ok');
