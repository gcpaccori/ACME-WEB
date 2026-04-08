import { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AdminDataTable } from '../../../../components/admin/AdminDataTable';
import { CheckboxField, FieldGroup, SelectField } from '../../../../components/admin/AdminFields';
import { AdminModalForm } from '../../../../components/admin/AdminModalForm';
import { AdminPageFrame, FormStatusBar, SectionCard, StatusPill } from '../../../../components/admin/AdminScaffold';
import { LoadingScreen } from '../../../../components/shared/LoadingScreen';
import { TextField } from '../../../../components/ui/TextField';
import { AppRoutes } from '../../../../core/constants/routes';
import {
  adminDriversService,
  DriverAdminRecord,
  DriverAssignableProfile,
  DriverRootForm,
  DriverVehicleTypeOption,
} from '../../../../core/services/adminDriversService';
import { PortalContext } from '../../../auth/session/PortalContext';

function formatMoney(value: number, currency = 'PEN') {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDateTime(value: string) {
  if (!value) return 'Sin fecha';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
}

function getDriverTone(status: string) {
  const normalized = status.trim().toLowerCase();
  if (normalized === 'active' || normalized === 'available') return 'success' as const;
  if (normalized === 'suspended' || normalized === 'blocked') return 'danger' as const;
  if (normalized === 'pending' || normalized === 'pending_verification') return 'warning' as const;
  return 'info' as const;
}

export function DriversAdminPage() {
  const navigate = useNavigate();
  const portal = useContext(PortalContext);
  const [query, setQuery] = useState('');
  const [records, setRecords] = useState<DriverAdminRecord[]>([]);
  const [assignableProfiles, setAssignableProfiles] = useState<DriverAssignableProfile[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<DriverVehicleTypeOption[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<DriverRootForm>(adminDriversService.createEmptyRootForm());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    const [driversResult, profilesResult, vehicleTypesResult] = await Promise.all([
      adminDriversService.fetchDrivers(),
      adminDriversService.fetchAssignableProfiles(),
      adminDriversService.fetchVehicleTypes(),
    ]);

    setLoading(false);

    const nextError = driversResult.error || profilesResult.error || vehicleTypesResult.error;
    if (nextError) {
      setError(nextError.message);
      return;
    }

    setRecords(driversResult.data ?? []);
    setAssignableProfiles(profilesResult.data ?? []);
    setVehicleTypes(vehicleTypesResult.data ?? []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return records;
    return records.filter((record) =>
      [record.full_name, record.email, record.phone, record.status, record.active_vehicle_label, record.current_order_code]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [query, records]);

  const profileOptions = useMemo(
    () => [
      { value: '', label: 'Selecciona un perfil existente' },
      ...assignableProfiles.map((profile) => ({
        value: profile.user_id,
        label: `${profile.full_name || profile.email || profile.user_id} (${profile.email || 'sin email'})`,
      })),
    ],
    [assignableProfiles]
  );

  const vehicleTypeOptions = useMemo(
    () => [
      { value: '', label: 'Selecciona un tipo de vehiculo' },
      ...vehicleTypes.map((vehicleType) => ({
        value: vehicleType.id,
        label: `${vehicleType.name} (${vehicleType.code})`,
      })),
    ],
    [vehicleTypes]
  );

  const resetCreateForm = () => {
    setCreateForm(adminDriversService.createEmptyRootForm());
    setCreateOpen(false);
  };

  const handleProfileSelection = (userId: string) => {
    const profile = assignableProfiles.find((item) => item.user_id === userId);
    if (!profile) {
      setCreateForm(adminDriversService.createEmptyRootForm());
      return;
    }

    setCreateForm((current) => ({
      ...current,
      user_id: profile.user_id,
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      is_active: profile.is_active,
    }));
  };

  const handleCreate = async () => {
    if (!createForm.user_id) return;
    setSaving(true);
    setError(null);

    const result = await adminDriversService.saveDriver(createForm);

    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }

    const driverId = String((result.data as { user_id?: string } | null)?.user_id ?? createForm.user_id);
    setSuccessMessage('Repartidor creado');
    resetCreateForm();
    await loadData();
    navigate(AppRoutes.portal.admin.driverDetail.replace(':driverId', driverId));
  };

  return (
    <AdminPageFrame
      title="Reparto"
      description="Padron operativo de repartidores con alta guiada y acceso a la ficha completa de campo."
      breadcrumbs={[
        { label: 'Admin', to: AppRoutes.portal.admin.root },
        { label: 'Reparto' },
      ]}
      contextItems={[
        { label: 'Rol', value: portal.staffAssignment?.role || 'sin rol', tone: 'info' },
        { label: 'Comercio', value: portal.merchant?.name || 'sin comercio', tone: 'neutral' },
        { label: 'Entidad', value: 'Repartidor', tone: 'info' },
        { label: 'Modo', value: 'Operacion', tone: 'warning' },
      ]}
      actions={
        <button
          type="button"
          onClick={() => {
            setSuccessMessage(null);
            setCreateOpen(true);
          }}
          style={{ padding: '12px 16px', borderRadius: '10px', background: '#111827', color: '#ffffff', fontWeight: 700 }}
        >
          Agregar repartidor
        </button>
      }
    >
      <SectionCard title="Buscar repartidor" description="Filtra por nombre, contacto, estado, vehiculo o pedido actual.">
        <TextField value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar repartidor..." />
      </SectionCard>

      <SectionCard title="Flota disponible" description="Desde aqui entras a la ficha del repartidor para manejar documentos, estado, turnos, caja y liquidaciones.">
        {loading ? (
          <LoadingScreen />
        ) : (
          <AdminDataTable
            rows={filteredRecords}
            getRowId={(record) => record.id}
            emptyMessage="Todavia no hay repartidores registrados en la base."
            columns={[
              {
                id: 'driver',
                header: 'Repartidor',
                render: (record) => (
                  <div style={{ display: 'grid', gap: '6px' }}>
                    <strong>{record.full_name || 'Sin nombre'}</strong>
                    <span style={{ color: '#6b7280' }}>{record.email || 'Sin email'}</span>
                    <span style={{ color: '#6b7280' }}>{record.phone || 'Sin telefono'}</span>
                  </div>
                ),
              },
              {
                id: 'operations',
                header: 'Operacion',
                render: (record) => (
                  <div style={{ display: 'grid', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <StatusPill label={record.status || 'sin estado'} tone={getDriverTone(record.status)} />
                      <StatusPill label={record.is_online ? 'Online' : 'Offline'} tone={record.is_online ? 'success' : 'neutral'} />
                    </div>
                    <span style={{ color: '#6b7280' }}>{record.active_vehicle_label || 'Sin vehiculo activo'}</span>
                    <span style={{ color: '#6b7280' }}>{record.current_order_code ? `Pedido actual #${record.current_order_code}` : 'Sin pedido actual'}</span>
                  </div>
                ),
              },
              {
                id: 'risk',
                header: 'Control',
                render: (record) => (
                  <div style={{ display: 'grid', gap: '6px' }}>
                    <StatusPill label={record.is_verified ? 'Verificado' : 'Pendiente'} tone={record.is_verified ? 'success' : 'warning'} />
                    <span style={{ color: '#6b7280' }}>Caja pendiente: {formatMoney(record.pending_cash_total)}</span>
                    <span style={{ color: '#6b7280' }}>Ultima senal: {formatDateTime(record.last_seen_at)}</span>
                  </div>
                ),
              },
              {
                id: 'metrics',
                header: 'Metricas',
                render: (record) => (
                  <div style={{ display: 'grid', gap: '6px' }}>
                    <span>Rating: {record.rating_avg.toFixed(1)}</span>
                    <span style={{ color: '#6b7280' }}>{record.recent_assignments_count} asignaciones</span>
                    <span style={{ color: '#6b7280' }}>Alta: {formatDateTime(record.joined_at)}</span>
                  </div>
                ),
              },
              {
                id: 'action',
                header: 'Accion',
                align: 'right',
                width: '160px',
                render: (record) => (
                  <Link to={AppRoutes.portal.admin.driverDetail.replace(':driverId', record.id)} style={{ color: '#2563eb', fontWeight: 700 }}>
                    Abrir ficha
                  </Link>
                ),
              },
            ]}
          />
        )}
      </SectionCard>

      <FormStatusBar dirty={false} saving={saving} error={error} successMessage={successMessage} />

      <AdminModalForm
        open={createOpen}
        title="Agregar repartidor"
        description="Vincula un perfil ya existente a la operacion de reparto y deja lista su ficha admin."
        onClose={resetCreateForm}
        actions={
          <>
            <button type="button" onClick={resetCreateForm} style={{ padding: '12px 16px' }}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving || !createForm.user_id}
              style={{ padding: '12px 16px', borderRadius: '10px', background: '#111827', color: '#ffffff', opacity: saving || !createForm.user_id ? 0.65 : 1 }}
            >
              {saving ? 'Guardando...' : 'Crear repartidor'}
            </button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <FieldGroup label="Perfil existente" hint="Por ahora el alta de reparto se apoya en perfiles ya creados en plataforma.">
            <SelectField value={createForm.user_id} onChange={(event) => handleProfileSelection(event.target.value)} options={profileOptions} />
          </FieldGroup>
          <FieldGroup label="Email">
            <TextField value={createForm.email} disabled />
          </FieldGroup>
          <FieldGroup label="Nombre completo">
            <TextField value={createForm.full_name} onChange={(event) => setCreateForm((current) => ({ ...current, full_name: event.target.value }))} />
          </FieldGroup>
          <FieldGroup label="Telefono">
            <TextField value={createForm.phone} onChange={(event) => setCreateForm((current) => ({ ...current, phone: event.target.value }))} />
          </FieldGroup>
          <FieldGroup label="Documento">
            <TextField value={createForm.document_number} onChange={(event) => setCreateForm((current) => ({ ...current, document_number: event.target.value }))} />
          </FieldGroup>
          <FieldGroup label="Licencia">
            <TextField value={createForm.license_number} onChange={(event) => setCreateForm((current) => ({ ...current, license_number: event.target.value }))} />
          </FieldGroup>
          <FieldGroup label="Tipo de vehiculo">
            <SelectField
              value={createForm.vehicle_type_id}
              onChange={(event) => setCreateForm((current) => ({ ...current, vehicle_type_id: event.target.value }))}
              options={vehicleTypeOptions}
            />
          </FieldGroup>
          <FieldGroup label="Estado operativo">
            <SelectField
              value={createForm.status}
              onChange={(event) => setCreateForm((current) => ({ ...current, status: event.target.value }))}
              options={[
                { value: 'pending', label: 'Pendiente' },
                { value: 'active', label: 'Activo' },
                { value: 'suspended', label: 'Suspendido' },
                { value: 'inactive', label: 'Inactivo' },
              ]}
            />
          </FieldGroup>
        </div>

        <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
          <CheckboxField
            label="Perfil activo"
            checked={createForm.is_active}
            onChange={(event) => setCreateForm((current) => ({ ...current, is_active: event.target.checked }))}
          />
          <CheckboxField
            label="Verificado para operar"
            checked={createForm.is_verified}
            onChange={(event) => setCreateForm((current) => ({ ...current, is_verified: event.target.checked }))}
          />
        </div>

        {assignableProfiles.length === 0 ? (
          <div style={{ color: '#6b7280' }}>No hay perfiles disponibles para convertir en repartidores.</div>
        ) : null}
      </AdminModalForm>
    </AdminPageFrame>
  );
}
