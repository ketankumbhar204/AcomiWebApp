import { useEffect, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { i18n } from '@/i18n';
import { useAuthStore } from '@/store/authStore';
import { QueryProvider } from './QueryProvider';
import { SnackbarProvider } from './SnackbarProvider';
import { ThemeProvider } from './ThemeProvider';

type AppProvidersProps = {
  children: ReactNode;
};

function AuthBootstrap({ children }: { children: ReactNode }) {
  const bootstrap = useAuthStore((state) => state.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return children;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryProvider>
        <ThemeProvider>
          <SnackbarProvider>
            <AuthBootstrap>{children}</AuthBootstrap>
          </SnackbarProvider>
        </ThemeProvider>
      </QueryProvider>
    </I18nextProvider>
  );
}
