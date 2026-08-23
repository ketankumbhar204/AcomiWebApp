import {
  Badge,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { UserRound } from 'lucide-react';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { APP_NAME } from '@/shared/constants/app';
import { colors } from '@/shared/theme/colors';
import { LAYOUT } from './layoutConstants';
import type { AppNavSection } from './navTypes';

type AppSidebarProps = {
  sections?: AppNavSection[];
  panel?: React.ReactNode;
  footer?: React.ReactNode;
  variant: 'permanent' | 'temporary';
  open: boolean;
  onClose?: () => void;
};

function BrandMark({ collapsed }: { collapsed: boolean }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        minWidth: 0,
        justifyContent: collapsed ? 'center' : 'flex-start',
        width: '100%',
        px: collapsed ? 0 : 0.5,
      }}
    >
      <Box
        aria-hidden
        sx={{
          width: 32,
          height: 32,
          borderRadius: '10px',
          bgcolor: colors.primaryDark,
          color: '#fff',
          display: 'grid',
          placeItems: 'center',
          fontWeight: 800,
          fontSize: '0.95rem',
          letterSpacing: '-0.04em',
          flexShrink: 0,
        }}
      >
        A
      </Box>
      {!collapsed ? (
        <Typography
          sx={{
            ...DASHBOARD_UX.spaceName,
            color: 'primary.dark',
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
          }}
        >
          {APP_NAME}
        </Typography>
      ) : null}
    </Box>
  );
}

