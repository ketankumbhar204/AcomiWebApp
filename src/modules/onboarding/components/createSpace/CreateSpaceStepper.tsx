import { Box, Typography, useTheme } from '@mui/material';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authSurfaces } from '@/modules/auth/theme/authUx';
import { colors } from '@/shared/theme/colors';
import type { CreateSpaceStepId } from './createSpaceVisuals';

type CreateSpaceStepperProps = {
  steps: CreateSpaceStepId[];
  current: CreateSpaceStepId;
  onStepClick: (step: CreateSpaceStepId) => void;
};

const STEP_LABEL_KEY: Record<CreateSpaceStepId, string> = {
  type: 'spaces.createSpace.wizard.steps.type',
  details: 'spaces.createSpace.wizard.steps.details',
  amenities: 'spaces.createSpace.wizard.steps.amenities',
  confirm: 'spaces.createSpace.wizard.steps.confirm',
};

const STEP_LABEL_FALLBACK: Record<CreateSpaceStepId, string> = {
  type: 'Space Type',
  details: 'Details',
  amenities: 'Amenities',
  confirm: 'Confirm',
};

export function CreateSpaceStepper({ steps, current, onStepClick }: CreateSpaceStepperProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const a = authSurfaces(theme.palette.mode);
  const currentIndex = steps.indexOf(current);

  return (
    <Box
      component="ol"
      aria-label={t('spaces.createSpace.wizard.stepsLabel', { defaultValue: 'Create space steps' })}
      sx={{
        listStyle: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        m: 0,
        p: 0,
        width: '100%',
      }}
    >
      {steps.map((step, index) => {
        const completed = index < currentIndex;
        const active = index === currentIndex;
        const clickable = index <= currentIndex;
        return (
          <Box
            key={step}
            component="li"
            sx={{ display: 'flex', alignItems: 'center', flex: index === steps.length - 1 ? '0 0 auto' : 1, minWidth: 0 }}
          >
            <Box
              component="button"
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick(step)}
              aria-current={active ? 'step' : undefined}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.85,
                border: 0,
                bgcolor: 'transparent',
                p: 0,
                cursor: clickable ? 'pointer' : 'default',
                minWidth: 0,
                '&:focus-visible': {
                  outline: `2px solid ${a.brand}`,
                  outlineOffset: 3,
                  borderRadius: '10px',
                },
              }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  flexShrink: 0,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: completed || active ? '#FFFFFF' : a.textMuted,
                  bgcolor: completed || active ? colors.primary : 'transparent',
                  border: completed || active ? 'none' : `1.5px solid ${a.border}`,
                  transition: 'background-color 160ms ease, border-color 160ms ease',
                }}
              >
                {completed ? <Check size={14} strokeWidth={3} /> : index + 1}
              </Box>
              <Typography
                sx={{
                  display: { xs: active ? 'block' : 'none', sm: 'block' },
                  fontSize: '0.8125rem',
                  fontWeight: active || completed ? 700 : 600,
                  color: active || completed ? colors.teal : a.textMuted,
                  whiteSpace: 'nowrap',
                }}
              >
                {t(STEP_LABEL_KEY[step], { defaultValue: STEP_LABEL_FALLBACK[step] })}
              </Typography>
            </Box>
            {index < steps.length - 1 ? (
              <Box
                aria-hidden
                sx={{
                  flex: 1,
                  height: 2,
                  mx: 1.25,
                  borderRadius: 99,
                  bgcolor: index < currentIndex ? colors.primary : a.border,
                  minWidth: 12,
                  transition: 'background-color 160ms ease',
                }}
              />
            ) : null}
          </Box>
        );
      })}
    </Box>
  );
}
