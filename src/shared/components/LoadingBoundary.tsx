import { Box, CircularProgress } from '@mui/material';
import { Suspense, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type LoadingFallbackProps = {
  fullScreen?: boolean;
};

export function LoadingFallback({ fullScreen = true }: LoadingFallbackProps) {
  const { t } = useTranslation();

  return (
    <Box
      role="status"
      aria-label={t('common.loading')}
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
