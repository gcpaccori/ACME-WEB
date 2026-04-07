import { ReactNode, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AppRoutes } from '../../../core/constants/routes';
import { PortalContext } from '../session/PortalContext';
import { LoadingScreen } from '../../../components/shared/LoadingScreen';

export function PrivateRoute({ children }: { children: ReactNode }) {
  const portal = useContext(PortalContext);

  if (portal.isLoading) {
    return <LoadingScreen message="Validando sesión..." />;
  }

  if (!portal.sessionUserId || !portal.staffAssignment) {
    return <Navigate to={AppRoutes.public.portalLogin} replace />;
  }

  return <>{children}</>;
}
