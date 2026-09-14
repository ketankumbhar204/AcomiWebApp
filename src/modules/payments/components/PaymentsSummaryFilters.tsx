import { Box, CircularProgress, Typography, useTheme } from '@mui/material';
import {
  AlertTriangle,
  ChevronRight,
  Clock,
  CreditCard,
  FileText,
  type LucideIcon,
} from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import type { DashboardFinancialSummary } from '@/shared/types/dashboard';
import { formatCurrency } from '@/shared/utils/dashboardFinancial';

export type PaymentSummaryFilter = 'all' | 'collected' | 'underReview' | 'pending';

export type PaymentsOwnerFilter = PaymentSummaryFilter | 'history';

/** Pastel fill + matching accent (icons/labels) — mirrors mobile. */
const CARD_THEME = {
  expected: {
    accent: '#16A34A',
    background: '#ECFDF5',
    iconBg: '#D1FAE5',
    border: '#A7F3D0',
  },
  collected: {
    accent: '#2563EB',
    background: '#EFF6FF',
    iconBg: '#DBEAFE',
    border: '#BFDBFE',
  },
  underReview: {
    accent: '#7C3AED',
    background: '#F5F3FF',
    iconBg: '#EDE9FE',
    border: '#DDD6FE',
  },
  pending: {
    accent: '#EA580C',
    background: '#FFF7ED',
    iconBg: '#FFEDD5',
    border: '#FED7AA',
  },
} as const;

type CardTheme = (typeof CARD_THEME)[keyof typeof CARD_THEME];

type FilterDef = {
  id: PaymentSummaryFilter;
  labelKey: string;
  icon: LucideIcon;
  theme: CardTheme;
  amount: number | null | undefined;
};

type PaymentsSummaryFiltersProps = {
  loading: boolean;
  financial: DashboardFinancialSummary | null | undefined;
  activeFilter: PaymentsOwnerFilter;
  onFilterPress: (filter: PaymentSummaryFilter) => void;
};

type SummaryCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  theme: CardTheme;
  selected: boolean;
  onPress: () => void;
};

/**
 * One horizontal row per card: [icon] | label + amount (stacked) | >
 */
function SummaryCard({ label, value, icon: Icon, theme, selected, onPress }: SummaryCardProps) {
  const themeMui = useTheme();
  const s = dashSurfaces(themeMui.palette.mode);

  return (
    <Box
      component="button"
      type="button"
      onClick={onPress}
      aria-pressed={selected}
      aria-label={`${label}: ${value}`}
      sx={{
        width: '100%',
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        borderRadius: '16px',
        border: selected ? `1.5px solid ${theme.accent}` : `1px solid ${theme.border}`,
        bgcolor: theme.background,
        px: 1.25,
        py: 1.5,
        cursor: 'pointer',
        textAlign: 'left',
        font: 'inherit',
        transition: DASHBOARD_UX.transition,
        '&:hover': { opacity: 0.94 },
        '&:focus-visible': {
          outline: `2px solid ${theme.accent}`,
          outlineOffset: 2,
        },
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '10px',
          bgcolor: theme.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={16} color={theme.accent} strokeWidth={2.2} aria-hidden />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        <Typography
          sx={{
            ...DASHBOARD_UX.badge,
            fontSize: 12,
            lineHeight: '16px',
            fontWeight: 700,
            color: theme.accent,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            ...DASHBOARD_UX.link,
            fontSize: 15,
            lineHeight: '20px',
            fontWeight: 800,
            color: s.textPrimary,
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {value}
        </Typography>
      </Box>
      <ChevronRight size={16} color="#9CA3AF" strokeWidth={2.2} aria-hidden />
    </Box>
  );
}

export function PaymentsSummaryFilters({
  loading,
  financial,
  activeFilter,
  onFilterPress,
}: PaymentsSummaryFiltersProps) {
  const { t } = useTranslation();
  const currencyCode = financial?.currencyCode ?? 'INR';

  const filters = useMemo<FilterDef[]>(
    () => [
      {
        id: 'all',
        labelKey: 'dashboard.financial.expected',
        icon: FileText,
        theme: CARD_THEME.expected,
        amount: financial?.expectedCharges,
      },
      {
        id: 'collected',
        labelKey: 'dashboard.financial.collected',
        icon: CreditCard,
        theme: CARD_THEME.collected,
        amount: financial?.collected,
      },
      {
        id: 'underReview',
        labelKey: 'dashboard.financial.underReview',
        icon: Clock,
        theme: CARD_THEME.underReview,
        amount: financial?.underReview,
      },
      {
        id: 'pending',
        labelKey: 'dashboard.financial.pending',
        icon: AlertTriangle,
        theme: CARD_THEME.pending,
        amount: financial?.pending,
      },
    ],
    [financial?.collected, financial?.expectedCharges, financial?.pending, financial?.underReview],
  );

  if (loading && !financial) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr 1fr',
          md: 'repeat(4, minmax(0, 1fr))',
        },
        gap: 1,
        width: '100%',
      }}
    >
      {filters.map((filter) => (
        <SummaryCard
          key={filter.id}
          label={t(filter.labelKey)}
          value={formatCurrency(filter.amount ?? null, currencyCode)}
          icon={filter.icon}
          theme={filter.theme}
          selected={activeFilter === filter.id}
          onPress={() => onFilterPress(filter.id)}
        />
      ))}
    </Box>
  );
}
