import { Box, Button, CircularProgress, IconButton, Typography, useTheme } from '@mui/material';
import { ChevronLeft, ChevronRight, Clock, Inbox, IndianRupee, Wallet } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { DashboardFinancialSummary } from '@/shared/types/dashboard';
import {
  currentMonthKey,
  formatCurrency,
  formatMonthYear,
  isFutureMonth,
  shiftMonthKey,
} from '@/shared/utils/dashboardFinancial';
import { spacePaymentsPath } from '@/routes/paths';
import { colors, pastels } from '@/shared/theme/colors';
import { semanticSurface, type SemanticTone } from '@/shared/theme/semantic';
import { DashboardSection } from './DashboardSection';
import { IconBadge } from './IconBadge';
import { MetricRow } from './MetricRow';
import { DASHBOARD_UX, dashSurfaces, metricValueSx } from '../theme/dashboardUx';

type FinancialSummaryWidgetProps = {
  spaceId: string;
  financial: DashboardFinancialSummary | null;
  emptyHint?: string;
  /** Mess: 4 separate cards in one row. PG: 2×2 board. */
  layout?: 'board' | 'row';
  month?: string;
  onMonthChange?: (month: string) => void;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
};

type PayMetric = {
  id: string;
  label: string;
  value: string;
  accent: string;
  tone: SemanticTone;
  /** Mobile-finalized pastel fill — used for Expected / Collected greens. */
  surface?: { bg: string; border: string; fg: string; iconBg: string };
  icon: ReactNode;
  onClick: () => void;
};

/** Same tiles as Mobile `DashboardFinancialSnapshot` — mint vs green, not teal. */
const TILE = {
  expected: pastels.mint,
  collected: pastels.green,
} as const;

