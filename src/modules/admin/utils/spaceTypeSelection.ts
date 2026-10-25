/** Split a reviewer override or a detected candidate list into space-type labels. */
export function typeSelection(committed: string, suggested: string): string[] {
  const source = committed.trim().length > 0 ? committed : suggested;
  return source
    .split(/\s*\|\s*/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function commitTypeSelection(selected: string[]): string | null {
  return selected.length > 0 ? selected.join(' | ') : null;
}
