import { ROUTES } from '@/routes/paths';

/**
 * Account landing after leaving a space.
 * `/` is not used: it can send the user straight back into the open space.
 */
export function accountHomePath(hasSpaces: boolean): string {
  return hasSpaces ? ROUTES.mySpaces : ROUTES.memberHome;
}

export function isSpaceDashboardPath(pathname: string): boolean {
  return /^\/spaces\/[^/]+(?:\/|$)/.test(pathname);
}
