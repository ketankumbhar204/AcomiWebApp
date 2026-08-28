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
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { adminApi } from '@/modules/admin/api/adminApi';
import { formatPropertyRegistrationSource } from '@/modules/admin/utils/adminLabels';
import {
  adminListFilterLabel,
  parseAdminListSearchParams,
  type AdminListTab,
} from '@/modules/admin/utils/adminListFilters';
import { adminAddPropertyPath, adminPropertyDetailPath, ROUTES } from '@/routes/paths';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import type { AdminActiveSpace, PropertyRegistrationListItem } from '@/shared/types/admin';

export function AdminPropertyListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();
  const filter = useMemo(() => parseAdminListSearchParams(searchParams), [searchParams]);
  const tab = filter.tab;
  const [leads, setLeads] = useState<PropertyRegistrationListItem[]>([]);
  const [active, setActive] = useState<AdminActiveSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<PropertyRegistrationListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        if (tab === 'leads') {
          const page = await adminApi.listPropertyRegistrations({
            leadsOnly: filter.source ? undefined : true,
            source: filter.source,
            size: 50,
          });
          if (!cancelled) setLeads(page.content);
        } else {
          const spaces = await adminApi.listActiveSpaces();
          if (!cancelled) setActive(spaces.filter((s) => s.type !== 'MESS'));
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
      await adminApi.deletePropertyRegistration(deleteTarget.id);
      setLeads((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      enqueueSnackbar('Property lead deleted.', { variant: 'success' });
      setDeleteTarget(null);
    } catch {
      enqueueSnackbar('Could not delete property lead.', { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Properties
        </Typography>
        <Button component={RouterLink} to={adminAddPropertyPath()} variant="contained">
          Add property
        </Button>
      </Stack>
      <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab value="leads" label="Leads" />
        <Tab value="active" label="Active" />
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
          <Typography color="text.secondary">No property leads found.</Typography>
        ) : (
          <Stack spacing={1.5}>
            <Stack
              direction="row"
              sx={{
                px: 2,
                py: 1,
                display: { xs: 'none', sm: 'flex' },
                color: 'text.secondary',
                typography: 'caption',
                fontWeight: 600,
              }}>
              <Box sx={{ flex: 1 }}>Property</Box>
              <Box sx={{ width: 72, textAlign: 'center' }}>Test</Box>
              <Box sx={{ width: 120, textAlign: 'right' }}>Actions</Box>
            </Stack>
            {leads.map((item) => (
              <Box
                key={item.id}
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box
                    component={RouterLink}
                    to={adminPropertyDetailPath(item.id)}
                    sx={{
                      flex: 1,
                      textDecoration: 'none',
                      color: 'inherit',
                      '&:hover': { opacity: 0.85 },
                    }}>
                    <Typography sx={{ fontWeight: 700 }}>{item.propertyName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.propertyType} · {item.ownerName} · {item.mobileNumber}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.city}, {item.state} · {item.reference}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ width: 72, textAlign: 'center', alignSelf: 'center' }}>
                    {item.testLead ? 'Yes' : 'No'}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', ml: 1, width: 120, justifyContent: 'flex-end' }}>
                    <Chip size="small" label={formatPropertyRegistrationSource(item.source)} />
                    <Button
                      size="small"
                      color="error"
                      variant="text"
                      onClick={() => setDeleteTarget(item)}>
                      Delete
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            ))}
          </Stack>
        )
      ) : active.length === 0 ? (
        <Typography color="text.secondary">No active property spaces found.</Typography>
      ) : (
        <Stack spacing={1.5}>
          {active.map((space) => (
            <Box key={space.id} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <Typography sx={{ fontWeight: 700 }}>{space.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {space.type} · {space.ownerName} · {space.ownerMobile}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}
      <Button component={RouterLink} to={ROUTES.adminDashboard} sx={{ mt: 3 }}>
        Back to dashboard
      </Button>
      <ConfirmDialog
        open={deleteTarget != null}
        title="Delete this property lead?"
        description={
          deleteTarget
            ? `${deleteTarget.propertyName}\n\nThis action will remove the registration from the Admin lead list.`
            : undefined
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        confirming={deleting}
        onConfirm={() => void handleDeleteConfirm()}
        onClose={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
