import { CircularProgress, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { formatPaymentAmount } from '@/modules/meals/utils/paymentAmount';
import { useOccupiedBedStay } from '../hooks/useOccupiedBedStay';
import {
  bedCardBalanceFace,
  type BedCardBalanceFace,
  type OccupantPaymentSummary,
  type StayChargeKind,
} from '../utils/occupantPaymentSummary';

function money(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
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
  return <BedBalanceSummary summary={stay.summary} />;
}

function wholeRupees(amount: number): string {
  return formatPaymentAmount(Math.round(amount)) ?? `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

function chargeLabel(
  kind: StayChargeKind,
  compactDeposit: boolean,
  t: (key: string, options?: { defaultValue?: string }) => string,
): string {
  if (kind === 'RENT') {
    return t('accommodation.fields.rent', { defaultValue: 'Rent' });
  }
  if (kind === 'DEPOSIT') {
    return compactDeposit
      ? t('accommodation.stayPayment.depositShort', { defaultValue: 'Dep' })
      : t('accommodation.fields.deposit', { defaultValue: 'Deposit' });
  }
  return t('accommodation.stayPayment.otherShort', { defaultValue: 'Other' });
}

function balanceSecondary(
  face: Extract<BedCardBalanceFace, { kind: 'balance' }>,
  t: (key: string, options?: { defaultValue?: string; amount?: string }) => string,
): string | null {
  const parts: string[] = [];
  if (face.paid != null) {
    parts.push(
      t('accommodation.stayPayment.paidAmount', {
        defaultValue: '{{amount}} paid',
        amount: wholeRupees(face.paid),
      }),
    );
  }
  for (const line of face.lines) {
    parts.push(`${chargeLabel(line.kind, face.paid != null, t)} ${wholeRupees(line.amount)}`);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

function BedBalanceSummary({ summary }: { summary: OccupantPaymentSummary }) {
  const { t } = useTranslation();
  const face = bedCardBalanceFace(summary);

  if (face.kind === 'note') {
    const title =
      face.status === 'NO_RECORD'
        ? t('accommodation.stayPayment.noRecord', { defaultValue: 'No payment record' })
        : face.status === 'UNDER_REVIEW'
          ? t('accommodation.stayPayment.underReview', { defaultValue: 'Under review' })
          : t('accommodation.stayPayment.unavailable', { defaultValue: 'Payment status unavailable' });
    return <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{title}</Typography>;
  }

  if (face.kind === 'paid') {
    const paidLabel = t('accommodation.stayPayment.paidShort', { defaultValue: 'Paid' });
    const paidDetail =
      face.paid != null
        ? t('accommodation.stayPayment.paidAmount', {
            defaultValue: '{{amount}} paid',
            amount: wholeRupees(face.paid),
          })
        : null;
    return (
      <Stack spacing={0.25} aria-label={[paidLabel, paidDetail].filter(Boolean).join(', ')}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'success.main' }}>{paidLabel}</Typography>
        {paidDetail ? (
          <Typography sx={{ fontSize: 16, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
            {paidDetail}
          </Typography>
        ) : null}
      </Stack>
    );
  }

  const balanceLabel = t('accommodation.stayPayment.balanceDue', { defaultValue: 'Balance due' });
  const amount = wholeRupees(face.outstanding);
  const secondary = balanceSecondary(face, t);
  return (
    <Stack
      spacing={0.15}
      sx={{ minWidth: 0, width: '100%' }}
      aria-label={[balanceLabel, amount, secondary].filter(Boolean).join(', ')}
    >
      <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'error.main', lineHeight: 1.2 }}>
        {balanceLabel}
      </Typography>
      <Typography
        sx={{
          fontSize: { xs: 18, sm: 20 },
          fontWeight: 800,
          color: 'error.main',
          lineHeight: 1.15,
          fontVariantNumeric: 'tabular-nums',
          overflowWrap: 'anywhere',
        }}
      >
        {amount}
      </Typography>
      {secondary ? (
        <Typography sx={{ fontSize: 11, lineHeight: 1.35, color: 'text.secondary', overflowWrap: 'anywhere' }}>
          {secondary}
        </Typography>
      ) : null}
    </Stack>
  );
}
