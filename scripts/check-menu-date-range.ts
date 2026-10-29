import assert from 'node:assert/strict';
import { splitMenuDateRange } from '../src/modules/meals/utils/mealDates.ts';

const windows = splitMenuDateRange('2026-07-30', '2026-10-27');
assert.equal(windows[0]?.from, '2026-07-30');
assert.equal(windows.at(-1)?.to, '2026-10-27');
assert.ok(windows.length > 1);

for (let index = 0; index < windows.length; index += 1) {
  const window = windows[index]!;
  const start = new Date(`${window.from}T12:00:00`);
  const end = new Date(`${window.to}T12:00:00`);
  const inclusive = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  assert.ok(inclusive <= 31 && inclusive > 0, `${window.from}..${window.to} is ${inclusive} days`);
  if (index > 0) {
    const previous = new Date(`${windows[index - 1]!.to}T12:00:00`);
    previous.setDate(previous.getDate() + 1);
    const next = previous.toISOString().slice(0, 10);
    assert.equal(window.from, next);
  }
}

assert.deepEqual(splitMenuDateRange('2026-10-01', '2026-10-31'), [
  { from: '2026-10-01', to: '2026-10-31' },
]);

console.log('menu date range checks ok');
