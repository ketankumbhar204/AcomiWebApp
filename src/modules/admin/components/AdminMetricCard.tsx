import { Box, Card, CardActionArea, CardContent, Stack, Typography } from '@mui/material';
import type { LucideIcon } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { AdminMiniSparkline } from '@/modules/admin/components/AdminMiniSparkline';

type AdminMetricCardProps = {
  label: string;
  value: number;
  to: string;
  icon: LucideIcon;
  accentBg: string;
  accentFg: string;
  deltaPercent?: number | null;
  sparkline?: number[] | null;
  loading?: boolean;
};

export function AdminMetricCard({
  label,
  value,
  to,
  icon: Icon,
  accentBg,
  accentFg,
  deltaPercent,
  sparkline,
  loading,
}: AdminMetricCardProps) {
  const showDelta = typeof deltaPercent === 'number';
  const positive = (deltaPercent ?? 0) > 0;
  const negative = (deltaPercent ?? 0) < 0;
  const sparkColor = positive ? '#22C55E' : negative ? '#EF4444' : '#94A3B8';

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: '14px',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 1px 2px rgb(15 23 42 / 0.04), 0 4px 12px rgb(15 23 42 / 0.04)',
        bgcolor: 'background.paper',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: '0 4px 16px rgb(15 23 42 / 0.08)',
        },
      }}>
      <CardActionArea component={RouterLink} to={to} sx={{ height: '100%' }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Stack spacing={1.25}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                bgcolor: accentBg,
                color: accentFg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Icon size={18} strokeWidth={2.25} />
            </Box>

            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 600,
                color: 'text.secondary',
                letterSpacing: 0.1,
              }}>
              {label}
            </Typography>

            <Typography
              sx={{
                fontSize: 28,
                fontWeight: 800,
                lineHeight: 1,
                color: 'text.primary',
                letterSpacing: -0.5,
              }}>
              {loading ? '—' : value}
            </Typography>

            <Stack
              direction="row"
              sx={{
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                minHeight: 28,
                gap: 1,
              }}>
              {showDelta ? (
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: positive ? '#16A34A' : negative ? '#DC2626' : 'text.secondary',
                  }}>
                  {positive ? '↑' : negative ? '↓' : '→'} {Math.abs(deltaPercent!).toFixed(0)}%
                </Typography>
              ) : (
                <Box />
              )}
              {sparkline && sparkline.length > 1 ? (
                <AdminMiniSparkline values={sparkline} color={sparkColor} />
              ) : null}
            </Stack>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
