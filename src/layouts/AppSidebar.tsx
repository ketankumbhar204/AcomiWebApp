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
} from '@mui/material';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { APP_NAME } from '@/shared/constants/app';
import { useAppStore } from '@/store/appStore';
import { LAYOUT } from './layoutConstants';
import type { AppNavSection } from './navTypes';

type AppSidebarProps = {
  sections?: AppNavSection[];
  footer?: React.ReactNode;
  variant: 'permanent' | 'temporary';
  open: boolean;
  onClose?: () => void;
};

function SidebarBody({
  sections,
  footer,
  collapsed,
  onNavigate,
}: {
  sections: AppNavSection[];
  footer?: React.ReactNode;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
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
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.dark' }}>
            {APP_NAME}
          </Typography>
        ) : null}
        <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <IconButton
            size="small"
            onClick={toggleSidebarCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
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
                variant="overline"
                sx={{
                  px: 1.5,
                  mb: 0.5,
                  color: 'text.secondary',
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  lineHeight: 1.3,
                  textTransform: 'uppercase',
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
                      minHeight: 36,
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
                        '& .MuiListItemText-primary': { fontWeight: 600 },
                      },
                    }}
                  >
                    {item.icon ? (
                      <ListItemIcon
                        sx={{
                          minWidth: collapsed ? 0 : 32,
                          color: 'text.secondary',
                          '& svg': { width: 16, height: 16 },
                        }}
                      >
                        <Badge
                          color="error"
                          badgeContent={item.badgeCount ?? 0}
                          invisible={!item.badgeCount}
                          sx={{
                            '& .MuiBadge-badge': {
                              minWidth: 14,
                              height: 14,
                              fontSize: 10,
                              fontWeight: 600,
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
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              lineHeight: 1.3,
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

      {footer ? (
        <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', flexShrink: 0 }}>{footer}</Box>
      ) : null}
    </Box>
  );
}

export function AppSidebar({
  sections = [],
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
        <SidebarBody sections={sections} footer={footer} collapsed={false} onNavigate={onClose} />
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      open
      sx={{
        // Desktop chrome: permanent sidebar from md up (mobile uses temporary drawer)
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
      <SidebarBody sections={sections} footer={footer} collapsed={sidebarCollapsed} />
    </Drawer>
  );
}
