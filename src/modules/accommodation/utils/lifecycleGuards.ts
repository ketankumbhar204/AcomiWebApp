import type { AccommodationStatus } from '@/shared/types/accommodation';

/** Occupied / reserved entities must not offer deactivate or delete (mobile UX). */
export function occupancyBlocksLifecycle(
  status?: AccommodationStatus | string | null,
): boolean {
  return status === 'OCCUPIED' || status === 'RESERVED';
}

export function occupancyLifecycleBlockReason(
  deleteReason: string | null | undefined,
  fallback: string,
): string {
  return deleteReason?.trim() || fallback;
}
