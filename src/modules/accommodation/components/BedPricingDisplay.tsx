import { Box, Stack, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { formatPricingMoney } from '../utils/commitBedPricing';

type BedPricingDisplayProps = {
  rent?: number | null;
  deposit?: number | null;
};

export function BedPricingDisplay({ rent, deposit }: BedPricingDisplayProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const notSet = t('accommodation.pricingConfirm.notSet', { defaultValue: 'Not set' });

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
