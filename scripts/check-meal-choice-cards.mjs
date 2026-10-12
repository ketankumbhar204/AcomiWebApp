import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cards = readFileSync(
  join(root, 'src/modules/meals/components/MealChoiceCards.tsx'),
  'utf8',
);
const page = readFileSync(
  join(root, 'src/modules/meals/pages/MealPollResponsePage.tsx'),
  'utf8',
);
const mobile = readFileSync(
  join(root, '../AcomiMobile/src/screens/meals/MealPollResponseScreen.tsx'),
  'utf8',
);

assert.match(cards, /repeat\(3, minmax\(0, 1fr\)\)/);
assert.match(cards, /row\.plates/);
assert.match(cards, /tabSelected/);
assert.match(page, /<MealChoiceCards rows=\{mealProgress\} \/>/);
assert.equal((page.match(/<MealChoiceCards /g) ?? []).length, 2);
assert.match(mobile, /flexWrap: 'nowrap'/);
assert.match(mobile, /flexBasis: 0/);
assert.doesNotMatch(mobile, /flexWrap: 'wrap'/);

console.log('meal choice cards stay on one row');
