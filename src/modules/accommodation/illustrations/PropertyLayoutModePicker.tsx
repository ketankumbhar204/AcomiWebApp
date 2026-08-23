import { Box, Stack, Typography, useTheme } from '@mui/material';
import { Check, LayoutGrid, PieChart, Users, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PropertyLayoutMode } from '@/shared/types/accommodation';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';
import { getLayoutModeIllustration } from './illustrationAssets';

type PropertyLayoutModePickerProps = {
  value: PropertyLayoutMode | null;
  onChange: (mode: PropertyLayoutMode) => void;
  options: PropertyLayoutMode[];
  error?: string | null;
  /** `featured` matches the Quick Setup Figma mock. `compact` is for drawers. */
  variant?: 'featured' | 'compact';
};

const HIGHLIGHTS = [
  { icon: LayoutGrid, key: 'manage' },
  { icon: Users, key: 'visibility' },
  { icon: Wrench, key: 'utilization' },
  { icon: PieChart, key: 'operations' },
] as const;

/**
 * Visual property-layout picker — Figma: image-left / copy-right cards.
 * Selection logic unchanged; no "Recommended" badge.
 */
export function PropertyLayoutModePicker({
  value,
  onChange,
  options,
  error,
  variant = 'featured',
}: PropertyLayoutModePickerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const featured = variant === 'featured';

  return (
    <Box sx={{ width: '100%' }}>
      {featured ? (
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary }}>
            {t('accommodation.layoutMode.chooseTitle')}
          </Typography>
          <Typography sx={{ ...DASHBOARD_UX.sectionSubtitle, color: s.textMuted, mt: 0.5 }}>
            {t('accommodation.layoutMode.chooseSubtitle')}
          </Typography>
        </Box>
      ) : (
        <Typography sx={{ ...DASHBOARD_UX.link, color: s.textPrimary, mb: 1 }}>
          {t('accommodation.layoutMode.label')}
        </Typography>
      )}

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={featured ? 2 : 1.5}
        sx={{ alignItems: 'stretch' }}
      >
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
                selected
                  ? `, ${t('accommodation.layoutMode.selected', { defaultValue: 'selected' })}`
                  : ''
              }`}
              sx={{
                all: 'unset',
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                flexDirection: 'row',
                flex: 1,
                minWidth: 0,
                boxSizing: 'border-box',
                overflow: 'hidden',
                borderRadius: featured ? 3 : `${DASHBOARD_UX.radius}px`,
                border: `${selected ? 2 : 1}px solid ${selected ? colors.primary : s.border}`,
                bgcolor: s.surface,
                boxShadow: selected ? s.shadowHover : s.shadow,
                transition: DASHBOARD_UX.transition,
                '&:hover': {
                  borderColor: colors.primary,
                  boxShadow: s.shadowHover,
                },
              }}
            >
              <Box
                sx={{
                  flex: { xs: '0 0 46%', sm: '0 0 52%' },
                  minWidth: featured ? 180 : 128,
                  minHeight: featured ? 168 : 112,
                  alignSelf: 'stretch',
                  bgcolor: selected ? colors.lightGreen : s.elevated,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  p: featured ? 1.5 : 1,
                }}
              >
                <Box
                  component="img"
                  src={getLayoutModeIllustration(mode)}
                  alt=""
                  sx={{
                    display: 'block',
                    width: '100%',
                    height: 'auto',
                    maxHeight: featured ? 188 : 120,
                    objectFit: 'contain',
                    objectPosition: 'center',
                    borderRadius: 1.5,
                  }}
                />
              </Box>

              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  px: featured ? 2.25 : 1.5,
                  py: featured ? 2 : 1.25,
                  pr: selected ? 4.5 : undefined,
                }}
              >
                <Typography
                  sx={{
                    ...DASHBOARD_UX.cardTitle,
                    color: s.textPrimary,
                    mb: 0.5,
                  }}
                >
                  {t(`accommodation.layoutMode.${mode}`)}
                </Typography>
                <Typography
                  sx={{
                    ...DASHBOARD_UX.body,
                    color: s.textMuted,
                  }}
                >
                  {t(`accommodation.layoutMode.${mode}_desc`, {
                    defaultValue: t(`accommodation.layoutMode.${mode}`),
                  })}
                </Typography>
              </Box>

              {selected ? (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    bgcolor: colors.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(37, 211, 102, 0.35)',
                  }}
                >
                  <Check size={14} color="#fff" strokeWidth={3} />
                </Box>
              ) : null}
            </Box>
          );
        })}
      </Stack>

      {featured ? (
        <Box
          sx={{
            mt: 2,
            px: { xs: 1.5, md: 2 },
            py: 1.5,
            borderRadius: 2,
            bgcolor: theme.palette.mode === 'dark' ? s.elevated : '#F3F4F6',
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              md: 'repeat(4, minmax(0, 1fr))',
            },
            gap: { xs: 1.25, md: 2 },
          }}
        >
          {HIGHLIGHTS.map(({ icon: Icon, key }) => (
            <Stack
              key={key}
              direction="row"
              spacing={1}
              sx={{ alignItems: 'center', minWidth: 0 }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  flexShrink: 0,
                  borderRadius: '50%',
                  bgcolor: colors.lightGreen,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={14} color={colors.primaryDark} strokeWidth={2.2} />
              </Box>
              <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textSecondary }}>
                {t(`accommodation.layoutMode.highlights.${key}`)}
              </Typography>
            </Stack>
          ))}
        </Box>
      ) : null}

      {error ? (
        <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: 'error.main', mt: 0.75, display: 'block' }}>
          {error}
        </Typography>
      ) : null}
    </Box>
  );
}
