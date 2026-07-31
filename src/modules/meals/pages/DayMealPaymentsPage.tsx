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
  useTheme,
} from '@mui/material';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { ContentCard } from '@/shared/components/ContentCard';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable';
import { StatusChip } from '@/shared/components/StatusChip';
import { StatCard } from '@/shared/components/StatCard';
import { EmptyState } from '@/shared/components/EmptyState';
import { LoadingState } from '@/shared/components/LoadingState';
import { SidePanel } from '@/shared/components/SidePanel';
import { AppDrawer } from '@/shared/components/AppDrawer';
import { StickyFooter } from '@/shared/components/StickyFooter';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { memberApi } from '@/modules/members/api/memberApi';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import {
  currentMonthKey,
  formatCurrency,
  canManagePayments,
} from '@/shared/utils/dashboardFinancial';
import { spacePaymentsPath } from '@/routes/paths';
import { OwnerDayMealReview } from '../components/DayMealReviewOwner';
import { mealsApi } from '../api/mealsApi';
import {
  buildDayMealPaymentListItems,
  filterDayMealPaymentsInSection,
  summarizeDayMealPayments,
  type DayMealPaymentListItem,
  type DayMealPaymentsSection,
} from '../utils/dayMealPayments';
import { shiftMonth, formatMonthLabel } from '@/modules/payments/utils/paymentHelpers';

