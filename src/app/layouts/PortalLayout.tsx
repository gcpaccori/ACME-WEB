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
  const branchName = portal.currentBranch?.name ?? 'Sin sucursal';
  const merchantName = portal.currentMerchant?.name ?? portal.merchant?.name ?? 'Sin comercio';
  const canSwitchMerchant = portal.businessAssignments.length > 1 && (portal.currentScopeType === 'business' || portal.currentScopeType === 'branch');

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
  const businessCount = portal.businessAssignments.length;
  const branchCount = portal.branches.length;

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
            <div className="portal-sidebar__metaPrimary">{merchantName}</div>
            <div className="portal-sidebar__metaSecondary">{branchName}</div>
            <div className="portal-sidebar__metaSecondary">{actorLabel}</div>
          </div>
        </div>

        <div className="portal-actions" style={{ marginTop: 0 }}>
          <div style={{ display: 'grid', gap: '12px' }}>
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

            {canSwitchMerchant ? (
              <div style={{ display: 'grid', gap: '8px' }}>
                <strong style={{ fontSize: '13px' }}>Negocio actual</strong>
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
              </div>
            ) : null}
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
              <span style={{ color: 'var(--acme-text-muted)', fontSize: '13px' }}>{merchantName}</span>
              <span style={{ color: 'var(--acme-text-muted)', fontSize: '12px' }}>{branchName}</span>
            </div>
          </div>

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
                <span className="portal-chip__label">Actor</span>
                <strong className="portal-chip__value">{actorLabel}</strong>
              </div>
              <div className="portal-chip">
                <span className="portal-chip__label">Capa</span>
                <strong className="portal-chip__value">{currentScopeLabel}</strong>
              </div>
              <div className="portal-chip">
                <span className="portal-chip__label">Comercio</span>
                <strong className="portal-chip__value">{merchantName}</strong>
              </div>
              <div className="portal-chip">
                <span className="portal-chip__label">Sucursal</span>
                <strong className="portal-chip__value">{branchName}</strong>
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
