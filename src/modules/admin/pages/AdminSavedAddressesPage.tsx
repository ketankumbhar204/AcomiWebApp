import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  ChefHat,
  Home,
  MapPin,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '@/modules/admin/api/adminApi';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import type { AdminSavedAddressesSummary, SavedAddress } from '@/shared/types/admin';

const PAGE_SIZE = 6;

type UsageFilter = '' | 'UNUSED' | 'USED' | 'SHARED' | 'PROPERTY' | 'MESS';

function isValidPincode(value: string): boolean {
  return /^[1-9]\d{5}$/.test(value);
}

function isValidMapUrl(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.startsWith('http://') || trimmed.startsWith('https://');
}

function formatAdded(iso?: string | null): { date: string; time: string } {
  if (!iso) return { date: '—', time: '' };
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
  };
}

function splitAddressLine(line: string): { title: string; subtitle: string } {
  const parts = line
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length <= 1) return { title: line, subtitle: '' };
  return { title: parts[0] ?? line, subtitle: parts.slice(1).join(', ') };
}

function propertyCount(row: SavedAddress): number {
  return row.propertyUsageCount ?? 0;
}

function messCount(row: SavedAddress): number {
  return row.messUsageCount ?? 0;
}

const emptyForm = {
  addressLine: '',
  city: '',
  state: '',
  pincode: '',
  mapUrl: '',
};

type DeleteTarget =
  | { kind: 'one'; item: SavedAddress }
  | { kind: 'bulk'; ids: string[] };

