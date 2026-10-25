import { Box, FormControlLabel, Switch, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { colors } from '@/shared/theme/colors';

type AdminTestLeadToggleProps = {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
};

/** Yes/No switch for the Test lead row on a lead detail page. */
export function AdminTestLeadToggle({ checked, disabled = false, onChange }: AdminTestLeadToggleProps) {
  const { t } = useTranslation();

  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          color: colors.textSecondary,
          fontWeight: 600,
          letterSpacing: 0.2,
          mb: 0.25,
        }}
      >
        {t('admin.common.testLead')}
      </Typography>
      <FormControlLabel
        sx={{ m: 0, alignItems: 'center' }}
        control={
          <Switch
            size="small"
            checked={checked}
            disabled={disabled}
            onChange={(event) => onChange(event.target.checked)}
            inputProps={{ 'aria-label': t('admin.common.testLead') }}
          />
        }
        label={
          <Typography variant="body2" sx={{ color: colors.textPrimary, fontWeight: 600 }}>
            {checked ? t('admin.common.yes') : t('admin.common.no')}
          </Typography>
        }
      />
    </Box>
  );
}
