/**
 * Dashboard presentation tokens — typography & contrast polish.
 * Layout sizes (padding, gaps, card heights) are frozen; do not change them
 * for readability work — adjust type/color only.
 */
export const DASH_LIGHT = {
  pageBg: '#F7F9F8',
  surface: '#FFFFFF',
  elevated: '#F8FAFC',
  border: '#E7EBF0',
  /** Primary readable text */
  textPrimary: '#0F172A',
  /** Metric labels + body descriptions */
  textSecondary: '#475569',
  /** Captions / secondary supporting text (never lighter than this for readable copy) */
  textMuted: '#64748B',
  shadow: '0 1px 2px rgba(15, 23, 42, 0.045)',
  shadowHover: '0 3px 8px rgba(15, 23, 42, 0.07)',
  pendingTint: '#FFFBEB',
  pendingBorder: 'rgba(245, 158, 11, 0.32)',
} as const;

export const DASH_DARK = {
  pageBg: '#0F172A',
  surface: '#111827',
  elevated: '#1F2937',
  border: '#27303C',
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  shadow: 'none',
  shadowHover: '0 0 0 1px #374151',
  pendingTint: 'rgba(217, 119, 6, 0.12)',
  pendingBorder: 'rgba(245, 158, 11, 0.35)',
} as const;

/** Frozen canvas for identical layout + scale-down on narrow screens. */
export const DASHBOARD_CANVAS_MIN_WIDTH = 1280;

export const DASHBOARD_UX = {
  contentMaxWidth: 1600,
  pagePadding: 18,
  sectionGap: 14,
  cardGap: 12,
  cardPadding: 16,
  sectionPadding: 16,
  metricPadding: 12,
  metricGap: 5,
  internalGap: 8,

  radius: 10,
  tileRadius: 8,
  buttonRadius: 8,

  iconWell: 26,
  iconWellRadius: 7,
  iconSize: 14,
  badgeSize: 15,
  healthRingSize: 52,
  healthRingStroke: 5,

  /** Row 1 compact band (Overview · Meal today · Pending) — frozen */
  summaryCardMinHeight: 196,
  summaryCardMaxHeight: 212,
  summaryCardHeight: 204,

  /** Cell height inside 2×2 metric boards — frozen */
  paymentCardMinHeight: 90,
  paymentCardMaxHeight: 108,
  paymentCardHeight: 98,

  propertyCardMinHeight: 90,
  propertyCardMaxHeight: 108,
  propertyCardHeight: 98,

  mealCardMinHeight: 72,
  mealCardMaxHeight: 84,

  quickActionMinWidth: 116,
  quickActionMinHeight: 108,
  quickActionMaxHeight: 118,
  quickActionHeight: 112,

  pendingItemHeight: 48,
  pendingItemMaxHeight: 52,

  headerHeight: 56,
  navSidebarWidth: 240,
  navRowHeight: 36,
  pendingPanelWidth: 300,

  buttonHeight: 32,
  buttonPx: 12,
  buttonPy: 6,

  /**
   * Typography scale (FINAL readability polish)
   * 1 Greeting → 2 Section titles → 3 Metric values → 4 Card titles → 5 Labels → 6 Body → 7 Captions
   */
  /** Dashboard greeting — 26/700/34 */
  pageTitle: { fontSize: '1.625rem', fontWeight: 700, lineHeight: '2.125rem' },
  greeting: { fontSize: '1.625rem', fontWeight: 700, lineHeight: '2.125rem' },
  /** Space name — 18/600 */
  spaceName: { fontSize: '1.125rem', fontWeight: 600, lineHeight: '1.5rem' },
  /** Space role — 13/500 */
  spaceRole: { fontSize: '0.8125rem', fontWeight: 500, lineHeight: '1.125rem' },
  greetingSub: { fontSize: '0.75rem', fontWeight: 400, lineHeight: '1.125rem' },
  /** Section titles — 18/700/26 */
  sectionHeading: { fontSize: '1.125rem', fontWeight: 700, lineHeight: '1.625rem' },
  /** Captions / “This month” — 12/400/18 */
  sectionSubtitle: { fontSize: '0.75rem', fontWeight: 400, lineHeight: '1.125rem' },
  /** Card titles — 15/600/22 */
  cardTitle: { fontSize: '0.9375rem', fontWeight: 600, lineHeight: '1.375rem' },
  compactTitle: { fontSize: '0.9375rem', fontWeight: 600, lineHeight: '1.375rem' },
  /** Body / descriptions — 12/400/18 */
  body: { fontSize: '0.75rem', fontWeight: 400, lineHeight: '1.125rem' },
  cardSubtitle: { fontSize: '0.75rem', fontWeight: 400, lineHeight: '1.125rem' },
  /** Metric labels — 13/500/18 */
  metricLabel: { fontSize: '0.8125rem', fontWeight: 500, lineHeight: '1.125rem' },
  caption: { fontSize: '0.8125rem', fontWeight: 500, lineHeight: '1.125rem' },
  smallCaption: { fontSize: '0.75rem', fontWeight: 400, lineHeight: '1.125rem' },
  smallLabel: { fontSize: '0.8125rem', fontWeight: 500, lineHeight: '1.125rem' },
  metricCaption: { fontSize: '0.75rem', fontWeight: 400, lineHeight: '1.125rem' },
  /** Metric values — 26/700/34 */
  largeNumber: {
    fontSize: '1.625rem',
    fontWeight: 700,
    lineHeight: '2.125rem',
    fontVariantNumeric: 'tabular-nums' as const,
  },
  metricValueByBp: {
    xs: '1.625rem',
    md: '1.625rem',
    lg: '1.625rem',
    xl: '1.625rem',
  },
  /** Meal header counters — value 18/700, label 12/500 */
  counterValue: {
    fontSize: '1.125rem',
    fontWeight: 700,
    lineHeight: '1.375rem',
    fontVariantNumeric: 'tabular-nums' as const,
  },
  counterLabel: { fontSize: '0.75rem', fontWeight: 500, lineHeight: '1.125rem' },
  /** Action links — 12/600 */
  link: { fontSize: '0.75rem', fontWeight: 600, lineHeight: '1.125rem' },
  /** Buttons — 13/600 */
  button: { fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.2 },
  /** Badges — 10/600 */
  badge: { fontSize: '0.625rem', fontWeight: 600, lineHeight: 1 },
  /** Sidebar — nav 14/500, section 12/600 uppercase, account 14/600 */
  sidebar: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.3 },
  sidebarAccount: { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.3 },
  sidebarSection: {
    fontSize: '0.75rem',
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
