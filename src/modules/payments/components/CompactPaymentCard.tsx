import { Box, Typography } from '@mui/material';
import { BedSingle, CalendarDays } from 'lucide-react';
import { ContactNumberLine } from '@/shared/components/ContactAndStayMeta';
import { usePaymentStayTrail } from '../hooks/usePaymentStayTrail';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { StatusChip } from '@/shared/components/StatusChip';
import type { SpacePaymentResponse } from '@/shared/types/payments';
import { OwnerPaymentRowActions } from './OwnerPaymentRowActions';
import {
  canOwnerMarkPaymentReceived,
  canOwnerSendPaymentReminder,
  paymentStatusTone,
} from '../utils/paymentHelpers';
import { paymentDisplayTitle } from '../utils/paymentDisplay';
import {
  paymentListDisplayStatus,
  paymentListStatusLabelKey,
} from '../utils/paymentRefundDisplay';

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

/** Keep hierarchy; mock uses bullet separators instead of arrows. */
function locationDisplay(label: string | null | undefined): string | null {
  const raw = label?.trim() ?? '';
  if (!raw) {
    return null;
  }
  return raw
    .split(/\s*(?:→|[•·|])\s*/)
    .map(part => part.trim())
    .filter(Boolean)
    .join(' • ');
}

function panelTint(listStatus: string, isOverdue: boolean): string {
  if (listStatus === 'OVERDUE' || isOverdue) {
    return '#FEF2F2';
  }
  switch (listStatus) {
    case 'PAID':
      return '#ECFDF5';
    case 'PENDING':
      return '#FFFBEB';
    case 'UNDER_REVIEW':
    case 'PROOF_UPLOADED':
      return '#EFF6FF';
    case 'UPDATE_REQUESTED':
    case 'PARTIALLY_REFUNDED':
    case 'REFUNDED':
      return '#FFF7ED';
    case 'REJECTED':
      return '#FEF2F2';
    default:
      return '#F8FAFC';
  }
}

function shortDayMonth(iso: string | null | undefined): string | null {
  if (!iso) {
    return null;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) {
    return iso;
  }
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function shortBillingPeriod(monthIso: string | null | undefined): string | null {
  if (!monthIso) {
    return null;
  }
  const [yearPart, monthPart] = monthIso.split('-');
  const year = Number(yearPart);
  const month = Number(monthPart);
  if (!year || !month) {
    return monthIso;
  }
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  });
}

