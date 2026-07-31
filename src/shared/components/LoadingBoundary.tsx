import { Box, CircularProgress } from '@mui/material';
import { Suspense, type ReactNode } from 'react';

type LoadingFallbackProps = {
  fullScreen?: boolean;
};

export function LoadingFallback({ fullScreen = true }: LoadingFallbackProps) {
  return (
    <Box
      role="status"
      aria-label="Loading"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: fullScreen ? '100vh' : 240,
      }}
    >
      <CircularProgress color="primary" size={36} />
    </Box>
  );
}

type LoadingBoundaryProps = {
  children: ReactNode;
  fullScreen?: boolean;
};

export function LoadingBoundary({ children, fullScreen = true }: LoadingBoundaryProps) {
  return <Suspense fallback={<LoadingFallback fullScreen={fullScreen} />}>{children}</Suspense>;
}
