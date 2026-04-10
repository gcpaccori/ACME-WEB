import { useContext, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AdminDataTable } from '../../../../../components/admin/AdminDataTable';
import { AdminPageFrame, FormStatusBar, SaveActions, SectionCard, StatusPill } from '../../../../../components/admin/AdminScaffold';
import { AdminTabPanel, AdminTabs } from '../../../../../components/admin/AdminTabs';
import { AdminTimeline } from '../../../../../components/admin/AdminTimeline';
import { FieldGroup, SelectField } from '../../../../../components/admin/AdminFields';
import { LoadingScreen } from '../../../../../components/shared/LoadingScreen';
import { TextField } from '../../../../../components/ui/TextField';
import { getPortalActorLabel, getScopeLabel } from '../../../../../core/auth/portalAccess';
import { hasDirtyState, serializeDirtyState } from '../../../../../core/admin/utils/dirtyState';
import { AppRoutes } from '../../../../../core/constants/routes';
import { MerchantAdminForm } from '../../../../../core/services/adminService';
import { adminPlatformService, PlatformMerchantDetail } from '../../../../../core/services/adminPlatformService';
import { PortalContext } from '../../../../auth/session/PortalContext';

type DetailTab = 'summary' | 'branches' | 'staff' | 'activity' | 'audit';

const statusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'paused', label: 'Pausado' },
];

function formatDateTime(value: string) {
  if (!value) return 'Sin fecha';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(parsed);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 }).format(value);
}

function getBranchTone(isOpen: boolean, acceptsOrders: boolean) {
  if (isOpen && acceptsOrders) return 'success' as const;
  if (isOpen && !acceptsOrders) return 'warning' as const;
  return 'danger' as const;
}

