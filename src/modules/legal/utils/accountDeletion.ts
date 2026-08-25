import { ApiError } from '@/shared/api/errors';
import { i18n } from '@/i18n';

export function isVerificationTokenInvalidated(error: unknown): boolean {
  if (!(error instanceof ApiError)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes('verification token') ||
    message.includes('already been used') ||
    message.includes('verification is required')
  );
}

export function mapAccountDeletionError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isNetworkError || error.status === 0) {
      return i18n.t('common.errors.network');
    }
    if (isVerificationTokenInvalidated(error)) {
      return i18n.t('common.errors.registrationTokenExpired');
    }
    if (error.status === 401) {
      return i18n.t('common.errors.invalidCredentials');
    }
    if (error.status === 403) {
      return i18n.t('legal.deleteAccount.forbidden');
    }
    if (error.status >= 500) {
      return i18n.t('common.errors.server');
    }
    return error.message || i18n.t('legal.deleteAccount.failed');
  }
  return i18n.t('common.errors.generic');
}
