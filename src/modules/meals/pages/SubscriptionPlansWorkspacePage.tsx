import {
  Alert,
  Box,
  Button,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Check,
  Gem,
  MoreVertical,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Ban,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { IconBadge } from '@/modules/dashboard/components/IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { AppDrawer } from '@/shared/components/AppDrawer';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { ContentCard } from '@/shared/components/ContentCard';
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { SidePanel } from '@/shared/components/SidePanel';
import { StatusChip } from '@/shared/components/StatusChip';
import { StickyFooter } from '@/shared/components/StickyFooter';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { formatCurrency } from '@/shared/utils/dashboardFinancial';
import { spaceMealsPath, spaceMealsPlansCustomerPath } from '@/routes/paths';
import type {
  SubscriptionActivationRequestResponse,
  SubscriptionActivationRequestStatus,
  SubscriptionPlanResponse,
} from '@/shared/types/subscription';
import { PlanFormDrawer } from '../components/PlanFormDrawer';
import {
  usePendingActivationRequests,
  useSubscriptionPlanMutations,
  useSubscriptionPlans,
} from '../hooks/useSubscriptionPlans';

type WorkspaceTab = 'plans' | 'requests';

const PAGE_SIZE = 10;

function planAccent(plan: SubscriptionPlanResponse): string {
  const premium =
    plan.name.toLowerCase().includes('premium') ||
    plan.name.toLowerCase().includes('gold') ||
    plan.price >= 3500;
  return premium ? '#7C3AED' : colors.primaryDark;
}

function planIcon(plan: SubscriptionPlanResponse): LucideIcon {
  const premium =
    plan.name.toLowerCase().includes('premium') ||
    plan.name.toLowerCase().includes('gold') ||
    plan.price >= 3500;
  return premium ? Gem : Package;
}

function requestStatusTone(
  status: SubscriptionActivationRequestStatus,
): 'success' | 'warning' | 'error' | 'neutral' {
  switch (status) {
    case 'APPROVED':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'REJECTED':
      return 'error';
    default:
      return 'neutral';
  }
}

function PlanNameCell({
  name,
  subtitle,
  accent,
  Icon,
}: {
  name: string;
  subtitle?: string | null;
  accent: string;
  Icon: LucideIcon;
}) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, py: 0.25 }}>
      <IconBadge accent={accent}>
        <Icon />
      </IconBadge>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ ...DASHBOARD_UX.link, color: s.textPrimary }} noWrap>
          {name}
        </Typography>
        {subtitle ? (
          <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: s.textMuted }} noWrap>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}

function PlanRowActions({
  canDeactivate,
  onEdit,
  onDeactivate,
}: {
  canDeactivate: boolean;
  onEdit: () => void;
  onDeactivate: () => void;
}) {
  const { t } = useTranslation();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  return (
    <>
      <IconButton
        size="small"
        aria-label={t('common.actions')}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        onClick={(event: MouseEvent<HTMLElement>) => {
          event.stopPropagation();
          setAnchor(event.currentTarget);
        }}
        sx={{
          width: DASHBOARD_UX.buttonHeight,
          height: DASHBOARD_UX.buttonHeight,
          borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
        }}
      >
        <MoreVertical size={14} />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        onClick={(event) => event.stopPropagation()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            setAnchor(null);
            onEdit();
          }}
        >
          <ListItemIcon>
            <Pencil size={14} />
          </ListItemIcon>
          <ListItemText>{t('common.edit')}</ListItemText>
        </MenuItem>
        {canDeactivate ? (
          <MenuItem
            onClick={() => {
              setAnchor(null);
              onDeactivate();
            }}
          >
            <ListItemIcon>
              <Ban size={14} />
            </ListItemIcon>
            <ListItemText>{t('meals.subscriptionPlans.deactivateAction')}</ListItemText>
          </MenuItem>
        ) : null}
      </Menu>
    </>
  );
}

