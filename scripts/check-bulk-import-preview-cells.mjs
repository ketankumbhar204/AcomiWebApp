import assert from 'node:assert/strict';
import {
  isImporterBlankMarker,
  mergeFieldOverride,
  previewCellInputValue,
  selectOptionsWithCurrent,
} from '../src/modules/admin/utils/bulkImportPreviewEdit.ts';

assert.equal(previewCellInputValue('Ravi Tiffin Service', undefined, undefined, 'text'), 'Ravi Tiffin Service');
assert.equal(previewCellInputValue('8483834008/9689569432', undefined, undefined, 'text'), '8483834008/9689569432');
assert.equal(previewCellInputValue('09876543210', undefined, undefined, 'text'), '09876543210');
assert.equal(previewCellInputValue('₹5,500/month', '5500', undefined, 'text'), '₹5,500/month');
assert.equal(previewCellInputValue('', undefined, undefined, 'text'), '');
assert.equal(previewCellInputValue('-', undefined, undefined, 'text'), '-');
assert.equal(previewCellInputValue('—', undefined, undefined, 'text'), '—');
assert.equal(previewCellInputValue('Tiffin Service', 'Mess', 'PG', 'text'), 'PG');
assert.equal(previewCellInputValue('Ravi', undefined, '', 'text'), '');

assert.equal(previewCellInputValue('Tiffin Service', 'Mess', undefined, 'select'), 'Mess');
assert.equal(previewCellInputValue('Food Court', undefined, undefined, 'select'), 'Food Court');
assert.equal(previewCellInputValue('-', undefined, undefined, 'select'), '');
assert.equal(previewCellInputValue('--', undefined, undefined, 'select'), '');
assert.equal(previewCellInputValue('—', undefined, undefined, 'select'), '');
assert.equal(previewCellInputValue('   ', undefined, undefined, 'select'), '');
assert.equal(previewCellInputValue('Both', 'Both', undefined, 'select'), 'Both');
assert.equal(previewCellInputValue('Unisex', undefined, '', 'select'), '');

assert.equal(isImporterBlankMarker('-'), true);
assert.equal(isImporterBlankMarker('Mess'), false);

const options = [
  { value: 'PG', label: 'PG' },
  { value: 'Mess', label: 'Mess' },
];
assert.deepEqual(selectOptionsWithCurrent(options, 'Mess'), options);
assert.equal(selectOptionsWithCurrent(options, 'Food Court')[0].value, 'Food Court');

const cleared = mergeFieldOverride({}, 4, 'PROPERTY_NAME', '');
assert.deepEqual(cleared['4'], { PROPERTY_NAME: '' });
const edited = mergeFieldOverride(cleared, 4, 'MOBILE_NUMBER', '8483834008');
assert.equal(edited['4'].PROPERTY_NAME, '');
assert.equal(edited['4'].MOBILE_NUMBER, '8483834008');
const removed = mergeFieldOverride(edited, 4, 'MOBILE_NUMBER', null);
assert.equal(removed['4'].MOBILE_NUMBER, undefined);
assert.equal(removed['4'].PROPERTY_NAME, '');

console.log('bulk import preview cells ok');
