import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminDataTable } from '../../../../components/admin/AdminDataTable';
import { AdminPageFrame, SectionCard, StatusPill } from '../../../../components/admin/AdminScaffold';
import { LoadingScreen } from '../../../../components/shared/LoadingScreen';
import { getPortalActorLabel, getScopeLabel } from '../../../../core/auth/portalAccess';
import { getAdminOrderStatusLabel, getAdminOrderStatusTone } from '../../../../core/admin/utils/orderWorkflow';
import { AppRoutes } from '../../../../core/constants/routes';
import { adminBranchOperationsService, BranchTurnOverview } from '../../../../core/services/adminBranchOperationsService';
import { PortalContext } from '../../../auth/session/PortalContext';

function formatDateTime(value: string) {
  if (!value) return 'Sin fecha';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(parsed);
}

function normalizeId(value: string | null | undefined) {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (!normalized || normalized === 'null' || normalized === 'undefined') {
    return null;
  }
  return String(value);
}

export function BranchTurnPage() {
  const portal = useContext(PortalContext);
  const merchantId = normalizeId(portal.currentMerchant?.id ?? portal.merchant?.id);
  const branchId = normalizeId(portal.currentBranch?.id);
  const [overview, setOverview] = useState<BranchTurnOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!merchantId || !branchId) return;
      setLoading(true);
      setError(null);
      const result = await adminBranchOperationsService.fetchTurnOverview(merchantId, branchId, portal.sessionUserId);
      setLoading(false);
      if (result.error) {
        setError(result.error.message);
        return;
      }
      setOverview(result.data ?? null);
    };

    load();
  }, [branchId, merchantId, portal.sessionUserId]);

  if (!merchantId || !branchId) {
    return <div>No hay sucursal activa para operar el turno.</div>;
  }

  if (portal.currentScopeType !== 'branch') {
    return <div>Esta vista pertenece a la capa sucursal.</div>;
  }

  return (
    <AdminPageFrame
      title="Turno"
      description="Centro rapido del turno actual con colas de pedidos, conversaciones abiertas y alertas pendientes."
      breadcrumbs={[
        { label: 'Admin', to: AppRoutes.portal.admin.root },
        { label: 'Turno' },
      ]}
      contextItems={[
        { label: 'Capa', value: getScopeLabel(portal.currentScopeType), tone: 'info' },
        { label: 'Actor', value: getPortalActorLabel({ roleAssignments: portal.roleAssignments, profile: portal.profile, staffAssignment: portal.staffAssignment }), tone: 'info' },
        { label: 'Comercio', value: portal.currentMerchant?.name || 'sin comercio', tone: 'neutral' },
        { label: 'Sucursal', value: portal.currentBranch?.name || 'sin sucursal', tone: 'neutral' },
        { label: 'Modo', value: 'Turno activo', tone: 'warning' },
      ]}
    >
      {loading ? (
        <LoadingScreen />
      ) : error ? (
        <div style={{ color: '#b91c1c' }}>{error}</div>
      ) : (
        <>
          <SectionCard title="Lectura del turno" description="Estas metricas se alimentan del branch actual y sirven para abrir la cola correcta sin navegar a ciegas.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
              {[
                { label: 'Pedidos activos', value: String(overview?.summary.active_orders ?? 0) },
                { label: 'Pedidos listos', value: String(overview?.summary.ready_orders ?? 0) },
                { label: 'Incidencias', value: String(overview?.summary.issues_orders ?? 0) },
                { label: 'Chats abiertos', value: String(overview?.summary.open_conversations ?? 0) },
                { label: 'Mensajes sin leer', value: String(overview?.summary.unread_messages ?? 0) },
                { label: 'Notificaciones pendientes', value: String(overview?.summary.pending_notifications ?? 0) },
              ].map((item) => (
                <div key={item.label} style={{ padding: '14px', borderRadius: '14px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <div style={{ color: '#6b7280', fontSize: '13px' }}>{item.label}</div>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Cola de pedidos" description="Resumen rapido del turno sobre orders, delivery y estado.">
            <AdminDataTable
              rows={overview?.orders ?? []}
              getRowId={(record) => record.id}
              emptyMessage="No hay pedidos para el turno actual."
              columns={[
                {
                  id: 'order',
                  header: 'Pedido',
                  render: (record) => (
                    <div style={{ display: 'grid', gap: '6px' }}>
                      <strong>#{record.order_code}</strong>
                      <span style={{ color: '#6b7280' }}>{record.customer_label}</span>
                    </div>
                  ),
                },
                { id: 'delivery', header: 'Entrega', render: (record) => record.address_label || 'Sin direccion' },
                { id: 'status', header: 'Estado', render: (record) => <StatusPill label={getAdminOrderStatusLabel(record.status)} tone={getAdminOrderStatusTone(record.status)} /> },
                { id: 'payment', header: 'Pago', render: (record) => record.payment_label || 'Sin metodo' },
                {
                  id: 'action',
                  header: 'Accion',
                  align: 'right',
                  width: '160px',
                  render: (record) => (
                    <Link to={AppRoutes.portal.admin.orderDetail.replace(':orderId', record.id)} style={{ color: '#2563eb', fontWeight: 700 }}>
                      Abrir ficha
                    </Link>
                  ),
                },
              ]}
            />
          </SectionCard>

          <SectionCard title="Conversaciones abiertas" description="Soporte del turno ligado a conversations, messages y notificaciones de la sucursal.">
            <AdminDataTable
              rows={overview?.conversations ?? []}
              getRowId={(record) => record.id}
              emptyMessage="No hay conversaciones visibles para esta sucursal."
              columns={[
                {
                  id: 'conversation',
                  header: 'Conversacion',
                  render: (record) => (
                    <div style={{ display: 'grid', gap: '6px' }}>
                      <strong>{record.conversation_type || 'Sin tipo'}</strong>
                      <span style={{ color: '#6b7280' }}>{record.participants_summary}</span>
                    </div>
                  ),
                },
                { id: 'order', header: 'Pedido', render: (record) => (record.order_code ? `#${record.order_code}` : 'Sin pedido') },
                { id: 'last', header: 'Ultimo mensaje', render: (record) => record.last_message_preview || 'Sin mensaje' },
                {
                  id: 'status',
                  header: 'Estado',
                  render: (record) => (
                    <div style={{ display: 'grid', gap: '6px' }}>
                      <StatusPill label={record.status || 'sin estado'} tone={record.status === 'open' ? 'success' : 'warning'} />
                      {record.unread_count > 0 ? <StatusPill label={`${record.unread_count} sin leer`} tone="warning" /> : null}
                    </div>
                  ),
                },
                {
                  id: 'action',
                  header: 'Accion',
                  align: 'right',
                  width: '160px',
                  render: (record) => (
                    <Link to={AppRoutes.portal.admin.messageDetail.replace(':conversationId', record.id)} style={{ color: '#2563eb', fontWeight: 700 }}>
                      Ver chat
                    </Link>
                  ),
                },
              ]}
            />
          </SectionCard>

          <SectionCard title="Alertas del turno" description="notifications se exponen aqui como panel rapido de atencion inmediata.">
            <AdminDataTable
              rows={overview?.notifications ?? []}
              getRowId={(record) => record.id}
              emptyMessage="No hay alertas pendientes en esta sucursal."
              columns={[
                {
                  id: 'title',
                  header: 'Alerta',
                  render: (record) => (
                    <div style={{ display: 'grid', gap: '6px' }}>
                      <strong>{record.title || 'Sin titulo'}</strong>
                      <span style={{ color: '#6b7280' }}>{record.body || 'Sin cuerpo'}</span>
                    </div>
                  ),
                },
                { id: 'target', header: 'Destino', render: (record) => record.user_label || 'Sin usuario' },
                { id: 'status', header: 'Estado', render: (record) => <StatusPill label={record.status || 'pending'} tone={record.status === 'read' ? 'success' : 'warning'} /> },
                { id: 'created', header: 'Fecha', render: (record) => formatDateTime(record.created_at) },
              ]}
            />
          </SectionCard>
        </>
      )}
    </AdminPageFrame>
  );
}
