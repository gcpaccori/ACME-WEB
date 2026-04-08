import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AdminPageFrame, SectionCard, StatusPill } from '../../../../components/admin/AdminScaffold';
import { AdminDataTable } from '../../../../components/admin/AdminDataTable';
import { adminModules, getEntityRootsByModule } from '../../../../core/admin/registry/moduleRegistry';
import { PortalContext } from '../../../auth/session/PortalContext';

export function AdminDashboardPage() {
  const portal = useContext(PortalContext);

  return (
    <AdminPageFrame
      title="Modo admin"
      description="Panel base para operar el negocio con vistas compuestas, contexto visible y crecimiento dirigido por registry."
      breadcrumbs={[
        { label: 'Admin' },
        { label: 'Resumen' },
      ]}
      contextItems={[
        { label: 'Rol', value: portal.staffAssignment?.role || 'sin rol', tone: 'info' },
        { label: 'Comercio', value: portal.merchant?.name || 'sin comercio', tone: 'neutral' },
        { label: 'Sucursal', value: portal.currentBranch?.name || 'sin sucursal', tone: 'neutral' },
        { label: 'Modo', value: 'Consulta', tone: 'success' },
        { label: 'Estado', value: 'Sin cambios', tone: 'success' },
      ]}
    >
      <SectionCard title="Modulos del admin" description="El shell ya se alimenta de un registry central. Los modulos deshabilitados marcan las siguientes fases del plan.">
        <AdminDataTable
          rows={adminModules}
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
              id: 'roots',
              header: 'Entidades raiz',
              render: (module) => (
                <div style={{ color: '#374151' }}>
                  {getEntityRootsByModule(module.id).map((entity) => entity.singularLabel).join(', ') || 'Sin definir'}
                </div>
              ),
            },
            {
              id: 'status',
              header: 'Estado',
              render: (module) => (
                <StatusPill label={module.enabled ? 'Disponible' : 'Planificado'} tone={module.enabled ? 'success' : 'warning'} />
              ),
            },
            {
              id: 'action',
              header: 'Accion',
              align: 'right',
              width: '180px',
              render: (module) =>
                module.enabled && module.route ? (
                  <Link to={module.route} style={{ color: '#2563eb', fontWeight: 700 }}>
                    Abrir modulo
                  </Link>
                ) : (
                  <span style={{ color: '#9ca3af' }}>Pendiente</span>
                ),
            },
          ]}
        />
      </SectionCard>
    </AdminPageFrame>
  );
}
