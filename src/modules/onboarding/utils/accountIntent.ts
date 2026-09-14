import { STORAGE_KEYS, type AccountIntent } from '@/shared/constants/storageKeys';
import { readStorage, removeStorage, writeStorage } from '@/shared/utils/storage';

export function getAccountIntent(): AccountIntent | null {
  const value = readStorage(STORAGE_KEYS.accountIntent);
  return value === 'member' || value === 'owner' ? value : null;
}

export function setAccountIntent(intent: AccountIntent): void {
  writeStorage(STORAGE_KEYS.accountIntent, intent);
}

export function clearAccountIntent(): void {
  removeStorage(STORAGE_KEYS.accountIntent);
}
