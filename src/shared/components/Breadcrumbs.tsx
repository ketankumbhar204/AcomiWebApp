import { Box, Breadcrumbs as MuiBreadcrumbs, Link, Typography } from '@mui/material';
import { ChevronRight } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';

export type BreadcrumbItem = {
  label: string;
  to?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <MuiBreadcrumbs
      separator={<ChevronRight size={14} />}
      aria-label="Breadcrumb"
      sx={{ mb: 1.5, '& .MuiBreadcrumbs-separator': { mx: 0.75 } }}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        if (isLast || !item.to) {
          return (
            <Typography key={`${item.label}-${index}`} variant="body2" color="text.primary">
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
            color="text.secondary"
            variant="body2"
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