export function AdminSavedAddressesPage() {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');

  const [summary, setSummary] = useState<AdminSavedAddressesSummary | null>(null);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [usage, setUsage] = useState<UsageFilter>('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view' | null>(null);
  const [editTarget, setEditTarget] = useState<SavedAddress | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuRow, setMenuRow] = useState<SavedAddress | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQ(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const filterKey = `${debouncedQ}|${city}|${state}|${usage}`;
  const [activeFilterKey, setActiveFilterKey] = useState(filterKey);
  if (activeFilterKey !== filterKey) {
    setActiveFilterKey(filterKey);
    setPage(0);
    setSelected(new Set());
  }

  const requestKey = `${filterKey}|${page}`;
  const [activeRequestKey, setActiveRequestKey] = useState(requestKey);
  if (activeRequestKey !== requestKey) {
    setActiveRequestKey(requestKey);
    setLoading(true);
  }

  const loadSummary = () => {
    void adminApi.getSavedAddressesSummary().then(setSummary).catch(() => setSummary(null));
  };

  useEffect(() => {
    loadSummary();
  }, []);

  useEffect(() => {
    let cancelled = false;
    void adminApi
      .listSavedAddresses({
        search: debouncedQ || undefined,
        city: city || undefined,
        state: state || undefined,
        usage: usage || undefined,
        page,
        size: PAGE_SIZE,
      })
      .then((result) => {
        if (!cancelled) {
          setAddresses(result.content);
          setTotalPages(result.totalPages);
          setTotalElements(result.totalElements);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAddresses([]);
          setTotalPages(0);
          setTotalElements(0);
          enqueueSnackbar(t('admin.addresses.loadFailed'), { variant: 'error' });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [city, debouncedQ, enqueueSnackbar, page, state, t, usage]);

  useEffect(() => {
    if (!highlightId || loading) return;
    const el = document.getElementById(`saved-address-${highlightId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightId, loading, addresses]);

  const stats = useMemo(
    () => [
      {
        key: 'total',
        label: t('admin.addresses.stats.total'),
        value: summary?.totalAddresses ?? 0,
        hint: null as string | null,
        icon: MapPin,
        bg: '#DCFCE7',
        fg: '#16A34A',
      },
      {
        key: 'properties',
        label: t('admin.addresses.stats.usedForProperties'),
        value: summary?.usedForProperties ?? 0,
        hint: null,
        icon: Home,
        bg: '#DBEAFE',
        fg: '#2563EB',
      },
      {
        key: 'messes',
        label: t('admin.addresses.stats.usedForMesses'),
        value: summary?.usedForMesses ?? 0,
        hint: null,
        icon: ChefHat,
        bg: '#FFEDD5',
        fg: '#EA580C',
      },
      {
        key: 'shared',
        label: t('admin.addresses.stats.shared'),
        value: summary?.sharedAddresses ?? 0,
        hint: t('admin.addresses.stats.sharedHint'),
        icon: Users,
        bg: '#F3E8FF',
        fg: '#7C3AED',
      },
    ],
    [summary, t],
  );

  const cities = summary?.cities ?? [];
  const states = summary?.states ?? [];
  const allSelected = addresses.length > 0 && addresses.every((row) => selected.has(row.id));
  const selectedCount = selected.size;
  const showingFrom = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const showingTo = Math.min((page + 1) * PAGE_SIZE, totalElements);
  const readOnly = dialogMode === 'view';

  function clearFilters() {
    setSearchInput('');
    setDebouncedQ('');
    setCity('');
    setState('');
    setUsage('');
  }

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm);
    setDialogMode('create');
  }

  function openView(row: SavedAddress) {
    setEditTarget(row);
    setForm({
      addressLine: row.addressLine,
      city: row.city,
      state: row.state,
      pincode: row.pincode,
      mapUrl: row.mapUrl ?? '',
    });
    setDialogMode('view');
  }

  function openEdit(row: SavedAddress) {
    setEditTarget(row);
    setForm({
      addressLine: row.addressLine,
      city: row.city,
      state: row.state,
      pincode: row.pincode,
      mapUrl: row.mapUrl ?? '',
    });
    setDialogMode('edit');
  }

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(addresses.map((a) => a.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    if (!form.addressLine.trim() || !form.city.trim() || !form.state.trim()) {
      enqueueSnackbar(t('admin.addresses.requiredFields'), { variant: 'error' });
      return;
    }
    if (!isValidPincode(form.pincode.trim())) {
      enqueueSnackbar(t('admin.addresses.invalidPincode'), { variant: 'error' });
      return;
    }
    if (form.mapUrl.trim() && !isValidMapUrl(form.mapUrl)) {
      enqueueSnackbar(t('admin.addresses.invalidMapUrl'), { variant: 'error' });
      return;
    }
    setSaving(true);
    const payload = {
      addressLine: form.addressLine.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
      mapUrl: form.mapUrl.trim() || undefined,
    };
    try {
      if (dialogMode === 'create') {
        await adminApi.createSavedAddress(payload);
        enqueueSnackbar(t('admin.addresses.created'), { variant: 'success' });
      } else if (editTarget) {
        await adminApi.updateSavedAddress(editTarget.id, payload);
        enqueueSnackbar(t('admin.addresses.updated'), { variant: 'success' });
      }
      setDialogMode(null);
      setEditTarget(null);
      setLoading(true);
      const result = await adminApi.listSavedAddresses({
        search: debouncedQ || undefined,
        city: city || undefined,
        state: state || undefined,
        usage: usage || undefined,
        page,
        size: PAGE_SIZE,
      });
      setAddresses(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
      loadSummary();
    } catch {
      enqueueSnackbar(
        dialogMode === 'create' ? t('admin.addresses.createFailed') : t('admin.addresses.updateFailed'),
        { variant: 'error' },
      );
    } finally {
      setSaving(false);
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.kind === 'one') {
        await adminApi.deleteSavedAddress(deleteTarget.item.id);
        enqueueSnackbar(t('admin.addresses.removed'), { variant: 'success' });
        setAddresses((prev) => prev.filter((a) => a.id !== deleteTarget.item.id));
        setTotalElements((n) => Math.max(0, n - 1));
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(deleteTarget.item.id);
          return next;
        });
        loadSummary();
      } else {
        const ids = deleteTarget.ids;
        const results = await Promise.allSettled(ids.map((id) => adminApi.deleteSavedAddress(id)));
        const okIds = ids.filter((_, i) => results[i]?.status === 'fulfilled');
        const failed = ids.length - okIds.length;
        if (okIds.length > 0) {
          const removed = new Set(okIds);
          setAddresses((prev) => prev.filter((a) => !removed.has(a.id)));
          setTotalElements((n) => Math.max(0, n - okIds.length));
          setSelected(new Set());
          loadSummary();
        }
        if (failed === 0) {
          enqueueSnackbar(t('admin.addresses.bulkDeleted', { count: okIds.length }), {
            variant: 'success',
          });
        } else if (okIds.length === 0) {
          enqueueSnackbar(t('admin.addresses.bulkDeleteFailed'), { variant: 'error' });
        } else {
          enqueueSnackbar(
            t('admin.addresses.bulkDeletePartial', { deleted: okIds.length, failed }),
            { variant: 'warning' },
          );
        }
      }
      setDeleteTarget(null);
    } catch {
      enqueueSnackbar(
        deleteTarget.kind === 'bulk'
          ? t('admin.addresses.bulkDeleteFailed')
          : t('admin.addresses.removeFailed'),
        { variant: 'error' },
      );
    } finally {
      setDeleting(false);
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
            {t('admin.addresses.title')}
          </Typography>
          <Typography sx={{ color: 'text.secondary', mt: 0.5, maxWidth: 640 }}>
            {t('admin.addresses.hint')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={16} />}
          onClick={openCreate}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            bgcolor: '#22C55E',
            borderRadius: '10px',
            alignSelf: { xs: 'stretch', sm: 'flex-start' },
            '&:hover': { bgcolor: '#16A34A' },
          }}>
          {t('admin.addresses.add')}
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
                height: '100%',
              }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
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
                      flexShrink: 0,
                    }}>
                    <stat.icon size={18} />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
                      {stat.label}
                    </Typography>
                    <Typography sx={{ fontWeight: 800, fontSize: 26, lineHeight: 1.1, my: 0.5 }}>
                      {stat.value}
                    </Typography>
                    {stat.hint ? (
                      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{stat.hint}</Typography>
                    ) : null}
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
            direction={{ xs: 'column', lg: 'row' }}
            spacing={1.25}
            sx={{ alignItems: { xs: 'stretch', lg: 'center' } }}>
            <TextField
              size="small"
              fullWidth
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('admin.addresses.searchPlaceholder')}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={16} color="#94A3B8" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                displayEmpty
                value={city}
                onChange={(e) => setCity(e.target.value)}
                sx={{ borderRadius: '10px' }}>
                <MenuItem value="">{t('admin.addresses.filters.allCities')}</MenuItem>
                {cities.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                displayEmpty
                value={state}
                onChange={(e) => setState(e.target.value)}
                sx={{ borderRadius: '10px' }}>
                <MenuItem value="">{t('admin.addresses.filters.allStates')}</MenuItem>
                {states.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                displayEmpty
                value={usage}
                onChange={(e) => setUsage(e.target.value as UsageFilter)}
                sx={{ borderRadius: '10px' }}>
                <MenuItem value="">{t('admin.addresses.filters.usage')}</MenuItem>
                <MenuItem value="USED">{t('admin.addresses.filters.used')}</MenuItem>
                <MenuItem value="UNUSED">{t('admin.addresses.filters.unused')}</MenuItem>
                <MenuItem value="SHARED">{t('admin.addresses.filters.shared')}</MenuItem>
                <MenuItem value="PROPERTY">{t('admin.addresses.filters.property')}</MenuItem>
                <MenuItem value="MESS">{t('admin.addresses.filters.mess')}</MenuItem>
              </Select>
            </FormControl>
            <Button
              onClick={clearFilters}
              variant="outlined"
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                color: 'text.secondary',
                borderColor: 'divider',
                borderRadius: '10px',
                minWidth: 72,
              }}>
              {t('admin.addresses.filters.clear')}
            </Button>
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
          <Table sx={{ minWidth: 960 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#FAFBFC' }}>
                <TableCell padding="checkbox">
                  <Checkbox checked={allSelected} onChange={toggleAll} />
                </TableCell>
                <TableCell sx={{ fontWeight: 700, width: 48 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('admin.addresses.columns.address')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('admin.addresses.columns.location')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('admin.addresses.columns.usedIn')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('admin.addresses.columns.addedOn')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('admin.common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                      {t('common.loading')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : addresses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                      {t('admin.addresses.empty')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                addresses.map((row, index) => {
                  const { title, subtitle } = splitAddressLine(row.addressLine);
                  const added = formatAdded(row.createdAt);
                  const props = propertyCount(row);
                  const messes = messCount(row);
                  const subLine = [subtitle, row.pincode].filter(Boolean).join(subtitle ? ', ' : '');
                  return (
                    <TableRow
                      key={row.id}
                      id={`saved-address-${row.id}`}
                      hover
                      sx={
                        highlightId === row.id
                          ? { bgcolor: '#F0FDF4' }
                          : undefined
                      }>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selected.has(row.id)}
                          onChange={() => toggleOne(row.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                          {page * PAGE_SIZE + index + 1}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start' }}>
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              bgcolor: '#DBEAFE',
                              color: '#2563EB',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                            <MapPin size={16} />
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: 14 }} noWrap>
                              {title}
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: 'text.secondary' }} noWrap>
                              {subLine || `${row.city}, ${row.pincode}`}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13.5 }}>
                          {row.city}, {row.state}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap' }}>
                          {props > 0 ? (
                            <Box
                              sx={{
                                display: 'inline-flex',
                                px: 1.25,
                                py: 0.35,
                                borderRadius: '999px',
                                bgcolor: '#DCFCE7',
                                color: '#15803D',
                                fontSize: 12,
                                fontWeight: 700,
                              }}>
                              {t('admin.addresses.usedIn.properties', { count: props })}
                            </Box>
                          ) : null}
                          {messes > 0 ? (
                            <Box
                              sx={{
                                display: 'inline-flex',
                                px: 1.25,
                                py: 0.35,
                                borderRadius: '999px',
                                bgcolor: messes > 1 ? '#FFEDD5' : '#F1F5F9',
                                color: messes > 1 ? '#C2410C' : '#64748B',
                                fontSize: 12,
                                fontWeight: 700,
                              }}>
                              {t('admin.addresses.usedIn.messes', { count: messes })}
                            </Box>
                          ) : null}
                          {props === 0 && messes === 0 ? (
                            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>—</Typography>
                          ) : null}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{added.date}</Typography>
                        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                          {added.time}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                          <Button
                            size="small"
                            onClick={() => openView(row)}
                            sx={{
                              textTransform: 'none',
                              fontWeight: 700,
                              color: '#15803D',
                              bgcolor: '#DCFCE7',
                              borderRadius: '8px',
                              px: 1.75,
                              minWidth: 0,
                              '&:hover': { bgcolor: '#BBF7D0' },
                            }}>
                            {t('admin.addresses.view')}
                          </Button>
                          <IconButton
                            size="small"
                            sx={{ color: 'text.secondary' }}
                            onClick={(e) => {
                              setMenuAnchor(e.currentTarget);
                              setMenuRow(row);
                            }}>
                            <MoreVertical size={16} />
                          </IconButton>
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
            {t('admin.addresses.showing', {
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

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => {
          setMenuAnchor(null);
          setMenuRow(null);
        }}>
        <MenuItem
          onClick={() => {
            if (menuRow) openEdit(menuRow);
            setMenuAnchor(null);
            setMenuRow(null);
          }}>
          <ListItemIcon>
            <Pencil size={16} />
          </ListItemIcon>
          <ListItemText>{t('admin.common.edit')}</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuRow) setDeleteTarget({ kind: 'one', item: menuRow });
            setMenuAnchor(null);
            setMenuRow(null);
          }}>
          <ListItemIcon>
            <Trash2 size={16} color="#B91C1C" />
          </ListItemIcon>
          <ListItemText sx={{ color: '#B91C1C' }}>{t('admin.common.delete')}</ListItemText>
        </MenuItem>
      </Menu>

      <Dialog
        open={dialogMode != null}
        onClose={() => setDialogMode(null)}
        fullWidth
        maxWidth="sm">
        <DialogTitle>
          {dialogMode === 'create'
            ? t('admin.addresses.addTitle')
            : dialogMode === 'view'
              ? t('admin.addresses.viewTitle')
              : t('admin.addresses.editTitle')}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={t('admin.common.addressLine')}
              value={form.addressLine}
              onChange={(e) => setForm((f) => ({ ...f, addressLine: e.target.value }))}
              disabled={readOnly}
              fullWidth
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label={t('admin.common.city')}
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                disabled={readOnly}
                fullWidth
              />
              <TextField
                label={t('admin.common.state')}
                value={form.state}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                disabled={readOnly}
                fullWidth
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label={t('admin.common.pincode')}
                value={form.pincode}
                onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
                disabled={readOnly}
                fullWidth
              />
              <TextField
                label={t('admin.common.mapLink')}
                value={form.mapUrl}
                onChange={(e) => setForm((f) => ({ ...f, mapUrl: e.target.value }))}
                disabled={readOnly}
                fullWidth
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogMode(null)} sx={{ textTransform: 'none' }}>
            {t('admin.common.cancel')}
          </Button>
          {dialogMode === 'view' ? (
            <Button
              variant="contained"
              onClick={() => setDialogMode('edit')}
              sx={{ textTransform: 'none', bgcolor: '#22C55E', '&:hover': { bgcolor: '#16A34A' } }}>
              {t('admin.common.edit')}
            </Button>
          ) : (
            <Button
              variant="contained"
              disabled={saving}
              onClick={() => void handleSave()}
              sx={{ textTransform: 'none', bgcolor: '#22C55E', '&:hover': { bgcolor: '#16A34A' } }}>
              {t('admin.common.save')}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget != null}
        title={
          deleteTarget?.kind === 'bulk'
            ? t('admin.addresses.bulkDeleteTitle')
            : t('admin.addresses.removeTitle')
        }
        description={
          deleteTarget
            ? deleteTarget.kind === 'bulk'
              ? t('admin.addresses.bulkDeleteMessage', { count: deleteTarget.ids.length })
              : t('admin.addresses.removeMessage', {
                  address: deleteTarget.item.addressLine,
                  city: deleteTarget.item.city,
                })
            : undefined
        }
        confirmLabel={t('admin.common.delete')}
        cancelLabel={t('admin.common.cancel')}
        destructive
        confirming={deleting}
        onConfirm={() => void handleDelete()}
        onClose={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
