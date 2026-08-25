import { Chip, useTheme } from '@mui/material';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';

type SpaceNameChipProps = {
  name: string;
};

/** Compact space-name indicator for all-spaces directory rows. */
export function SpaceNameChip({ name }: SpaceNameChipProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Chip
      size="small"
      label={name}
      variant="outlined"
      sx={{
        height: 22,
        maxWidth: 180,
        borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
        ...DASHBOARD_UX.badge,
        bgcolor: `${colors.primaryDark}14`,
        color: s.textPrimary,
        borderColor: `${colors.primaryDark}55`,
        '& .MuiChip-label': {
          px: 0.75,
          color: colors.primaryDark,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        },
      }}
    />
  );
}
