import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { ROUTES, spaceBedInventoryPath } from '@/routes/paths';

/** Resident lists now open the same bed cards as vacant beds, with the operations cards as the filter. */
export function OccupancyListPage() {
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');

  if (!spaceId) {
    return <Navigate to={ROUTES.root} replace />;
  }

  return (
    <Navigate
      to={spaceBedInventoryPath(
        spaceId,
        'OCCUPIED',
        mode === 'moveInsThisMonth' ? { focus: 'moveIns' } : undefined,
      )}
      replace
    />
  );
}
