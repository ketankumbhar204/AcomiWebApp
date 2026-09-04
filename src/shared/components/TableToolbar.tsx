import { Box, Typography, useTheme } from '@mui/material';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';
import { SearchToolbar } from './SearchToolbar';

type TableToolbarProps = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchInputId?: string;
  selectedCount?: number;
  bulkActions?: ReactNode;
  actions?: ReactNode;
  filters?: ReactNode;
};

export function TableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchInputId,
  selectedCount = 0,
  bulkActions,
  actions,
  filters,
}: TableToolbarProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${DASHBOARD_UX.cardGap}px` }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          flexWrap: 'wrap',
          rowGap: 1,
        }}
      >
        {onSearchChange ? (
          <Box
            sx={{
              flex: '1 1 240px',
              maxWidth: { xs: '100%', sm: 360 },
              minWidth: { xs: '100%', sm: 200 },
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            <SearchToolbar
              value={searchValue ?? ''}
              onChange={onSearchChange}
              placeholder={searchPlaceholder}
              inputId={searchInputId}
            />
          </Box>
        ) : null}
        {filters ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
              flex: '1 1 auto',
              minWidth: 0,
            }}
          >
            {filters}
          </Box>
        ) : null}
        {!onSearchChange && !filters ? <Box sx={{ flex: 1 }} /> : null}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
            flexShrink: 0,
            ml: { sm: 'auto' },
          }}
        >
          {actions}
        </Box>
      </Box>
      {selectedCount > 0 ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            px: `${DASHBOARD_UX.metricPadding}px`,
            py: 1,
            borderRadius: `${DASHBOARD_UX.tileRadius}px`,
            border: `1px solid ${colors.primaryDark}33`,
            bgcolor: theme.palette.mode === 'dark' ? s.elevated : colors.lightGreen,
          }}
        >
          <Typography sx={{ ...DASHBOARD_UX.link, color: colors.primaryDark }}>
            {t('common.selectedCount', { count: selectedCount })}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>{bulkActions}</Box>
        </Box>
      ) : null}
    </Box>
  );
}
