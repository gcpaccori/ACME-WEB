import { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminDataTable } from '../../../../components/admin/AdminDataTable';
import { AdminPageFrame, SectionCard, StatusPill } from '../../../../components/admin/AdminScaffold';
import { LoadingScreen } from '../../../../components/shared/LoadingScreen';
import { TextField } from '../../../../components/ui/TextField';
import { AppRoutes } from '../../../../core/constants/routes';
import { adminCustomersService, CustomerAdminRecord } from '../../../../core/services/adminCustomersService';
import { PortalContext } from '../../../auth/session/PortalContext';

function formatMoney(value: number, currency = 'PEN') {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDateTime(value: string) {
  if (!value) return 'Sin compras';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
}

export function CustomersAdminPage() {
  const portal = useContext(PortalContext);
  const merchantId = portal.merchant?.id;
  const [query, setQuery] = useState('');
  const [records, setRecords] = useState<CustomerAdminRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!merchantId) return;
      setLoading(true);
      setError(null);
      const result = await adminCustomersService.fetchCustomers(merchantId);
      setLoading(false);
      if (result.error) {
        setError(result.error.message);
        return;
      }
      setRecords(result.data ?? []);
    };

    load();
  }, [merchantId]);

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return records;
    return records.filter((record) =>
      [record.full_name, record.email, record.phone].some((value) => value.toLowerCase().includes(normalizedQuery))
    );
  }, [query, records]);

  if (!merchantId) {
    return <div>No hay comercio activo para gestionar clientes.</div>;
  }

  return (
    <AdminPageFrame
      title="Clientes"
      description="Lista comercial del comercio actual con acceso a la ficha completa de cada cliente."
      breadcrumbs={[
        { label: 'Admin', to: AppRoutes.portal.admin.root },
        { label: 'Clientes' },
      ]}
      contextItems={[
        { label: 'Rol', value: portal.staffAssignment?.role || 'sin rol', tone: 'info' },
        { label: 'Comercio', value: portal.merchant?.name || 'sin comercio', tone: 'neutral' },
        { label: 'Entidad', value: 'Cliente', tone: 'info' },
        { label: 'Modo', value: 'Consulta', tone: 'info' },
      ]}
    >
      <SectionCard title="Buscar cliente" description="Filtra por nombre, email o telefono para entrar a la ficha correcta.">
        <TextField value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cliente..." />
      </SectionCard>

      <SectionCard title="Clientes del comercio" description="Se listan clientes con pedidos o carritos vinculados al comercio actual.">
        {loading ? (
          <LoadingScreen />
        ) : error ? (
          <div style={{ color: '#b91c1c' }}>{error}</div>
        ) : (
          <AdminDataTable
            rows={filteredRecords}
            getRowId={(record) => record.id}
            emptyMessage="No hay clientes relacionados al comercio actual."
            columns={[
              {
                id: 'customer',
                header: 'Cliente',
                render: (record) => (
                  <div style={{ display: 'grid', gap: '6px' }}>
                    <strong>{record.full_name || 'Sin nombre'}</strong>
                    <span style={{ color: '#6b7280' }}>{record.email || 'Sin email'}</span>
                    <span style={{ color: '#6b7280' }}>{record.phone || 'Sin telefono'}</span>
                  </div>
                ),
              },
              {
                id: 'activity',
                header: 'Actividad',
                render: (record) => (
                  <div style={{ display: 'grid', gap: '6px' }}>
                    <span>{record.order_count} pedidos</span>
                    <span style={{ color: '#6b7280' }}>{record.active_cart_count} carritos activos</span>
                    <span style={{ color: '#6b7280' }}>Ultima compra: {formatDateTime(record.last_order_at)}</span>
                  </div>
                ),
              },
              {
                id: 'value',
                header: 'Valor',
                render: (record) => (
                  <div style={{ display: 'grid', gap: '6px' }}>
                    <strong>{formatMoney(record.total_spent)}</strong>
                    <span style={{ color: '#6b7280' }}>Rating: {record.rating_avg.toFixed(1)}</span>
                  </div>
                ),
              },
              {
                id: 'status',
                header: 'Estado',
                render: (record) => (
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <StatusPill label={record.is_active ? 'Activo' : 'Inactivo'} tone={record.is_active ? 'success' : 'warning'} />
                    <StatusPill label={record.default_role || 'customer'} tone="info" />
                  </div>
                ),
              },
              {
                id: 'action',
                header: 'Accion',
                align: 'right',
                width: '160px',
                render: (record) => (
                  <Link to={AppRoutes.portal.admin.customerDetail.replace(':customerId', record.id)} style={{ color: '#2563eb', fontWeight: 700 }}>
                    Abrir ficha
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