/** Payment Summary — 2×2 board (PG) or 4 cards in a row (Mess). */
export function FinancialSummaryWidget({
  spaceId,
  financial,
  layout = 'board',
  month,
  onMonthChange,
  loading = false,
  error = false,
  onRetry,
}: FinancialSummaryWidgetProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const currency = financial?.currencyCode || 'INR';

  const items: PayMetric[] = [
    {
      id: 'expected',
      label: t('dashboard.financial.expected'),
      value: formatCurrency(financial?.expectedCharges, currency),
      accent: TILE.expected.fg,
      tone: 'accent',
      surface: TILE.expected,
      icon: (
        <IconBadge surface={{ iconBg: TILE.expected.iconBg, fg: TILE.expected.fg }}>
          <Wallet />
        </IconBadge>
      ),
      onClick: () => navigate(spacePaymentsPath(spaceId, undefined, { filter: 'all' })),
    },
    {
      id: 'collected',
      label: t('dashboard.financial.collected'),
      value: formatCurrency(financial?.collected, currency),
      accent: TILE.collected.fg,
      tone: 'success',
      surface: TILE.collected,
      icon: (
        <IconBadge surface={{ iconBg: TILE.collected.iconBg, fg: TILE.collected.fg }}>
          <Inbox />
        </IconBadge>
      ),
      onClick: () => navigate(spacePaymentsPath(spaceId, undefined, { filter: 'collected' })),
    },
    {
      id: 'underReview',
      label: t('dashboard.financial.underReview'),
      value: formatCurrency(financial?.underReview, currency),
      accent: '#3B82F6',
      tone: 'info',
      icon: (
        <IconBadge tone="info">
          <Clock />
        </IconBadge>
      ),
      onClick: () => navigate(spacePaymentsPath(spaceId, undefined, { filter: 'underReview', queue: 'SUBMITTED' })),
    },
    {
      id: 'pending',
      label: t('dashboard.financial.pending'),
      value: formatCurrency(financial?.pending, currency),
      accent: '#F59E0B',
      tone: 'warning',
      icon: (
        <IconBadge tone="warning">
          <IndianRupee />
        </IconBadge>
      ),
      onClick: () => navigate(spacePaymentsPath(spaceId, undefined, { filter: 'pending' })),
    },
  ];

  const nextMonth = month ? shiftMonthKey(month, 1) : currentMonthKey();
  const nextDisabled = !onMonthChange || isFutureMonth(nextMonth);
  const amountsEmpty =
    !loading &&
    !error &&
    (financial?.expectedCharges ?? 0) === 0 &&
    (financial?.collected ?? 0) === 0 &&
    (financial?.underReview ?? 0) === 0 &&
    (financial?.pending ?? 0) === 0;
  const monthNav =
    month && onMonthChange ? (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1, minHeight: 36 }}>
        <IconButton
          size="small"
          aria-label={t('dashboard.financial.previousMonth')}
          onClick={() => onMonthChange(shiftMonthKey(month, -1))}
          sx={{
            color: colors.primaryDark,
            border: `1px solid ${s.border}`,
            borderRadius: `${DASHBOARD_UX.radius}px`,
            width: 32,
            height: 32,
          }}
        >
          <ChevronLeft size={16} />
        </IconButton>
        <Typography
          sx={{ ...DASHBOARD_UX.button, color: colors.primaryDark, flex: 1, textAlign: 'center', minWidth: 0 }}
          noWrap
        >
          {formatMonthYear(month, i18n.language)}
        </Typography>
        <IconButton
          size="small"
          aria-label={t('dashboard.financial.nextMonth')}
          disabled={nextDisabled}
          onClick={() => onMonthChange(nextMonth)}
          sx={{
            color: colors.primaryDark,
            border: `1px solid ${s.border}`,
            borderRadius: `${DASHBOARD_UX.radius}px`,
            width: 32,
            height: 32,
          }}
        >
          <ChevronRight size={16} />
        </IconButton>
      </Box>
    ) : null;
  const statusLine = loading ? (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
      <CircularProgress size={22} />
    </Box>
  ) : error ? (
    <Button size="small" onClick={onRetry} sx={{ alignSelf: 'flex-start', textTransform: 'none' }}>
      {t('dashboard.financial.loadFailed')} {t('dashboard.financial.retry')}
    </Button>
  ) : amountsEmpty ? (
    <Typography sx={{ ...DASHBOARD_UX.sectionSubtitle, color: s.textMuted, mb: 1 }}>
      {emptyHint ?? t('dashboard.financial.monthEmpty')}
    </Typography>
  ) : null;

  if (layout === 'row') {
    return (
      <Box component="section" aria-label={t('dashboard.financial.title')} sx={{ width: '100%' }}>
        <Box
          sx={{
            mb: 1,
            display: 'flex',
            alignItems: 'baseline',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary }}>
            {t('dashboard.financial.title')}
          </Typography>
        </Box>
        {monthNav}
        {statusLine}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr 1fr',
              md: 'repeat(4, minmax(0, 1fr))',
            },
            gap: `${DASHBOARD_UX.cardGap}px`,
            width: '100%',
          }}
        >
          {items.map((item) => {
            const surface = item.surface ?? semanticSurface(item.tone, theme.palette.mode);
            return (
            <Box
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={item.onClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  item.onClick();
                }
              }}
              aria-label={`${item.label}: ${item.value}`}
              sx={{
                minWidth: 0,
                minHeight: DASHBOARD_UX.paymentCardMinHeight,
                px: `${DASHBOARD_UX.metricPadding + 2}px`,
                py: `${DASHBOARD_UX.metricPadding + 2}px`,
                bgcolor: surface.bg,
                border: `1px solid ${surface.border}`,
                borderRadius: `${DASHBOARD_UX.radius}px`,
                boxShadow: s.shadow,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: `${DASHBOARD_UX.metricGap}px`,
                cursor: 'pointer',
                transition: DASHBOARD_UX.transition,
                '&:hover': { boxShadow: s.shadowHover, transform: 'translateY(-1px)' },
                '&:focus-visible': {
                  outline: `2px solid ${colors.primary}`,
                  outlineOffset: 2,
                },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 1,
                  minWidth: 0,
                }}
              >
                <Typography
                  sx={{
                    ...DASHBOARD_UX.metricLabel,
                    color: s.textSecondary,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.label}
                </Typography>
                {item.icon}
              </Box>
              <Typography
                sx={{
                  ...metricValueSx(),
                  color: surface.fg,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {item.value}
              </Typography>
            </Box>
            );
          })}
        </Box>
      </Box>
    );
  }

  return (
    <DashboardSection title={t('dashboard.financial.title')}>
      {monthNav}
      {statusLine}
      <MetricRow
        columns={2}
        embedded
        minHeight={DASHBOARD_UX.paymentCardMinHeight}
        maxHeight={DASHBOARD_UX.paymentCardMaxHeight}
        items={items}
      />
    </DashboardSection>
  );
}
