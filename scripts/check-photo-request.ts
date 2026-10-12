import assert from 'node:assert/strict';
import {
  buildPhotoRequestMessage,
  hasActualListingPhotos,
  photoRequestActionLabel,
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

const propertyEmpty = buildPhotoRequestMessage({
  kind: 'property',
  hasPhotos: false,
  name: 'Stanza Living Positano House',
  spaceType: 'HOSTEL',
  location: 'Hinjawadi',
});
assert.match(propertyEmpty, /looking for a Hostel in Hinjawadi/);

const messPhotos = buildPhotoRequestMessage({
  kind: 'mess',
  hasPhotos: true,
  name: 'Annapurna Mess',
});
assert.match(messPhotos, /more photos of your meals/);
assert.doesNotMatch(messPhotos, /bathroom/);

const url = whatsAppChatUrl('8047622222', 'Photos, please.\nThanks!');
assert.match(url!, /wa\.me\/918047622222/);
assert.equal(whatsAppPhoneDigits('+919876543210'), '919876543210');
assert.equal(whatsAppChatUrl(null, 'Hello'), null);
assert.equal(whatsAppPhoneDigits('+1 415 555 2671'), '14155552671');

console.log('web photo request checks ok');