/**
 * Day-meal payments: tenant list/bulk proof + owner headcount payment review.
 * Reuses mobile meal-poll payment APIs only (no invented queue).
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

function TenantDayMealPayments({ spaceId }: { spaceId: string }) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const [month, setMonth] = useState(currentMonthKey());
  const [section, setSection] = useState<DayMealPaymentsSection>('actionNeeded');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [detailDate, setDetailDate] = useState<string | null>(null);
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
  const sectionItems = useMemo(
    () => filterDayMealPaymentsInSection(items, section),
    [items, section],
  );
  const summary = useMemo(() => summarizeDayMealPayments(items), [items]);

  const detailQuery = useQuery({
    queryKey: ['member-meal-activity-day', spaceId, memberId, detailDate],
    queryFn: () => mealsApi.getMemberMealActivityDay(spaceId, memberId!, detailDate!),
    enabled: Boolean(spaceId && memberId && detailDate),
  });

  const submitProof = useMutation({
    mutationFn: async () => {
      if (!proofBase64 && !reference.trim()) {
        throw new Error('proof');
      }
      const body = {
        proofImageBase64: proofBase64 || undefined,
        referenceNumber: reference.trim() || undefined,
      };
      if (selectedDates.length > 1) {
        return mealsApi.submitBulkMealPollPaymentProof(spaceId, selectedDates, body);
      }
      const date = selectedDates[0] ?? detailDate;
      if (!date) throw new Error('date');
      return mealsApi.submitMealPollPaymentProof(spaceId, date, body);
    },
    onSuccess: async () => {
      enqueueSnackbar(t('meals.customerPlans.requestSubmitted', { defaultValue: 'Submitted' }), {
        variant: 'success',
      });
      setProofOpen(false);
      setSelectedDates([]);
      await queryClient.invalidateQueries({ queryKey: ['member-meal-activity', spaceId] });
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

  const columns: DataTableColumn<DayMealPaymentListItem & { id: string }>[] = [
    {
      id: 'date',
      header: t('common.date', { defaultValue: 'Date' }),
      accessor: (row) => row.date,
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
      accessor: (row) => row.mealTypes.join(', ') || '—',
    },
    {
      id: 'status',
      header: t('paymentCollection.fields.status', { defaultValue: 'Status' }),
      accessor: (row) => (
        <StatusChip
          label={row.displayStatus}
          tone={
            row.displayStatus === 'PAID'
              ? 'success'
              : row.displayStatus === 'REJECTED' || row.displayStatus === 'OVERDUE'
                ? 'error'
                : row.displayStatus === 'PENDING_APPROVAL'
                  ? 'warning'
                  : 'info'
          }
        />
      ),
    },
  ];

  return (
    <PageContainer gap={0}>
      <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
        <PageHeader
          title={t('paymentCollection.dayMeals.title', { defaultValue: 'Day meal payments' })}
          description={t('paymentCollection.dayMeals.subtitle', {
            defaultValue: 'Pay for accepted meals by day.',
          })}
          breadcrumbs={[
            { label: t('navigation.payments'), to: spacePaymentsPath(spaceId) },
            { label: t('paymentCollection.dayMeals.title', { defaultValue: 'Day meals' }) },
          ]}
          actions={
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <IconButton aria-label="Previous month" onClick={() => setMonth((m) => shiftMonth(m, -1))}>
                <ChevronLeft size={18} />
              </IconButton>
              <Typography sx={{ ...DASHBOARD_UX.body, color: s.textPrimary }}>
                {formatMonthLabel(month)}
              </Typography>
              <IconButton aria-label="Next month" onClick={() => setMonth((m) => shiftMonth(m, 1))}>
                <ChevronRight size={18} />
              </IconButton>
              <IconButton onClick={() => void activityQuery.refetch()} aria-label={t('common.refresh')}>
                <RefreshCw size={18} />
              </IconButton>
            </Stack>
          }
        />

        <Box
          sx={{
            display: 'grid',
            gap: `${DASHBOARD_UX.cardGap}px`,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          }}
        >
          <StatCard
            dense
            label={t('dashboard.financial.pending')}
            value={formatCurrency(summary.pendingAmount, summary.currencyCode)}
          />
          <StatCard
            dense
            label={t('dashboard.financial.collected')}
            value={formatCurrency(summary.collectedAmount, summary.currencyCode)}
          />
          <StatCard
            dense
            label={t('dashboard.financial.expected')}
            value={formatCurrency(summary.totalAmount, summary.currencyCode)}
          />
        </Box>

        <ContentCard>
          <FormControl size="small" sx={{ maxWidth: 240, mb: 2 }}>
            <InputLabel id="section-label">{t('common.filter', { defaultValue: 'Filter' })}</InputLabel>
            <Select
              labelId="section-label"
              label={t('common.filter', { defaultValue: 'Filter' })}
              value={section}
              onChange={(e) => setSection(e.target.value as DayMealPaymentsSection)}
            >
              <MenuItem value="actionNeeded">
                {t('paymentCollection.dayMeals.actionNeeded', { defaultValue: 'Action needed' })}
              </MenuItem>
              <MenuItem value="underReview">
                {t('paymentCollection.dayMeals.underReview', { defaultValue: 'Under review' })}
              </MenuItem>
              <MenuItem value="history">{t('paymentCollection.tabs.history')}</MenuItem>
            </Select>
          </FormControl>

          {activityQuery.isLoading || linkedMember.isLoading ? (
            <LoadingState />
          ) : sectionItems.length === 0 ? (
            <EmptyState
              title={t('paymentCollection.dayMeals.empty', { defaultValue: 'No day meals in this view' })}
            />
          ) : (
            <DataTable
              rows={sectionItems.map((row) => ({ ...row, id: row.date }))}
              columns={columns}
              selectedIds={selectedDates}
              onSelectionChange={setSelectedDates}
              selectable={section === 'actionNeeded'}
              onRowClick={(row) => setDetailDate(row.date)}
            />
          )}
        </ContentCard>
      </Stack>

      {section === 'actionNeeded' && selectedDates.length > 0 ? (
        <StickyFooter>
          <Button
            variant="contained"
            sx={dashContainedButtonSx}
            onClick={() => {
              setProofOpen(true);
              setReference('');
              setProofBase64(null);
            }}
          >
            {t('paymentCollection.actions.submitProof', {
              defaultValue: 'Submit proof',
            })}{' '}
            ({selectedDates.length})
          </Button>
        </StickyFooter>
      ) : null}

      {detailDate ? (
        <SidePanel title={detailDate} onClose={() => setDetailDate(null)}>
          {detailQuery.isLoading ? (
            <LoadingState />
          ) : (
            <Stack spacing={1.5}>
              <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                {formatCurrency(
                  detailQuery.data?.dayTotal ?? 0,
                  detailQuery.data?.currencyCode ?? summary.currencyCode,
                )}
              </Typography>
              <StatusChip label={detailQuery.data?.paymentStatus ?? 'PENDING'} />
              {detailQuery.data?.payment?.proofImageUrl ? (
                <Box
                  component="img"
                  src={detailQuery.data.payment.proofImageUrl}
                  alt="Proof"
                  sx={{
                    maxWidth: '100%',
                    borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                    border: `1px solid ${s.border}`,
                  }}
                />
              ) : null}
              {detailQuery.data?.payment?.rejectionReason ? (
                <Alert severity="error">{detailQuery.data.payment.rejectionReason}</Alert>
              ) : null}
              {section === 'actionNeeded' ? (
                <Button
                  variant="contained"
                  sx={dashContainedButtonSx}
                  onClick={() => {
                    setSelectedDates([detailDate]);
                    setProofOpen(true);
                  }}
                >
                  {t('paymentCollection.actions.submitProof', { defaultValue: 'Submit proof' })}
                </Button>
              ) : null}
            </Stack>
          )}
        </SidePanel>
      ) : null}

      <AppDrawer
        open={proofOpen}
        onClose={() => setProofOpen(false)}
        title={t('paymentCollection.actions.submitProof', { defaultValue: 'Submit proof' })}
      >
        <Stack spacing={2} sx={{ p: 2 }}>
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textPrimary }}>
            {selectedDates.join(', ')}
          </Typography>
          <TextField
            label={t('paymentCollection.proof.reference', { defaultValue: 'UTR / reference' })}
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder={t('paymentCollection.proof.utrPlaceholder')}
            fullWidth
          />
          <Button variant="outlined" component="label" sx={dashOutlinedButtonSx}>
            {proofBase64 ? t('meals.customerPlans.removeScreenshot') : t('meals.subscriptionPlans.viewPaymentProof')}
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
