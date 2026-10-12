import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function source(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8');
}

const panel = source('src/shared/components/GuidedStepPanel.tsx');
const colors = source('src/shared/theme/colors.ts');
const member = source('src/modules/members/components/MemberFormDrawer.tsx');
const share = source('src/modules/meals/pages/MealSharePage.tsx');
const meals = source('src/modules/meals/components/ProgressiveMealPlanningBar.tsx');
const sticky = source('src/shared/components/StickyFooter.tsx');

assert.match(colors, /guidance:\s*\{/);
assert.match(panel, /colors\.guidance/);
assert.match(panel, /g\.ctaText/);
assert.match(panel, /function StepDots/);
assert.match(member, /GuidedStepPanel/);
assert.match(member, /progressiveWorkflow\.member\.reviewMealsTitle/);
assert.match(member, /createMember\.mutateAsync/);
assert.match(share, /GuidedStepPanel/);
assert.match(share, /progressiveWorkflow\.sharePreview\.continueToMessage/);
assert.match(meals, /GuidedStepPanel/);
assert.match(meals, /onContinueToExtras/);
assert.match(meals, /onSaveDraft/);
assert.match(meals, /onShareMeal/);
assert.match(meals, /compact/);
assert.match(meals, /selectedCount/);
assert.match(meals, /selectedMealsNextExtras/);
assert.doesNotMatch(meals, /reviewExtrasTitle/);
assert.match(panel, /compact\?: boolean/);
assert.match(panel, /flexWrap: compact \? 'wrap'/);
assert.match(sticky, /stickyFooterAccentSx/);
assert.doesNotMatch(sticky, /colors\.guidance/);
assert.match(source('src/shared/theme/guidedStepFooterHostSx.ts'), /guidedStepFooterHostSx/);

console.log('guided-step-panel: ok');
