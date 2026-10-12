import { Box, Stack, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { formatPricingMoney } from '../utils/commitBedPricing';

type BedPricingDisplayProps = {
  rent?: number | null;
  deposit?: number | null;
  layout?: 'columns' | 'rows';
};

export function BedPricingDisplay({ rent, deposit, layout = 'columns' }: BedPricingDisplayProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const notSet = t('accommodation.pricingConfirm.notSet', { defaultValue: 'Not set' });

  if (layout === 'rows') {
    return (
      <Stack
        spacing={0.5}
        aria-label={`${t('accommodation.fields.rent', { defaultValue: 'Rent' })} ${formatPricingMoney(rent, notSet)}, ${t('accommodation.fields.deposit', { defaultValue: 'Deposit' })} ${formatPricingMoney(deposit, notSet)}`}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: s.textSecondary }}>
            {t('accommodation.fields.rent', { defaultValue: 'Rent' })}
          </Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 800, color: s.textPrimary, fontVariantNumeric: 'tabular-nums' }}>
            {formatPricingMoney(rent, notSet)}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: s.textSecondary }}>
            {t('accommodation.fields.deposit', { defaultValue: 'Deposit' })}
          </Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 800, color: s.textPrimary, fontVariantNumeric: 'tabular-nums' }}>
            {formatPricingMoney(deposit, notSet)}
          </Typography>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        px: 1,
        py: 1,
        borderRadius: 1.5,
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(15,23,42,0.35)' : 'rgba(255,255,255,0.72)',
        border: `1px solid ${theme.palette.mode === 'dark' ? s.border : 'rgba(255,255,255,0.9)'}`,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 11, fontWeight: 600, color: s.textMuted, mb: 0.35 }}>
          {t('accommodation.setup.fields.rent')}
        </Typography>
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: s.textPrimary }} noWrap>
          {formatPricingMoney(rent, notSet)}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 11, fontWeight: 600, color: s.textMuted, mb: 0.35 }}>
          {t('accommodation.setup.fields.deposit')}
        </Typography>
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: s.textPrimary }} noWrap>
          {formatPricingMoney(deposit, notSet)}
        </Typography>
      </Box>
    </Stack>
  );
}
