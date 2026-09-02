import { Box, Typography, useTheme } from '@mui/material';
import {
  Bell,
  Building2,
  Package,
  Users,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  spaceAddCustomersHubPath,
  spaceBedInventoryPath,
  spaceInventoryPath,
  spaceMealsPath,
  spaceMembersPath,
  spaceNotificationsPath,
  spacePaymentsPath,
} from '@/routes/paths';
import { isAccommodationApplicable } from '@/shared/utils/spacePermissions';
import { canManagePayments } from '@/shared/utils/dashboardFinancial';
import type { MembershipRole, SpacePermissionsResponse, SpaceType } from '@/shared/types/space';
import { QuickActionTile } from './QuickActionTile';
import { DASHBOARD_UX, dashSurfaces } from '../theme/dashboardUx';

type DashboardQuickActionsProps = {
  spaceId: string;
  spaceType: SpaceType | undefined;
  permissions: SpacePermissionsResponse & { membershipRole?: MembershipRole };
  isOperator: boolean;
  pendingCount: number;
  /** Figma: 6 tiles in one horizontal strip. */
  layout?: 'rail' | 'row';
  compact?: boolean;
};

export function DashboardQuickActions({
  spaceId,
  spaceType,
  permissions,
  isOperator,
  layout = 'row',
}: DashboardQuickActionsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  const accommodationApplicable = spaceType ? isAccommodationApplicable(spaceType) : true;
  const isMess = spaceType === 'MESS';
  const showResidents = permissions.canManageOccupancy && accommodationApplicable;
  const showMeals = permissions.canManageMeals === true;
  const showPayments = canManagePayments(permissions.membershipRole);
  const showInventory = permissions.canViewInventory === true;
  const showAddCustomers =
    isOperator && permissions.canManageMembers && (isMess || showMeals);

  const tiles: ReactNode[] = [];

  if (isOperator && showResidents) {
    tiles.push(
      <QuickActionTile
        key="residents"
        tone="success"
        icon={Building2}
        title={t('dashboard.quickActions.residents')}
        subtitle={t('dashboard.quickActions.residentsSubtitle')}
        onClick={() => navigate(spaceBedInventoryPath(spaceId, 'AVAILABLE'))}
      />,
    );
  }
  if (isOperator && showMeals) {
    tiles.push(
      <QuickActionTile
        key="meals"
        tone="peach"
        icon={UtensilsCrossed}
        title={t('dashboard.quickActions.meals')}
        subtitle={t('dashboard.quickActions.mealsSubtitleShort')}
        onClick={() => navigate(spaceMealsPath(spaceId))}
      />,
    );
  }
  if (isOperator && showPayments && (!isMess || showMeals)) {
    tiles.push(
      <QuickActionTile
        key="payments"
        tone="purple"
        icon={Wallet}
        title={t('dashboard.quickActions.payments')}
        subtitle={t('dashboard.quickActions.paymentsSubtitle')}
        onClick={() => navigate(spacePaymentsPath(spaceId))}
      />,
    );
  }
  if (isOperator && showInventory) {
    tiles.push(
      <QuickActionTile
        key="inventory"
        tone="info"
        icon={Package}
        title={t('dashboard.quickActions.inventory')}
        subtitle={t('dashboard.quickActions.inventorySubtitle')}
        onClick={() => navigate(spaceInventoryPath(spaceId))}
      />,
    );
  }
  if (showAddCustomers) {
    tiles.push(
      <QuickActionTile
        key="add-customers"
        tone="pink"
        icon={Users}
        title={t('dashboard.quickActions.setupAddCustomers')}
        subtitle={t('dashboard.quickActions.setupAddCustomersSubtitle')}
        onClick={() => navigate(spaceAddCustomersHubPath(spaceId))}
      />,
    );
  } else if (isOperator && permissions.canManageMembers && !isMess) {
    tiles.push(
      <QuickActionTile
        key="members"
        tone="purple"
        icon={Users}
        title={t('dashboard.quickActions.members')}
        subtitle={t('dashboard.quickActions.membersSubtitle')}
        onClick={() => navigate(spaceMembersPath(spaceId))}
      />,
    );
  }

  if (isOperator) {
    tiles.push(
      <QuickActionTile
        key="notifications"
        tone="purple"
        icon={Bell}
        title={t('dashboard.quickActions.notifications', { defaultValue: 'Notifications' })}
        subtitle={t('dashboard.quickActions.notificationsSubtitle', {
          defaultValue: 'View all alerts and updates',
        })}
        onClick={() => navigate(spaceNotificationsPath(spaceId))}
      />,
    );
  }

  const cols = layout === 'row' ? Math.max(tiles.length, 1) : 2;

  return (
    <Box
      component="section"
      aria-label={t('dashboard.quickActions.title')}
      sx={{
        bgcolor: s.surface,
        borderRadius: `${DASHBOARD_UX.radius}px`,
        border: `1px solid ${s.border}`,
        boxShadow: s.shadow,
        p: `${DASHBOARD_UX.sectionPadding}px`,
        minWidth: 0,
        flex: 1,
        height: '100%',
      }}
    >
      <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary, mb: 1 }}>
        {t('dashboard.quickActions.title')}
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns:
            layout === 'row'
              ? {
                  xs: '1fr 1fr',
                  sm: 'repeat(3, minmax(0, 1fr))',
                  md: `repeat(${Math.min(Math.max(cols, 4), 6)}, minmax(0, 1fr))`,
                }
              : { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
          gap: `${DASHBOARD_UX.cardGap}px`,
          width: '100%',
        }}
      >
        {tiles.slice(0, 6)}
      </Box>
    </Box>
  );
}
