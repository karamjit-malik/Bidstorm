import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import type { UserRole } from '../../types/user';

interface Props {
  /** If set, the user must have one of these roles. */
  roles?: UserRole[];
}

export default function ProtectedRoute({ roles }: Props) {
  const { user, status } = useAuthStore();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center text-slate-400">Loading…</div>
    );
  }

  if (status !== 'authenticated' || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