export function PlatformBusinessDetailPage() {
  const { merchantId = '' } = useParams();
  const portal = useContext(PortalContext);
  const [activeTab, setActiveTab] = useState<DetailTab>('summary');
  const [detail, setDetail] = useState<PlatformMerchantDetail | null>(null);
  const [form, setForm] = useState<MerchantAdminForm | null>(null);
  const [initialState, setInitialState] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = async () => {
    if (!merchantId) return;
    setLoading(true);
    setError(null);
    const result = await adminPlatformService.fetchMerchantDetail(merchantId);
    setLoading(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    const nextDetail = result.data ?? null;
    setDetail(nextDetail);
    setForm(nextDetail?.merchant ?? null);
    setInitialState(serializeDirtyState(nextDetail?.merchant ?? null));
  };

  useEffect(() => {
    loadData();
  }, [merchantId]);

  const dirty = useMemo(() => (form ? hasDirtyState(form, initialState) : false), [form, initialState]);

  const updateField = <K extends keyof MerchantAdminForm>(key: K, value: MerchantAdminForm[K]) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
    setSuccessMessage(null);
  };

  const handleSave = async () => {
    if (!merchantId || !form) return;
    setSaving(true);
    setError(null);
    const result = await adminPlatformService.saveMerchant(merchantId, form);
    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setInitialState(serializeDirtyState(form));
    setSuccessMessage('Comercio actualizado');
    await loadData();
  };

  if (portal.currentScopeType !== 'platform') {
    return <div>Esta vista pertenece a la capa plataforma.</div>;
  }

  if (loading || !detail || !form) {
    return <LoadingScreen message="Cargando comercio..." />;
  }

  return (
    <AdminPageFrame
      title={form.trade_name || 'Comercio'}
      description="Ficha de supervision de plataforma sobre identidad, sucursales, equipo y actividad del negocio."
      breadcrumbs={[
        { label: 'Admin', to: AppRoutes.portal.admin.root },
        { label: 'Comercios', to: AppRoutes.portal.admin.platformBusinesses },
        { label: form.trade_name || 'Detalle' },
      ]}
      contextItems={[
        { label: 'Capa', value: getScopeLabel(portal.currentScopeType), tone: 'info' },
        { label: 'Actor', value: getPortalActorLabel({ roleAssignments: portal.roleAssignments, profile: portal.profile, staffAssignment: portal.staffAssignment }), tone: 'info' },
        { label: 'Entidad', value: 'Merchant', tone: 'warning' },
        { label: 'Estado', value: dirty ? 'Cambios pendientes' : 'Sin cambios', tone: dirty ? 'warning' : 'success' },
      ]}
      actions={<SaveActions onSave={handleSave} isSaving={saving} disabled={!dirty} />}
    >
      <SectionCard title="Resumen ejecutivo" description="Esta ficha deja al admin general ver el negocio como unidad, no solo como comercio actual del owner.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          {[
            { label: 'Sucursales', value: String(detail.counters.branches) },
            { label: 'Sucursales abiertas', value: String(detail.counters.active_branches) },
            { label: 'Equipo', value: String(detail.counters.staff) },
            { label: 'Pedidos recientes', value: String(detail.counters.orders) },
            { label: 'Pedidos activos', value: String(detail.counters.active_orders) },
            { label: 'Promociones', value: String(detail.counters.promotions) },
            { label: 'Clientes', value: String(detail.counters.customers) },
            { label: 'Trazas negocio', value: String(detail.counters.audit_logs) },
          ].map((item) => (
            <div key={item.label} style={{ padding: '14px', borderRadius: '14px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
              <div style={{ color: '#6b7280', fontSize: '13px' }}>{item.label}</div>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Vista del negocio" description="La plataforma ve la empresa completa desde tabs de supervision.">
        <AdminTabs
          tabs={[
            { id: 'summary', label: 'Identidad' },
            { id: 'branches', label: 'Sucursales', badge: String(detail.branches.length) },
            { id: 'staff', label: 'Equipo', badge: String(detail.staff.length) },
            { id: 'activity', label: 'Actividad', badge: String(detail.recent_orders.length) },
            { id: 'audit', label: 'Auditoria', badge: String(detail.audit_logs.length) },
          ]}
          activeTabId={activeTab}
          onChange={(tabId) => setActiveTab(tabId as DetailTab)}
        />

        {activeTab === 'summary' ? (
          <AdminTabPanel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <FieldGroup label="Nombre comercial">
                <TextField value={form.trade_name} onChange={(event) => updateField('trade_name', event.target.value)} />
              </FieldGroup>
              <FieldGroup label="Razon social">
                <TextField value={form.legal_name} onChange={(event) => updateField('legal_name', event.target.value)} />
              </FieldGroup>
              <FieldGroup label="RUC o tax id">
                <TextField value={form.tax_id} onChange={(event) => updateField('tax_id', event.target.value)} />
              </FieldGroup>
              <FieldGroup label="Telefono">
                <TextField value={form.phone} onChange={(event) => updateField('phone', event.target.value)} />
              </FieldGroup>
              <FieldGroup label="Email">
                <TextField value={form.email} onChange={(event) => updateField('email', event.target.value)} />
              </FieldGroup>
              <FieldGroup label="Logo URL">
                <TextField value={form.logo_url} onChange={(event) => updateField('logo_url', event.target.value)} />
              </FieldGroup>
              <FieldGroup label="Estado">
                <SelectField value={form.status} onChange={(event) => updateField('status', event.target.value)} options={statusOptions} />
              </FieldGroup>
            </div>
          </AdminTabPanel>
        ) : null}

        {activeTab === 'branches' ? (
          <AdminTabPanel>
            <AdminDataTable
              rows={detail.branches}
              getRowId={(record) => record.id}
              emptyMessage="No hay sucursales asociadas."
              columns={[
                {
                  id: 'branch',
                  header: 'Sucursal',
                  render: (record) => (
                    <div style={{ display: 'grid', gap: '6px' }}>
                      <strong>{record.name}</strong>
                      <span style={{ color: '#6b7280' }}>{record.address_text}</span>
                    </div>
                  ),
                },
                { id: 'phone', header: 'Telefono', render: (record) => record.phone || 'Sin telefono' },
                { id: 'prep', header: 'Prep', render: (record) => `${record.prep_time_avg_min} min` },
                {
                  id: 'state',
                  header: 'Operacion',
                  render: (record) => (
                    <StatusPill
                      label={record.is_open ? (record.accepts_orders ? 'Abierta y recibiendo' : 'Abierta sin pedidos') : 'Cerrada'}
                      tone={getBranchTone(record.is_open, record.accepts_orders)}
                    />
                  ),
                },
                {
                  id: 'coverage',
                  header: 'Operacion',
                  render: (record) => (
                    <div style={{ display: 'grid', gap: '6px' }}>
                      <span>{record.hours_count} bloques horarios</span>
                      <span style={{ color: '#6b7280' }}>{record.closures_count} cierres especiales</span>
                      <span style={{ color: '#6b7280' }}>{record.pause_reason || record.status_code || 'Sin observacion'}</span>
                    </div>
                  ),
                },
                {
                  id: 'next_closure',
                  header: 'Proximo cierre',
                  render: (record) => (record.next_closure_starts_at ? formatDateTime(record.next_closure_starts_at) : 'Sin cierre programado'),
                },
              ]}
            />
          </AdminTabPanel>
        ) : null}

        {activeTab === 'staff' ? (
          <AdminTabPanel>
            <AdminDataTable
              rows={detail.staff}
              getRowId={(record) => record.id}
              emptyMessage="No hay equipo asignado."
              columns={[
                {
                  id: 'person',
                  header: 'Persona',
                  render: (record) => (
                    <div style={{ display: 'grid', gap: '6px' }}>
                      <strong>{record.full_name || 'Sin nombre'}</strong>
                      <span style={{ color: '#6b7280' }}>{record.email || 'Sin email'}</span>
                    </div>
                  ),
                },
                { id: 'role', header: 'Rol staff', render: (record) => record.role || 'staff' },
                { id: 'branches', header: 'Sucursales', render: (record) => record.branch_labels.join(', ') || 'Sin sucursal' },
                { id: 'roles', header: 'Accesos', render: (record) => record.user_role_labels.join(', ') || record.default_role || 'Sin rol' },
              ]}
            />
          </AdminTabPanel>
        ) : null}

        {activeTab === 'activity' ? (
          <AdminTabPanel>
            <AdminDataTable
              rows={detail.recent_orders}
              getRowId={(record) => record.id}
              emptyMessage="No hay pedidos recientes."
              columns={[
                { id: 'code', header: 'Pedido', render: (record) => `#${record.order_code}` },
                { id: 'branch', header: 'Sucursal', render: (record) => record.branch_label },
                { id: 'status', header: 'Estado', render: (record) => record.status || 'sin estado' },
                { id: 'total', header: 'Total', align: 'right', render: (record) => formatMoney(record.total) },
                { id: 'placed', header: 'Fecha', render: (record) => formatDateTime(record.placed_at) },
              ]}
            />
          </AdminTabPanel>
        ) : null}

        {activeTab === 'audit' ? (
          <AdminTabPanel>
            <AdminTimeline
              items={detail.audit_logs.map((item) => ({
                id: item.id,
                title: `${item.action || 'accion'} sobre ${item.entity_type || 'entidad'}`,
                subtitle: `${item.user_label || 'Sin usuario'} - ${item.branch_label || 'Sin sucursal'} - ${formatDateTime(item.created_at)}`,
                tone: 'info',
                body: <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '12px' }}>{JSON.stringify(item.metadata_json ?? {}, null, 2)}</pre>,
              }))}
            />
          </AdminTabPanel>
        ) : null}
      </SectionCard>

      <FormStatusBar dirty={dirty} saving={saving} error={error} successMessage={successMessage} />
    </AdminPageFrame>
  );
}
