/**
 * ACOMI semantic color tokens — shared language with mobile.
 *
 * Hierarchy (WhatsApp-inspired, not a WhatsApp clone):
 *   primary  #25D366  — CTAs, selected chrome, WhatsApp-adjacent actions
 *   teal     #128C7E  — brand chrome, links, secondary emphasis
 *   tealDark #075E54  — header/mark accents only (not every button)
 *
 * Semantic occupancy / payment / meal colors stay distinct — do not
 * recast the whole product as a single green.
 */

export const colors = {
  // Brand
  primary: '#25D366',
  primaryHover: '#20BD5A',
  primaryActive: '#1AAE50',
  teal: '#128C7E',
  tealDark: '#075E54',
  /** Alias of teal — existing call sites. */
  primaryDark: '#128C7E',

  // Surfaces
  /** App / page background */
  background: '#F3FAF6',
  /** Subtle mint wells */
  mintSubtle: '#EAF8F2',
  /** Secondary surface */
  surfaceSecondary: '#EDF8F2',
  /** Section background */
  section: '#EAF7F0',
  /** Card / elevated card */
  surface: '#FFFFFF',
  white: '#FFFFFF',
  /** Hover surface */
  hover: '#F0FAF4',
  /** Selected surface */
  selected: '#E2F7EC',

  // Borders / dividers
  border: '#DCEFE3',
  divider: '#E6F2EA',

  // Semantic tints
  lightGreen: '#E8F8EF',
  successTint: '#E8F8EF',
  warningTint: '#FFF8E8',
  errorTint: '#FFF0F0',
  infoTint: '#EFF6FF',

  // Text + status
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  muted: '#94A3B8',
  success: '#059669',
  danger: '#DC2626',
  warning: '#D97706',
  info: '#2563EB',
} as const;

/** Dedicated dark theme — not inverted light. Primary CTA stays recognizable. */
export const darkColors = {
  primary: '#25D366',
  primaryHover: '#20BD5A',
  primaryActive: '#1AAE50',
  teal: '#2DD4BF',
  tealDark: '#115E59',
  primaryDark: '#2DD4BF',
  background: '#111827',
  mintSubtle: '#0B241C',
  surfaceSecondary: '#1A2332',
  section: '#1F2937',
  surface: '#1F2937',
  white: '#1F2937',
  hover: '#243044',
  selected: '#064E3B',
  border: '#374151',
  divider: '#27303C',
  lightGreen: '#064E3B',
  successTint: 'rgba(52, 211, 153, 0.12)',
  warningTint: 'rgba(217, 119, 6, 0.12)',
  errorTint: 'rgba(248, 113, 113, 0.12)',
  infoTint: 'rgba(147, 197, 253, 0.12)',
  textPrimary: '#F9FAFB',
  textSecondary: '#D1D5DB',
  muted: '#9CA3AF',
  success: '#34D399',
  danger: '#F87171',
  warning: '#FBBF24',
  info: '#93C5FD',
} as const;

export type AcomiColorTokens = typeof colors;

/** Space-type identity — semantic hues, not brand green. */
export const spaceTypePalette = {
  PG: { accent: colors.teal, tint: '#E7F7F1', selectedTint: '#D4F0E6' },
  MESS: { accent: '#C2410C', tint: '#FFF4E5', selectedTint: '#FFE8C8' },
  HOSTEL: { accent: '#7C3AED', tint: '#F3E8FF', selectedTint: '#E9D5FF' },
  CO_LIVING: { accent: '#4F46E5', tint: '#EEF2FF', selectedTint: '#E0E7FF' },
  RENTAL: { accent: '#0284C7', tint: '#E8F4FF', selectedTint: '#D6ECFC' },
} as const;

/** Occupancy / accommodation status — keep statuses distinguishable. */
export const occupancyColors = {
  vacant: '#10B981',
  partial: '#3B82F6',
  full: '#F59E0B',
  empty: '#94A3B8',
  reserved: '#D97706',
} as const;

export function acomiCssVars(c: AcomiColorTokens | typeof darkColors): Record<string, string> {
  return {
    '--acomi-primary': c.primary,
    '--acomi-primary-hover': c.primaryHover,
    '--acomi-primary-active': c.primaryActive,
    '--acomi-teal': c.teal,
    '--acomi-teal-dark': c.tealDark,
    '--acomi-mint': c.lightGreen,
    '--acomi-page': c.background,
    '--acomi-selected': c.selected,
    '--acomi-surface': c.surface,
  };
}
