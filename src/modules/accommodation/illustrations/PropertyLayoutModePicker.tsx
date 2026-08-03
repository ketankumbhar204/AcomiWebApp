import { Box, Stack, Typography } from '@mui/material';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PropertyLayoutMode } from '@/shared/types/accommodation';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';
import { useTheme } from '@mui/material/styles';
import { getLayoutModeIllustration } from './illustrationAssets';
import { LayoutIllustration } from './LayoutIllustration';

type PropertyLayoutModePickerProps = {
  value: PropertyLayoutMode | null;
  onChange: (mode: PropertyLayoutMode) => void;
  options: PropertyLayoutMode[];
  error?: string | null;
};

/**
 * Visual property-layout picker — parity with Mobile PropertyLayoutModePicker.
 * Selection logic unchanged; presentation only.
 */
export function PropertyLayoutModePicker({
  value,
  onChange,
  options,
  error,
}: PropertyLayoutModePickerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Box sx={{ width: '100%' }}>
      <Typography
        sx={{
          ...DASHBOARD_UX.link,
          color: s.textPrimary,
          mb: 1,
        }}
      >
        {t('accommodation.layoutMode.label')}
      </Typography>
      <Stack spacing={1.5}>
        {options.map((mode) => {
          const selected = value === mode;
          return (
            <Box
              key={mode}
              component="button"
              type="button"
              onClick={() => onChange(mode)}
              aria-pressed={selected}
              aria-label={`${t(`accommodation.layoutMode.${mode}`)}${
                selected ? `, ${t('accommodation.layoutMode.selected', { defaultValue: 'selected' })}` : ''
              }`}
              sx={{
                all: 'unset',
                cursor: 'pointer',
                display: 'block',
                borderRadius: `${DASHBOARD_UX.radius}px`,
                border: `2px solid ${selected ? colors.primary : s.border}`,
                bgcolor: selected ? colors.lightGreen : s.surface,
                overflow: 'hidden',
                boxShadow: s.shadow,
                transition: DASHBOARD_UX.transition,
                '&:hover': {
                  borderColor: colors.primary,
                },
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  bgcolor: s.elevated,
                  px: 2,
                  py: 1.5,
                }}
              >
                <LayoutIllustration
                  src={getLayoutModeIllustration(mode)}
                  size={mode === 'CORRIDOR_PG' ? 'floorWide' : 'picker'}
                  alt=""
                />
              </Box>
              <Box sx={{ px: 2, py: 1.5 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
                  <Typography
                    sx={{
                      ...DASHBOARD_UX.cardTitle,
                      flex: 1,
                      color: selected ? colors.primaryDark : s.textPrimary,
                    }}
                  >
                    {t(`accommodation.layoutMode.${mode}`)}
                  </Typography>
                  {selected ? (
                    <Box
                      sx={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        bgcolor: colors.primary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Check size={14} color="#fff" strokeWidth={3} />
                    </Box>
                  ) : null}
                </Stack>
                <Typography
                  sx={{
                    ...DASHBOARD_UX.body,
                    color: selected ? colors.primaryDark : s.textMuted,
                  }}
                >
                  {t(`accommodation.layoutMode.${mode}_desc`, {
                    defaultValue: t(`accommodation.layoutMode.${mode}`),
                  })}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Stack>
      {error ? (
        <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: 'error.main', mt: 0.5, display: 'block' }}>
          {error}
        </Typography>
      ) : null}
    </Box>
  );
}
