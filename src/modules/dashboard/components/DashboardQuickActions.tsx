import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  useTheme,
} from '@mui/material';
import {
  ArrowLeftRight,
  Bell,
  Building2,
  Lock,
  LogOut,
  Package,
  UserPlus,
  Users,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  spaceMembersAddChoicePath,
  spaceBedInventoryPath,
  spaceInventoryPath,
  spaceMealsPath,
  spaceMembersPath,
  spaceNotificationsPath,
  spaceOccupancyWizardPath,
  spacePaymentsPath,
} from '@/routes/paths';
import { isAccommodationApplicable } from '@/shared/utils/spacePermissions';
import { canManagePayments } from '@/shared/utils/dashboardFinancial';
import type { MembershipRole, SpacePermissionsResponse, SpaceType } from '@/shared/types/space';
import { useSpaceProgressiveAccess } from '@/modules/dashboard/hooks/useSpaceProgressiveAccess';
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
  const { getCapability } = useSpaceProgressiveAccess(isOperator ? spaceId : null);
  const [residentsOpen, setResidentsOpen] = useState(false);

  const accommodationApplicable = spaceType ? isAccommodationApplicable(spaceType) : true;
  const isMess = spaceType === 'MESS';
  const mealsHidden =
    getCapability('MEAL_CONFIG')?.mode === 'HIDDEN' &&
    getCapability('MEAL_OPS')?.mode === 'HIDDEN';
  const membersLocked = getCapability('MEMBERS')?.mode === 'LOCKED';
  const showResidents =
    permissions.canManageOccupancy &&
    accommodationApplicable &&
    getCapability('ACCOMMODATION')?.mode !== 'HIDDEN';
  const showMeals =
    permissions.canManageMeals === true &&
    !mealsHidden &&
    getCapability('MEAL_CONFIG')?.mode !== 'HIDDEN';
  const showPayments = canManagePayments(permissions.membershipRole);
  const showInventory =
    permissions.canViewInventory === true && getCapability('INVENTORY')?.mode !== 'HIDDEN';
  const showAddCustomers =
    isOperator &&
    permissions.canManageMembers &&
    isMess &&
    getCapability('MEMBERS')?.mode !== 'HIDDEN';

  const closeResidents = () => setResidentsOpen(false);

  const residentActions = [
    {
      key: 'allocate',
      label: t('dashboard.quickActions.allocate', { defaultValue: 'Allocate' }),
      hint: t('dashboard.quickActions.allocateHint', {
        defaultValue: 'Allocate a new resident to a bed',
      }),
      icon: <UserPlus size={18} />,
      onClick: () => {
        closeResidents();
        navigate(spaceBedInventoryPath(spaceId, 'AVAILABLE', { intent: 'allocate' }));
      },
    },
    {
      key: 'reserve',
      label: t('dashboard.quickActions.reserve', { defaultValue: 'Reserve' }),
      hint: t('dashboard.quickActions.reserveHint', {
        defaultValue: 'Hold a bed for an upcoming move-in',
      }),
      icon: <Lock size={18} />,
      onClick: () => {
        closeResidents();
        navigate(spaceBedInventoryPath(spaceId, 'AVAILABLE', { intent: 'reserve' }));
      },
    },
    {
      key: 'transfer',
      label: t('dashboard.quickActions.transfer', { defaultValue: 'Transfer' }),
      hint: t('dashboard.quickActions.transferHint', {
        defaultValue: 'Move resident to another room/bed',
      }),
      icon: <ArrowLeftRight size={18} />,
      onClick: () => {
        closeResidents();
        navigate(spaceOccupancyWizardPath(spaceId, 'TRANSFER'));
      },
    },
    {
      key: 'vacate',
      label: t('dashboard.quickActions.vacate', { defaultValue: 'Vacate' }),
      hint: t('dashboard.quickActions.vacateHint', {
        defaultValue: 'Remove resident from bed',
      }),
      icon: <LogOut size={18} />,
      onClick: () => {
        closeResidents();
        navigate(spaceOccupancyWizardPath(spaceId, 'VACATE'));
      },
      destructive: true,
    },
  ];

  const tiles: ReactNode[] = [];

  if (isOperator && showResidents) {
    tiles.push(
      <QuickActionTile
        key="residents"
        tone="success"
        icon={Building2}
        title={t('dashboard.quickActions.residents')}
        subtitle={t('dashboard.quickActions.residentsSubtitle')}
        onClick={() => setResidentsOpen(true)}
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
  if (isOperator && showPayments) {
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
        onClick={() => navigate(spaceMembersAddChoicePath(spaceId))}
      />,
    );
  } else if (isOperator && permissions.canManageMembers && !isMess && !membersLocked) {
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
  } else if (isOperator && permissions.canManageMembers && !isMess && membersLocked) {
    tiles.push(
      <QuickActionTile
        key="members"
        tone="purple"
        icon={Users}
        title={t('dashboard.quickActions.members')}
        subtitle={t('spaceLifecycle.capabilities.members.lockedProperty')}
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
    <>
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

      <Dialog
        open={residentsOpen}
        onClose={closeResidents}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: `${DASHBOARD_UX.radius}px`,
              border: `1px solid ${s.border}`,
              boxShadow: s.shadowHover,
            },
          },
        }}
      >
        <DialogTitle sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, pb: 0.5 }}>
          {t('dashboard.quickActions.residents')}
        </DialogTitle>
        <DialogContent sx={{ px: 1, pb: 1.5 }}>
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, px: 1.5, mb: 1 }}>
            {t('dashboard.quickActions.residentsSubtitle')}
          </Typography>
          <List dense disablePadding>
            {residentActions.map((action) => (
              <ListItemButton
                key={action.key}
                onClick={action.onClick}
                sx={{
                  borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                  mx: 0.5,
                  alignItems: 'flex-start',
                  gap: 1.25,
                }}
              >
                <Box
                  sx={{
                    mt: 0.25,
                    color: action.destructive ? theme.palette.error.main : theme.palette.primary.main,
                  }}
                >
                  {action.icon}
                </Box>
                <ListItemText
                  primary={action.label}
                  secondary={action.hint}
                  primaryTypographyProps={{
                    sx: {
                      ...DASHBOARD_UX.bodyStrong,
                      color: action.destructive ? theme.palette.error.main : s.textPrimary,
                    },
                  }}
                  secondaryTypographyProps={{
                    sx: { ...DASHBOARD_UX.metricCaption, color: s.textSecondary },
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </>
  );
}
