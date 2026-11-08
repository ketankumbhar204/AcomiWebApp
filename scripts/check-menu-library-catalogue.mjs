import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const mobileRoot = join(webRoot, '../AcomiMobile');

const page = readFileSync(
  join(webRoot, 'src/modules/meals/pages/MenuLibraryPage.tsx'),
  'utf8',
);
const tip = readFileSync(
  join(webRoot, 'src/modules/meals/components/MenuLibraryReadyTip.tsx'),
  'utf8',
);
const webEn = readFileSync(join(webRoot, 'src/i18n/locales/en.json'), 'utf8');
const mobileScreen = readFileSync(
  join(mobileRoot, 'src/screens/meals/MenuLibraryScreen.tsx'),
  'utf8',
);
const mobileHook = readFileSync(
  join(mobileRoot, 'src/hooks/useMenuLibrary.ts'),
  'utf8',
);
const mobileEn = readFileSync(join(mobileRoot, 'src/i18n/locales/en.json'), 'utf8');

assert.match(page, /data-testid="library-summary"/);
assert.match(page, /library-summary-items/);
assert.match(page, /library-summary-categories/);
assert.match(page, /library-summary-combos/);
assert.match(page, /data-testid="library-category-chips"/);
assert.match(page, /data-testid="library-manage-categories"/);
assert.match(page, /data-testid="library-subscription"/);
assert.match(page, /spaceMealsPlansPath\(spaceId\)/);
assert.match(page, /meals\.library\.createItem/);
assert.match(page, /meals\.library\.createCombo/);
assert.match(page, /meals\.library\.items'\)\} \(\$\{activeItems\.length\}\)/);
assert.match(page, /meals\.library\.combos'\)\} \(\$\{activeCombos\.length\}\)/);
assert.match(page, /<FoodItemFormDrawer/);
assert.match(page, /<CreateComboPlannerDialog/);
assert.match(page, /<MealComboFormDrawer/);
assert.match(page, /<ConfigureLibraryExtrasDrawer/);
assert.match(page, /<CategoryFormDialog/);
assert.match(page, /searchInputId="meals-library-search"/);
assert.match(page, /foodTypeFilter/);
assert.match(page, /viewMode === 'table'/);
assert.match(page, /deactivateFoodItem/);
assert.match(page, /deactivateMealCombo/);
assert.match(page, /setMealComboEnabled/);
assert.match(page, /updateFoodItemExtra/);
assert.match(page, /deactivateFoodCategory/);
assert.match(page, /updateFoodCategory/);
assert.match(page, /category\.scope === 'SPACE'/);
assert.match(
  readFileSync(join(webRoot, 'src/modules/meals/api/mealsApi.ts'), 'utf8'),
  /put<ApiResponse<FoodCategoryResponse>>\(\s*`\/spaces\/\$\{spaceId\}\/food-categories\/\$\{categoryId\}`/,
);
assert.match(page, /meals-library-search/);

assert.match(tip, /acomi:menu-library-ready-tip:/);
assert.match(tip, /readyTipContinue/);
assert.match(tip, /spaceMealsPath\(spaceId\)/);
assert.match(tip, /localStorage\.setItem/);
assert.doesNotMatch(tip, /readyTipStay/);

assert.match(webEn, /"readyTipBody": "Edit your items and combos anytime\."/);
assert.match(mobileEn, /"readyTipBody": "Edit your items and combos anytime\."/);
assert.match(mobileScreen, /<LibrarySummaryStrip/);
assert.match(mobileScreen, /MenuLibraryReadyTip/);
assert.match(mobileHook, /export function resolveSelectedCategoryId/);

console.log('menu library catalogue stays wired on web and mobile');
