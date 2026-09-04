import { create } from 'zustand';
import { i18n } from '@/i18n';
import { mySpacesApi } from '@/shared/api/mySpacesApi';
import type { MySpaceResponse } from '@/shared/types/space';
import { STORAGE_KEYS } from '@/shared/constants/storageKeys';
import { readStorage, removeStorage, writeStorage } from '@/shared/utils/storage';

export interface SpaceStoreState {
  mySpaces: MySpaceResponse[];
  selectedSpaceId: string | null;
  loading: boolean;
  error: string | null;
  bootstrapped: boolean;
  loadMySpaces: () => Promise<MySpaceResponse[]>;
  /** Local selection only (no default API). Prefer `switchSpace` for user-initiated switches. */
  selectSpace: (spaceId: string) => void;
  /** Mirrors mobile: PUT /spaces/{id}/default then select. */
  switchSpace: (spaceId: string) => Promise<boolean>;
  /** Mirrors mobile: DELETE /spaces/{id} then refresh list. */
  deactivateSpace: (spaceId: string) => Promise<boolean>;
  clearSpaces: () => void;
}

function resolveInitialSpaceId(spaces: MySpaceResponse[]): string | null {
  if (spaces.length === 0) {
    return null;
  }
  const stored = readStorage(STORAGE_KEYS.selectedSpaceId);
  if (stored && spaces.some((space) => space.spaceId === stored)) {
    return stored;
  }
  const defaultSpace = spaces.find((space) => space.isDefault);
  return defaultSpace?.spaceId ?? null;
}

export const useSpaceStore = create<SpaceStoreState>((set, get) => ({
  mySpaces: [],
  selectedSpaceId: null,
  loading: false,
  error: null,
  bootstrapped: false,

  loadMySpaces: async () => {
    set({ loading: true, error: null });
    try {
      const spaces = await mySpacesApi.getMySpaces();
      const selectedSpaceId = resolveInitialSpaceId(spaces);
      if (selectedSpaceId) {
        writeStorage(STORAGE_KEYS.selectedSpaceId, selectedSpaceId);
      } else {
        removeStorage(STORAGE_KEYS.selectedSpaceId);
      }
      set({
        mySpaces: spaces,
        selectedSpaceId,
        loading: false,
        bootstrapped: true,
      });
      return spaces;
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : i18n.t('spaces.errors.loadSpaces');
      set({
        loading: false,
        error: message,
        bootstrapped: true,
        mySpaces: [],
        selectedSpaceId: null,
      });
      return [];
    }
  },

  selectSpace: (spaceId) => {
    writeStorage(STORAGE_KEYS.selectedSpaceId, spaceId);
    set({ selectedSpaceId: spaceId });
  },

  switchSpace: async (spaceId) => {
    try {
      await mySpacesApi.setDefaultSpace(spaceId);
      const spaces = get().mySpaces.map((space) => ({
        ...space,
        isDefault: space.spaceId === spaceId,
      }));
      writeStorage(STORAGE_KEYS.selectedSpaceId, spaceId);
      set({ mySpaces: spaces, selectedSpaceId: spaceId });
      return true;
    } catch {
      writeStorage(STORAGE_KEYS.selectedSpaceId, spaceId);
      set({ selectedSpaceId: spaceId });
      return false;
    }
  },

  deactivateSpace: async (spaceId) => {
    set({ loading: true, error: null });
    try {
      const { spaceApi } = await import('@/modules/onboarding/api/spaceApi');
      await spaceApi.deactivateSpace(spaceId);
      const spaces = await get().loadMySpaces();
      const nextId = spaces[0]?.spaceId ?? null;
      if (nextId) {
        writeStorage(STORAGE_KEYS.selectedSpaceId, nextId);
        set({ selectedSpaceId: nextId, loading: false });
      } else {
        removeStorage(STORAGE_KEYS.selectedSpaceId);
        set({ selectedSpaceId: null, loading: false });
      }
      return true;
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : i18n.t('spaces.errors.deactivate');
      set({ loading: false, error: message });
      return false;
    }
  },

  clearSpaces: () => {
    removeStorage(STORAGE_KEYS.selectedSpaceId);
    set({
      mySpaces: [],
      selectedSpaceId: null,
      loading: false,
      error: null,
      bootstrapped: false,
    });
  },
}));

export function getSelectedSpace(): MySpaceResponse | undefined {
  const { mySpaces, selectedSpaceId } = useSpaceStore.getState();
  return mySpaces.find((space) => space.spaceId === selectedSpaceId);
}
