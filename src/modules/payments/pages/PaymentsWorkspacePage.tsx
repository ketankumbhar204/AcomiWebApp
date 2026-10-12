import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import {
  ChevronRight,
  Plus,
  RefreshCw,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { AppDrawer } from '@/shared/components/AppDrawer';
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable';
import { ErrorState } from '@/shared/components/ErrorState';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { PeriodMonthNav } from '@/shared/components/PeriodMonthNav';
import { StatusChip } from '@/shared/components/StatusChip';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashFilterControlSx } from '@/shared/theme/dashButtonSx';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { useSpaceProgressiveAccess } from '@/modules/dashboard/hooks/useSpaceProgressiveAccess';
import {
  canManagePayments,
  currentMonthKey,
  formatCurrency,
} from '@/shared/utils/dashboardFinancial';
import { spacePaymentsPath } from '@/routes/paths';
import type {
  PaymentsReviewQueueParam,
  SpacePaymentResponse,
} from '@/shared/types/payments';
import { CompactPaymentCard } from '../components/CompactPaymentCard';
import { PaymentInspector } from '../components/PaymentInspector';
import {
  PaymentsSummaryFilters,
  type PaymentSummaryFilter,
  type PaymentsOwnerFilter,
} from '../components/PaymentsSummaryFilters';
import { usePaymentMutations, usePaymentsHistory, usePaymentsReview, usePaymentsSummary, useSpacePaymentsList } from '../hooks/usePayments';
import { useOwnerPaymentCardActions } from '../hooks/useOwnerPaymentCardActions';
import { AddPaymentRecordDialog } from '../components/AddPaymentRecordDialog';
import { OwnerPaymentRowActions } from '../components/OwnerPaymentRowActions';
import { PaymentReceivedConfirmDialog } from '../components/PaymentReceivedConfirmDialog';
import {
  canOwnerMarkPaymentReceived,
  canOwnerSendPaymentReminder,
  formatMonthLabel,
  matchesIndividualPayment,
  paymentStatusLabelKey,
  paymentStatusTone,
  shiftMonth,
} from '../utils/paymentHelpers';
import { paymentListEmptyKind } from '../utils/paymentMonthList';
import { TenantPaymentsPage } from './TenantPaymentsPage';

const filterControlSx = {
  ...dashFilterControlSx,
  '& .MuiInputBase-root': {
    minHeight: DASHBOARD_UX.buttonHeight,
    height: DASHBOARD_UX.buttonHeight,
    borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
    ...DASHBOARD_UX.body,
  },
} as const;

const SUMMARY_FILTERS: PaymentSummaryFilter[] = ['all', 'collected', 'underReview', 'pending'];

function isSummaryFilter(value: string | null | undefined): value is PaymentSummaryFilter {
  return Boolean(value && (SUMMARY_FILTERS as string[]).includes(value));
}

/** Map legacy tab=… deep links onto the summary-filter model. */
function resolveOwnerFilter(searchParams: URLSearchParams): PaymentsOwnerFilter {
  const filter = searchParams.get('filter');
  if (filter === 'history') return 'history';
  if (isSummaryFilter(filter)) return filter;

  const tab = searchParams.get('tab');
  switch (tab) {
    case 'review':
    case 'submitted':
    case 'pendingReview':
    case 'changesRequested':
      return 'underReview';
    case 'history':
    case 'paid':
    case 'rejected':
      return 'history';
    case 'members':
      return 'all';
    case 'collected':
      return 'collected';
    case 'pending':
      return 'pending';
    case 'underReview':
      return 'underReview';
    default:
      return 'all';
  }
}

function resolveReviewQueue(
  searchParams: URLSearchParams,
  filter: PaymentsOwnerFilter,
): PaymentsReviewQueueParam {
  const queue = searchParams.get('queue') as PaymentsReviewQueueParam | null;
  if (queue) return queue;

  const tab = searchParams.get('tab');
  if (tab === 'submitted') return 'SUBMITTED';
  if (tab === 'changesRequested') return 'NEEDS_UPDATE';
  if (filter === 'underReview') return 'SUBMITTED';
  return 'PENDING_REVIEW';
}

