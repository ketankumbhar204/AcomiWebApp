import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { AdminUserRegistrationBreakdown } from '@/shared/types/admin';

const COLORS = ['#22C55E', '#3B82F6', '#8B5CF6', '#F59E0B'];

type Props = {
  breakdown: AdminUserRegistrationBreakdown | null;
  loading?: boolean;
  rangeLabel?: string;
};

export function AdminUserRegistrationBreakdownChart({ breakdown, loading, rangeLabel }: Props) {
  const { t } = useTranslation();
  const rings = useMemo(() => {
    if (!breakdown || breakdown.total <= 0) return [];
    let angle = -90;
    return breakdown.slices.map((slice, index) => {
      const portion = (slice.count / breakdown.total) * 360;
      const start = angle;
      angle += portion;
      return { ...slice, start, portion, color: COLORS[index % COLORS.length]! };
    });
  }, [breakdown]);

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: '14px',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 1px 2px rgb(15 23 42 / 0.04), 0 4px 12px rgb(15 23 42 / 0.04)',
      }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Typography sx={{ fontWeight: 800, fontSize: 16, mb: 0.25 }}>
          {t('admin.dashboard.charts.userBreakdown')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          {rangeLabel
            ? t('admin.dashboard.charts.userBreakdownHintRange', { range: rangeLabel })
            : t('admin.dashboard.charts.userBreakdownHint')}
        </Typography>

        {loading || !breakdown ? (
          <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">
              {loading ? t('common.loading') : t('admin.dashboard.charts.noData')}
            </Typography>
          </Box>
        ) : breakdown.total === 0 ? (
          <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">{t('admin.dashboard.charts.noData')}</Typography>
          </Box>
        ) : (
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={3}
            sx={{ alignItems: 'center', justifyContent: 'center', minHeight: 220 }}>
            <Box sx={{ position: 'relative', width: 168, height: 168, flexShrink: 0 }}>
              <svg viewBox="0 0 120 120" width="168" height="168">
                {rings.map((ring) => {
                  if (ring.portion <= 0) return null;
                  const r = 44;
                  const c = 2 * Math.PI * r;
                  const dash = (ring.portion / 360) * c;
                  return (
                    <circle
                      key={ring.role}
                      cx="60"
                      cy="60"
                      r={r}
                      fill="transparent"
                      stroke={ring.color}
                      strokeWidth="18"
                      strokeDasharray={`${dash} ${c - dash}`}
                      strokeDashoffset={-((ring.start + 90) / 360) * c}
                      transform="rotate(-90 60 60)"
                      strokeLinecap="butt"
                    />
                  );
                })}
                <circle cx="60" cy="60" r="32" fill="#FFFFFF" />
              </svg>
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Typography sx={{ fontWeight: 800, fontSize: 26, lineHeight: 1, color: 'text.primary' }}>
                  {breakdown.total}
                </Typography>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
                  {t('admin.dashboard.charts.totalLabel')}
                </Typography>
              </Box>
            </Box>

            <Stack spacing={1.25} sx={{ flex: 1, width: '100%', maxWidth: 220 }}>
              {breakdown.slices.map((slice, index) => (
                <Stack
                  key={slice.role}
                  direction="row"
                  sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: COLORS[index % COLORS.length],
                        flexShrink: 0,
                      }}
                    />
                    <Typography sx={{ fontSize: 13, color: 'text.secondary' }} noWrap>
                      {slice.label}
                    </Typography>
                  </Stack>
                  <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{slice.count}</Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
