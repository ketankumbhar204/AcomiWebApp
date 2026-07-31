/**
 * CountIn color tokens — sourced from mobile + approved web dashboard mock.
 */
export const colors = {
  primary: '#25D366',
  primaryHover: '#20BD5A',
  primaryDark: '#128C7E',
  background: '#F5FCF8',
  lightGreen: '#D1FAE5',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  border: '#E7EBF0',
  white: '#FFFFFF',
  success: '#059669',
  muted: '#94A3B8',
  surface: '#FFFFFF',
  danger: '#DC2626',
  warning: '#D97706',
} as const;

/** Dedicated dark theme — not inverted light. */
export const darkColors = {
  primary: '#25D366',
  primaryHover: '#20BD5A',
  primaryDark: '#34D399',
  background: '#111827',
  lightGreen: '#064E3B',
  textPrimary: '#F9FAFB',
  textSecondary: '#D1D5DB',
  border: '#374151',
  white: '#1F2937',
  success: '#34D399',
  muted: '#9CA3AF',
  surface: '#1F2937',
  danger: '#F87171',
  warning: '#FBBF24',
} as const;
