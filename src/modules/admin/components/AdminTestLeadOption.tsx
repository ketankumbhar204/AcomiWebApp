import { Box, Checkbox, FormControlLabel, IconButton, Stack, Tooltip, Typography, useTheme } from '@mui/material';
import { FlaskConical, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, DASH_LIGHT, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';

type AdminTestLeadOptionProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Compact row for footer actions (checkbox + info tooltip). */
  compact?: boolean;
  titleKey?: string;
  descriptionKey?: string;
};

export function AdminTestLeadOption({
  checked,
  onChange,
  compact = false,
  titleKey = 'admin.testLead.title',
  descriptionKey = 'admin.testLead.description',
}: AdminTestLeadOptionProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const isDark = theme.palette.mode === 'dark';

  if (compact) {
    return (
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={checked}
              onChange={(e) => onChange(e.target.checked)}
              size="small"
            />
          }
          label={
            <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
              {t(titleKey)}
            </Typography>
          }
          sx={{ mr: 0.25, ml: 0 }}
        />
        <Tooltip title={t(descriptionKey)} arrow enterTouchDelay={0}>
          <IconButton
            type="button"
            size="small"
            aria-label={t(descriptionKey)}
            sx={{ color: 'text.secondary' }}
          >
            <Info size={16} />
          </IconButton>
        </Tooltip>
      </Stack>
    );
  }

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
              {t(titleKey)}
            </Typography>
          }
          sx={{ alignItems: 'flex-start', ml: 0 }}
        />
        <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, ml: 4, mt: -0.5 }}>
          {t(descriptionKey)}
        </Typography>
      </Box>
    </Box>
  );
}
