import { Box, Typography, useTheme } from '@mui/material';
import { ChevronDown, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';
import type { MembershipRole } from '@/shared/types/space';
import { ROUTES } from '@/routes/paths';

type CustomerSidebarProfileProps = {
  displayName: string;
  role?: MembershipRole;
};

/** Profile footer for customer sidebar. */
export function CustomerSidebarProfile({ displayName, role }: CustomerSidebarProfileProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const navigate = useNavigate();

  const roleLabel =
    role === 'CUSTOMER'
      ? t('roles.customer', { defaultValue: 'Customer' })
      : role === 'TENANT'
        ? t('roles.tenant', { defaultValue: 'Tenant' })
        : t('navigation.profile');

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={() => navigate(ROUTES.profile)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(ROUTES.profile);
        }
      }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1,
        borderRadius: `${DASHBOARD_UX.tileRadius}px`,
        cursor: 'pointer',
        transition: DASHBOARD_UX.transition,
        '&:hover': { bgcolor: s.hover },
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          bgcolor: `${colors.primaryDark}18`,
          color: colors.primaryDark,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <UserRound size={16} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ ...DASHBOARD_UX.sidebarAccount, color: s.textPrimary }} noWrap>
          {displayName || t('navigation.profile')}
        </Typography>
        <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: s.textMuted }} noWrap>
          {roleLabel}
        </Typography>
      </Box>
      <ChevronDown size={14} color={s.textMuted} />
    </Box>
  );
}
