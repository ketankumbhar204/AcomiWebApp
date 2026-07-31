import { Outlet } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';

/** Keeps AuthLayout in its own file for Fast Refresh. */
export function AuthLayoutOutlet() {
  return (
    <AuthLayout>
      <Outlet />
    </AuthLayout>
  );
}
