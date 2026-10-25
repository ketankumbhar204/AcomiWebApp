import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BED_CAROUSEL_CARD,
  BED_CAROUSEL_GAP,
  bedCarouselEndInset,
  bedCarouselLayout,
} from '../src/modules/accommodation/utils/bedCarouselLayout.ts';
import {
  bedCarouselDotCount,
  bedCarouselHasOverflow,
  bedCarouselScrollTarget,
} from '../src/modules/accommodation/utils/bedCarouselNav.ts';
import { groupBedInventoryByRoom } from '../src/modules/dashboard/utils/groupBedInventoryByRoom.ts';

const root = dirname(fileURLToPath(import.meta.url));

function contentWidth(cardWidth, itemCount) {
  return cardWidth * itemCount + BED_CAROUSEL_GAP * Math.max(0, itemCount - 1);
}

const phone = bedCarouselLayout(334, 3);
assert.equal(phone.overflows, true);
assert.equal(phone.cardWidth, BED_CAROUSEL_CARD);
assert.ok(phone.cardWidth < phone.scrollerWidth);

const desktop = bedCarouselLayout(960, 6);
assert.equal(desktop.overflows, true);
assert.equal(desktop.cardWidth, BED_CAROUSEL_CARD);
assert.ok(desktop.columns > phone.columns);

const single = bedCarouselLayout(960, 1);
assert.equal(single.overflows, false);
assert.equal(single.cardWidth, BED_CAROUSEL_CARD);

const last = bedCarouselLayout(334, 4);
const inset = bedCarouselEndInset(last.scrollerWidth, last.cardWidth);
const maxScroll = contentWidth(last.cardWidth, 4) + inset - last.scrollerWidth;
assert.ok(maxScroll >= 3 * last.stride - 1);

const groups = groupBedInventoryByRoom([
  {
    bedId: 'b',
    label: 'B',
    status: 'OCCUPIED',
    buildingId: 'pg',
    buildingName: 'PG 1',
    floorId: 'f1',
    floorName: 'Floor 1',
    unitId: 'u',
    unitName: 'Unit 101',
    roomId: 'r',
    roomName: 'Room A',
  },
  {
    bedId: 'a',
    label: 'A',
    status: 'AVAILABLE',
    buildingId: 'pg',
    buildingName: 'PG 1',
    floorId: 'f1',
    floorName: 'Floor 1',
    unitId: 'u',
    unitName: 'Unit 101',
    roomId: 'r',
    roomName: 'Room A',
  },
  {
    bedId: 'c',
    label: 'C',
    status: 'AVAILABLE',
    buildingId: 'pg',
    buildingName: 'PG 1',
    floorId: 'f1',
    floorName: 'Floor 1',
    unitId: 'u',
    unitName: 'Unit 101',
    roomId: 'other',
    roomName: 'Room B',
  },
]);
assert.equal(groups.length, 2);
assert.deepEqual(
  groups[0].beds.map((bed) => bed.label),
  ['A', 'B'],
);
assert.equal(groups[0].beds[1].status, 'OCCUPIED');
assert.equal(groups[1].beds[0].roomName, 'Room B');

const roomCard = readFileSync(
  join(root, '../src/modules/accommodation/components/RoomInventoryCard.tsx'),
  'utf8',
);
const bedPage = readFileSync(
  join(root, '../src/modules/dashboard/pages/BedInventoryPage.tsx'),
  'utf8',
);
const carousel = readFileSync(
  join(root, '../src/modules/accommodation/components/BedCardCarousel.tsx'),
  'utf8',
);
assert.match(roomCard, /<BedCardCarousel/);
assert.doesNotMatch(roomCard, /repeat\(auto-fill/);
assert.match(bedPage, /<BedInventoryRoomSections/);
assert.doesNotMatch(bedPage, /size=\{\{ xs: 12, sm: 6, md: 4, lg: 3 \}\}/);
assert.match(carousel, /scrollbarWidth: 'none'/);
assert.match(carousel, /flexWrap: 'nowrap'/);
assert.match(carousel, /event\.shiftKey/);
assert.match(carousel, /Previous beds/);
assert.match(carousel, /ChevronLeft/);
assert.doesNotMatch(carousel, /overflow:\s*'hidden'/);
assert.equal(bedCarouselHasOverflow(348, 360), false);
assert.equal(bedCarouselDotCount(2, false), 0);
assert.equal(bedCarouselDotCount(3, true), 3);
assert.equal(bedCarouselScrollTarget(0, 1, 180, 194), 180);

console.log('bed carousel layout ok');
