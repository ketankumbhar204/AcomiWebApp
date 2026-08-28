import type { RegistrationSource } from '@/shared/types/admin';

export function formatRegistrationSource(source: RegistrationSource): string {
  if (source === 'ADMIN') {
    return 'Added by Admin';
  }
  return 'Registered on website';
}

export function formatPropertyRegistrationSource(source: RegistrationSource): string {
  if (source === 'ADMIN') {
    return 'Added by Admin';
  }
  return 'Registered by Owner';
}

export function formatMessRegistrationSource(source: RegistrationSource): string {
  if (source === 'ADMIN') {
    return 'Added by Admin';
  }
  return 'Registered by Vendor';
}
