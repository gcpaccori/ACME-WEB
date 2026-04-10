import { useContext, useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { canAccessAdminModule, getPortalActorLabel, getScopeDescription, getScopeLabel, getScopeModeLabel } from '../../core/auth/portalAccess';
import { getAdminModuleByPath, getEnabledAdminModules } from '../../core/admin/registry/moduleRegistry';
import { AppRoutes } from '../../core/constants/routes';
import { PortalContext } from '../../modules/auth/session/PortalContext';

function scopeButtonStyles(active: boolean) {
  return {
    padding: '10px 12px',
    borderRadius: '12px',
    border: `1px solid ${active ? 'rgba(77, 20, 140, 0.24)' : 'var(--acme-border)'}`,
    background: active ? 'rgba(77, 20, 140, 0.08)' : 'var(--acme-white)',
    color: active ? 'var(--acme-purple)' : 'var(--acme-text)',
    fontWeight: 800,
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
  const isPlatformScope = portal.currentScopeType === 'platform';
  const isBusinessScope = portal.currentScopeType === 'business';
  const isBranchScope = portal.currentScopeType === 'branch';
  const businessCount = portal.businessAssignments.length;
  const branchCount = portal.branches.length;
  const branchName = portal.currentBranch?.name ?? 'Sin sucursal';
  const merchantName = portal.currentMerchant?.name ?? portal.merchant?.name ?? 'Sin comercio';
  const canSwitchMerchant = portal.businessAssignments.length > 1 && (portal.currentScopeType === 'business' || portal.currentScopeType === 'branch');
  const displayBusinessLabel = isPlatformScope ? 'Todos los negocios' : merchantName;
  const displayBranchLabel = isBranchScope ? branchName : isBusinessScope ? `${branchCount} sucursales visibles` : 'No aplica';
  const sidebarPrimaryLabel = isPlatformScope ? 'Plataforma ACME' : isBusinessScope ? displayBusinessLabel : displayBranchLabel;
  const sidebarSecondaryLabel = isPlatformScope
    ? `${businessCount} negocios supervisados`
    : isBusinessScope
      ? `${branchCount} sucursales en este negocio`
      : merchantName;
  const scopeNarrative = isPlatformScope
    ? 'Eres admin del sistema. Supervisas negocios, no eres owner de uno desde esta capa.'
    : isBusinessScope
      ? 'Estas operando un negocio completo con sus sucursales y modulos comerciales.'
      : 'Estas operando una sucursal puntual con foco en el turno actual.';

  const enabledModules = useMemo(
    () =>
      getEnabledAdminModules({
        scopeType: portal.currentScopeType,
        hasMerchant: !!portal.currentMerchant,
        hasBranch: !!portal.currentBranch,
      }).filter((module) => canAccessAdminModule(module.id, portal.permissions)),
    [portal.currentScopeType, portal.currentMerchant, portal.currentBranch, portal.permissions]
  );
  const activeModule = useMemo(() => getAdminModuleByPath(location.pathname), [location.pathname]);

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
  const workspaceTitle = activeModule ? `${currentScopeLabel} / ${activeModule.label}` : `${currentScopeLabel} / Resumen`;
  const workspaceDescription = activeModule?.description ?? currentScopeDescription;
  const visibleModulesCount = enabledModules.length;

  useEffect(() => {
    if (!location.pathname.startsWith(AppRoutes.portal.admin.root) || location.pathname === AppRoutes.portal.admin.root) {
      return;
    }

    const isAllowed = enabledModules.some((module) => location.pathname === module.route || location.pathname.startsWith(`${module.route}/`));
    if (!isAllowed) {
      navigate(AppRoutes.portal.admin.root, { replace: true });
    }
  }, [enabledModules, location.pathname, navigate]);

  const handleLogout = async () => {
    if (window.confirm('Estas seguro de que quieres cerrar sesion?')) {
      await portal.signOut();
      navigate(AppRoutes.public.portalLogin);
    }
  };

  const isNavActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  const handleNavClick = () => {
    setSidebarOpen(false);
  };

  const canSwitchBranch = (portal.currentScopeType === 'business' || portal.currentScopeType === 'branch') && portal.branches.length > 1;

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
            <div className="portal-sidebar__metaPrimary">{sidebarPrimaryLabel}</div>
            <div className="portal-sidebar__metaSecondary">{sidebarSecondaryLabel}</div>
            <div className="portal-sidebar__metaSecondary">{actorLabel}</div>
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
      </aside>

      <main className="portal-main">
        <div className="portal-main__inner">
          <div className="portal-topbar">
            <button className="portal-topbar__button" onClick={() => setSidebarOpen((current) => !current)}>
              Menu
            </button>
            <div style={{ display: 'grid', gap: '4px', textAlign: 'right' }}>
              <span style={{ fontWeight: 900, color: 'var(--acme-purple)' }}>{workspaceTitle}</span>
              <span style={{ color: 'var(--acme-text-muted)', fontSize: '13px' }}>{currentModeLabel}</span>
              <span style={{ color: 'var(--acme-text-muted)', fontSize: '13px' }}>{displayBusinessLabel}</span>
              <span style={{ color: 'var(--acme-text-muted)', fontSize: '12px' }}>{displayBranchLabel}</span>
            </div>
          </div>

          <section
            style={{
              padding: '18px 20px',
              borderRadius: '18px',
              background: 'rgba(255, 255, 255, 0.92)',
              border: '1px solid var(--acme-border)',
              boxShadow: 'var(--acme-shadow-sm)',
              display: 'grid',
              gap: '18px',
            }}
          >
            <div style={{ display: 'grid', gap: '6px' }}>
              <span className="portal-workspace__eyebrow">Contexto de trabajo</span>
              <strong style={{ fontSize: '20px', color: 'var(--acme-purple)' }}>{currentModeLabel}</strong>
              <span style={{ color: 'var(--acme-text-muted)' }}>{scopeNarrative}</span>
            </div>

            <div style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
              <div style={{ display: 'grid', gap: '8px' }}>
                <strong style={{ fontSize: '13px' }}>Capa actual</strong>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
                <span style={{ color: 'var(--acme-text-muted)', fontSize: '12px' }}>{currentScopeDescription}</span>
              </div>

              {canSwitchMerchant ? (
                <div style={{ display: 'grid', gap: '8px' }}>
                  <strong style={{ fontSize: '13px' }}>Contexto de negocio</strong>
                  <select
                    value={portal.currentMerchant?.id ?? ''}
                    onChange={(event) => portal.setCurrentMerchantId(event.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: '1px solid var(--acme-border)',
                      background: 'var(--acme-white)',
                    }}
                  >
                    {portal.businessAssignments.map((assignment) => (
                      <option key={assignment.merchant.id} value={assignment.merchant.id}>
                        {assignment.merchant.name}
                      </option>
                    ))}
                  </select>
                  <span style={{ color: 'var(--acme-text-muted)', fontSize: '12px' }}>
                    Esto define sobre que negocio trabajas al entrar a capa negocio o sucursal.
                  </span>
                </div>
              ) : null}

              {canSwitchBranch ? (
                <div style={{ display: 'grid', gap: '8px' }}>
                  <strong style={{ fontSize: '13px' }}>Sucursal operativa</strong>
                  <select
                    value={portal.currentBranch?.id ?? ''}
                    onChange={(event) => portal.setCurrentBranchId(event.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: '1px solid var(--acme-border)',
                      background: 'var(--acme-white)',
                    }}
                  >
                    {portal.branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
          </section>

          <section className="portal-workspace">
            <div className="portal-workspace__header">
              <div style={{ display: 'grid', gap: '8px' }}>
                <span className="portal-workspace__eyebrow">Workspace actual</span>
                <h1 className="portal-workspace__title">{workspaceTitle}</h1>
                <p className="portal-workspace__description">{workspaceDescription}</p>
              </div>
              <div className="portal-workspace__chips">
                <span className="portal-badge">{currentModeLabel}</span>
                {activeModule ? <span className="portal-badge">{activeModule.label}</span> : null}
              </div>
            </div>

            <div className="portal-workspace__contextGrid">
              <div className="portal-chip">
                <span className="portal-chip__label">Perfil actual</span>
                <strong className="portal-chip__value">{actorLabel}</strong>
              </div>
              <div className="portal-chip">
                <span className="portal-chip__label">Capa</span>
                <strong className="portal-chip__value">{currentScopeLabel}</strong>
              </div>
              <div className="portal-chip">
                <span className="portal-chip__label">{isPlatformScope ? 'Cobertura' : 'Comercio'}</span>
                <strong className="portal-chip__value">{isPlatformScope ? 'Toda la plataforma' : displayBusinessLabel}</strong>
              </div>
              <div className="portal-chip">
                <span className="portal-chip__label">{isPlatformScope ? 'Negocios visibles' : 'Sucursal'}</span>
                <strong className="portal-chip__value">{isPlatformScope ? `${businessCount} negocios` : displayBranchLabel}</strong>
              </div>
              <div className="portal-chip">
                <span className="portal-chip__label">Modulos visibles</span>
                <strong className="portal-chip__value">{visibleModulesCount}</strong>
              </div>
              <div className="portal-chip">
                <span className="portal-chip__label">Cobertura operativa</span>
                <strong className="portal-chip__value">
                  {portal.currentScopeType === 'platform'
                    ? `${businessCount} negocios`
                    : portal.currentScopeType === 'business'
                      ? `${branchCount} sucursales`
                      : '1 sucursal'}
                </strong>
              </div>
            </div>
          </section>

          <Outlet />
        </div>
      </main>
    </div>
  );
}
