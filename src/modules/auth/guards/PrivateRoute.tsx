import { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingScreen } from '../../../components/shared/LoadingScreen';
import { AppRoutes } from '../../../core/constants/routes';
import { PortalContext } from '../session/PortalContext';

export function PrivateRoute() {
  const portal = useContext(PortalContext);
  const location = useLocation();
  const isFirstAccessRoute = location.pathname === AppRoutes.portal.firstAccess;

  if (portal.isLoading) {
    return <LoadingScreen message="Validando sesion..." />;
  }

  if (!portal.sessionUserId) {
    return <Navigate to={AppRoutes.public.portalLogin} replace />;
  }

  if (portal.mustChangePassword && !isFirstAccessRoute) {
    return <Navigate to={AppRoutes.portal.firstAccess} replace />;
  }

  if (!portal.mustChangePassword && isFirstAccessRoute) {
    return <Navigate to={AppRoutes.portal.dashboard} replace />;
  }

  if (!portal.isAccountActive) {
    const onboardingStatus = portal.accessControl?.onboarding_status ?? null;
    const isPendingReview = onboardingStatus === 'pending_review';

    return (
      <div style={{ padding: '96px 24px', maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '12px' }}>{isPendingReview ? 'Tu negocio esta en revision' : 'Tu acceso esta desactivado'}</h2>
        <p style={{ color: '#6b7280', marginBottom: '18px' }}>
          {isPendingReview
            ? 'Tu cuenta ya existe, pero la plataforma todavia no habilita este negocio para operar dentro del admin.'
            : 'La plataforma desactivo temporalmente este acceso. Si necesitas volver a entrar, solicita reactivacion al administrador general.'}
        </p>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>
          {isPendingReview
            ? 'Cuando el equipo valide el alta, tu negocio pasara a estado activo y podras usar el portal normalmente.'
            : 'Mientras tanto, la cuenta puede iniciar sesion tecnicamente, pero el portal no dejara operar hasta que vuelva a estar activa.'}
        </p>
        <a
          href={AppRoutes.public.contact}
          style={{
            display: 'inline-block',
            padding: '10px 16px',
            borderRadius: '8px',
            background: '#111827',
            color: '#ffffff',
            textDecoration: 'none',
          }}
        >
          Contactar soporte
        </a>
      </div>
    );
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
