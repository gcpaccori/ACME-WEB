import { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminDataTable } from '../../../../../components/admin/AdminDataTable';
import { AdminPageFrame, SectionCard, StatusPill } from '../../../../../components/admin/AdminScaffold';
import { LoadingScreen } from '../../../../../components/shared/LoadingScreen';
import { getPortalActorLabel, getScopeLabel } from '../../../../../core/auth/portalAccess';
import { AppRoutes } from '../../../../../core/constants/routes';
import { adminPlatformService, PlatformMerchantRecord } from '../../../../../core/services/adminPlatformService';
import { PortalContext } from '../../../../auth/session/PortalContext';

function formatDateTime(value: string) {
  if (!value) return 'Sin fecha';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
}

function getStatusTone(status: string) {
  const normalized = status.trim().toLowerCase();
  if (normalized === 'active') return 'success' as const;
  if (normalized === 'paused') return 'warning' as const;
  if (normalized === 'inactive') return 'danger' as const;
  return 'neutral' as const;
}

export function PlatformBusinessesPage() {
  const portal = useContext(PortalContext);
  const [records, setRecords] = useState<PlatformMerchantRecord[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const result = await adminPlatformService.fetchMerchants();
      setLoading(false);
      if (result.error) {
        setError(result.error.message);
        return;
      }
      setRecords(result.data ?? []);
    };

    load();
  }, []);

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return records;
    return records.filter((record) =>
      [record.trade_name, record.legal_name, record.email, record.phone, record.owner_label, record.status].join(' ').toLowerCase().includes(normalizedQuery)
    );
  }, [query, records]);

  if (portal.currentScopeType !== 'platform') {
    return <div>Esta vista pertenece a la capa plataforma.</div>;
  }

  return (
    <AdminPageFrame
      title="Comercios"
      description="Padron de negocios de la plataforma con actividad, responsables y salud operacional."
      breadcrumbs={[
        { label: 'Admin', to: AppRoutes.portal.admin.root },
        { label: 'Comercios' },
      ]}
      contextItems={[
        { label: 'Capa', value: getScopeLabel(portal.currentScopeType), tone: 'info' },
        { label: 'Actor', value: getPortalActorLabel({ roleAssignments: portal.roleAssignments, profile: portal.profile, staffAssignment: portal.staffAssignment }), tone: 'info' },
        { label: 'Entidad', value: 'Merchants', tone: 'warning' },
        { label: 'Modo', value: 'Supervision', tone: 'warning' },
      ]}
    >
      <SectionCard title="Buscar negocio" description="Filtra por nombre, responsable, estado o contacto.">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar comercio..."
          style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #d1d5db' }}
        />
      </SectionCard>

      <SectionCard title="Negocios registrados" description="Esta vista es la entrada del admin general para supervisar negocios completos, no solo un comercio actual.">
        {loading ? (
          <LoadingScreen />
        ) : error ? (
          <div style={{ color: '#b91c1c' }}>{error}</div>
        ) : (
          <AdminDataTable
            rows={filteredRecords}
            getRowId={(record) => record.id}
            emptyMessage="No hay comercios registrados."
            columns={[
              {
                id: 'merchant',
                header: 'Comercio',
                render: (record) => (
                  <div style={{ display: 'grid', gap: '6px' }}>
                    <strong>{record.trade_name || 'Sin nombre comercial'}</strong>
                    <span style={{ color: '#6b7280' }}>{record.legal_name || 'Sin razon social'}</span>
                    <span style={{ color: '#6b7280' }}>{record.owner_label}</span>
                  </div>
                ),
              },
              {
                id: 'operations',
                header: 'Operacion',
                render: (record) => (
                  <div style={{ display: 'grid', gap: '6px' }}>
                    <span>{record.branches_count} sucursales / {record.active_branches_count} abiertas</span>
                    <span style={{ color: '#6b7280' }}>{record.orders_count} pedidos / {record.active_orders_count} activos</span>
                  </div>
                ),
              },
              {
                id: 'growth',
                header: 'Equipo y promos',
                render: (record) => (
                  <div style={{ display: 'grid', gap: '6px' }}>
                    <span>{record.staff_count} personas</span>
                    <span style={{ color: '#6b7280' }}>{record.promotions_count} promociones activas</span>
                  </div>
                ),
              },
              {
                id: 'status',
                header: 'Estado',
                render: (record) => <StatusPill label={record.status || 'sin estado'} tone={getStatusTone(record.status)} />,
              },
              {
                id: 'created',
                header: 'Alta',
                render: (record) => formatDateTime(record.created_at),
              },
              {
                id: 'action',
                header: 'Accion',
                align: 'right',
                width: '170px',
                render: (record) => (
                  <Link to={AppRoutes.portal.admin.platformBusinessDetail.replace(':merchantId', record.id)} style={{ color: '#2563eb', fontWeight: 700 }}>
                    Abrir comercio
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
