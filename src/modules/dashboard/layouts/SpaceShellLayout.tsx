import { Box, Button, Typography } from '@mui/material';
import {
  Bell,
  Building2,
  ClipboardList,
  Clock3,
  LayoutDashboard,
  Package,
  TriangleAlert,
  Users,
  UserRound,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import type { AppNavSection } from '@/layouts/navTypes';
import { useLogout } from '@/modules/auth/hooks/useLogout';
import {
  CustomerSidebarProfile,
} from '@/modules/dashboard/components/customer/CustomerSidebarChrome';
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
  spaceMealsPollPath,
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
  const role = permissions.membershipRole;
  const isConsumer = role === 'CUSTOMER' || role === 'TENANT';
  const pending = usePendingActions(
    spaceId,
    isOperator || permissions.membershipRole != null,
    isOperator,
  );

  const space = permissions.space;
  const displayName = user?.fullName?.trim() || user?.mobileNumber || '';
  const location = useLocation();
  const isDashboardRoute =
    location.pathname === spaceDashboardPath(spaceId) ||
    location.pathname === `/spaces/${spaceId}` ||
    location.pathname === `/spaces/${spaceId}/`;

  const navSections: AppNavSection[] = useMemo(() => {
    // Customer / tenant chrome — matches approved consumer mock.
    if (isConsumer && !isOperator) {
      const consumerItems: AppNavSection['items'] = [
        {
          id: 'dashboard',
          label: t('navigation.dashboard'),
          to: spaceDashboardPath(spaceId),
          icon: <LayoutDashboard size={16} />,
        },
      ];

      if (permissions.canViewMeals === true) {
        consumerItems.push({
          id: 'my-orders',
          label: t('dashboard.customer.quickActions.myOrders', { defaultValue: 'My Orders' }),
          to: spaceMealsPath(spaceId),
          icon: <ClipboardList size={16} />,
        });
      }

      if (permissions.membershipRole) {
        consumerItems.push({
          id: 'payments',
          label: t('navigation.payments'),
          to:
            space?.spaceType === 'MESS'
              ? spaceDayMealsPath(spaceId)
              : spacePaymentsPath(spaceId),
          icon: <Wallet size={16} />,
        });
      }

      const mayComplaints =
        permissions.canViewAllComplaints === true ||
        permissions.canManageComplaints === true ||
        canRaiseComplaint(permissions.membershipRole, permissions.canRaiseComplaint);
      if (mayComplaints) {
        consumerItems.push({
          id: 'complaints',
          label: t('navigation.complaints'),
          to: spaceComplaintsPath(spaceId),
          icon: <TriangleAlert size={16} />,
        });
      }

      consumerItems.push({
        id: 'notifications',
        label: t('notifications.title'),
        to: spaceNotificationsPath(spaceId),
        icon: <Bell size={16} />,
      });

      return [{ id: 'space', items: consumerItems }];
    }

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
    isConsumer,
    isOperator,
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
    space?.spaceType,
    spaceId,
    t,
  ]);

  const consumerChrome = isConsumer && !isOperator;
  const isCustomerMealsHome =
    consumerChrome &&
    (location.pathname === spaceMealsPath(spaceId) ||
      location.pathname === `${spaceMealsPath(spaceId)}/`);
  const isMealPollPage =
    location.pathname === spaceMealsPollPath(spaceId) ||
    location.pathname.startsWith(`${spaceMealsPollPath(spaceId)}/`);
  const isMealMenuEditorPage =
    location.pathname === `/spaces/${spaceId}/meals/edit` ||
    location.pathname.startsWith(`/spaces/${spaceId}/meals/edit/`);
  // Dashboard + My Orders + meal poll + menu editor own their page padding; other pages use ContentLayout.
  const useFullBleedContent =
    isDashboardRoute || isCustomerMealsHome || isMealPollPage || isMealMenuEditorPage;

  return (
    <AppLayout
      navSections={navSections}
      contentDense={useFullBleedContent}
      contentMaxWidth={useFullBleedContent ? false : undefined}
      padded={!useFullBleedContent}
      lockContentScroll={isMealMenuEditorPage}
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
              ...DASHBOARD_UX.button,
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
        consumerChrome ? (
          <CustomerSidebarProfile displayName={displayName} role={role} />
        ) : (
          <Typography
            sx={{
              ...DASHBOARD_UX.sidebarAccount,
              color: 'text.primary',
              px: 0.5,
            }}
          >
            {displayName}
          </Typography>
        )
      }
    >
      <Outlet />
    </AppLayout>
  );
}
