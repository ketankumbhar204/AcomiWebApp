/**
 * Dashboard presentation tokens — denser ops canvas.
 * Type and spacing stay in this file so dashboard + shared chrome stay aligned.
 */
export const DASH_LIGHT = {
  pageBg: '#F5F7FA',
  surface: '#FFFFFF',
  /** Secondary / section fills — cool gray, not mint */
  elevated: '#F8FAFC',
  section: '#F1F5F9',
  hover: '#F8FAFC',
  selected: '#E2F7EC',
  border: '#E2E8F0',
  divider: '#E8EEF2',
  /** Primary readable text */
  textPrimary: '#0F172A',
  /** Metric labels + body descriptions */
  textSecondary: '#475569',
  /** Captions / secondary supporting text (never lighter than this for readable copy) */
  textMuted: '#64748B',
  shadow: '0 2px 10px rgba(16, 24, 40, 0.05)',
  shadowHover: '0 4px 14px rgba(16, 24, 40, 0.08)',
  pendingTint: '#FFF8E8',
  pendingBorder: 'rgba(245, 158, 11, 0.32)',
  successTint: '#E8F8EF',
  warningTint: '#FFF8E8',
  errorTint: '#FFF0F0',
} as const;

export const DASH_DARK = {
  pageBg: '#0F172A',
  surface: '#111827',
  elevated: '#1F2937',
  section: '#1A2332',
  hover: '#243044',
  selected: '#064E3B',
  border: '#27303C',
  divider: '#1F2937',
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  shadow: 'none',
  shadowHover: '0 0 0 1px #374151',
  pendingTint: 'rgba(217, 119, 6, 0.12)',
  pendingBorder: 'rgba(245, 158, 11, 0.35)',
  successTint: 'rgba(52, 211, 153, 0.12)',
  warningTint: 'rgba(217, 119, 6, 0.12)',
  errorTint: 'rgba(248, 113, 113, 0.12)',
} as const;

/** Unused — previously the ScaleShell frozen-canvas width. Kept so imports compile. */
export const DASHBOARD_CANVAS_MIN_WIDTH = 1280;

