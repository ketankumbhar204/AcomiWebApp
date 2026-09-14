import {
  Box,
  Button,
  FormControl,
  Grid,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { Activity, ArrowLeft, CalendarDays, Funnel } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { adminApi } from '@/modules/admin/api/adminApi';
import { AdminActivityRow } from '@/modules/admin/components/AdminActivityRow';
import {
  adminDashboardDateRange,
  type AdminDashboardDateRangeKey,
} from '@/modules/admin/utils/adminActivityUi';
import { isAdminActivityType } from '@/modules/admin/utils/resolveAdminActivityDestination';
import { ROUTES } from '@/routes/paths';
import type { AdminActivityItem, AdminActivityType } from '@/shared/types/admin';

const PAGE_SIZE = 20;

const ACTIVITY_TYPES: AdminActivityType[] = [
  'NEW_ENQUIRY',
  'NEW_USER_REGISTRATION',
  'NEW_PROPERTY_REGISTRATION',
  'NEW_MESS_REGISTRATION',
  'NEW_PROPERTY_LISTED',
  'NEW_MESS_LISTED',
  'LEAD_CLAIMED_PROPERTY',
  'LEAD_CLAIMED_MESS',
  'ENQUIRY_SHARED',
  'ENQUIRY_REJECTED',
  'ADDRESS_SAVED',
];

export function AdminActivityPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const rangeKey = (searchParams.get('range') as AdminDashboardDateRangeKey) || '30d';
  const activityTypeParam = searchParams.get('activityType');
  const activityType = isAdminActivityType(activityTypeParam) ? activityTypeParam : undefined;
  const page = Math.max(0, Number(searchParams.get('page') || '0') || 0);
  const range = useMemo(() => {
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    if (fromParam && toParam) return { from: fromParam, to: toParam };
    return adminDashboardDateRange(rangeKey === '7d' || rangeKey === '90d' ? rangeKey : '30d');
  }, [rangeKey, searchParams]);

  const [items, setItems] = useState<AdminActivityItem[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const requestKey = `${range.from}|${range.to}|${activityType ?? ''}|${page}`;
  const [activeRequestKey, setActiveRequestKey] = useState(requestKey);

  if (activeRequestKey !== requestKey) {
    setActiveRequestKey(requestKey);
    setLoading(true);
    setError(false);
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await adminApi.listActivity({
        from: range.from,
        to: range.to,
        activityType,
        page,
        size: PAGE_SIZE,
      });
      setItems(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch {
      setError(true);
      setItems([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [activityType, page, range.from, range.to]);

  useEffect(() => {
    let active = true;
    void adminApi
      .listActivity({
        from: range.from,
        to: range.to,
        activityType,
        page,
        size: PAGE_SIZE,
      })
      .then((result) => {
        if (!active) return;
        setItems(result.content);
        setTotalPages(result.totalPages);
        setTotalElements(result.totalElements);
        setError(false);
      })
      .catch(() => {
        if (!active) return;
        setError(true);
        setItems([]);
        setTotalPages(0);
        setTotalElements(0);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activityType, page, range.from, range.to]);

  function updateParams(patch: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value == null || value === '') next.delete(key);
      else next.set(key, value);
    });
    setSearchParams(next);
  }

  const showingFrom = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const showingTo = Math.min((page + 1) * PAGE_SIZE, totalElements);

  const filterCardSx = {
    bgcolor: '#FFFFFF',
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: '12px',
    px: 1.5,
    py: 0.75,
    minWidth: { xs: '100%', sm: 220 },
    boxShadow: '0 1px 2px rgb(15 23 42 / 0.04)',
    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
    '& .MuiSelect-select': { py: 0.75, pr: '32px !important' },
  } as const;

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{
          mb: 2.5,
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'flex-start' },
        }}>
        <Box>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                bgcolor: '#DCFCE7',
                color: '#16A34A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
              <Activity size={20} />
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: 26, md: 30 }, letterSpacing: -0.5 }}>
              {t('admin.activity.title')}
            </Typography>
          </Stack>
          <Typography sx={{ color: 'text.secondary', mt: 0.75, ml: { sm: 6.5 } }}>
            {t('admin.activity.subtitle')}
          </Typography>
        </Box>
        <Button
          component={RouterLink}
          to={ROUTES.adminDashboard}
          startIcon={<ArrowLeft size={16} />}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            color: '#15803D',
            alignSelf: { xs: 'flex-start', sm: 'flex-start' },
            '&:hover': { bgcolor: '#F0FDF4' },
          }}>
          {t('admin.activity.backToDashboard')}
        </Button>
      </Stack>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ mb: 2.5, alignItems: { xs: 'stretch', sm: 'center' } }}>
        <FormControl size="small" sx={filterCardSx}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <CalendarDays size={16} color="#94A3B8" />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary', lineHeight: 1.2 }}>
                {t('admin.dashboard.range.label')}
              </Typography>
              <Select
                fullWidth
                value={rangeKey}
                onChange={(event) =>
                  updateParams({ range: event.target.value, page: '0', from: null, to: null })
                }
                sx={{
                  fontWeight: 700,
                  fontSize: 13.5,
                  '& .MuiSelect-select': { px: 0 },
                }}>
                <MenuItem value="7d">{t('admin.dashboard.range.7d')}</MenuItem>
                <MenuItem value="30d">{t('admin.dashboard.range.30d')}</MenuItem>
                <MenuItem value="90d">{t('admin.dashboard.range.90d')}</MenuItem>
              </Select>
            </Box>
          </Stack>
        </FormControl>

        <FormControl size="small" sx={filterCardSx}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Funnel size={16} color="#94A3B8" />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary', lineHeight: 1.2 }}>
                {t('admin.activity.typeFilter')}
              </Typography>
              <Select
                fullWidth
                displayEmpty
                value={activityType ?? ''}
                onChange={(event) =>
                  updateParams({
                    activityType: event.target.value || null,
                    page: '0',
                  })
                }
                sx={{
                  fontWeight: 700,
                  fontSize: 13.5,
                  '& .MuiSelect-select': { px: 0 },
                }}>
                <MenuItem value="">{t('admin.activity.allTypes')}</MenuItem>
                {ACTIVITY_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {t(`admin.activity.types.${type}`)}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          </Stack>
        </FormControl>
      </Stack>

      {loading ? (
        <Typography color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
          {t('common.loading')}
        </Typography>
      ) : error ? (
        <Stack spacing={1} sx={{ alignItems: 'flex-start', py: 4 }}>
          <Typography color="text.secondary">{t('admin.dashboard.activity.loadError')}</Typography>
          <Button
            variant="outlined"
            onClick={() => void load()}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px' }}>
            {t('common.retry')}
          </Button>
        </Stack>
      ) : items.length === 0 ? (
        <Box
          sx={{
            py: 8,
            textAlign: 'center',
            bgcolor: '#FFFFFF',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '14px',
          }}>
          <Typography sx={{ fontWeight: 700 }}>{t('admin.dashboard.activity.emptyTitle')}</Typography>
          <Typography color="text.secondary">{t('admin.dashboard.activity.emptyHint')}</Typography>
        </Box>
      ) : (
        <Grid container spacing={1.75}>
          {items.map((item) => (
            <Grid key={item.id} size={{ xs: 12, md: 6 }}>
              <AdminActivityRow activity={item} variant="card" />
            </Grid>
          ))}
        </Grid>
      )}

      {!loading && !error && totalElements > 0 ? (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{
            mt: 2.5,
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            {t('admin.activity.showing', {
              from: showingFrom,
              to: showingTo,
              total: totalElements,
            })}
          </Typography>
          {totalPages > 1 ? (
            <Pagination
              page={page + 1}
              count={totalPages}
              onChange={(_, next) => updateParams({ page: String(next - 1) })}
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
      ) : null}
    </Box>
  );
}
