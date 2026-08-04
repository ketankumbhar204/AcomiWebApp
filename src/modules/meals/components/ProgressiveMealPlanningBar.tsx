import { Box, Button, Stack, Typography, useTheme } from '@mui/material';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { stickyFooterAccentSx } from '@/shared/components/StickyFooter';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';

export type ProgressiveMealPhase = 'select' | 'review_extras' | 'ready';

type ProgressiveMealPlanningBarProps = {
  phase: ProgressiveMealPhase;
  saving?: boolean;
  saveDisabled?: boolean;
  shareDisabled?: boolean;
  canDeleteDraft?: boolean;
  onContinueToExtras: () => void;
  onSaveDraft: () => void;
  onShareMeal: () => void;
  onDeleteDraft?: () => void;
};

/**
 * Dashboard-style sticky progressive actions for meal menu editor.
 * review_extras → Continue to Extras + Save draft
 * select / ready → Save draft + Share meal
 */
export function ProgressiveMealPlanningBar({
  phase,
  saving = false,
  saveDisabled = false,
  shareDisabled = false,
  canDeleteDraft = false,
  onContinueToExtras,
  onSaveDraft,
  onShareMeal,
  onDeleteDraft,
}: ProgressiveMealPlanningBarProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const showContinue = phase === 'review_extras';
  const showFinal = phase === 'select' || phase === 'ready';
  const accent =
    theme.palette.mode === 'dark'
      ? {
          bgcolor: s.section,
          borderTop: `2px solid ${s.border}`,
          boxShadow: s.shadowHover,
        }
      : stickyFooterAccentSx;

  return (
    <Box
      sx={{
        flexShrink: 0,
        zIndex: 30,
        ...accent,
      }}
    >
      <Box
        sx={{
          maxWidth: DASHBOARD_UX.contentMaxWidth,
          mx: 'auto',
          width: '100%',
          px: { xs: 2, md: 3 },
          py: 1.35,
        }}
      >
        {showContinue ? (
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
          >
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start', minWidth: 0, flex: 1 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  bgcolor: `${colors.primary}22`,
                  color: colors.primaryDark,
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <CheckCircle2 size={20} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted }}>
                  {t('meals.planning.progressive.stepOf', {
                    current: 1,
                    total: 2,
                    defaultValue: 'Step {{current}} of {{total}}',
                  })}
                </Typography>
                <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, mt: 0.15 }}>
                  {t('meals.planning.progressive.reviewExtrasTitle', {
                    defaultValue: 'Review extras (optional)',
                  })}
                </Typography>
                <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 0.15 }}>
                  {t('meals.planning.progressive.mealsSelectedNextExtras', {
                    defaultValue: 'Meals selected · Next: Review extras',
                  })}
                </Typography>
              </Box>
            </Stack>
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              sx={{ flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}
            >
              <Button
                size="small"
                variant="text"
                disabled={saving || saveDisabled}
                onClick={onSaveDraft}
                sx={{ ...DASHBOARD_UX.button, color: colors.primaryDark, minHeight: DASHBOARD_UX.buttonHeight }}
              >
                {t('meals.actions.saveDraft')}
              </Button>
              <Button
                size="small"
                variant="contained"
                endIcon={<ArrowRight size={14} />}
                onClick={onContinueToExtras}
                sx={{
                  ...dashContainedButtonSx,
                  bgcolor: colors.primaryDark,
                  '&:hover': { bgcolor: colors.primaryHover },
                }}
              >
                {t('meals.planning.progressive.continueToExtras', {
                  defaultValue: 'Continue to Extras',
                })}
              </Button>
            </Stack>
          </Stack>
        ) : null}

        {showFinal ? (
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.25}
            sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
          >
            <Box sx={{ minWidth: 0 }}>
              {phase === 'ready' ? (
                <>
                  <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted }}>
                    {t('meals.planning.progressive.stepOf', {
                      current: 2,
                      total: 2,
                      defaultValue: 'Step {{current}} of {{total}}',
                    })}
                  </Typography>
                  <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
                    {t('meals.planning.progressive.readyToSave', {
                      defaultValue: 'Ready to save or share',
                    })}
                  </Typography>
                </>
              ) : (
                <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
                  {t('meals.planning.progressive.selectMealsHint', {
                    defaultValue: 'Select combos or items to continue.',
                  })}
                </Typography>
              )}
              {canDeleteDraft && onDeleteDraft ? (
                <Button
                  size="small"
                  color="error"
                  variant="text"
                  disabled={saving}
                  onClick={onDeleteDraft}
                  sx={{ ...DASHBOARD_UX.button, mt: 0.5, ml: -0.5 }}
                >
                  {t('meals.actions.deleteDraft', { defaultValue: 'Delete draft' })}
                </Button>
              ) : null}
            </Box>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexShrink: 0 }}>
              <Button
                size="small"
                variant="outlined"
                disabled={saving || saveDisabled}
                onClick={onSaveDraft}
                sx={{
                  ...dashOutlinedButtonSx,
                  color: colors.primaryDark,
                  borderColor: colors.primary,
                }}
              >
                {t('meals.actions.saveDraft')}
              </Button>
              <Button
                size="small"
                variant="contained"
                disabled={saving || shareDisabled}
                onClick={onShareMeal}
                sx={{
                  ...dashContainedButtonSx,
                  bgcolor: colors.primaryDark,
                  '&:hover': { bgcolor: colors.primaryHover },
                }}
              >
                {t('meals.actions.shareMeal')}
              </Button>
            </Stack>
          </Stack>
        ) : null}
      </Box>
    </Box>
  );
}
