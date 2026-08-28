import { create } from 'zustand';
import { STORAGE_KEYS } from '@/shared/constants/storageKeys';
import type { SystemRole } from '@/shared/types/admin';
import { readStorage, removeStorage, writeStorage } from '@/shared/utils/storage';

interface AdminState {
  adminMode: boolean;
  setAdminMode: (value: boolean) => void;
}

function readAdminMode(): boolean {
  return readStorage(STORAGE_KEYS.adminMode) === 'true';
}

export const useAdminStore = create<AdminState>((set) => ({
  adminMode: readAdminMode(),
  setAdminMode: (value: boolean) => {
    if (value) {
      writeStorage(STORAGE_KEYS.adminMode, 'true');
    } else {
      removeStorage(STORAGE_KEYS.adminMode);
    }
    set({ adminMode: value });
  },
}));

export function isPlatformAdmin(systemRole: SystemRole | string | null | undefined): boolean {
  return systemRole === 'ADMIN';
}

/** Route admins into admin app after normal login; operators stay in operator app. */
export function syncAdminModeForUser(
  systemRole: SystemRole | string | null | undefined,
): void {
  useAdminStore.getState().setAdminMode(isPlatformAdmin(systemRole));
}
