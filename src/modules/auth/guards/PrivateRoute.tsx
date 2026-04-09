import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { LoadingScreen } from '../../../components/shared/LoadingScreen';
import { AppRoutes } from '../../../core/constants/routes';
import { PortalContext } from '../session/PortalContext';

export function PrivateRoute() {
  const portal = useContext(PortalContext);

  if (portal.isLoading) {
    return <LoadingScreen message="Validando sesion..." />;
  }

  if (!portal.sessionUserId) {
    return <Navigate to={AppRoutes.public.portalLogin} replace />;
  }

  if (!portal.hasPlatformAccess && !portal.hasBusinessAccess && !portal.hasBranchAccess) {
    return (
      <div style={{ padding: '96px 24px', maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '12px' }}>Tu cuenta no tiene acceso administrativo</h2>
        <p style={{ color: '#6b7280', marginBottom: '18px' }}>
          El inicio de sesion fue correcto, pero todavia no tienes un rol de plataforma ni una asignacion de negocio para ingresar al portal.
        </p>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>
          Puedes registrar tu negocio o solicitar que un administrador te asigne permisos de plataforma, negocio o sucursal.
        </p>
        <a
          href={AppRoutes.public.businesses}
          style={{
            display: 'inline-block',
            padding: '10px 16px',
            borderRadius: '8px',
            background: '#111827',
            color: '#ffffff',
            textDecoration: 'none',
          }}
        >
          Ir al registro de negocio
        </a>
      </div>
    );
  }

  return <Outlet />;
}
