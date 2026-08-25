import { Box, Divider, IconButton, Typography, useTheme } from '@mui/material';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';

type SidePanelProps = {
  title: string;
  subtitle?: string;
  onClose?: () => void;
  actions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Card-style panel (no left rail) for master-detail workspaces. */
  framed?: boolean;
};

/** In-layout inspector panel (not a modal drawer). */
export function SidePanel({
  title,
  subtitle,
  onClose,
  actions,
  children,
  footer,
  framed = false,
}: SidePanelProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Box
      sx={{
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: s.surface,
        borderLeft: framed ? 'none' : `1px solid ${s.border}`,
        borderRadius: framed ? `${DASHBOARD_UX.radius}px` : 0,
        border: framed ? `1px solid ${s.border}` : undefined,
        boxShadow: framed ? s.shadow : undefined,
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          p: `${DASHBOARD_UX.sectionPadding}px`,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }} noWrap>
              {title}
            </Typography>
            {subtitle ? (
              <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 0.25 }} noWrap>
                {subtitle}
              </Typography>
            ) : null}
          </Box>
          {onClose ? (
            <IconButton
              size="small"
              onClick={onClose}
              aria-label="Close panel"
              sx={{
                width: DASHBOARD_UX.buttonHeight,
                height: DASHBOARD_UX.buttonHeight,
                borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
              }}
            >
              <X size={16} />
            </IconButton>
          ) : null}
        </Box>
        {actions ? (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              alignItems: 'center',
            }}
          >
            {actions}
          </Box>
        ) : null}
      </Box>
      <Divider sx={{ borderColor: s.border, flexShrink: 0 }} />
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          p: `${DASHBOARD_UX.sectionPadding}px`,
          overscrollBehavior: 'contain',
        }}
      >
        {children}
        {footer ? (
          <Box
            sx={{
              mt: 2,
              pt: 2,
              borderTop: `1px solid ${s.border}`,
            }}
          >
            {footer}
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}
