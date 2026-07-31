import {
  Box,
  Button,
  Chip,
  IconButton,
  LinearProgress,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import {
  AlertTriangle,
  Building2,
  Home,
  Hotel,
  LogOut,
  MapPin,
  MoreVertical,
  Pencil,
  Star,
  Trash2,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import { useState, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import type { MembershipRole, MySpaceResponse, SpaceType } from '@/shared/types/space';

export const SPACE_CARD_COMPACT_WIDTH = { min: 360, max: 420 } as const;

const SOFT_CHIP = {
  success: { bgcolor: colors.lightGreen, color: colors.success },
  info: { bgcolor: '#DBEAFE', color: '#2563EB' },
  warning: { bgcolor: '#FEF3C7', color: colors.warning },
  neutral: { bgcolor: '#F1F5F9', color: colors.textSecondary },
} as const;

function typeLabelKey(type: string): string {
  if (type === 'CO_LIVING') return 'spaces.types.coLiving.label';
  return `spaces.types.${type.toLowerCase()}.label`;
}

export function spaceTypeIcon(type: SpaceType): LucideIcon {
  switch (type) {
    case 'PG':
      return Building2;
    case 'MESS':
      return UtensilsCrossed;
    case 'HOSTEL':
      return Hotel;
    case 'RENTAL':
      return Home;
    case 'CO_LIVING':
    default:
      return Building2;
  }
}

function statusForRole(
  role: MembershipRole,
  t: (key: string) => string,
): { label: string; tone: keyof typeof SOFT_CHIP } {
  if (role === 'OWNER' || role === 'MANAGER') {
    return { label: t('spaces.details.active'), tone: 'success' };
  }
  if (role === 'STAFF') {
    return { label: t(`spaces.roles.${role}`), tone: 'neutral' };
  }
  return { label: t('spaces.mySpaces.memberBadge'), tone: 'info' };
}

const actionBtnSx = {
  ...dashOutlinedButtonSx,
  minHeight: DASHBOARD_UX.buttonHeight,
  height: DASHBOARD_UX.buttonHeight,
  px: 1.25,
  flex: '0 0 auto',
} as const;

export type SpaceCardCompactProps = {
  space: MySpaceResponse;
  layout?: 'grid' | 'list';
  /** Presentation stand-in until bed capacity ships on My Spaces API. */
  capacityUsed: number;
  capacityTotal: number;
  onOpenDashboard: () => void;
  onOpenDetails: () => void;
  onSetDefault?: () => void;
  onEdit?: () => void;
};

/**
 * Dense Dashboard-language space card (~360–420px).
 * Reuse for My Spaces, switcher, invitations, join/search results.
 */
export function SpaceCardCompact({
  space,
  layout = 'grid',
  capacityUsed,
  capacityTotal,
  onOpenDashboard,
  onOpenDetails,
  onSetDefault,
  onEdit,
}: SpaceCardCompactProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const TypeIcon = spaceTypeIcon(space.spaceType);
  const status = statusForRole(space.membershipRole, t);
  const soft = SOFT_CHIP[status.tone];
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const canEdit = space.membershipRole === 'OWNER' || space.membershipRole === 'MANAGER';
  const total = Math.max(capacityTotal, 1);
  const used = Math.max(0, capacityUsed);
  const pct = Math.min(100, Math.round((used / total) * 100));
  const list = layout === 'list';

  const openMenu = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  };

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onOpenDashboard}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenDashboard();
        }
      }}
      aria-label={`${t('spaces.details.openDashboard')}: ${space.spaceName}`}
      sx={{
        width: '100%',
        maxWidth: list ? '100%' : SPACE_CARD_COMPACT_WIDTH.max,
        minWidth: 0,
        height: '100%',
        outline: 'none',
        cursor: 'pointer',
        borderRadius: `${DASHBOARD_UX.radius}px`,
        border: `1px solid ${s.border}`,
        bgcolor: s.surface,
        boxShadow: s.shadow,
        transition: 'box-shadow 160ms ease, transform 160ms ease',
        display: 'flex',
        flexDirection: list ? { xs: 'column', sm: 'row' } : 'column',
        gap: `${DASHBOARD_UX.internalGap}px`,
        p: `${DASHBOARD_UX.metricPadding}px`,
        boxSizing: 'border-box',
        '&:hover': {
          boxShadow: s.shadowHover,
          transform: 'translateY(-1px)',
        },
        '&:focus-visible': {
          boxShadow: `0 0 0 2px ${colors.primaryDark}`,
        },
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, minWidth: 0 }}>
          <Box
            sx={{
              width: DASHBOARD_UX.iconWell,
              height: DASHBOARD_UX.iconWell,
              borderRadius: `${DASHBOARD_UX.iconWellRadius}px`,
              bgcolor: theme.palette.mode === 'dark' ? s.elevated : `${colors.primaryDark}14`,
              color: colors.primaryDark,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              mt: 0.15,
              '& svg': {
                width: DASHBOARD_UX.iconSize,
                height: DASHBOARD_UX.iconSize,
                strokeWidth: 1.75,
              },
            }}
            aria-hidden
          >
            <TypeIcon />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75 }}>
              <Typography
                sx={{
                  ...DASHBOARD_UX.spaceName,
                  fontWeight: 700,
                  color: s.textPrimary,
                  flex: 1,
                  minWidth: 0,
                }}
                noWrap
              >
                {space.spaceName}
              </Typography>
              <Chip
                size="small"
                label={status.label}
                sx={{
                  height: 18,
                  borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                  ...DASHBOARD_UX.badge,
                  fontSize: DASHBOARD_UX.badge.fontSize,
                  bgcolor: soft.bgcolor,
                  color: soft.color,
                  border: 'none',
                  flexShrink: 0,
                  '& .MuiChip-label': { px: 0.6, color: soft.color },
                }}
              />
            </Box>
            <Typography
              sx={{ ...DASHBOARD_UX.spaceRole, color: s.textSecondary, mt: 0.15 }}
              noWrap
            >
              {t(typeLabelKey(space.spaceType))} · {t(`spaces.roles.${space.membershipRole}`)}
            </Typography>
          </Box>
        </Box>

        {/* Address */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, pl: 0.25 }}>
          <MapPin size={12} color={s.textMuted} strokeWidth={1.75} aria-hidden />
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted }} noWrap>
            {space.address?.trim() || t('spaces.details.notProvided')}
          </Typography>
        </Box>

        {/* Capacity then thin progress */}
        <Box sx={{ mt: 0.25 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              mb: 0.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
              <Users size={12} color={s.textMuted} strokeWidth={1.75} aria-hidden />
              <Typography
                sx={{
                  ...DASHBOARD_UX.metricCaption,
                  color: s.textSecondary,
                  fontVariantNumeric: 'tabular-nums',
                }}
                noWrap
              >
                {t('spaces.mySpaces.utilizationCapacity', {
                  used,
                  total,
                })}
              </Typography>
            </Box>
            <Typography
              sx={{
                ...DASHBOARD_UX.metricCaption,
                color: s.textMuted,
                fontVariantNumeric: 'tabular-nums',
                flexShrink: 0,
              }}
            >
              {`${pct}%`}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={pct}
            aria-label={t('spaces.mySpaces.utilization')}
            sx={{
              height: 4,
              borderRadius: 99,
              bgcolor: theme.palette.mode === 'dark' ? s.elevated : '#E7EBF0',
              '& .MuiLinearProgress-bar': {
                borderRadius: 99,
                bgcolor: colors.primaryDark,
              },
            }}
          />
        </Box>
      </Box>

      {/* Actions — Dashboard 32px, auto width */}
      <Stack
        direction="row"
        spacing={0.75}
        useFlexGap
        sx={{
          alignItems: 'center',
          flexShrink: 0,
          alignSelf: list ? { sm: 'center' } : 'stretch',
          mt: list ? 0 : 'auto',
        }}
      >
        <Button
          variant="contained"
          color="primary"
          onClick={(event) => {
            event.stopPropagation();
            onOpenDashboard();
          }}
          aria-label={`${t('spaces.details.openDashboard')}: ${space.spaceName}`}
          sx={{
            ...dashContainedButtonSx,
            ...actionBtnSx,
            bgcolor: colors.primaryDark,
            color: '#fff',
            '&:hover': { bgcolor: colors.primaryHover },
          }}
        >
          {t('spaces.mySpaces.openDashboardShort')}
        </Button>
        <Button
          variant="outlined"
          color="primary"
          onClick={(event) => {
            event.stopPropagation();
            onOpenDetails();
          }}
          aria-label={`${t('navigation.spaceDetails')}: ${space.spaceName}`}
          sx={{
            ...actionBtnSx,
            color: colors.primaryDark,
            borderColor: colors.primaryDark,
            '&:hover': {
              borderColor: colors.primaryDark,
              bgcolor: `${colors.primaryDark}0F`,
            },
          }}
        >
          {t('spaces.mySpaces.spaceDetailsShort')}
        </Button>
        <IconButton
          size="small"
          onClick={openMenu}
          aria-label={t('spaces.mySpaces.moreActions', { name: space.spaceName })}
          aria-haspopup="menu"
          aria-expanded={Boolean(menuAnchor)}
          sx={{
            border: `1px solid ${s.border}`,
            borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
            width: DASHBOARD_UX.buttonHeight,
            height: DASHBOARD_UX.buttonHeight,
            minWidth: DASHBOARD_UX.buttonHeight,
            flexShrink: 0,
            color: s.textSecondary,
            ml: 'auto',
          }}
        >
          <MoreVertical size={14} />
        </IconButton>
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          {onSetDefault ? (
            <MenuItem
              disabled={space.isDefault}
              onClick={() => {
                setMenuAnchor(null);
                onSetDefault();
              }}
            >
              <ListItemIcon>
                <Star size={14} />
              </ListItemIcon>
              <ListItemText>
                {space.isDefault
                  ? t('spaces.mySpaces.defaultBadge')
                  : t('spaces.mySpaces.setDefault')}
              </ListItemText>
            </MenuItem>
          ) : null}
          {canEdit && onEdit ? (
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                onEdit();
              }}
            >
              <ListItemIcon>
                <Pencil size={14} />
              </ListItemIcon>
              <ListItemText>{t('common.edit')}</ListItemText>
            </MenuItem>
          ) : null}
          <MenuItem disabled>
            <ListItemIcon>
              <LogOut size={14} />
            </ListItemIcon>
            <ListItemText>{t('spaces.mySpaces.menuLeave')}</ListItemText>
          </MenuItem>
          <MenuItem disabled>
            <ListItemIcon>
              <AlertTriangle size={14} />
            </ListItemIcon>
            <ListItemText>{t('spaces.mySpaces.menuDeactivate')}</ListItemText>
          </MenuItem>
          <MenuItem disabled>
            <ListItemIcon>
              <Trash2 size={14} />
            </ListItemIcon>
            <ListItemText>{t('spaces.mySpaces.menuDelete')}</ListItemText>
          </MenuItem>
        </Menu>
      </Stack>
    </Box>
  );
}
