import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  GENERATED_PASSWORD_LENGTH,
  canCopyPassword,
  generateStrongPassword,
} from '../src/modules/admin/utils/generatePassword.ts';

const source = readFileSync(
  new URL('../src/modules/admin/utils/generatePassword.ts', import.meta.url),
  'utf8',
);
const panel = readFileSync(
  new URL('../src/modules/admin/components/AdminResetPasswordPanel.tsx', import.meta.url),
  'utf8',
);
const api = readFileSync(new URL('../src/modules/admin/api/adminApi.ts', import.meta.url), 'utf8');

function sequence(values) {
  let index = 0;
  return (exclusiveMax) => {
    const value = values[index] ?? 0;
    index += 1;
    return value % exclusiveMax;
  };
}

const seen = new Set();
for (let i = 0; i < 20; i += 1) {
  const password = generateStrongPassword();
  seen.add(password);
  assert.equal(password.length, GENERATED_PASSWORD_LENGTH);
  assert.equal(canCopyPassword(password), true);
  assert.match(password, /[a-z]/);
  assert.match(password, /[A-Z]/);
  assert.match(password, /[2-9]/);
  assert.match(password, /[!@#$%&*\-_=+]/);
}
assert.ok(seen.size > 1);

const values = [3, 5, 2, 1, 4, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
assert.equal(generateStrongPassword(sequence(values)), generateStrongPassword(sequence(values)));
assert.equal(canCopyPassword(''), false);
assert.equal(canCopyPassword('short'), false);
assert.equal(canCopyPassword('a'.repeat(73)), false);
assert.equal(source.includes('Math.random'), false);
assert.equal(source.includes('Date.now'), false);

assert.equal(api.includes('/admin/registered-users/${id}/reset-password'), true);
assert.equal(panel.includes('resetRegisteredUserPassword'), true);
assert.equal(panel.includes('generateStrongPassword'), true);
assert.equal(panel.includes('navigator.clipboard.writeText'), true);
assert.equal(panel.includes('localStorage'), false);
assert.equal(panel.includes('sessionStorage'), false);
assert.equal(panel.includes('console.log'), false);

const copyStart = panel.indexOf('async function handleCopy');
const resetStart = panel.indexOf('function requestReset');
assert.ok(copyStart >= 0 && resetStart > copyStart);
assert.equal(panel.slice(copyStart, resetStart).includes('resetRegisteredUserPassword'), false);

console.log('admin password reset checks passed');
