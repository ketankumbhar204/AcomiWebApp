import {
  Box,
  Button,
  IconButton,
  Stack,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { StayTrailLine } from '@/shared/components/ContactAndStayMeta';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable';
import { StatusChip } from '@/shared/components/StatusChip';
import { AppDrawer } from '@/shared/components/AppDrawer';
import { LoadingState } from '@/shared/components/LoadingState';
import { PeriodMonthNav } from '@/shared/components/PeriodMonthNav';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { dashContainedButtonSx } from '@/shared/theme/dashButtonSx';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import {
  currentMonthKey,
  formatCurrency,
  isFutureMonth,
  shiftMonthKey,
} from '@/shared/utils/dashboardFinancial';
import { spaceDayMealsPath } from '@/routes/paths';
import type { SpacePaymentResponse } from '@/shared/types/payments';
import { PaymentInspector } from '../components/PaymentInspector';
import { ProofSubmitDrawer } from '../components/ProofSubmitDrawer';
import { useSpacePaymentsList } from '../hooks/usePayments';
import { usePaymentStayTrail } from '../hooks/usePaymentStayTrail';
import {
  canEditSubmittedProof,
  formatMonthLabel,
  paymentStatusLabelKey,
  paymentStatusTone,
} from '../utils/paymentHelpers';
import { useMySubscriptionStatus } from '@/modules/meals/hooks/useSubscriptionPlans';
import {
  matchesPersonalSummaryFilter,
  summarizePersonalPayments,
  usesDayMealPayments,
  type PersonalSummaryFilter,
} from '../utils/personalPaymentSummary';

function TenantPaymentTitle({ payment }: { payment: SpacePaymentResponse }) {
  const trail = usePaymentStayTrail(payment.spaceId, payment);
  return (
    <Box>
      <Box>{payment.title}</Box>
      <StayTrailLine label={trail} />
    </Box>
  );
}

export function TenantPaymentsPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const isLgDown = useMediaQuery(theme.breakpoints.down('lg'));
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const permissions = useSpacePermissions(spaceId);
  const statusQuery = useMySubscriptionStatus(spaceId, permissions.membershipRole != null);
  const [month, setMonth] = useState(currentMonthKey());
  const [summaryFilter, setSummaryFilter] = useState<PersonalSummaryFilter>('due');
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);

  const isPayPerMeal = usesDayMealPayments({
    spaceType: permissions.space?.spaceType,
    prepaidBilling: statusQuery.data?.prepaidBilling,
    mealBillingType: statusQuery.data?.mealBillingType,
  });

  const list = useSpacePaymentsList(
    spaceId,
    { month, sync: false },
    !isPayPerMeal && !statusQuery.isLoading,
  );

  const personalSummary = useMemo(
    () => summarizePersonalPayments(list.payments),
    [list.payments],
  );
  const summaryCurrency = list.payments.find((payment) => payment.currencyCode)?.currencyCode ?? 'INR';

  const rows = useMemo(
    () =>
      list.payments
        .filter((payment) => matchesPersonalSummaryFilter(payment, summaryFilter))
        .map((payment) => ({ ...payment, id: payment.paymentId })),
    [list.payments, summaryFilter],
  );

  useEffect(() => {
    setSummaryFilter('due');
  }, [month]);

  useEffect(() => {
    document.title = `${t('navigation.payments')} · ${t('common.appName')}`;
  }, [t]);

  if (statusQuery.isLoading) {
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    );
  }

  if (isPayPerMeal) {
    return (
      <PageContainer gap={0}>
        <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
          <PageHeader
            title={t('navigation.payments')}
            description={t('paymentCollection.dayMeals.subtitle', {
              defaultValue: 'This space uses pay-per-meal billing.',
            })}
            actions={
              <Button
                variant="contained"
                onClick={() => navigate(spaceDayMealsPath(spaceId))}
                sx={dashContainedButtonSx}
              >
                {t('paymentCollection.dayMeals.title', { defaultValue: 'Day meal payments' })}
              </Button>
            }
          />
        </Stack>
      </PageContainer>
    );
  }

  const columns: DataTableColumn<SpacePaymentResponse & { id: string }>[] = [
    {
      id: 'title',
      header: t('paymentCollection.fields.title'),
      accessor: (row) => <TenantPaymentTitle payment={row} />,
      primary: true,
    },
    {
      id: 'amount',
      header: t('paymentCollection.fields.amount'),
      accessor: (row) => formatCurrency(row.amount, row.currencyCode),
    },
    {
      id: 'due',
      header: t('paymentCollection.fields.dueDate'),
      accessor: (row) => row.dueDate,
    },
    {
      id: 'status',
      header: t('paymentCollection.fields.status'),
      accessor: (row) => {
        const st = row.paymentStatus ?? row.status ?? 'PENDING';
        return (
          <StatusChip label={t(paymentStatusLabelKey(st))} tone={paymentStatusTone(st)} />
        );
      },
    },
  ];

  const inspector = (
    <PaymentInspector
      spaceId={spaceId}
      paymentId={selectedPaymentId}
      canManage={false}
      framed
      onClose={() => {
        setSelectedPaymentId(null);
        setInspectorOpen(false);
      }}
      onOpenProof={() => setProofOpen(true)}
    />
  );

  return (
    <PageContainer gap={0}>
      <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
        <PageHeader
          title={t('navigation.payments')}
          description={t('payments.tenant.subtitle', { month: formatMonthLabel(month) })}
          breadcrumbs={[
            { label: permissions.space?.spaceName ?? t('navigation.space') },
            { label: t('navigation.payments') },
          ]}
          actions={
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
              <PeriodMonthNav
                month={month}
                onPrevious={() => setMonth(shiftMonthKey(month, -1))}
                onNext={() => setMonth(shiftMonthKey(month, 1))}
                onMonthSelect={setMonth}
                disableNext={isFutureMonth(shiftMonthKey(month, 1))}
                size="compact"
              />
              <IconButton
                onClick={() => void list.reload()}
                aria-label={t('common.refresh')}
                size="small"
                sx={{
                  width: DASHBOARD_UX.buttonHeight,
                  height: DASHBOARD_UX.buttonHeight,
                  border: `1px solid ${s.border}`,
                  borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                  bgcolor: s.surface,
                }}
              >
                <RefreshCw size={16} />
              </IconButton>
            </Stack>
          }
        />

        <Box
          sx={{
            display: 'grid',
            gap: `${DASHBOARD_UX.cardGap}px`,
            gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, minmax(0, 1fr))' },
          }}
        >
          {(
            [
              ['due', personalSummary.totalDue],
              ['paid', personalSummary.amountPaid],
              ['outstanding', personalSummary.outstanding],
              ['underReview', personalSummary.underReviewAmount],
            ] as const
          ).map(([key, amount]) => (
            <Box
              key={key}
              onClick={() =>
                setSummaryFilter((current) => (current === key && key !== 'due' ? 'due' : key))
              }
              sx={{
                border: `1px solid ${summaryFilter === key ? theme.palette.primary.main : s.border}`,
                borderRadius: `${DASHBOARD_UX.radius}px`,
                bgcolor: s.surface,
                px: 1.5,
                py: 1.25,
                cursor: 'pointer',
              }}
            >
              <Box sx={{ color: 'text.secondary', fontSize: 12 }}>
                {t(`payments.tenant.summary.${key}`)}
              </Box>
              <Box sx={{ fontWeight: 700, mt: 0.5 }}>
                {list.loading && list.payments.length === 0
                  ? '…'
                  : amount == null
                    ? '—'
                    : formatCurrency(amount, summaryCurrency)}
              </Box>
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            display: 'grid',
            gap: `${DASHBOARD_UX.cardGap}px`,
            gridTemplateColumns: isLgDown
              ? '1fr'
              : 'minmax(0, 1.85fr) minmax(0, 0.95fr)',
            alignItems: 'start',
          }}
        >
          <DataTable
            columns={columns}
            rows={rows}
            loading={list.loading}
            emptyTitle={t('payments.tenant.empty')}
            selectedIds={selectedPaymentId ? [selectedPaymentId] : []}
            onRowClick={(row) => {
              setSelectedPaymentId(row.paymentId);
              setInspectorOpen(true);
            }}
          />
          {!isLgDown ? (
            <Box
              sx={{
                position: 'sticky',
                top: 12,
                alignSelf: 'start',
                height: 'calc(100vh - 112px)',
                maxHeight: 'calc(100vh - 112px)',
                minHeight: 360,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {inspector}
            </Box>
          ) : null}
        </Box>
      </Stack>

      <AppDrawer
        open={inspectorOpen && isLgDown}
        onClose={() => setInspectorOpen(false)}
        width={380}
      >
        {inspector}
      </AppDrawer>

      <ProofSubmitDrawer
        open={proofOpen}
        spaceId={spaceId}
        paymentId={selectedPaymentId}
        mode={
          canEditSubmittedProof(
            list.payments.find((row) => row.paymentId === selectedPaymentId)?.paymentStatus ??
              list.payments.find((row) => row.paymentId === selectedPaymentId)?.status,
          )
            ? 'edit'
            : 'submit'
        }
        onClose={() => setProofOpen(false)}
      />
    </PageContainer>
  );
}