export const DASHBOARD_UX = {
  contentMaxWidth: 1480,
  pagePadding: 14,
  sectionGap: 10,
  cardGap: 10,
  cardPadding: 12,
  sectionPadding: 12,
  metricPadding: 10,
  metricGap: 4,
  internalGap: 6,

  radius: 10,
  tileRadius: 8,
  buttonRadius: 8,

  iconWell: 24,
  iconWellRadius: 7,
  iconSize: 14,
  badgeSize: 14,
  healthRingSize: 46,
  healthRingStroke: 5,

  /** Row 1 compact band (Overview · Meal today · Pending) */
  summaryCardMinHeight: 196,
  summaryCardMaxHeight: 212,
  summaryCardHeight: 204,

  /** Cell height inside 2×2 metric boards */
  paymentCardMinHeight: 78,
  paymentCardMaxHeight: 92,
  paymentCardHeight: 86,

  propertyCardMinHeight: 78,
  propertyCardMaxHeight: 92,
  propertyCardHeight: 86,

  mealCardMinHeight: 64,
  mealCardMaxHeight: 76,

  quickActionMinWidth: 108,
  quickActionMinHeight: 96,
  quickActionMaxHeight: 108,
  quickActionHeight: 100,

  pendingItemHeight: 44,
  pendingItemMaxHeight: 48,

  headerHeight: 52,
  navSidebarWidth: 240,
  navRowHeight: 34,
  pendingPanelWidth: 280,

  buttonHeight: 30,
  buttonPx: 10,
  buttonPy: 5,

  /**
   * Typography scale (desktop SaaS)
   * 22 page/metrics → 16 sections → 15 card titles → 14 body → 12 captions
   */
  /** Page title / greeting / key metrics — 22/700 */
  pageTitle: { fontSize: '1.375rem', fontWeight: 700, lineHeight: '1.75rem' },
  greeting: { fontSize: '1.125rem', fontWeight: 600, lineHeight: '1.5rem' },
  /** Space name — 18/600 */
  spaceName: { fontSize: '1.125rem', fontWeight: 600, lineHeight: '1.5rem' },
  /** Space role / breadcrumb — 12/500 */
  spaceRole: { fontSize: '0.75rem', fontWeight: 500, lineHeight: '1.125rem' },
  breadcrumb: { fontSize: '0.8125rem', fontWeight: 500, lineHeight: '1.125rem' },
  /** Page subtitle — 13/400 */
  greetingSub: { fontSize: '0.8125rem', fontWeight: 400, lineHeight: '1.125rem' },
  /** Section titles — 16/700 */
  sectionHeading: { fontSize: '1rem', fontWeight: 700, lineHeight: '1.375rem' },
  /** Section subtitles — 13/400 */
  sectionSubtitle: { fontSize: '0.8125rem', fontWeight: 400, lineHeight: '1.125rem' },
  /** Card titles / meal names — 14/600 */
  cardTitle: { fontSize: '0.875rem', fontWeight: 600, lineHeight: '1.25rem' },
  compactTitle: { fontSize: '0.875rem', fontWeight: 600, lineHeight: '1.25rem' },
  /** Body / descriptions — 14/400 */
  body: { fontSize: '0.875rem', fontWeight: 400, lineHeight: '1.25rem' },
  cardSubtitle: { fontSize: '0.8125rem', fontWeight: 400, lineHeight: '1.125rem' },
  /** Metric / form labels — 12/500 */
  metricLabel: { fontSize: '0.75rem', fontWeight: 500, lineHeight: '1.125rem' },
  caption: { fontSize: '0.75rem', fontWeight: 500, lineHeight: '1.125rem' },
  inputLabel: { fontSize: '0.875rem', fontWeight: 500, lineHeight: '1.25rem' },
  /** Primary input text — 14/400 */
  inputText: { fontSize: '0.875rem', fontWeight: 400, lineHeight: '1.25rem' },
  /** Helper caption — 12/400 */
  smallCaption: { fontSize: '0.75rem', fontWeight: 400, lineHeight: '1.125rem' },
  smallLabel: { fontSize: '0.875rem', fontWeight: 500, lineHeight: '1.25rem' },
  metricCaption: { fontSize: '0.75rem', fontWeight: 400, lineHeight: '1.125rem' },
  /** Metric values — 22/700 */
  largeNumber: {
    fontSize: '1.375rem',
    fontWeight: 700,
    lineHeight: '1.75rem',
    fontVariantNumeric: 'tabular-nums' as const,
  },
  metricValueByBp: {
    xs: '1.25rem',
    md: '1.375rem',
    lg: '1.375rem',
    xl: '1.375rem',
  },
  /** Compact counters — 18/700 + 12/500 */
  counterValue: {
    fontSize: '1.125rem',
    fontWeight: 700,
    lineHeight: '1.5rem',
    fontVariantNumeric: 'tabular-nums' as const,
  },
  counterLabel: { fontSize: '0.75rem', fontWeight: 500, lineHeight: '1.125rem' },
  /** Action links / nav pills — 13/600 */
  link: { fontSize: '0.8125rem', fontWeight: 600, lineHeight: '1.125rem' },
  /** Buttons — 13/600 */
  button: { fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.2 },
  /** Badges — 11/600 */
  badge: { fontSize: '0.6875rem', fontWeight: 600, lineHeight: 1.2 },
  /** Sidebar — nav 13/500, section 11/600 uppercase, account 13/600 */
  sidebar: { fontSize: '0.8125rem', fontWeight: 500, lineHeight: 1.3 },
  sidebarAccount: { fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.3 },
  sidebarSection: {
    fontSize: '0.6875rem',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    lineHeight: 1.3,
  },
  transition: 'box-shadow 150ms ease, transform 100ms ease, background-color 150ms ease',
} as const;

export function dashSurfaces(mode: 'light' | 'dark') {
  return mode === 'dark' ? DASH_DARK : DASH_LIGHT;
}

export function metricValueSx() {
  return {
    ...DASHBOARD_UX.largeNumber,
  };
}
