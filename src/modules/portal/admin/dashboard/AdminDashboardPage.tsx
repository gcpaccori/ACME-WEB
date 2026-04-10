import { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminDataTable } from '../../../../components/admin/AdminDataTable';
import { AdminPageFrame, SectionCard, StatusPill } from '../../../../components/admin/AdminScaffold';
import { LoadingScreen } from '../../../../components/shared/LoadingScreen';
import { canAccessAdminModule, getPortalActorLabel, getScopeDescription, getScopeLabel } from '../../../../core/auth/portalAccess';
import { getEnabledAdminModules, getEntityRootsByModule } from '../../../../core/admin/registry/moduleRegistry';
import { AppRoutes } from '../../../../core/constants/routes';
import { adminOverviewService, AdminMetricCard } from '../../../../core/services/adminOverviewService';
import { PortalContext } from '../../../auth/session/PortalContext';

export function AdminDashboardPage() {
  const portal = useContext(PortalContext);
  const [metrics, setMetrics] = useState<AdminMetricCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleModules = useMemo(
    () =>
      getEnabledAdminModules({
        scopeType: portal.currentScopeType,
        hasMerchant: !!portal.currentMerchant,
        hasBranch: !!portal.currentBranch,
      }).filter((module) => canAccessAdminModule(module.id, portal.permissions)),
    [portal.currentScopeType, portal.currentMerchant, portal.currentBranch, portal.permissions]
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const result = await adminOverviewService.fetchMetricCards({
        scopeType: portal.currentScopeType,
        merchantId: portal.currentMerchant?.id,
        branchId: portal.currentBranch?.id,
      });
      setLoading(false);
      if (result.error) {
        setError(result.error.message);
        return;
      }
      setMetrics(result.data ?? []);
    };

    load();
  }, [portal.currentBranch?.id, portal.currentMerchant?.id, portal.currentScopeType]);

  const actorLabel = getPortalActorLabel({
    roleAssignments: portal.roleAssignments,
    profile: portal.profile,
    staffAssignment: portal.staffAssignment,
  });
  const isPlatformScope = portal.currentScopeType === 'platform';
  const businessLabel = isPlatformScope ? 'Todos los negocios' : portal.currentMerchant?.name || 'No aplica';
  const branchLabel = isPlatformScope
    ? 'No aplica'
    : portal.currentScopeType === 'branch'
      ? portal.currentBranch?.name || 'No aplica'
      : `${portal.branches.length} sucursales visibles`;

  return (
    <AdminPageFrame
      title={`Resumen ${getScopeLabel(portal.currentScopeType).toLowerCase()}`}
      description={getScopeDescription(portal.currentScopeType)}
      breadcrumbs={[
        { label: 'Admin' },
        { label: 'Resumen' },
      ]}
      contextItems={[
        { label: 'Capa', value: getScopeLabel(portal.currentScopeType), tone: 'info' },
        { label: 'Perfil', value: actorLabel, tone: 'info' },
        { label: isPlatformScope ? 'Cobertura' : 'Comercio', value: isPlatformScope ? 'Plataforma completa' : businessLabel, tone: 'neutral' },
        { label: isPlatformScope ? 'Negocios visibles' : 'Sucursal', value: isPlatformScope ? String(portal.businessAssignments.length || 0) : branchLabel, tone: 'neutral' },
        { label: 'Modulos', value: String(visibleModules.length), tone: 'success' },
      ]}
    >
      <SectionCard title="Lectura del alcance actual" description="Estas metricas ya salen de la base de datos segun la capa y el alcance en el que esta trabajando el usuario.">
        {loading ? (
          <LoadingScreen />
        ) : error ? (
          <div style={{ color: '#b91c1c' }}>{error}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {metrics.map((metric) => (
              <div
                key={metric.id}
                style={{
                  padding: '18px',
                  borderRadius: '18px',
                  background: 'rgba(255,255,255,0.92)',
                  border: '1px solid var(--acme-border)',
                  boxShadow: 'var(--acme-shadow-sm)',
                  display: 'grid',
                  gap: '8px',
                }}
              >
                <span style={{ color: 'var(--acme-text-muted)', fontSize: '12px', textTransform: 'uppercase', fontWeight: 800 }}>{metric.label}</span>
                <strong style={{ fontSize: '32px', lineHeight: 1 }}>{metric.value}</strong>
                <span style={{ color: 'var(--acme-text-muted)', fontSize: '13px' }}>{metric.help}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Que gobiernas desde esta capa" description="El menu se filtra por alcance real. Lo que no aplica aqui deja de presentarse como si estuviera disponible.">
        <AdminDataTable
          rows={visibleModules}
          getRowId={(module) => module.id}
          columns={[
            {
              id: 'module',
              header: 'Modulo',
              render: (module) => (
                <div style={{ display: 'grid', gap: '6px' }}>
                  <strong>{module.label}</strong>
                  <span style={{ color: '#6b7280' }}>{module.description}</span>
                </div>
              ),
            },
            {
              id: 'scope',
              header: 'Capa',
              render: (module) => (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {module.scopeVisibility.map((scope) => (
                    <StatusPill key={scope} label={getScopeLabel(scope)} tone={portal.currentScopeType === scope ? 'info' : 'neutral'} />
                  ))}
                </div>
              ),
            },
            {
              id: 'roots',
              header: 'Entidades raiz',
              render: (module) => (
                <span style={{ color: '#374151' }}>
                  {getEntityRootsByModule(module.id)
                    .map((entity) => entity.singularLabel)
                    .join(', ') || 'Sin definir'}
                </span>
              ),
            },
            {
              id: 'action',
              header: 'Accion',
              align: 'right',
              width: '180px',
              render: (module) => (
                <Link to={module.route} style={{ color: '#2563eb', fontWeight: 700 }}>
                  Abrir modulo
                </Link>
              ),
            },
          ]}
        />
      </SectionCard>

      <SectionCard title="Cambio de capa" description="Si el usuario tiene varias responsabilidades, puede cambiar entre plataforma, negocio y sucursal desde el contexto de trabajo sin reiniciar sesion.">
        <div style={{ display: 'grid', gap: '10px' }}>
          {portal.availableScopeTypes.map((scope) => (
            <div
              key={scope}
              style={{
                padding: '14px 16px',
                borderRadius: '14px',
                border: `1px solid ${portal.currentScopeType === scope ? 'rgba(77, 20, 140, 0.20)' : 'var(--acme-border)'}`,
                background: portal.currentScopeType === scope ? 'rgba(77, 20, 140, 0.06)' : 'rgba(255,255,255,0.75)',
                display: 'grid',
                gap: '6px',
              }}
            >
              <strong>{getScopeLabel(scope)}</strong>
              <span style={{ color: '#6b7280' }}>{getScopeDescription(scope)}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </AdminPageFrame>
  );
}
