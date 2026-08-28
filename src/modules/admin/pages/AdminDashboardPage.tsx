import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Grid,
  Typography,
} from '@mui/material';
import { Building2, ChefHat } from 'lucide-react';
import { useEffect, useState } from 'react';
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
        Dashboard
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard
            label="Property leads"
            value={summary.propertyRegistrationCount}
            to={adminListPath('properties', { tab: 'leads' })}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard
            label="Mess leads"
            value={summary.messRegistrationCount}
            to={adminListPath('mess', { tab: 'leads' })}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard
            label="Website property"
            value={summary.websitePropertyLeads}
            to={adminListPath('properties', { tab: 'leads', source: 'PUBLIC_WEBSITE' })}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard
            label="Website mess"
            value={summary.websiteMessLeads}
            to={adminListPath('mess', { tab: 'leads', source: 'PUBLIC_WEBSITE' })}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard
            label="Admin property"
            value={summary.adminPropertyLeads}
            to={adminListPath('properties', { tab: 'leads', source: 'ADMIN' })}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard
            label="Admin mess"
            value={summary.adminMessLeads}
            to={adminListPath('mess', { tab: 'leads', source: 'ADMIN' })}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard
            label="Active properties"
            value={summary.activePropertySpaces}
            to={adminListPath('properties', { tab: 'active' })}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard
            label="Active messes"
            value={summary.activeMessSpaces}
            to={adminListPath('mess', { tab: 'active' })}
          />
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardActionArea component={RouterLink} to={ROUTES.adminProperties}>
              <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Building2 size={28} />
                <Box>
                  <Typography variant="h6">Properties</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Leads, active spaces, add property
                  </Typography>
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardActionArea component={RouterLink} to={ROUTES.adminMess}>
              <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <ChefHat size={28} />
                <Box>
                  <Typography variant="h6">Mess</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Leads, active messes, add mess
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
