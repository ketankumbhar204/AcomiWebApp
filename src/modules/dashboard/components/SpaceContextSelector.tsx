import { Box, MenuItem, Select, Stack, Typography, useTheme } from '@mui/material';
import { Building2, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { spaceDashboardPath } from '@/routes/paths';
import { colors } from '@/shared/theme/colors';
import { useSpaceStore } from '@/store/spaceStore';
import { DASHBOARD_UX, dashSurfaces } from '../theme/dashboardUx';

type SpaceContextSelectorProps = {
  spaceId: string;
  spaceName?: string;
  spaceType?: string;
  membershipRole?: string;
};

/**
 * Approved mock space selector — white card, 36px icon well, name + role.
 */
export function SpaceContextSelector({
  spaceId,
  spaceName,
  spaceType,
  membershipRole,
}: SpaceContextSelectorProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const mySpaces = useSpaceStore((state) => state.mySpaces);
  const switchSpace = useSpaceStore((state) => state.switchSpace);

  const subtitle =
    spaceType && membershipRole
      ? t('dashboard.shell.spaceSubtitle', { type: spaceType, role: membershipRole })
      : spaceType ?? '';

  const canSwitch = mySpaces.length > 1;

  return (
    <Stack
      direction="row"
      spacing={1.25}
      sx={{
        alignItems: 'center',
        minWidth: 0,
        height: 44,
        px: 1.25,
        py: 0.5,
        borderRadius: `${DASHBOARD_UX.radius}px`,
        border: `1px solid ${s.border}`,
        bgcolor: s.surface,
        boxShadow: s.shadow,
        maxWidth: '100%',
      }}
      aria-label={t('spaces.switcher.open')}
    >
      <Box
        sx={{
          width: DASHBOARD_UX.iconWell,
          height: DASHBOARD_UX.iconWell,
          borderRadius: `${DASHBOARD_UX.iconWellRadius}px`,
          bgcolor: theme.palette.mode === 'dark' ? s.elevated : colors.lightGreen,
          color: colors.primaryDark,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
        aria-hidden
      >
        <Building2 size={DASHBOARD_UX.iconSize} />
      </Box>

      {canSwitch ? (
        <Select
          variant="standard"
          disableUnderline
          value={spaceId}
          aria-label={t('spaces.switcher.open')}
          IconComponent={(props) => <ChevronDown size={16} {...props} />}
          onChange={(event) => {
            const nextId = String(event.target.value);
            void switchSpace(nextId).then(() => {
              navigate(spaceDashboardPath(nextId));
            });
          }}
          sx={{
            flex: 1,
            minWidth: 0,
            fontWeight: 700,
            fontSize: '0.875rem',
            color: s.textPrimary,
            '& .MuiSelect-select': {
              py: 0,
              pr: '28px !important',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 0.1,
            },
          }}
          renderValue={() => (
            <Box sx={{ minWidth: 0, maxWidth: '100%' }}>
              <Typography
                noWrap
                sx={{ ...DASHBOARD_UX.spaceName, fontSize: '0.875rem', lineHeight: 1.2, color: s.textPrimary }}
              >
                {spaceName ?? t('navigation.space')}
              </Typography>
              {subtitle ? (
                <Typography
                  noWrap
                  sx={{ ...DASHBOARD_UX.spaceRole, color: s.textMuted, lineHeight: 1.2 }}
                >
                  {subtitle}
                </Typography>
              ) : null}
            </Box>
          )}
        >
          {mySpaces.map((entry) => (
            <MenuItem key={entry.spaceId} value={entry.spaceId}>
              <Stack spacing={0} sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {entry.spaceName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('dashboard.shell.spaceSubtitle', {
                    type: entry.spaceType,
                    role: entry.membershipRole,
                  })}
                </Typography>
              </Stack>
            </MenuItem>
          ))}
        </Select>
      ) : (
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            noWrap
            sx={{ ...DASHBOARD_UX.spaceName, fontSize: '0.875rem', lineHeight: 1.2, color: s.textPrimary }}
          >
            {spaceName ?? t('navigation.space')}
          </Typography>
          {subtitle ? (
            <Typography
              noWrap
              sx={{ ...DASHBOARD_UX.spaceRole, color: s.textMuted, lineHeight: 1.2 }}
            >
              {subtitle}
            </Typography>
          ) : null}
        </Box>
      )}
    </Stack>
  );
}
