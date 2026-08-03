import {
  Box,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  RefreshCw,
  TriangleAlert,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { IconBadge } from '@/modules/dashboard/components/IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatCard } from '@/shared/components/StatCard';
import { StatusChip, type StatusChipTone } from '@/shared/components/StatusChip';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import type { NotificationPriority, SpaceNotification } from '@/shared/types/dashboard';
import { colors } from '@/shared/theme/colors';
import { extractIsoDateFromText } from '@/shared/utils/extractIsoDateFromText';
import { navigateFromNotificationType } from '@/shared/utils/notificationDeepLinks';
import {
  getNotificationCategoryColor,
  getNotificationIcon,
} from '@/shared/utils/notificationVisuals';
import { canManageNotifications } from '@/shared/utils/spaceOperator';
import { ROUTES, spaceDashboardPath, spacePendingActionsPath } from '@/routes/paths';
import { usePendingActions } from '../hooks/usePendingActions';

type PendingRow = SpaceNotification & {
  id: string;
  groupTitle: string;
  actionType: string;
};

type CategoryFilter = 'all' | 'billing' | 'meals' | 'occupancy' | 'general';

const PAGE_SIZE = 25;
const PRIORITIES: NotificationPriority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const filterControlSx = {
  minWidth: 128,
  '& .MuiInputBase-root': {
    minHeight: DASHBOARD_UX.buttonHeight,
    height: DASHBOARD_UX.buttonHeight,
    borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
    ...DASHBOARD_UX.body,
  },
} as const;

function priorityTone(priority: NotificationPriority | string): StatusChipTone {
  switch (priority) {
    case 'CRITICAL':
      return 'error';
    case 'HIGH':
      return 'warning';
    case 'MEDIUM':
      return 'info';
    case 'LOW':
      return 'neutral';
    default:
      return 'default';
  }
}

function matchesCategory(type: string, filter: CategoryFilter): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'billing':
      return type.startsWith('PAYMENT') || type === 'SUBSCRIPTION_ACTIVATION_PENDING';
    case 'meals':
      return (
        type.startsWith('MEAL') ||
        type.startsWith('MENU') ||
        type === 'SUBSCRIPTION_ACTIVATION_PENDING'
      );
    case 'occupancy':
      return (
        type.startsWith('MOVE_') ||
        type.startsWith('RESERVATION') ||
        type === 'VACANT_RESERVED_BED' ||
        type === 'EXPIRED_RESERVATION'
      );
    case 'general':
      return (
        !type.startsWith('PAYMENT') &&
        !type.startsWith('MEAL') &&
        !type.startsWith('MENU') &&
        !type.startsWith('MOVE_') &&
        !type.startsWith('RESERVATION') &&
        type !== 'SUBSCRIPTION_ACTIVATION_PENDING' &&
        type !== 'VACANT_RESERVED_BED' &&
        type !== 'EXPIRED_RESERVATION'
      );
    default:
      return true;
  }
}

