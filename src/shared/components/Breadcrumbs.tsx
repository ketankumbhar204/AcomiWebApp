import { Box, Breadcrumbs as MuiBreadcrumbs, Link, Typography, useTheme } from '@mui/material';
import { ChevronRight } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';

export type BreadcrumbItem = {
  label: string;
  to?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  if (items.length === 0) {
    return null;
  }

  return (
    <MuiBreadcrumbs
      separator={<ChevronRight size={DASHBOARD_UX.iconSize} />}
      aria-label="Breadcrumb"
      sx={{ mb: 1.25, '& .MuiBreadcrumbs-separator': { mx: 0.5, color: s.textMuted } }}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        if (isLast || !item.to) {
          return (
            <Typography
              key={`${item.label}-${index}`}
              sx={{ ...DASHBOARD_UX.breadcrumb, color: s.textPrimary }}
            >
              {item.label}
            </Typography>
          );
        }
        return (
          <Link
            key={`${item.label}-${index}`}
            component={RouterLink}
            to={item.to}
            underline="hover"
            sx={{ ...DASHBOARD_UX.breadcrumb, color: s.textSecondary }}
          >
            {item.label}
          </Link>
        );
      })}
    </MuiBreadcrumbs>
  );
}

/** Alias used in page templates. */
export function AppBreadcrumb(props: BreadcrumbsProps) {
  return (
    <Box>
      <Breadcrumbs {...props} />
    </Box>
  );
}
