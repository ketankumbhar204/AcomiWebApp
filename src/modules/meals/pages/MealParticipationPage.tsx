import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { DASHBOARD_UX } from '@/modules/dashboard/theme/dashboardUx';
import { ContentCard } from '@/shared/components/ContentCard';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable';
import { StatusChip } from '@/shared/components/StatusChip';
import { dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { spaceMealsPath } from '@/routes/paths';
import type {
  MealParticipationResponse,
  MealParticipationStatus,
} from '@/shared/types/meals';
import { useMealMutations, useMealParticipations } from '../hooks/useMeals';

export function MealParticipationPage() {
  const { t } = useTranslation();
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const { enqueueSnackbar } = useSnackbar();
  const permissions = useSpacePermissions(spaceId);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<MealParticipationStatus | ''>('ACTIVE');

  const participations = useMealParticipations(
    spaceId,
    {
      status: status || undefined,
      search: search.trim() || undefined,
    },
    permissions.canManageMealParticipation || permissions.canManageMeals,
  );
  const mutations = useMealMutations(spaceId);

  useEffect(() => {
    document.title = `${t('meals.participation.title')} · ${t('common.appName')}`;
  }, [t]);

  const rows = useMemo(
    () => participations.participations.map((p) => ({ ...p, id: p.participationId })),
    [participations.participations],
  );

  const run = async (fn: () => Promise<unknown>, key: string) => {
    try {
      await fn();
      enqueueSnackbar(t(key), { variant: 'success' });
    } catch {
      enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
    }
  };

  const columns: DataTableColumn<MealParticipationResponse & { id: string }>[] = [
    {
      id: 'member',
      header: t('meals.participation.member'),
      accessor: (row) => row.memberName,
      primary: true,
    },
    {
      id: 'plan',
      header: t('meals.participation.plan'),
      accessor: (row) => row.mealPlanName,
    },
    {
      id: 'status',
      header: t('meals.participation.status'),
      accessor: (row) => <StatusChip label={t(`meals.participation.statusValue.${row.status}`)} />,
    },
    {
      id: 'from',
      header: t('meals.participation.effectiveFrom'),
      accessor: (row) => row.effectiveFrom,
    },
    {
      id: 'delivery',
      header: t('meals.participation.delivery'),
      accessor: (row) => row.defaultDeliveryLocationName ?? '—',
    },
    {
      id: 'actions',
      header: t('common.actions'),
      accessor: (row) => (
        <Stack direction="row" spacing={0.5}>
          {row.status === 'ACTIVE' ? (
            <Button
              size="small"
              sx={dashOutlinedButtonSx}
              onClick={() =>
                void run(
                  () => mutations.pauseParticipation.mutateAsync(row.participationId),
                  'meals.participation.pauseSuccess',
                )
              }
            >
              {t('meals.participation.pause')}
            </Button>
          ) : null}
          {row.status === 'PAUSED' ? (
            <Button
              size="small"
              sx={dashOutlinedButtonSx}
              onClick={() =>
                void run(
                  () => mutations.resumeParticipation.mutateAsync(row.participationId),
                  'meals.participation.resumeSuccess',
                )
              }
            >
              {t('meals.participation.resume')}
            </Button>
          ) : null}
          {row.status !== 'STOPPED' ? (
            <Button
              size="small"
              color="error"
              sx={dashOutlinedButtonSx}
              onClick={() =>
                void run(
                  () => mutations.stopParticipation.mutateAsync(row.participationId),
                  'meals.participation.stopSuccess',
                )
              }
            >
              {t('meals.participation.stop')}
            </Button>
          ) : null}
        </Stack>
      ),
    },
  ];

  return (
    <PageContainer gap={0}>
      <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
        <PageHeader
          title={t('meals.participation.title')}
          description={t('meals.participation.subtitle')}
          breadcrumbs={[
            { label: t('navigation.meals'), to: spaceMealsPath(spaceId) },
            { label: t('meals.participation.title') },
          ]}
        />

        <ContentCard>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
            <TextField
              size="small"
              fullWidth
              placeholder={t('meals.participation.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>{t('meals.participation.status')}</InputLabel>
              <Select
                label={t('meals.participation.status')}
                value={status}
                onChange={(e) => setStatus(e.target.value as MealParticipationStatus | '')}
              >
                <MenuItem value="">{t('meals.participation.allStatuses')}</MenuItem>
                <MenuItem value="ACTIVE">{t('meals.participation.statusValue.ACTIVE')}</MenuItem>
                <MenuItem value="PAUSED">{t('meals.participation.statusValue.PAUSED')}</MenuItem>
                <MenuItem value="STOPPED">{t('meals.participation.statusValue.STOPPED')}</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <DataTable
            columns={columns}
            rows={rows}
            loading={participations.loading}
            emptyTitle={t('meals.participation.empty')}
          />
        </ContentCard>
      </Stack>
    </PageContainer>
  );
}
