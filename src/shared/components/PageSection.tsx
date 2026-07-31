import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

type PageSectionProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function PageSection({ title, description, actions, children }: PageSectionProps) {
  return (
    <Box component="section" sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {title || actions ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box>
            {title ? (
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {title}
              </Typography>
            ) : null}
            {description ? (
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            ) : null}
          </Box>
          {actions}
        </Box>
      ) : null}
      {children}
    </Box>
  );
}