function SidebarBody({
  sections,
  panel,
  footer,
  collapsed,
  onNavigate,
}: {
  sections: AppNavSection[];
  panel?: React.ReactNode;
  footer?: React.ReactNode;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
      <Toolbar
        sx={{
          px: collapsed ? 1 : 1.5,
          gap: 1,
          minHeight: LAYOUT.headerHeight,
          flexShrink: 0,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <BrandMark collapsed={collapsed} />
      </Toolbar>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          px: 1,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {sections.map((section) => (
          <Box key={section.id} sx={{ mb: 1.5 }}>
            {section.label && !collapsed ? (
              <Typography
                sx={{
                  ...DASHBOARD_UX.sidebarSection,
                  px: 1.5,
                  mb: 0.5,
                  color: s.textMuted,
                  display: 'block',
                }}
              >
                {section.label}
              </Typography>
            ) : null}
            <List dense disablePadding>
              {section.items.map((item) => {
                const itemButton = (
                  <ListItemButton
                    component={NavLink}
                    to={item.to}
                    disabled={item.disabled}
                    onClick={onNavigate}
                    sx={{
                      borderRadius: 1.5,
                      mb: 0.2,
                      py: 0,
                      minHeight: DASHBOARD_UX.navRowHeight,
                      px: collapsed ? 1 : 1.25,
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      position: 'relative',
                      '&.active': {
                        bgcolor: 'rgba(18, 140, 126, 0.12)',
                        color: 'primary.dark',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          top: 8,
                          bottom: 8,
                          width: 3,
                          borderRadius: '0 2px 2px 0',
                          bgcolor: 'primary.dark',
                        },
                        '& .MuiListItemIcon-root': { color: 'primary.dark' },
                        '& .MuiListItemText-primary': { ...DASHBOARD_UX.sidebarAccount },
                      },
                    }}
                  >
                    {item.icon ? (
                      <ListItemIcon
                        sx={{
                          minWidth: collapsed ? 0 : 32,
                          color: 'text.secondary',
                          justifyContent: 'center',
                          overflow: 'visible',
                          '& svg': {
                            width: DASHBOARD_UX.iconSize,
                            height: DASHBOARD_UX.iconSize,
                          },
                        }}
                      >
                        <Badge
                          color="error"
                          badgeContent={item.badgeCount ?? 0}
                          invisible={!item.badgeCount}
                          sx={{
                            '& .MuiBadge-badge': {
                              minWidth: DASHBOARD_UX.badgeSize,
                              height: DASHBOARD_UX.badgeSize,
                              ...DASHBOARD_UX.badge,
                            },
                          }}
                        >
                          {item.icon}
                        </Badge>
                      </ListItemIcon>
                    ) : null}
                    {!collapsed ? (
                      <ListItemText
                        primary={item.label}
                        slotProps={{
                          primary: {
                            sx: {
                              ...DASHBOARD_UX.sidebar,
                              color: 'inherit',
                              whiteSpace: 'nowrap',
                            },
                          },
                        }}
                      />
                    ) : null}
                  </ListItemButton>
                );

                if (collapsed) {
                  return (
                    <Tooltip key={item.id} title={item.label} placement="right">
                      <Box component="span" sx={{ display: 'block' }}>
                        {itemButton}
                      </Box>
                    </Tooltip>
                  );
                }

                return <Box key={item.id}>{itemButton}</Box>;
              })}
            </List>
          </Box>
        ))}
      </Box>

      {!collapsed && panel ? <Box sx={{ flexShrink: 0, px: 0.5 }}>{panel}</Box> : null}

      {footer ? (
        collapsed ? (
          <Box
            sx={{
              py: 1.25,
              display: 'flex',
              justifyContent: 'center',
              borderTop: 1,
              borderColor: 'divider',
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: `${colors.primaryDark}18`,
                color: colors.primaryDark,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <UserRound size={16} />
            </Box>
          </Box>
        ) : (
          <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', flexShrink: 0 }}>{footer}</Box>
        )
      ) : null}
    </Box>
  );
}

export function AppSidebar({
  sections = [],
  panel,
  footer,
  variant,
  open,
  onClose,
}: AppSidebarProps) {
  const theme = useTheme();
  const isHoverExpand = useMediaQuery(theme.breakpoints.up('lg'), { noSsr: true });
  const [hovered, setHovered] = useState(false);
  const [tabletExpanded, setTabletExpanded] = useState(false);

  useEffect(() => {
    if (isHoverExpand) {
      setTabletExpanded(false);
    }
  }, [isHoverExpand]);

  if (variant === 'temporary') {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: LAYOUT.sidebarWidth,
            boxSizing: 'border-box',
            height: '100%',
            overflow: 'hidden',
          },
        }}
      >
        <SidebarBody
          sections={sections}
          panel={panel}
          footer={footer}
          collapsed={false}
          onNavigate={onClose}
        />
      </Drawer>
    );
  }

  const expanded = isHoverExpand ? hovered : tabletExpanded;
  const paperWidth = expanded ? LAYOUT.sidebarWidth : LAYOUT.sidebarCollapsedWidth;
  const transition = `width ${LAYOUT.sidebarTransitionMs}ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow ${LAYOUT.sidebarTransitionMs}ms ease`;

  return (
    <>
      {!isHoverExpand && tabletExpanded ? (
        <Box
          aria-hidden
          onClick={() => setTabletExpanded(false)}
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: (z) => z.zIndex.drawer - 1,
            bgcolor: 'rgba(15, 23, 42, 0.18)',
            display: { xs: 'none', md: 'block', lg: 'none' },
          }}
        />
      ) : null}
      <Drawer
        variant="permanent"
        open
        onMouseEnter={() => {
          if (isHoverExpand) setHovered(true);
        }}
        onMouseLeave={() => {
          if (isHoverExpand) setHovered(false);
        }}
        onFocus={() => {
          if (isHoverExpand) setHovered(true);
        }}
        onBlur={(event) => {
          if (isHoverExpand && !event.currentTarget.contains(event.relatedTarget as Node)) {
            setHovered(false);
          }
        }}
        onClick={() => {
          if (!isHoverExpand && !tabletExpanded) {
            setTabletExpanded(true);
          }
        }}
        sx={{
          display: { xs: 'none', md: 'block' },
          width: LAYOUT.sidebarCollapsedWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: paperWidth,
            borderRight: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            position: 'fixed',
            left: 0,
            top: 0,
            height: '100vh',
            maxHeight: '100vh',
            overflow: 'hidden',
            transition,
            boxShadow: expanded ? '8px 0 28px rgba(15, 23, 42, 0.10)' : 'none',
            zIndex: (z) => z.zIndex.drawer + (expanded ? 2 : 0),
          },
        }}
      >
        <SidebarBody
          sections={sections}
          panel={panel}
          footer={footer}
          collapsed={!expanded}
          onNavigate={() => {
            if (!isHoverExpand) setTabletExpanded(false);
          }}
        />
      </Drawer>
    </>
  );
}
