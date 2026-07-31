import { Box, IconButton, InputAdornment, TextField, useTheme } from '@mui/material';
import { Search, X } from 'lucide-react';
import type { ReactNode } from 'react';
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
  placeholder = 'Search…',
  actions,
  inputId,
}: SearchToolbarProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: `${DASHBOARD_UX.internalGap + 4}px`,
        flexWrap: 'wrap',
      }}
    >
      <TextField
        id={inputId}
        size="small"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        sx={{
          minWidth: { xs: '100%', sm: 280 },
          flex: 1,
          '& .MuiOutlinedInput-root': {
            minHeight: DASHBOARD_UX.buttonHeight,
            height: DASHBOARD_UX.buttonHeight,
            borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
            bgcolor: s.surface,
            fontSize: DASHBOARD_UX.body.fontSize,
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
                <IconButton size="small" aria-label="Clear search" onClick={() => onChange('')}>
                  <X size={14} />
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
