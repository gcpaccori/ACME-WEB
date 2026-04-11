import { useContext } from 'react';
import { PortalContext } from '../../modules/auth/session/PortalContext';
import { getAdminModuleByPath } from '../../core/admin/registry/moduleRegistry';
import { useLocation } from 'react-router-dom';

interface PortalHeaderProps {
  onMenuClick: () => void;
}

export function PortalHeader({ onMenuClick }: PortalHeaderProps) {
  const portal = useContext(PortalContext);
  const location = useLocation();
  const activeModule = getAdminModuleByPath(location.pathname);

  const title = activeModule?.label ?? 'Resumen';

  return (
    <header className="portal-header">
      <div className="portal-header__container">
        <div className="portal-header__left">
          <button className="portal-menu-btn" onClick={onMenuClick}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--acme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Portal</span>
            <h1 className="portal-header__title" style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em' }}>{title}</h1>
          </div>
        </div>

        <div className="portal-header__search">
          <div className="portal-header__search-input-wrapper">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span className="portal-header__search-placeholder">Buscar funciones...</span>
            <kbd className="portal-header__search-kbd">/</kbd>
          </div>
        </div>

        <div className="portal-header__right">
          <button className="portal-header-action" title="Notificaciones">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </button>

          <button className="portal-header-action" title="Ayuda">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </button>

          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--acme-border)', margin: '0 8px' }} />

          <div className="portal-user-profile" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', borderRadius: '12px', transition: 'all 0.2s ease' }}>
            <div className="portal-user-avatar" style={{ border: '2px solid rgba(15, 23, 42, 0.05)' }}>
              {portal.profile?.full_name?.[0] || 'A'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--acme-text)' }}>{portal.profile?.full_name || 'Admin'}</span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--acme-text-muted)', textTransform: 'capitalize' }}>{portal.currentScopeType}</span>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--acme-text-muted)', marginLeft: '4px' }}>
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
}
