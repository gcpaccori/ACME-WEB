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

  if (!portal.sessionUserId) {
    return <Navigate to={AppRoutes.public.portalLogin} replace />;
  }

  if (!portal.staffAssignment) {
    return (
      <div style={{ padding: '96px 24px', maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '12px' }}>Tu cuenta no tiene un negocio asignado</h2>
        <p style={{ color: '#6b7280', marginBottom: '18px' }}>
          El inicio de sesión fue correcto, pero todavía no tienes permisos de staff para ingresar al portal.
        </p>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>
          Puedes registrar tu negocio o solicitar que un administrador te asigne a una sucursal.
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

  return <>{children}</>;
}
