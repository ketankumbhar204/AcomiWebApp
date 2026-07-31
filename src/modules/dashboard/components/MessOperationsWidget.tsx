import { ClipboardList, Users, UtensilsCrossed, Vote } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { DashboardMessOperations } from '@/shared/types/dashboard';
import { spaceMealHeadcountPath, spaceMealsPath, spaceMembersPath } from '@/routes/paths';
import { colors } from '@/shared/theme/colors';
import { todayIsoDate } from '@/modules/meals/utils/mealDates';
import { DashboardSection } from './DashboardSection';
import { IconBadge } from './IconBadge';
import { MetricRow } from './MetricRow';
import { DASHBOARD_UX } from '../theme/dashboardUx';

type MessOperationsWidgetProps = {
  spaceId: string;
  operations: DashboardMessOperations;
};

/** Mess Row 2 right board — 2×2 metrics matching Property operations. */
export function MessOperationsWidget({ spaceId, operations }: MessOperationsWidgetProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <DashboardSection title={t('dashboard.messOperations.title')}>
      <MetricRow
        columns={2}
        embedded
        minHeight={DASHBOARD_UX.propertyCardMinHeight}
        maxHeight={DASHBOARD_UX.propertyCardMaxHeight}
        items={[
          {
            id: 'customers',
            label: t('dashboard.messOperations.membersReceivingMeals'),
            value: operations.membersReceivingMeals,
            accent: colors.primaryDark,
            icon: (
              <IconBadge accent={colors.primaryDark}>
                <Users />
              </IconBadge>
            ),
            onClick: () => navigate(spaceMembersPath(spaceId)),
          },
          {
            id: 'menus',
            label: t('dashboard.messOperations.menusPublished'),
            value: operations.menusPublishedThisMonth,
            accent: '#6366F1',
            icon: (
              <IconBadge accent="#6366F1">
                <ClipboardList />
              </IconBadge>
            ),
            onClick: () => navigate(spaceMealsPath(spaceId)),
          },
          {
            id: 'polls',
            label: t('dashboard.messOperations.openPolls'),
            value: operations.openPollsCount,
            accent: '#3B82F6',
            icon: (
              <IconBadge accent="#3B82F6">
                <Vote />
              </IconBadge>
            ),
            onClick: () => navigate(spaceMealsPath(spaceId)),
          },
          {
            id: 'headcount',
            label: t('dashboard.messOperations.todaysHeadcount'),
            value: operations.todaysHeadcount ?? '—',
            accent: '#D97706',
            icon: (
              <IconBadge accent="#D97706">
                <UtensilsCrossed />
              </IconBadge>
            ),
            onClick: () =>
              navigate(spaceMealHeadcountPath(spaceId, { date: todayIsoDate() })),
          },
        ]}
      />
    </DashboardSection>
  );
}
