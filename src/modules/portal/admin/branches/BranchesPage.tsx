import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminPageFrame, SectionCard, StatusPill } from '../../../../components/admin/AdminScaffold';
import { AdminDataTable } from '../../../../components/admin/AdminDataTable';
import { LoadingScreen } from '../../../../components/shared/LoadingScreen';
import { AppRoutes } from '../../../../core/constants/routes';
import { adminService, BranchAdminSummary } from '../../../../core/services/adminService';
import { PortalContext } from '../../../auth/session/PortalContext';

export function BranchesPage() {
  const portal = useContext(PortalContext);
  const merchantId = portal.merchant?.id;
  const [branches, setBranches] = useState<BranchAdminSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!merchantId) return;
      setLoading(true);
      const result = await adminService.fetchBranches(merchantId);
      setLoading(false);
      if (result.error) {
        setError(result.error.message);
        return;
      }
      setBranches(result.data ?? []);
    };

    load();
  }, [merchantId]);

  if (!merchantId) {
    return <div>No hay comercio activo para gestionar sucursales.</div>;
  }

  return (
    <AdminPageFrame
      title="Sucursales"
      description="Listado relacional de sucursales con direccion y estado operativo ya resueltos."
      breadcrumbs={[
        { label: 'Admin', to: AppRoutes.portal.admin.root },
        { label: 'Sucursales' },
      ]}
      contextItems={[
        { label: 'Rol', value: portal.staffAssignment?.role || 'sin rol', tone: 'info' },
        { label: 'Comercio', value: portal.merchant?.name || 'sin comercio', tone: 'neutral' },
        { label: 'Entidad', value: 'Sucursal', tone: 'info' },
        { label: 'Modo', value: 'Consulta', tone: 'success' },
        { label: 'Estado', value: 'Sin cambios', tone: 'success' },
      ]}
      actions={
        <Link
          to={AppRoutes.portal.admin.branchNew}
          style={{ padding: '12px 16px', borderRadius: '10px', background: '#111827', color: '#ffffff', fontWeight: 600 }}
        >
          Nueva sucursal
        </Link>
      }
    >
      <SectionCard title="Sucursales registradas" description="Cada fila abre el editor compuesto de sucursal con horarios, cierres y cobertura.">
        {loading ? (
          <LoadingScreen />
        ) : error ? (
          <div style={{ color: '#b91c1c' }}>{error}</div>
        ) : (
          <AdminDataTable
            rows={branches}
            getRowId={(branch) => branch.id}
            emptyMessage="No hay sucursales registradas."
            columns={[
              {
                id: 'name',
                header: 'Sucursal',
                render: (branch) => (
                  <div style={{ display: 'grid', gap: '6px' }}>
                    <strong>{branch.name}</strong>
                    <span style={{ color: '#6b7280' }}>{branch.address_text}</span>
                  </div>
                ),
              },
              {
                id: 'phone',
                header: 'Telefono',
                render: (branch) => branch.phone || 'No definido',
              },
              {
                id: 'prep',
                header: 'Preparacion',
                render: (branch) => `${branch.prep_time_avg_min} min`,
              },
              {
                id: 'status',
                header: 'Operacion',
                render: (branch) => (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <StatusPill label={branch.is_open ? 'Abierta' : 'Cerrada'} tone={branch.is_open ? 'success' : 'danger'} />
                    <StatusPill label={branch.accepts_orders ? 'Acepta pedidos' : 'No acepta pedidos'} tone={branch.accepts_orders ? 'info' : 'warning'} />
                  </div>
                ),
              },
              {
                id: 'action',
                header: 'Accion',
                align: 'right',
                width: '140px',
                render: (branch) => (
                  <Link to={`/portal/admin/branches/${branch.id}`} style={{ color: '#2563eb', fontWeight: 700 }}>
                    Editar
                  </Link>
                ),
              },
            ]}
          />
        )}
      </SectionCard>
    </AdminPageFrame>
  );
}
