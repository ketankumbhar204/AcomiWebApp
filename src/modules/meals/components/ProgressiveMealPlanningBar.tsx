import { Box, Button, Stack, Typography, useTheme } from '@mui/material';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
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

const compactBtnSx = {
  ...DASHBOARD_UX.button,
  minHeight: 36,
  px: 1.75,
  py: 0.75,
  width: 'auto',
  alignSelf: 'center',
} as const;

/**
 * Sticky progressive actions — desktop-compact (not full-bleed mobile CTAs).
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

  return (
    <Box
      sx={{
        position: 'sticky',
        bottom: 0,
        zIndex: 8,
        borderTop: `1px solid ${s.border}`,
        bgcolor: s.surface,
        boxShadow: s.shadowHover,
        px: { xs: 2, md: 3 },
        py: 1.25,
      }}
    >
      <Box sx={{ maxWidth: DASHBOARD_UX.contentMaxWidth, mx: 'auto', width: '100%' }}>
        {showContinue ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { sm: 'center' },
              justifyContent: 'space-between',
              gap: 1.5,
              p: 1.25,
              borderRadius: `${DASHBOARD_UX.radius}px`,
              border: `1px solid ${s.border}`,
              bgcolor: theme.palette.mode === 'dark' ? s.elevated : `${colors.primary}0A`,
            }}
          >
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textMuted }}>
                {t('meals.planning.progressive.stepOf', {
                  current: 1,
                  total: 2,
                  defaultValue: 'Step 1 of 2',
                })}
              </Typography>
              <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, mt: 0.15 }}>
                {t('meals.planning.progressive.reviewExtrasTitle', {
                  defaultValue: 'Review meal extras',
                })}
              </Typography>
              <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: s.textSecondary, mt: 0.15 }}>
                {t('meals.planning.progressive.mealsSelectedNextExtras', {
                  defaultValue: 'Meals selected — next, review extras',
                })}
              </Typography>
            </Box>
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
                sx={{ ...compactBtnSx, color: colors.primaryDark }}
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
                  ...compactBtnSx,
                  bgcolor: colors.primaryDark,
                  '&:hover': { bgcolor: colors.primaryHover },
                }}
              >
                {t('meals.planning.progressive.continueToExtras', {
                  defaultValue: 'Continue to Extras',
                })}
              </Button>
            </Stack>
          </Box>
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
                  <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textMuted }}>
                    {t('meals.planning.progressive.stepOf', {
                      current: 2,
                      total: 2,
                      defaultValue: 'Step 2 of 2',
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
                  sx={{ ...compactBtnSx, mt: 0.5, ml: -0.5 }}
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
                  ...compactBtnSx,
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
                  ...compactBtnSx,
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
