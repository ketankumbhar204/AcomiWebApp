import { Button, CircularProgress, Stack, Typography, useTheme } from '@mui/material';
import {
  ArrowRightLeft,
  CalendarDays,
  History,
  LogIn,
  LogOut,
  UserPlus,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import type { AccommodationStatus } from '@/shared/types/accommodation';
import { occupancyActionButtonSx, occupancyActionTint } from '../utils/occupancyActionTints';

export type OccupancyActionButtonsProps = {
  status?: AccommodationStatus | string;
  occupancyId?: string | null;
  memberId?: string | null;
  canManage?: boolean;
  title?: string;
  onAllocate?: () => void;
  onReserve?: () => void;
  pendingAction?: 'allocate' | 'reserve' | null;
  onMoveIn?: () => void;
  onCancel?: () => void;
  onTransfer?: () => void;
  onVacate?: () => void;
  onViewHistory?: () => void;
};

export function OccupancyActionButtons({
  status,
  occupancyId,
  memberId,
  canManage = true,
  title,
  onAllocate,
  onReserve,
  pendingAction = null,
  onMoveIn,
  onCancel,
  onTransfer,
  onVacate,
  onViewHistory,
}: OccupancyActionButtonsProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  if (!canManage) {
    return null;
  }

  const isAvailable = status === 'AVAILABLE';
  const isReserved = status === 'RESERVED';
  const isOccupied = status === 'OCCUPIED';

  const buttons = [
    ...(isAvailable && onAllocate
      ? [
          {
            id: 'allocate',
            label:
              pendingAction === 'allocate'
                ? t('occupancy.actions.openingAllocation', { defaultValue: 'Opening allocation…' })
                : t('occupancy.actions.allocate'),
            icon:
              pendingAction === 'allocate' ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <UserPlus size={16} />
              ),
            tint: occupancyActionTint.allocate,
            onClick: onAllocate,
          },
        ]
      : []),
    ...(isAvailable && onReserve
      ? [
          {
            id: 'reserve',
            label:
              pendingAction === 'reserve'
                ? t('occupancy.actions.openingReservation', { defaultValue: 'Opening reservation…' })
                : t('occupancy.actions.reserve'),
            icon:
              pendingAction === 'reserve' ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <CalendarDays size={16} />
              ),
            tint: occupancyActionTint.reserve,
            onClick: onReserve,
          },
        ]
      : []),
    ...(isReserved && onMoveIn
      ? [
          {
            id: 'moveIn',
            label: t('occupancy.actions.moveIn'),
            icon: <LogIn size={16} />,
            tint: occupancyActionTint.moveIn,
            onClick: onMoveIn,
          },
        ]
      : []),
    ...(isReserved && (occupancyId || onCancel) && onCancel
      ? [
          {
            id: 'cancel',
            label: t('occupancy.actions.cancelReservation'),
            icon: <X size={16} />,
            tint: occupancyActionTint.cancel,
            onClick: onCancel,
          },
        ]
      : []),
    ...(isOccupied && onTransfer
      ? [
          {
            id: 'transfer',
            label: t('occupancy.actions.transfer'),
            icon: <ArrowRightLeft size={16} />,
            tint: occupancyActionTint.transfer,
            onClick: onTransfer,
          },
        ]
      : []),
    ...(isOccupied && onVacate
      ? [
          {
            id: 'vacate',
            label: t('occupancy.actions.vacate'),
            icon: <LogOut size={16} />,
            tint: occupancyActionTint.vacate,
            onClick: onVacate,
          },
        ]
      : []),
    ...(memberId && onViewHistory
      ? [
          {
            id: 'history',
            label: t('accommodation.workspace.viewHistory', { defaultValue: 'View History' }),
            icon: <History size={16} />,
            tint: occupancyActionTint.viewHistory,
            onClick: onViewHistory,
          },
        ]
      : []),
  ];

  if (buttons.length === 0) {
    return null;
  }

  return (
    <Stack spacing={1}>
      {title ? (
        <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textPrimary }}>{title}</Typography>
      ) : null}
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        {buttons.map((action) => (
          <Button
            key={action.id}
            size="small"
            variant="outlined"
            startIcon={action.icon}
            onClick={action.onClick}
            disabled={pendingAction != null}
            aria-busy={pendingAction === action.id}
            sx={occupancyActionButtonSx(action.tint)}
          >
            {action.label}
          </Button>
        ))}
      </Stack>
    </Stack>
  );
}
