/** In-app path after login/register. Rejects open redirects. */
export function safeReturnPath(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) {
    return null;
  }
  const pathOnly = trimmed.split('?')[0] ?? trimmed;
  if (
    pathOnly === '/login' ||
    pathOnly.startsWith('/login/') ||
    pathOnly === '/register' ||
    pathOnly.startsWith('/register/') ||
    pathOnly === '/admin/login' ||
    pathOnly.startsWith('/admin/login/')
  ) {
    return null;
  }
  return trimmed;
}

export function returnPathFromLocation(location: {
  search: string;
  state: unknown;
}): string | null {
  const fromState = (location.state as { from?: string } | null)?.from;
  const nextQuery = new URLSearchParams(location.search).get('next');
  return safeReturnPath(fromState) ?? safeReturnPath(nextQuery);
}
