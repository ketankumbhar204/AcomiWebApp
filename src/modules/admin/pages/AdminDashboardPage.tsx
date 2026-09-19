import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  FormControl,
  Grid,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Building2,
  CalendarDays,
  ChefHat,
  FileText,
  Home,
  MapPin,
  Plus,
  Soup,
  UserPlus,
  UserRound,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { adminApi } from '@/modules/admin/api/adminApi';
import { AdminEnquiriesTrendChart } from '@/modules/admin/components/AdminEnquiriesTrendChart';
import { AdminMetricCard } from '@/modules/admin/components/AdminMetricCard';
import { AdminRecentActivityPanel } from '@/modules/admin/components/AdminRecentActivityPanel';
import { AdminUserRegistrationBreakdownChart } from '@/modules/admin/components/AdminUserRegistrationBreakdownChart';
import {
  adminDashboardDateRange,
  defaultCustomDashboardRange,
  type AdminDashboardDateRangeKey,
  type AdminDashboardTrendMetric,
} from '@/modules/admin/utils/adminActivityUi';
import { adminListPath } from '@/modules/admin/utils/adminListFilters';
import {
  ROUTES,
  adminAddMessPath,
  adminAddPropertyPath,
} from '@/routes/paths';
import type {
  AdminActivityItem,
  AdminDashboardSummary,
  AdminEnquiriesTrend,
  AdminUserRegistrationBreakdown,
} from '@/shared/types/admin';
import { useAuthStore } from '@/store/authStore';

