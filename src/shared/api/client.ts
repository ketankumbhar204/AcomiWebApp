import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { env } from '@/shared/config/env';
import type { ApiErrorBody } from '@/shared/types/api';
import type { AuthTokenPort } from '@/shared/types/auth';
import { ApiError } from './errors';

const LOG_TAG = '[Acomi API]';

let tokenPort: AuthTokenPort = {
  getToken: () => null,
  setToken: () => undefined,
};

/** Wire the auth token port once the auth store is ready (foundation default is no-op). */
export function configureAuthTokenPort(port: AuthTokenPort): void {
  tokenPort = port;
}

export function setAuthToken(token: string | null): void {
  tokenPort.setToken(token);
}

export function getAuthToken(): string | null {
  return tokenPort.getToken();
}

function logRequest(config: InternalAxiosRequestConfig): void {
  if (!env.isDevelopment) {
    return;
  }

  const method = config.method?.toUpperCase() ?? 'GET';
  const url = `${config.baseURL ?? ''}${config.url ?? ''}`;
  console.log(`${LOG_TAG} → ${method} ${url}`);
}

function logResponse(status: number, method: string | undefined, url: string | undefined): void {
  if (!env.isDevelopment) {
    return;
  }
  console.log(`${LOG_TAG} ← ${status} ${method?.toUpperCase() ?? 'GET'} ${url ?? ''}`);
}

function normalizeApiError(error: AxiosError<ApiErrorBody>): ApiError {
  if (!error.response) {
    return new ApiError(
      'Network error. Please check your connection and try again.',
      0,
      undefined,
      true,
    );
  }

  const { status, data } = error.response;
  const message =
    data?.message ?? data?.error ?? error.message ?? 'An unexpected error occurred.';

  return new ApiError(message, status, data);
}

const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeoutMs,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    logRequest(config);
    const token = tokenPort.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => {
    logResponse(
      response.status,
      response.config.method,
      `${response.config.baseURL ?? ''}${response.config.url ?? ''}`,
    );
    return response;
  },
  (error: AxiosError<ApiErrorBody>) => {
    const apiError = normalizeApiError(error);

    if (apiError.status === 401) {
      const requestUrl = error.config?.url ?? '';
      const isPublicAuth =
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/login-with-otp') ||
        requestUrl.includes('/auth/register') ||
        requestUrl.includes('/auth/send-otp') ||
        requestUrl.includes('/auth/verify-otp') ||
        requestUrl.includes('/auth/reset-password') ||
        requestUrl.includes('/auth/account-deletion');

      tokenPort.setToken(null);

      if (!isPublicAuth && typeof window !== 'undefined') {
        const path = window.location.pathname;
        if (
          path !== '/login' &&
          path !== '/register' &&
          path !== '/register/otp' &&
          path !== '/login/otp' &&
          path !== '/forgot-password' &&
          path !== '/forgot-password/otp' &&
          path !== '/reset-password' &&
          path !== '/register/password' &&
          path !== '/otp' &&
          path !== '/unauthorized' &&
          path !== '/delete-account' &&
          path !== '/delete-account/otp' &&
          path !== '/privacy'
        ) {
          window.location.assign('/unauthorized');
        }
      }
    }

    return Promise.reject(apiError);
  },
);

export default apiClient;
