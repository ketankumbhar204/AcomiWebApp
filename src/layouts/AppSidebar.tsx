import {
  Badge,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { APP_NAME } from '@/shared/constants/app';
import { useAppStore } from '@/store/appStore';
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
  const toggleSidebarCollapsed = useAppStore((state) => state.toggleSidebarCollapsed);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
      <Toolbar
        sx={{
          px: 2,
          gap: 1,
          minHeight: LAYOUT.headerHeight,
          flexShrink: 0,
          justifyContent: collapsed ? 'center' : 'space-between',
        }}
      >
        {!collapsed ? (
          <Typography sx={{ ...DASHBOARD_UX.spaceName, color: 'primary.dark' }}>
            {APP_NAME}
          </Typography>
        ) : null}
        <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <IconButton
            size="small"
            onClick={toggleSidebarCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <PanelLeftOpen size={DASHBOARD_UX.iconSize} />
            ) : (
              <PanelLeftClose size={DASHBOARD_UX.iconSize} />
            )}
          </IconButton>
        </Tooltip>
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
                      borderRadius: 1,
                      mb: 0.2,
                      py: 0,
                      minHeight: DASHBOARD_UX.navRowHeight,
                      px: 1.25,
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      position: 'relative',
                      '&.active': {
                        bgcolor: 'rgba(18, 140, 126, 0.1)',
                        color: 'primary.dark',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          top: 6,
                          bottom: 6,
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
        <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', flexShrink: 0 }}>{footer}</Box>
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
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);
  const width = sidebarCollapsed ? LAYOUT.sidebarCollapsedWidth : LAYOUT.sidebarWidth;

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

  return (
    <Drawer
      variant="permanent"
      open
      sx={{
        display: { xs: 'none', md: 'block' },
        width,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width,
          boxSizing: 'border-box',
          borderRight: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          position: 'relative',
          height: '100vh',
          maxHeight: '100vh',
          overflow: 'hidden',
        },
      }}
    >
      <SidebarBody
        sections={sections}
        panel={panel}
        footer={footer}
        collapsed={sidebarCollapsed}
      />
    </Drawer>
  );
}
