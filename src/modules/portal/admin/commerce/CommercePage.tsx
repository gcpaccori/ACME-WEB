import { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminDataTable } from '../../../../components/admin/AdminDataTable';
import { AdminModalForm } from '../../../../components/admin/AdminModalForm';
import { AdminPageFrame, FormStatusBar, SaveActions, SectionCard } from '../../../../components/admin/AdminScaffold';
import { AdminTimeline } from '../../../../components/admin/AdminTimeline';
import { PortalContext } from '../../../auth/session/PortalContext';
import { AppRoutes } from '../../../../core/constants/routes';
import { LoadingScreen } from '../../../../components/shared/LoadingScreen';
import { adminService, MerchantAdminForm } from '../../../../core/services/adminService';
import { adminCustomersService } from '../../../../core/services/adminCustomersService';
import { adminMerchantSettingsService, MerchantSettingForm, MerchantSettingsOverview } from '../../../../core/services/adminMerchantSettingsService';
import { hasDirtyState, serializeDirtyState } from '../../../../core/admin/utils/dirtyState';
import { FieldGroup, SelectField, TextAreaField } from '../../../../components/admin/AdminFields';
import { TextField } from '../../../../components/ui/TextField';
import { getPortalActorLabel, getScopeLabel } from '../../../../core/auth/portalAccess';

const statusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'paused', label: 'Pausado' },
];

