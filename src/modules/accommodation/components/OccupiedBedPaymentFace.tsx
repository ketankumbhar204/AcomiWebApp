import { Box, CircularProgress, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { formatPaymentAmount } from '@/modules/meals/utils/paymentAmount';
import type { OccupancyResponse } from '@/shared/types/accommodation';
import { useOccupiedBedStay } from '../hooks/useOccupiedBedStay';
import {
  bedCardBalanceFace,
  type OccupantPaymentSummary,
} from '../utils/occupantPaymentSummary';
import {
  formatOccupancyRentRate,
  isOpenEndedDailyRate,
} from '../utils/stayFinancialDisplay';

function money(amount: number): string {
  return formatPaymentAmount(Math.round(amount)) ?? `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

export function occupiedPaymentCopy(
  summary: OccupantPaymentSummary,
  t: (key: string, options?: { defaultValue?: string; amount?: string }) => string,
): { title: string; detail: string | null } {
  if (summary.status === 'NO_RECORD') {
    return { title: t('accommodation.stayPayment.noRecord', { defaultValue: 'No payment record' }), detail: null };
  }
  if (summary.status === 'UNAVAILABLE') {
    return {
      title: t('accommodation.stayPayment.unavailable', { defaultValue: 'Payment status unavailable' }),
      detail: null,
    };
  }
  if (summary.status === 'UNDER_REVIEW') {
    return { title: t('accommodation.stayPayment.underReview', { defaultValue: 'Under review' }), detail: null };
  }
  if (summary.status === 'PAID') {
    return {
      title: t('accommodation.stayPayment.paid', { defaultValue: 'Payment status: Paid' }),
      detail:
        summary.amountPaid != null
          ? t('accommodation.stayPayment.paidAmount', {
              defaultValue: '{{amount}} paid',
              amount: money(summary.amountPaid),
            })
          : null,
    };
  }
  if (summary.status === 'PARTIALLY_PAID') {
    const parts = [
      summary.amountPaid != null
        ? t('accommodation.stayPayment.paidAmount', {
            defaultValue: '{{amount}} paid',
            amount: money(summary.amountPaid),
          })
        : null,
      summary.outstanding != null
        ? t('accommodation.stayPayment.remaining', {
            defaultValue: '{{amount}} remaining',
            amount: money(summary.outstanding),
          })
        : null,
    ].filter(Boolean);
    return {
      title: t('accommodation.stayPayment.partial', { defaultValue: 'Partially paid' }),
      detail: parts.length > 0 ? parts.join(' · ') : null,
    };
  }
  return {
    title: t('accommodation.stayPayment.pending', { defaultValue: 'Pending payment' }),
    detail:
      summary.outstanding != null
        ? t('accommodation.stayPayment.pendingAmount', {
            defaultValue: '{{amount}} pending',
            amount: money(summary.outstanding),
          })
        : null,
  };
}

export function OccupiedBedPaymentFace({ spaceId, bedId }: { spaceId?: string; bedId: string }) {
  const { t } = useTranslation();
  const stay = useOccupiedBedStay(spaceId, bedId, true);

  if (stay.loading) {
    return <CircularProgress size={16} />;
  }
  if (stay.error || !stay.summary) {
    return (
      <Typography sx={{ fontSize: 12, fontWeight: 700 }}>
        {t('accommodation.stayPayment.unavailable', { defaultValue: 'Payment status unavailable' })}
      </Typography>
    );
  }
  if (!stay.occupancy) {
    return (
      <Typography sx={{ fontSize: 12, fontWeight: 700 }}>
        {t('accommodation.stayPayment.noTenant', { defaultValue: 'No linked tenant' })}
      </Typography>
    );
  }
  return (
    <BedBalanceSummary
      summary={stay.summary}
      occupancy={stay.occupancy}
      notYetBilled={isOpenEndedDailyRate(stay.occupancy)}
    />
  );
}

function BalanceDueLine({ label, value }: { label: string; value: string }) {
  return (
    <Typography sx={{ fontSize: 12, lineHeight: '16px', fontWeight: 600, color: 'text.primary' }} noWrap>
      <Box component="span" sx={{ fontWeight: 600 }}>
        {label}:{' '}
      </Box>
      <Box component="span" sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Box>
    </Typography>
  );
}

function MetaLine({ text }: { text: string }) {
  return (
    <Typography sx={{ fontSize: 11, lineHeight: '15px', fontWeight: 500, color: 'text.secondary' }} noWrap>
      {text}
    </Typography>
  );
}

const pricingChipSx = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 0.5,
  px: 1,
  py: 0.5,
  borderRadius: 1,
  bgcolor: 'rgba(255,255,255,0.72)',
  border: '1px solid rgba(148,163,184,0.35)',
} as const;

function PricingChip({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={pricingChipSx}>
      <Typography sx={{ fontSize: 10, fontWeight: 600, color: 'text.secondary' }} noWrap>
        {label}
      </Typography>
      <Typography
        sx={{ fontSize: 11, fontWeight: 700, color: 'text.primary', fontVariantNumeric: 'tabular-nums' }}
        noWrap
      >
        {value}
      </Typography>
    </Box>
  );
}

function occupancyRentChip(
  occupancy: OccupancyResponse,
  t: (key: string, options?: { defaultValue?: string }) => string,
): { label: string; value: string } | null {
  const notRecorded = t('accommodation.pricingConfirm.notSet', { defaultValue: 'Not set' });
  const rate = formatOccupancyRentRate(occupancy, notRecorded);
  if (!rate.value || rate.value === notRecorded) {
    return null;
  }
  return {
    label: t(rate.labelKey, { defaultValue: rate.labelDefault }),
    value: rate.value,
  };
}

function occupancyDepositChip(
  occupancy: OccupancyResponse,
  t: (key: string, options?: { defaultValue?: string }) => string,
): { label: string; value: string } | null {
  if (occupancy.depositSnapshot == null) {
    return null;
  }
  return {
    label: t('accommodation.fields.deposit', { defaultValue: 'Deposit' }),
    value: money(occupancy.depositSnapshot),
  };
}

function BedBalanceSummary({
  summary,
  occupancy,
  notYetBilled = false,
}: {
  summary: OccupantPaymentSummary;
  occupancy: OccupancyResponse;
  notYetBilled?: boolean;
}) {
  const { t } = useTranslation();
  const face = bedCardBalanceFace(summary);
  const rentUnbilled = notYetBilled && summary.rent == null;
  const rentChip = occupancyRentChip(occupancy, t);
  const depositChip = occupancyDepositChip(occupancy, t);
  const pricingChips = (
    <>
      {rentChip ? <PricingChip label={rentChip.label} value={rentChip.value} /> : null}
      {depositChip ? <PricingChip label={depositChip.label} value={depositChip.value} /> : null}
    </>
  );

  if (rentUnbilled) {
    const title = t('accommodation.stayPayment.notYetBilled', { defaultValue: 'Not Yet Billed' });
    return (
      <Stack
        spacing={0.5}
        sx={{ minWidth: 0, width: '100%' }}
        aria-label={`Balance Due: ${title}`}
      >
        <BalanceDueLine
          label={t('accommodation.stayPayment.balanceDue', { defaultValue: 'Balance Due' })}
          value={title}
        />
        {pricingChips}
      </Stack>
    );
  }

  if (face.kind === 'note') {
    const title =
      face.status === 'NO_RECORD'
        ? t('accommodation.stayPayment.noRecord', { defaultValue: 'No payment record' })
        : face.status === 'UNDER_REVIEW'
          ? t('accommodation.stayPayment.underReview', { defaultValue: 'Under review' })
          : t('accommodation.stayPayment.unavailable', { defaultValue: 'Payment status unavailable' });
    return (
      <Stack spacing={0.5} sx={{ minWidth: 0, width: '100%' }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{title}</Typography>
        {pricingChips}
      </Stack>
    );
  }

  if (face.kind === 'paid') {
    const paidLabel = t('accommodation.stayPayment.paidShort', { defaultValue: 'Paid' });
    const paidDetail =
      face.paid != null
        ? t('accommodation.stayPayment.paidAmount', {
            defaultValue: '{{amount}} paid',
            amount: money(face.paid),
          })
        : null;
    return (
      <Stack
        spacing={0.5}
        sx={{ minWidth: 0, width: '100%' }}
        aria-label={[paidLabel, paidDetail].filter(Boolean).join(', ')}
      >
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'success.main' }}>{paidLabel}</Typography>
        {paidDetail ? <MetaLine text={paidDetail} /> : null}
        {pricingChips}
      </Stack>
    );
  }

  const balanceLabel = t('accommodation.stayPayment.balanceDue', { defaultValue: 'Balance Due' });
  const amount = money(face.outstanding);
  return (
    <Stack
      spacing={0.5}
      sx={{ minWidth: 0, width: '100%' }}
      aria-label={[
        balanceLabel,
        amount,
        rentChip ? `${rentChip.label} ${rentChip.value}` : null,
        depositChip ? `${depositChip.label} ${depositChip.value}` : null,
      ]
        .filter(Boolean)
        .join(', ')}
    >
      <BalanceDueLine label={balanceLabel} value={amount} />
      {pricingChips}
    </Stack>
  );
}
