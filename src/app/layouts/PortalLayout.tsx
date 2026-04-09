import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AppRoutes } from '../../core/constants/routes';
import { useContext, useMemo, useState } from 'react';
import { PortalContext } from '../../modules/auth/session/PortalContext';
import { getEnabledAdminModules } from '../../core/admin/registry/moduleRegistry';

export function PortalLayout() {
  const portal = useContext(PortalContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const branchName = portal.currentBranch?.name ?? 'Local no asignado';
  const navItems = useMemo(() => {
    const baseAdminModules = getEnabledAdminModules().map((module) => ({ label: module.label, to: module.route }));
    return [{ label: 'Dashboard', to: AppRoutes.portal.dashboard }, ...baseAdminModules];
  }, []);

  const handleLogout = async () => {
    if (window.confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      await portal.signOut();
      navigate(AppRoutes.public.portalLogin);
    }
  };

  const isNavActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const handleNavClick = () => {
    setSidebarOpen(false);
  };

  return (
    <div className={`portal-shell ${sidebarOpen ? 'portal-shell--sidebarOpen' : ''}`}>
      <div className="portal-overlay" onClick={() => setSidebarOpen(false)} />

      <aside className="portal-sidebar">
        <div className="portal-sidebar__brand">
          <div className="portal-sidebar__brandTop">
            <div className="portal-sidebar__logo">
              <span style={{ color: 'var(--acme-purple)' }}>ACME</span>
              <span style={{ color: 'var(--acme-orange)' }}>Portal</span>
            </div>
            <span className="portal-badge">Admin</span>
          </div>
          <div className="portal-sidebar__meta">
            <div className="portal-sidebar__metaPrimary">{branchName}</div>
            <div className="portal-sidebar__metaSecondary">{portal.merchant?.name ?? 'Comercio no asignado'}</div>
          </div>
        </div>

        <nav className="portal-nav">
          {navItems.map((item) => {
            const active = isNavActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`portal-nav__item ${active ? 'portal-nav__item--active' : ''}`}
                onClick={handleNavClick}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="portal-actions">
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '14px',
              border: '1px solid rgba(255, 98, 0, 0.28)',
              background: 'rgba(255, 98, 0, 0.08)',
              color: 'var(--acme-orange)',
              fontWeight: 900,
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="portal-main">
        <div className="portal-main__inner">
          <div className="portal-topbar">
            <button className="portal-topbar__button" onClick={() => setSidebarOpen((current) => !current)}>
              Menú
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 900, color: 'var(--acme-purple)' }}>ACME</span>
              <span style={{ color: 'var(--acme-text-muted)', fontSize: '13px' }}>{branchName}</span>
            </div>
          </div>

          <Outlet />
        </div>
      </main>
    </div>
  );
}
