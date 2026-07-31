import { create } from 'zustand';
import { STORAGE_KEYS } from '@/shared/constants/storageKeys';
import type { ThemeMode } from '@/shared/types/common';
import { readStorage, writeStorage } from '@/shared/utils/storage';

function readInitialThemeMode(): ThemeMode {
  const stored = readStorage(STORAGE_KEYS.themeMode);
  return stored === 'dark' ? 'dark' : 'light';
}

function readSidebarCollapsed(): boolean {
  return readStorage(STORAGE_KEYS.sidebarCollapsed) === '1';
}

export interface AppStoreState {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
}

/**
 * Root Zustand store — UI shell only.
 * Feature stores must not be added here; create module stores when modules land.
 */
export const useAppStore = create<AppStoreState>((set, get) => ({
  themeMode: readInitialThemeMode(),
  setThemeMode: (mode) => {
    writeStorage(STORAGE_KEYS.themeMode, mode);
    set({ themeMode: mode });
  },
  toggleThemeMode: () => {
    const next: ThemeMode = get().themeMode === 'light' ? 'dark' : 'light';
    writeStorage(STORAGE_KEYS.themeMode, next);
    set({ themeMode: next });
  },
  sidebarCollapsed: readSidebarCollapsed(),
  setSidebarCollapsed: (collapsed) => {
    writeStorage(STORAGE_KEYS.sidebarCollapsed, collapsed ? '1' : '0');
    set({ sidebarCollapsed: collapsed });
  },
  toggleSidebarCollapsed: () => {
    const next = !get().sidebarCollapsed;
    writeStorage(STORAGE_KEYS.sidebarCollapsed, next ? '1' : '0');
    set({ sidebarCollapsed: next });
  },
  mobileNavOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
}));
