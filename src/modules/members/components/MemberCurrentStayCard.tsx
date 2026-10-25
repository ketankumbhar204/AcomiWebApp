import { Box, Button, Chip, Stack, Typography, useTheme } from '@mui/material';
import { History } from 'lucide-react';
import { StayTrailLine } from '@/shared/components/ContactAndStayMeta';
import { formatPaymentStayLabel } from '@/shared/utils/stayTrail';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { InfoRow } from '@/shared/components/InfoRow';
import { StatusChip } from '@/shared/components/StatusChip';
import { colors } from '@/shared/theme/colors';
import { formatCurrency } from '@/shared/utils/dashboardFinancial';
import {
  occupiedDayCount,
  occupancyLocationLines,
  stayExitDate,
  stayMonthlyTotal,
  type StayRecord,
} from '../utils/memberStayDisplay';

type MemberCurrentStayCardProps = {
  stay: StayRecord | null;
  reserved?: boolean;
  amenities?: { code: string; label: string }[] | null;
  onViewHistory?: () => void;
};

function formatStayDate(value: string | null | undefined, notSet: string): string {
  if (!value) {
    return notSet;
  }
  const date = new Date(value.slice(0, 10) + 'T00:00:00');
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString();
}

export function MemberCurrentStayCard({
  stay,
  reserved = false,
  amenities,
  onViewHistory,
}: MemberCurrentStayCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const notSet = t('occupancy.section.notSet');
  const notRecorded = t('occupancy.contract.notRecorded');
  const lines = occupancyLocationLines(stay);
  const moveIn = stay?.actualMoveInAt ?? stay?.moveInDate ?? null;
  const occupiedDays = reserved ? null : occupiedDayCount(moveIn);
  const monthlyTotal = stayMonthlyTotal(stay);
  const status = stay?.occupancyStatus ?? stay?.status ?? null;
  const statusLabel =
    status === 'ACTIVE' || status === 'ALLOCATED'
      ? t('occupancy.memberStatus.ALLOCATED')
      : status === 'RESERVED'
        ? t('occupancy.memberStatus.RESERVED')
        : status ?? notSet;

  const foodValue = !stay
    ? notSet
    : stay.foodIncludedInRent
      ? t('occupancy.contract.foodYes')
      : stay.foodEnabled
        ? stay.foodChargeSnapshot != null
          ? formatCurrency(stay.foodChargeSnapshot)
          : t('occupancy.contract.foodIncludedNoAmount')
        : t('occupancy.contract.foodNo');

  return (
    <Box
      sx={{
        border: `1px solid ${s.border}`,
        borderRadius: `${DASHBOARD_UX.tileRadius}px`,
        bgcolor: s.surface,
        boxShadow: s.shadow,
        p: 1.5,
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5, flexWrap: 'wrap' }}>
        <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary, flex: 1 }}>
          {reserved ? t('occupancy.section.reservedStay') : t('occupancy.section.title')}
        </Typography>
        <StatusChip label={statusLabel} tone={reserved ? 'warning' : 'success'} />
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 2,
        }}
      >
        <Box>
          <StayTrailLine
            label={formatPaymentStayLabel({
              buildingName: stay?.buildingName,
              floorName: stay?.floorName,
              unitName: stay?.unitName,
              roomName: stay?.roomName,
              bedName: stay?.bedName,
            })}
            sx={{ mb: 1 }}
          />
          {lines.map((line) => (
            <InfoRow key={line.labelKey} label={t(line.labelKey)} value={line.value} dense />
          ))}
          <InfoRow
            label={t('occupancy.section.moveInDate')}
            value={formatStayDate(moveIn, notSet)}
            dense
          />
          {reserved ? null : (
            <InfoRow
              label={t('occupancy.section.occupiedFor')}
              value={
                occupiedDays == null
                  ? notSet
                  : t('occupancy.section.occupiedDays', { count: occupiedDays })
              }
              dense
            />
          )}
          <InfoRow
            label={t('occupancy.section.expectedMoveOut')}
            value={formatStayDate(stayExitDate(stay), notSet)}
            dense
          />
        </Box>
        <Box>
          <InfoRow
            label={t('occupancy.contract.rent')}
            value={stay?.rentSnapshot == null ? notRecorded : formatCurrency(stay.rentSnapshot)}
            dense
          />
          <InfoRow
            label={t(
              stay?.foodEnabled && !stay.foodIncludedInRent
                ? 'occupancy.contract.monthlyTotalWithFood'
                : 'occupancy.contract.monthlyTotal',
            )}
            value={monthlyTotal == null ? notRecorded : formatCurrency(monthlyTotal)}
            dense
          />
          <InfoRow
            label={t('occupancy.contract.deposit')}
            value={
              stay?.depositSnapshot == null ? notRecorded : formatCurrency(stay.depositSnapshot)
            }
            dense
          />
          <InfoRow label={t('occupancy.contract.foodIncluded')} value={foodValue} dense />
          {stay?.otherCharges?.map((charge, index) => (
            <InfoRow
              key={charge.chargeSnapshotId ?? `${charge.label ?? 'charge'}-${index}`}
              label={charge.label || t('occupancy.contract.otherCharges')}
              value={charge.amount == null ? notRecorded : formatCurrency(charge.amount)}
              dense
            />
          ))}
        </Box>
      </Box>

      {amenities && amenities.length > 0 ? (
        <Box sx={{ mt: 1.5 }}>
          <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textMuted, mb: 0.75 }}>
            {t('occupancy.amenities.assigned')}
          </Typography>
          <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap' }}>
            {amenities.map((item) => (
              <Chip
                key={item.code || item.label}
                size="small"
                label={item.label}
                sx={{ bgcolor: colors.lightGreen, color: colors.primaryDark }}
              />
            ))}
          </Stack>
        </Box>
      ) : null}

      {onViewHistory ? (
        <Button
          size="small"
          startIcon={<History size={14} />}
          onClick={onViewHistory}
          sx={{ mt: 1.5, textTransform: 'none', color: colors.primaryDark }}
        >
          {t('occupancy.actions.viewHistoryShort')}
        </Button>
      ) : null}
    </Box>
  );
}
