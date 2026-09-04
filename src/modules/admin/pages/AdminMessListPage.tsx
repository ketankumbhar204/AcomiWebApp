import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { adminApi } from '@/modules/admin/api/adminApi';
import {
  AdminLeadListHeader,
  AdminLeadListRow,
} from '@/modules/admin/components/AdminLeadListColumns';
import { formatMessRegistrationSource } from '@/modules/admin/utils/adminLabels';
import {
  adminListFilterLabel,
  parseAdminListSearchParams,
  type AdminListTab,
} from '@/modules/admin/utils/adminListFilters';
import { adminAddMessPath, adminMessDetailPath, ROUTES } from '@/routes/paths';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import type { AdminActiveSpace, MessRegistrationListItem } from '@/shared/types/admin';

export function AdminMessListPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();
  const filter = useMemo(() => parseAdminListSearchParams(searchParams), [searchParams]);
  const tab = filter.tab;
  const [leads, setLeads] = useState<MessRegistrationListItem[]>([]);
  const [active, setActive] = useState<AdminActiveSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<MessRegistrationListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        if (tab === 'leads') {
          const page = await adminApi.listMessRegistrations({
            leadsOnly: filter.source ? undefined : true,
            source: filter.source,
            size: 50,
          });
          if (!cancelled) setLeads(page.content);
        } else {
          const spaces = await adminApi.listActiveSpaces('MESS');
          if (!cancelled) setActive(spaces);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filter.source, tab]);

  function handleTabChange(_: unknown, nextTab: AdminListTab) {
    const next = new URLSearchParams(searchParams);
    next.set('tab', nextTab);
    if (nextTab === 'active') {
      next.delete('source');
    }
    setSearchParams(next, { replace: true });
  }

  const filterLabel = adminListFilterLabel(filter);

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteMessRegistration(deleteTarget.id);
      setLeads((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      enqueueSnackbar(t('admin.mess.deleted'), { variant: 'success' });
      setDeleteTarget(null);
    } catch {
      enqueueSnackbar(t('admin.mess.deleteFailed'), { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {t('admin.mess.title')}
        </Typography>
        <Button component={RouterLink} to={adminAddMessPath()} variant="contained">
          {t('admin.nav.addMess')}
        </Button>
      </Stack>
      <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab value="leads" label={t('admin.filters.leads')} />
        <Tab value="active" label={t('admin.filters.active')} />
      </Tabs>
      {filterLabel && tab === 'leads' ? (
        <Chip
          label={filterLabel}
          size="small"
          sx={{ mb: 2 }}
          onDelete={
            filter.source
              ? () => {
                  const next = new URLSearchParams();
                  next.set('tab', 'leads');
                  setSearchParams(next, { replace: true });
                }
              : undefined
          }
        />
      ) : null}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : tab === 'leads' ? (
        leads.length === 0 ? (
          <Typography color="text.secondary">{t('admin.mess.emptyLeads')}</Typography>
        ) : (
          <Stack spacing={1.5}>
            <AdminLeadListHeader entityLabel={t('admin.nav.mess')} />
            {leads.map((item) => (
              <Box
                key={item.id}
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                }}>
                <AdminLeadListRow
                  entity={
                    <Box
                      component={RouterLink}
                      to={adminMessDetailPath(item.id)}
                      sx={{
                        textDecoration: 'none',
                        color: 'inherit',
                        '&:hover': { opacity: 0.85 },
                      }}>
                      <Typography sx={{ fontWeight: 700 }}>{item.messName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.ownerName} · {item.mobileNumber}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.city}, {item.state} · {item.reference}
                      </Typography>
                    </Box>
                  }
                  source={<Chip size="small" label={formatMessRegistrationSource(item.source)} />}
                  testLead={
                    <Typography variant="body2" color="text.secondary">
                      {item.testLead ? t('admin.common.yes') : t('admin.common.no')}
                    </Typography>
                  }
                  actions={
                    <Button
                      size="small"
                      color="error"
                      variant="text"
                      onClick={() => setDeleteTarget(item)}>
                      {t('admin.common.delete')}
                    </Button>
                  }
                />
              </Box>
            ))}
          </Stack>
        )
      ) : active.length === 0 ? (
        <Typography color="text.secondary">{t('admin.mess.emptyActive')}</Typography>
      ) : (
        <Stack spacing={1.5}>
          {active.map((space) => (
            <Box key={space.id} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <Typography sx={{ fontWeight: 700 }}>{space.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {space.ownerName} · {space.ownerMobile}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}
      <Button component={RouterLink} to={ROUTES.adminDashboard} sx={{ mt: 3 }}>
        {t('admin.common.backToDashboard')}
      </Button>
      <ConfirmDialog
        open={deleteTarget != null}
        title={t('admin.mess.deleteTitle')}
        description={
          deleteTarget
            ? t('admin.mess.deleteMessage', { name: deleteTarget.messName })
            : undefined
        }
        confirmLabel={t('admin.common.delete')}
        cancelLabel={t('admin.common.cancel')}
        destructive
        confirming={deleting}
        onConfirm={() => void handleDeleteConfirm()}
        onClose={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
