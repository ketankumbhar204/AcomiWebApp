import { Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { DashboardMessOperations } from '@/shared/types/dashboard';
import { StatCard } from '@/shared/components/StatCard';
import { WidgetCard } from '@/shared/components/WidgetCard';
import { EmptyState } from '@/shared/components/EmptyState';

type MealOpsWidgetProps = {
  operations: DashboardMessOperations | null;
};

export function MealOpsWidget({ operations }: MealOpsWidgetProps) {
  const { t } = useTranslation();

  return (
    <WidgetCard title={t('dashboard.messOperations.title')}>
      {!operations ? (
        <EmptyState
          title={t('dashboard.operations.emptyAllNotPlanned')}
          description={t('dashboard.operations.emptyNonePublished')}
        />
      ) : (
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label={t('dashboard.messOperations.membersReceivingMeals')}
              value={operations.membersReceivingMeals}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label={t('dashboard.messOperations.menusPublished')}
              value={operations.menusPublishedThisMonth}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label={t('dashboard.messOperations.openPolls')}
              value={operations.openPollsCount}
              hint={t('dashboard.messOperations.pollResponses', {
                responded: operations.pollRespondedCount,
                eligible: operations.pollEligibleCount,
              })}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label={t('dashboard.messOperations.todaysHeadcount')}
              value={operations.todaysHeadcount ?? '—'}
            />
          </Grid>
        </Grid>
      )}
    </WidgetCard>
  );
}
