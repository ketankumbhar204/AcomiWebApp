import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { supplierDisplayName, supplierWrite } from '../src/modules/inventory/utils/inventorySupplier.ts';

const suppliers = [
  { supplierId: 'seed', name: 'General Supplies' },
  { supplierId: 'city', name: 'City Linens' },
];

assert.equal(
  supplierDisplayName({ supplierId: 'seed', supplierName: 'General Supplies' }, []),
  'General Supplies',
);
assert.equal(supplierDisplayName({ supplierId: null, supplierName: null }, suppliers), null);
assert.equal(supplierDisplayName({ supplierId: 'city' }, suppliers), 'City Linens');
assert.deepEqual(supplierWrite(' general supplies ', suppliers), {
  supplierId: 'seed',
  supplierName: null,
});
assert.deepEqual(supplierWrite('Linen House', suppliers), {
  supplierId: null,
  supplierName: 'Linen House',
});
assert.deepEqual(supplierWrite(' ', suppliers), { supplierId: null, supplierName: '' });

const form = readFileSync(new URL('../src/modules/inventory/components/ItemFormDrawer.tsx', import.meta.url), 'utf8');
const inspector = readFileSync(new URL('../src/modules/inventory/components/ItemInspector.tsx', import.meta.url), 'utf8');
assert.match(form, /supplierWrite\(supplierName/);
assert.match(form, /freeSolo/);
assert.match(inspector, /item\.supplierName/);

console.log('inventory supplier checks passed');
