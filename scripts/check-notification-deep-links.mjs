import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractIsoDateFromText, extractMealTypeFromText } from '../src/shared/utils/extractIsoDateFromText.ts';

const root = dirname(fileURLToPath(import.meta.url));
const webLinks = readFileSync(join(root, '../src/shared/utils/notificationDeepLinks.ts'), 'utf8');
const mobileLinks = readFileSync(
  join(root, '../../AcomiMobile/src/utils/notificationDeepLinks.ts'),
  'utf8',
);
const mobileMenu = readFileSync(
  join(root, '../../AcomiMobile/src/screens/meals/DailyMenuTodayScreen.tsx'),
  'utf8',
);
const mobilePoll = readFileSync(
  join(root, '../../AcomiMobile/src/screens/meals/MealPollResponseScreen.tsx'),
  'utf8',
);

assert.equal(extractIsoDateFromText('DINNER · 2026-10-09 · Sunrise PG'), '2026-10-09');
assert.equal(extractMealTypeFromText('DINNER · 2026-10-09 · Sunrise PG'), 'DINNER');
assert.equal(extractMealTypeFromText("Check today's menu for Sunrise PG."), null);

assert.match(webLinks, /case 'MEAL_POLL_PUBLISHED':/);
assert.match(webLinks, /spaceMealsPollPath\(spaceId, meal\.menuDate, meal\.mealType\)/);
assert.doesNotMatch(
  webLinks.slice(webLinks.indexOf("case 'MEAL_POLL_PUBLISHED'"), webLinks.indexOf("case 'SUBSCRIPTION_ACTIVATION_PENDING'")),
  /spaceMealsPath\(spaceId, menuDate/,
);

assert.match(mobileLinks, /navigateMainStack\('MealPollResponse'/);
assert.match(mobileLinks, /navigateMainStack\('DailyMenuToday'/);
assert.match(mobileLinks, /case 'MENU_PUBLISHED':/);
assert.match(mobileMenu, /getDailyMenusByDate\(spaceId, menuDate\)/);
assert.doesNotMatch(mobileMenu, /getDailyMenusToday/);
assert.match(mobileMenu, /meals\.menu\.unavailable/);
assert.match(mobileMenu, /onRespond=/);
assert.match(mobilePoll, /initialMealType=\{mealType\}/);

console.log('notification deep links ok');
