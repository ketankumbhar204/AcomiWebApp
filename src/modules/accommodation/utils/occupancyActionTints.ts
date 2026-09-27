import { colors } from '@/shared/theme/colors';

export type OccupancyActionTint = {
  bg: string;
  border: string;
  fg: string;
};

/** Shared pastel tints for occupancy stay-action buttons (matches mobile). */
export const occupancyActionTint = {
  transfer: { bg: '#EEF4FF', border: '#D0E0F8', fg: '#1D4ED8' },
  vacate: { bg: colors.errorTint, border: '#FECACA', fg: colors.danger },
  viewHistory: { bg: '#E8F8EF', border: '#C6EBD7', fg: '#047857' },
  allocate: { bg: '#ECFBF3', border: '#BFE8D4', fg: '#059669' },
  reserve: { bg: '#F4F0FF', border: '#DDD6FE', fg: '#6D28D9' },
  moveIn: { bg: '#ECFBF3', border: '#BFE8D4', fg: '#059669' },
  cancel: { bg: colors.errorTint, border: '#FECACA', fg: colors.danger },
} as const satisfies Record<string, OccupancyActionTint>;

export function occupancyActionButtonSx(tint: OccupancyActionTint) {
  return {
    textTransform: 'none' as const,
    fontWeight: 700,
    bgcolor: tint.bg,
    color: tint.fg,
    border: `1px solid ${tint.border}`,
    boxShadow: 'none',
    '&:hover': {
      bgcolor: tint.bg,
      color: tint.fg,
      borderColor: tint.border,
      filter: 'brightness(0.97)',
      boxShadow: 'none',
    },
  };
}