function memberStatusForFilter(filter: PaymentsOwnerFilter): string {
  if (filter === 'collected') return 'PAID';
  if (filter === 'pending') return 'PENDING';
  return '';
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function MemberCell({ name, mobile }: { name: string; mobile?: string | null }) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, py: 0.25 }}>
      <Avatar
        sx={{
          width: 28,
          height: 28,
          ...DASHBOARD_UX.badge,
          bgcolor: `${colors.primaryDark}1A`,
          color: colors.primaryDark,
        }}
      >
        {initials(name) || '?'}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ ...DASHBOARD_UX.link, color: s.textPrimary }} noWrap>
          {name}
        </Typography>
        {mobile ? (
          <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted }} noWrap>
            {mobile}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}

export function PaymentsWorkspacePage() {
  const { spaceId = '', paymentId: routePaymentId } = useParams<{
    spaceId: string;
    paymentId?: string;
  }>();
  const permissions = useSpacePermissions(spaceId);
  const isOwner = canManagePayments(permissions.membershipRole);

  if (!isOwner) {
    return <TenantPaymentsPage />;
  }

  return <OwnerPaymentsWorkspace spaceId={spaceId} routePaymentId={routePaymentId} />;
}

function OwnerPaymentsWorkspace({
  spaceId,
  routePaymentId,
}: {
  spaceId: string;
  routePaymentId?: string;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const permissions = useSpacePermissions(spaceId);
  const { getCapability } = useSpaceProgressiveAccess(spaceId);
  const paymentsAccess = getCapability('PAYMENTS');

  const month = searchParams.get('month') || currentMonthKey();
  const filter = resolveOwnerFilter(searchParams);
  const queue = resolveReviewQueue(searchParams, filter);
  const historyQueue = (searchParams.get('historyQueue') as PaymentsReviewQueueParam) || 'HISTORY';
  const memberIdFilter = searchParams.get('memberId') || undefined;

  const [search, setSearch] = useState('');
  const [memberStatus, setMemberStatus] = useState(() => memberStatusForFilter(filter));
  const [page, setPage] = useState(0);
  const [createPaymentOpen, setCreatePaymentOpen] = useState(false);
  const selectedPaymentId = routePaymentId ?? null;
  const inspectorOpen = Boolean(routePaymentId);
  const pageSize = 25;

  const showRecords = filter === 'all' || filter === 'collected' || filter === 'pending';
  const showReview = filter === 'underReview';
  const showHistory = filter === 'history';

  const summary = usePaymentsSummary(spaceId, month, true);
  const recordList = useSpacePaymentsList(
    spaceId,
    { month, sync: false },
    showRecords,
  );
  const review = usePaymentsReview(
    spaceId,
    { month, queue, page, size: pageSize },
    showReview,
  );
  const history = usePaymentsHistory(
    spaceId,
    { month, queue: historyQueue, page, size: pageSize },
    showHistory,
  );
  const mutations = usePaymentMutations(spaceId);
  const cardActions = useOwnerPaymentCardActions(spaceId, month);

  useEffect(() => {
    document.title = `${t('navigation.payments')} · ${t('common.appName')}`;
  }, [t]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        document.getElementById('payments-search')?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const [statusFilterKey, setStatusFilterKey] = useState(filter);
  if (showRecords && statusFilterKey !== filter) {
    setStatusFilterKey(filter);
    setMemberStatus(memberStatusForFilter(filter));
  }

  const setMonth = (next: string) => {
    setPage(0);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('month', next);
      return p;
    });
  };

  const applyFilter = (
    next: PaymentsOwnerFilter,
    opts?: { queue?: PaymentsReviewQueueParam; historyQueue?: PaymentsReviewQueueParam },
  ) => {
    setPage(0);
    if (next === 'all' || next === 'collected' || next === 'pending') {
      setMemberStatus(memberStatusForFilter(next));
    }
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('filter', next);
      p.set('month', month);
      p.delete('tab');
      if (next === 'underReview') {
        p.set('queue', opts?.queue ?? 'SUBMITTED');
      } else {
        p.delete('queue');
      }
      if (next === 'history') {
        p.set('historyQueue', opts?.historyQueue ?? historyQueue);
      } else {
        p.delete('historyQueue');
      }
      return p;
    });
  };

  const handleSummaryFilterPress = (next: PaymentSummaryFilter) => {
    if (next === 'underReview') {
      applyFilter('underReview', { queue: 'SUBMITTED' });
      return;
    }
    if (next === filter) {
      applyFilter('all');
      return;
    }
    applyFilter(next);
  };

  const selectPayment = (id: string) => {
    navigate(
      spacePaymentsPath(spaceId, id, {
        month,
        filter,
        memberId: memberIdFilter,
        queue: showReview ? queue : undefined,
      }),
      { replace: true },
    );
  };

  const closeInspector = () => {
    navigate(
      spacePaymentsPath(spaceId, undefined, {
        month,
        filter,
        memberId: memberIdFilter,
        queue: showReview ? queue : undefined,
      }),
      { replace: true },
    );
  };

  const financial = summary.summary?.financial;
  const counts = summary.summary?.counts;
  const submittedCount = counts?.submitted ?? 0;

  const reviewColumns: DataTableColumn<SpacePaymentResponse & { id: string }>[] = useMemo(
    () => [
      {
        id: 'member',
        header: t('paymentCollection.fields.member'),
        accessor: (row) => <MemberCell name={row.memberName} mobile={row.memberMobile} />,
        primary: true,
      },
      {
        id: 'title',
        header: t('paymentCollection.fields.title'),
        accessor: (row) => (
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }} noWrap>
            {row.title}
          </Typography>
        ),
        primary: true,
      },
      {
        id: 'amount',
        header: t('paymentCollection.fields.amount'),
        align: 'right',
        accessor: (row) => (
          <Typography
            sx={{
              ...DASHBOARD_UX.link,
              color: s.textPrimary,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatCurrency(row.amount, row.currencyCode)}
          </Typography>
        ),
      },
      {
        id: 'due',
        header: t('paymentCollection.fields.dueDate'),
        width: 120,
        accessor: (row) => (
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, whiteSpace: 'nowrap' }}>
            {row.dueDate}
          </Typography>
        ),
      },
      {
        id: 'status',
        header: t('paymentCollection.fields.status'),
        accessor: (row) => {
          const status = row.paymentStatus ?? row.status ?? 'PENDING';
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5, whiteSpace: 'nowrap' }}>
              <StatusChip
                label={t(paymentStatusLabelKey(status))}
                tone={paymentStatusTone(status)}
              />
              {row.isOverdue ? (
                <StatusChip
                  label={t('paymentCollection.overdue.chip', {
                    days: row.daysOverdue ?? 0,
                  })}
                  tone="error"
                />
              ) : null}
              {row.isOverdue && row.outstandingAmount != null ? (
                <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted }}>
                  {t('paymentCollection.overdue.outstanding', {
                    amount: formatCurrency(row.outstandingAmount, row.currencyCode),
                  })}
                </Typography>
              ) : null}
            </Box>
          );
        },
      },
      {
        id: 'type',
        header: t('paymentCollection.fields.type'),
        accessor: (row) => t(`paymentCollection.type.${row.paymentType}`),
      },
      {
        id: 'actions',
        header: '',
        width: 280,
        align: 'right',
        accessor: (row) => {
          const status = row.paymentStatus ?? row.status ?? 'PENDING';
          const showReceived = canOwnerMarkPaymentReceived(status);
          const showReminder = canOwnerSendPaymentReminder(row.reminderEligible);
          return (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                ml: 'auto',
              }}
            >
              {showReceived || showReminder ? (
                <OwnerPaymentRowActions
                  showReceived={showReceived}
                  showReminder={showReminder}
                  receivedLoading={cardActions.isProcessing(row.paymentId, 'received')}
                  reminderLoading={cardActions.isProcessing(row.paymentId, 'reminder')}
                  onReceived={() => cardActions.requestReceivedForPayment(row)}
                  onReminder={() => cardActions.sendReminderForPayment(row)}
                />
              ) : (
                <ChevronRight size={16} color={s.textMuted} aria-hidden />
              )}
            </Box>
          );
        },
      },
    ],
    [cardActions, s.textMuted, s.textPrimary, s.textSecondary, t],
  );

  const historyColumns: DataTableColumn<SpacePaymentResponse & { id: string }>[] = useMemo(
    () => [
      {
        id: 'member',
        header: t('paymentCollection.fields.member'),
        accessor: (row) => <MemberCell name={row.memberName} mobile={row.memberMobile} />,
        primary: true,
      },
      {
        id: 'title',
        header: t('paymentCollection.fields.title'),
        accessor: (row) => (
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }} noWrap>
            {row.title}
          </Typography>
        ),
        primary: true,
      },
      {
        id: 'amount',
        header: t('paymentCollection.fields.amount'),
        align: 'right',
        accessor: (row) => (
          <Typography
            sx={{
              ...DASHBOARD_UX.link,
              color: s.textPrimary,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatCurrency(row.amount, row.currencyCode)}
          </Typography>
        ),
      },
      {
        id: 'paid',
        header: t('paymentCollection.fields.paidDate'),
        accessor: (row) => row.paymentDate || row.dueDate || '—',
      },
      {
        id: 'status',
        header: t('paymentCollection.fields.status'),
        accessor: (row) => {
          const status = row.paymentStatus ?? row.status ?? 'PENDING';
          return (
            <StatusChip
              label={t(paymentStatusLabelKey(status))}
              tone={paymentStatusTone(status)}
            />
          );
        },
      },
      {
        id: 'type',
        header: t('paymentCollection.fields.type'),
        accessor: (row) => t(`paymentCollection.type.${row.paymentType}`),
      },
      {
        id: 'actions',
        header: '',
        width: 40,
        align: 'right',
        accessor: () => <ChevronRight size={16} color={s.textMuted} aria-hidden />,
      },
    ],
    [s.textMuted, s.textPrimary, s.textSecondary, t],
  );

  const filteredRecords = useMemo(
    () =>
      recordList.payments
        .filter((payment) =>
          matchesIndividualPayment(payment, {
            status: memberStatus,
            query: search,
            memberId: memberIdFilter,
          }),
        )
        .map((payment) => ({ ...payment, id: payment.paymentId })),
    [memberIdFilter, memberStatus, recordList.payments, search],
  );
  const recordRows = filteredRecords.slice(page * pageSize, page * pageSize + pageSize);
  const reconciledMonth = useRef<string | null>(null);
  useEffect(() => {
    if (recordList.loading || recordList.month !== month) {
      return;
    }
    const pending = financial?.pending ?? 0;
    if (pending <= 0 || recordList.payments.length > 0) {
      return;
    }
    if (reconciledMonth.current === month) {
      return;
    }
    reconciledMonth.current = month;
    void recordList.reload();
  }, [
    financial?.pending,
    month,
    recordList.loading,
    recordList.month,
    recordList.payments.length,
    recordList.reload,
  ]);
  const recordEmptyKind = paymentListEmptyKind({
    selectedMonth: month,
    loadedMonth: recordList.loading ? null : recordList.month,
    loading: recordList.loading,
    pendingAmount: financial?.pending,
    recordCount: recordList.payments.length,
    visibleCount: filteredRecords.length,
    preset: filter === 'pending' || filter === 'collected' ? filter : null,
    hasSearchOrExtraFilter: Boolean(search.trim()) || Boolean(memberIdFilter),
  });
  const recordEmptyTitle =
    recordEmptyKind === 'mismatch'
      ? t('payments.emptyMismatch.title')
      : recordEmptyKind === 'pending'
        ? t('payments.emptyPending.title')
        : recordEmptyKind === 'collected'
          ? t('payments.emptyCollected.title')
          : t('payments.records.emptyTitle');
  const recordEmptyDescription =
    recordEmptyKind === 'mismatch'
      ? t('payments.emptyMismatch.description')
      : recordEmptyKind === 'pending'
        ? t('payments.emptyPending.description')
        : recordEmptyKind === 'collected'
          ? t('payments.emptyCollected.description')
          : t('payments.records.emptyDescription');

  const paymentRows = (
    showReview ? review.payments : history.payments
  ).map((payment) => ({ ...payment, id: payment.paymentId }));

  const clearMemberFilter = () => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.delete('memberId');
      return p;
    });
  };

  const reloadAll = () => {
    void summary.reload();
    void recordList.reload();
    void review.reload();
    void history.reload();
  };

  if (summary.error && !summary.summary) {
    return (
      <PageContainer>
        <ErrorState
          title={t('common.errors.generic')}
          message={t('payments.errors.unavailable')}
          onRetry={() => void summary.reload()}
          retryLabel={t('common.retry')}
        />
      </PageContainer>
    );
  }

  const memberStatusFilter = (
    <FormControl size="small" sx={filterControlSx}>
      <InputLabel id="payments-member-status">{t('payments.members.status')}</InputLabel>
      <Select
        labelId="payments-member-status"
        label={t('payments.members.status')}
        value={memberStatus}
        onChange={(e) => {
          setMemberStatus(String(e.target.value));
          setPage(0);
        }}
      >
        <MenuItem value="">{t('payments.members.allStatuses')}</MenuItem>
        <MenuItem value="PENDING">{t('payments.memberStatus.PENDING')}</MenuItem>
        <MenuItem value="UNDER_REVIEW">{t('payments.memberStatus.UNDER_REVIEW')}</MenuItem>
        <MenuItem value="PAID">{t('payments.memberStatus.PAID')}</MenuItem>
        <MenuItem value="REJECTED">{t('payments.memberStatus.REJECTED')}</MenuItem>
      </Select>
    </FormControl>
  );

  const queueFilter =
    showReview ? (
      <FormControl size="small" sx={filterControlSx}>
        <InputLabel id="payments-review-queue">{t('payments.review.queue')}</InputLabel>
        <Select
          labelId="payments-review-queue"
          label={t('payments.review.queue')}
          value={queue}
          onChange={(e) => {
            setPage(0);
            setSearchParams((prev) => {
              const p = new URLSearchParams(prev);
              p.set('queue', String(e.target.value));
              p.set('filter', 'underReview');
              p.delete('tab');
              p.set('month', month);
              return p;
            });
          }}
        >
          <MenuItem value="PENDING_REVIEW">{t('payments.review.queues.PENDING_REVIEW')}</MenuItem>
          <MenuItem value="SUBMITTED">{t('payments.review.queues.SUBMITTED')}</MenuItem>
          <MenuItem value="NEEDS_UPDATE">{t('payments.review.queues.NEEDS_UPDATE')}</MenuItem>
        </Select>
      </FormControl>
    ) : showHistory ? (
      <FormControl size="small" sx={filterControlSx}>
        <InputLabel id="payments-history-queue">{t('payments.history.queue')}</InputLabel>
        <Select
          labelId="payments-history-queue"
          label={t('payments.history.queue')}
          value={historyQueue}
          onChange={(e) => {
            setPage(0);
            setSearchParams((prev) => {
              const p = new URLSearchParams(prev);
              p.set('historyQueue', String(e.target.value));
              p.set('filter', 'history');
              p.delete('tab');
              p.set('month', month);
              return p;
            });
          }}
        >
          <MenuItem value="HISTORY">{t('payments.history.queues.HISTORY')}</MenuItem>
          <MenuItem value="PAID">{t('payments.history.queues.PAID')}</MenuItem>
          <MenuItem value="REJECTED">{t('payments.history.queues.REJECTED')}</MenuItem>
        </Select>
      </FormControl>
    ) : null;

  const listTitle = showReview
    ? t('payments.tabs.review')
    : showHistory
      ? t('payments.tabs.history')
      : t('payments.records.heading');

  return (
    <PageContainer gap={0}>
      <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
        <PageHeader
          title={t('navigation.payments')}
          description={t('payments.workspace.subtitle')}
          breadcrumbs={[
            { label: permissions.space?.spaceName ?? t('navigation.space') },
            { label: t('navigation.payments') },
          ]}
          actions={
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              sx={{ flexWrap: 'wrap', alignItems: 'center' }}
            >
              <PeriodMonthNav
                month={month}
                onPrevious={() => setMonth(shiftMonth(month, -1))}
                onNext={() => setMonth(shiftMonth(month, 1))}
                onMonthSelect={setMonth}
                size="compact"
              />
              <IconButton
                size="small"
                aria-label={t('common.refresh')}
                onClick={reloadAll}
                sx={{
                  width: DASHBOARD_UX.buttonHeight,
                  height: DASHBOARD_UX.buttonHeight,
                  border: `1px solid ${s.border}`,
                  borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                  bgcolor: s.surface,
                }}
              >
                <RefreshCw size={14} />
              </IconButton>
              <Button
                variant="contained"
                startIcon={<Plus size={14} />}
                onClick={() => setCreatePaymentOpen(true)}
                sx={{
                  ...dashContainedButtonSx,
                  minHeight: DASHBOARD_UX.buttonHeight,
                  height: DASHBOARD_UX.buttonHeight,
                  bgcolor: colors.primaryDark,
                  '&:hover': { bgcolor: colors.primaryHover },
                }}
              >
                {t('paymentCollection.addRecord.createAction')}
              </Button>
              <Button
                variant="contained"
                startIcon={<RefreshCw size={14} />}
                disabled={mutations.syncMonth.isPending}
                onClick={() =>
                  void mutations.syncMonth
                    .mutateAsync(month)
                    .then(() =>
                      enqueueSnackbar(t('payments.workspace.syncSuccess'), {
                        variant: 'success',
                      }),
                    )
                    .catch(() =>
                      enqueueSnackbar(t('common.errors.generic'), { variant: 'error' }),
                    )
                }
                sx={{
                  ...dashContainedButtonSx,
                  minHeight: DASHBOARD_UX.buttonHeight,
                  height: DASHBOARD_UX.buttonHeight,
                  bgcolor: colors.primaryDark,
                  '&:hover': { bgcolor: colors.primaryHover },
                }}
              >
                {t('payments.workspace.sync')}
              </Button>
            </Stack>
          }
        />

        {paymentsAccess?.mode === 'SOFT' && paymentsAccess.reasonKey ? (
          <Alert severity="info" sx={{ borderRadius: `${DASHBOARD_UX.radius}px` }}>
            {t(paymentsAccess.reasonKey)}
          </Alert>
        ) : null}

        <Box>
          <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted, mb: 0.75 }}>
            {formatMonthLabel(month)}
          </Typography>
          <PaymentsSummaryFilters
            loading={summary.loading}
            financial={financial}
            activeFilter={filter}
            onFilterPress={handleSummaryFilterPress}
          />
        </Box>

        {submittedCount > 0 ? (
          <Box
            component="button"
            type="button"
            onClick={() => applyFilter('underReview', { queue: 'SUBMITTED' })}
            aria-label={t('payments.attention.a11y', { count: submittedCount })}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              width: '100%',
              border: `1px solid ${colors.primary}33`,
              bgcolor: colors.successTint,
              borderRadius: `${DASHBOARD_UX.radius}px`,
              px: 1.5,
              py: 1.25,
              cursor: 'pointer',
              textAlign: 'left',
              font: 'inherit',
              transition: DASHBOARD_UX.transition,
              '&:hover': { opacity: 0.94 },
              '&:focus-visible': {
                outline: `2px solid ${colors.primary}`,
                outlineOffset: 2,
              },
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '18px',
                bgcolor: colors.white,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Users size={18} color={colors.primaryDark} strokeWidth={2.2} aria-hidden />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ ...DASHBOARD_UX.link, color: s.textPrimary, fontWeight: 700 }}>
                {t('payments.attention.title', { count: submittedCount })}
              </Typography>
              <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textSecondary }}>
                {t('payments.attention.subtitle')}
              </Typography>
            </Box>
            <ChevronRight size={18} color={colors.primaryDark} strokeWidth={2.2} aria-hidden />
          </Box>
        ) : null}

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary }}>
            {listTitle}
          </Typography>
          {!showHistory ? (
            <Button
              size="small"
              variant="text"
              onClick={() => applyFilter('history')}
              sx={{ ...DASHBOARD_UX.button, textTransform: 'none', color: s.textSecondary }}
            >
              {t('payments.tabs.history')}
            </Button>
          ) : (
            <Button
              size="small"
              variant="text"
              onClick={() => applyFilter('all')}
              sx={{ ...DASHBOARD_UX.button, textTransform: 'none', color: s.textSecondary }}
            >
              {t('payments.records.heading')}
            </Button>
          )}
        </Box>

        <Box sx={{ width: '100%', minWidth: 0 }}>
            {showRecords ? (
              <Stack spacing={1.25}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { sm: 'center' } }}>
                  <TextField
                    id="payments-search"
                    size="small"
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(0);
                    }}
                    placeholder={t('payments.records.search')}
                    fullWidth
                  />
                  {memberStatusFilter}
                  {memberIdFilter ? (
                    <Chip
                      size="small"
                      label={t('payments.workspace.memberFilter')}
                      onDelete={clearMemberFilter}
                      deleteIcon={<X size={14} />}
                      sx={{ height: DASHBOARD_UX.buttonHeight }}
                    />
                  ) : null}
                </Stack>
                {recordList.loading ? (
                  <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
                    {t('common.loading', { defaultValue: 'Loading…' })}
                  </Typography>
                ) : recordRows.length === 0 ? (
                  <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
                    {recordEmptyTitle}
                  </Typography>
                ) : (
                  recordRows.map((row) => (
                    <CompactPaymentCard
                      key={row.paymentId}
                      payment={row}
                      selected={selectedPaymentId === row.paymentId}
                      receivedLoading={cardActions.isProcessing(row.paymentId, 'received')}
                      reminderLoading={cardActions.isProcessing(row.paymentId, 'reminder')}
                      onOpen={() => selectPayment(row.paymentId)}
                      onReceived={() => cardActions.requestReceivedForPayment(row)}
                      onReminder={() => cardActions.sendReminderForPayment(row)}
                    />
                  ))
                )}
              </Stack>
            ) : (
              <DataTable
                columns={showHistory ? historyColumns : reviewColumns}
                rows={paymentRows}
                loading={showReview ? review.loading : history.loading}
                searchInputId="payments-search"
                toolbarFilters={queueFilter}
                emptyTitle={t('payments.workspace.emptyPayments')}
                selectedIds={selectedPaymentId ? [selectedPaymentId] : []}
                onRowClick={(row) => selectPayment(row.paymentId)}
                page={page}
                pageSize={pageSize}
                totalItems={
                  showReview
                    ? review.page?.totalElements
                    : history.page?.totalElements
                }
                onPageChange={setPage}
              />
            )}
        </Box>
      </Stack>

      <AppDrawer open={inspectorOpen} onClose={closeInspector} width={440}>
        <PaymentInspector
          spaceId={spaceId}
          paymentId={selectedPaymentId}
          canManage
          onClose={closeInspector}
          framed={false}
        />
      </AppDrawer>
      <AddPaymentRecordDialog
        key={createPaymentOpen ? `create-${month}` : 'create-closed'}
        open={createPaymentOpen}
        spaceId={spaceId}
        month={month}
        onClose={() => setCreatePaymentOpen(false)}
        onCreated={(paymentId) => {
          setCreatePaymentOpen(false);
          enqueueSnackbar(t('paymentCollection.addRecord.success'), { variant: 'success' });
          selectPayment(paymentId);
        }}
      />
      <PaymentReceivedConfirmDialog
        open={cardActions.confirmPayments.length > 0}
        payments={cardActions.confirmPayments}
        spaceName={permissions.space?.spaceName}
        confirming={cardActions.receivedConfirmLoading}
        onConfirm={cardActions.confirmReceived}
        onClose={cardActions.cancelConfirm}
      />
    </PageContainer>
  );
}
