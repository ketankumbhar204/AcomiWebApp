import { create } from 'zustand';
import { configureAuthTokenPort } from '@/shared/api/client';
import { authApi } from '@/modules/auth/api/authApi';
import { STORAGE_KEYS } from '@/shared/constants/storageKeys';
import type { AuthSessionState, UserResponse, UUID } from '@/shared/types/auth';
import { readStorage, removeStorage, writeStorage } from '@/shared/utils/storage';
import { syncAdminModeForUser, useAdminStore } from './adminStore';

function readStoredUser(): UserResponse | null {
  const raw = readStorage(STORAGE_KEYS.authUser);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as UserResponse;
  } catch {
    return null;
  }
}

function persistUser(user: UserResponse | null): void {
  if (!user) {
    removeStorage(STORAGE_KEYS.authUser);
    return;
  }
  writeStorage(STORAGE_KEYS.authUser, JSON.stringify(user));
}

export interface AuthStoreState extends AuthSessionState {
  setSession: (user: UserResponse, accessToken: string) => void;
  updateUser: (user: UserResponse) => void;
  /** Re-fetch profile via GET /auth/me (not a JWT refresh — backend has no refresh token). */
  refreshUser: () => Promise<UserResponse | null>;
  clearSession: () => void;
  bootstrap: () => Promise<void>;
}

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  accessToken: null,
  user: null,
  userId: null,
  isAuthenticated: false,
  isBootstrapping: true,

  setSession: (user, accessToken) => {
    writeStorage(STORAGE_KEYS.authToken, accessToken);
    persistUser(user);
    syncAdminModeForUser(user.systemRole);
    set({
      accessToken,
      user,
      userId: user.id,
      isAuthenticated: true,
      isBootstrapping: false,
    });
  },

  updateUser: (user) => {
    persistUser(user);
    set({ user, userId: user.id });
  },

  refreshUser: async () => {
    const token = get().accessToken ?? readStorage(STORAGE_KEYS.authToken);
    if (!token) {
      return null;
    }
    try {
      const user = await authApi.getMe();
      persistUser(user);
      set({
        user,
        userId: user.id,
        accessToken: token,
        isAuthenticated: true,
      });
      return user;
    } catch {
      get().clearSession();
      return null;
    }
  },

  clearSession: () => {
    removeStorage(STORAGE_KEYS.authToken);
    removeStorage(STORAGE_KEYS.authUser);
    useAdminStore.getState().setAdminMode(false);
    set({
      accessToken: null,
      user: null,
      userId: null,
      isAuthenticated: false,
      isBootstrapping: false,
    });
  },

  bootstrap: async () => {
    const storedToken = readStorage(STORAGE_KEYS.authToken);
    if (!storedToken) {
      set({
        isBootstrapping: false,
        isAuthenticated: false,
        accessToken: null,
        user: null,
        userId: null,
      });
      return;
    }

    // Make token available to Axios before calling /auth/me
    set({ accessToken: storedToken });

    try {
      const user = await authApi.getMe();
      const storedUser = readStoredUser();
      const merged: UserResponse =
        storedUser && storedUser.id === user.id ? { ...storedUser, ...user } : user;

      persistUser(merged);
      syncAdminModeForUser(merged.systemRole);
      set({
        isBootstrapping: false,
        isAuthenticated: true,
        accessToken: storedToken,
        user: merged,
        userId: merged.id as UUID,
      });
    } catch {
      removeStorage(STORAGE_KEYS.authToken);
      removeStorage(STORAGE_KEYS.authUser);
      set({
        isBootstrapping: false,
        isAuthenticated: false,
        accessToken: null,
        user: null,
        userId: null,
      });
    }
  },
}));

configureAuthTokenPort({
  getToken: () => useAuthStore.getState().accessToken,
  setToken: (token) => {
    if (token === null) {
      useAuthStore.getState().clearSession();
      return;
    }
    writeStorage(STORAGE_KEYS.authToken, token);
    useAuthStore.setState({ accessToken: token, isAuthenticated: true });
  },
});
