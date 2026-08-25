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
const forgotPage = read('src/modules/auth/pages/ForgotPasswordPage.tsx');
const resetPage = read('src/modules/auth/pages/ResetPasswordPage.tsx');
const routes = read('src/app/router/routes.tsx');
const paths = read('src/routes/paths.ts');
const types = read('src/shared/types/auth.ts');
const profilePage = read('src/modules/profile/pages/ProfilePage.tsx');
const deleteAccountPage = read('src/modules/legal/pages/DeleteAccountPage.tsx');
const privacyPage = read('src/modules/legal/pages/PrivacyPolicyPage.tsx');

assert(paths.includes("registerOtp: '/register/otp'"), 'register OTP route is missing');
assert(paths.includes("loginOtp: '/login/otp'"), 'login OTP route is missing');
assert(paths.includes("forgotPassword: '/forgot-password'"), 'forgot-password route is missing');
assert(paths.includes("resetPassword: '/reset-password'"), 'reset-password route is missing');
assert(paths.includes("deleteAccount: '/delete-account'"), 'delete-account route is missing');
assert(loginPage.includes('useLogin'), 'login page must keep password login');
assert(loginPage.includes("'LOGIN'"), 'login OTP must use LOGIN purpose');
assert(loginPage.includes('useSendOtp'), 'login OTP mode must send OTP');
assert(registerPage.includes('useSendOtp'), 'register page must send OTP before creating the account');
assert(registerPage.includes('ROUTES.registerOtp'), 'register page must open the OTP screen');
assert(otpPage.includes('useRegister'), 'OTP page must complete registration after verify');
assert(otpPage.includes('loginWithOtp'), 'OTP page must support login OTP');
assert(otpPage.includes('maskIndianMobile'), 'OTP page must mask the mobile number');
assert(verifyOtp.includes("purpose: OtpPurpose = 'REGISTER'") || verifyOtp.includes("purpose = 'REGISTER'"), 'verify OTP defaults to REGISTER');
assert(sendOtp.includes("purpose: OtpPurpose = 'REGISTER'") || sendOtp.includes("purpose = 'REGISTER'"), 'send OTP defaults to REGISTER');
assert(authApi.includes("'/auth/send-otp'"), 'send-otp endpoint missing');
assert(authApi.includes("'/auth/verify-otp'"), 'verify-otp endpoint missing');
assert(authApi.includes("'/auth/login-with-otp'"), 'login-with-otp endpoint missing');
assert(authApi.includes("'/auth/reset-password'"), 'reset-password endpoint missing');
assert(passwordAuth.includes('setSession(result.user, result.accessToken)'), 'register must set JWT');
assert(forgotPage.includes("'RESET_PASSWORD'"), 'forgot password must use RESET_PASSWORD');
assert(resetPage.includes('resetPassword'), 'reset password page missing');
assert(deleteAccountPage.includes('deleteAccountByPassword'), 'delete-account must keep password');
assert(deleteAccountPage.includes('ACCOUNT_DELETION'), 'delete-account OTP purpose missing');
assert(otpPage.includes('ACCOUNT_DELETION'), 'OTP page must handle account deletion');
assert(otpPage.includes('deleteAccountByOtp'), 'OTP page must submit deletion after verify');
assert(otpPage.includes('DeleteAccountConfirmDialog'), 'OTP page must confirm deletion in a modal');
assert(!otpPage.includes('otpVerified: true'), 'OTP page must not return to delete-account after verify');
assert(profilePage.includes('ROUTES.deleteAccount'), 'profile page must expose delete account');
assert(profilePage.includes('Trash2'), 'profile delete account control missing');
assert(types.includes("'LOGIN'"), 'LOGIN purpose missing');
assert(types.includes("'RESET_PASSWORD'"), 'RESET_PASSWORD purpose missing');
assert(!authApi.includes('111111'), 'auth API must not hardcode OTP');
assert(!otpPage.includes('111111'), 'OTP page must not hardcode OTP');
assert(privacyPage.length > 0, 'privacy page is missing');
assert(routes.includes('ROUTES.loginOtp'), 'login OTP route is not wired');
assert(en.auth.login.modeOtp.toLowerCase().includes('otp'), 'login OTP toggle copy missing');

console.log('Password login and OTP auth contract checks passed.');
