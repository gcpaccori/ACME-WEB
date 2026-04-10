import { useContext, useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { canAccessAdminModule, getPortalActorLabel, getScopeDescription, getScopeLabel, getScopeModeLabel } from '../../core/auth/portalAccess';
import { getAdminModuleByPath, getEnabledAdminModules } from '../../core/admin/registry/moduleRegistry';
import { AppRoutes } from '../../core/constants/routes';
import { PortalContext } from '../../modules/auth/session/PortalContext';

function scopeButtonStyles(active: boolean) {
  return {
    padding: '9px 12px',
    borderRadius: '999px',
    border: `1px solid ${active ? 'rgba(77, 20, 140, 0.22)' : 'var(--acme-border)'}`,
    background: active ? 'rgba(77, 20, 140, 0.08)' : 'var(--acme-white)',
    color: active ? 'var(--acme-purple)' : 'var(--acme-text)',
    fontWeight: 800,
    whiteSpace: 'nowrap' as const,
  };
}

export function PortalLayout() {
  const portal = useContext(PortalContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentScopeLabel = getScopeLabel(portal.currentScopeType);
  const currentScopeDescription = getScopeDescription(portal.currentScopeType);
  const currentModeLabel = getScopeModeLabel(portal.currentScopeType);
  const actorLabel = getPortalActorLabel({
    roleAssignments: portal.roleAssignments,
    profile: portal.profile,
    staffAssignment: portal.staffAssignment,
  });
  const activeModule = useMemo(() => getAdminModuleByPath(location.pathname), [location.pathname]);
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

  const isPlatformScope = portal.currentScopeType === 'platform';
  const isBusinessScope = portal.currentScopeType === 'business';
  const isBranchScope = portal.currentScopeType === 'branch';
  const merchantName = portal.currentMerchant?.name ?? 'Sin negocio seleccionado';
  const branchName = portal.currentBranch?.name ?? 'Sin sucursal seleccionada';
  const businessCount = portal.businessAssignments.length;
  const branchCount = portal.branches.length;
  const scopeIdentityTitle = isPlatformScope
    ? 'Administrador de plataforma'
    : isBusinessScope
      ? 'Administrador de negocio'
      : isBranchScope
        ? 'Operador de sucursal'
        : 'Portal administrativo';
  const scopeNarrative = isPlatformScope
    ? 'Supervisas la plataforma y entras a negocios solo cuando eliges uno.'
    : isBusinessScope
      ? 'Gestionas un negocio concreto con todas sus vistas comerciales.'
      : isBranchScope
        ? 'Operas una sucursal puntual con foco en el turno activo.'
        : 'Sin capa activa.';
  const showMerchantSelector = (isBusinessScope || isBranchScope) && portal.businessAssignments.length > 0;
  const showBranchSelector = isBranchScope && !!portal.currentMerchant && portal.branches.length > 0;
  const needsMerchantSelection = (isBusinessScope || isBranchScope) && !portal.currentMerchant && portal.businessAssignments.length > 0;
  const needsBranchSelection = isBranchScope && !!portal.currentMerchant && !portal.currentBranch && portal.branches.length > 0;
  const workspaceTitle = activeModule?.label ?? 'Resumen';
  const workspaceDescription = needsMerchantSelection
    ? 'Selecciona un negocio para cargar los modulos de esta capa.'
    : needsBranchSelection
      ? 'Selecciona una sucursal para continuar en modo operativo.'
      : activeModule?.description ?? currentScopeDescription;

  useEffect(() => {
    if (!location.pathname.startsWith(AppRoutes.portal.admin.root) || location.pathname === AppRoutes.portal.admin.root) {
      return;
    }

    const isAllowed = enabledModules.some((module) => location.pathname === module.route || location.pathname.startsWith(`${module.route}/`));
    if (!isAllowed) {
      navigate(AppRoutes.portal.admin.root, { replace: true });
    }
  }, [enabledModules, location.pathname, navigate]);

  const navItems = useMemo(
    () =>
      enabledModules.map((module) => ({
        id: module.id,
        label: module.label,
        description: module.description,
        to: module.route,
      })),
    [enabledModules]
  );

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

  const handleNavClick = () => {
    setSidebarOpen(false);
  };

  const contextSummary = isPlatformScope
    ? `${businessCount} negocios supervisados`
    : isBusinessScope
      ? merchantName
      : `${branchName} / ${merchantName}`;
  const contextCoverage = isPlatformScope
    ? 'Toda la plataforma'
    : isBusinessScope
      ? `${branchCount} sucursales visibles`
      : '1 sucursal activa';

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
            <span className="portal-badge">{currentScopeLabel}</span>
          </div>
          <div className="portal-sidebar__meta">
            <div className="portal-sidebar__metaPrimary">{scopeIdentityTitle}</div>
            <div className="portal-sidebar__metaSecondary">{actorLabel}</div>
            <div className="portal-sidebar__metaSecondary">{scopeNarrative}</div>
          </div>
        </div>

        <nav className="portal-nav">
          <div className="portal-sidebar__sectionTitle">Modulos de {currentScopeLabel}</div>
          {navItems.map((item) => {
            const active = isNavActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`portal-nav__item ${active ? 'portal-nav__item--active' : ''}`}
                onClick={handleNavClick}
              >
                <span className="portal-nav__itemContent">
                  <span className="portal-nav__itemLabel">{item.label}</span>
                  <span className="portal-nav__itemMeta">{item.description}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="portal-sidebar__footer">
          <div className="portal-sidebar__footerRow">
            <span>Contexto</span>
            <strong>{contextSummary}</strong>
          </div>
          <div className="portal-sidebar__footerRow">
            <span>Cobertura</span>
            <strong>{contextCoverage}</strong>
          </div>
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
              Cerrar sesion
            </button>
          </div>
        </div>
      </aside>

      <main className="portal-main">
        <div className="portal-main__inner">
          <div className="portal-topbar">
            <button className="portal-topbar__button" onClick={() => setSidebarOpen((current) => !current)}>
              Menu
            </button>
            <div style={{ display: 'grid', gap: '2px', textAlign: 'right' }}>
              <span style={{ fontWeight: 900, color: 'var(--acme-purple)' }}>{scopeIdentityTitle}</span>
              <span style={{ color: 'var(--acme-text-muted)', fontSize: '13px' }}>{workspaceTitle}</span>
            </div>
          </div>

          <header className="portal-headerBar">
            <div className="portal-headerBar__main">
              <span className="portal-headerBar__eyebrow">{currentModeLabel}</span>
              <h1 className="portal-headerBar__title">{workspaceTitle}</h1>
              <p className="portal-headerBar__description">{workspaceDescription}</p>
            </div>

            <div className="portal-headerBar__controls">
              <div className="portal-headerBar__scopeSwitch">
                {portal.availableScopeTypes.map((scopeType) => (
                  <button
                    key={scopeType}
                    type="button"
                    onClick={() => portal.setCurrentScopeType(scopeType)}
                    style={scopeButtonStyles(portal.currentScopeType === scopeType)}
                  >
                    {getScopeLabel(scopeType)}
                  </button>
                ))}
              </div>

              {showMerchantSelector ? (
                <select
                  value={portal.currentMerchant?.id ?? ''}
                  onChange={(event) => portal.setCurrentMerchantId(event.target.value)}
                  className="portal-select portal-select--compact"
                >
                  <option value="">Selecciona un negocio</option>
                  {portal.businessAssignments.map((assignment) => (
                    <option key={assignment.merchant.id} value={assignment.merchant.id}>
                      {assignment.merchant.name}
                    </option>
                  ))}
                </select>
              ) : null}

              {showBranchSelector ? (
                <select
                  value={portal.currentBranch?.id ?? ''}
                  onChange={(event) => portal.setCurrentBranchId(event.target.value)}
                  className="portal-select portal-select--compact"
                >
                  <option value="">Selecciona una sucursal</option>
                  {portal.branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>

            <div className="portal-headerBar__meta">
              <span className="portal-headerPill">{actorLabel}</span>
              <span className="portal-headerPill">{currentScopeLabel}</span>
              <span className="portal-headerPill">{contextSummary}</span>
              <span className="portal-headerPill">{contextCoverage}</span>
            </div>
          </header>

          {needsMerchantSelection ? (
            <section className="portal-emptyState">
              <strong>Selecciona un negocio para continuar</strong>
              <span>
                En capa {currentScopeLabel.toLowerCase()} no se debe entrar automaticamente a un comercio.
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

          <Outlet />
        </div>
      </main>
    </div>
  );
}
