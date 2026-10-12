/**
 * Save publishes through the existing poll flow.
 * Share does the same, then copies the message.
 */
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  defaultOtherSpaceIds,
  selectedShareDestinations,
  shouldOfferOtherSpaceShare,
} from '../src/modules/meals/utils/otherSpaceShareSelection.ts';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const editor = read('src/modules/meals/pages/MealMenuEditorPage.tsx');
assert.ok(editor.includes("onSaveDraft={() => void persist()}"), 'Save persists and returns');
assert.ok(!editor.includes("persist('save')"), 'Save must not open the share review');
assert.ok(editor.includes("enqueueSnackbar(t('meals.success.saved')"), 'Save shows success');
assert.ok(editor.includes('goBack()'), 'Save returns to meal planning');
assert.ok(editor.includes("persist('share')"), 'Share opens review');
assert.ok(
  editor.includes('spaceMealsSharePath(spaceId, menuDate, intent)'),
  'review route carries intent',
);
assert.ok(editor.includes('void persist();'), 'leaving still saves a draft');
assert.ok(!editor.includes('persist(false)'), 'leave path must not publish');
assert.ok(editor.includes("t('meals.actions.saveDraft')"), 'leave dialog keeps draft wording');

const share = read('src/modules/meals/pages/MealSharePage.tsx');
const publishAt = share.indexOf('await publishDraftMenusForTypes(');
const pollsAt = share.indexOf('await openPollsForMealTypes(');
const failedAt = share.indexOf('if (opened === 0)');
const gateAt = share.indexOf('if (externalShare)');
const clipAt = share.indexOf('navigator.clipboard.writeText', gateAt);
assert.ok(publishAt > -1, 'publish step missing');
assert.ok(pollsAt > publishAt, 'poll opens after publish');
assert.ok(failedAt > pollsAt, 'failed poll must not continue');
assert.ok(gateAt > failedAt, 'external share is after a successful poll');
assert.ok(clipAt > gateAt, 'clipboard stays inside the share branch');
assert.ok(share.includes('shouldOpenExternalShare'));
assert.ok(share.includes("t('meals.actions.save')"));
assert.ok(share.includes("t('meals.planning.copyMessage')"));

const bar = read('src/modules/meals/components/ProgressiveMealPlanningBar.tsx');
assert.ok(bar.includes("t('meals.actions.save')"));
assert.ok(bar.includes("t('meals.actions.share')"));
assert.ok(!bar.includes("t('meals.actions.saveDraft')"));
assert.ok(!bar.includes("t('meals.actions.shareMeal')"));

const intent = read('src/modules/meals/utils/mealReviewIntent.ts');
assert.ok(intent.includes("value === 'save' || value === 'share' || value === 'reshare'"));
assert.ok(intent.includes("return intent === 'share' || intent === 'reshare'"));
assert.ok(intent.includes("return intent !== 'reshare'"));

const planner = read('src/modules/meals/pages/MealsPlannerPage.tsx');
const cardsAt = planner.indexOf('<MealSlotCard');
const shareAt = planner.indexOf('onClick={openDayShare}');
const libraryAt = planner.indexOf('spaceMealsLibraryPath(spaceId)');
assert.ok(cardsAt > -1 && shareAt > cardsAt, 'share action follows the meal cards');
assert.ok(libraryAt > shareAt, 'menu library follows the share action');
assert.ok(planner.includes("shareAction === 'reshare' ? 'reshare' : 'save'"));
assert.ok(planner.includes('spaceMealsPlansPath(spaceId)'));
assert.ok(!planner.includes("t('meals.planning.share')}"));

const sharePage = share;
assert.ok(sharePage.includes('if (publishMenu)'));
assert.ok(sharePage.indexOf('if (publishMenu)') < sharePage.indexOf('await publishDraftMenusForTypes('));
assert.ok(sharePage.includes("includePublished: reviewIntent === 'reshare'"));

const paths = read('src/routes/paths.ts');
assert.ok(paths.includes("params.set('intent', intent)"));

for (const locale of ['en.json', 'hi.json', 'mr.json']) {
  const messages = JSON.parse(read(`src/i18n/locales/${locale}`));
  assert.equal(messages.meals.actions.save.length > 0, true, locale);
  assert.equal(messages.meals.actions.share.length > 0, true, locale);
  assert.equal(messages.meals.planning.reviewSaveTitle.length > 0, true, locale);
  assert.equal(messages.meals.planning.reviewSaveHint.length > 0, true, locale);
}

assert.equal(shouldOfferOtherSpaceShare(0), false);
assert.equal(shouldOfferOtherSpaceShare(1), true);
assert.deepEqual(defaultOtherSpaceIds([{ spaceId: 'b' }, { spaceId: 'c' }]), ['b', 'c']);
assert.deepEqual(
  selectedShareDestinations([{ spaceId: 'b' }, { spaceId: 'c' }], ['c']).map((row) => row.spaceId),
  ['c'],
);
assert.deepEqual(
  selectedShareDestinations([{ spaceId: 'b' }], ['b', 'rental']).map((row) => row.spaceId),
  ['b'],
);

assert.ok(sharePage.includes('offerOtherSpaces'));
assert.ok(sharePage.includes('selectedShareDestinations(otherSpaces, selectedOtherSpaceIds)'));
assert.ok(sharePage.includes('defaultOtherSpaceIds'));
assert.ok(sharePage.includes('locked'));
const sectionAt = sharePage.indexOf('offerOtherSpaces');
const currentSpaceAt = sharePage.indexOf("t('meals.planning.shareToCurrent')");
assert.ok(sharePage.includes('navigate(spaceMealsPath(spaceId, menuDate), { replace: true })'));
assert.ok(sharePage.includes('historyAction === \'POP\''));
assert.ok(sharePage.includes('SHARE_SPACE_CONCURRENCY'));
assert.ok(sectionAt > -1 && currentSpaceAt > sectionAt);

const mealsSection = read('src/modules/dashboard/components/customer/DashboardCustomerMealsSection.tsx');
assert.ok(mealsSection.includes('resolveMealPollChoice(poll, multiQuantity)'));
assert.ok(mealsSection.includes("choice === 'unavailable'"));
assert.ok(mealsSection.includes('dashboard.pollCard.notAvailable'));
const summary = read('src/modules/meals/utils/mealSelectionSummary.ts');
assert.ok(summary.includes("return option.optionType === 'NOT_AVAILABLE' ? 'unavailable' : 'selected'"));

console.log('meal review intent checks passed');
