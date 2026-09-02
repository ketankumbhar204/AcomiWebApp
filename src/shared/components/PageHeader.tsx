import { Box, Typography, useTheme } from '@mui/material';
import type { ReactNode } from 'react';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { Breadcrumbs, type BreadcrumbItem } from './Breadcrumbs';

type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
};

/** Page title block — Dashboard sectionHeading / body tokens. */
export function PageHeader({ title, description, breadcrumbs, actions }: PageHeaderProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      {breadcrumbs ? <Breadcrumbs items={breadcrumbs} /> : null}
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'stretch', sm: 'flex-start' },
          justifyContent: 'space-between',
          gap: 2,
          flexDirection: { xs: 'column', sm: 'row' },
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            component="h1"
            sx={{ ...DASHBOARD_UX.pageTitle, color: s.textPrimary }}
          >
            {title}
          </Typography>
          {description ? (
            <Typography sx={{ ...DASHBOARD_UX.greetingSub, color: s.textSecondary, mt: 0.5 }}>
              {description}
            </Typography>
          ) : null}
        </Box>
        {actions ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
              minWidth: 0,
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            {actions}
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}
