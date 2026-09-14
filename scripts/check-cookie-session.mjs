import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const client = read('src/shared/api/client.ts');
const authApi = read('src/modules/auth/api/authApi.ts');
const authStore = read('src/store/authStore.ts');
const loginPage = read('src/modules/auth/pages/LoginPage.tsx');
const registerPage = read('src/modules/auth/pages/RegisterPage.tsx');

assert(client.includes('withCredentials: true'), 'AcomiWeb must send auth cookies');
assert(authApi.includes("'/auth/logout'"), 'AcomiWeb must use existing logout');
assert(authStore.includes('authApi.getMe()'), 'bootstrap must probe /auth/me for cookie sessions');
assert(authStore.includes('authApi.logout()'), 'clearSession must clear the API cookie');
assert(!authStore.includes('access_token='), 'auth store must not put tokens in URLs');
assert(!loginPage.includes('searchParams.set("token"'), 'login must not hand off tokens in the URL');
assert(!registerPage.includes('searchParams.set("token"'), 'register must not hand off tokens in the URL');
assert(loginPage.includes('useLogin'), 'existing password login must remain');
assert(registerPage.includes('useRegister'), 'existing registration must remain');

console.log('AcomiWeb cookie-session checks passed');
