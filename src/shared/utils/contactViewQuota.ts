export type ContactViewQuota = {
  viewHereDailyLimit?: number;
  viewHereRemainingToday?: number;
};

/** Instant listing contact is allowed only when this channel still has view quota. */
export function canViewContactDirectly(quota: ContactViewQuota | null | undefined): boolean {
  return (quota?.viewHereDailyLimit ?? 0) > 0 && (quota?.viewHereRemainingToday ?? 0) > 0;
}

export function directContactDecision(
  quota: ContactViewQuota | null | undefined,
): 'reveal' | 'exhausted' | 'disabled' {
  const limit = quota?.viewHereDailyLimit ?? 0;
  const remaining = quota?.viewHereRemainingToday ?? 0;
  if (limit > 0 && remaining > 0) return 'reveal';
  if (limit > 0) return 'exhausted';
  return 'disabled';
}
