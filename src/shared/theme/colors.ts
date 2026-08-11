/**
 * Amico color tokens — shared surface system with mobile.
 * Page uses a subtle light-green canvas; cards stay pure white.
 */
export const colors = {
  // Brand
  primary: '#25D366',
  primaryHover: '#20BD5A',
  primaryDark: '#128C7E',

  // Surfaces
  /** App / page background */
  background: '#F3FAF6',
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

  // Text + status
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  muted: '#94A3B8',
  success: '#059669',
  danger: '#DC2626',
  warning: '#D97706',
} as const;

/** Dedicated dark theme — not inverted light. */
export const darkColors = {
  primary: '#25D366',
  primaryHover: '#20BD5A',
  primaryDark: '#34D399',
  background: '#111827',
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
  textPrimary: '#F9FAFB',
  textSecondary: '#D1D5DB',
  muted: '#9CA3AF',
  success: '#34D399',
  danger: '#F87171',
  warning: '#FBBF24',
} as const;
