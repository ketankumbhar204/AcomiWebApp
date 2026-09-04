import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Grid,
  Typography,
} from '@mui/material';
import { Building2, ChefHat, MapPin, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { adminApi } from '@/modules/admin/api/adminApi';
import { adminListPath } from '@/modules/admin/utils/adminListFilters';
import { ROUTES } from '@/routes/paths';
import type { AdminDashboardSummary } from '@/shared/types/admin';

function StatCard({ label, value, to }: { label: string; value: number; to: string }) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        minWidth: 0,
        transition: 'border-color 0.15s ease',
        '&:hover': { borderColor: 'primary.main' },
      }}>
      <CardActionArea component={RouterLink} to={to} sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
            {value}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export function AdminDashboardPage() {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void adminApi.getDashboardSummary().then((data) => {
      if (active) {
        setSummary(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  if (loading || !summary) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        {t('admin.dashboard.title')}
      </Typography>

      <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, mb: 1.5 }}>
        {t('admin.dashboard.sectionRegistration')}
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label={t('admin.dashboard.stats.registeredUsers')}
            value={summary.registeredUsersCount ?? 0}
            to={ROUTES.adminRegisteredUsers}
          />
        </Grid>
      </Grid>

      <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, mb: 1.5 }}>
        {t('admin.dashboard.sectionLeadsSpaces')}
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard
            label={t('admin.dashboard.stats.propertyLeads')}
            value={summary.propertyRegistrationCount}
            to={adminListPath('properties', { tab: 'leads' })}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard
            label={t('admin.dashboard.stats.messLeads')}
            value={summary.messRegistrationCount}
            to={adminListPath('mess', { tab: 'leads' })}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard
            label={t('admin.dashboard.stats.websiteProperty')}
            value={summary.websitePropertyLeads}
            to={adminListPath('properties', { tab: 'leads', source: 'PUBLIC_WEBSITE' })}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard
            label={t('admin.dashboard.stats.websiteMess')}
            value={summary.websiteMessLeads}
            to={adminListPath('mess', { tab: 'leads', source: 'PUBLIC_WEBSITE' })}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard
            label={t('admin.dashboard.stats.adminProperty')}
            value={summary.adminPropertyLeads}
            to={adminListPath('properties', { tab: 'leads', source: 'ADMIN' })}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard
            label={t('admin.dashboard.stats.adminMess')}
            value={summary.adminMessLeads}
            to={adminListPath('mess', { tab: 'leads', source: 'ADMIN' })}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard
            label={t('admin.dashboard.stats.activeProperties')}
            value={summary.activePropertySpaces}
            to={adminListPath('properties', { tab: 'active' })}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard
            label={t('admin.dashboard.stats.activeMesses')}
            value={summary.activeMessSpaces}
            to={adminListPath('mess', { tab: 'active' })}
          />
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card variant="outlined" sx={{ minWidth: 0 }}>
            <CardActionArea component={RouterLink} to={ROUTES.adminRegisteredUsers}>
              <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Users size={28} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6">{t('admin.dashboard.nav.registeredUsersTitle')}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('admin.dashboard.nav.registeredUsersHint')}
                  </Typography>
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card variant="outlined" sx={{ minWidth: 0 }}>
            <CardActionArea component={RouterLink} to={ROUTES.adminProperties}>
              <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Building2 size={28} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6">{t('admin.dashboard.nav.propertiesTitle')}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('admin.dashboard.nav.propertiesHint')}
                  </Typography>
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card variant="outlined" sx={{ minWidth: 0 }}>
            <CardActionArea component={RouterLink} to={ROUTES.adminMess}>
              <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <ChefHat size={28} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6">{t('admin.dashboard.nav.messTitle')}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('admin.dashboard.nav.messHint')}
                  </Typography>
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card variant="outlined" sx={{ minWidth: 0 }}>
            <CardActionArea component={RouterLink} to={ROUTES.adminSavedAddresses}>
              <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <MapPin size={28} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6">{t('admin.dashboard.nav.savedAddressesTitle')}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('admin.dashboard.nav.savedAddressesHint')}
                  </Typography>
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
