import { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FieldGroup, SelectField, TextAreaField } from '../../../../components/admin/AdminFields';
import { AdminDataTable } from '../../../../components/admin/AdminDataTable';
import { AdminModalForm } from '../../../../components/admin/AdminModalForm';
import { AdminPageFrame, FormStatusBar, SectionCard, StatusPill } from '../../../../components/admin/AdminScaffold';
import { LoadingScreen } from '../../../../components/shared/LoadingScreen';
import { TextField } from '../../../../components/ui/TextField';
import { getPortalActorLabel, getScopeLabel } from '../../../../core/auth/portalAccess';
import { AppRoutes } from '../../../../core/constants/routes';
import { adminMessagesService, ConversationCreateForm, MessagesOverview, NotificationOverviewRecord } from '../../../../core/services/adminMessagesService';
import { PortalContext } from '../../../auth/session/PortalContext';

function formatDateTime(value: string) {
  if (!value) return 'Sin fecha';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(parsed);
}

function getStatusTone(status: string) {
  const normalized = status.trim().toLowerCase();
  if (normalized === 'open' || normalized === 'sent') return 'success' as const;
  if (normalized === 'pending') return 'warning' as const;
  if (normalized === 'closed' || normalized === 'resolved' || normalized === 'read') return 'info' as const;
  return 'neutral' as const;
}

function getNotificationLink(record: NotificationOverviewRecord) {
  if (record.entity_type === 'conversation' && record.entity_id) {
    return AppRoutes.portal.admin.messageDetail.replace(':conversationId', record.entity_id);
  }
  if (record.entity_type === 'order' && record.entity_id) {
    return AppRoutes.portal.admin.orderDetail.replace(':orderId', record.entity_id);
  }
  return '';
}

