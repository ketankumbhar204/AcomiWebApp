import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { CircleCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';

export type OccupancySuccessOperation =
  | 'ALLOCATE'
  | 'RESERVE'
  | 'TRANSFER'
  | 'MOVE_IN'
  | 'VACATE';

type OccupancySuccessDialogProps = {
  open: boolean;
  operation: OccupancySuccessOperation;
  memberName: string;
  locationLabel: string;
  /** Owner-facing Stay Type label when known (Monthly / Daily / No Fixed Move-Out Date). */
  stayTypeLabel?: string | null;
  onViewDetails: () => void;
  onDone: () => void;
};

function headlineKey(operation: OccupancySuccessOperation): string {
  switch (operation) {
    case 'RESERVE':
      return 'occupancy.success.reservedHeadline';
    case 'TRANSFER':
      return 'occupancy.success.transferredHeadline';
    case 'MOVE_IN':
      return 'occupancy.success.movedInHeadline';
    case 'VACATE':
      return 'occupancy.success.vacatedHeadline';
    case 'ALLOCATE':
    default:
      return 'occupancy.success.allocatedHeadline';
  }
}

function detailKey(operation: OccupancySuccessOperation): string {
  switch (operation) {
    case 'RESERVE':
      return 'occupancy.success.reservedDetail';
    case 'TRANSFER':
      return 'occupancy.success.transferredDetail';
    case 'MOVE_IN':
      return 'occupancy.success.movedInDetail';
    case 'VACATE':
      return 'occupancy.success.vacatedDetail';
    case 'ALLOCATE':
    default:
      return 'occupancy.success.allocatedDetail';
  }
}

function primaryActionKey(operation: OccupancySuccessOperation): string {
  switch (operation) {
    case 'RESERVE':
      return 'occupancy.success.viewReservation';
    case 'TRANSFER':
    case 'MOVE_IN':
      return 'occupancy.success.viewStay';
    case 'VACATE':
      return 'occupancy.success.viewDetails';
    case 'ALLOCATE':
    default:
      return 'occupancy.success.viewDetails';
  }
}

export function OccupancySuccessDialog({
  open,
  operation,
  memberName,
  locationLabel,
  stayTypeLabel,
  onViewDetails,
  onDone,
}: OccupancySuccessDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Dialog
      open={open}
      onClose={onDone}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: `${DASHBOARD_UX.radius}px`,
            border: `1px solid ${s.border}`,
            boxShadow: s.shadowHover,
            textAlign: 'center',
            px: 1,
          },
        },
      }}
    >
      <DialogContent>
        <Stack spacing={1.5} sx={{ alignItems: 'center', pt: 1 }}>
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              bgcolor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <CircleCheck size={40} strokeWidth={1.75} aria-hidden />
          </Box>
          <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
            {t('occupancy.success.title', { defaultValue: 'Success' })}
          </Typography>
          <Typography sx={{ ...DASHBOARD_UX.bodyStrong, color: s.textPrimary }}>
            {t(headlineKey(operation), {
              defaultValue:
                operation === 'RESERVE'
                  ? 'Accommodation reserved successfully!'
                  : operation === 'TRANSFER'
                    ? 'Tenant transferred successfully!'
                    : operation === 'MOVE_IN'
                      ? 'Move-in completed successfully!'
                      : operation === 'VACATE'
                        ? 'Tenant vacated successfully!'
                        : 'Tenant allocated successfully!',
            })}
          </Typography>
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
            {t(detailKey(operation), {
              name: memberName,
              location: locationLabel || '—',
              defaultValue:
                operation === 'RESERVE'
                  ? '{{name}} has a reservation at {{location}}.'
                  : operation === 'TRANSFER'
                    ? '{{name}} has been transferred to {{location}}.'
                    : operation === 'MOVE_IN'
                      ? '{{name}} has moved into {{location}}.'
                      : operation === 'VACATE'
                        ? '{{name}} has been vacated from {{location}}.'
                        : '{{name}} has been allocated to {{location}}.',
            })}
          </Typography>
          {stayTypeLabel ? (
            <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
              {t('occupancyWizard.steps.stayType', { defaultValue: 'Stay type' })}
              {': '}
              {stayTypeLabel}
            </Typography>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1, flexDirection: 'column' }}>
        <Button fullWidth variant="contained" onClick={onViewDetails} sx={dashContainedButtonSx}>
          {t(primaryActionKey(operation), {
            defaultValue:
              operation === 'RESERVE'
                ? 'View reservation'
                : operation === 'ALLOCATE'
                  ? 'View details'
                  : 'View stay',
          })}
        </Button>
        <Button fullWidth onClick={onDone} sx={dashOutlinedButtonSx}>
          {t('common.done')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
