/**
 * Dashboard meal-card status mapping stays aligned with mobile.
 * Breakfast with a saved menu is Not shared, not Empty.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDashboardMealSlotRows } from '../src/modules/meals/utils/dashboardMealSlotDisplay.ts';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

function menu(mealType, status, optionCount) {
  return {
    menuDate: '2026-10-17',
    mealType,
    status,
    options: Array.from({ length: optionCount }, (_, index) => ({
      optionId: `${mealType}-${index}`,
      isAvailable: true,
      sortOrder: index,
      label: 'Idli',
    })),
  };
}

function poll(mealType, status, responseCount) {
  return {
    id: `${mealType}-poll`,
    pollDate: '2026-10-17',
    mealType,
    status,
    dailyMenuId: `${mealType}-menu`,
    options: [],
    responseCount,
  };
}

const emptyRows = buildDashboardMealSlotRows({}, {});
assert.deepEqual(
  emptyRows.map((row) => row.mealType),
  ['BREAKFAST', 'LUNCH', 'DINNER'],
);
assert.equal(emptyRows.every((row) => row.statusKind === 'empty'), true);
assert.equal(emptyRows.every((row) => row.captionKey === 'meals.planning.cardHintEmpty'), true);

const draftRows = buildDashboardMealSlotRows(
  {
    BREAKFAST: menu('BREAKFAST', 'DRAFT', 1),
    LUNCH: menu('LUNCH', 'DRAFT', 2),
  },
  {},
);
assert.equal(draftRows[0].statusKind, 'draft');
assert.equal(draftRows[0].statusLabelKey, 'meals.status.notShared');
assert.equal(draftRows[0].captionKey, 'meals.planning.cardHintDraft');
assert.equal(draftRows[2].statusKind, 'empty');

const publishedRows = buildDashboardMealSlotRows(
  {
    BREAKFAST: menu('BREAKFAST', 'PUBLISHED', 1),
    LUNCH: menu('LUNCH', 'DRAFT', 1),
  },
  { BREAKFAST: poll('BREAKFAST', 'OPEN', 1) },
  { BREAKFAST: 4 },
  {},
  4,
);
assert.equal(publishedRows[0].statusKind, 'shared');
assert.equal(publishedRows[0].countPrimary, '1 / 4');
assert.equal(publishedRows[0].captionTone, 'progress');
assert.equal(publishedRows[1].statusKind, 'draft');

const modifiedRows = buildDashboardMealSlotRows(
  { BREAKFAST: menu('BREAKFAST', 'MODIFIED', 2) },
  {},
);
assert.equal(modifiedRows[0].statusKind, 'needs_reshare');
assert.equal(modifiedRows[0].captionKey, 'meals.planning.cardHintNeedsReshare');

const closedRows = buildDashboardMealSlotRows(
  { BREAKFAST: menu('BREAKFAST', 'PUBLISHED', 1) },
  { BREAKFAST: poll('BREAKFAST', 'CLOSED', 3) },
  { BREAKFAST: 4 },
);
assert.equal(closedRows[0].statusKind, 'shared');
assert.equal(closedRows[0].captionKey, 'meals.planning.cardHintPollClosed');

const slotCard = read('src/modules/meals/components/MealSlotCard.tsx');
const dashboard = read('src/modules/dashboard/components/MealOperationsTodayCard.tsx');
const planner = read('src/modules/meals/pages/MealsPlannerPage.tsx');
const card = read('src/modules/meals/components/MealOperationSlotCard.tsx');

assert.match(slotCard, /MealOperationSlotCard/);
assert.match(slotCard, /buildDashboardMealSlotRows/);
assert.doesNotMatch(slotCard, /selector\.planned/);
assert.doesNotMatch(slotCard, /Sunrise/);
assert.match(dashboard, /MealOperationSlotCard/);
assert.match(dashboard, /buildDashboardMealSlotRows/);
assert.match(dashboard, /repeat\(3, minmax\(0, 1fr\)\)/);
assert.match(planner, /repeat\(3, minmax\(0, 1fr\)\)/);
assert.match(card, /#FFF7ED|#D97706|mealTypeTheme/);
assert.match(card, /SunMedium/);
assert.match(card, /minHeight: compact \? \(selected \? 88 : 80\) : 104/);

console.log('meal operation cards match dashboard status');
