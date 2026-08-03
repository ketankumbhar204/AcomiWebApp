import {
  Alert,
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  BarChart3,
  Copy,
  FileText,
  Info,
  IndianRupee,
  RefreshCw,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { IconBadge } from '@/modules/dashboard/components/IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable';
import { StatusChip } from '@/shared/components/StatusChip';
import { StatCard } from '@/shared/components/StatCard';
import { EmptyState } from '@/shared/components/EmptyState';
import { LoadingState } from '@/shared/components/LoadingState';
import { PeriodMonthNav } from '@/shared/components/PeriodMonthNav';
import { SidePanel } from '@/shared/components/SidePanel';
import { AppDrawer } from '@/shared/components/AppDrawer';
import { StickyFooter } from '@/shared/components/StickyFooter';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { memberApi } from '@/modules/members/api/memberApi';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import {
  currentMonthKey,
  formatCurrency,
  canManagePayments,
} from '@/shared/utils/dashboardFinancial';
import { spacePaymentsPath } from '@/routes/paths';
import type {
  MemberMealActivityDayDetail,
  MemberMealActivitySlotDetail,
  MealType,
} from '@/shared/types/meals';
import { OwnerDayMealReview } from '../components/DayMealReviewOwner';
import { MealSlotAccordions } from '../components/MealSlotAccordions';
import { mealsApi } from '../api/mealsApi';
import { formatActivityListDate } from '../utils/memberMealActivityHistory';
import {
  buildDayMealPaymentListItems,
  filterDayMealPaymentsInSection,
  resolvePreferredDayMealPaymentsSection,
  summarizeDayMealPayments,
  type DayMealPaymentDisplayStatus,
  type DayMealPaymentListItem,
  type DayMealPaymentsSection,
} from '../utils/dayMealPayments';
import { shiftMonth } from '@/modules/payments/utils/paymentHelpers';

const PAGE_SIZE = 10;

/**
 * Day-meal payments: tenant list/bulk proof + owner headcount payment review.
 */
export function DayMealPaymentsPage() {
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const permissions = useSpacePermissions(spaceId);
  const isOwner = canManagePayments(permissions.membershipRole);

  if (isOwner) {
    return <OwnerDayMealReview spaceId={spaceId} />;
  }
  return <TenantDayMealPayments spaceId={spaceId} />;
}

function statusTone(
  status: DayMealPaymentDisplayStatus | string | null | undefined,
): 'success' | 'error' | 'warning' | 'info' | 'neutral' {
  if (status === 'PAID') return 'success';
  if (status === 'REJECTED' || status === 'OVERDUE') return 'error';
  if (status === 'PENDING_APPROVAL') return 'warning';
  if (status === 'PENDING') return 'info';
  return 'neutral';
}

function statusLabel(
  status: string | null | undefined,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (!status) return t('paymentCollection.dayMeals.status.pending', { defaultValue: 'Pending' });
  const key = status.toUpperCase();
  if (key === 'PENDING_APPROVAL') {
    return t('paymentCollection.dayMeals.status.underReview', { defaultValue: 'Under review' });
  }
  if (key === 'OVERDUE') {
    return t('paymentCollection.dayMeals.status.overdue', { defaultValue: 'Overdue' });
  }
  if (key === 'PAID') {
    return t('paymentCollection.dayMeals.status.paid', { defaultValue: 'Paid' });
  }
  if (key === 'REJECTED') {
    return t('paymentCollection.dayMeals.status.rejected', { defaultValue: 'Rejected' });
  }
  return t('paymentCollection.dayMeals.status.pending', { defaultValue: 'Pending' });
}

function isActionNeededStatus(status: DayMealPaymentDisplayStatus | undefined): boolean {
  return status === 'PENDING' || status === 'OVERDUE' || status === 'REJECTED';
}

type DayMealTenantInspectorProps = {
  date: string | null;
  listItem: DayMealPaymentListItem | null;
  detail: MemberMealActivityDayDetail | null | undefined;
  loading: boolean;
  currencyCode: string;
  canSubmitProof: boolean;
  framed?: boolean;
  onClose: () => void;
  onSubmitProof: () => void;
};

function DayMealTenantInspector({
  date,
  listItem,
  detail,
  loading,
  currencyCode,
  canSubmitProof,
  framed = true,
  onClose,
  onSubmitProof,
}: DayMealTenantInspectorProps) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  if (!date) {
    return (
      <SidePanel
        title={t('payments.inspector.title', { defaultValue: 'Payment details' })}
        onClose={onClose}
        framed={framed}
      >
        <EmptyState
          icon={
            <IconBadge accent={colors.primaryDark}>
              <UtensilsCrossed />
            </IconBadge>
          }
          title={t('paymentCollection.dayMeals.selectDay', {
            defaultValue: 'Select a day',
          })}
          description={t('paymentCollection.dayMeals.selectDayBody', {
            defaultValue: 'Choose a row to view meals, amount, and payment proof.',
          })}
        />
      </SidePanel>
    );
  }

  const amount = detail?.dayTotal ?? listItem?.amount ?? 0;
  const code = detail?.currencyCode ?? listItem?.currencyCode ?? currencyCode;
  const paymentStatus = detail?.paymentStatus ?? listItem?.paymentStatus ?? null;
  const displayStatus = listItem?.displayStatus ?? paymentStatus ?? 'PENDING';
  const slots = detail?.slots ?? [];
  const mealTypes =
    slots.length > 0
      ? slots.filter((slot) => slot.status === 'ACCEPTED').map((slot) => slot.mealType)
      : (listItem?.mealTypes ?? []);
  const displaySlots: MemberMealActivitySlotDetail[] =
    slots.length > 0
      ? slots
      : mealTypes.map((mealType: MealType) => ({
          mealType,
          status: 'ACCEPTED',
          selections: [],
        }));
  const payment = detail?.payment;
  const reference = payment?.referenceNumber ?? listItem?.paymentReference ?? null;

  const copyReference = async () => {
    if (!reference) return;
    try {
      await navigator.clipboard.writeText(reference);
      enqueueSnackbar(t('paymentCollection.dayMeals.referenceCopied', { defaultValue: 'Reference copied' }), {
        variant: 'success',
      });
    } catch {
      enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
    }
  };

  return (
    <SidePanel
      title={formatActivityListDate(date)}
      subtitle={date}
      onClose={onClose}
      framed={framed}
      footer={
        <Stack spacing={1}>
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              alignItems: 'flex-start',
              px: 1.25,
              py: 1,
              borderRadius: `${DASHBOARD_UX.tileRadius}px`,
              bgcolor: s.successTint,
              border: `1px solid ${s.border}`,
            }}
          >
            <Info size={15} color={colors.primaryDark} style={{ flexShrink: 0, marginTop: 2 }} />
            <Typography sx={{ fontSize: 12, color: s.textSecondary, lineHeight: 1.4 }}>
              {t('paymentCollection.dayMeals.inspectorHint', {
                defaultValue:
                  'Payments are updated once the meal poll is closed and reviewed.',
              })}
            </Typography>
          </Box>
          {canSubmitProof ? (
            <Button variant="contained" onClick={onSubmitProof} sx={dashContainedButtonSx} fullWidth>
              {t('paymentCollection.actions.submitProof', { defaultValue: 'Submit proof' })}
            </Button>
          ) : null}
        </Stack>
      }
    >
      {loading && !detail ? (
        <LoadingState />
      ) : (
        <Stack spacing={1.5}>
          <Box
            sx={{
              px: 1.25,
              py: 0.85,
              borderRadius: `${DASHBOARD_UX.tileRadius}px`,
              bgcolor:
                displayStatus === 'PAID'
                  ? `${colors.success}18`
                  : displayStatus === 'PENDING_APPROVAL'
                    ? '#FEF3C7'
                    : `${colors.primaryDark}14`,
              border: `1px solid ${
                displayStatus === 'PAID'
                  ? `${colors.success}44`
                  : displayStatus === 'PENDING_APPROVAL'
                    ? '#F59E0B55'
                    : `${colors.primaryDark}33`
              }`,
            }}
          >
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 700,
                color:
                  displayStatus === 'PAID'
                    ? colors.success
                    : displayStatus === 'PENDING_APPROVAL'
                      ? '#B45309'
                      : colors.primaryDark,
              }}
            >
              {statusLabel(displayStatus, t)}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                bgcolor: colors.primaryDark,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <IndianRupee size={22} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 12, color: s.textMuted }}>
                {t('paymentCollection.fields.amount')}
              </Typography>
              <Typography sx={{ fontSize: 22, fontWeight: 700, color: s.textPrimary, lineHeight: 1.2 }}>
                {formatCurrency(amount, code)}
              </Typography>
            </Box>
          </Stack>

          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: s.textPrimary, mb: 1 }}>
              {t('meals.activity.daySheet.mealSummary', { defaultValue: 'Meal summary' })}
            </Typography>
            <MealSlotAccordions slots={displaySlots} currencyCode={code} />
          </Box>

          {reference ? (
            <Box>
              <Typography sx={{ fontSize: 12, color: s.textMuted, mb: 0.5 }}>
                {t('paymentCollection.proof.reference', { defaultValue: 'UTR / reference' })}
              </Typography>
              <Stack
                direction="row"
                spacing={0.75}
                sx={{
                  alignItems: 'center',
                  px: 1.25,
                  py: 1,
                  borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                  border: `1px solid ${s.border}`,
                  bgcolor: s.elevated,
                }}
              >
                <Typography
                  sx={{
                    flex: 1,
                    fontSize: 13,
                    fontWeight: 600,
                    color: s.textPrimary,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  }}
                  noWrap
                >
                  {reference}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => void copyReference()}
                  aria-label={t('common.copy', { defaultValue: 'Copy' })}
                  sx={{ width: 28, height: 28 }}
                >
                  <Copy size={14} />
                </IconButton>
              </Stack>
            </Box>
          ) : null}

          {payment?.proofImageUrl ? (
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: s.textPrimary, mb: 1 }}>
                {t('paymentCollection.proof.title', { defaultValue: 'Payment proof' })}
              </Typography>
              <Box
                component="img"
                src={payment.proofImageUrl}
                alt={t('paymentCollection.proof.title', { defaultValue: 'Proof' })}
                sx={{
                  width: '100%',
                  maxHeight: 200,
                  objectFit: 'contain',
                  borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                  border: `1px solid ${s.border}`,
                  bgcolor: s.elevated,
                }}
              />
            </Box>
          ) : null}

          {payment?.rejectionReason ? <Alert severity="error">{payment.rejectionReason}</Alert> : null}
        </Stack>
      )}
    </SidePanel>
  );
}

