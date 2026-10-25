import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import {
  BarChart3,
  BedSingle,
  Calculator,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  History,
  IndianRupee,
  MapPin,
  Phone,
  RefreshCw,
  UserRound,
  Wallet,
  WalletCards,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { spaceMemberPath } from '@/routes/paths';
import { memberApi } from '@/modules/members/api/memberApi';
import { formatCurrency, formatMonthYear } from '@/shared/utils/dashboardFinancial';
import { colors } from '@/shared/theme/colors';
import { ReferenceCode } from '@/shared/components/ReferenceCode';
import { useOccupiedBedStay } from '../hooks/useOccupiedBedStay';
import {
  bedCardBalanceFace,
  type OccupantPaymentSummary,
  type StayPaymentStatus,
} from '../utils/occupantPaymentSummary';

const green = { bg: '#ECFBF3', border: '#BFE8D4', fg: '#059669' };
const blue = { bg: '#EEF4FF', fg: '#1D4ED8' };
const purple = { bg: '#F4F0FF', border: '#DDD6FE', fg: '#6D28D9' };
const due = { bg: '#FEF2F2', fg: '#B91C1C', border: '#FECACA' };

function formatStayDate(value?: string | null): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value.includes('T') ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function money(amount: number | null | undefined): string {
  return amount == null ? '—' : formatCurrency(amount);
}

function DetailRow({
  icon,
  label,
  value,
  valueColor,
  accessory,
}: {
  icon: ReactNode;
  label: string;
  value?: string;
  valueColor?: string;
  accessory?: ReactNode;
}) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', py: 0.4 }}>
      <Stack
        direction="row"
        spacing={0.75}
        sx={{ alignItems: 'center', maxWidth: '48%', flexShrink: 0, color: 'text.secondary' }}
      >
        {icon}
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>{label}</Typography>
      </Stack>
      <Stack sx={{ flex: 1, minWidth: 0, alignItems: 'flex-end' }}>
        {accessory ?? (
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 600,
              color: valueColor ?? colors.textPrimary,
              textAlign: 'right',
              overflowWrap: 'anywhere',
            }}
          >
            {value}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}

function StatusBadge({
  label,
  bg,
  fg,
  border,
  dot = false,
}: {
  label: string;
  bg: string;
  fg: string;
  border: string;
  dot?: boolean;
}) {
  return (
    <Typography
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        maxWidth: '100%',
        px: 1,
        py: 0.25,
        borderRadius: 999,
        border: `1px solid ${border}`,
        bgcolor: bg,
        color: fg,
        fontSize: 11,
        fontWeight: 700,
        lineHeight: 1.4,
      }}
    >
      {dot ? (
        <Box
          component="span"
          sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: fg, flexShrink: 0 }}
        />
      ) : null}
      {label}
    </Typography>
  );
}

