import { Box, Button, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { BlankLayout } from '@/layouts/BlankLayout';
import { ROUTES } from '@/routes/paths';

/** System 404 page — not a business module. */
export function NotFoundPage() {
  return (
    <BlankLayout>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          px: 2,
        }}
      >
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
          404
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Page not found
        </Typography>
        <Button component={RouterLink} to={ROUTES.root} variant="contained" color="primary">
          Go home
        </Button>
      </Box>
    </BlankLayout>
  );
}
