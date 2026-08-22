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

const en = JSON.parse(read('src/i18n/locales/en.json'));
const authApi = read('src/modules/auth/api/authApi.ts');
const sendOtp = read('src/modules/auth/hooks/useSendOtp.ts');
const verifyOtp = read('src/modules/auth/hooks/useVerifyOtp.ts');
const passwordAuth = read('src/modules/auth/hooks/usePasswordAuth.ts');
const loginPage = read('src/modules/auth/pages/LoginPage.tsx');
const registerPage = read('src/modules/auth/pages/RegisterPage.tsx');
const otpPage = read('src/modules/auth/pages/OtpPage.tsx');
const passwordPage = read('src/modules/auth/pages/RegisterPasswordPage.tsx');
const routes = read('src/app/router/routes.tsx');
const paths = read('src/routes/paths.ts');
const types = read('src/shared/types/auth.ts');
const deleteAccountPage = read('src/modules/legal/pages/DeleteAccountPage.tsx');
const privacyPage = read('src/modules/legal/pages/PrivacyPolicyPage.tsx');

assert(paths.includes("registerOtp: '/register/otp'"), 'register OTP route is missing');
assert(
  paths.includes("registerPassword: '/register/password'"),
  'register password route is missing',
);
assert(paths.includes("privacy: '/privacy'"), 'privacy route is missing');
assert(paths.includes("deleteAccount: '/delete-account'"), 'delete-account route is missing');
assert(fs.existsSync(path.join(root, 'src/modules/auth/pages/OtpPage.tsx')), 'OTP page file missing');
assert(
  fs.existsSync(path.join(root, 'src/modules/auth/pages/RegisterPasswordPage.tsx')),
  'OTP password page file missing',
);
assert(routes.includes('ROUTES.registerOtp'), 'register OTP route is not wired');
assert(routes.includes('ROUTES.registerPassword'), 'register password route is not wired');
assert(loginPage.includes('useLogin'), 'login page must use password login');
assert(!/sendOtp|useSendOtp|useVerifyOtp/.test(loginPage), 'login page must not send OTP');
assert(registerPage.includes('useRegister'), 'register page must use password registration');
assert(!/useSendOtp|useVerifyOtp|ROUTES.registerOtp/.test(registerPage), 'register page must not send OTP');
assert(registerPage.includes('auth.register.submit'), 'register page must use Create Account');
assert(!otpPage.includes('setSession'), 'OTP page must not establish a session');
assert(!verifyOtp.includes('setSession'), 'verify OTP hook must not establish a session');
assert(verifyOtp.includes("purpose: 'REGISTER'"), 'verify OTP must use REGISTER purpose');
assert(sendOtp.includes("purpose: 'REGISTER'"), 'send OTP must use REGISTER purpose');
assert(authApi.includes("'/auth/send-otp'"), 'send-otp endpoint missing');
assert(authApi.includes("'/auth/verify-otp'"), 'verify-otp endpoint missing');
assert(authApi.includes('payload.verificationToken'), 'register token support missing');
assert(passwordAuth.includes('setSession(result.user, result.accessToken)'), 'register must set JWT');
assert(passwordPage.includes('verificationToken'), 'reserved OTP password page must still send verification token');
assert(!otpPage.includes('verificationToken'), 'OTP page must not put token in the view contract');
assert(types.includes("purpose: OtpPurpose"), 'OTP purpose is required');
assert(!authApi.includes('111111'), 'auth API must not hardcode OTP');
assert(!otpPage.includes('111111'), 'OTP page must not hardcode OTP');
assert(!registerPage.includes('123456'), 'register page must not hardcode OTP');
assert(!String(en.auth.otp.devHint).includes('111111'), 'dev hint must not contain a hardcoded OTP');
assert(!String(en.auth.otp.devHint).includes('123456'), 'dev hint must not contain a hardcoded OTP');
assert(
  String(en.auth.otp.devHint).toLowerCase().includes('development log'),
  'dev hint must point to the backend development log',
);
assert(en.auth.login.subheading.toLowerCase().includes('password'), 'login remains password-based');
assert(!en.auth.login.subheading.toLowerCase().includes('otp'), 'login copy must not require OTP');
assert(!en.auth.register.subheading.toLowerCase().includes('otp'), 'register copy must not require OTP');
assert(deleteAccountPage.includes('deleteAccountByPassword'), 'delete-account must use password');
assert(!/useSendOtp|verifyOtp/.test(deleteAccountPage), 'delete-account must not use OTP');
assert(privacyPage.length > 0, 'privacy page is missing');

console.log('Password authentication and reserved OTP contract checks passed.');