export function CommercePage() {
  const portal = useContext(PortalContext);
  const merchantId = portal.currentMerchant?.id ?? portal.merchant?.id;
  const [form, setForm] = useState<MerchantAdminForm | null>(null);
  const [settingsOverview, setSettingsOverview] = useState<MerchantSettingsOverview | null>(null);
  const [summary, setSummary] = useState({
    branches: 0,
    branchHours: 0,
    branchClosures: 0,
    branchCoverage: 0,
    staff: 0,
    customers: 0,
    categories: 0,
    products: 0,
    modifierGroups: 0,
    merchantSettings: 0,
  });
  const [initialState, setInitialState] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [settingOpen, setSettingOpen] = useState(false);
  const [settingForm, setSettingForm] = useState<MerchantSettingForm>(adminMerchantSettingsService.createEmptySettingForm());

  const formatDateTime = (value: string) => {
    if (!value) return 'Sin fecha';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(parsed);
  };

  const previewJson = (value: unknown) => {
    const text = JSON.stringify(value ?? {}, null, 2);
    return text.length > 120 ? `${text.slice(0, 120)}...` : text;
  };

  useEffect(() => {
    const load = async () => {
      if (!merchantId) return;
      setLoading(true);
      const [merchantResult, branchesResult, categoriesResult, productsResult, modifiersResult, settingsResult] = await Promise.all([
        adminService.fetchMerchant(merchantId),
        adminService.fetchBranches(merchantId),
        adminService.fetchCategories(merchantId),
        adminService.fetchProducts(merchantId),
        adminService.fetchModifierGroups(merchantId),
        adminMerchantSettingsService.fetchOverview(merchantId),
      ]);
      const [staffResult, customersResult] = await Promise.all([
        adminService.fetchStaff(merchantId),
        adminCustomersService.fetchCustomers(merchantId),
      ]);
      setLoading(false);
      if (merchantResult.error) {
        setError(merchantResult.error.message);
        return;
      }
      if (merchantResult.data) {
        setForm(merchantResult.data);
        setInitialState(serializeDirtyState(merchantResult.data));
      }
      setSettingsOverview(settingsResult.data ?? null);
      setSummary({
        branches: branchesResult.data?.length ?? 0,
        branchHours: (branchesResult.data ?? []).reduce((total, branch) => total + branch.hours_count, 0),
        branchClosures: (branchesResult.data ?? []).reduce((total, branch) => total + branch.closures_count, 0),
        branchCoverage: (branchesResult.data ?? []).reduce((total, branch) => total + branch.coverage_count, 0),
        staff: staffResult.data?.length ?? 0,
        customers: customersResult.data?.length ?? 0,
        categories: categoriesResult.data?.length ?? 0,
        products: productsResult.data?.length ?? 0,
        modifierGroups: modifiersResult.data?.length ?? 0,
        merchantSettings: settingsResult.data?.settings.length ?? 0,
      });
      if (branchesResult.error || categoriesResult.error || productsResult.error || modifiersResult.error || staffResult.error || customersResult.error || settingsResult.error) {
        setError(
          branchesResult.error?.message ||
            categoriesResult.error?.message ||
            productsResult.error?.message ||
            modifiersResult.error?.message ||
            staffResult.error?.message ||
            customersResult.error?.message ||
            settingsResult.error?.message ||
            null
        );
      }
    };

    load();
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
    const result = await adminService.saveMerchant(merchantId, form);
    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setInitialState(serializeDirtyState(form));
    setSuccessMessage('Guardado');
    await portal.reloadPortalContext();
  };

  const openSettingModal = (settingId?: string) => {
    const record = (settingsOverview?.settings ?? []).find((item) => item.id === settingId);
    setSettingForm(record ? adminMerchantSettingsService.createSettingForm(record) : adminMerchantSettingsService.createEmptySettingForm());
    setSettingOpen(true);
    setSuccessMessage(null);
    setError(null);
  };

  const handleSettingSave = async () => {
    if (!merchantId || !portal.sessionUserId) return;
    setSettingsSaving(true);
    setError(null);
    const result = await adminMerchantSettingsService.saveSetting(portal.sessionUserId, merchantId, settingForm);
    setSettingsSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }

    setSettingOpen(false);
    setSuccessMessage(settingForm.id ? 'Configuracion del negocio actualizada' : 'Configuracion del negocio creada');
    const settingsResult = await adminMerchantSettingsService.fetchOverview(merchantId);
    if (settingsResult.error) {
      setError(settingsResult.error.message);
      return;
    }
    setSettingsOverview(settingsResult.data ?? null);
    setSummary((current) => ({ ...current, merchantSettings: settingsResult.data?.settings.length ?? current.merchantSettings }));
  };

  if (!merchantId) {
    return <div>No hay comercio disponible para administrar.</div>;
  }

  if (portal.currentScopeType !== 'business') {
    return <div>Esta vista pertenece a la capa negocio.</div>;
  }

  if (loading || !form) {
    return <LoadingScreen message="Cargando comercio..." />;
  }

  return (
    <AdminPageFrame
      title={form.trade_name || 'Comercio'}
      description="Datos generales del negocio actual. Los IDs y relaciones se resuelven automaticamente desde el contexto del portal."
      breadcrumbs={[
        { label: 'Admin', to: AppRoutes.portal.admin.root },
        { label: 'Comercio' },
      ]}
      contextItems={[
        { label: 'Capa', value: getScopeLabel(portal.currentScopeType), tone: 'info' },
        { label: 'Actor', value: getPortalActorLabel({ roleAssignments: portal.roleAssignments, profile: portal.profile, staffAssignment: portal.staffAssignment }), tone: 'info' },
        { label: 'Comercio', value: form.trade_name || 'sin nombre', tone: 'neutral' },
        { label: 'Entidad', value: 'Comercio', tone: 'info' },
        { label: 'Modo', value: 'Edicion', tone: 'warning' },
        { label: 'Estado', value: dirty ? 'Cambios pendientes' : 'Sin cambios', tone: dirty ? 'warning' : 'success' },
      ]}
      actions={<SaveActions onSave={handleSave} disabled={!dirty} isSaving={saving} />}
    >
      <SectionCard title="Datos base" description="Informacion general visible para el negocio y para operaciones internas.">
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
      </SectionCard>
      <SectionCard title="Resumen operativo del negocio" description="Esta vista ya resume las tablas base del owner: sucursales, clientes y catalogo relacional.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {[
            {
              label: 'Sucursales',
              count: summary.branches,
              to: AppRoutes.portal.admin.branches,
              description: 'Locales, horarios, cierres y cobertura.',
            },
            {
              label: 'Categorias',
              count: summary.categories,
              to: AppRoutes.portal.admin.categories,
              description: 'Base del arbol del menu.',
            },
            {
              label: 'Productos',
              count: summary.products,
              to: AppRoutes.portal.admin.products,
              description: 'Menu y disponibilidad por local.',
            },
            {
              label: 'Modificadores',
              count: summary.modifierGroups,
              to: AppRoutes.portal.admin.modifiers,
              description: 'Grupos y opciones para personalizacion.',
            },
            {
              label: 'Personal',
              count: summary.staff,
              to: AppRoutes.portal.admin.staff,
              description: 'Equipo interno y asignaciones por local.',
            },
            {
              label: 'Clientes',
              count: summary.customers,
              to: AppRoutes.portal.admin.customers,
              description: 'Direcciones, carritos y metodos guardados.',
            },
            {
              label: 'Horarios',
              count: summary.branchHours,
              to: AppRoutes.portal.admin.branches,
              description: 'Bloques operativos configurados en las sucursales.',
            },
            {
              label: 'Cobertura',
              count: summary.branchCoverage,
              to: AppRoutes.portal.admin.branches,
              description: 'Zonas de reparto activas por sucursal.',
            },
            {
              label: 'Cierres',
              count: summary.branchClosures,
              to: AppRoutes.portal.admin.branches,
              description: 'Cierres especiales programados para los locales.',
            },
            {
              label: 'Settings negocio',
              count: summary.merchantSettings,
              to: AppRoutes.portal.admin.commerce,
              description: 'Claves propias del comercio fuera de system_settings.',
            },
          ].map((item) => (
            <Link
              key={item.label}
              to={item.to}
              style={{
                padding: '18px',
                borderRadius: '16px',
                border: '1px solid #e5e7eb',
                background: '#f9fafb',
                display: 'grid',
                gap: '8px',
              }}
            >
              <span style={{ color: '#6b7280', textTransform: 'uppercase', fontSize: '12px', fontWeight: 700 }}>{item.label}</span>
              <strong style={{ fontSize: '28px', color: '#111827' }}>{item.count}</strong>
              <span style={{ color: '#4b5563' }}>{item.description}</span>
            </Link>
          ))}
        </div>
      </SectionCard>
      <SectionCard
        title="Configuracion del negocio"
        description="merchant_settings guarda reglas propias del comercio. Esto deja de mezclarse con system_settings de plataforma."
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => openSettingModal()}
            style={{ padding: '12px 16px', borderRadius: '10px', background: '#111827', color: '#ffffff', fontWeight: 700 }}
          >
            Nuevo setting
          </button>
        </div>
        <AdminDataTable
          rows={settingsOverview?.settings ?? []}
          getRowId={(record) => record.id}
          emptyMessage="No hay configuraciones de negocio registradas."
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
            {
              id: 'value',
              header: 'Valor',
              render: (record) => <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '12px' }}>{previewJson(record.value_json)}</pre>,
            },
            { id: 'updated', header: 'Actualizada', render: (record) => formatDateTime(record.updated_at || record.created_at) },
            {
              id: 'action',
              header: 'Accion',
              align: 'right',
              width: '120px',
              render: (record) => (
                <button type="button" onClick={() => openSettingModal(record.id)} style={{ color: '#2563eb', fontWeight: 700 }}>
                  Editar
                </button>
              ),
            },
          ]}
        />
      </SectionCard>
      <SectionCard title="Auditoria de configuracion" description="Cada cambio de merchant_settings deja traza para el owner y soporte.">
        <AdminTimeline
          items={(settingsOverview?.audit_logs ?? []).map((item) => ({
            id: item.id,
            title: item.action || 'merchant_setting',
            subtitle: `${item.user_label || 'Sin usuario'} - ${formatDateTime(item.created_at)}`,
            tone: 'info',
            body: <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '12px' }}>{previewJson(item.metadata_json)}</pre>,
          }))}
        />
      </SectionCard>
      <FormStatusBar dirty={dirty} saving={saving || settingsSaving} error={error} successMessage={successMessage} />
      <AdminModalForm
        open={settingOpen}
        title={settingForm.id ? 'Editar setting del negocio' : 'Nuevo setting del negocio'}
        description="Define una clave propia del comercio con JSON valido."
        onClose={() => setSettingOpen(false)}
        actions={
          <>
            <button type="button" onClick={() => setSettingOpen(false)} style={{ padding: '12px 16px' }}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSettingSave}
              style={{ padding: '12px 16px', background: '#111827', color: '#ffffff', borderRadius: '10px' }}
            >
              {settingsSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </>
        }
      >
        <FieldGroup label="Clave">
          <TextField
            value={settingForm.key}
            onChange={(event) => setSettingForm((current) => ({ ...current, key: event.target.value }))}
            placeholder="order_timeouts"
          />
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
