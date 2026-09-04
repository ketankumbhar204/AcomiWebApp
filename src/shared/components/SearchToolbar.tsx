import { Box, IconButton, InputAdornment, TextField, useTheme } from '@mui/material';
import { Search, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';

type SearchToolbarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  actions?: ReactNode;
  inputId?: string;
};

export function SearchToolbar({
  value,
  onChange,
  placeholder,
  actions,
  inputId,
}: SearchToolbarProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const resolvedPlaceholder = placeholder ?? t('common.searchPlaceholder');

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: `${DASHBOARD_UX.internalGap + 4}px`,
        flexWrap: 'wrap',
        width: '100%',
        minWidth: 0,
      }}
    >
      <TextField
        id={inputId}
        size="small"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={resolvedPlaceholder}
        sx={{
          width: '100%',
          minWidth: 0,
          flex: 1,
          '& .MuiOutlinedInput-root': {
            minHeight: DASHBOARD_UX.buttonHeight,
            height: DASHBOARD_UX.buttonHeight,
            borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
            bgcolor: s.surface,
            ...DASHBOARD_UX.inputText,
          },
        }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Search size={DASHBOARD_UX.iconSize} color={s.textMuted} />
              </InputAdornment>
            ),
            endAdornment: value ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  aria-label={t('common.clearSearch')}
                  onClick={() => onChange('')}
                >
                  <X size={DASHBOARD_UX.iconSize} />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          },
        }}
      />
      {actions}
    </Box>
  );
}
