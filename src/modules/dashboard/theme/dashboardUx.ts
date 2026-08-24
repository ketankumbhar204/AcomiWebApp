/**
 * Dashboard presentation tokens — typography & contrast polish.
 * Layout sizes (padding, gaps, card heights) are frozen; do not change them
 * for readability work — adjust type/color only.
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

/** Frozen canvas for identical layout + scale-down on narrow screens. */
export const DASHBOARD_CANVAS_MIN_WIDTH = 1200;

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

  /** Row 1 compact band (Overview · Meal today · Pending) */
  summaryCardMinHeight: 220,
  summaryCardMaxHeight: 236,
  summaryCardHeight: 228,

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
   * Typography scale (desktop SaaS — Dashboard SoT)
   * 28 page/metrics → 20 sections → 16 card titles → 15 inputs → 14 body/labels/links → 12 badges
   * Floor: 14px for readable content; 11–12px only for compact badges; never ≤10px for content.
   * Line heights ≈ 1.4–1.5.
   */
  /** Page title / greeting / key metrics — 28/700 */
  pageTitle: { fontSize: '1.75rem', fontWeight: 700, lineHeight: '2.25rem' },
  greeting: { fontSize: '1.75rem', fontWeight: 700, lineHeight: '2.25rem' },
  /** Space name — 20/600 */
  spaceName: { fontSize: '1.25rem', fontWeight: 600, lineHeight: '1.75rem' },
  /** Space role / breadcrumb — 14/500 */
  spaceRole: { fontSize: '0.875rem', fontWeight: 500, lineHeight: '1.25rem' },
  breadcrumb: { fontSize: '0.875rem', fontWeight: 500, lineHeight: '1.25rem' },
  /** Page subtitle — 14/400 */
  greetingSub: { fontSize: '0.875rem', fontWeight: 400, lineHeight: '1.25rem' },
  /** Section titles (day heading, panel title) — 20/700 */
  sectionHeading: { fontSize: '1.25rem', fontWeight: 700, lineHeight: '1.75rem' },
  /** Section subtitles — 14/400 */
  sectionSubtitle: { fontSize: '0.875rem', fontWeight: 400, lineHeight: '1.25rem' },
  /** Card titles / meal names — 16/600 */
  cardTitle: { fontSize: '1rem', fontWeight: 600, lineHeight: '1.5rem' },
  compactTitle: { fontSize: '1rem', fontWeight: 600, lineHeight: '1.5rem' },
  /** Body / descriptions — 14/400 */
  body: { fontSize: '0.875rem', fontWeight: 400, lineHeight: '1.25rem' },
  cardSubtitle: { fontSize: '0.875rem', fontWeight: 400, lineHeight: '1.25rem' },
  /** Metric / form labels — 14/500 */
  metricLabel: { fontSize: '0.875rem', fontWeight: 500, lineHeight: '1.25rem' },
  caption: { fontSize: '0.875rem', fontWeight: 500, lineHeight: '1.25rem' },
  inputLabel: { fontSize: '0.875rem', fontWeight: 500, lineHeight: '1.25rem' },
  /** Primary input text — 15/400 */
  inputText: { fontSize: '0.9375rem', fontWeight: 400, lineHeight: '1.375rem' },
  /** Helper caption — 12/400 (non-body only) */
  smallCaption: { fontSize: '0.75rem', fontWeight: 400, lineHeight: '1.125rem' },
  smallLabel: { fontSize: '0.875rem', fontWeight: 500, lineHeight: '1.25rem' },
  metricCaption: { fontSize: '0.875rem', fontWeight: 400, lineHeight: '1.25rem' },
  /** Metric values — 28/700 */
  largeNumber: {
    fontSize: '1.75rem',
    fontWeight: 700,
    lineHeight: '2.25rem',
    fontVariantNumeric: 'tabular-nums' as const,
  },
  metricValueByBp: {
    xs: '1.75rem',
    md: '1.75rem',
    lg: '1.75rem',
    xl: '1.75rem',
  },
  /** Compact counters — 20/700 + 14/500 */
  counterValue: {
    fontSize: '1.25rem',
    fontWeight: 700,
    lineHeight: '1.75rem',
    fontVariantNumeric: 'tabular-nums' as const,
  },
  counterLabel: { fontSize: '0.875rem', fontWeight: 500, lineHeight: '1.25rem' },
  /** Action links / nav pills — 14/600 */
  link: { fontSize: '0.875rem', fontWeight: 600, lineHeight: '1.25rem' },
  /** Buttons — 14/600 */
  button: { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.2 },
  /** Badges — 12/600 (11–12px only; never for body) */
  badge: { fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.2 },
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
