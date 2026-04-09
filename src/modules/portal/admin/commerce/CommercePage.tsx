import { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminPageFrame, FormStatusBar, SaveActions, SectionCard } from '../../../../components/admin/AdminScaffold';
import { PortalContext } from '../../../auth/session/PortalContext';
import { AppRoutes } from '../../../../core/constants/routes';
import { LoadingScreen } from '../../../../components/shared/LoadingScreen';
import { adminService, MerchantAdminForm } from '../../../../core/services/adminService';
import { adminCustomersService } from '../../../../core/services/adminCustomersService';
import { hasDirtyState, serializeDirtyState } from '../../../../core/admin/utils/dirtyState';
import { FieldGroup, SelectField } from '../../../../components/admin/AdminFields';
import { TextField } from '../../../../components/ui/TextField';
import { getPortalActorLabel, getScopeLabel } from '../../../../core/auth/portalAccess';

const statusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'paused', label: 'Pausado' },
];

export function CommercePage() {
  const portal = useContext(PortalContext);
  const merchantId = portal.merchant?.id;
  const [form, setForm] = useState<MerchantAdminForm | null>(null);
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
  });
  const [initialState, setInitialState] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!merchantId) return;
      setLoading(true);
      const [merchantResult, branchesResult, categoriesResult, productsResult, modifiersResult] = await Promise.all([
        adminService.fetchMerchant(merchantId),
        adminService.fetchBranches(merchantId),
        adminService.fetchCategories(merchantId),
        adminService.fetchProducts(merchantId),
        adminService.fetchModifierGroups(merchantId),
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
      });
      if (branchesResult.error || categoriesResult.error || productsResult.error || modifiersResult.error || staffResult.error || customersResult.error) {
        setError(
          branchesResult.error?.message ||
            categoriesResult.error?.message ||
            productsResult.error?.message ||
            modifiersResult.error?.message ||
            staffResult.error?.message ||
            customersResult.error?.message ||
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
      <FormStatusBar dirty={dirty} saving={saving} error={error} successMessage={successMessage} />
    </AdminPageFrame>
  );
}
