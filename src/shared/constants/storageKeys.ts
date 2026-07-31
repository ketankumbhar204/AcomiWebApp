/** localStorage keys — keep stable across releases. */
export const STORAGE_KEYS = {
  /** Aligns with mobile session concept (`@countin/access_token`). */
  authToken: 'countin.auth.token',
  authUser: 'countin.auth.user',
  selectedSpaceId: 'countin.space.selectedId',
  themeMode: 'countin.ui.themeMode',
  sidebarCollapsed: 'countin.ui.sidebarCollapsed',
  /** Aligns with mobile `@countin/language`. */
  appLanguage: 'countin.ui.language',
} as const;
