import assert from 'node:assert/strict';
import {
  buildPhotoRequestMessage,
  confirmPhotoRequest,
  hasActualListingPhotos,
  isPhotoRequestNotification,
  photoRequestActionLabel,
  photoRequestTitle,
  whatsAppChatUrl,
  whatsAppPhoneDigits,
} from '../src/shared/utils/photoRequest.ts';

const real = 'https://cdn.acomi.app/listings/room.jpg';
const representative = '/images/representative/co-living-1.png';
const stock = 'https://images.unsplash.com/photo-1';

assert.equal(hasActualListingPhotos([representative, stock]), false);
assert.equal(photoRequestActionLabel(false), 'Request photos on WhatsApp');
assert.equal(hasActualListingPhotos([real]), true);
assert.equal(photoRequestActionLabel(true), 'Request more photos on WhatsApp');
assert.equal(photoRequestTitle('property', false), 'Request property photos');
assert.equal(photoRequestTitle('mess', false), 'Request mess photos');

const propertyEmpty = buildPhotoRequestMessage({
  kind: 'property',
  hasPhotos: false,
  name: 'Sri Sai Venkateshwara PG',
  spaceType: 'PG',
  location: 'Hinjawadi',
});
assert.equal(
  propertyEmpty,
  "Hi, I'm interested in Sri Sai Venkateshwara PG. Could you please share some recent photos of the property and available rooms? Thank you.\n\nYou can check in the ACOMI app: https://www.acomi.in/open.html",
);

const messPhotos = buildPhotoRequestMessage({
  kind: 'mess',
  hasPhotos: true,
  name: 'Annapurna Mess',
});
assert.match(messPhotos, /more recent photos of the menu, food, and service/);
assert.doesNotMatch(messPhotos, /bathroom|available rooms/);

const url = whatsAppChatUrl('8047622222', 'Photos, please.\nThanks!');
assert.match(url!, /wa\.me\/918047622222/);
assert.equal(whatsAppPhoneDigits('+919876543210'), '919876543210');
assert.equal(whatsAppChatUrl(null, 'Hello'), null);
assert.equal(whatsAppPhoneDigits('+1 415 555 2671'), '14155552671');

const edited = 'Kitchen photo, please.\nThanks!';
const opened: string[] = [];
const saved = await confirmPhotoRequest({
  message: edited,
  request: async () => ({
    notificationPersisted: true,
    notificationDuplicate: false,
    fcmQueued: true,
    phoneAvailable: true,
    internationalPhone: '919876543210',
  }),
  openUrl: async (target) => {
    opened.push(target);
  },
});
assert.equal(saved.whatsApp, 'opened');
assert.equal(decodeURIComponent(opened[0]!.split('?text=')[1]!), edited);

const cancelled = await confirmPhotoRequest({
  message: '   ',
  request: async () => {
    throw new Error('should not notify');
  },
  openUrl: async () => {
    throw new Error('should not open');
  },
});
assert.equal(cancelled.whatsApp, 'unavailable');
assert.equal(cancelled.notificationPersisted, false);

const missingPhone = await confirmPhotoRequest({
  message: 'Please share photos.',
  request: async () => ({
    notificationPersisted: true,
    notificationDuplicate: false,
    fcmQueued: true,
    phoneAvailable: false,
    internationalPhone: null,
  }),
  openUrl: async () => {
    throw new Error('should not open');
  },
});
assert.equal(missingPhone.whatsApp, 'unavailable');
assert.equal(missingPhone.notificationPersisted, true);

const whatsAppDown = await confirmPhotoRequest({
  message: 'Please share photos.',
  request: async () => ({
    notificationPersisted: true,
    notificationDuplicate: true,
    fcmQueued: false,
    phoneAvailable: true,
    internationalPhone: '919876543210',
  }),
  openUrl: async () => {
    throw new Error('popup blocked');
  },
});
assert.equal(whatsAppDown.whatsApp, 'failed');
assert.equal(whatsAppDown.notificationPersisted, true);
assert.equal(whatsAppDown.notificationDuplicate, true);
assert.equal(whatsAppDown.fcmQueued, false);

assert.equal(isPhotoRequestNotification({ notificationType: 'PHOTO_REQUEST_RECEIVED' }), true);
assert.equal(isPhotoRequestNotification({ notificationType: 'CONTACT_ENQUIRY_RECEIVED' }), false);

console.log('web photo request checks ok');
