/**
 * Shared Dashboard-aligned button sx helpers (presentation only).
 */
import type { SxProps, Theme } from '@mui/material';
import { DASHBOARD_UX } from '@/modules/dashboard/theme/dashboardUx';

export const dashOutlinedButtonSx: SxProps<Theme> = {
  minHeight: DASHBOARD_UX.buttonHeight,
  height: DASHBOARD_UX.buttonHeight,
  px: `${DASHBOARD_UX.buttonPx}px`,
  borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
  fontSize: DASHBOARD_UX.button.fontSize,
  fontWeight: DASHBOARD_UX.button.fontWeight,
  textTransform: 'none',
  boxShadow: 'none',
};

export const dashContainedButtonSx: SxProps<Theme> = {
  ...dashOutlinedButtonSx,
  minHeight: 40,
  height: 40,
};
