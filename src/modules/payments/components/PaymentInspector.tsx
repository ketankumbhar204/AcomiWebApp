import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { ContactNumberLine, StayTrailLine } from '@/shared/components/ContactAndStayMeta';
import { usePaymentStayTrail } from '../hooks/usePaymentStayTrail';
import {
  CheckCircle2,
  Clock3,
  FileImage,
  RefreshCw,
  StickyNote,
  Upload,
  Wallet,
  XCircle,
  ChevronDown,
  ChevronUp,
  type LucideIcon,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { IconBadge } from '@/modules/dashboard/components/IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { EmptyState } from '@/shared/components/EmptyState';
import { LoadingState } from '@/shared/components/LoadingState';
import { SidePanel } from '@/shared/components/SidePanel';
import { StatusChip } from '@/shared/components/StatusChip';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { formatCurrency } from '@/shared/utils/dashboardFinancial';
import type {
  PaymentRejectionReason,
  PaymentTimelineEventType,
  SpacePaymentResponse,
  UniversalPaymentMethod,
} from '@/shared/types/payments';
import { usePaymentDetail, usePaymentMutations, usePaymentTimeline } from '../hooks/usePayments';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import {
  canOwnerMarkPaymentReceived,
  canReviewPayment,
  canEditSubmittedProof,
  canSubmitProof,
  paymentStatusLabelKey,
  paymentStatusTone,
} from '../utils/paymentHelpers';
import { PaymentReceivedConfirmDialog } from './PaymentReceivedConfirmDialog';
import { PaymentReminderComposer } from './PaymentReminderComposer';
import { buildPaymentReminderMessage } from '../utils/paymentReminderMessage';
import { openReminderWhatsApp } from '../utils/paymentReminderLaunch';
import { firstWhatsAppPhone } from '@/shared/utils/photoRequest';
import { ReceiptPreview } from './ReceiptPreview';
import { StoredImagePreview } from '@/shared/components/files/StoredImagePreview';

const memberProofButtonSx = {
  ...dashOutlinedButtonSx,
  bgcolor: '#ECFDF5',
  color: colors.primaryDark,
  borderColor: 'rgba(16, 185, 129, 0.35)',
  '&:hover': { bgcolor: '#D1FAE5' },
};

type PaymentInspectorProps = {
  spaceId: string;
  paymentId: string | null;
  canManage: boolean;
  onClose: () => void;
  onOpenProof?: () => void;
  framed?: boolean;
};

const REJECTION_CODES: PaymentRejectionReason[] = [
  'PAYMENT_AMOUNT_MISMATCH',
  'WRONG_SCREENSHOT',
  'INVALID_UTR',
  'OTHER',
];

function InspectorCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  return (
    <Box
      sx={{
        p: `${DASHBOARD_UX.cardPadding}px`,
        borderRadius: `${DASHBOARD_UX.radius}px`,
        border: `1px solid ${s.border}`,
        bgcolor: s.surface,
        boxShadow: s.shadow,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          mb: 1,
        }}
      >
        <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>{title}</Typography>
        {action}
      </Box>
      {children}
    </Box>
  );
}

