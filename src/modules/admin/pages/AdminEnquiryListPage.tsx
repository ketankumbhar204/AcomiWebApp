import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControl,
  Grid,
  InputAdornment,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from '@mui/material';
import {
  Clock3,
  Download,
  Eye,
  FileText,
  MapPin,
  Search,
  Send,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useSnackbar } from 'notistack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminEnquiryDetailDrawer } from '@/modules/admin/components/AdminEnquiryDetailDrawer';
import { AdminEnquiryStatusChip } from '@/modules/admin/components/AdminEnquiryStatusChip';
import { discoverDefaultImageUrl } from '@/modules/onboarding/utils/discoverDefaultImages';
import { adminEnquiryApi } from '@/shared/api/enquiryApi';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { adminEnquiryDetailPath, ROUTES } from '@/routes/paths';
import type {
  AdminEnquirySummary,
  AdminSpaceEnquiryDetail,
  AdminSpaceEnquiryListItem,
  EnquiryRequesterType,
  SpaceEnquiryStatus,
} from '@/shared/types/enquiry';

const PAGE_SIZE = 8;

type SortDir = 'asc' | 'desc';
type DeleteTarget = { kind: 'one' | 'bulk'; ids: string[] };

function formatRequested(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
  };
}

function exportCsv(rows: AdminSpaceEnquiryListItem[]) {
  const header = [
    'Enquiry ID',
    'Listing',
    'Location',
    'Requester',
    'Email',
    'Mobile',
    'Type',
    'Requested At',
    'Status',
    'Test Lead',
  ];
  const lines = rows.map((row) =>
    [
      row.enquiryId,
      row.spaceName,
      row.locationLabel || row.spaceAddress || '',
      row.requesterName,
      row.requesterEmail || '',
      row.requesterMobile || '',
      row.requesterType,
      row.requestedAt,
      row.status,
      row.testLead ? 'Yes' : 'No',
    ]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(','),
  );
  const blob = new Blob([[header.join(','), ...lines].join('\n')], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `acomi-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminEnquiryListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { id: routeEnquiryId } = useParams<{ id?: string }>();

  const [rows, setRows] = useState<AdminSpaceEnquiryListItem[]>([]);
  const [summary, setSummary] = useState<AdminEnquirySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [status, setStatus] = useState<SpaceEnquiryStatus | ''>('');
  const [requesterType, setRequesterType] = useState<EnquiryRequesterType | ''>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const filterKey = `${debouncedQ}|${status}|${requesterType}|${from}|${to}`;
  const [activeFilterKey, setActiveFilterKey] = useState(filterKey);
  if (activeFilterKey !== filterKey) {
    setActiveFilterKey(filterKey);
    setPage(0);
    setSelected(new Set());
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQ(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadSummary = useCallback(() => {
    void adminEnquiryApi.summary().then(setSummary).catch(() => setSummary(null));
  }, []);

  const requestKey = `${page}|${debouncedQ}|${status}|${requesterType}|${from}|${to}|${sortDir}`;
  const [activeRequestKey, setActiveRequestKey] = useState(requestKey);
  if (activeRequestKey !== requestKey) {
    setActiveRequestKey(requestKey);
    setLoading(true);
  }

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    let active = true;
    void adminEnquiryApi
      .list({
        status: status || undefined,
        requesterType: requesterType || undefined,
        q: debouncedQ || undefined,
        from: from || undefined,
        to: to || undefined,
        page,
        size: PAGE_SIZE,
      })
      .then((result) => {
        if (!active) return;
        const content = [...result.content];
        content.sort((a, b) => {
          const diff = new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime();
          return sortDir === 'asc' ? diff : -diff;
        });
        setRows(content);
        setTotalPages(result.totalPages);
        setTotalElements(result.totalElements);
      })
      .catch(() => {
        if (!active) return;
        setRows([]);
        setTotalPages(0);
        setTotalElements(0);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [debouncedQ, from, page, requesterType, sortDir, status, to]);

  const drawerOpen = Boolean(routeEnquiryId);
  const allSelected = rows.length > 0 && rows.every((row) => selected.has(row.enquiryId));
  const selectedCount = selected.size;
  const showingFrom = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const showingTo = Math.min((page + 1) * PAGE_SIZE, totalElements);

  const stats = useMemo(
    () => [
      {
        key: 'total',
        label: t('admin.enquiries.stats.total'),
        value: summary?.totalEnquiries ?? 0,
        icon: FileText,
        bg: '#F3E8FF',
        fg: '#7C3AED',
      },
      {
        key: 'pending',
        label: t('admin.enquiries.stats.pending'),
        value: summary?.pendingCount ?? 0,
        icon: Clock3,
        bg: '#FFEDD5',
        fg: '#EA580C',
      },
      {
        key: 'shared',
        label: t('admin.enquiries.stats.shared'),
        value: summary?.sharedCount ?? 0,
        icon: Send,
        bg: '#DCFCE7',
        fg: '#16A34A',
      },
      {
        key: 'expired',
        label: t('admin.enquiries.stats.expired'),
        value: summary?.expiredCount ?? 0,
        icon: XCircle,
        bg: '#F1F5F9',
        fg: '#475569',
      },
    ],
    [summary, t],
  );

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(rows.map((row) => row.enquiryId)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openEnquiry(id: string) {
    navigate(adminEnquiryDetailPath(id));
  }

  function closeDrawer() {
    navigate(ROUTES.adminEnquiries);
  }

  function handleUpdated(detail: AdminSpaceEnquiryDetail) {
    setRows((prev) =>
      prev.map((row) =>
        row.enquiryId === detail.enquiryId
          ? {
              ...row,
              status: detail.status,
              sharedAt: detail.sharedAt,
            }
          : row,
      ),
    );
    loadSummary();
  }

  function handleDeleted(enquiryId: string) {
    setRows((prev) => prev.filter((row) => row.enquiryId !== enquiryId));
    setTotalElements((n) => Math.max(0, n - 1));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(enquiryId);
      return next;
    });
    loadSummary();
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.kind === 'one') {
        const id = deleteTarget.ids[0];
        if (!id) return;
        await adminEnquiryApi.delete(id);
        setRows((prev) => prev.filter((row) => row.enquiryId !== id));
        setTotalElements((n) => Math.max(0, n - 1));
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        if (routeEnquiryId === id) closeDrawer();
        loadSummary();
        enqueueSnackbar(t('admin.enquiries.deleted'), { variant: 'success' });
      } else {
        const ids = deleteTarget.ids;
        const results = await Promise.allSettled(ids.map((id) => adminEnquiryApi.delete(id)));
        const okIds = ids.filter((_, i) => results[i]?.status === 'fulfilled');
        const failed = ids.length - okIds.length;
        if (okIds.length > 0) {
          const removed = new Set(okIds);
          setRows((prev) => prev.filter((row) => !removed.has(row.enquiryId)));
          setTotalElements((n) => Math.max(0, n - okIds.length));
          setSelected(new Set());
          if (routeEnquiryId && removed.has(routeEnquiryId)) closeDrawer();
          loadSummary();
        }
        if (failed === 0) {
          enqueueSnackbar(t('admin.enquiries.bulkDeleted', { count: okIds.length }), {
            variant: 'success',
          });
        } else if (okIds.length === 0) {
          enqueueSnackbar(t('admin.enquiries.bulkDeleteFailed'), { variant: 'error' });
        } else {
          enqueueSnackbar(
            t('admin.enquiries.bulkDeletePartial', { deleted: okIds.length, failed }),
            { variant: 'warning' },
          );
        }
      }
      setDeleteTarget(null);
    } catch {
      enqueueSnackbar(t('admin.enquiries.deleteFailed'), { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  }

  async function handleExport() {
    try {
      const result = await adminEnquiryApi.list({
        status: status || undefined,
        requesterType: requesterType || undefined,
        q: debouncedQ || undefined,
        from: from || undefined,
        to: to || undefined,
        page: 0,
        size: 50,
      });
      exportCsv(result.content);
    } catch {
      exportCsv(rows);
    }
  }

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 3, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'flex-start' } }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: { xs: 26, md: 30 }, letterSpacing: -0.5 }}>
        {t('admin.enquiries.title')}
      </Typography>
          <Typography sx={{ color: 'text.secondary', mt: 0.5 }}>
            {t('admin.enquiries.subtitle')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Download size={16} />}
          onClick={() => void handleExport()}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            bgcolor: '#22C55E',
            borderRadius: '10px',
            px: 2.5,
            alignSelf: { xs: 'stretch', sm: 'center' },
            '&:hover': { bgcolor: '#16A34A' },
          }}>
          {t('admin.enquiries.export')}
        </Button>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        {stats.map((stat) => (
          <Grid key={stat.key} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: '14px',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 1px 2px rgb(15 23 42 / 0.04), 0 4px 12px rgb(15 23 42 / 0.04)',
              }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '10px',
                      bgcolor: stat.bg,
                      color: stat.fg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <stat.icon size={18} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
                      {stat.label}
                    </Typography>
                    <Typography sx={{ fontWeight: 800, fontSize: 24, lineHeight: 1.1 }}>
                      {stat.value}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card
        elevation={0}
        sx={{
          mb: 2,
          borderRadius: '14px',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 1px 2px rgb(15 23 42 / 0.04)',
        }}>
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.25}
            sx={{ alignItems: { xs: 'stretch', md: 'center' } }}>
            <TextField
              size="small"
              fullWidth
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('admin.enquiries.searchPlaceholder')}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={16} color="#94A3B8" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ flex: 1, bgcolor: '#FFFFFF', '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                displayEmpty
                value={requesterType}
                onChange={(e) => setRequesterType(e.target.value as EnquiryRequesterType | '')}
                sx={{ borderRadius: '10px' }}>
                <MenuItem value="">{t('admin.enquiries.filters.allTypes')}</MenuItem>
                <MenuItem value="MEMBER">{t('admin.labels.member')}</MenuItem>
                <MenuItem value="OWNER">{t('admin.labels.owner')}</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                displayEmpty
                value={status}
                onChange={(e) => setStatus(e.target.value as SpaceEnquiryStatus | '')}
                sx={{ borderRadius: '10px' }}>
                <MenuItem value="">{t('admin.enquiries.filters.allStatus')}</MenuItem>
                <MenuItem value="PENDING">{t('admin.enquiries.status.PENDING')}</MenuItem>
                <MenuItem value="SHARED">{t('admin.enquiries.status.SHARED')}</MenuItem>
                <MenuItem value="EXPIRED">{t('admin.enquiries.status.EXPIRED')}</MenuItem>
                <MenuItem value="REJECTED">{t('admin.enquiries.status.REJECTED')}</MenuItem>
              </Select>
            </FormControl>
            <Stack direction="row" spacing={1} sx={{ minWidth: { md: 260 } }}>
              <TextField
                size="small"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                label={t('admin.enquiries.filters.from')}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
              <TextField
                size="small"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                label={t('admin.enquiries.filters.to')}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {selectedCount > 0 ? (
        <Card
          elevation={0}
          sx={{
            mb: 2,
            borderRadius: '14px',
            border: '1px solid #FECACA',
            bgcolor: '#FEF2F2',
            boxShadow: '0 1px 2px rgb(15 23 42 / 0.04)',
          }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.25}
              sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}>
              <Typography sx={{ fontWeight: 700, color: '#991B1B' }}>
                {t('admin.common.selectedCount', { count: selectedCount })}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  onClick={() => setSelected(new Set())}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px' }}>
                  {t('admin.common.clearSelection')}
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<Trash2 size={16} />}
                  onClick={() => setDeleteTarget({ kind: 'bulk', ids: Array.from(selected) })}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px' }}>
                  {t('admin.common.bulkDelete', { count: selectedCount })}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ) : null}

      <Card
        elevation={0}
        sx={{
          borderRadius: '14px',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 1px 2px rgb(15 23 42 / 0.04), 0 4px 12px rgb(15 23 42 / 0.04)',
          overflow: 'hidden',
        }}>
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 1080 }}>
          <TableHead>
              <TableRow sx={{ bgcolor: '#FAFBFC' }}>
                <TableCell padding="checkbox">
                  <Checkbox checked={allSelected} onChange={toggleAll} />
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('admin.enquiries.columns.listing')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('admin.enquiries.columns.requestedBy')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('admin.enquiries.columns.type')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  <TableSortLabel
                    active
                    direction={sortDir}
                    onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}>
                    {t('admin.enquiries.columns.requested')}
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('admin.enquiries.columns.status')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('admin.common.testLead')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('admin.enquiries.columns.action')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                      {t('common.loading')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                      {t('admin.enquiries.empty')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const requested = formatRequested(row.requestedAt);
                  const thumb = discoverDefaultImageUrl(row.spaceType ?? undefined);
                  return (
                    <TableRow
                      key={row.enquiryId}
                      hover
                      selected={routeEnquiryId === row.enquiryId}
                      sx={{ cursor: 'pointer' }}
                      onClick={() => openEnquiry(row.enquiryId)}>
                      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selected.has(row.enquiryId)}
                          onChange={() => toggleOne(row.enquiryId)}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                          <Box
                            component="img"
                            src={thumb}
                            alt=""
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: '10px',
                              objectFit: 'cover',
                              flexShrink: 0,
                            }}
                          />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: 14 }} noWrap>
                              {row.spaceName}
                            </Typography>
                            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                              <MapPin size={12} color="#94A3B8" />
                              <Typography sx={{ fontSize: 12, color: 'text.secondary' }} noWrap>
                                {row.locationLabel || row.spaceAddress || t('admin.labels.emDash')}
                              </Typography>
                            </Stack>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 700, fontSize: 13.5 }}>
                          {row.requesterName}
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: 'text.secondary' }} noWrap>
                          {row.requesterEmail || t('admin.labels.emDash')}
                        </Typography>
                      </TableCell>
                <TableCell>
                        <Box
                          sx={{
                            display: 'inline-flex',
                            px: 1.25,
                            py: 0.35,
                            borderRadius: '999px',
                            bgcolor: '#F1F5F9',
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#475569',
                          }}>
                  {row.requesterType === 'OWNER'
                    ? t('admin.labels.owner')
                    : t('admin.labels.member')}
                        </Box>
                </TableCell>
                <TableCell>
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{requested.date}</Typography>
                        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                          {requested.time}
                        </Typography>
                </TableCell>
                <TableCell>
                        <AdminEnquiryStatusChip status={row.status} />
                </TableCell>
                <TableCell>
                        {row.testLead ? (
                          <Box
                            sx={{
                              display: 'inline-flex',
                              px: 1.25,
                              py: 0.35,
                              borderRadius: '999px',
                              bgcolor: '#EF4444',
                              color: '#FFFFFF',
                              fontSize: 12,
                              fontWeight: 700,
                            }}>
                            {t('admin.common.yes')}
                          </Box>
                        ) : (
                          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                            {t('admin.labels.emDash')}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                  <Button
                    size="small"
                            startIcon={<Eye size={14} />}
                            onClick={() => openEnquiry(row.enquiryId)}
                            sx={{
                              textTransform: 'none',
                              fontWeight: 700,
                              bgcolor: '#DCFCE7',
                              color: '#15803D',
                              borderRadius: '8px',
                              px: 1.5,
                              '&:hover': { bgcolor: '#BBF7D0' },
                            }}>
                    {t('admin.enquiries.view')}
                  </Button>
                          <Button
                            size="small"
                            onClick={() =>
                              setDeleteTarget({ kind: 'one', ids: [row.enquiryId] })
                            }
                            sx={{
                              textTransform: 'none',
                              fontWeight: 700,
                              color: '#B91C1C',
                              bgcolor: '#FEE2E2',
                              borderRadius: '8px',
                              px: 1.5,
                              minWidth: 0,
                              '&:hover': { bgcolor: '#FECACA' },
                            }}>
                            {t('admin.common.delete')}
                          </Button>
                        </Stack>
                </TableCell>
              </TableRow>
                  );
                })
              )}
          </TableBody>
        </Table>
        </Box>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{
            px: 2,
            py: 1.75,
            borderTop: '1px solid',
            borderColor: 'divider',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            {t('admin.enquiries.showing', {
              from: showingFrom,
              to: showingTo,
              total: totalElements,
            })}
          </Typography>
          {totalPages > 1 ? (
            <Pagination
              count={totalPages}
              page={page + 1}
              onChange={(_, value) => setPage(value - 1)}
              color="primary"
              shape="rounded"
              sx={{
                '& .Mui-selected': {
                  bgcolor: '#22C55E !important',
                  color: '#FFFFFF',
                },
              }}
            />
          ) : null}
        </Stack>
      </Card>

      <AdminEnquiryDetailDrawer
        open={drawerOpen}
        enquiryId={routeEnquiryId ?? null}
        onClose={closeDrawer}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
      />

      <ConfirmDialog
        open={deleteTarget != null}
        title={
          deleteTarget?.kind === 'bulk'
            ? t('admin.enquiries.bulkDeleteTitle')
            : t('admin.enquiries.deleteTitle')
        }
        description={
          deleteTarget
            ? deleteTarget.kind === 'bulk'
              ? t('admin.enquiries.bulkDeleteMessage', { count: deleteTarget.ids.length })
              : t('admin.enquiries.deleteMessage', { id: deleteTarget.ids[0] })
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
