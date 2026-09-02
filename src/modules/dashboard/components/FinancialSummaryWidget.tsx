import { Box, Typography, useTheme } from '@mui/material';
import { Clock, Inbox, IndianRupee, Wallet } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { DashboardFinancialSummary } from '@/shared/types/dashboard';
import { formatCurrency } from '@/shared/utils/dashboardFinancial';
import { spacePaymentsPath } from '@/routes/paths';
import { colors } from '@/shared/theme/colors';
import { semanticSurface, type SemanticTone } from '@/shared/theme/semantic';
import { DashboardSection } from './DashboardSection';
import { IconBadge } from './IconBadge';
import { MetricRow } from './MetricRow';
import { DASHBOARD_UX, dashSurfaces, metricValueSx } from '../theme/dashboardUx';

type FinancialSummaryWidgetProps = {
  spaceId: string;
  financial: DashboardFinancialSummary;
  emptyHint?: string;
  /** Mess: 4 separate cards in one row. PG: 2×2 board. */
  layout?: 'board' | 'row';
};

type PayMetric = {
  id: string;
  label: string;
  value: string;
  accent: string;
  tone: SemanticTone;
  icon: ReactNode;
  onClick: () => void;
};

/** Payment Summary — 2×2 board (PG) or 4 cards in a row (Mess). */
export function FinancialSummaryWidget({
  spaceId,
  financial,
  layout = 'board',
}: FinancialSummaryWidgetProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const currency = financial.currencyCode || 'INR';

  const items: PayMetric[] = [
    {
      id: 'expected',
      label: t('dashboard.financial.expected'),
      value: formatCurrency(financial.expectedCharges, currency),
      accent: colors.primaryDark,
      tone: 'accent',
      icon: (
        <IconBadge tone="accent">
          <Wallet />
        </IconBadge>
      ),
      onClick: () => navigate(spacePaymentsPath(spaceId, undefined, { tab: 'members' })),
    },
    {
      id: 'collected',
      label: t('dashboard.financial.collected'),
      value: formatCurrency(financial.collected, currency),
      accent: colors.success,
      tone: 'success',
      icon: (
        <IconBadge tone="success">
          <Inbox />
        </IconBadge>
      ),
      onClick: () => navigate(spacePaymentsPath(spaceId, undefined, { tab: 'history' })),
    },
    {
      id: 'underReview',
      label: t('dashboard.financial.underReview'),
      value: formatCurrency(financial.underReview, currency),
      accent: '#3B82F6',
      tone: 'info',
      icon: (
        <IconBadge tone="info">
          <Clock />
        </IconBadge>
      ),
      onClick: () => navigate(spacePaymentsPath(spaceId, undefined, { tab: 'review' })),
    },
    {
      id: 'pending',
      label: t('dashboard.financial.pending'),
      value: formatCurrency(financial.pending, currency),
      accent: '#F59E0B',
      tone: 'warning',
      icon: (
        <IconBadge tone="warning">
          <IndianRupee />
        </IconBadge>
      ),
      onClick: () => navigate(spacePaymentsPath(spaceId, undefined, { tab: 'members' })),
    },
  ];

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
          <Typography sx={{ ...DASHBOARD_UX.sectionSubtitle, color: s.textMuted }}>
            {t('dashboard.financial.period')}
          </Typography>
        </Box>

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
            const surface = semanticSurface(item.tone, theme.palette.mode);
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
    <DashboardSection
      title={t('dashboard.financial.title')}
      subtitle={t('dashboard.financial.period')}
    >
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
