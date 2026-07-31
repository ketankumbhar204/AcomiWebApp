import type { ApiErrorBody } from '@/shared/types/api';

export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody | undefined;
  readonly isNetworkError: boolean;
  readonly errorCode: string | undefined;

  constructor(
    message: string,
    status: number,
    body?: ApiErrorBody,
    isNetworkError = false,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    this.isNetworkError = isNetworkError;
    this.errorCode = body?.errorCode;
  }
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