function RequestRowActions({
  onReview,
  onApprove,
  onReject,
  approving,
  rejecting,
}: {
  onReview: () => void;
  onApprove: () => void;
  onReject: () => void;
  approving: boolean;
  rejecting: boolean;
}) {
  const { t } = useTranslation();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  return (
    <>
      <IconButton
        size="small"
        aria-label={t('common.actions')}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        onClick={(event: MouseEvent<HTMLElement>) => {
          event.stopPropagation();
          setAnchor(event.currentTarget);
        }}
        sx={{
          width: DASHBOARD_UX.buttonHeight,
          height: DASHBOARD_UX.buttonHeight,
          borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
        }}
      >
        <MoreVertical size={14} />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        onClick={(event) => event.stopPropagation()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            setAnchor(null);
            onReview();
          }}
        >
          <ListItemText>
            {t('meals.subscriptionPlans.reviewRequest', { defaultValue: 'Review' })}
          </ListItemText>
        </MenuItem>
        <MenuItem
          disabled={approving}
          onClick={() => {
            setAnchor(null);
            onApprove();
          }}
        >
          <ListItemIcon>
            <Check size={14} />
          </ListItemIcon>
          <ListItemText>{t('meals.subscriptionPlans.approveAction')}</ListItemText>
        </MenuItem>
        <MenuItem
          disabled={rejecting}
          onClick={() => {
            setAnchor(null);
            onReject();
          }}
        >
          <ListItemIcon>
            <X size={14} />
          </ListItemIcon>
          <ListItemText>{t('meals.subscriptionPlans.rejectAction')}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

/**
 * Owner/manager subscription plan catalog + activation queue.
 * Mirrors mobile SubscriptionPlansScreen + SubscriptionActivationRequestsScreen.
 * Presentation aligned to Dashboard / Members workspace (logic unchanged).
 */
export function SubscriptionPlansWorkspacePage() {
  const { t } = useTranslation();
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isLgDown = useMediaQuery(theme.breakpoints.down('lg'));
  const s = dashSurfaces(theme.palette.mode);
  const permissions = useSpacePermissions(spaceId);
  const canManage = permissions.canManageMeals === true;

  const tab = (searchParams.get('tab') as WorkspaceTab) || 'plans';
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionPlanResponse | null>(null);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [ownerNotes, setOwnerNotes] = useState('');

  const plansQuery = useSubscriptionPlans(spaceId, true, canManage);
  const requestsQuery = usePendingActivationRequests(spaceId, canManage);
  const mutations = useSubscriptionPlanMutations(spaceId);

  useEffect(() => {
    document.title = `${t('meals.subscriptionPlans.title')} · ${t('common.appName')}`;
  }, [t]);

  useEffect(() => {
    setPage(0);
  }, [tab, search]);

  const plans = useMemo(() => {
    const list = plansQuery.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q),
    );
  }, [plansQuery.data, search]);

  const requests = useMemo(() => {
    const list = requestsQuery.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (r) =>
        r.memberName.toLowerCase().includes(q) ||
        r.planName.toLowerCase().includes(q) ||
        (r.paymentReference ?? '').toLowerCase().includes(q),
    );
  }, [requestsQuery.data, search]);

  const selectedPlan = plans.find((p) => p.planId === selectedPlanId) ?? null;
  const selectedRequest =
    requests.find((r) => r.requestId === selectedRequestId) ?? null;

  const planRows = useMemo(
    () => plans.map((p) => ({ ...p, id: p.planId })),
    [plans],
  );
  const requestRows = useMemo(
    () => requests.map((r) => ({ ...r, id: r.requestId })),
    [requests],
  );

  const activeRows = tab === 'plans' ? planRows : requestRows;
  const pageCount = Math.max(1, Math.ceil(activeRows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pagedPlans = useMemo(() => {
    const start = safePage * PAGE_SIZE;
    return planRows.slice(start, start + PAGE_SIZE);
  }, [planRows, safePage]);
  const pagedRequests = useMemo(() => {
    const start = safePage * PAGE_SIZE;
    return requestRows.slice(start, start + PAGE_SIZE);
  }, [requestRows, safePage]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const reloadAll = () => {
    void plansQuery.refetch();
    void requestsQuery.refetch();
  };

  const approveRequest = async (request: SubscriptionActivationRequestResponse) => {
    try {
      await mutations.approveRequest.mutateAsync({
        requestId: request.requestId,
        ownerNotes: ownerNotes.trim() || undefined,
      });
      enqueueSnackbar(t('meals.subscriptionPlans.approveSuccess'), { variant: 'success' });
      setSelectedRequestId(null);
    } catch {
      enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
    }
  };

  const rejectRequest = async (request: SubscriptionActivationRequestResponse) => {
    try {
      await mutations.rejectRequest.mutateAsync({
        requestId: request.requestId,
        ownerNotes: ownerNotes.trim() || undefined,
      });
      enqueueSnackbar(t('meals.subscriptionPlans.rejectSuccess'), { variant: 'success' });
      setSelectedRequestId(null);
    } catch {
      enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
    }
  };

  if (!canManage) {
    return (
      <PageContainer>
        <EmptyState
          title={t('common.errors.forbidden')}
          description={t('meals.subscriptionPlans.ownerSubtitle')}
          action={
            <Button
              variant="contained"
              onClick={() => navigate(spaceMealsPlansCustomerPath(spaceId))}
              sx={{
                ...dashContainedButtonSx,
                bgcolor: colors.primaryDark,
                '&:hover': { bgcolor: colors.primaryHover },
              }}
            >
              {t('meals.subscriptionPlans.title')}
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const planColumns: DataTableColumn<SubscriptionPlanResponse & { id: string }>[] = [
    {
      id: 'name',
      header: t('meals.subscriptionPlans.planColumn', { defaultValue: 'Plan' }),
      accessor: (row) => (
        <PlanNameCell
          name={row.name}
          subtitle={
            row.description?.trim() ||
            t('meals.subscriptionPlans.defaultSubtitle', {
              defaultValue: 'Reusable meal plan',
            })
          }
          accent={planAccent(row)}
          Icon={planIcon(row)}
        />
      ),
      primary: true,
    },
    {
      id: 'meals',
      header: t('meals.subscriptionPlans.mealsLabel'),
      accessor: (row) => (
        <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
          {t('meals.subscriptionPlans.mealsCountDisplay', {
            count: row.mealsIncluded,
            defaultValue: '{{count}} Meals',
          })}
        </Typography>
      ),
    },
    {
      id: 'price',
      header: t('meals.subscriptionPlans.priceLabel'),
      align: 'right',
      accessor: (row) => (
        <Typography
          sx={{
            ...DASHBOARD_UX.cardTitle,
            color: s.textPrimary,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatCurrency(row.price, row.currencyCode)}
        </Typography>
      ),
      primary: true,
    },
    {
      id: 'validity',
      header: t('meals.subscriptionPlans.validityColumn', { defaultValue: 'Validity' }),
      accessor: (row) => (
        <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
          {t('meals.subscriptionPlans.validityDaysDisplay', {
            days: row.validityDays,
            defaultValue: '{{days}} Days',
          })}
        </Typography>
      ),
    },
    {
      id: 'status',
      header: t('meals.subscriptionPlans.statusColumn', { defaultValue: 'Status' }),
      accessor: (row) => (
        <StatusChip
          label={
            row.isActive
              ? t('meals.subscriptionPlans.statusActive')
              : t('meals.subscriptionPlans.statusInactive')
          }
          tone={row.isActive ? 'success' : 'neutral'}
        />
      ),
    },
    {
      id: 'actions',
      header: t('common.actions'),
      width: 56,
      align: 'right',
      accessor: (row) => (
        <PlanRowActions
          canDeactivate={row.isActive}
          onEdit={() => {
            setEditing(row);
            setFormOpen(true);
          }}
          onDeactivate={() => setDeactivateId(row.planId)}
        />
      ),
    },
  ];

  const requestColumns: DataTableColumn<
    SubscriptionActivationRequestResponse & { id: string }
  >[] = [
    {
      id: 'member',
      header: t('meals.subscriptionPlans.customerColumn', { defaultValue: 'Customer' }),
      accessor: (row) => (
        <Typography sx={{ ...DASHBOARD_UX.link, color: s.textPrimary }} noWrap>
          {row.memberName}
        </Typography>
      ),
      primary: true,
    },
    {
      id: 'plan',
      header: t('meals.subscriptionPlans.requestedPlanColumn', {
        defaultValue: 'Requested plan',
      }),
      accessor: (row) => (
        <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }} noWrap>
          {row.planName}
        </Typography>
      ),
      primary: true,
    },
    {
      id: 'requestedOn',
      header: t('meals.subscriptionPlans.requestedOnColumn', { defaultValue: 'Requested on' }),
      accessor: (row) => (
        <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
          {new Date(row.createdAt).toLocaleString()}
        </Typography>
      ),
    },
    {
      id: 'status',
      header: t('meals.subscriptionPlans.statusColumn', { defaultValue: 'Status' }),
      accessor: (row) => (
        <StatusChip
          label={t(`meals.subscriptionPlans.requestStatus.${row.status}`, {
            defaultValue: row.status.charAt(0) + row.status.slice(1).toLowerCase(),
          })}
          tone={requestStatusTone(row.status)}
        />
      ),
    },
    {
      id: 'actions',
      header: t('common.actions'),
      width: 56,
      align: 'right',
      accessor: (row) => (
        <RequestRowActions
          approving={mutations.approveRequest.isPending}
          rejecting={mutations.rejectRequest.isPending}
          onReview={() => {
            setSelectedRequestId(row.requestId);
            setOwnerNotes('');
          }}
          onApprove={() => void approveRequest(row)}
          onReject={() => void rejectRequest(row)}
        />
      ),
    },
  ];

  const headerActions = (
    <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
      <Button
        variant="outlined"
        startIcon={<RefreshCw size={14} />}
        onClick={reloadAll}
        sx={dashOutlinedButtonSx}
      >
        {t('common.refresh')}
      </Button>
      {tab === 'plans' ? (
        <Button
          variant="contained"
          startIcon={<Plus size={14} />}
          onClick={openCreate}
          sx={{
            ...dashContainedButtonSx,
            minHeight: DASHBOARD_UX.buttonHeight,
            height: DASHBOARD_UX.buttonHeight,
            bgcolor: colors.primaryDark,
            '&:hover': { bgcolor: colors.primaryHover },
          }}
        >
          {t('meals.subscriptionPlans.createAction')}
        </Button>
      ) : null}
    </Stack>
  );

  const renderPlanDetail = (plan: SubscriptionPlanResponse): ReactNode => (
    <Stack spacing={1.5}>
      <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
        {t('meals.subscriptionPlans.mealsCountDisplay', {
          count: plan.mealsIncluded,
          defaultValue: '{{count}} Meals',
        })}
      </Typography>
      <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
        {formatCurrency(plan.price, plan.currencyCode)}
      </Typography>
      <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
        {t('meals.subscriptionPlans.validityDaysDisplay', {
          days: plan.validityDays,
          defaultValue: '{{days}} Days',
        })}
      </Typography>
      {plan.description ? (
        <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
          {plan.description}
        </Typography>
      ) : null}
      <StickyFooter>
        <Stack spacing={1} sx={{ width: '100%' }}>
          <Button
            variant="contained"
            sx={{
              ...dashContainedButtonSx,
              bgcolor: colors.primaryDark,
              '&:hover': { bgcolor: colors.primaryHover },
            }}
            onClick={() => {
              setEditing(plan);
              setFormOpen(true);
            }}
          >
            {t('common.edit')}
          </Button>
          {plan.isActive ? (
            <Button
              variant="outlined"
              sx={dashOutlinedButtonSx}
              onClick={() => setDeactivateId(plan.planId)}
            >
              {t('meals.subscriptionPlans.deactivateAction')}
            </Button>
          ) : null}
        </Stack>
      </StickyFooter>
    </Stack>
  );

  const renderRequestDetail = (request: SubscriptionActivationRequestResponse): ReactNode => (
    <Stack spacing={1.5}>
      <Typography sx={{ ...DASHBOARD_UX.body, color: s.textPrimary }}>
        {t('meals.subscriptionPlans.requestedPlan', { plan: request.planName })}
      </Typography>
      <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: s.textMuted }}>
        {new Date(request.createdAt).toLocaleString()}
      </Typography>
      {request.paymentReference ? (
        <Typography sx={{ ...DASHBOARD_UX.body, color: s.textPrimary }}>
          {t('meals.subscriptionPlans.paymentReference', {
            reference: request.paymentReference,
          })}
        </Typography>
      ) : null}
      {request.customerNotes ? <Alert severity="info">{request.customerNotes}</Alert> : null}
      {request.paymentProofImageUrl ? (
        <Box
          component="img"
          src={request.paymentProofImageUrl}
          alt={t('meals.subscriptionPlans.viewPaymentProof')}
          sx={{
            maxWidth: '100%',
            borderRadius: `${DASHBOARD_UX.tileRadius}px`,
            border: `1px solid ${s.border}`,
          }}
        />
      ) : null}
      <TextFieldNotes value={ownerNotes} onChange={setOwnerNotes} />
      <StickyFooter>
        <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
          <Button
            variant="outlined"
            color="error"
            sx={dashOutlinedButtonSx}
            disabled={mutations.rejectRequest.isPending}
            onClick={() => void rejectRequest(request)}
          >
            {t('meals.subscriptionPlans.rejectAction')}
          </Button>
          <Button
            variant="contained"
            sx={{
              ...dashContainedButtonSx,
              bgcolor: colors.primaryDark,
              '&:hover': { bgcolor: colors.primaryHover },
            }}
            disabled={mutations.approveRequest.isPending}
            onClick={() => void approveRequest(request)}
          >
            {t('meals.subscriptionPlans.approveAction')}
          </Button>
        </Stack>
      </StickyFooter>
    </Stack>
  );

  return (
    <PageContainer gap={0}>
      <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
        <PageHeader
          title={t('meals.subscriptionPlans.title')}
          description={t('meals.subscriptionPlans.ownerSubtitle')}
          breadcrumbs={[
            { label: t('navigation.meals'), to: spaceMealsPath(spaceId) },
            { label: t('meals.subscriptionPlans.title') },
          ]}
          actions={headerActions}
        />

        <Tabs
          value={tab}
          onChange={(_, value: WorkspaceTab) => {
            setSearchParams(value === 'plans' ? {} : { tab: value });
            setSearch('');
            setSelectedPlanId(null);
            setSelectedRequestId(null);
          }}
          aria-label={t('meals.subscriptionPlans.title')}
          sx={{
            minHeight: DASHBOARD_UX.buttonHeight,
            borderBottom: `1px solid ${s.border}`,
            '& .MuiTab-root': {
              minHeight: DASHBOARD_UX.buttonHeight,
              ...DASHBOARD_UX.button,
              textTransform: 'none',
              color: s.textMuted,
            },
            '& .Mui-selected': {
              color: `${colors.primaryDark} !important`,
            },
            '& .MuiTabs-indicator': {
              bgcolor: colors.primaryDark,
              height: 2,
            },
          }}
        >
          <Tab value="plans" label={t('meals.subscriptionPlans.title')} />
          <Tab
            value="requests"
            label={`${t('meals.subscriptionPlans.viewRequests')} (${requestsQuery.data?.length ?? 0})`}
          />
        </Tabs>

        {tab === 'plans' ? (
          plansQuery.isError ? (
            <ErrorState
              title={t('common.errors.generic')}
              message={t('common.errors.generic')}
              onRetry={() => void plansQuery.refetch()}
            />
          ) : !plansQuery.isLoading && planRows.length === 0 && !search.trim() ? (
            <ContentCard>
              <EmptyState
                icon={
                  <IconBadge accent={colors.primaryDark}>
                    <Package />
                  </IconBadge>
                }
                title={t('meals.subscriptionPlans.emptyTitle', {
                  defaultValue: 'No meal plans',
                })}
                description={t('meals.subscriptionPlans.emptyDescription', {
                  defaultValue: 'Create your first subscription plan.',
                })}
                action={
                  <Button
                    variant="contained"
                    startIcon={<Plus size={14} />}
                    onClick={openCreate}
                    sx={{
                      ...dashContainedButtonSx,
                      bgcolor: colors.primaryDark,
                      '&:hover': { bgcolor: colors.primaryHover },
                    }}
                  >
                    {t('meals.subscriptionPlans.createAction')}
                  </Button>
                }
              />
            </ContentCard>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gap: `${DASHBOARD_UX.cardGap}px`,
                gridTemplateColumns: {
                  xs: '1fr',
                  lg: selectedPlan && !isLgDown ? 'minmax(0, 1fr) minmax(0, 360px)' : '1fr',
                },
              }}
            >
              <DataTable
                columns={planColumns}
                rows={pagedPlans}
                loading={plansQuery.isLoading}
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder={t('meals.subscriptionPlans.searchPlans', {
                  defaultValue: 'Search plans…',
                })}
                searchInputId="meals-plans-search"
                page={safePage}
                pageSize={PAGE_SIZE}
                totalItems={planRows.length}
                onPageChange={setPage}
                selectedIds={selectedPlanId ? [selectedPlanId] : []}
                onRowClick={(row) => setSelectedPlanId(row.planId)}
                emptyTitle={t('meals.subscriptionPlans.emptyTitle', {
                  defaultValue: 'No meal plans',
                })}
                emptyDescription={t('meals.subscriptionPlans.empty')}
              />
              {selectedPlan && !isLgDown ? (
                <SidePanel title={selectedPlan.name} onClose={() => setSelectedPlanId(null)}>
                  {renderPlanDetail(selectedPlan)}
                </SidePanel>
              ) : null}
            </Box>
          )
        ) : requestsQuery.isError ? (
          <ErrorState
            title={t('common.errors.generic')}
            message={t('common.errors.generic')}
            onRetry={() => void requestsQuery.refetch()}
          />
        ) : (
          <Box
            sx={{
              display: 'grid',
              gap: `${DASHBOARD_UX.cardGap}px`,
              gridTemplateColumns: {
                xs: '1fr',
                lg: selectedRequest && !isLgDown ? 'minmax(0, 1fr) minmax(0, 380px)' : '1fr',
              },
            }}
          >
            <DataTable
              columns={requestColumns}
              rows={pagedRequests}
              loading={requestsQuery.isLoading}
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder={t('meals.subscriptionPlans.searchRequests', {
                defaultValue: 'Search requests…',
              })}
              searchInputId="meals-plan-requests-search"
              page={safePage}
              pageSize={PAGE_SIZE}
              totalItems={requestRows.length}
              onPageChange={setPage}
              selectedIds={selectedRequestId ? [selectedRequestId] : []}
              onRowClick={(row) => {
                setSelectedRequestId(row.requestId);
                setOwnerNotes('');
              }}
              emptyTitle={t('meals.subscriptionPlans.noPendingRequests')}
              emptyDescription={t('meals.subscriptionPlans.requestsEmptyHint', {
                defaultValue: 'Activation requests from customers will appear here.',
              })}
            />
            {selectedRequest && !isLgDown ? (
              <SidePanel
                title={selectedRequest.memberName}
                onClose={() => setSelectedRequestId(null)}
              >
                {renderRequestDetail(selectedRequest)}
              </SidePanel>
            ) : null}
          </Box>
        )}
      </Stack>

      <AppDrawer
        open={Boolean(selectedPlan) && isLgDown}
        onClose={() => setSelectedPlanId(null)}
        width={380}
      >
        {selectedPlan ? (
          <SidePanel title={selectedPlan.name} onClose={() => setSelectedPlanId(null)}>
            {renderPlanDetail(selectedPlan)}
          </SidePanel>
        ) : null}
      </AppDrawer>

      <AppDrawer
        open={Boolean(selectedRequest) && isLgDown}
        onClose={() => setSelectedRequestId(null)}
        width={400}
      >
        {selectedRequest ? (
          <SidePanel
            title={selectedRequest.memberName}
            onClose={() => setSelectedRequestId(null)}
          >
            {renderRequestDetail(selectedRequest)}
          </SidePanel>
        ) : null}
      </AppDrawer>

      <PlanFormDrawer
        key={editing?.planId ?? 'new'}
        open={formOpen}
        initial={editing}
        submitting={mutations.createPlan.isPending || mutations.updatePlan.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={async (values) => {
          try {
            if (editing) {
              await mutations.updatePlan.mutateAsync({
                planId: editing.planId,
                payload: {
                  name: values.name,
                  mealsIncluded: values.mealsIncluded,
                  price: values.price,
                  validityDays: values.validityDays,
                  carryForwardUnused: values.carryForwardUnused,
                  description: values.description,
                  active: values.active,
                },
              });
              enqueueSnackbar(t('meals.subscriptionPlans.updateSuccess'), {
                variant: 'success',
              });
            } else {
              await mutations.createPlan.mutateAsync({
                name: values.name,
                mealsIncluded: values.mealsIncluded,
                price: values.price,
                validityDays: values.validityDays,
                carryForwardUnused: values.carryForwardUnused,
                description: values.description,
              });
              enqueueSnackbar(t('meals.subscriptionPlans.createSuccess'), {
                variant: 'success',
              });
            }
            setFormOpen(false);
          } catch {
            enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(deactivateId)}
        title={t('meals.subscriptionPlans.deactivateTitle')}
        description={t('meals.subscriptionPlans.deactivateMessage', {
          name: plans.find((p) => p.planId === deactivateId)?.name ?? '',
        })}
        confirmLabel={t('meals.subscriptionPlans.deactivateAction')}
        destructive
        onClose={() => setDeactivateId(null)}
        onConfirm={() => {
          if (!deactivateId) return;
          void (async () => {
            try {
              await mutations.deactivatePlan.mutateAsync(deactivateId);
              enqueueSnackbar(t('meals.subscriptionPlans.deactivateSuccess'), {
                variant: 'success',
              });
              setDeactivateId(null);
              setSelectedPlanId(null);
            } catch {
              enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
            }
          })();
        }}
      />
    </PageContainer>
  );
}

function TextFieldNotes({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  return (
    <Box
      component="textarea"
      value={value}
      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
      placeholder="e.g. Paid via PhonePe — activating"
      aria-label={t('meals.customerPlans.notesLabel', { defaultValue: 'Notes' })}
      sx={{
        width: '100%',
        minHeight: 72,
        p: 1.5,
        borderRadius: `${DASHBOARD_UX.tileRadius}px`,
        border: `1px solid ${s.border}`,
        bgcolor: s.surface,
        color: s.textPrimary,
        font: 'inherit',
        resize: 'vertical',
      }}
    />
  );
}
