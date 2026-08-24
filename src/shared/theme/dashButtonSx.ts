/**
 * Shared Dashboard-aligned button sx helpers (presentation only).
 */
import type { SxProps, Theme } from '@mui/material';
import { DASHBOARD_UX } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';

export const dashOutlinedButtonSx: SxProps<Theme> = {
  ...DASHBOARD_UX.button,
  minHeight: DASHBOARD_UX.buttonHeight,
  height: DASHBOARD_UX.buttonHeight,
  px: `${DASHBOARD_UX.buttonPx}px`,
  borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
  textTransform: 'none',
  boxShadow: 'none',
};

export const dashContainedButtonSx: SxProps<Theme> = {
  ...dashOutlinedButtonSx,
  minHeight: 40,
  height: 40,
  '&.MuiButton-containedPrimary': {
    bgcolor: colors.primary,
    color: colors.white,
    '&:hover': { bgcolor: colors.primaryHover },
    '&:active': { bgcolor: colors.primaryActive },
  },
};
