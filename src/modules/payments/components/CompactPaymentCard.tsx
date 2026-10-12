import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { StatusChip } from '@/shared/components/StatusChip';
import type { SpacePaymentResponse } from '@/shared/types/payments';
import { OwnerPaymentRowActions } from './OwnerPaymentRowActions';
import {
  canOwnerMarkPaymentReceived,
  canOwnerSendPaymentReminder,
  paymentStatusLabelKey,
  paymentStatusTone,
} from '../utils/paymentHelpers';

function wholeRupees(amount: number | null | undefined, currencyCode = 'INR'): string | null {
  if (amount == null || Number.isNaN(Number(amount))) {
    return null;
  }
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currencyCode || 'INR',
      maximumFractionDigits: 0,
    }).format(Math.round(Number(amount)));
  } catch {
    return `₹${Math.round(Number(amount))}`;
  }
}

type CompactPaymentCardProps = {
  payment: SpacePaymentResponse;
  selected?: boolean;
  showMember?: boolean;
  receivedLoading?: boolean;
  reminderLoading?: boolean;
  onOpen?: () => void;
  onReceived?: () => void;
  onReminder?: () => void;
};

export function CompactPaymentCard({
  payment,
  selected = false,
  showMember = true,
  receivedLoading = false,
  reminderLoading = false,
  onOpen,
  onReceived,
  onReminder,
}: CompactPaymentCardProps) {
  const { t } = useTranslation();
  const s = dashSurfaces('light');
  const status = payment.paymentStatus ?? payment.status ?? 'PENDING';
  const showReceived = Boolean(onReceived) && canOwnerMarkPaymentReceived(status);
  const showReminder = Boolean(onReminder) && canOwnerSendPaymentReminder(payment.reminderEligible);
  const name = payment.memberName?.trim() || payment.title;
  const initial = name.charAt(0).toUpperCase() || '?';
  const period = payment.month
    ? new Date(`${payment.month}-01T00:00:00`).toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric',
      })
    : '';
  const heading =
    period && !payment.title.toLowerCase().includes(period.toLowerCase())
      ? `${payment.title} — ${period}`
      : payment.title;
  const amount = wholeRupees(payment.amount, payment.currencyCode);
  const badgeLabel = payment.isOverdue
    ? t('paymentCollection.overdue.badge')
    : t(paymentStatusLabelKey(status));

  return (
    <Box
      sx={{
        border: `1px solid ${selected ? s.textPrimary : s.border}`,
        borderRadius: `${DASHBOARD_UX.radius}px`,
        bgcolor: s.surface,
        boxShadow: s.shadow,
        px: 1.5,
        py: 1.25,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75,
      }}
    >
      <Box
        component={onOpen ? 'button' : 'div'}
        type={onOpen ? 'button' : undefined}
        onClick={onOpen}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0.75,
          width: '100%',
          p: 0,
          border: 0,
          bgcolor: 'transparent',
          textAlign: 'left',
          font: 'inherit',
          cursor: onOpen ? 'pointer' : 'default',
        }}
      >
        <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '18px',
              bgcolor: '#ECFDF5',
              color: '#047857',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {initial}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <Typography sx={{ ...DASHBOARD_UX.link, fontWeight: 700, color: s.textPrimary }}>
                {showMember ? name : heading}
              </Typography>
              <StatusChip
                label={badgeLabel}
                tone={payment.isOverdue ? 'error' : paymentStatusTone(status)}
              />
            </Box>
            {showMember && payment.memberMobile ? (
              <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textSecondary }}>
                {payment.memberMobile}
              </Typography>
            ) : null}
            {payment.targetLabel ? (
              <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textSecondary }}>
                {payment.targetLabel}
              </Typography>
            ) : null}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
          <Typography sx={{ ...DASHBOARD_UX.body, fontWeight: 600, color: s.textPrimary, flex: 1, minWidth: 0 }}>
            {showMember ? heading : t(`paymentCollection.type.${payment.paymentType}`)}
          </Typography>
          {amount ? (
            <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, flexShrink: 1 }}>
              {amount}
            </Typography>
          ) : null}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
          <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textSecondary }}>
            {t('paymentCollection.dueDate', { date: payment.dueDate })}
          </Typography>
          {payment.isOverdue ? (
            <Typography sx={{ ...DASHBOARD_UX.caption, color: '#B91C1C', fontWeight: 700 }}>
              {t('paymentCollection.overdue.compact', { count: payment.daysOverdue ?? 0 })}
            </Typography>
          ) : null}
        </Box>
      </Box>
      {showReceived || showReminder ? (
        <OwnerPaymentRowActions
          showReceived={showReceived}
          showReminder={showReminder}
          receivedLoading={receivedLoading}
          reminderLoading={reminderLoading}
          onReceived={onReceived ?? (() => undefined)}
          onReminder={onReminder ?? (() => undefined)}
        />
      ) : null}
    </Box>
  );
}
