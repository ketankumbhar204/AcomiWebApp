import {
  Box,
  Button,
  Chip,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { memberApi } from '../api/memberApi';
import {
  useResidentImportSearch,
  type ResidentPickerItem,
} from '../hooks/useResidentImportSearch';
import { enrollMemberInFullMeals } from '../utils/enrollMemberInFullMeals';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { SearchToolbar } from '@/shared/components/SearchToolbar';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { spaceMemberPath, spaceMembersPath } from '@/routes/paths';
import { ApiError } from '@/shared/api/errors';

type PeopleFilter = 'all' | 'customers' | 'residents' | 'former';

function classifyPerson(item: ResidentPickerItem): Exclude<PeopleFilter, 'all'> {
  const isResident = item.role === 'TENANT';
  const isCurrentStay =
    item.occupancyStatus === 'ALLOCATED' || item.occupancyStatus === 'RESERVED';
  const isVacatedMember = item.status === 'VACATED';

  if (isResident && isCurrentStay) return 'residents';
  if (isResident || isVacatedMember) return 'former';
  return 'customers';
}

export function ImportExistingPeoplePage() {
  const { t } = useTranslation();
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<PeopleFilter>('all');

  const importSearch = useResidentImportSearch(spaceId, query, true);

  const filtered = useMemo(() => {
    if (filter === 'all') return importSearch.members;
    return importSearch.members.filter((m) => classifyPerson(m) === filter);
  }, [filter, importSearch.members]);

  const counts = useMemo(() => {
    const base = { all: 0, customers: 0, residents: 0, former: 0 };
    for (const m of importSearch.members) {
      base.all += 1;
      base[classifyPerson(m)] += 1;
    }
    return base;
  }, [importSearch.members]);

  const importMutation = useMutation({
    mutationFn: async (item: ResidentPickerItem) => {
      let memberId = item.memberId;
      if (item.needsImport) {
        const imported = await memberApi.importMember(spaceId, {
          sourceMemberId: item.memberId,
        });
        memberId = imported.memberId;
      }
      try {
        await enrollMemberInFullMeals(spaceId, memberId);
      } catch {
        // Meal enroll is best-effort (mobile parity).
      }
      return memberId;
    },
    onSuccess: async (memberId) => {
      enqueueSnackbar(t('membership.add.importSuccessToast'), { variant: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['members', spaceId] });
      await importSearch.refetch();
      navigate(spaceMemberPath(spaceId, memberId));
    },
    onError: (err) => {
      const message =
        err instanceof ApiError
          ? err.message
          : t('membership.add.importFailed', { defaultValue: 'Import failed' });
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const columns: DataTableColumn<ResidentPickerItem & { id: string }>[] = [
    {
      id: 'name',
      header: t('membership.details.fullName', { defaultValue: 'Name' }),
      accessor: (row) => row.fullName,
    },
    {
      id: 'mobile',
      header: t('membership.details.mobile', { defaultValue: 'Mobile' }),
      accessor: (row) => row.mobileNumber,
    },
    {
      id: 'source',
      header: t('membership.importPeople.fromSpace', { defaultValue: 'Source' }),
      accessor: (row) =>
        row.alreadyInTargetSpace
          ? t('membership.add.reuseCard.alreadyHere')
          : t('membership.add.reuseCard.fromSpace', {
              space: row.sourceSpaceName ?? '',
            }),
    },
    {
      id: 'role',
      header: t('membership.roles.label'),
      accessor: (row) => {
        const kind = classifyPerson(row);
        const key =
          kind === 'residents'
            ? 'membership.importPeople.roleResident'
            : kind === 'former'
              ? 'membership.importPeople.roleFormerResident'
              : 'membership.importPeople.roleCustomer';
        return t(key);
      },
    },
    {
      id: 'actions',
      header: t('membership.workspace.columns.actions'),
      accessor: (row) => (
        <Button
          size="small"
          variant="contained"
          disabled={importMutation.isPending}
          onClick={() => importMutation.mutate(row)}
          sx={dashContainedButtonSx}
        >
          {t('membership.importPeople.add', { defaultValue: 'Add' })}
        </Button>
      ),
    },
  ];

  const rows = filtered.map((item) => ({
    ...item,
    id: `${item.sourceSpaceId}:${item.memberId}`,
  }));

  return (
    <PageContainer gap={0}>
      <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
        <PageHeader
          title={t('membership.importPeople.title')}
          description={t('membership.importPeople.banner')}
          actions={
            <Button
              variant="outlined"
              onClick={() => navigate(spaceMembersPath(spaceId))}
              sx={dashOutlinedButtonSx}
            >
              {t('navigation.members')}
            </Button>
          }
        />

        <SearchToolbar
          value={query}
          onChange={setQuery}
          placeholder={t('membership.importPeople.searchPlaceholder')}
          actions={
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              {(
                [
                  ['all', 'filterAll', counts.all],
                  ['customers', 'filterCustomers', counts.customers],
                  ['residents', 'filterResidents', counts.residents],
                  ['former', 'filterFormer', counts.former],
                ] as const
              ).map(([id, key, count]) => (
                <Chip
                  key={id}
                  clickable
                  color={filter === id ? 'primary' : 'default'}
                  variant={filter === id ? 'filled' : 'outlined'}
                  label={t(`membership.importPeople.${key}`, { count })}
                  onClick={() => setFilter(id)}
                  sx={{
                    borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                    ...DASHBOARD_UX.caption,
                    height: DASHBOARD_UX.buttonHeight,
                  }}
                />
              ))}
            </Stack>
          }
        />

        {importSearch.loading && importSearch.members.length === 0 ? (
          <LoadingState label={t('common.loading')} />
        ) : importSearch.error && importSearch.members.length === 0 ? (
          <ErrorState
            title={t('common.errors.generic')}
            message={String((importSearch.error as Error)?.message ?? '')}
            onRetry={() => void importSearch.refetch()}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Users size={28} />}
            title={t('membership.importPeople.emptyTitle', { defaultValue: 'No people found' })}
            description={t('membership.importPeople.emptyDescription', {
              defaultValue: 'Try a different search or filter.',
            })}
          />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            loading={importSearch.loading}
            emptyTitle={t('membership.importPeople.emptyTitle', { defaultValue: 'No people found' })}
          />
        )}

        <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
          {t('membership.importPeople.foundBadge', { count: importSearch.members.length })}
        </Typography>
      </Stack>
    </PageContainer>
  );
}
