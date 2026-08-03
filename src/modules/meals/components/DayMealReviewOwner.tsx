import {
  Avatar,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { ChevronRight, Info, UtensilsCrossed } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { IconBadge } from '@/modules/dashboard/components/IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { AppDrawer } from '@/shared/components/AppDrawer';
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable';
import { EmptyState } from '@/shared/components/EmptyState';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { SidePanel } from '@/shared/components/SidePanel';
import { StatusChip, type StatusChipTone } from '@/shared/components/StatusChip';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import type { MealHeadcountMember, MealPollPaymentStatus, MealType } from '@/shared/types/meals';
import { spacePaymentsPath } from '@/routes/paths';
import { mealsApi } from '../api/mealsApi';
import { useMemberMealPaymentEvents } from '../hooks/useMemberMealActivity';
import { canSendPaymentReminder } from '../utils/dayMealPayments';
import { MEAL_TYPES, todayIsoDate } from '../utils/mealDates';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function paymentStatusTone(status?: MealPollPaymentStatus | null): StatusChipTone {
  switch (status) {
    case 'PAID':
      return 'success';
    case 'PENDING_APPROVAL':
      return 'info';
    case 'PENDING':
      return 'warning';
    case 'REJECTED':
      return 'error';
    default:
      return 'neutral';
  }
}

function paymentStatusLabel(
  status: MealPollPaymentStatus | null | undefined,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (!status) return '—';
  if (status === 'PENDING_APPROVAL') {
    return t('paymentCollection.dayMeals.status.pendingApproval', {
      defaultValue: 'Pending approval',
    });
  }
  if (status === 'PAID') {
    return t('paymentCollection.dayMeals.status.approved', { defaultValue: 'Approved' });
  }
  if (status === 'REJECTED') {
    return t('paymentCollection.dayMeals.status.rejected', { defaultValue: 'Rejected' });
  }
  return t('paymentCollection.dayMeals.status.pending', { defaultValue: 'Pending' });
}

const filterControlSx = {
  minWidth: 140,
  '& .MuiInputBase-root': {
    minHeight: DASHBOARD_UX.buttonHeight,
    height: DASHBOARD_UX.buttonHeight,
    borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
    ...DASHBOARD_UX.body,
  },
} as const;

type DayMealReviewInspectorProps = {
  spaceId: string;
  date: string;
  mealType: MealType;
  member: MealHeadcountMember | null;
  remarks: string;
  onRemarksChange: (value: string) => void;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onRemind: () => void;
  approving: boolean;
  rejecting: boolean;
  reminding: boolean;
  framed?: boolean;
};

function DayMealReviewInspector({
  spaceId,
  date,
  mealType,
  member,
  remarks,
  onRemarksChange,
  onClose,
  onApprove,
  onReject,
  onRemind,
  approving,
  rejecting,
  reminding,
  framed = true,
}: DayMealReviewInspectorProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const month = date.slice(0, 7);
  const eventsQuery = useMemberMealPaymentEvents(
    spaceId,
    member?.memberId,
    month,
    Boolean(member?.memberId),
  );

  const dayEvents = useMemo(
    () => (eventsQuery.events ?? []).filter((event) => event.pollDate === date),
    [date, eventsQuery.events],
  );

  if (!member) {
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
          title={t('paymentCollection.dayMeals.selectMember', {
            defaultValue: 'Select a member',
          })}
          description={t('paymentCollection.dayMeals.selectMemberBody', {
            defaultValue: 'Choose a row to review proof and take action.',
          })}
        />
      </SidePanel>
    );
  }

  const status = member.paymentStatus ?? null;

  return (
    <SidePanel
      title={member.memberName}
      subtitle={`${t(`meals.mealType.${mealType}`)} · ${date}`}
      onClose={onClose}
      framed={framed}
      footer={
        <Stack spacing={1}>
          <TextField
            size="small"
            label={t('meals.customerPlans.notesLabel')}
            value={remarks}
            onChange={(e) => onRemarksChange(e.target.value)}
            placeholder={t('meals.poll.approvalRemarksPlaceholder')}
            fullWidth
            multiline
            minRows={2}
          />
          {status === 'PENDING_APPROVAL' ? (
            <>
              <Button
                variant="contained"
                disabled={approving}
                onClick={onApprove}
                sx={{
                  ...dashContainedButtonSx,
                  bgcolor: colors.primaryDark,
                  '&:hover': { bgcolor: colors.primaryHover },
                }}
              >
                {t('meals.subscriptionPlans.approveAction')}
              </Button>
              <Button
                variant="outlined"
                color="error"
                disabled={rejecting}
                onClick={onReject}
                sx={dashOutlinedButtonSx}
              >
                {t('meals.subscriptionPlans.rejectAction')}
              </Button>
            </>
          ) : null}
          {canSendPaymentReminder(status) ? (
            <Button
              variant="outlined"
              disabled={reminding}
              onClick={onRemind}
              sx={dashOutlinedButtonSx}
            >
              {t('paymentCollection.actions.sendReminder', { defaultValue: 'Send reminder' })}
            </Button>
          ) : null}
        </Stack>
      }
    >
      <Stack spacing={`${DASHBOARD_UX.cardGap}px`}>
        <StatusChip label={paymentStatusLabel(status, t)} tone={paymentStatusTone(status)} />

        <Box
          sx={{
            p: `${DASHBOARD_UX.metricPadding}px`,
            borderRadius: `${DASHBOARD_UX.radius}px`,
            border: `1px solid ${s.border}`,
            bgcolor: s.surface,
            boxShadow: s.shadow,
          }}
        >
          <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, mb: 1 }}>
            {t('meals.activity.daySheet.mealSummary', { defaultValue: 'Meal summary' })}
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 1.25,
            }}
          >
            <Box>
              <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
                {t('navigation.meals')}
              </Typography>
              <Typography sx={{ ...DASHBOARD_UX.link, color: s.textPrimary }}>
                {t(`meals.mealType.${mealType}`)}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
                {t('meals.subscriptionPlans.mealsLabel')}
              </Typography>
              <Typography sx={{ ...DASHBOARD_UX.link, color: s.textPrimary }}>
                {member.quantity ?? 1}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
                {t('common.date', { defaultValue: 'Date' })}
              </Typography>
              <Typography sx={{ ...DASHBOARD_UX.link, color: s.textPrimary }}>
                {date}
              </Typography>
            </Box>
            {member.deliveryLocationName ? (
              <Box>
                <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
                  {t('meals.activity.deliveryLocation', { defaultValue: 'Delivery' })}
                </Typography>
                <Typography sx={{ ...DASHBOARD_UX.link, color: s.textPrimary }}>
                  {member.deliveryLocationName}
                </Typography>
              </Box>
            ) : null}
          </Box>
        </Box>

        {member.paymentProofImageUrl ? (
          <Box
            sx={{
              p: `${DASHBOARD_UX.metricPadding}px`,
              borderRadius: `${DASHBOARD_UX.radius}px`,
              border: `1px solid ${s.border}`,
              bgcolor: s.surface,
            }}
          >
            <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, mb: 1 }}>
              {t('paymentCollection.proof.title', { defaultValue: 'Payment proof' })}
            </Typography>
            <Box
              component="img"
              src={member.paymentProofImageUrl}
              alt={t('paymentCollection.proof.title', { defaultValue: 'Proof' })}
              sx={{
                width: '100%',
                maxHeight: 220,
                objectFit: 'contain',
                borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                border: `1px solid ${s.border}`,
                bgcolor: s.elevated,
              }}
            />
          </Box>
        ) : null}

        <Box
          sx={{
            p: `${DASHBOARD_UX.metricPadding}px`,
            borderRadius: `${DASHBOARD_UX.radius}px`,
            border: `1px solid ${s.border}`,
            bgcolor: s.surface,
          }}
        >
          <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, mb: 1 }}>
            {t('meals.paymentTimeline.title')}
          </Typography>
          {eventsQuery.loading ? (
            <LoadingState />
          ) : dayEvents.length === 0 ? (
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted }}>
              {t('meals.paymentTimeline.empty')}
            </Typography>
          ) : (
            <Stack spacing={1}>
              {dayEvents.map((event) => (
                <Box
                  key={event.eventId}
                  sx={{
                    display: 'flex',
                    gap: 1,
                    p: 1,
                    borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                    border: `1px solid ${s.border}`,
                    bgcolor: s.elevated,
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: colors.success,
                      mt: 0.6,
                      flexShrink: 0,
                    }}
                  />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ ...DASHBOARD_UX.link, color: s.textPrimary }}>
                      {t(`meals.paymentTimeline.events.${event.eventType}`, {
                        date: event.pollDate,
                      })}
                    </Typography>
                    <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
                      {new Date(event.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Stack>
    </SidePanel>
  );
}

/** Owner headcount payment review — Dashboard master-detail layout. */
export function OwnerDayMealReview({ spaceId }: { spaceId: string }) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isLgDown = useMediaQuery(theme.breakpoints.down('lg'));
  const s = dashSurfaces(theme.palette.mode);
  const [date, setDate] = useState(todayIsoDate());
  const [mealType, setMealType] = useState<MealType>('LUNCH');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [remarks, setRemarks] = useState('');

  const detailQuery = useQuery({
    queryKey: ['meal-headcount-detail', spaceId, date, mealType],
    queryFn: () => mealsApi.getMealHeadcountDetail(spaceId, date, mealType),
    enabled: Boolean(spaceId && date && mealType),
  });

  useEffect(() => {
    document.title = `${t('paymentCollection.dayMeals.reviewTitle', { defaultValue: 'Day meal review' })} · ${t('common.appName')}`;
  }, [t]);

  useEffect(() => {
    setSelectedMemberId(null);
    setRemarks('');
  }, [date, mealType]);

  const members = useMemo(() => {
    const list: MealHeadcountMember[] = [];
    for (const option of detailQuery.data?.options ?? []) {
      for (const member of option.members) {
        if (!list.some((m) => m.memberId === member.memberId)) {
          list.push(member);
        }
      }
    }
    return list;
  }, [detailQuery.data]);

  const selectedMember =
    members.find((member) => member.memberId === selectedMemberId) ?? null;

  const pending = members.filter(
    (m) => m.paymentStatus === 'PENDING_APPROVAL' || m.paymentStatus === 'PENDING',
  );

  const mutateApprove = useMutation({
    mutationFn: (memberId: string) =>
      mealsApi.approveMealPollPayment(spaceId, date, memberId, remarks.trim() || undefined),
    onSuccess: async () => {
      enqueueSnackbar(t('meals.subscriptionPlans.approveSuccess', { defaultValue: 'Approved' }), {
        variant: 'success',
      });
      setSelectedMemberId(null);
      await queryClient.invalidateQueries({ queryKey: ['meal-headcount-detail', spaceId] });
      void detailQuery.refetch();
    },
    onError: () => enqueueSnackbar(t('common.errors.generic'), { variant: 'error' }),
  });

  const mutateReject = useMutation({
    mutationFn: (memberId: string) =>
      mealsApi.rejectMealPollPayment(spaceId, date, memberId, remarks.trim() || undefined),
    onSuccess: async () => {
      enqueueSnackbar(t('meals.subscriptionPlans.rejectSuccess', { defaultValue: 'Rejected' }), {
        variant: 'success',
      });
      setSelectedMemberId(null);
      await queryClient.invalidateQueries({ queryKey: ['meal-headcount-detail', spaceId] });
      void detailQuery.refetch();
    },
    onError: () => enqueueSnackbar(t('common.errors.generic'), { variant: 'error' }),
  });

  const mutateRemind = useMutation({
    mutationFn: (memberId: string) => mealsApi.sendMealPollPaymentReminder(spaceId, date, memberId),
    onSuccess: () => {
      enqueueSnackbar(t('paymentCollection.actions.reminded', { defaultValue: 'Reminder sent' }), {
        variant: 'success',
      });
    },
    onError: () => enqueueSnackbar(t('common.errors.generic'), { variant: 'error' }),
  });

  const columns: DataTableColumn<MealHeadcountMember & { id: string }>[] = [
    {
      id: 'name',
      header: t('paymentCollection.dayMeals.peopleColumn', {
        defaultValue: 'People in this space',
      }),
      accessor: (row) => (
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
            {initials(row.memberName) || '?'}
          </Avatar>
          <Typography sx={{ ...DASHBOARD_UX.link, color: s.textPrimary }} noWrap>
            {row.memberName}
          </Typography>
        </Box>
      ),
      primary: true,
    },
    {
      id: 'status',
      header: t('paymentCollection.fields.status', { defaultValue: 'Status' }),
      accessor: (row) => (
        <StatusChip
          label={paymentStatusLabel(row.paymentStatus, t)}
          tone={paymentStatusTone(row.paymentStatus)}
        />
      ),
    },
    {
      id: 'qty',
      header: t('paymentCollection.dayMeals.mealsIncluded', {
        defaultValue: 'Meals included',
      }),
      accessor: (row) => (
        <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
          {row.quantity ?? 1}
        </Typography>
      ),
    },
    {
      id: 'actions',
      header: '',
      width: 40,
      align: 'right',
      accessor: () => <ChevronRight size={16} color={s.textMuted} aria-hidden />,
    },
  ];

  const toolbarFilters = (
    <>
      <TextField
        type="date"
        size="small"
        label={t('common.date', { defaultValue: 'Date' })}
        value={date}
        onChange={(e) => setDate(e.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{
          ...filterControlSx,
          minWidth: 160,
          '& .MuiInputBase-root': {
            ...filterControlSx['& .MuiInputBase-root'],
            bgcolor: s.surface,
          },
        }}
      />
      <FormControl size="small" sx={filterControlSx}>
        <InputLabel id="day-meal-type">{t('navigation.meals')}</InputLabel>
        <Select
          labelId="day-meal-type"
          label={t('navigation.meals')}
          value={mealType}
          onChange={(e) => setMealType(e.target.value as MealType)}
        >
          {MEAL_TYPES.map((type) => (
            <MenuItem key={type} value={type}>
              {t(`meals.mealType.${type}`)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );

  const attentionBanner = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        px: 1.5,
        py: 1.25,
        borderRadius: `${DASHBOARD_UX.radius}px`,
        border: `1px solid ${s.border}`,
        bgcolor: s.surface,
        boxShadow: s.shadow,
      }}
    >
      <IconBadge accent="#3B82F6">
        <Info />
      </IconBadge>
      <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textPrimary }}>
        {t('paymentCollection.dayMeals.pendingCount', {
          defaultValue: '{{count}} members need attention',
          count: pending.length,
        })}
      </Typography>
    </Box>
  );

  const showDesktopPanel = Boolean(selectedMember) && !isLgDown;

  const inspectorProps = {
    spaceId,
    date,
    mealType,
    member: selectedMember,
    remarks,
    onRemarksChange: setRemarks,
    onClose: () => setSelectedMemberId(null),
    onApprove: () => {
      if (selectedMember) void mutateApprove.mutateAsync(selectedMember.memberId);
    },
    onReject: () => {
      if (selectedMember) void mutateReject.mutateAsync(selectedMember.memberId);
    },
    onRemind: () => {
      if (selectedMember) void mutateRemind.mutateAsync(selectedMember.memberId);
    },
    approving: mutateApprove.isPending,
    rejecting: mutateReject.isPending,
    reminding: mutateRemind.isPending,
  };

  return (
    <PageContainer gap={0}>
      <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
        <PageHeader
          title={t('paymentCollection.dayMeals.reviewTitle', { defaultValue: 'Day meal review' })}
          description={t('paymentCollection.dayMeals.reviewSubtitle', {
            defaultValue: 'Approve, reject, or remind day-meal payments from headcount.',
          })}
          breadcrumbs={[
            { label: t('navigation.payments'), to: spacePaymentsPath(spaceId) },
            { label: t('paymentCollection.dayMeals.title', { defaultValue: 'Day meals' }) },
          ]}
        />

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
            {detailQuery.isLoading && members.length === 0 ? (
              <LoadingState />
            ) : (
              <DataTable
                columns={columns}
                rows={members.map((m) => ({ ...m, id: m.memberId }))}
                loading={detailQuery.isLoading}
                toolbarFilters={toolbarFilters}
                banner={attentionBanner}
                emptyTitle={t('meals.planning.noHeadcount', {
                  defaultValue: 'No headcount yet',
                })}
                emptyDescription={t('paymentCollection.dayMeals.emptyHeadcountHint', {
                  defaultValue: 'No members accepted this meal for the selected date.',
                })}
                selectedIds={selectedMemberId ? [selectedMemberId] : []}
                onRowClick={(row) => {
                  setSelectedMemberId(row.memberId);
                  setRemarks('');
                }}
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
              <DayMealReviewInspector {...inspectorProps} framed />
            </Box>
          ) : null}
        </Box>
      </Stack>

      <AppDrawer
        open={Boolean(selectedMemberId) && isLgDown}
        onClose={() => setSelectedMemberId(null)}
        width={400}
      >
        <DayMealReviewInspector {...inspectorProps} framed={false} />
      </AppDrawer>
    </PageContainer>
  );
}