function DetailGrid({
  items,
}: {
  items: Array<{ label: string; value?: string | number | null }>;
}) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const visible = items.filter((item) => item.value != null && item.value !== '');
  if (visible.length === 0) return null;
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 1.25,
      }}
    >
      {visible.map((item) => (
        <Box key={item.label} sx={{ minWidth: 0 }}>
          <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
            {item.label}
          </Typography>
          <Typography
            sx={{ ...DASHBOARD_UX.link, color: s.textPrimary, mt: 0.15 }}
            noWrap
          >
            {item.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function PaymentDetailsHeader({
  spaceId,
  payment,
  spaceName,
  allocationOpen,
  onToggleAllocation,
}: {
  spaceId: string;
  payment: SpacePaymentResponse;
  spaceName?: string | null;
  allocationOpen: boolean;
  onToggleAllocation: () => void;
}) {
  const stayTrail = usePaymentStayTrail(spaceId, payment);
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const status = payment.paymentStatus ?? payment.status ?? 'PENDING';
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
  const place = [spaceName, stayTrail].filter(Boolean).join(' → ');
  const amount = formatCurrency(payment.amount, payment.currencyCode);
  const outstanding =
    payment.outstandingAmount != null
      ? formatCurrency(payment.outstandingAmount, payment.currencyCode)
      : null;
  const base =
    payment.baseAmount != null
      ? formatCurrency(payment.baseAmount, payment.currencyCode)
      : null;

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: `${DASHBOARD_UX.radius}px`,
        border: `1px solid ${s.border}`,
        bgcolor: s.surface,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
      }}
    >
      <Box sx={{ display: 'flex', gap: 1.25 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '20px',
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
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, color: s.textPrimary }}>{name}</Typography>
          <ContactNumberLine value={payment.memberMobile} />
          {stayTrail ? (
            <StayTrailLine label={place} />
          ) : spaceName ? (
            <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textSecondary }}>{spaceName}</Typography>
          ) : null}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 18, color: s.textPrimary, flex: 1 }}>
          {heading}
        </Typography>
        <StatusChip
          label={payment.isOverdue ? t('paymentCollection.overdue.badge') : t(paymentStatusLabelKey(status))}
          tone={payment.isOverdue ? 'error' : paymentStatusTone(status)}
        />
      </Box>
      <Typography sx={{ fontWeight: 800, fontSize: 28, lineHeight: 1.2, color: s.textPrimary }}>
        {amount}
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
            {t('paymentCollection.fields.dueDate', { defaultValue: 'Due date' })}
          </Typography>
          <Typography sx={{ fontWeight: 700 }}>{payment.dueDate}</Typography>
        </Box>
        {period ? (
          <Box>
            <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
              {t('paymentCollection.detail.fields.billingPeriod', { defaultValue: 'Period' })}
            </Typography>
            <Typography sx={{ fontWeight: 700 }}>{period}</Typography>
          </Box>
        ) : null}
      </Box>
      {payment.isOverdue ? (
        <Box sx={{ bgcolor: '#FEF2F2', borderRadius: 1.5, p: 1.25 }}>
          <Typography sx={{ color: '#B91C1C', fontWeight: 700 }}>
            {t('paymentCollection.overdue.compact', { count: payment.daysOverdue ?? 0 })}
          </Typography>
          {outstanding ? (
            <Typography sx={{ color: '#991B1B', fontSize: 13 }}>
              {t('paymentCollection.overdue.outstanding', { amount: outstanding })}
            </Typography>
          ) : null}
        </Box>
      ) : null}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {base ? (
          <Box>
            <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
              {t('paymentCollection.detail.fields.baseAmount', { defaultValue: 'Rent amount' })}
            </Typography>
            <Typography sx={{ fontWeight: 700 }}>{base}</Typography>
          </Box>
        ) : null}
        {outstanding ? (
          <Box>
            <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
              {t('paymentCollection.fields.outstanding', { defaultValue: 'Outstanding' })}
            </Typography>
            <Typography sx={{ fontWeight: 700, color: '#B91C1C' }}>{outstanding}</Typography>
          </Box>
        ) : null}
      </Box>
      {stayTrail ? (
        <Box sx={{ borderTop: `1px solid ${s.border}`, pt: 1 }}>
          <Box
            component="button"
            type="button"
            onClick={onToggleAllocation}
            sx={{
              display: 'flex',
              width: '100%',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: 0,
              bgcolor: 'transparent',
              p: 0,
              cursor: 'pointer',
              font: 'inherit',
            }}
          >
            <Typography sx={{ fontWeight: 700 }}>
              {t('paymentCollection.allocationDetails', { defaultValue: 'Allocation details' })}
            </Typography>
            {allocationOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Box>
          {allocationOpen ? (
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 0.5 }}>
              {stayTrail}
            </Typography>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
}

function readablePaymentRemark(
  remarks: string,
  t: (key: string, options?: { defaultValue: string }) => string,
): string {
  if (remarks.includes('WHATSAPP_PROVIDER_NOT_CONFIGURED') || remarks.includes('PROVIDER_NOT_CONFIGURED')) {
    return t('paymentCollection.timeline.whatsappDisabled', {
      defaultValue: 'WhatsApp reminders are turned off, so this reminder was not sent.',
    });
  }
  if (remarks.includes('NO_ACTIVE_DEVICE_TOKEN')) {
    return t('paymentCollection.timeline.noDevice', {
      defaultValue: 'No registered device was available for a push notification.',
    });
  }
  if (remarks.includes('FCM_UNAVAILABLE')) {
    return t('paymentCollection.timeline.fcmUnavailable', {
      defaultValue: 'Push notifications were unavailable.',
    });
  }
  if (remarks.includes('FCM_REJECTED')) {
    return t('paymentCollection.timeline.fcmRejected', {
      defaultValue: 'Firebase did not accept the push notification.',
    });
  }
  return remarks;
}

function timelineIcon(eventType: PaymentTimelineEventType): {
  Icon: LucideIcon;
  accent: string;
} {
  switch (eventType) {
    case 'CREATED':
      return { Icon: StickyNote, accent: colors.primaryDark };
    case 'PROOF_UPLOADED':
    case 'RESUBMITTED':
      return { Icon: Upload, accent: '#3B82F6' };
    case 'UNDER_REVIEW':
    case 'UPDATE_REQUESTED':
      return { Icon: Clock3, accent: '#F59E0B' };
    case 'APPROVED':
    case 'PAID':
      return { Icon: CheckCircle2, accent: colors.success };
    case 'REJECTED':
      return { Icon: XCircle, accent: colors.danger };
    case 'REFUNDED':
      return { Icon: RefreshCw, accent: '#7C3AED' };
    default:
      return { Icon: Clock3, accent: colors.primaryDark };
  }
}

export function PaymentInspector({
  spaceId,
  paymentId,
  canManage,
  onClose,
  onOpenProof,
  framed = true,
}: PaymentInspectorProps) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const detail = usePaymentDetail(spaceId, paymentId ?? undefined, Boolean(paymentId));
  const timeline = usePaymentTimeline(spaceId, paymentId ?? undefined, Boolean(paymentId));
  const mutations = usePaymentMutations(spaceId);
  const permissions = useSpacePermissions(spaceId);
  const [rejectCode, setRejectCode] = useState<PaymentRejectionReason>('OTHER');
  const [remarks, setRemarks] = useState('');
  const [receivedOpen, setReceivedOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderMessage, setReminderMessage] = useState('');
  const [reminderNotice, setReminderNotice] = useState('');
  const [allocationOpen, setAllocationOpen] = useState(true);

  if (!paymentId) {
    return (
      <SidePanel title={t('payments.inspector.title')} onClose={onClose} framed={framed}>
        <EmptyState
          icon={
            <IconBadge accent={colors.primaryDark}>
              <Wallet />
            </IconBadge>
          }
          title={t('payments.inspector.selectTitle')}
          description={t('payments.inspector.selectBody')}
        />
      </SidePanel>
    );
  }

  if (detail.loading && !detail.payment) {
    return (
      <SidePanel title={t('payments.inspector.title')} onClose={onClose} framed={framed}>
        <LoadingState />
      </SidePanel>
    );
  }

  const payment = detail.payment;
  if (!payment) {
    return (
      <SidePanel title={t('payments.inspector.title')} onClose={onClose} framed={framed}>
        <EmptyState title={t('payments.inspector.notFound')} />
      </SidePanel>
    );
  }

  const status = payment.paymentStatus ?? payment.status ?? 'PENDING';

  const runReview = async (action: 'APPROVE' | 'REJECT' | 'REQUEST_UPDATE') => {
    try {
      if (action === 'REQUEST_UPDATE' && !remarks.trim()) {
        enqueueSnackbar(t('paymentCollection.review.remarksRequired'), { variant: 'warning' });
        return;
      }
      if (action === 'REJECT' && !rejectCode) {
        enqueueSnackbar(t('paymentCollection.review.rejectionRequired'), { variant: 'warning' });
        return;
      }
      await mutations.reviewPayment.mutateAsync({
        paymentId: payment.paymentId,
        body: {
          action,
          remarks: remarks.trim() || undefined,
          rejectionCode: action === 'REJECT' ? rejectCode : undefined,
        },
      });
      enqueueSnackbar(t('paymentCollection.review.success'), { variant: 'success' });
      setRemarks('');
    } catch {
      enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
    }
  };

  const runMarkReceived = async () => {
    try {
      await mutations.markReceived.mutateAsync(payment.paymentId);
      enqueueSnackbar(t('paymentCollection.received.success'), { variant: 'success' });
      setReceivedOpen(false);
    } catch {
      enqueueSnackbar(t('paymentCollection.received.failed'), { variant: 'error' });
    }
  };

  const canMarkReceived = canManage && canOwnerMarkPaymentReceived(status);

  const runSendReminder = async () => {
    const message = reminderMessage.trim();
    if (!message) return;
    setReminderNotice('');
    try {
      const result = await mutations.sendReminder.mutateAsync(payment.paymentId);
      let launch: Awaited<ReturnType<typeof openReminderWhatsApp>> = 'invalid';
      try {
        launch = await openReminderWhatsApp(
          {
            ...result,
            internationalPhone: result.internationalPhone || firstWhatsAppPhone([payment.memberMobile]),
          },
          message,
        );
      } catch {
        launch = 'failed';
      }
      if (result.inAppFailureCode === 'NOTIFICATION_FAILED') {
        enqueueSnackbar(t('paymentCollection.reminder.notificationFailed'), { variant: 'error' });
      } else if (result.inAppFailureCode === 'MEMBER_NOT_ON_ACOMI') {
        enqueueSnackbar(t('paymentCollection.reminder.memberNotOnAcomi'), { variant: 'warning' });
      } else if (result.inAppRecorded && launch !== 'opened') {
        enqueueSnackbar(t('paymentCollection.reminder.inAppSaved'), { variant: 'success' });
      }
      if (launch === 'opened') {
        enqueueSnackbar(
          t(
            result.inAppRecorded
              ? 'paymentCollection.reminder.openedWhatsApp'
              : 'paymentCollection.reminder.whatsAppReady',
          ),
          { variant: 'success' },
        );
      } else if (launch === 'copied') {
        enqueueSnackbar(t('paymentCollection.reminder.copied'), { variant: 'warning' });
      } else if (launch === 'invalid') {
        setReminderNotice(
          t('paymentCollection.reminder.whatsAppUnavailable', {
            defaultValue:
              'This number can’t be opened in WhatsApp. You can still save the in-app reminder.',
          }),
        );
        enqueueSnackbar(t('paymentCollection.reminder.invalidRecipient'), { variant: 'warning' });
      } else {
        enqueueSnackbar(t('paymentCollection.reminder.whatsAppFailed'), { variant: 'error' });
      }
      if (launch !== 'invalid') {
        setReminderOpen(false);
      }
    } catch {
      enqueueSnackbar(t('paymentCollection.reminder.failed'), { variant: 'error' });
    }
  };

  return (
    <>
    <SidePanel
      title={payment.title || t('payments.inspector.title')}
      subtitle={payment.memberName}
      onClose={onClose}
      framed={framed}
      footer={
        canManage &&
        (canReviewPayment(status) || payment.reminderEligible || canMarkReceived) ? (
          <Stack spacing={1}>
            {canMarkReceived ? (
              <Button
                variant="contained"
                sx={{
                  ...dashContainedButtonSx,
                  bgcolor: colors.primaryDark,
                  '&:hover': { bgcolor: colors.primaryHover },
                }}
                onClick={() => setReceivedOpen(true)}
                disabled={mutations.markReceived.isPending || mutations.reviewPayment.isPending}
              >
                {t('paymentCollection.received.action')}
              </Button>
            ) : null}
            {payment.reminderEligible ? (
              <Button
                variant="outlined"
                sx={dashOutlinedButtonSx}
                onClick={() => {
                  setReminderNotice('');
                  setReminderMessage(buildPaymentReminderMessage(payment));
                  setReminderOpen(true);
                }}
                disabled={mutations.sendReminder.isPending || mutations.reviewPayment.isPending}
              >
                {t('paymentCollection.reminder.send')}
              </Button>
            ) : null}
            {canReviewPayment(status) ? (
              <>
                <TextField
                  size="small"
                  label={t('paymentCollection.review.remarks')}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={t('paymentCollection.review.remarksPlaceholder')}
                  multiline
                  minRows={2}
                  fullWidth
                />
                <FormControl size="small" fullWidth>
                  <InputLabel>{t('paymentCollection.review.rejectionCode')}</InputLabel>
                  <Select
                    label={t('paymentCollection.review.rejectionCode')}
                    value={rejectCode}
                    onChange={(e) => setRejectCode(e.target.value as PaymentRejectionReason)}
                  >
                    {REJECTION_CODES.map((code) => (
                      <MenuItem key={code} value={code}>
                        {t(`paymentCollection.rejection.${code}`)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  sx={{
                    ...dashContainedButtonSx,
                    bgcolor: colors.primaryDark,
                    '&:hover': { bgcolor: colors.primaryHover },
                  }}
                  onClick={() => void runReview('APPROVE')}
                  disabled={mutations.reviewPayment.isPending}
                >
                  {t('paymentCollection.review.approve')}
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  sx={dashOutlinedButtonSx}
                  onClick={() => void runReview('REQUEST_UPDATE')}
                  disabled={mutations.reviewPayment.isPending}
                >
                  {t('paymentCollection.review.requestUpdate')}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  sx={dashOutlinedButtonSx}
                  onClick={() => void runReview('REJECT')}
                  disabled={mutations.reviewPayment.isPending}
                >
                  {t('paymentCollection.review.reject')}
                </Button>
              </>
            ) : null}
          </Stack>
        ) : !canManage && canEditSubmittedProof(status) && onOpenProof ? (
          <Stack spacing={1}>
            <Button variant="outlined" onClick={onOpenProof} sx={memberProofButtonSx}>
              {t('paymentCollection.proof.replaceProof')}
            </Button>
            <Button variant="outlined" onClick={onOpenProof} sx={memberProofButtonSx}>
              {t('paymentCollection.proof.editDetails')}
            </Button>
          </Stack>
        ) : !canManage && canSubmitProof(status) && onOpenProof ? (
          <Button
            variant="contained"
            onClick={onOpenProof}
            sx={{
              ...dashContainedButtonSx,
              bgcolor: colors.primaryDark,
              '&:hover': { bgcolor: colors.primaryHover },
            }}
          >
            {t('paymentCollection.proof.submit')}
          </Button>
        ) : undefined
      }
    >
      <Stack spacing={`${DASHBOARD_UX.cardGap}px`}>
        <PaymentDetailsHeader
          spaceId={spaceId}
          payment={payment}
          spaceName={permissions.space?.spaceName}
          allocationOpen={allocationOpen}
          onToggleAllocation={() => setAllocationOpen((open) => !open)}
        />

        <InspectorCard title={t('payments.inspector.summaryTitle', { defaultValue: 'Summary' })}>
          <DetailGrid
            items={[
              {
                label: t('paymentCollection.fields.amount'),
                value: formatCurrency(payment.amount, payment.currencyCode),
              },
              {
                label: t('paymentCollection.fields.billingPeriod'),
                value:
                  payment.billingPeriodStart && payment.billingPeriodEnd
                    ? `${payment.billingPeriodStart} → ${payment.billingPeriodEnd}`
                    : null,
              },
              {
                label: t('paymentCollection.fields.baseAmount'),
                value:
                  payment.baseAmount != null
                    ? formatCurrency(payment.baseAmount, payment.currencyCode)
                    : null,
              },
              {
                label: t('paymentCollection.fields.taxAmount'),
                value:
                  payment.taxEnabled && payment.taxAmount != null
                    ? `${formatCurrency(payment.taxAmount, payment.currencyCode)}${
                        payment.taxRatePercent != null ? ` (${payment.taxRatePercent}%)` : ''
                      }`
                    : null,
              },
              {
                label: t('paymentCollection.fields.outstanding'),
                value:
                  payment.outstandingAmount != null
                    ? formatCurrency(payment.outstandingAmount, payment.currencyCode)
                    : null,
              },
              {
                label: t('paymentCollection.fields.overdue'),
                value: payment.isOverdue
                  ? t('paymentCollection.fields.overdueDays', {
                      days: payment.daysOverdue ?? 0,
                    })
                  : t('paymentCollection.fields.notOverdue'),
              },
              {
                label: t('paymentCollection.fields.settlement'),
                value: payment.settlementStatus
                  ? t(`paymentCollection.settlement.${payment.settlementStatus}`)
                  : null,
              },
              {
                label: t('paymentCollection.reminder.statusLabel'),
                value: payment.reminderEligible
                  ? t('paymentCollection.reminder.eligible')
                  : payment.isOverdue
                    ? t('paymentCollection.reminder.notEligible')
                    : null,
              },
              {
                label: t('paymentCollection.fields.reference'),
                value: payment.paymentReference ?? payment.referenceNumber,
              },
              {
                label: t('paymentCollection.fields.dueDate'),
                value: payment.dueDate,
              },
              {
                label: t('paymentCollection.fields.paidDate'),
                value: payment.paymentDate,
              },
              {
                label: t('paymentCollection.fields.type'),
                value: t(`paymentCollection.type.${payment.paymentType}`),
              },
              {
                label: t('paymentCollection.fields.category'),
                value: t(`paymentCollection.category.${payment.paymentCategory}`),
              },
              {
                label: t('paymentCollection.addRecord.description'),
                value: payment.description,
              },
              {
                label: t('paymentCollection.fields.method'),
                value: payment.paymentMethod
                  ? t(
                      `paymentCollection.method.${payment.paymentMethod as UniversalPaymentMethod}`,
                    )
                  : null,
              },
              {
                label: t('payments.workspace.month'),
                value: payment.month,
              },
              {
                label: t('paymentCollection.fields.mealDates'),
                value: payment.mealDates?.length ? payment.mealDates.join(', ') : null,
              },
              {
                label: t('paymentCollection.fields.rejection'),
                value: payment.rejectionReason,
              },
            ]}
          />
        </InspectorCard>

        <ReceiptPreview payment={payment} />

        {payment.proofUrl || payment.proofFileId ? (
          <InspectorCard title={t('paymentCollection.proof.title')}>
            <StoredImagePreview
              fileId={payment.proofFileId}
              imageUrl={payment.proofUrl}
              alt={t('paymentCollection.proof.title')}
              title={t('paymentCollection.proof.title')}
              downloadFilename="payment-proof.jpg"
              maxHeight={220}
            />
          </InspectorCard>
        ) : (
          <InspectorCard title={t('payments.inspector.attachmentsTitle', { defaultValue: 'Attachments' })}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <IconBadge accent={s.textMuted}>
                <FileImage />
              </IconBadge>
              <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted }}>
                {t('payments.inspector.noAttachments', {
                  defaultValue: 'No proof image attached.',
                })}
              </Typography>
            </Stack>
          </InspectorCard>
        )}

        {payment.remarks ? (
          <InspectorCard title={t('payments.inspector.notesTitle', { defaultValue: 'Notes' })}>
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textPrimary }}>
              {payment.remarks}
            </Typography>
          </InspectorCard>
        ) : null}

        <InspectorCard title={t('paymentCollection.timeline.title')}>
          {timeline.loading ? (
            <LoadingState />
          ) : timeline.events.length === 0 ? (
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
              {t('paymentCollection.timeline.empty')}
            </Typography>
          ) : (
            <Stack spacing={0}>
              {timeline.events.map((event, index) => {
                const { Icon, accent } = timelineIcon(event.eventType);
                const isLast = index === timeline.events.length - 1;
                return (
                  <Box
                    key={event.eventId}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr',
                      gap: 1,
                      position: 'relative',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        pt: 0.25,
                      }}
                    >
                      <IconBadge accent={accent}>
                        <Icon />
                      </IconBadge>
                      {!isLast ? (
                        <Box
                          sx={{
                            flex: 1,
                            width: 2,
                            minHeight: 16,
                            my: 0.5,
                            bgcolor: s.border,
                            borderRadius: 1,
                          }}
                        />
                      ) : null}
                    </Box>
                    <Box
                      sx={{
                        pb: isLast ? 0 : 1.25,
                        minWidth: 0,
                      }}
                    >
                      <Typography
                        sx={{ ...DASHBOARD_UX.link, color: s.textPrimary }}
                      >
                        {t(`paymentCollection.timeline.event.${event.eventType}`)}
                      </Typography>
                      <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
                        {new Date(event.performedAt).toLocaleString()}
                        {event.performedBy ? ` · ${event.performedBy}` : ''}
                      </Typography>
                      {event.remarks ? (
                        <Typography
                          sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 0.35 }}
                        >
                          {readablePaymentRemark(event.remarks, t)}
                        </Typography>
                      ) : null}
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          )}
        </InspectorCard>
      </Stack>
    </SidePanel>
    <PaymentReminderComposer
      open={reminderOpen}
      memberName={payment.memberName ?? ''}
      phone={firstWhatsAppPhone([payment.memberMobile])}
      message={reminderMessage}
      notice={reminderNotice}
      submitting={mutations.sendReminder.isPending}
      onChangeMessage={setReminderMessage}
      onCancel={() => setReminderOpen(false)}
      onConfirm={() => void runSendReminder()}
    />
    <PaymentReceivedConfirmDialog
      open={receivedOpen}
      payments={[payment]}
      spaceName={permissions.space?.spaceName}
      confirming={mutations.markReceived.isPending}
      onConfirm={() => void runMarkReceived()}
      onClose={() => setReceivedOpen(false)}
    />
    </>
  );
}

export type { SpacePaymentResponse };
