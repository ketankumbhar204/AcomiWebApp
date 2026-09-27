import { Button, Stack, Typography, useTheme } from '@mui/material';
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
            label: t('occupancy.actions.allocate'),
            icon: <UserPlus size={16} />,
            tint: occupancyActionTint.allocate,
            onClick: onAllocate,
          },
        ]
      : []),
    ...(isAvailable && onReserve
      ? [
          {
            id: 'reserve',
            label: t('occupancy.actions.reserve'),
            icon: <CalendarDays size={16} />,
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
            sx={occupancyActionButtonSx(action.tint)}
          >
            {action.label}
          </Button>
        ))}
      </Stack>
    </Stack>
  );
}
