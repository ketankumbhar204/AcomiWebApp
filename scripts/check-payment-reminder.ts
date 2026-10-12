import assert from 'node:assert/strict';
import { reminderWhatsAppTarget } from '../src/modules/payments/utils/paymentReminderLaunch.ts';

const prepared = reminderWhatsAppTarget({
  messageText: 'Hi Rahul Kumar, pending Rent of ₹6,000',
  whatsAppUrl: 'https://wa.me/919999999991?text=Hi%20Rahul%20Kumar',
  internationalPhone: '919999999991',
});
assert.equal(prepared.url, 'https://wa.me/919999999991?text=Hi%20Rahul%20Kumar');
assert.match(prepared.message, /Rahul Kumar/);

const built = reminderWhatsAppTarget({
  messageText: 'Hi Rahul, rent is due',
  internationalPhone: '9999999991',
});
assert.equal(built.url, 'https://wa.me/919999999991?text=Hi%20Rahul%2C%20rent%20is%20due');

const missing = reminderWhatsAppTarget({
  messageText: 'Hi Rahul, rent is due',
  whatsAppUrl: null,
  internationalPhone: '123',
});
assert.equal(missing.url, null);
assert.equal(missing.message, 'Hi Rahul, rent is due');

console.log('web payment reminder checks ok');
