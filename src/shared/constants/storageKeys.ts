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
  /** Last onboarding choice: member vs owner (session UX only, not account role). */
  accountIntent: 'acomi.onboarding.accountIntent',
} as const;

export type AccountIntent = 'member' | 'owner';