function TenantDayMealPayments({ spaceId }: { spaceId: string }) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const isLgDown = useMediaQuery(theme.breakpoints.down('lg'));
  const [month, setMonth] = useState(currentMonthKey());
  const [section, setSection] = useState<DayMealPaymentsSection>('all');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [detailDate, setDetailDate] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [didAutoSelect, setDidAutoSelect] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);
  const [reference, setReference] = useState('');
  const [proofBase64, setProofBase64] = useState<string | null>(null);

  const linkedMember = useQuery({
    queryKey: ['linked-member-me', spaceId],
    queryFn: () => memberApi.getMyLinkedMember(spaceId),
    enabled: Boolean(spaceId),
  });

  const memberId = linkedMember.data?.memberId;

  const activityQuery = useQuery({
    queryKey: ['member-meal-activity', spaceId, memberId, month],
    queryFn: () => mealsApi.getMemberMealActivity(spaceId, memberId!, month),
    enabled: Boolean(spaceId && memberId),
  });

  const items = useMemo(
    () => buildDayMealPaymentListItems(activityQuery.data),
    [activityQuery.data],
  );

  useEffect(() => {
    setSelectedDates([]);
    setDetailDate(null);
    setPage(0);
    setDidAutoSelect(false);
  }, [month]);

  useEffect(() => {
    if (activityQuery.isLoading || linkedMember.isLoading) return;
    setSection((prev) => resolvePreferredDayMealPaymentsSection(items, prev));
  }, [activityQuery.isLoading, items, linkedMember.isLoading, month]);

  useEffect(() => {
    setPage(0);
  }, [section]);

  const sectionItems = useMemo(
    () => filterDayMealPaymentsInSection(items, section),
    [items, section],
  );
  const summary = useMemo(() => summarizeDayMealPayments(items), [items]);

  const pagedRows = useMemo(() => {
    const start = page * PAGE_SIZE;
    return sectionItems.slice(start, start + PAGE_SIZE);
  }, [page, sectionItems]);

  const detailQuery = useQuery({
    queryKey: ['member-meal-activity-day', spaceId, memberId, detailDate],
    queryFn: () => mealsApi.getMemberMealActivityDay(spaceId, memberId!, detailDate!),
    enabled: Boolean(spaceId && memberId && detailDate),
  });

  const selectedListItem = useMemo(
    () => items.find((item) => item.date === detailDate) ?? null,
    [detailDate, items],
  );

  const canSubmitProofForDetail = isActionNeededStatus(selectedListItem?.displayStatus);

  const selectableSelectedDates = useMemo(
    () =>
      selectedDates.filter((date) => {
        const item = items.find((row) => row.date === date);
        return isActionNeededStatus(item?.displayStatus);
      }),
    [items, selectedDates],
  );

  const submitProof = useMutation({
    mutationFn: async () => {
      if (!proofBase64 && !reference.trim()) {
        throw new Error('proof');
      }
      const body = {
        proofImageBase64: proofBase64 || undefined,
        referenceNumber: reference.trim() || undefined,
      };
      const dates =
        selectableSelectedDates.length > 0
          ? selectableSelectedDates
          : detailDate && canSubmitProofForDetail
            ? [detailDate]
            : [];
      if (dates.length === 0) throw new Error('date');
      if (dates.length > 1) {
        return mealsApi.submitBulkMealPollPaymentProof(spaceId, dates, body);
      }
      return mealsApi.submitMealPollPaymentProof(spaceId, dates[0]!, body);
    },
    onSuccess: async () => {
      enqueueSnackbar(t('meals.customerPlans.requestSubmitted', { defaultValue: 'Submitted' }), {
        variant: 'success',
      });
      setProofOpen(false);
      setSelectedDates([]);
      await queryClient.invalidateQueries({ queryKey: ['member-meal-activity', spaceId] });
      void detailQuery.refetch();
    },
    onError: (err) => {
      if (err instanceof Error && err.message === 'proof') {
        enqueueSnackbar(t('meals.customerPlans.proofOrReferenceRequired'), { variant: 'warning' });
        return;
      }
      enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
    },
  });

  useEffect(() => {
    document.title = `${t('navigation.payments')} · ${t('common.appName')}`;
  }, [t]);

  // Auto-open first row detail on desktop once per month load
  useEffect(() => {
    if (isLgDown || didAutoSelect || detailDate || sectionItems.length === 0) return;
    setDetailDate(sectionItems[0]!.date);
    setDidAutoSelect(true);
  }, [detailDate, didAutoSelect, isLgDown, sectionItems]);

  const columns: DataTableColumn<DayMealPaymentListItem & { id: string }>[] = [
    {
      id: 'date',
      header: t('common.date', { defaultValue: 'Date' }),
      accessor: (row) => formatActivityListDate(row.date),
      primary: true,
    },
    {
      id: 'amount',
      header: t('paymentCollection.fields.amount'),
      accessor: (row) => formatCurrency(row.amount, row.currencyCode),
    },
    {
      id: 'meals',
      header: t('navigation.meals'),
      accessor: (row) =>
        row.mealTypes.map((mealType) => t(`meals.mealType.${mealType}`)).join(', ') || '—',
    },
    {
      id: 'status',
      header: t('paymentCollection.fields.status', { defaultValue: 'Status' }),
      accessor: (row) => (
        <StatusChip label={statusLabel(row.displayStatus, t)} tone={statusTone(row.displayStatus)} />
      ),
    },
    {
      id: 'open',
      header: '',
      width: 40,
      accessor: () => <ChevronRight size={16} color={s.textMuted} />,
    },
  ];

  const openProof = (dates: string[]) => {
    setSelectedDates(dates);
    setProofOpen(true);
    setReference('');
    setProofBase64(null);
  };

  const showDesktopPanel = !isLgDown;

  const inspector = (
    <DayMealTenantInspector
      date={detailDate}
      listItem={selectedListItem}
      detail={detailQuery.data}
      loading={detailQuery.isLoading}
      currencyCode={summary.currencyCode}
      canSubmitProof={Boolean(detailDate && canSubmitProofForDetail)}
      framed={!isLgDown}
      onClose={() => setDetailDate(null)}
      onSubmitProof={() => {
        if (detailDate) openProof([detailDate]);
      }}
    />
  );

  const monthControls = (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', alignSelf: 'flex-start' }}>
      <PeriodMonthNav
        month={month}
        onPrevious={() => setMonth((m) => shiftMonth(m, -1))}
        onNext={() => setMonth((m) => shiftMonth(m, 1))}
        disableNext={month >= currentMonthKey()}
        size="compact"
      />
      <IconButton
        size="small"
        onClick={() => void activityQuery.refetch()}
        aria-label={t('common.refresh')}
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
    </Stack>
  );

  return (
    <PageContainer gap={0}>
      <Stack spacing={1.5} sx={{ width: '100%' }}>
        <PageHeader
          title={t('paymentCollection.dayMeals.title', { defaultValue: 'Day meal payments' })}
          description={t('paymentCollection.dayMeals.subtitle', {
            defaultValue: 'Pay for accepted meals by day.',
          })}
          breadcrumbs={[
            { label: t('navigation.payments'), to: spacePaymentsPath(spaceId) },
            {
              label: t('paymentCollection.dayMeals.breadcrumb', { defaultValue: 'Day meals' }),
            },
          ]}
        />

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.25}
          sx={{ alignItems: { md: 'stretch' }, justifyContent: 'space-between' }}
        >
          <Box
            sx={{
              display: 'grid',
              gap: 1.25,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
              flex: 1,
              minWidth: 0,
            }}
          >
            <StatCard
              dense
              label={t('dashboard.financial.pending')}
              value={formatCurrency(summary.pendingAmount, summary.currencyCode)}
              icon={
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                    bgcolor: '#FEF3C7',
                    color: '#D97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FileText size={16} />
                </Box>
              }
            />
            <StatCard
              dense
              label={t('dashboard.financial.collected')}
              value={formatCurrency(summary.collectedAmount, summary.currencyCode)}
              icon={
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                    bgcolor: `${colors.success}18`,
                    color: colors.success,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Wallet size={16} />
                </Box>
              }
            />
            <StatCard
              dense
              label={t('dashboard.financial.expected')}
              value={formatCurrency(summary.totalAmount, summary.currencyCode)}
              icon={
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                    bgcolor: '#DBEAFE',
                    color: '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <BarChart3 size={16} />
                </Box>
              }
            />
          </Box>
          {monthControls}
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gap: `${DASHBOARD_UX.cardGap}px`,
            gridTemplateColumns: showDesktopPanel
              ? 'minmax(0, 1.85fr) minmax(300px, 0.95fr)'
              : '1fr',
            alignItems: 'start',
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            {activityQuery.isLoading || linkedMember.isLoading ? (
              <LoadingState />
            ) : (
              <DataTable
                rows={pagedRows.map((row) => ({ ...row, id: row.date }))}
                columns={columns}
                emptyTitle={t('paymentCollection.dayMeals.empty', {
                  defaultValue: 'No day meals in this view',
                })}
                page={page}
                pageSize={PAGE_SIZE}
                totalItems={sectionItems.length}
                onPageChange={setPage}
                zeroBasedPage
                toolbarFilters={
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel id="section-label">
                      {t('common.filter', { defaultValue: 'Filter' })}
                    </InputLabel>
                    <Select
                      labelId="section-label"
                      label={t('common.filter', { defaultValue: 'Filter' })}
                      value={section}
                      onChange={(e) => {
                        setSection(e.target.value as DayMealPaymentsSection);
                        setSelectedDates([]);
                      }}
                    >
                      <MenuItem value="all">
                        {t('paymentCollection.dayMeals.filterAll', { defaultValue: 'All' })}
                      </MenuItem>
                      <MenuItem value="actionNeeded">
                        {t('paymentCollection.dayMeals.actionNeeded', {
                          defaultValue: 'Action needed',
                        })}
                      </MenuItem>
                      <MenuItem value="underReview">
                        {t('paymentCollection.dayMeals.underReview', {
                          defaultValue: 'Under review',
                        })}
                      </MenuItem>
                      <MenuItem value="history">{t('paymentCollection.tabs.history')}</MenuItem>
                    </Select>
                  </FormControl>
                }
                selectable
                selectedIds={selectedDates}
                onSelectionChange={setSelectedDates}
                bulkActions={
                  <Button
                    size="small"
                    onClick={() => setSelectedDates([])}
                    sx={{
                      ...dashOutlinedButtonSx,
                      minHeight: 28,
                      height: 28,
                      border: 'none',
                      color: colors.primaryDark,
                      '&:hover': { bgcolor: 'transparent', border: 'none' },
                    }}
                  >
                    {t('common.clear', { defaultValue: 'Clear' })}
                  </Button>
                }
                onRowClick={(row) => setDetailDate(row.date)}
              />
            )}
          </Box>

          {showDesktopPanel ? (
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

      {selectableSelectedDates.length > 0 ? (
        <StickyFooter>
          <Button
            variant="contained"
            sx={dashContainedButtonSx}
            onClick={() => openProof(selectableSelectedDates)}
          >
            {t('paymentCollection.actions.submitProof', {
              defaultValue: 'Submit proof',
            })}{' '}
            ({selectableSelectedDates.length})
          </Button>
        </StickyFooter>
      ) : null}

      <AppDrawer
        open={Boolean(detailDate) && isLgDown}
        onClose={() => setDetailDate(null)}
        width={400}
      >
        {inspector}
      </AppDrawer>

      <AppDrawer
        open={proofOpen}
        onClose={() => setProofOpen(false)}
        title={t('paymentCollection.actions.submitProof', { defaultValue: 'Submit proof' })}
      >
        <Stack spacing={2} sx={{ p: 2 }}>
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textPrimary }}>
            {(selectableSelectedDates.length > 0
              ? selectableSelectedDates
              : detailDate
                ? [detailDate]
                : []
            ).join(', ')}
          </Typography>
          <TextField
            label={t('paymentCollection.proof.reference', { defaultValue: 'UTR / reference' })}
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder={t('paymentCollection.proof.utrPlaceholder')}
            fullWidth
          />
          <Button variant="outlined" component="label" sx={dashOutlinedButtonSx}>
            {proofBase64
              ? t('meals.customerPlans.removeScreenshot')
              : t('meals.subscriptionPlans.viewPaymentProof')}
            <input
              hidden
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file || proofBase64) {
                  setProofBase64(null);
                  e.target.value = '';
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => {
                  const result = String(reader.result ?? '');
                  setProofBase64(result.includes(',') ? result.split(',')[1]! : result);
                };
                reader.readAsDataURL(file);
              }}
            />
          </Button>
        </Stack>
        <StickyFooter>
          <Button
            variant="contained"
            disabled={submitProof.isPending}
            sx={dashContainedButtonSx}
            onClick={() => void submitProof.mutateAsync()}
          >
            {submitProof.isPending ? t('common.pleaseWait') : t('common.confirm')}
          </Button>
        </StickyFooter>
      </AppDrawer>
    </PageContainer>
  );
}
