import { useContext, useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { canAccessAdminModule, getScopeLabel } from '../../core/auth/portalAccess';
import { getEnabledAdminModules } from '../../core/admin/registry/moduleRegistry';
import { AppRoutes } from '../../core/constants/routes';
import { PortalContext } from '../../modules/auth/session/PortalContext';
import { PortalSidebar } from './PortalSidebar';
import { PortalHeader } from './PortalHeader';

export function PortalLayout() {
  const portal = useContext(PortalContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(() => {
    return localStorage.getItem('acme-portal-sidebar-minimized') === 'true';
  });

  const toggleMinimize = () => {
    setIsMinimized((prev) => {
      const newState = !prev;
      localStorage.setItem('acme-portal-sidebar-minimized', String(newState));
      return newState;
    });
  };

  const enabledModules = useMemo(
    () =>
      portal.mustChangePassword || !portal.isAccountActive
        ? []
        : getEnabledAdminModules({
            scopeType: portal.currentScopeType,
            hasMerchant: !!portal.currentMerchant,
            hasBranch: !!portal.currentBranch,
          }).filter((module) => canAccessAdminModule(module.id, portal.permissions)),
    [portal.currentScopeType, portal.currentMerchant, portal.currentBranch, portal.permissions, portal.mustChangePassword, portal.isAccountActive]
  );

  const isBusinessScope = portal.currentScopeType === 'business';
  const isBranchScope = portal.currentScopeType === 'branch';
  const showMerchantSelector = (isBusinessScope || isBranchScope) && portal.businessAssignments.length > 0;
  const showBranchSelector = isBranchScope && !!portal.currentMerchant && portal.branches.length > 0;
  const needsMerchantSelection = (isBusinessScope || isBranchScope) && !portal.currentMerchant && portal.businessAssignments.length > 0;
  const needsBranchSelection = isBranchScope && !!portal.currentMerchant && !portal.currentBranch && portal.branches.length > 0;

  useEffect(() => {
    if (!location.pathname.startsWith(AppRoutes.portal.admin.root) || location.pathname === AppRoutes.portal.admin.root) {
      return;
    }

    const isAllowed = enabledModules.some((module) => location.pathname === module.route || location.pathname.startsWith(`${module.route}/`));
    if (!isAllowed) {
      navigate(AppRoutes.portal.admin.root, { replace: true });
    }
  }, [enabledModules, location.pathname, navigate]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className={`portal-shell ${sidebarOpen ? 'portal-shell--sidebarOpen' : ''} ${isMinimized ? 'portal-shell--minimized' : ''}`}>
      <div className="portal-overlay" onClick={closeSidebar} />

      <PortalSidebar onItemClick={closeSidebar} isMinimized={isMinimized} onToggleMinimize={toggleMinimize} />

      <div className="portal-main-area">
        <PortalHeader onMenuClick={toggleSidebar} />


        {/* Global Context Bar (Scope / Merchant / Branch) */}
        <div style={{ padding: '16px 24px 0', borderBottom: '1px solid var(--acme-border)', backgroundColor: 'var(--acme-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', paddingBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', background: 'var(--acme-surface-muted)', padding: '4px', borderRadius: '10px' }}>
              {portal.availableScopeTypes.map((scopeType) => (
                <button
                  key={scopeType}
                  type="button"
                  onClick={() => portal.setCurrentScopeType(scopeType)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: portal.currentScopeType === scopeType ? 'var(--acme-surface)' : 'transparent',
                    color: portal.currentScopeType === scopeType ? 'var(--acme-purple)' : 'var(--acme-text-muted)',
                    boxShadow: portal.currentScopeType === scopeType ? 'var(--acme-shadow-sm)' : 'none',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {getScopeLabel(scopeType)}
                </button>
              ))}
            </div>

            {showMerchantSelector && (
              <select
                value={portal.currentMerchant?.id ?? ''}
                onChange={(event) => portal.setCurrentMerchantId(event.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--acme-border)',
                  background: 'var(--acme-surface)',
                  fontSize: '14px',
                  fontWeight: 600,
                  minWidth: '200px'
                }}
              >
                <option value="">Selecciona un negocio</option>
                {portal.businessAssignments.map((assignment) => (
                  <option key={assignment.merchant.id} value={assignment.merchant.id}>
                    {assignment.merchant.name}
                  </option>
                ))}
              </select>
            )}

            {showBranchSelector && (
              <select
                value={portal.currentBranch?.id ?? ''}
                onChange={(event) => portal.setCurrentBranchId(event.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--acme-border)',
                  background: 'var(--acme-surface)',
                  fontSize: '14px',
                  fontWeight: 600,
                  minWidth: '200px'
                }}
              >
                <option value="">Selecciona una sucursal</option>
                {portal.branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <main className="portal-content">
          {needsMerchantSelection ? (
            <section className="portal-emptyState">
              <strong>Selecciona un negocio para continuar</strong>
              <span>
                En capa {getScopeLabel(portal.currentScopeType).toLowerCase()} no se debe entrar automaticamente a un comercio.
                Primero elige uno desde el selector superior.
              </span>
            </section>
          ) : null}

          {needsBranchSelection ? (
            <section className="portal-emptyState">
              <strong>Selecciona una sucursal</strong>
              <span>Esta capa necesita una sucursal operativa antes de mostrar pedidos, turno y estado local.</span>
            </section>
          ) : null}

          {(!needsMerchantSelection && !needsBranchSelection) && <Outlet />}
        </main>
      </div>
    </div>
  );
}
