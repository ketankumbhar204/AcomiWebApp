import { Box, Button, Typography } from '@mui/material';
import { Bell, Building2, Clock3, LayoutDashboard, Package, TriangleAlert, Users, UserRound, UtensilsCrossed, Wallet } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import type { AppNavSection } from '@/layouts/navTypes';
import { useLogout } from '@/modules/auth/hooks/useLogout';
import { SpaceContextSelector } from '@/modules/dashboard/components/SpaceContextSelector';
import { usePendingActions } from '@/modules/dashboard/hooks/usePendingActions';
import { DASHBOARD_UX } from '@/modules/dashboard/theme/dashboardUx';
import { NotificationBellButton } from '@/modules/notifications/components/NotificationBellButton';
import { useAuthSession } from '@/shared/hooks/useAuthSession';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import {
  spaceAccommodationPath,
  spaceComplaintsPath,
  spaceDashboardPath,
  spaceDayMealsPath,
  spaceDetailsPath,
  spaceInventoryPath,
  spaceMealsPath,
  spaceMealsPlansPath,
  spaceMembersPath,
  spaceNotificationsPath,
  spacePaymentsPath,
  spacePendingActionsPath,
  ROUTES,
} from '@/routes/paths';
import { canManageNotifications } from '@/shared/utils/spaceOperator';
import { canRaiseComplaint } from '@/modules/complaints/utils/complaintHelpers';

export function SpaceShellLayout() {
  const { t } = useTranslation();
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const logout = useLogout();
  const { user } = useAuthSession();
  const permissions = useSpacePermissions(spaceId);
  const isOperator = canManageNotifications(permissions);
  const pending = usePendingActions(spaceId, isOperator || permissions.membershipRole != null);

  const space = permissions.space;
  const displayName = user?.fullName?.trim() || user?.mobileNumber || '';
  const location = useLocation();
  const isDashboardRoute =
    location.pathname === spaceDashboardPath(spaceId) ||
    location.pathname === `/spaces/${spaceId}` ||
    location.pathname === `/spaces/${spaceId}/`;

  const navSections: AppNavSection[] = useMemo(() => {
    const items: AppNavSection['items'] = [
      {
        id: 'dashboard',
        label: t('navigation.dashboard'),
        to: spaceDashboardPath(spaceId),
        icon: <LayoutDashboard size={16} />,
        badgeCount: pending.totalCount > 0 ? pending.totalCount : undefined,
      },
      {
        id: 'space-details',
        label: t('navigation.spaceDetails'),
        to: spaceDetailsPath(spaceId),
        icon: <Building2 size={16} />,
      },
    ];

    if (permissions.canManageMembers) {
      items.push({
        id: 'members',
        label: t('navigation.members'),
        to: spaceMembersPath(spaceId),
        icon: <Users size={16} />,
      });
    }

    if (permissions.canViewAccommodation) {
      items.push({
        id: 'accommodation',
        label: t('navigation.accommodation'),
        to: spaceAccommodationPath(spaceId),
        icon: <Building2 size={16} />,
      });
    }

    if (permissions.canViewMeals === true) {
      items.push({
        id: 'meals',
        label: t('navigation.meals'),
        to: spaceMealsPath(spaceId),
        icon: <UtensilsCrossed size={16} />,
      });
      if (permissions.canManageMeals === true) {
        items.push({
          id: 'meal-plans',
          label: t('meals.subscriptionPlans.title'),
          to: spaceMealsPlansPath(spaceId),
          icon: <UtensilsCrossed size={16} />,
        });
      }
    }

    if (permissions.membershipRole) {
      items.push({
        id: 'payments',
        label: t('navigation.payments'),
        to: spacePaymentsPath(spaceId),
        icon: <Wallet size={16} />,
      });
      items.push({
        id: 'day-meals',
        label: t('paymentCollection.dayMeals.title', { defaultValue: 'Day meals' }),
        to: spaceDayMealsPath(spaceId),
        icon: <Wallet size={16} />,
      });
    }

    const mayComplaints =
      permissions.canViewAllComplaints === true ||
      permissions.canManageComplaints === true ||
      canRaiseComplaint(permissions.membershipRole, permissions.canRaiseComplaint);
    if (mayComplaints) {
      items.push({
        id: 'complaints',
        label: t('navigation.complaints'),
        to: spaceComplaintsPath(spaceId),
        icon: <TriangleAlert size={16} />,
      });
    }

    if (permissions.canViewInventory === true) {
      items.push({
        id: 'inventory',
        label: t('navigation.inventory'),
        to: spaceInventoryPath(spaceId),
        icon: <Package size={16} />,
      });
    }

    items.push({
      id: 'notifications',
      label: t('notifications.title'),
      to: spaceNotificationsPath(spaceId),
      icon: <Bell size={16} />,
    });

    items.push({
      id: 'pending',
      label: t('dashboard.attention.pendingActions'),
      to: spacePendingActionsPath(spaceId),
      icon: <Clock3 size={16} />,
      badgeCount: pending.totalCount > 0 ? pending.totalCount : undefined,
    });

    return [
      {
        id: 'space',
        label: t('navigation.space'),
        items,
      },
      {
        id: 'account',
        label: t('settings.profile.eyebrow', { defaultValue: 'Account' }),
        items: [
          {
            id: 'profile',
            label: t('navigation.profile'),
            to: ROUTES.profile,
            icon: <UserRound size={16} />,
          },
        ],
      },
    ];
  }, [
    pending.totalCount,
    permissions.canManageMembers,
    permissions.canViewAccommodation,
    permissions.canViewMeals,
    permissions.canManageMeals,
    permissions.membershipRole,
    permissions.canRaiseComplaint,
    permissions.canViewAllComplaints,
    permissions.canManageComplaints,
    permissions.canViewInventory,
    spaceId,
    t,
  ]);

  return (
    <AppLayout
      navSections={navSections}
      contentDense={isDashboardRoute}
      contentMaxWidth={isDashboardRoute ? false : undefined}
      headerLeading={
        <SpaceContextSelector
          spaceId={spaceId}
          spaceName={space?.spaceName}
          spaceType={space?.spaceType}
          membershipRole={space?.membershipRole}
        />
      }
      headerActions={
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
            '& .MuiButton-root': {
              height: DASHBOARD_UX.buttonHeight,
              px: `${DASHBOARD_UX.buttonPx}px`,
              fontSize: DASHBOARD_UX.button.fontSize,
              fontWeight: DASHBOARD_UX.button.fontWeight,
              borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
              textTransform: 'none',
            },
          }}
        >
          {spaceId ? <NotificationBellButton spaceId={spaceId} /> : null}
          <Button variant="outlined" onClick={() => navigate(ROUTES.mySpaces)}>
            {t('navigation.mySpaces')}
          </Button>
          <Button variant="outlined" onClick={() => navigate(ROUTES.profile)}>
            {t('navigation.profile')}
          </Button>
          <Button variant="outlined" color="primary" onClick={() => void logout()}>
            {t('common.logout')}
          </Button>
        </Box>
      }
      sidebarFooter={
        <Typography
          sx={{
            ...DASHBOARD_UX.sidebarAccount,
            color: 'text.primary',
            px: 0.5,
          }}
        >
          {displayName}
        </Typography>
      }
    >
      <Outlet />
    </AppLayout>
  );
}