export function MessagesAdminPage() {
  const portal = useContext(PortalContext);
  const merchantId = portal.merchant?.id;
  const branchId = portal.currentScopeType === 'branch' ? portal.currentBranch?.id ?? null : null;
  const sessionUserId = portal.sessionUserId;
  const [query, setQuery] = useState('');
  const [overview, setOverview] = useState<MessagesOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<ConversationCreateForm>(adminMessagesService.createEmptyConversationForm());

  const conversationTypeOptions = useMemo(
    () => [
      { value: 'order_support', label: 'Soporte de pedido' },
      { value: 'customer_chat', label: 'Cliente' },
      { value: 'driver_chat', label: 'Reparto' },
      { value: 'internal', label: 'Interna' },
    ],
    []
  );

  const statusOptions = useMemo(
    () => [
      { value: 'open', label: 'Abierta' },
      { value: 'pending', label: 'Pendiente' },
      { value: 'resolved', label: 'Resuelta' },
      { value: 'closed', label: 'Cerrada' },
    ],
    []
  );

  const roleOptions = useMemo(
    () => [
      { value: 'customer', label: 'Cliente' },
      { value: 'driver', label: 'Repartidor' },
      { value: 'staff', label: 'Staff' },
      { value: 'support', label: 'Soporte' },
    ],
    []
  );

  const loadData = async () => {
    if (!merchantId) return;
    setLoading(true);
    setError(null);
    const result = await adminMessagesService.fetchMessagesOverview(merchantId, sessionUserId, branchId);
    setLoading(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setOverview(result.data ?? null);
  };

  useEffect(() => {
    loadData();
  }, [branchId, merchantId, sessionUserId]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredConversations = useMemo(() => {
    const rows = overview?.conversations ?? [];
    if (!normalizedQuery) return rows;
    return rows.filter((row) =>
      [row.order_code, row.branch_label, row.conversation_type, row.status, row.participants_summary, row.last_message_preview]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [overview?.conversations, normalizedQuery]);

  const filteredNotifications = useMemo(() => {
    const rows = overview?.notifications ?? [];
    if (!normalizedQuery) return rows;
    return rows.filter((row) =>
      [row.user_label, row.title, row.body, row.type, row.status, row.entity_type].join(' ').toLowerCase().includes(normalizedQuery)
    );
  }, [overview?.notifications, normalizedQuery]);

  const handleCreateConversation = async () => {
    if (!merchantId || !sessionUserId) return;
    setMutating(true);
    setError(null);
    const result = await adminMessagesService.createConversation(merchantId, sessionUserId, form);
    setMutating(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setCreateOpen(false);
    setForm(adminMessagesService.createEmptyConversationForm());
    setSuccessMessage('Conversacion creada');
    await loadData();
  };

  const handleNotificationRead = async (notificationId: string) => {
    setMutating(true);
    setError(null);
    const result = await adminMessagesService.markNotificationRead(notificationId);
    setMutating(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setSuccessMessage('Notificacion actualizada');
    await loadData();
  };

  if (!merchantId) {
    return <div>No hay comercio activo para administrar mensajes.</div>;
  }

  return (
    <AdminPageFrame
      title="Mensajes"
      description="Conversaciones operativas del negocio y centro de notificaciones del equipo."
      breadcrumbs={[
        { label: 'Admin', to: AppRoutes.portal.admin.root },
        { label: 'Mensajes' },
      ]}
      contextItems={[
        { label: 'Capa', value: getScopeLabel(portal.currentScopeType), tone: 'info' },
        { label: 'Actor', value: getPortalActorLabel({ roleAssignments: portal.roleAssignments, profile: portal.profile, staffAssignment: portal.staffAssignment }), tone: 'info' },
        { label: 'Comercio', value: portal.merchant?.name || 'sin comercio', tone: 'neutral' },
        { label: 'Sucursal', value: portal.currentScopeType === 'branch' ? portal.currentBranch?.name || 'sin sucursal' : 'Todas', tone: portal.currentScopeType === 'branch' ? 'neutral' : 'warning' },
        { label: 'Entidad', value: 'Mensajes', tone: 'info' },
        { label: 'Modo', value: 'Soporte', tone: 'warning' },
      ]}
      actions={
        <button
          type="button"
          onClick={() => {
            setSuccessMessage(null);
            setForm(adminMessagesService.createEmptyConversationForm());
            setCreateOpen(true);
          }}
          style={{ padding: '12px 16px', borderRadius: '10px', background: '#111827', color: '#ffffff', fontWeight: 700 }}
        >
          Nueva conversacion
        </button>
      }
    >
      <SectionCard title="Buscar" description="Filtra conversaciones y alertas por persona, pedido, texto o estado.">
        <TextField value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar..." />
      </SectionCard>

      <FormStatusBar dirty={false} saving={mutating} error={error} successMessage={successMessage} />

      {loading ? (
        <LoadingScreen />
      ) : (
        <>
          <SectionCard title="Resumen" description="Lectura rapida del frente de comunicacion del negocio.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
              {[
                { label: 'Conversaciones', value: String(overview?.conversations.length ?? 0) },
                { label: 'Abiertas', value: String((overview?.conversations ?? []).filter((item) => item.status === 'open').length) },
                { label: 'No leidas', value: String((overview?.conversations ?? []).reduce((sum, item) => sum + item.unread_count, 0)) },
                { label: 'Notificaciones', value: String(overview?.notifications.length ?? 0) },
                { label: 'Notificaciones pendientes', value: String((overview?.notifications ?? []).filter((item) => item.status !== 'read').length) },
              ].map((item) => (
                <div key={item.label} style={{ padding: '14px', borderRadius: '14px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <div style={{ color: '#6b7280', fontSize: '13px' }}>{item.label}</div>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Conversaciones" description="conversations, participants, messages y lecturas viven en esta bandeja.">
            <AdminDataTable
              rows={filteredConversations}
              getRowId={(record) => record.id}
              emptyMessage="No hay conversaciones registradas."
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
                {
                  id: 'order',
                  header: 'Pedido',
                  render: (record) =>
                    record.order_id ? (
                      <Link to={AppRoutes.portal.admin.orderDetail.replace(':orderId', record.order_id)} style={{ color: '#2563eb', fontWeight: 700 }}>
                        #{record.order_code || record.order_id}
                      </Link>
                    ) : (
                      'Sin pedido'
                    ),
                },
                {
                  id: 'activity',
                  header: 'Actividad',
                  render: (record) => (
                    <div style={{ display: 'grid', gap: '6px' }}>
                      <span>{record.last_message_preview || 'Sin mensaje'}</span>
                      <span style={{ color: '#6b7280' }}>{formatDateTime(record.last_message_at)}</span>
                    </div>
                  ),
                },
                {
                  id: 'status',
                  header: 'Estado',
                  render: (record) => (
                    <div style={{ display: 'grid', gap: '6px' }}>
                      <StatusPill label={record.status || 'sin estado'} tone={getStatusTone(record.status)} />
                      {record.unread_count > 0 ? <StatusPill label={`${record.unread_count} sin leer`} tone="warning" /> : null}
                    </div>
                  ),
                },
                {
                  id: 'action',
                  header: 'Accion',
                  align: 'right',
                  width: '150px',
                  render: (record) => (
                    <Link to={AppRoutes.portal.admin.messageDetail.replace(':conversationId', record.id)} style={{ color: '#2563eb', fontWeight: 700 }}>
                      Ver detalle
                    </Link>
                  ),
                },
              ]}
            />
          </SectionCard>

          <SectionCard title="Notificaciones" description="notifications se muestran como centro de alertas accionables del equipo.">
            <AdminDataTable
              rows={filteredNotifications}
              getRowId={(record) => record.id}
              emptyMessage="No hay notificaciones registradas."
              columns={[
                {
                  id: 'recipient',
                  header: 'Destino',
                  render: (record) => (
                    <div style={{ display: 'grid', gap: '6px' }}>
                      <strong>{record.user_label || 'Sin usuario'}</strong>
                      <span style={{ color: '#6b7280' }}>{record.channel || 'sin canal'}</span>
                    </div>
                  ),
                },
                {
                  id: 'content',
                  header: 'Contenido',
                  render: (record) => (
                    <div style={{ display: 'grid', gap: '6px' }}>
                      <strong>{record.title || 'Sin titulo'}</strong>
                      <span style={{ color: '#6b7280' }}>{record.body || 'Sin cuerpo'}</span>
                    </div>
                  ),
                },
                {
                  id: 'entity',
                  header: 'Entidad',
                  render: (record) => {
                    const target = getNotificationLink(record);
                    return target ? (
                      <Link to={target} style={{ color: '#2563eb', fontWeight: 700 }}>
                        {record.entity_type || 'entidad'}
                      </Link>
                    ) : (
                      record.entity_type || 'Sin entidad'
                    );
                  },
                },
                {
                  id: 'status',
                  header: 'Estado',
                  render: (record) => <StatusPill label={record.status || 'sin estado'} tone={getStatusTone(record.status)} />,
                },
                {
                  id: 'action',
                  header: 'Accion',
                  align: 'right',
                  width: '160px',
                  render: (record) =>
                    record.read_at ? (
                      <span style={{ color: '#6b7280' }}>Leida</span>
                    ) : (
                      <button type="button" onClick={() => handleNotificationRead(record.id)} style={{ color: '#2563eb', fontWeight: 700 }}>
                        Marcar leida
                      </button>
                    ),
                },
              ]}
            />
          </SectionCard>
        </>
      )}

      <AdminModalForm
        open={createOpen}
        title="Nueva conversacion"
        description="Crea una conversacion contextual y deja el primer mensaje listo para operar."
        onClose={() => setCreateOpen(false)}
        actions={
          <>
            <button type="button" onClick={() => setCreateOpen(false)} style={{ padding: '12px 16px' }}>
              Cancelar
            </button>
            <button type="button" onClick={handleCreateConversation} style={{ padding: '12px 16px', background: '#111827', color: '#ffffff', borderRadius: '10px' }}>
              {mutating ? 'Guardando...' : 'Crear conversacion'}
            </button>
          </>
        }
      >
        <FieldGroup label="Pedido">
          <SelectField
            value={form.order_id}
            onChange={(event) => setForm((current) => ({ ...current, order_id: event.target.value }))}
            options={[{ value: '', label: 'Sin pedido' }, ...((overview?.order_options ?? []).map((item) => ({ value: item.id, label: item.label })) as any)]}
          />
        </FieldGroup>
        <FieldGroup label="Tipo">
          <SelectField value={form.conversation_type} onChange={(event) => setForm((current) => ({ ...current, conversation_type: event.target.value }))} options={conversationTypeOptions} />
        </FieldGroup>
        <FieldGroup label="Estado inicial">
          <SelectField value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} options={statusOptions} />
        </FieldGroup>
        <FieldGroup label="Primer participante">
          <SelectField
            value={form.participant_user_id}
            onChange={(event) => setForm((current) => ({ ...current, participant_user_id: event.target.value }))}
            options={[{ value: '', label: 'Solo staff por ahora' }, ...((overview?.participant_options ?? []).map((item) => ({ value: item.id, label: item.label })) as any)]}
          />
        </FieldGroup>
        <FieldGroup label="Rol del participante">
          <SelectField value={form.participant_role} onChange={(event) => setForm((current) => ({ ...current, participant_role: event.target.value }))} options={roleOptions} />
        </FieldGroup>
        <FieldGroup label="Mensaje inicial">
          <TextAreaField value={form.initial_message} onChange={(event) => setForm((current) => ({ ...current, initial_message: event.target.value }))} placeholder="Escribe el contexto inicial..." />
        </FieldGroup>
      </AdminModalForm>
    </AdminPageFrame>
  );
}
