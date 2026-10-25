/**
 * Past and expired meal polls show Poll Closed and cannot be chosen.
 * Open current and future polls stay choosable.
 */
import assert from 'node:assert/strict';
import {
  activityDayPollClosed,
  canChooseActivityMeals,
  isUnansweredClosedPoll,
} from '../src/modules/meals/utils/mealPollActivityStatus.ts';

const pastClosed = [
  { status: 'PENDING', pollStatus: 'CLOSED' },
  { status: 'PENDING', pollStatus: 'CLOSED' },
  { status: 'PENDING', pollStatus: 'CLOSED' },
];
assert.equal(canChooseActivityMeals(pastClosed), false);
assert.equal(activityDayPollClosed(pastClosed), true);
assert.equal(isUnansweredClosedPoll(pastClosed[0]), true);

const currentOpen = [{ status: 'PENDING', pollStatus: 'OPEN' }];
assert.equal(canChooseActivityMeals(currentOpen), true);
assert.equal(activityDayPollClosed(currentOpen), false);

const currentExpired = [{ status: 'PENDING', pollStatus: 'CLOSED' }];
assert.equal(canChooseActivityMeals(currentExpired), false);
assert.equal(activityDayPollClosed(currentExpired), true);

const futureOpen = [{ status: 'PENDING', pollStatus: 'OPEN' }];
assert.equal(canChooseActivityMeals(futureOpen), true);
assert.equal(activityDayPollClosed(futureOpen), false);

const answeredClosed = [{ status: 'ACCEPTED', pollStatus: 'CLOSED' }];
assert.equal(isUnansweredClosedPoll(answeredClosed[0]), false);
assert.equal(canChooseActivityMeals(answeredClosed), false);
assert.equal(activityDayPollClosed(answeredClosed), true);

const mixed = [
  { status: 'PENDING', pollStatus: 'CLOSED' },
  { status: 'PENDING', pollStatus: 'OPEN' },
];
assert.equal(canChooseActivityMeals(mixed), true);
assert.equal(activityDayPollClosed(mixed), false);

console.log('meal poll closed checks passed');
