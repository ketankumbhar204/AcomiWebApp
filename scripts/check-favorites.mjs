import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FavoriteSession, runFavoriteToggle } from '../src/shared/utils/favoriteSession.ts';

const session = new FavoriteSession();
const saved = await runFavoriteToggle(true, 'pg-1', session, {
  add: async () => ({ favorited: true }),
  remove: async () => ({ favorited: false }),
});
assert.equal(saved, 'saved');
assert.equal(session.isFavorite('pg-1'), true);

const removed = await runFavoriteToggle(true, 'pg-1', session, {
  add: async () => ({ favorited: true }),
  remove: async () => ({ favorited: false }),
});
assert.equal(removed, 'removed');
assert.equal(session.isFavorite('pg-1'), false);

const failed = new FavoriteSession();
assert.equal(
  await runFavoriteToggle(true, 'mess-1', failed, {
    add: async () => {
      throw new Error('down');
    },
    remove: async () => ({ favorited: false }),
  }),
  'failed',
);
assert.equal(failed.isFavorite('mess-1'), false);

const signedOut = new FavoriteSession();
let calls = 0;
assert.equal(
  await runFavoriteToggle(false, 'pg-1', signedOut, {
    add: async () => {
      calls += 1;
      return { favorited: true };
    },
    remove: async () => ({ favorited: false }),
  }),
  'auth-required',
);
assert.equal(calls, 0);
assert.equal(signedOut.isFavorite('pg-1'), false);

const refused = new FavoriteSession();
assert.equal(
  await runFavoriteToggle(true, 'pg-9', refused, {
    add: async () => ({ favorited: false }),
    remove: async () => ({ favorited: false }),
  }),
  'failed',
);
assert.equal(refused.isFavorite('pg-9'), false);

const card = readFileSync(new URL('../src/modules/onboarding/components/DiscoverSpaceCard.tsx', import.meta.url), 'utf8');
const page = readFileSync(new URL('../src/modules/onboarding/pages/FavoritesPage.tsx', import.meta.url), 'utf8');
const api = readFileSync(new URL('../src/shared/api/favoritesApi.ts', import.meta.url), 'utf8');
assert.match(card, /FavoriteHeartButton/);
assert.doesNotMatch(card, /aria-hidden[\s\S]{0,180}<Heart/);
assert.match(page, /favoritesApi\.list/);
assert.match(api, /\/me\/favorites/);
assert.match(api, /\/me\/favorites\/\$\{spaceId\}/);

console.log('favorites checks passed');
