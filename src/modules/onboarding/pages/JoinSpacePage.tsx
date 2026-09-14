import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';

/** Backward-compatible alias — invitations now live on Member Home. */
export function JoinSpacePage() {
  return <Navigate to={ROUTES.memberHome} replace />;
}
