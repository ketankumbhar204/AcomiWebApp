/** localStorage keys — keep stable across releases. */
export const STORAGE_KEYS = {
  /** Aligns with mobile session concept (`@amico/access_token`). */
  authToken: 'amico.auth.token',
  authUser: 'amico.auth.user',
  selectedSpaceId: 'amico.space.selectedId',
  themeMode: 'amico.ui.themeMode',
  sidebarCollapsed: 'amico.ui.sidebarCollapsed',
  /** Aligns with mobile `@amico/language`. */
  appLanguage: 'amico.ui.language',
} as const;
