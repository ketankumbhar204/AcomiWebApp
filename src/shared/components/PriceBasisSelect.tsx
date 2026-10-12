import { MenuItem, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { ListingPriceBasis } from '@/shared/types/space';
import { PRICE_BASIS_LABEL, PRICE_BASIS_OPTIONS } from '@/shared/utils/priceBasis';

type PriceBasisSelectProps = {
  value: ListingPriceBasis;
  onChange: (value: ListingPriceBasis) => void;
};

export function PriceBasisSelect({ value, onChange }: PriceBasisSelectProps) {
  const { t } = useTranslation();
  return (
    <TextField
      select
      label={t('spaces.findPlace.pricingUnit', { defaultValue: 'Pricing unit' })}
      value={value}
      onChange={(event) => onChange(event.target.value as ListingPriceBasis)}
      size="small"
      sx={{ minWidth: { xs: '100%', sm: 180 }, flexShrink: 0 }}
    >
      {PRICE_BASIS_OPTIONS.map((option) => (
        <MenuItem key={option} value={option}>
          {t(`spaces.findPlace.priceBasis.${option}`, { defaultValue: PRICE_BASIS_LABEL[option] })}
        </MenuItem>
      ))}
    </TextField>
  );
}
