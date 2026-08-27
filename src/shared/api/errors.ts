import type { ApiErrorBody } from '@/shared/types/api';

export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody | undefined;
  readonly isNetworkError: boolean;
  readonly errorCode: string | undefined;
  /** Seconds the caller must wait, sent by the API on throttled (429) responses. */
  readonly retryAfterSeconds: number | undefined;

  constructor(
    message: string,
    status: number,
    body?: ApiErrorBody,
    isNetworkError = false,
    retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    this.isNetworkError = isNetworkError;
    this.errorCode = body?.errorCode;
    this.retryAfterSeconds = retryAfterSeconds ?? parseRetryAfter(body?.data?.retryAfterSeconds);
  }
}

export function parseRetryAfter(value: unknown): number | undefined {
  const seconds = typeof value === 'string' ? Number(value) : value;
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) {
    return undefined;
  }
  return Math.ceil(seconds);
}

export function getErrorMessage(error: unknown, fallback = 'An unexpected error occurred.'): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
