import { Box, Checkbox, FormControlLabel, Typography, useTheme } from '@mui/material';
import { FlaskConical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, DASH_LIGHT, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';

type AdminTestLeadOptionProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function AdminTestLeadOption({ checked, onChange }: AdminTestLeadOptionProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        gridColumn: { md: '1 / -1' },
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.25,
        p: 1.5,
        borderRadius: `${DASHBOARD_UX.radius}px`,
        border: `1px solid ${isDark ? s.border : `${colors.warning}44`}`,
        bgcolor: isDark ? s.section : DASH_LIGHT.pendingTint,
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: `${DASHBOARD_UX.iconWellRadius}px`,
          bgcolor: isDark ? `${colors.warning}22` : '#FFF4E5',
          color: colors.warning,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          mt: 0.25,
        }}
      >
        <FlaskConical size={18} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={checked}
              onChange={(e) => onChange(e.target.checked)}
              sx={{ mt: -0.5 }}
            />
          }
          label={
            <Typography sx={{ ...DASHBOARD_UX.cardTitle, fontSize: '0.9375rem' }}>
              {t('admin.testLead.title')}
            </Typography>
          }
          sx={{ alignItems: 'flex-start', ml: 0 }}
        />
        <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, ml: 4, mt: -0.5 }}>
          {t('admin.testLead.description')}
        </Typography>
      </Box>
    </Box>
  );
}