/** Same billable-days line the mobile payment card shows under the calendar icon. */
function billedDaysLine(payment: SpacePaymentResponse): string | null {
  if (
    payment.paymentType !== 'RENT' ||
    payment.billableDays == null ||
    payment.billableDays <= 0 ||
    !payment.billingPeriodStart ||
    !payment.billingPeriodEnd
  ) {
    return null;
  }
  const showPartial =
    payment.isProrated === true ||
    (payment.daysInMonth != null && payment.billableDays !== payment.daysInMonth);
  if (!showPartial) {
    return null;
  }
  const start = shortDayMonth(payment.billingPeriodStart);
  const end = shortDayMonth(payment.billingPeriodEnd);
  if (!start || !end) {
    return null;
  }
  return `${start} – ${end} · ${payment.billableDays} billable days`;
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
  const stayLabel = usePaymentStayTrail(payment.spaceId, payment);
  const s = dashSurfaces('light');
  const rawStatus = payment.paymentStatus ?? payment.status ?? 'PENDING';
  const listStatus = paymentListDisplayStatus(payment);
  const showReceived = Boolean(onReceived) && canOwnerMarkPaymentReceived(rawStatus);
  const showReminder = Boolean(onReminder) && canOwnerSendPaymentReminder(payment.reminderEligible);
  const name = payment.memberName?.trim() || payment.title;
  const initial = name.charAt(0).toUpperCase() || '?';
  // Backend titles already include the month — do not append a second period label.
  const heading = paymentDisplayTitle(payment);
  const amount = wholeRupees(payment.amount, payment.currencyCode);
  const badgeLabel =
    listStatus === 'OVERDUE'
      ? t('paymentCollection.overdue.badge')
      : t(paymentListStatusLabelKey(listStatus), {
          defaultValue: listStatus === 'PARTIALLY_REFUNDED' ? 'Partially refunded' : undefined,
        });
  const isOverdue = Boolean(payment.isOverdue) || listStatus === 'OVERDUE';
  const locationText =
    payment.paymentType === 'MEAL' ? null : locationDisplay(stayLabel);
  const paymentTitle = showMember
    ? heading
    : t(`paymentCollection.type.${payment.paymentType}`);
  const calendarLine = billedDaysLine(payment) ?? shortBillingPeriod(payment.month);

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
        gap: 1,
      }}
    >
      <Box
        component={onOpen ? 'button' : 'div'}
        type={onOpen ? 'button' : undefined}
        onClick={onOpen}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
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
              bgcolor: '#EFF6FF',
              color: '#1D4ED8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {initial}
          </Box>
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
              justifyContent: 'center',
            }}
          >
            <Typography
              sx={{
                ...DASHBOARD_UX.link,
                fontWeight: 700,
                color: s.textPrimary,
                lineHeight: 1.2,
                mb: 0,
              }}
            >
              {showMember ? name : heading}
            </Typography>
            {showMember ? (
              <Box sx={{ mt: '1px' }}>
                <ContactNumberLine value={payment.memberMobile} />
              </Box>
            ) : null}
          </Box>
          <StatusChip
            label={badgeLabel}
            tone={
              listStatus === 'OVERDUE' || payment.isOverdue
                ? 'error'
                : listStatus === 'PARTIALLY_REFUNDED'
                  ? 'info'
                  : paymentStatusTone(listStatus)
            }
          />
        </Box>

        {locationText ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              pt: 1,
              borderTop: `1px solid ${s.border}`,
            }}
          >
            <BedSingle size={14} color="#64748B" strokeWidth={2.2} aria-hidden />
            <Typography
              sx={{
                ...DASHBOARD_UX.caption,
                color: s.textSecondary,
                flex: 1,
                minWidth: 0,
              }}
            >
              {locationText}
            </Typography>
          </Box>
        ) : null}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'stretch',
            gap: 1,
            borderRadius: '10px',
            bgcolor: panelTint(String(listStatus), isOverdue),
            px: 1.25,
            py: 1,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography
              sx={{
                ...DASHBOARD_UX.body,
                fontWeight: 700,
                color: s.textPrimary,
                fontSize: 13,
                lineHeight: 1.35,
              }}
            >
              {paymentTitle}
            </Typography>
            {calendarLine ? (
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                <CalendarDays
                  size={13}
                  color="#64748B"
                  strokeWidth={2.2}
                  aria-hidden
                  style={{ marginTop: 1, flexShrink: 0 }}
                />
                <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textSecondary, flex: 1, minWidth: 0 }}>
                  {calendarLine}
                </Typography>
              </Box>
            ) : null}
          </Box>
          <Box
            sx={{
              width: '1px',
              alignSelf: 'stretch',
              bgcolor: s.border,
              flexShrink: 0,
            }}
          />
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              justifyContent: 'center',
              gap: 0.25,
              flexShrink: 0,
              maxWidth: '42%',
              pl: 0.5,
            }}
          >
            {amount ? (
              <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, textAlign: 'right' }}>
                {amount}
              </Typography>
            ) : null}
            <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textSecondary, textAlign: 'right' }}>
              {t('paymentCollection.dueDate', { date: payment.dueDate })}
            </Typography>
            {isOverdue ? (
              <Typography
                sx={{
                  ...DASHBOARD_UX.caption,
                  color: '#B91C1C',
                  fontWeight: 700,
                  textAlign: 'right',
                }}
              >
                {t('paymentCollection.overdue.compact', { count: payment.daysOverdue ?? 0 })}
              </Typography>
            ) : null}
          </Box>
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