function SectionCard({
  title,
  icon,
  iconBg,
  borderColor = '#E2E8F0',
  children,
}: {
  title: string;
  icon: ReactNode;
  iconBg: string;
  borderColor?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <Stack
      spacing={0.25}
      sx={{
        border: `1px solid ${borderColor}`,
        borderRadius: 2,
        px: 1.25,
        py: 1,
      }}
    >
      <Stack
        component="button"
        type="button"
        direction="row"
        spacing={1}
        onClick={() => setOpen(current => !current)}
        aria-expanded={open}
        sx={{
          alignItems: 'center',
          cursor: 'pointer',
          border: 0,
          bgcolor: 'transparent',
          p: 0,
          m: 0,
          font: 'inherit',
          textAlign: 'left',
          width: '100%',
          mb: open ? 0.5 : 0,
        }}
      >
        <Stack
          sx={{
            width: 24,
            height: 24,
            borderRadius: 1,
            bgcolor: iconBg,
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </Stack>
        <Typography sx={{ fontWeight: 700, fontSize: 14, flex: 1 }}>{title}</Typography>
        {open ? <ChevronUp size={16} color={colors.textSecondary} /> : <ChevronDown size={16} color={colors.textSecondary} />}
      </Stack>
      {open ? children : null}
    </Stack>
  );
}

function paymentBadgeColors(status: StayPaymentStatus): { bg: string; fg: string; border: string } {
  switch (status) {
    case 'PAID':
      return green;
    case 'PARTIALLY_PAID':
      return { bg: '#FFF4EC', fg: '#C2410C', border: '#FED7AA' };
    case 'PENDING':
      return due;
    case 'UNDER_REVIEW':
      return { bg: blue.bg, fg: blue.fg, border: '#D0E0F8' };
    default:
      return { bg: '#F8FAFC', fg: colors.textSecondary, border: '#E2E8F0' };
  }
}

function paymentStatusLabel(
  status: StayPaymentStatus,
  t: (key: string, options?: { defaultValue?: string }) => string,
): string {
  switch (status) {
    case 'PAID':
      return t('accommodation.stayPayment.paidBadge', { defaultValue: 'Paid' });
    case 'PARTIALLY_PAID':
      return t('accommodation.stayPayment.partial', { defaultValue: 'Partially paid' });
    case 'PENDING':
      return t('accommodation.stayPayment.pending', { defaultValue: 'Pending payment' });
    case 'UNDER_REVIEW':
      return t('accommodation.stayPayment.underReview', { defaultValue: 'Under review' });
    case 'NO_RECORD':
      return t('accommodation.stayPayment.noRecord', { defaultValue: 'No payment record' });
    default:
      return t('accommodation.stayPayment.unavailable', {
        defaultValue: 'Payment status unavailable',
      });
  }
}

export function OccupiedBedStaySection({
  spaceId,
  bedId,
  bedNumber,
  locationLine,
}: {
  spaceId: string;
  bedId: string;
  bedNumber: string;
  locationLine?: string;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const stay = useOccupiedBedStay(spaceId, bedId, true);
  const memberId = stay.occupancy?.memberId;
  const [contact, setContact] = useState<{ memberId: string; mobile: string | null } | null>(null);
  const mobile = contact?.memberId === memberId ? contact.mobile : null;

  useEffect(() => {
    if (!memberId) {
      return;
    }
    let cancelled = false;
    void memberApi
      .getMember(spaceId, memberId)
      .then(member => {
        if (!cancelled) {
          setContact({ memberId, mobile: member.mobileNumber?.trim() || null });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setContact({ memberId, mobile: null });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [spaceId, memberId]);

  const moveIn = stay.occupancy?.actualMoveInAt || stay.occupancy?.moveInDate;
  const exitDate = stay.occupancy?.expectedExitDate;

  return (
    <Stack spacing={1.25}>
      {stay.occupancy?.memberId ? (
        <Button
          fullWidth
          startIcon={<UserRound size={16} />}
          onClick={() => navigate(spaceMemberPath(spaceId, stay.occupancy!.memberId))}
          sx={{
            bgcolor: green.bg,
            color: green.fg,
            border: `1px solid ${green.border}`,
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 2,
            '&:hover': { bgcolor: '#E8F8EF', borderColor: green.border },
          }}
        >
          {t('occupancy.targetOccupant.viewMember', { defaultValue: 'View member profile' })}
        </Button>
      ) : null}

      <SectionCard
        title={t('accommodation.stayPayment.occupancySection', { defaultValue: 'Bed and occupancy' })}
        icon={<BedSingle size={14} color={blue.fg} />}
        iconBg={blue.bg}
      >
        <DetailRow
          icon={<BedSingle size={14} />}
          label={t('accommodation.stayPayment.bedNumber', { defaultValue: 'Bed number' })}
          value={bedNumber || '—'}
        />
        {locationLine ? (
          <DetailRow
            icon={<MapPin size={14} />}
            label={t('accommodation.stayPayment.location', { defaultValue: 'Location' })}
            value={locationLine}
          />
        ) : null}
        {moveIn ? (
          <DetailRow
            icon={<CalendarDays size={14} />}
            label={t('occupancy.section.moveInDate', { defaultValue: 'Move-in date' })}
            value={formatStayDate(moveIn)}
          />
        ) : null}

        <Stack sx={{ height: '1px', bgcolor: '#E2E8F0', my: 0.75 }} />
        <Stack
          direction="row"
          spacing={0.75}
          sx={{
            alignItems: 'center',
            bgcolor: green.bg,
            borderRadius: 1.5,
            px: 1,
            py: 0.75,
            mb: 0.25,
          }}
        >
          <UserRound size={14} color={green.fg} />
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: green.fg }}>
            {t('occupancy.targetOccupant.title', { defaultValue: 'Current occupant' })}
          </Typography>
        </Stack>
        {stay.loading ? <CircularProgress size={18} sx={{ alignSelf: 'flex-start', my: 0.5 }} /> : null}
        {stay.error ? (
          <Typography sx={{ color: 'error.main', fontSize: 13 }}>
            {t('accommodation.stayPayment.loadFailed', {
              defaultValue: 'Could not load tenant or payment details.',
            })}
          </Typography>
        ) : null}
        {!stay.loading && !stay.error && !stay.occupancy ? (
          <Typography sx={{ fontSize: 14, color: 'text.secondary', py: 0.5 }}>
            {t('accommodation.stayPayment.noTenant', { defaultValue: 'No linked tenant' })}
          </Typography>
        ) : null}
        {stay.occupancy ? (
          <>
            <DetailRow
              icon={<UserRound size={14} />}
              label={t('occupancy.targetOccupant.member', { defaultValue: 'Member' })}
              value={stay.occupancy.memberName}
            />
            <ReferenceCode value={stay.occupancy.referenceCode} />
            {mobile ? (
              <DetailRow
                icon={<Phone size={14} />}
                label={t('accommodation.stayPayment.contact', { defaultValue: 'Contact' })}
                value={mobile}
              />
            ) : null}
            <DetailRow
              icon={<BarChart3 size={14} />}
              label={t('accommodation.stayPayment.stayStatus', { defaultValue: 'Stay status' })}
              accessory={
                <StatusBadge
                  dot
                  label={t(`occupancy.status.${stay.occupancy.status}`, {
                    defaultValue: stay.occupancy.status,
                  })}
                  bg={stay.occupancy.status === 'ACTIVE' ? green.bg : '#F8FAFC'}
                  fg={stay.occupancy.status === 'ACTIVE' ? green.fg : colors.textSecondary}
                  border={stay.occupancy.status === 'ACTIVE' ? green.border : '#E2E8F0'}
                />
              }
            />
            {exitDate ? (
              <DetailRow
                icon={<CalendarDays size={14} />}
                label={t('occupancy.fields.expectedExit', { defaultValue: 'Expected move-out' })}
                value={formatStayDate(exitDate)}
              />
            ) : null}
          </>
        ) : null}
      </SectionCard>

      <PaymentCard summary={stay.summary} loading={stay.loading} />
    </Stack>
  );
}

function PaymentCard({
  summary,
  loading,
}: {
  summary: OccupantPaymentSummary | null;
  loading: boolean;
}) {
  const { t } = useTranslation();
  if (!summary) {
    if (loading) {
      return null;
    }
    return (
      <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
        {t('accommodation.stayPayment.unavailable', { defaultValue: 'Payment status unavailable' })}
      </Typography>
    );
  }

  const face = bedCardBalanceFace(summary);
  const badge = paymentBadgeColors(summary.status);
  const strip =
    face.kind === 'balance'
      ? [
          face.paid != null
            ? t('accommodation.stayPayment.paidAmount', {
                defaultValue: '{{amount}} paid',
                amount: formatCurrency(face.paid),
              })
            : null,
          t('accommodation.stayPayment.remaining', {
            defaultValue: '{{amount}} remaining',
            amount: formatCurrency(face.outstanding),
          }),
        ]
          .filter(Boolean)
          .join(' · ')
      : null;

  return (
    <SectionCard
      title={t('accommodation.stayPayment.summary', { defaultValue: 'Payment summary' })}
      icon={<WalletCards size={14} color={purple.fg} />}
      iconBg={purple.bg}
      borderColor={purple.border}
    >
      <DetailRow
        icon={<CalendarDays size={14} />}
        label={t('accommodation.stayPayment.period', { defaultValue: 'Period' })}
        value={formatMonthYear(summary.month)}
      />
      <DetailRow
        icon={<Wallet size={14} />}
        label={t('accommodation.stayPayment.status', { defaultValue: 'Payment status' })}
        accessory={
          <StatusBadge
            label={paymentStatusLabel(summary.status, t)}
            bg={badge.bg}
            fg={badge.fg}
            border={badge.border}
          />
        }
      />
      {summary.rent ? (
        <DetailRow
          icon={<IndianRupee size={14} />}
          label={t('accommodation.stayPayment.rentDue', { defaultValue: 'Rent due' })}
          value={money(summary.rent.outstanding)}
        />
      ) : null}
      {summary.deposit ? (
        <DetailRow
          icon={<IndianRupee size={14} />}
          label={t('accommodation.stayPayment.depositDue', { defaultValue: 'Deposit due' })}
          value={money(summary.deposit.outstanding)}
        />
      ) : null}
      {summary.totalDue != null ? (
        <DetailRow
          icon={<Calculator size={14} />}
          label={t('accommodation.stayPayment.totalDue', { defaultValue: 'Total due' })}
          value={money(summary.totalDue)}
        />
      ) : null}
      {summary.amountPaid != null ? (
        <DetailRow
          icon={<Wallet size={14} />}
          label={t('accommodation.stayPayment.amountPaid', { defaultValue: 'Amount paid' })}
          value={money(summary.amountPaid)}
        />
      ) : null}
      {summary.outstanding != null ? (
        <DetailRow
          icon={<History size={14} />}
          label={t('accommodation.stayPayment.outstanding', { defaultValue: 'Outstanding' })}
          value={money(summary.outstanding)}
          valueColor={face.kind === 'balance' ? due.fg : undefined}
        />
      ) : null}
      {strip ? (
        <Stack
          direction="row"
          spacing={1}
          sx={{
            mt: 0.75,
            px: 1,
            py: 0.75,
            borderRadius: 1.5,
            bgcolor: due.bg,
            color: due.fg,
            alignItems: 'center',
          }}
        >
          <RefreshCw size={14} color={due.fg} />
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: due.fg, flex: 1 }}>{strip}</Typography>
        </Stack>
      ) : null}
    </SectionCard>
  );
}
