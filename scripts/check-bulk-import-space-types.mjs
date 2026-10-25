/**
 * Space-type review selection for the admin Excel import.
 * A mixed cell keeps every detected label until the reviewer leaves one.
 */
import assert from 'node:assert/strict';
import { commitTypeSelection, typeSelection } from '../src/modules/admin/utils/spaceTypeSelection.ts';

const suggested = 'PG | Hostel';
assert.deepEqual(typeSelection('', suggested), ['PG', 'Hostel']);
assert.deepEqual(typeSelection('Mess | PG | Rental', suggested), ['Mess', 'PG', 'Rental']);
assert.deepEqual(typeSelection('Corporate Stay', 'PG | Hostel'), ['Corporate Stay']);
assert.equal(commitTypeSelection(['PG', 'Co-living', 'Rental']), 'PG | Co-living | Rental');
assert.equal(commitTypeSelection(['Corporate Stay']), 'Corporate Stay');
assert.equal(commitTypeSelection([]), null);

const options = ['PG', 'Hostel', 'Co-living', 'Rental', 'Mess', 'Corporate Stay'];
for (const label of ['PG', 'Hostel', 'Co-living', 'Rental', 'Mess', 'Corporate Stay']) {
  assert.ok(options.includes(label));
}

console.log('bulk import space-type selection ok');
