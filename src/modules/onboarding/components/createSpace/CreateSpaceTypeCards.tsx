import { Box, Typography, useTheme } from '@mui/material';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authSurfaces } from '@/modules/auth/theme/authUx';
import { colors } from '@/shared/theme/colors';
import type { SpaceType } from '@/shared/types/space';
import {
  SPACE_TYPE_ORDER,
  SPACE_TYPE_VISUAL,
  spaceTypeDescriptionKey,
  spaceTypeLabelKey,
} from './createSpaceVisuals';

type CreateSpaceTypeCardsProps = {
  value: SpaceType | '';
  onChange: (type: SpaceType) => void;
  error?: string | null;
};

export function CreateSpaceTypeCards({ value, onChange, error }: CreateSpaceTypeCardsProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const a = authSurfaces(theme.palette.mode);
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box>
      <Box
        role="radiogroup"
        aria-label={t('spaces.types.label')}
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, minmax(0, 1fr))' },
          gap: 1.25,
        }}
      >
        {SPACE_TYPE_ORDER.map((type) => {
          const selected = value === type;
          const visual = SPACE_TYPE_VISUAL[type];
          const Icon = visual.icon;
          const tint = isDark ? `${visual.accent}22` : visual.tint;
          return (
            <Box
              key={type}
              component="button"
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(type)}
              sx={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: { xs: 0.45, sm: 1 },
                textAlign: 'left',
                p: { xs: 1.15, sm: 1.5 },
                pr: { xs: 4.25, sm: 1.5 },
                minHeight: { xs: 0, sm: 132 },
                borderRadius: '16px',
                border: `1.5px solid ${selected ? colors.primary : isDark ? a.border : `${visual.accent}33`}`,
                bgcolor: selected
                  ? isDark
                    ? colors.selected
                    : colors.lightGreen
                  : isDark
                    ? a.surface
                    : visual.tint,
                boxShadow: selected ? '0 8px 20px rgba(15, 23, 42, 0.08)' : '0 1px 2px rgba(15, 23, 42, 0.04)',
                cursor: 'pointer',
                color: a.textPrimary,
                transition: 'border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease, background-color 140ms ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  borderColor: visual.accent,
                  boxShadow: '0 10px 22px rgba(15, 23, 42, 0.08)',
                },
                '&:focus-visible': {
                  outline: `2px solid ${colors.primary}`,
                  outlineOffset: 2,
                },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'row', sm: 'column' },
                  alignItems: { xs: 'center', sm: 'flex-start' },
                  gap: { xs: 1, sm: 1 },
                  width: '100%',
                }}
              >
                <Box
                  sx={{
                    width: { xs: 32, sm: 40 },
                    height: { xs: 32, sm: 40 },
                    borderRadius: { xs: '10px', sm: '12px' },
                    bgcolor: tint,
                    color: visual.accent,
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={20} strokeWidth={2.15} />
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'row', sm: 'column' },
                    alignItems: { xs: 'baseline', sm: 'flex-start' },
                    gap: { xs: 0.75, sm: 0 },
                    minWidth: 0,
                    flexWrap: { xs: 'nowrap', sm: 'wrap' },
                    flex: 1,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: { xs: '0.9rem', sm: '0.95rem' },
                      fontWeight: 800,
                      lineHeight: 1.2,
                      color: selected ? visual.accent : a.textPrimary,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t(spaceTypeLabelKey(type))}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: visual.accent,
                      mt: { xs: 0, sm: 0.2 },
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {t(spaceTypeDescriptionKey(type))}
                  </Typography>
                  <Typography
                    sx={{
                      display: { xs: 'none', sm: 'block' },
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: a.textMuted,
                      mt: 0.45,
                      lineHeight: 1.4,
                    }}
                  >
                    {t(`spaces.createSpace.wizard.typeBlurb.${type}`, {
                      defaultValue: t(spaceTypeDescriptionKey(type)),
                    })}
                  </Typography>
                </Box>
              </Box>
              <Typography
                sx={{
                  display: { xs: 'block', sm: 'none' },
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: a.textMuted,
                  lineHeight: 1.35,
                  width: '100%',
                }}
              >
                {t(`spaces.createSpace.wizard.typeBlurb.${type}`, {
                  defaultValue: t(spaceTypeDescriptionKey(type)),
                })}
              </Typography>
              <Box
                aria-hidden
                sx={{
                  position: 'absolute',
                  top: { xs: 10, sm: 10 },
                  right: { xs: 10, sm: 10 },
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  border: selected ? 'none' : `1.5px solid ${a.border}`,
                  bgcolor: selected ? colors.primary : 'transparent',
                  color: '#FFFFFF',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {selected ? <Check size={12} strokeWidth={3} /> : null}
              </Box>
            </Box>
          );
        })}
      </Box>
      {error ? (
        <Typography role="alert" sx={{ mt: 1, fontSize: '0.8125rem', fontWeight: 600, color: a.danger }}>
          {error}
        </Typography>
      ) : null}
    </Box>
  );
}
