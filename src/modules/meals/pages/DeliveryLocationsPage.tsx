import { Box, Button, Stack, TextField } from '@mui/material';
import { Plus } from 'lucide-react';
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
import { AppDrawer } from '@/shared/components/AppDrawer';
import { StickyFooter } from '@/shared/components/StickyFooter';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { spaceMealsPath } from '@/routes/paths';
import type { MealDeliveryLocation } from '@/shared/types/meals';
import { useDeliveryLocations, useMealMutations } from '../hooks/useMeals';

export function DeliveryLocationsPage() {
  const { t } = useTranslation();
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const { enqueueSnackbar } = useSnackbar();
  const permissions = useSpacePermissions(spaceId);
  const locations = useDeliveryLocations(spaceId, true, permissions.canManageMeals);
  const mutations = useMealMutations(spaceId);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    document.title = `${t('meals.deliveryLocations.title')} · ${t('common.appName')}`;
  }, [t]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return locations.locations
      .filter((l) => !q || l.name.toLowerCase().includes(q) || (l.address ?? '').toLowerCase().includes(q))
      .map((l) => ({ ...l, id: l.id }));
  }, [locations.locations, search]);

  const columns: DataTableColumn<MealDeliveryLocation & { id: string }>[] = [
    {
      id: 'name',
      header: t('meals.deliveryLocations.name'),
      accessor: (row) => row.name,
      primary: true,
    },
    {
      id: 'address',
      header: t('meals.deliveryLocations.address'),
      accessor: (row) => row.address ?? '—',
    },
    {
      id: 'status',
      header: t('meals.deliveryLocations.status'),
      accessor: (row) => (
        <StatusChip
          label={row.active ? t('common.active') : t('meals.deliveryLocations.inactive')}
        />
      ),
    },
    {
      id: 'actions',
      header: t('common.actions'),
      accessor: (row) => (
        <Button
          size="small"
          sx={dashOutlinedButtonSx}
          onClick={() =>
            void mutations.updateDeliveryLocation
              .mutateAsync({
                locationId: row.id,
                body: { active: !row.active },
              })
              .then(() =>
                enqueueSnackbar(t('meals.deliveryLocations.updateSuccess'), {
                  variant: 'success',
                }),
              )
              .catch(() => enqueueSnackbar(t('common.errors.generic'), { variant: 'error' }))
          }
        >
          {row.active ? t('meals.deliveryLocations.deactivate') : t('meals.deliveryLocations.activate')}
        </Button>
      ),
    },
  ];

  const handleCreate = async () => {
    if (!name.trim()) {
      enqueueSnackbar(t('meals.deliveryLocations.nameRequired'), { variant: 'warning' });
      return;
    }
    try {
      await mutations.createDeliveryLocation.mutateAsync({
        name: name.trim(),
        address: address.trim() || undefined,
      });
      enqueueSnackbar(t('meals.deliveryLocations.createSuccess'), { variant: 'success' });
      setOpen(false);
      setName('');
      setAddress('');
    } catch {
      enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
    }
  };

  return (
    <PageContainer gap={0}>
      <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
        <PageHeader
          title={t('meals.deliveryLocations.title')}
          description={t('meals.deliveryLocations.subtitle')}
          breadcrumbs={[
            { label: t('navigation.meals'), to: spaceMealsPath(spaceId) },
            { label: t('meals.deliveryLocations.title') },
          ]}
          actions={
            <Button
              variant="contained"
              startIcon={<Plus size={14} />}
              onClick={() => setOpen(true)}
              sx={dashContainedButtonSx}
            >
              {t('meals.deliveryLocations.add')}
            </Button>
          }
        />

        <ContentCard>
          <TextField
            size="small"
            fullWidth
            sx={{ mb: 2, maxWidth: 420 }}
            placeholder={t('meals.deliveryLocations.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <DataTable
            columns={columns}
            rows={rows}
            loading={locations.loading}
            emptyTitle={t('meals.deliveryLocations.empty')}
          />
        </ContentCard>
      </Stack>

      <AppDrawer open={open} onClose={() => setOpen(false)} width={420}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            {t('meals.deliveryLocations.add')}
          </Box>
          <Stack spacing={2} sx={{ p: 2, flex: 1 }}>
            <TextField
              label={t('meals.deliveryLocations.name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('meals.deliveryLocations.namePlaceholder')}
              fullWidth
              required
            />
            <TextField
              label={t('meals.deliveryLocations.address')}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t('meals.deliveryLocations.addressPlaceholder')}
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
          <StickyFooter>
            <Button onClick={() => setOpen(false)} sx={dashOutlinedButtonSx}>
              {t('common.cancel')}
            </Button>
            <Button variant="contained" onClick={() => void handleCreate()} sx={dashContainedButtonSx}>
              {t('common.save')}
            </Button>
          </StickyFooter>
        </Box>
      </AppDrawer>
    </PageContainer>
  );
}
