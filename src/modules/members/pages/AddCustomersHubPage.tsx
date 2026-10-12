import { Navigate, useParams } from 'react-router-dom';
import { spaceMembersAddChoicePath } from '@/routes/paths';

/**
 * Legacy hub URL. Adding a customer now starts from the choice dialog
 * on the members page, then opens the existing form.
 */
export function AddCustomersHubPage() {
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  return <Navigate to={spaceMembersAddChoicePath(spaceId)} replace />;
}