function greetingKey(hour: number): 'morning' | 'afternoon' | 'evening' {
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

const cardSx = {
  borderRadius: '14px',
  border: '1px solid',
  borderColor: 'divider',
  boxShadow: '0 1px 2px rgb(15 23 42 / 0.04), 0 4px 12px rgb(15 23 42 / 0.04)',
} as const;

export function AdminDashboardPage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const [rangeKey, setRangeKey] = useState<AdminDashboardDateRangeKey>('7d');
  const [customFrom, setCustomFrom] = useState(() => defaultCustomDashboardRange().from);
  const [customTo, setCustomTo] = useState(() => defaultCustomDashboardRange().to);
  const [trendMetric, setTrendMetric] = useState<AdminDashboardTrendMetric>('ENQUIRIES');

  const range = useMemo(() => {
    if (rangeKey === 'custom') {
      const from = customFrom <= customTo ? customFrom : customTo;
      const to = customFrom <= customTo ? customTo : customFrom;
      return { from, to };
    }
    return adminDashboardDateRange(rangeKey);
  }, [customFrom, customTo, rangeKey]);

  const rangeLabel =
    rangeKey === 'custom'
      ? `${range.from} → ${range.to}`
      : t(`admin.dashboard.range.${rangeKey}`);

  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [activity, setActivity] = useState<AdminActivityItem[]>([]);
  const [trend, setTrend] = useState<AdminEnquiriesTrend | null>(null);
  const [breakdown, setBreakdown] = useState<AdminUserRegistrationBreakdown | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [activityError, setActivityError] = useState(false);
  const [activeFiltersKey, setActiveFiltersKey] = useState(`${range.from}|${range.to}`);
  const [activeChartsKey, setActiveChartsKey] = useState(`${range.from}|${range.to}|${trendMetric}`);
  const filtersKey = `${range.from}|${range.to}`;
  const chartsKey = `${filtersKey}|${trendMetric}`;

  if (activeFiltersKey !== filtersKey) {
    setActiveFiltersKey(filtersKey);
    setSummaryLoading(true);
    setActivityLoading(true);
    setActivityError(false);
  }
  if (activeChartsKey !== chartsKey) {
    setActiveChartsKey(chartsKey);
    setChartsLoading(true);
  }

  const loadActivity = useCallback(async () => {
    setActivityLoading(true);
    setActivityError(false);
    try {
      const page = await adminApi.listActivity({
        from: range.from,
        to: range.to,
        page: 0,
        size: 10,
      });
      setActivity(page.content);
    } catch {
      setActivityError(true);
      setActivity([]);
    } finally {
      setActivityLoading(false);
    }
  }, [range.from, range.to]);

  useEffect(() => {
    let active = true;
    void adminApi
      .getDashboardSummary({ from: range.from, to: range.to })
      .then((data) => {
        if (active) setSummary(data);
      })
      .finally(() => {
        if (active) setSummaryLoading(false);
      });
    return () => {
      active = false;
    };
  }, [range.from, range.to]);

  useEffect(() => {
    let active = true;
    void adminApi
      .listActivity({
        from: range.from,
        to: range.to,
        page: 0,
        size: 10,
      })
      .then((page) => {
        if (!active) return;
        setActivity(page.content);
        setActivityError(false);
      })
      .catch(() => {
        if (!active) return;
        setActivityError(true);
        setActivity([]);
      })
      .finally(() => {
        if (active) setActivityLoading(false);
      });
    return () => {
      active = false;
    };
  }, [range.from, range.to]);

  useEffect(() => {
    let active = true;
    void Promise.all([
      adminApi.getDashboardTrend({ metric: trendMetric, from: range.from, to: range.to }),
      adminApi.getUserRegistrationBreakdown({ from: range.from, to: range.to }),
    ])
      .then(([trendData, breakdownData]) => {
        if (!active) return;
        setTrend(trendData);
        setBreakdown(breakdownData);
      })
      .catch(() => {
        if (!active) return;
        setTrend(null);
        setBreakdown(null);
      })
      .finally(() => {
        if (active) setChartsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [range.from, range.to, trendMetric]);

  const enquirySparkline = useMemo(
    () =>
      trendMetric === 'ENQUIRIES' ? (trend?.points.map((point) => point.count) ?? null) : null,
    [trend, trendMetric],
  );

  const hour = new Date().getHours();
  const displayName = user?.fullName?.trim() || t('admin.dashboard.welcome');
  const metricsLoading = summaryLoading && !summary;

  const metrics = [
    {
      key: 'users',
      label: t('admin.dashboard.stats.registeredUsers'),
      value: summary?.registeredUsersCount ?? 0,
      to: ROUTES.adminRegisteredUsers,
      icon: Users,
      accentBg: '#DCFCE7',
      accentFg: '#16A34A',
      deltaPercent: summary?.registeredUsersDeltaPercent,
      sparkline: null as number[] | null,
    },
    {
      key: 'enquiries',
      label: t('admin.dashboard.stats.totalEnquiries'),
      value: summary?.totalEnquiriesCount ?? 0,
      to: ROUTES.adminEnquiries,
      icon: FileText,
      accentBg: '#F3E8FF',
      accentFg: '#7C3AED',
      deltaPercent: summary?.totalEnquiriesDeltaPercent,
      sparkline: enquirySparkline,
    },
    {
      key: 'properties',
      label: t('admin.dashboard.stats.properties'),
      value: summary?.propertyRegistrationCount ?? 0,
      to: adminListPath('properties', { tab: 'leads' }),
      icon: Building2,
      accentBg: '#DBEAFE',
      accentFg: '#2563EB',
      deltaPercent: null as number | null,
      sparkline: null as number[] | null,
    },
    {
      key: 'mess',
      label: t('admin.dashboard.stats.mess'),
      value: summary?.messRegistrationCount ?? 0,
      to: adminListPath('mess', { tab: 'leads' }),
      icon: ChefHat,
      accentBg: '#FFEDD5',
      accentFg: '#EA580C',
      deltaPercent: null as number | null,
      sparkline: null as number[] | null,
    },
    {
      key: 'owners',
      label: t('admin.dashboard.stats.vendorsOwners'),
      value: summary?.ownersCount ?? 0,
      to: ROUTES.adminRegisteredUsers,
      icon: UserRound,
      accentBg: '#FEF9C3',
      accentFg: '#CA8A04',
      deltaPercent: summary?.ownersDeltaPercent,
      sparkline: null as number[] | null,
    },
    {
      key: 'activeProperties',
      label: t('admin.dashboard.stats.activeProperties'),
      value: summary?.activePropertySpaces ?? 0,
      to: adminListPath('properties', { tab: 'active' }),
      icon: Home,
      accentBg: '#FCE7F3',
      accentFg: '#DB2777',
      deltaPercent: summary?.propertySpacesDeltaPercent,
      sparkline: null as number[] | null,
    },
    {
      key: 'activeMesses',
      label: t('admin.dashboard.stats.activeMesses'),
      value: summary?.activeMessSpaces ?? 0,
      to: adminListPath('mess', { tab: 'active' }),
      icon: Soup,
      accentBg: '#CCFBF1',
      accentFg: '#0F766E',
      deltaPercent: summary?.messSpacesDeltaPercent,
      sparkline: null as number[] | null,
    },
    {
      key: 'addresses',
      label: t('admin.dashboard.stats.savedAddresses'),
      value: summary?.savedAddressesCount ?? 0,
      to: ROUTES.adminSavedAddresses,
      icon: MapPin,
      accentBg: '#E0E7FF',
      accentFg: '#4F46E5',
      deltaPercent: summary?.savedAddressesDeltaPercent,
      sparkline: null as number[] | null,
    },
  ] as const;

  const quickActions = [
    {
      to: adminAddPropertyPath(),
      icon: Plus,
      title: t('admin.dashboard.quickActions.addProperty'),
      hint: t('admin.dashboard.quickActions.addPropertyHint'),
      color: '#16A34A',
      bg: '#DCFCE7',
    },
    {
      to: adminAddMessPath(),
      icon: ChefHat,
      title: t('admin.dashboard.quickActions.addMess'),
      hint: t('admin.dashboard.quickActions.addMessHint'),
      color: '#EA580C',
      bg: '#FFEDD5',
    },
    {
      to: ROUTES.adminRegisteredUsers,
      icon: UserPlus,
      title: t('admin.dashboard.quickActions.addUser'),
      hint: t('admin.dashboard.quickActions.addUserHint'),
      color: '#2563EB',
      bg: '#DBEAFE',
    },
    {
      to: ROUTES.adminSavedAddresses,
      icon: MapPin,
      title: t('admin.dashboard.quickActions.addresses'),
      hint: t('admin.dashboard.quickActions.addressesHint'),
      color: '#4F46E5',
      bg: '#E0E7FF',
    },
  ];

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{
          mb: 3,
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'flex-start' },
        }}>
        <Box>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: { xs: 26, md: 30 },
              letterSpacing: -0.6,
              color: 'text.primary',
              lineHeight: 1.2,
            }}>
            {t(`admin.dashboard.greeting.${greetingKey(hour)}`, { name: displayName })}
          </Typography>
          <Typography sx={{ mt: 0.5, color: 'text.secondary', fontSize: 14.5 }}>
            {t('admin.dashboard.subtitle')}
          </Typography>
        </Box>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.25}
          sx={{ alignItems: { xs: 'stretch', sm: 'center' }, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 176 }}>
            <Select
              value={rangeKey}
              onChange={(event) => {
                const next = event.target.value as AdminDashboardDateRangeKey;
                setRangeKey(next);
                if (next === 'custom') {
                  const preset = defaultCustomDashboardRange();
                  setCustomFrom(preset.from);
                  setCustomTo(preset.to);
                }
              }}
              renderValue={(value) => (
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <CalendarDays size={16} color="#64748B" />
                  <span>{t(`admin.dashboard.range.${value}`)}</span>
                </Stack>
              )}
              sx={{
                borderRadius: '10px',
                bgcolor: '#FFFFFF',
                fontWeight: 600,
                boxShadow: '0 1px 2px rgb(15 23 42 / 0.04)',
              }}>
              <MenuItem value="7d">{t('admin.dashboard.range.7d')}</MenuItem>
              <MenuItem value="30d">{t('admin.dashboard.range.30d')}</MenuItem>
              <MenuItem value="60d">{t('admin.dashboard.range.60d')}</MenuItem>
              <MenuItem value="90d">{t('admin.dashboard.range.90d')}</MenuItem>
              <MenuItem value="custom">{t('admin.dashboard.range.custom')}</MenuItem>
            </Select>
          </FormControl>
          {rangeKey === 'custom' ? (
            <>
              <TextField
                size="small"
                type="date"
                label={t('admin.dashboard.range.from')}
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{
                  minWidth: 150,
                  bgcolor: '#FFFFFF',
                  '& .MuiOutlinedInput-root': { borderRadius: '10px' },
                }}
              />
              <TextField
                size="small"
                type="date"
                label={t('admin.dashboard.range.to')}
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{
                  minWidth: 150,
                  bgcolor: '#FFFFFF',
                  '& .MuiOutlinedInput-root': { borderRadius: '10px' },
                }}
              />
            </>
          ) : null}
        </Stack>
      </Stack>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Grid container spacing={2} sx={{ mb: 2.5 }}>
            {metrics.map((metric) => (
              <Grid key={metric.key} size={{ xs: 12, sm: 6, md: 3 }}>
                <AdminMetricCard
                  label={metric.label}
                  value={metric.value}
                  to={metric.to}
                  icon={metric.icon}
                  accentBg={metric.accentBg}
                  accentFg={metric.accentFg}
                  deltaPercent={metric.deltaPercent}
                  sparkline={metric.sparkline}
                  loading={metricsLoading}
                />
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2} sx={{ mb: 2.5 }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <AdminEnquiriesTrendChart
                trend={trend}
                loading={chartsLoading}
                rangeLabel={rangeLabel}
                metric={trendMetric}
                onMetricChange={setTrendMetric}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <AdminUserRegistrationBreakdownChart
                breakdown={breakdown}
                loading={chartsLoading}
                rangeLabel={rangeLabel}
              />
            </Grid>
          </Grid>

          <Card elevation={0} sx={{ ...cardSx, mb: 2.5 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography sx={{ fontWeight: 800, fontSize: 15, mb: 1.5 }}>
                {t('admin.dashboard.quickActionsTitle')}
              </Typography>
              <Grid container spacing={1.5}>
                {quickActions.map((action) => (
                  <Grid key={action.to + action.title} size={{ xs: 12, sm: 6, md: 3 }}>
                    <CardActionArea
                      component={RouterLink}
                      to={action.to}
                      sx={{
                        borderRadius: '12px',
                        p: 1.5,
                        border: '1px solid',
                        borderColor: 'divider',
                        height: '100%',
                        '&:hover': { bgcolor: '#F8FAFC', borderColor: action.color },
                      }}>
                      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start' }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '999px',
                            bgcolor: action.bg,
                            color: action.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                          <action.icon size={18} />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                            {action.title}
                          </Typography>
                          <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.25 }}>
                            {action.hint}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardActionArea>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          <Stack
            direction="row"
            spacing={1}
            sx={{ flexWrap: 'wrap', alignItems: 'center', rowGap: 1 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary', mr: 0.5 }}>
              {t('admin.dashboard.sectionLeadsSpaces')}:
            </Typography>
            {(
              [
                ['websiteProperty', summary?.websitePropertyLeads ?? 0, adminListPath('properties', { tab: 'leads', source: 'PUBLIC_WEBSITE' })],
                ['websiteMess', summary?.websiteMessLeads ?? 0, adminListPath('mess', { tab: 'leads', source: 'PUBLIC_WEBSITE' })],
                ['adminProperty', summary?.adminPropertyLeads ?? 0, adminListPath('properties', { tab: 'leads', source: 'ADMIN' })],
                ['adminMess', summary?.adminMessLeads ?? 0, adminListPath('mess', { tab: 'leads', source: 'ADMIN' })],
              ] as const
            ).map(([key, value, to]) => (
              <Button
                key={key}
                component={RouterLink}
                to={to}
                size="small"
                sx={{
                  textTransform: 'none',
                  borderRadius: '999px',
                  bgcolor: '#FFFFFF',
                  border: '1px solid',
                  borderColor: 'divider',
                  color: 'text.secondary',
                  fontWeight: 600,
                  fontSize: 12,
                  px: 1.25,
                }}>
                {t(`admin.dashboard.stats.${key}`)} · {value}
              </Button>
            ))}
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <AdminRecentActivityPanel
            items={activity}
            loading={activityLoading}
            error={activityError}
            onRetry={() => void loadActivity()}
            viewAllFrom={range.from}
            viewAllTo={range.to}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
