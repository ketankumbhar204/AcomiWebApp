/** localStorage keys — keep stable across releases. */
export const STORAGE_KEYS = {
  /** Aligns with mobile session concept (`@acomi/access_token`). */
  authToken: 'acomi.auth.token',
  authUser: 'acomi.auth.user',
  selectedSpaceId: 'acomi.space.selectedId',
  themeMode: 'acomi.ui.themeMode',
  sidebarCollapsed: 'acomi.ui.sidebarCollapsed',
  /** Aligns with mobile `@acomi/language`. */
  appLanguage: 'acomi.ui.language',
  adminMode: 'acomi.admin.mode',
} as const;
