import { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PortalContext } from '../../modules/auth/session/PortalContext';
import { AdminModuleSpec } from '../../core/admin/contracts';
import { getEnabledAdminModules } from '../../core/admin/registry/moduleRegistry';
import { getScopeLabel } from '../../core/auth/portalAccess';
import { AppRoutes } from '../../core/constants/routes';

interface PortalSidebarProps {
  onItemClick: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export function PortalSidebar({ onItemClick, isMinimized, onToggleMinimize }: PortalSidebarProps) {
  const portal = useContext(PortalContext);
  const location = useLocation();
  const navigate = useNavigate();

  const enabledModules = getEnabledAdminModules({
    scopeType: portal.currentScopeType,
    hasMerchant: !!portal.currentMerchant,
    hasBranch: !!portal.currentBranch,
  });

  const isNavActive = (path: string) => {
    if (path === AppRoutes.portal.admin.root) {
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleLogout = async () => {
    if (window.confirm('Estas seguro de que quieres cerrar sesion?')) {
      await portal.signOut();
      navigate(AppRoutes.public.portalLogin);
    }
  };

  return (
    <aside className="portal-sidebar">
      <div className="portal-sidebar__brand">
        <div className="portal-sidebar__logo-mini">
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '10px', 
            background: 'linear-gradient(135deg, var(--acme-orange), #ff8c00)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 900,
            fontSize: '20px',
            boxShadow: '0 4px 12px rgba(255, 98, 0, 0.3)'
          }}>
            A
          </div>
        </div>

        <div className="portal-sidebar__logo" style={{ flex: 1 }}>
          <span className="portal-sidebar__logo-text">
            <span style={{ color: 'var(--acme-orange)' }}>ACME</span>
            <span style={{ color: 'var(--acme-white)', marginLeft: '2px' }}>Portal</span>
          </span>
        </div>
        
        <button className="sidebar-toggle-btn" onClick={onToggleMinimize} title={isMinimized ? 'Expandir' : 'Contraer'}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      </div>


      <nav className="portal-sidebar__nav">
        <div className="portal-sidebar__nav-label">
          {getScopeLabel(portal.currentScopeType)}
        </div>
        {enabledModules.map((module) => (
          <Link
            key={module.id}
            to={module.route}
            className={`portal-nav-item ${isNavActive(module.route) ? 'portal-nav-item--active' : ''}`}
            onClick={onItemClick}
            title={isMinimized ? module.label : ''}
          >
            <span className="portal-nav-item__icon">
              <ModuleIcon icon={module.icon} />
            </span>
            <span className="portal-nav-item__label">{module.label}</span>
          </Link>
        ))}
      </nav>


      <div className="portal-sidebar__footer">
        <div className="portal-user-profile">
          <div className="portal-user-avatar">
            {portal.profile?.full_name?.[0] || 'A'}
          </div>
          <div className="portal-user-info">
            <div className="portal-user-name">{portal.profile?.full_name || 'Administrador'}</div>
            <div className="portal-user-role">{getScopeLabel(portal.currentScopeType)}</div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="portal-sidebar__logout-button"
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'transparent',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            e.currentTarget.style.color = '#ef4444';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span className="portal-sidebar__footer-text">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}

function ModuleIcon({ icon }: { icon?: string }) {
  const props = {
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (icon) {
    case 'layout':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="3" y1="9" x2="21" y2="9"></line>
          <line x1="9" y1="21" x2="9" y2="9"></line>
        </svg>
      );
    case 'clock':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      );
    case 'building':
      return (
        <svg {...props}>
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
          <line x1="9" y1="22" x2="9" y2="2"></line>
          <line x1="15" y1="22" x2="15" y2="2"></line>
          <line x1="4" y1="18" x2="20" y2="18"></line>
          <line x1="4" y1="14" x2="20" y2="14"></line>
          <line x1="4" y1="10" x2="20" y2="10"></line>
          <line x1="4" y1="6" x2="20" y2="6"></line>
        </svg>
      );
    case 'shop':
      return (
        <svg {...props}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      );
    case 'map-pin':
      return (
        <svg {...props}>
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      );
    case 'users':
      return (
        <svg {...props}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      );
    case 'user-heart':
      return (
        <svg {...props}>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      );
    case 'list':
      return (
        <svg {...props}>
          <line x1="8" y1="6" x2="21" y2="6"></line>
          <line x1="8" y1="12" x2="21" y2="12"></line>
          <line x1="8" y1="18" x2="21" y2="18"></line>
          <line x1="3" y1="6" x2="3.01" y2="6"></line>
          <line x1="3" y1="12" x2="3.01" y2="12"></line>
          <line x1="3" y1="18" x2="3.01" y2="18"></line>
        </svg>
      );
    case 'shopping-cart':
      return (
        <svg {...props}>
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
      );
    case 'toggle-right':
      return (
        <svg {...props}>
          <rect x="1" y="5" width="22" height="14" rx="7" ry="7"></rect>
          <circle cx="16" cy="12" r="3"></circle>
        </svg>
      );
    case 'book-open':
      return (
        <svg {...props}>
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
        </svg>
      );
    case 'truck':
      return (
        <svg {...props}>
          <rect x="1" y="3" width="15" height="13"></rect>
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
          <circle cx="5.5" cy="18.5" r="2.5"></circle>
          <circle cx="18.5" cy="18.5" r="2.5"></circle>
        </svg>
      );
    case 'credit-card':
      return (
        <svg {...props}>
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
          <line x1="1" y1="10" x2="23" y2="10"></line>
        </svg>
      );
    case 'tag':
      return (
        <svg {...props}>
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
          <line x1="7" y1="7" x2="7.01" y2="7"></line>
        </svg>
      );
    case 'dollar-sign':
      return (
        <svg {...props}>
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      );
    case 'message-circle':
      return (
        <svg {...props}>
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
      );
    case 'shield':
      return (
        <svg {...props}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      );
    case 'settings':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      );
  }
}
