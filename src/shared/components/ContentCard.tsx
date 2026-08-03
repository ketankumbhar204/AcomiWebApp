import { Paper, useTheme } from '@mui/material';
import type { ReactNode } from 'react';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';

type ContentCardProps = {
  children: ReactNode;
  padded?: boolean;
  onClick?: () => void;
  selected?: boolean;
};

/** Content card — Dashboard radius, border, shadow. */
export function ContentCard({ children, padded = true, onClick, selected = false }: ContentCardProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Paper
      elevation={0}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      sx={{
        borderRadius: `${DASHBOARD_UX.radius}px`,
        border: `1px solid ${s.border}`,
        bgcolor: s.surface,
        boxShadow: s.shadow,
        p: padded ? `${DASHBOARD_UX.cardPadding}px` : 0,
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : undefined,
        outline: selected ? `2px solid ${theme.palette.primary.main}` : undefined,
        outlineOffset: selected ? 1 : undefined,
        transition: DASHBOARD_UX.transition,
        '&:hover': onClick
          ? {
              bgcolor: s.hover,
              boxShadow: s.shadowHover,
            }
          : undefined,
        '&:focus-visible': onClick
          ? {
              outline: `2px solid ${theme.palette.primary.main}`,
              outlineOffset: 2,
            }
          : undefined,
      }}
    >
      {children}
    </Paper>
  );
}
