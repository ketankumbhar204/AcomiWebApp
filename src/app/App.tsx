import { AppProviders } from '@/app/providers';
import { AppRouter } from '@/app/router';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { LoadingBoundary } from '@/shared/components/LoadingBoundary';

export function App() {
  return (
    <AppProviders>
      <ErrorBoundary>
        <LoadingBoundary>
          <AppRouter />
        </LoadingBoundary>
      </ErrorBoundary>
    </AppProviders>
  );
}
