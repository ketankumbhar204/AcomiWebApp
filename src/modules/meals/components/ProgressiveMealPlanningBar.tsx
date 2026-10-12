import { Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX } from '@/modules/dashboard/theme/dashboardUx';
import { GuidedStepPanel } from '@/shared/components/GuidedStepPanel';

export type ProgressiveMealPhase = 'select' | 'review_extras' | 'ready';

type ProgressiveMealPlanningBarProps = {
  phase: ProgressiveMealPhase;
  /** Non-extra meals currently selected. Shown on step 1. */
  selectedCount?: number;
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
 * Meal menu editor guidance. review_extras continues to extras;
 * select / ready save or share. Behavior is unchanged.
 */
export function ProgressiveMealPlanningBar({
  phase,
  selectedCount = 0,
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
  const showContinue = phase === 'review_extras';
  const stepCurrent = phase === 'review_extras' ? 1 : phase === 'ready' ? 2 : undefined;

  return (
    <GuidedStepPanel
      stepLabel={
        stepCurrent
          ? t('meals.planning.progressive.stepOf', {
              current: stepCurrent,
              total: 2,
              defaultValue: 'Step {{current}} of {{total}}',
            })
          : undefined
      }
      stepCurrent={stepCurrent}
      stepTotal={stepCurrent ? 2 : undefined}
      progressLine={
        phase === 'review_extras'
          ? t('meals.planning.progressive.selectedMealsNextExtras', {
              count: selectedCount,
              defaultValue_one: '✓ {{count}} meal selected · Next: Review extras',
              defaultValue_other: '✓ {{count}} meals selected · Next: Review extras',
            })
          : phase === 'ready'
            ? t('meals.planning.progressive.readyToSave', {
                defaultValue: 'Ready to save or share',
              })
            : undefined
      }
      extra={
        canDeleteDraft && onDeleteDraft ? (
          <Button
            size="small"
            color="error"
            variant="text"
            disabled={saving}
            onClick={onDeleteDraft}
            sx={{ ...DASHBOARD_UX.button, color: '#FCA5A5', ml: -0.5 }}
          >
            {t('meals.actions.deleteDraft', { defaultValue: 'Delete draft' })}
          </Button>
        ) : null
      }
      primary={
        showContinue
          ? {
              label: t('meals.planning.progressive.continueToExtras', {
                defaultValue: 'Continue to Extras →',
              }),
              onClick: onContinueToExtras,
              disabled: saving,
            }
          : {
              label: t('meals.actions.share'),
              onClick: onShareMeal,
              disabled: saving || shareDisabled,
            }
      }
      secondary={{
        label: t('meals.actions.save'),
        onClick: onSaveDraft,
        disabled: saving || saveDisabled,
      }}
      compact
    />
  );
}
