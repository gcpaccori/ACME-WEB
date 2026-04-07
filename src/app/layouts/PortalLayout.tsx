import { Link, Outlet, useNavigate } from 'react-router-dom';
import { AppRoutes } from '../../core/constants/routes';
import { useContext } from 'react';
import { PortalContext } from '../../modules/auth/session/PortalContext';

const navItems = [
  { label: 'Dashboard', to: AppRoutes.portal.dashboard },
  { label: 'Pedidos', to: AppRoutes.portal.orders },
  { label: 'Carta', to: AppRoutes.portal.menu },
  { label: 'Categorías', to: AppRoutes.portal.categories },
  { label: 'Productos', to: AppRoutes.portal.products },
  { label: 'Estado', to: AppRoutes.portal.branchStatus },
  { label: 'Horarios', to: AppRoutes.portal.hours },
  { label: 'Personal', to: AppRoutes.portal.staff },
];

export function PortalLayout() {
  const portal = useContext(PortalContext);
  const navigate = useNavigate();

  const branchName = portal.currentBranch?.name ?? 'Local no asignado';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f5f7' }}>
      <aside style={{ width: '260px', padding: '24px 16px', background: '#ffffff', borderRight: '1px solid #e5e7eb' }}>
        <div style={{ marginBottom: '24px' }}>
          <strong>ACME Portal</strong>
          <div style={{ color: '#6b7280', marginTop: '8px' }}>{branchName}</div>
          <div style={{ color: '#374151', marginTop: '4px', fontSize: '13px' }}>
            {portal.merchant?.name ?? 'Comercio no asignado'}
          </div>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {navItems.map((item) => (
            <Link key={item.to} to={item.to} style={{ padding: '10px 12px', borderRadius: '8px', color: '#111827', background: '#f9fafb' }}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div style={{ flex: 1 }}>
        <header style={{ padding: '18px 24px', background: '#ffffff', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>Portal del local</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span>{portal.profile?.full_name || portal.profile?.email || 'Usuario'}</span>
            <button
              onClick={async () => {
                await portal.signOut();
                navigate(AppRoutes.public.portalLogin);
              }}
              style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#ffffff' }}
            >
              Cerrar sesión
            </button>
          </div>
        </header>
        <main style={{ padding: '24px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
