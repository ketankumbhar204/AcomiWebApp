import {
  Box,
  Card,
  CardContent,
  FormControl,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AdminEnquiriesTrend } from '@/shared/types/admin';

type Props = {
  trend: AdminEnquiriesTrend | null;
  loading?: boolean;
  rangeLabel?: string;
};

export function AdminEnquiriesTrendChart({ trend, loading, rangeLabel }: Props) {
  const { t } = useTranslation();
  const [metric, setMetric] = useState('enquiries');
  const width = 640;
  const height = 260;
  const padL = 36;
  const padR = 16;
  const padT = 20;
  const padB = 36;

  const path = useMemo(() => {
    if (!trend || trend.points.length === 0) return null;
    const maxRaw = Math.max(...trend.points.map((p) => p.count), 0);
    const max = Math.max(5, Math.ceil(maxRaw / 5) * 5);
    const step =
      trend.points.length === 1 ? 0 : (width - padL - padR) / (trend.points.length - 1);
    const coords = trend.points.map((point, index) => {
      const x = padL + index * step;
      const y = height - padB - (point.count / max) * (height - padT - padB);
      const date = new Date(`${point.date}T00:00:00`);
      const label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      return { x, y, label, count: point.count, date: point.date };
    });
    const first = coords[0];
    const last = coords[coords.length - 1];
    if (!first || !last) return null;
    const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
    const area = `${line} L ${last.x} ${height - padB} L ${first.x} ${height - padB} Z`;
    const gridYs = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
      y: height - padB - ratio * (height - padT - padB),
      value: Math.round(max * ratio),
    }));
    const peak = coords.reduce((best, c) => (c.count >= best.count ? c : best), first);
    return { coords, line, area, max, gridYs, peak };
  }, [trend]);

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
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'flex-start' }, mb: 2 }}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 16, color: 'text.primary' }}>
              {t('admin.dashboard.charts.enquiriesTrend')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {rangeLabel
                ? t('admin.dashboard.charts.enquiriesTrendHintRange', { range: rangeLabel })
                : t('admin.dashboard.charts.enquiriesTrendHint')}
            </Typography>
          </Box>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              sx={{
                borderRadius: 2,
                bgcolor: 'background.paper',
                fontWeight: 600,
                fontSize: 13,
              }}>
              <MenuItem value="enquiries">{t('admin.dashboard.charts.metricEnquiries')}</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {loading || !path ? (
          <Box sx={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">
              {loading ? t('common.loading') : t('admin.dashboard.charts.noData')}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ width: '100%', position: 'relative' }}>
            <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={260} role="img">
              <defs>
                <linearGradient id="enquiryArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22C55E" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {path.gridYs.map((g) => (
                <g key={g.value}>
                  <line
                    x1={padL}
                    x2={width - padR}
                    y1={g.y}
                    y2={g.y}
                    stroke="#E2E8F0"
                    strokeDasharray="4 4"
                  />
                  <text x={padL - 8} y={g.y + 4} textAnchor="end" fontSize="11" fill="#94A3B8">
                    {g.value}
                  </text>
                </g>
              ))}
              <path d={path.area} fill="url(#enquiryArea)" />
              <path d={path.line} fill="none" stroke="#22C55E" strokeWidth={3} strokeLinecap="round" />
              {path.coords.map((c) => (
                <g key={c.date}>
                  <circle cx={c.x} cy={c.y} r={c === path.peak ? 5 : 3.5} fill="#22C55E" />
                  <text x={c.x} y={height - 10} textAnchor="middle" fontSize="11" fill="#64748B">
                    {c.label}
                  </text>
                </g>
              ))}
              {path.peak.count > 0 ? (
                <g>
                  <rect
                    x={Math.min(path.peak.x - 44, width - 100)}
                    y={path.peak.y - 36}
                    width={88}
                    height={26}
                    rx={8}
                    fill="#0F172A"
                  />
                  <text
                    x={Math.min(path.peak.x - 44, width - 100) + 44}
                    y={path.peak.y - 19}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill="#FFFFFF">
                    {path.peak.count} {t('admin.dashboard.charts.enquiriesShort')}
                  </text>
                </g>
              ) : null}
            </svg>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
