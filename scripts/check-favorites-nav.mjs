import assert from 'node:assert/strict';
import fs from 'node:fs';

const header = fs.readFileSync(new URL('../src/layouts/DiscoverShellLayout.tsx', import.meta.url), 'utf8');
assert.match(header, /navigate\(ROUTES\.favorites\)/);
assert.match(header, /navigation\.favorites/);
assert.match(header, /<Heart/);

const page = fs.readFileSync(new URL('../src/modules/onboarding/pages/FavoritesPage.tsx', import.meta.url), 'utf8');
assert.match(page, /favoritesApi\.list/);
assert.match(page, /type === 'MESS'/);
assert.match(page, /unavailable/);

console.log('web favorites navigation checks passed');
