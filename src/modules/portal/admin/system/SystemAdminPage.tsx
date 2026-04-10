import { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FieldGroup, TextAreaField } from '../../../../components/admin/AdminFields';
import { AdminDataTable } from '../../../../components/admin/AdminDataTable';
import { AdminModalForm } from '../../../../components/admin/AdminModalForm';
import { AdminPageFrame, FormStatusBar, SectionCard } from '../../../../components/admin/AdminScaffold';
import { AdminTimeline } from '../../../../components/admin/AdminTimeline';
import { LoadingScreen } from '../../../../components/shared/LoadingScreen';
import { TextField } from '../../../../components/ui/TextField';
import { getPortalActorLabel, getScopeLabel } from '../../../../core/auth/portalAccess';
import { AppRoutes } from '../../../../core/constants/routes';
import { adminSystemService, SystemOverview, SystemSettingForm, SystemSettingRecord } from '../../../../core/services/adminSystemService';
import { PortalContext } from '../../../auth/session/PortalContext';

function formatDateTime(value: string) {
  if (!value) return 'Sin fecha';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(parsed);
}

function previewJson(value: unknown) {
  const text = JSON.stringify(value ?? {}, null, 2);
  return text.length > 120 ? `${text.slice(0, 120)}...` : text;
}

export function SystemAdminPage() {
  const portal = useContext(PortalContext);
  const sessionUserId = portal.sessionUserId;
  const [query, setQuery] = useState('');
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [settingOpen, setSettingOpen] = useState(false);
  const [settingForm, setSettingForm] = useState<SystemSettingForm>(adminSystemService.createEmptySettingForm());

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const result = await adminSystemService.fetchSystemOverview();
    setLoading(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setOverview(result.data ?? null);
  };

  useEffect(() => {
    if (portal.currentScopeType === 'platform') {
      loadData();
    }
  }, [portal.currentScopeType]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredSettings = useMemo(() => {
    const rows = overview?.settings ?? [];
    if (!normalizedQuery) return rows;
    return rows.filter((row) => [row.key, row.description, JSON.stringify(row.value_json ?? {})].join(' ').toLowerCase().includes(normalizedQuery));
  }, [overview?.settings, normalizedQuery]);

  const filteredAuditLogs = useMemo(() => {
    const rows = overview?.audit_logs ?? [];
    if (!normalizedQuery) return rows;
    return rows.filter((row) => [row.actor_label, row.entity_type, row.action, row.entity_id].join(' ').toLowerCase().includes(normalizedQuery));
  }, [overview?.audit_logs, normalizedQuery]);

  const filteredMerchantAuditLogs = useMemo(() => {
    const rows = overview?.merchant_audit_logs ?? [];
    if (!normalizedQuery) return rows;
    return rows.filter((row) => [row.user_label, row.branch_label, row.entity_type, row.action, row.entity_id].join(' ').toLowerCase().includes(normalizedQuery));
  }, [overview?.merchant_audit_logs, normalizedQuery]);

  const filteredAnalytics = useMemo(() => {
    const rows = overview?.analytics_events ?? [];
    if (!normalizedQuery) return rows;
    return rows.filter((row) => [row.user_label, row.event_name, row.order_code, JSON.stringify(row.properties_json ?? {})].join(' ').toLowerCase().includes(normalizedQuery));
  }, [overview?.analytics_events, normalizedQuery]);

  const openSettingModal = (record?: SystemSettingRecord) => {
    setSuccessMessage(null);
    setSettingForm(record ? adminSystemService.createSettingForm(record) : adminSystemService.createEmptySettingForm());
    setSettingOpen(true);
  };

  const handleSettingSave = async () => {
    if (!sessionUserId) return;
    setMutating(true);
    setError(null);
    const result = await adminSystemService.saveSetting(sessionUserId, settingForm);
    setMutating(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setSettingOpen(false);
    setSuccessMessage(settingForm.id ? 'Configuracion actualizada' : 'Configuracion creada');
    await loadData();
  };

  if (!portal.permissions.canManageSystem || portal.currentScopeType !== 'platform') {
    return (
      <AdminPageFrame
        title="Sistema"
        description="Esta vista ahora pertenece solo a plataforma."
        breadcrumbs={[
          { label: 'Admin', to: AppRoutes.portal.admin.root },
          { label: 'Sistema' },
        ]}
        contextItems={[
          { label: 'Capa', value: getScopeLabel(portal.currentScopeType), tone: 'warning' },
          { label: 'Actor', value: getPortalActorLabel({ roleAssignments: portal.roleAssignments, profile: portal.profile, staffAssignment: portal.staffAssignment }), tone: 'info' },
          { label: 'Estado', value: 'Bloqueado por alcance', tone: 'danger' },
        ]}
      >
        <SectionCard
          title="Acceso restringido"
          description="system_settings, audit_logs y analytics_events son gobierno global. El owner del negocio no deberia editar esta capa."
        >
          <Link to={AppRoutes.portal.admin.root} style={{ color: '#2563eb', fontWeight: 700 }}>
            Volver al resumen del alcance actual
          </Link>
        </SectionCard>
      </AdminPageFrame>
    );
  }

  return (
    <AdminPageFrame
      title="Sistema"
      description="Gobierno global de configuracion, auditoria y telemetria de la plataforma."
      breadcrumbs={[
        { label: 'Admin', to: AppRoutes.portal.admin.root },
        { label: 'Sistema' },
      ]}
      contextItems={[
        { label: 'Capa', value: getScopeLabel(portal.currentScopeType), tone: 'info' },
        { label: 'Actor', value: getPortalActorLabel({ roleAssignments: portal.roleAssignments, profile: portal.profile, staffAssignment: portal.staffAssignment }), tone: 'info' },
        { label: 'Entidad', value: 'System settings', tone: 'warning' },
        { label: 'Modo', value: 'Control global', tone: 'warning' },
      ]}
      actions={
        <button type="button" onClick={() => openSettingModal()} style={{ padding: '12px 16px', borderRadius: '10px', background: '#111827', color: '#ffffff', fontWeight: 700 }}>
          Nueva configuracion
        </button>
      }
    >
      <SectionCard title="Buscar" description="Filtra configuraciones, auditorias y eventos por clave, actor o accion.">
        <TextField value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar..." />
      </SectionCard>

      <FormStatusBar dirty={false} saving={mutating} error={error} successMessage={successMessage} />

      {loading ? (
        <LoadingScreen />
      ) : (
        <>
          <SectionCard title="Resumen global" description="Lectura transversal de plataforma sobre settings, auditorias y eventos de uso.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
              {[
                { label: 'Settings', value: String(overview?.settings.length ?? 0) },
                { label: 'Auditoria global', value: String(overview?.audit_logs.length ?? 0) },
                { label: 'Auditoria negocio', value: String(overview?.merchant_audit_logs.length ?? 0) },
                { label: 'Eventos analytics', value: String(overview?.analytics_events.length ?? 0) },
              ].map((item) => (
                <div key={item.label} style={{ padding: '14px', borderRadius: '14px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <div style={{ color: '#6b7280', fontSize: '13px' }}>{item.label}</div>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Configuracion global" description="system_settings deja de presentarse como configuracion del negocio y se gobierna solo desde plataforma.">
            <AdminDataTable
              rows={filteredSettings}
              getRowId={(record) => record.id}
              emptyMessage="No hay configuraciones registradas."
              columns={[
                {
                  id: 'key',
                  header: 'Clave',
                  render: (record) => (
                    <div style={{ display: 'grid', gap: '6px' }}>
                      <strong>{record.key}</strong>
                      <span style={{ color: '#6b7280' }}>{record.description || 'Sin descripcion'}</span>
                    </div>
                  ),
                },
                { id: 'value', header: 'Valor', render: (record) => <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '12px' }}>{previewJson(record.value_json)}</pre> },
                { id: 'updated', header: 'Actualizada', render: (record) => formatDateTime(record.updated_at || record.created_at) },
                {
                  id: 'action',
                  header: 'Accion',
                  align: 'right',
                  width: '140px',
                  render: (record) => (
                    <button type="button" onClick={() => openSettingModal(record)} style={{ color: '#2563eb', fontWeight: 700 }}>
                      Editar
                    </button>
                  ),
                },
              ]}
            />
          </SectionCard>

          <SectionCard title="Auditoria de negocios" description="merchant_audit_logs sigue visible aqui como supervision de lo que pasa dentro de los comercios.">
            <AdminTimeline
              items={filteredMerchantAuditLogs.slice(0, 20).map((item) => ({
                id: item.id,
                title: `${item.action || 'accion'} sobre ${item.entity_type || 'entidad'}`,
                subtitle: `${item.user_label || 'Sin usuario'} - ${item.branch_label || 'Sin sucursal'} - ${formatDateTime(item.created_at)}`,
                tone: 'info',
                body: <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '12px' }}>{previewJson(item.metadata_json)}</pre>,
              }))}
            />
          </SectionCard>

          <SectionCard title="Auditoria global" description="audit_logs registra cambios administrativos sensibles sobre la plataforma.">
            <AdminDataTable
              rows={filteredAuditLogs}
              getRowId={(record) => record.id}
              emptyMessage="No hay trazas globales disponibles."
              columns={[
                {
                  id: 'actor',
                  header: 'Actor',
                  render: (record) => (
                    <div style={{ display: 'grid', gap: '6px' }}>
                      <strong>{record.actor_label || record.actor_user_id}</strong>
                      <span style={{ color: '#6b7280' }}>{record.action || 'sin accion'}</span>
                    </div>
                  ),
                },
                { id: 'entity', header: 'Entidad', render: (record) => `${record.entity_type || 'entidad'} / ${record.entity_id || 'sin id'}` },
                { id: 'created', header: 'Fecha', render: (record) => formatDateTime(record.created_at) },
                { id: 'payload', header: 'Cambio', render: (record) => <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '12px' }}>{previewJson(record.new_values_json ?? record.old_values_json)}</pre> },
              ]}
            />
          </SectionCard>

          <SectionCard title="Eventos analytics" description="analytics_events se lee aqui como telemetria global y deja de quedar escondido dentro del negocio.">
            <AdminDataTable
              rows={filteredAnalytics}
              getRowId={(record) => record.id}
              emptyMessage="No hay eventos analytics visibles."
              columns={[
                {
                  id: 'event',
                  header: 'Evento',
                  render: (record) => (
                    <div style={{ display: 'grid', gap: '6px' }}>
                      <strong>{record.event_name || 'sin evento'}</strong>
                      <span style={{ color: '#6b7280' }}>{record.user_label || 'Sin usuario'}</span>
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
                { id: 'created', header: 'Fecha', render: (record) => formatDateTime(record.created_at) },
                { id: 'props', header: 'Propiedades', render: (record) => <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '12px' }}>{previewJson(record.properties_json)}</pre> },
              ]}
            />
          </SectionCard>
        </>
      )}

      <AdminModalForm
        open={settingOpen}
        title={settingForm.id ? 'Editar configuracion' : 'Nueva configuracion'}
        description="Define una clave global con un JSON valido."
        onClose={() => setSettingOpen(false)}
        actions={
          <>
            <button type="button" onClick={() => setSettingOpen(false)} style={{ padding: '12px 16px' }}>
              Cancelar
            </button>
            <button type="button" onClick={handleSettingSave} style={{ padding: '12px 16px', background: '#111827', color: '#ffffff', borderRadius: '10px' }}>
              {mutating ? 'Guardando...' : 'Guardar'}
            </button>
          </>
        }
      >
        <FieldGroup label="Clave">
          <TextField value={settingForm.key} onChange={(event) => setSettingForm((current) => ({ ...current, key: event.target.value }))} placeholder="platform_fees" />
        </FieldGroup>
        <FieldGroup label="Descripcion">
          <TextField
            value={settingForm.description}
            onChange={(event) => setSettingForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="Describe el uso de esta configuracion"
          />
        </FieldGroup>
        <FieldGroup label="JSON">
          <TextAreaField value={settingForm.value_json_text} onChange={(event) => setSettingForm((current) => ({ ...current, value_json_text: event.target.value }))} />
        </FieldGroup>
      </AdminModalForm>
    </AdminPageFrame>
  );
}