function formatDueLabel(row: PendingRow): string | null {
  const iso = extractIsoDateFromText(row.message, row.title, row.actionRoute);
  if (!iso) return null;
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function PendingActionsPage() {
  const { t } = useTranslation();
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const permissions = useSpacePermissions(spaceId);
  const isOperator = canManageNotifications(permissions);
  const pending = usePendingActions(spaceId, Boolean(spaceId), isOperator);

  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [page, setPage] = useState(0);

  useEffect(() => {
    document.title = `${t('dashboard.attention.pendingActions')} · ${t('common.appName')}`;
  }, [t]);

  const allRows: PendingRow[] = useMemo(() => {
    const result: PendingRow[] = [];
    for (const group of pending.groups) {
      for (const item of group.items ?? []) {
        result.push({
          ...item,
          id: item.notificationId,
          groupTitle: group.title,
          actionType: group.actionType,
        });
      }
    }
    return result;
  }, [pending.groups]);

  const groupOptions = useMemo(() => {
    const titles = new Set<string>();
    for (const row of allRows) {
      if (row.groupTitle) titles.add(row.groupTitle);
    }
    return [...titles].sort((a, b) => a.localeCompare(b));
  }, [allRows]);

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return allRows.filter((row) => {
      if (priorityFilter !== 'all' && row.priority !== priorityFilter) return false;
      if (groupFilter !== 'all' && row.groupTitle !== groupFilter) return false;
      if (!matchesCategory(row.notificationType || row.actionType, categoryFilter)) {
        return false;
      }
      if (!needle) return true;
      return [row.title, row.message, row.groupTitle, row.priority]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [allRows, search, priorityFilter, categoryFilter, groupFilter]);

  const pageRows = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, page]);

  const criticalCount = useMemo(
    () =>
      pending.groups
        .filter((g) => g.priority === 'CRITICAL' || g.priority === 'HIGH')
        .reduce((sum, g) => sum + g.count, 0),
    [pending.groups],
  );

  const todayCount = useMemo(
    () =>
      pending.groups
        .filter((g) =>
          [
            'MOVE_IN_SCHEDULED_TODAY',
            'MOVE_OUT_SCHEDULED_TODAY',
            'RESERVATION_STARTING_TODAY',
          ].includes(g.actionType),
        )
        .reduce((sum, g) => sum + g.count, 0),
    [pending.groups],
  );

  const columns: DataTableColumn<PendingRow>[] = useMemo(
    () => [
      {
        id: 'title',
        header: t('dashboard.pendingActions.table.title'),
        primary: true,
        accessor: (row) => {
          const accent = getNotificationCategoryColor(row.category);
          const Icon = getNotificationIcon(row.notificationType || row.actionType, row.category);
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, py: 0.25 }}>
              <IconBadge accent={accent}>
                <Icon />
              </IconBadge>
              <Typography
                sx={{ ...DASHBOARD_UX.link, color: s.textPrimary }}
                noWrap
              >
                {row.title}
              </Typography>
            </Box>
          );
        },
      },
      {
        id: 'group',
        header: t('dashboard.pendingActions.table.group'),
        accessor: (row) => (
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }} noWrap>
            {row.groupTitle}
          </Typography>
        ),
      },
      {
        id: 'priority',
        header: t('dashboard.pendingActions.table.priority'),
        accessor: (row) => (
          <StatusChip
            label={t(`dashboard.pendingActions.priority.${row.priority}`, {
              defaultValue: row.priority,
            })}
            tone={priorityTone(row.priority)}
          />
        ),
      },
      {
        id: 'message',
        header: t('dashboard.pendingActions.table.message'),
        accessor: (row) => {
          const due = formatDueLabel(row);
          return (
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }} noWrap>
                {row.message ?? '—'}
              </Typography>
              {due ? (
                <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }} noWrap>
                  {due}
                </Typography>
              ) : null}
            </Box>
          );
        },
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

  const toolbarFilters = (
    <>
      <FormControl size="small" sx={filterControlSx}>
        <InputLabel id="pending-priority">
          {t('dashboard.pendingActions.filters.priority', { defaultValue: 'Priority' })}
        </InputLabel>
        <Select
          labelId="pending-priority"
          label={t('dashboard.pendingActions.filters.priority', { defaultValue: 'Priority' })}
          value={priorityFilter}
          onChange={(e) => {
            setPriorityFilter(String(e.target.value));
            setPage(0);
          }}
        >
          <MenuItem value="all">{t('list.filters.all')}</MenuItem>
          {PRIORITIES.map((priority) => (
            <MenuItem key={priority} value={priority}>
              {t(`dashboard.pendingActions.priority.${priority}`, { defaultValue: priority })}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={filterControlSx}>
        <InputLabel id="pending-category">
          {t('dashboard.pendingActions.filters.category', { defaultValue: 'Category' })}
        </InputLabel>
        <Select
          labelId="pending-category"
          label={t('dashboard.pendingActions.filters.category', { defaultValue: 'Category' })}
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value as CategoryFilter);
            setPage(0);
          }}
        >
          <MenuItem value="all">{t('list.filters.all')}</MenuItem>
          <MenuItem value="billing">
            {t('dashboard.pendingActions.filters.billing', { defaultValue: 'Billing' })}
          </MenuItem>
          <MenuItem value="meals">
            {t('dashboard.pendingActions.filters.meals', { defaultValue: 'Meals' })}
          </MenuItem>
          <MenuItem value="occupancy">
            {t('dashboard.pendingActions.filters.occupancy', { defaultValue: 'Occupancy' })}
          </MenuItem>
          <MenuItem value="general">
            {t('dashboard.pendingActions.filters.general', { defaultValue: 'General' })}
          </MenuItem>
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ ...filterControlSx, minWidth: 150 }}>
        <InputLabel id="pending-group">
          {t('dashboard.pendingActions.filters.group', { defaultValue: 'Group' })}
        </InputLabel>
        <Select
          labelId="pending-group"
          label={t('dashboard.pendingActions.filters.group', { defaultValue: 'Group' })}
          value={groupFilter}
          onChange={(e) => {
            setGroupFilter(String(e.target.value));
            setPage(0);
          }}
        >
          <MenuItem value="all">{t('list.filters.all')}</MenuItem>
          {groupOptions.map((group) => (
            <MenuItem key={group} value={group}>
              {group}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );

  if (!spaceId) {
    return <Navigate to={ROUTES.root} replace />;
  }

  const showLoader = pending.loading && pending.summary == null;
  const empty = !showLoader && pending.totalCount === 0;

  return (
    <PageContainer gap={0}>
      <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
        <PageHeader
          title={t('dashboard.attention.pendingActions')}
          description={
            empty
              ? t('dashboard.pendingActions.empty')
              : t('dashboard.pendingActions.screenSubtitle')
          }
          breadcrumbs={[
            { label: t('navigation.dashboard'), to: spaceDashboardPath(spaceId) },
            {
              label: t('dashboard.attention.pendingActions'),
              to: spacePendingActionsPath(spaceId),
            },
          ]}
          actions={
            <IconButton
              aria-label={t('common.refresh')}
              size="small"
              onClick={() => void pending.reload()}
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
          }
        />

        {showLoader ? <LoadingState label={t('common.loading')} /> : null}

        {pending.error && !showLoader ? (
          <ErrorState
            title={t('common.errors.generic')}
            message={
              pending.error instanceof Error ? pending.error.message : String(pending.error)
            }
            onRetry={() => void pending.reload()}
          />
        ) : null}

        {!showLoader && !pending.error && empty ? (
          <EmptyState
            icon={
              <IconBadge accent={colors.success}>
                <CheckCircle2 />
              </IconBadge>
            }
            title={t('dashboard.pendingActions.emptyTitle')}
            description={t('dashboard.pendingActions.empty')}
          />
        ) : null}

        {!showLoader && !pending.error && !empty ? (
          <>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <StatCard
                  dense
                  label={t('dashboard.pendingActions.kpi.pending')}
                  value={pending.totalCount}
                  icon={
                    <IconBadge accent={colors.success}>
                      <Clock3 />
                    </IconBadge>
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <StatCard
                  dense
                  label={t('dashboard.pendingActions.kpi.critical')}
                  value={criticalCount}
                  icon={
                    <IconBadge accent={criticalCount > 0 ? colors.danger : colors.muted}>
                      <TriangleAlert />
                    </IconBadge>
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <StatCard
                  dense
                  label={t('dashboard.pendingActions.kpi.today')}
                  value={todayCount}
                  icon={
                    <IconBadge accent={todayCount > 0 ? '#3B82F6' : colors.muted}>
                      <CalendarDays />
                    </IconBadge>
                  }
                />
              </Grid>
            </Grid>

            <DataTable
              columns={columns}
              rows={pageRows}
              emptyTitle={t('dashboard.pendingActions.emptyTitle')}
              emptyDescription={t('dashboard.pendingActions.empty')}
              searchValue={search}
              onSearchChange={(value) => {
                setSearch(value);
                setPage(0);
              }}
              searchPlaceholder={t('dashboard.pendingActions.search')}
              toolbarFilters={toolbarFilters}
              onRowClick={(row) =>
                navigateFromNotificationType(navigate, spaceId, row, isOperator)
              }
              page={page}
              pageSize={PAGE_SIZE}
              totalItems={filteredRows.length}
              onPageChange={setPage}
            />
          </>
        ) : null}
      </Stack>
    </PageContainer>
  );
}
