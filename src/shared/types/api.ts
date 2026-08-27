/**
 * Shared API envelope types — aligned with Spring `ApiResponse` / mobile `src/api/types.ts`.
 */

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  errorCode?: string;
  data?: T;
  timestamp?: string;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface ListQueryParams {
  query?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface ApiErrorBody {
  success?: boolean;
  message?: string;
  error?: string;
  errorCode?: string;
  data?: Record<string, string | number> | null;
  status?: number;
  timestamp?: string;
  path?: string;
}
