import { Box, InputAdornment, Stack, TextField, Typography, useTheme } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { parseOptionalMoney, type PricingField } from '../setup-preview/setupPricingAutofill';

type BedCardPricingFieldsProps = {
  rent?: number | null;
  deposit?: number | null;
  disabled?: boolean;
  onCommit: (field: PricingField, value: number | null) => Promise<void> | void;
};

function moneyText(value: number | null | undefined): string {
  return value == null ? '' : String(value);
}

export function BedCardPricingFields({
  rent,
  deposit,
  disabled = false,
  onCommit,
}: BedCardPricingFieldsProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const [rentEdit, setRentEdit] = useState<string | null>(null);
  const [depositEdit, setDepositEdit] = useState<string | null>(null);
  const rentText = rentEdit ?? moneyText(rent);
  const depositText = depositEdit ?? moneyText(deposit);

  async function commit(field: PricingField, raw: string, current: number | null | undefined) {
    const parsed = parseOptionalMoney(raw);
    const existing = current ?? null;
    if (field === 'defaultRent') {
      setRentEdit(null);
    } else {
      setDepositEdit(null);
    }
    if (parsed === existing) {
      return;
    }
    await onCommit(field, parsed);
  }

  return (
    <Stack
      direction="row"
      spacing={0.75}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      sx={{ mt: 0.5 }}
    >
      <MoneyField
        label={t('accommodation.setup.fields.rent')}
        value={rentText}
        disabled={disabled}
        placeholder={t('accommodation.setup.enterRent')}
        onChangeText={setRentEdit}
        onBlur={() => void commit('defaultRent', rentText, rent)}
        mutedColor={s.textSecondary}
      />
      <MoneyField
        label={t('accommodation.setup.fields.deposit')}
        value={depositText}
        disabled={disabled}
        placeholder={t('accommodation.setup.enterDeposit')}
        onChangeText={setDepositEdit}
        onBlur={() => void commit('defaultDeposit', depositText, deposit)}
        mutedColor={s.textSecondary}
      />
    </Stack>
  );
}

function MoneyField({
  label,
  value,
  disabled,
  placeholder,
  onChangeText,
  onBlur,
  mutedColor,
}: {
  label: string;
  value: string;
  disabled: boolean;
  placeholder: string;
  onChangeText: (value: string) => void;
  onBlur: () => void;
  mutedColor: string;
}) {
  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ ...DASHBOARD_UX.caption, color: mutedColor, mb: 0.25 }}>{label}</Typography>
      <TextField
        size="small"
        type="number"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChangeText(event.target.value)}
        onBlur={onBlur}
        fullWidth
        slotProps={{
          htmlInput: { min: 0, step: 1, 'aria-label': label },
          input: {
            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
          },
        }}
        sx={{
          '& .MuiInputBase-root': { height: 32, fontSize: '0.8125rem' },
          '& input[type=number]': { MozAppearance: 'textfield' },
          '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
            WebkitAppearance: 'none',
            margin: 0,
          },
        }}
      />
    </Box>
  );
}
