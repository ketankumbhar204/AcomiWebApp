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
import {
  CheckCircle2,
  Clock3,
  FileImage,
  RefreshCw,
  StickyNote,
  Upload,
  Wallet,
  XCircle,
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
import {
  canReviewPayment,
  canSubmitProof,
  paymentStatusLabelKey,
  paymentStatusTone,
} from '../utils/paymentHelpers';
import { ReceiptPreview } from './ReceiptPreview';

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
  const [rejectCode, setRejectCode] = useState<PaymentRejectionReason>('OTHER');
  const [remarks, setRemarks] = useState('');

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

  return (
    <SidePanel
      title={payment.title || t('payments.inspector.title')}
      subtitle={payment.memberName}
      onClose={onClose}
      framed={framed}
      footer={
        canManage && canReviewPayment(status) ? (
          <Stack spacing={1}>
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
        <StatusChip
          label={t(paymentStatusLabelKey(status))}
          tone={paymentStatusTone(status)}
        />

        <InspectorCard title={t('payments.inspector.summaryTitle', { defaultValue: 'Summary' })}>
          <DetailGrid
            items={[
              {
                label: t('paymentCollection.fields.amount'),
                value: formatCurrency(payment.amount, payment.currencyCode),
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

        {payment.proofUrl ? (
          <InspectorCard title={t('paymentCollection.proof.title')}>
            <Box
              component="img"
              src={payment.proofUrl}
              alt={t('paymentCollection.proof.title')}
              sx={{
                width: '100%',
                maxHeight: 220,
                objectFit: 'contain',
                borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                border: `1px solid ${s.border}`,
                bgcolor: s.elevated,
              }}
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
                          {event.remarks}
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
  );
}

export type { SpacePaymentResponse };
