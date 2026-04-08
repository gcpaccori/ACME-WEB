import { useContext, useEffect, useMemo, useState } from 'react';
import { AdminDataTable } from '../../../../components/admin/AdminDataTable';
import { AdminDrawer } from '../../../../components/admin/AdminDrawer';
import { CheckboxField, FieldGroup, SelectField } from '../../../../components/admin/AdminFields';
import { AdminModalForm } from '../../../../components/admin/AdminModalForm';
import { AdminPageFrame, FormStatusBar, SaveActions, SectionCard, StatusPill } from '../../../../components/admin/AdminScaffold';
import { AdminTabPanel, AdminTabs } from '../../../../components/admin/AdminTabs';
import { LoadingScreen } from '../../../../components/shared/LoadingScreen';
import { TextField } from '../../../../components/ui/TextField';
import { hasDirtyState, serializeDirtyState } from '../../../../core/admin/utils/dirtyState';
import { AppRoutes } from '../../../../core/constants/routes';
import {
  adminService,
  RoleAdminRecord,
  StaffAdminForm,
  StaffAdminRecord,
  StaffAssignableProfile,
} from '../../../../core/services/adminService';
import { PortalContext } from '../../../auth/session/PortalContext';

const staffRoleOptions = [
  { value: 'owner', label: 'Owner' },
  { value: 'manager', label: 'Manager' },
  { value: 'cashier', label: 'Caja' },
  { value: 'kitchen', label: 'Cocina' },
  { value: 'operator', label: 'Operador' },
  { value: 'support', label: 'Soporte' },
  { value: 'staff', label: 'Staff' },
];

const platformRoleDescriptions: Record<string, string> = {
  customer: 'Mantiene acceso al flujo de cliente, perfil y pedidos propios.',
  driver: 'Habilita el flujo operativo de reparto y liquidaciones del repartidor.',
  merchant_staff: 'Permite entrar al portal del negocio y operar catalogo, sucursales y pedidos.',
  admin: 'Da acceso a administracion ampliada del sistema y soporte operativo.',
  super_admin: 'Reserva control total de plataforma, auditoria y configuracion global.',
};

function getRoleIdByCode(roles: RoleAdminRecord[], code: string) {
  return roles.find((role) => role.code === code)?.id ?? '';
}

function resolveEditableUserRoleIds(record: StaffAdminRecord, roles: RoleAdminRecord[]) {
  if (record.user_role_ids.length > 0) {
    return record.user_role_ids;
  }

  const fallbackCode = record.default_role || 'merchant_staff';
  const fallbackRoleId = getRoleIdByCode(roles, fallbackCode) || getRoleIdByCode(roles, 'merchant_staff');
  return fallbackRoleId ? [fallbackRoleId] : [];
}

function createStaffForm(record: StaffAdminRecord, roles: RoleAdminRecord[]): StaffAdminForm {
  return {
    id: record.id,
    user_id: record.user_id,
    full_name: record.full_name,
    email: record.email,
    phone: record.phone,
    default_role: record.default_role,
    role: record.role,
    is_active: record.is_active,
    branch_ids: record.branch_ids,
    primary_branch_id: record.primary_branch_id || record.branch_ids[0] || '',
    user_role_ids: resolveEditableUserRoleIds(record, roles),
  };
}

function createNewStaffForm(roles: RoleAdminRecord[]): StaffAdminForm {
  const merchantStaffRoleId = getRoleIdByCode(roles, 'merchant_staff');
  return {
    user_id: '',
    full_name: '',
    email: '',
    phone: '',
    default_role: 'merchant_staff',
    role: 'cashier',
    is_active: true,
    branch_ids: [],
    primary_branch_id: '',
    user_role_ids: merchantStaffRoleId ? [merchantStaffRoleId] : [],
  };
}

function getPersonLabel(record: Pick<StaffAdminRecord, 'full_name' | 'email' | 'user_id'>) {
  return record.full_name || record.email || record.user_id;
}

function getProfileLabel(profile: StaffAssignableProfile) {
  return profile.full_name || profile.email || profile.user_id;
}

function formatLastLogin(value: string) {
  if (!value) {
    return 'Sin ingreso';
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsedDate);
}

function patchBranchSelection(current: StaffAdminForm, branchId: string, checked: boolean): StaffAdminForm {
  const branchIds = checked
    ? Array.from(new Set([...current.branch_ids, branchId]))
    : current.branch_ids.filter((item) => item !== branchId);
  const primaryBranchId = branchIds.includes(current.primary_branch_id) ? current.primary_branch_id : branchIds[0] ?? '';
  return {
    ...current,
    branch_ids: branchIds,
    primary_branch_id: primaryBranchId,
  };
}

function patchRoleSelection(current: StaffAdminForm, roleId: string, checked: boolean): StaffAdminForm {
  const userRoleIds = checked
    ? Array.from(new Set([...current.user_role_ids, roleId]))
    : current.user_role_ids.filter((item) => item !== roleId);
  return {
    ...current,
    user_role_ids: userRoleIds,
  };
}

export function StaffAdminPage() {
  const portal = useContext(PortalContext);
  const merchantId = portal.merchant?.id;
  const [activeTab, setActiveTab] = useState('profile');
  const [records, setRecords] = useState<StaffAdminRecord[]>([]);
  const [roles, setRoles] = useState<RoleAdminRecord[]>([]);
  const [assignableProfiles, setAssignableProfiles] = useState<StaffAssignableProfile[]>([]);
  const [selected, setSelected] = useState<StaffAdminRecord | null>(null);
  const [form, setForm] = useState<StaffAdminForm | null>(null);
  const [initialState, setInitialState] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createForm, setCreateForm] = useState<StaffAdminForm>(createNewStaffForm([]));
  const [createInitialState, setCreateInitialState] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = async (targetStaffId?: string) => {
    if (!merchantId) return;
    setLoading(true);
    setError(null);

    const [staffResult, rolesResult, profilesResult] = await Promise.all([
      adminService.fetchStaff(merchantId),
      adminService.fetchRoles(),
      adminService.fetchAssignableProfiles(merchantId),
    ]);

    setLoading(false);

    const nextError = staffResult.error || rolesResult.error || profilesResult.error;
    if (nextError) {
      setError(nextError.message);
      return;
    }

    const nextRoles = rolesResult.data ?? [];
    const nextRecords = staffResult.data ?? [];
    const nextProfiles = profilesResult.data ?? [];

    setRoles(nextRoles);
    setRecords(nextRecords);
    setAssignableProfiles(nextProfiles);

    const nextSelected =
      (targetStaffId ? nextRecords.find((record) => record.id === targetStaffId) : null) ||
      (selected ? nextRecords.find((record) => record.id === selected.id) : null) ||
      nextRecords[0] ||
      null;

    if (nextSelected) {
      const nextForm = createStaffForm(nextSelected, nextRoles);
      setSelected(nextSelected);
      setForm(nextForm);
      setInitialState(serializeDirtyState(nextForm));
    } else {
      setSelected(null);
      setForm(null);
      setInitialState('');
    }

    const nextCreateForm = createNewStaffForm(nextRoles);
    setCreateForm(nextCreateForm);
    setCreateInitialState(serializeDirtyState(nextCreateForm));
  };

  useEffect(() => {
    loadData();
  }, [merchantId]);

  const dirty = useMemo(() => (form ? hasDirtyState(form, initialState) : false), [form, initialState]);
  const createDirty = useMemo(() => hasDirtyState(createForm, createInitialState), [createForm, createInitialState]);

  const defaultRoleOptions = useMemo(
    () =>
      roles.map((role) => ({
        value: role.code,
        label: `${role.name} (${role.code})`,
      })),
    [roles]
  );

  const availablePrimaryBranchOptions = useMemo(() => {
    if (!form) {
      return [{ value: '', label: 'Sin principal' }];
    }

    return [
      { value: '', label: 'Sin principal' },
      ...portal.branches
        .filter((branch) => form.branch_ids.includes(branch.id))
        .map((branch) => ({ value: branch.id, label: branch.name })),
    ];
  }, [form, portal.branches]);

  const availableCreatePrimaryBranchOptions = useMemo(
    () => [
      { value: '', label: 'Sin principal' },
      ...portal.branches
        .filter((branch) => createForm.branch_ids.includes(branch.id))
        .map((branch) => ({ value: branch.id, label: branch.name })),
    ],
    [createForm.branch_ids, portal.branches]
  );

  const selectableProfiles = useMemo(
    () => [
      { value: '', label: 'Selecciona un perfil existente' },
      ...assignableProfiles.map((profile) => ({
        value: profile.user_id,
        label: `${getProfileLabel(profile)} (${profile.email || 'sin email'})`,
      })),
    ],
    [assignableProfiles]
  );

  const pickRecord = (record: StaffAdminRecord) => {
    const nextForm = createStaffForm(record, roles);
    setSelected(record);
    setForm(nextForm);
    setInitialState(serializeDirtyState(nextForm));
    setError(null);
    setSuccessMessage(null);
    setActiveTab('profile');
  };

  const resetSelectedForm = () => {
    if (!selected) return;
    const nextForm = createStaffForm(selected, roles);
    setForm(nextForm);
    setInitialState(serializeDirtyState(nextForm));
    setError(null);
    setSuccessMessage(null);
  };

  const openCreateModal = () => {
    const nextForm = createNewStaffForm(roles);
    setCreateForm(nextForm);
    setCreateInitialState(serializeDirtyState(nextForm));
    setModalOpen(true);
    setError(null);
    setSuccessMessage(null);
  };

  const closeCreateModal = () => {
    setModalOpen(false);
    const nextForm = createNewStaffForm(roles);
    setCreateForm(nextForm);
    setCreateInitialState(serializeDirtyState(nextForm));
  };

  const handleCreateProfileChange = (userId: string) => {
    const profile = assignableProfiles.find((item) => item.user_id === userId);
    if (!profile) {
      const nextForm = createNewStaffForm(roles);
      setCreateForm(nextForm);
      setCreateInitialState(serializeDirtyState(nextForm));
      return;
    }

    const merchantStaffRoleId = getRoleIdByCode(roles, 'merchant_staff');
    const nextForm: StaffAdminForm = {
      ...createForm,
      user_id: profile.user_id,
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      default_role: 'merchant_staff',
      is_active: profile.is_active,
      user_role_ids: merchantStaffRoleId ? [merchantStaffRoleId] : [],
    };

    setCreateForm(nextForm);
  };

  const handleSave = async () => {
    if (!merchantId || !form || !selected) return;
    setSaving(true);
    setError(null);

    const result = await adminService.saveStaff(merchantId, form);

    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }

    setSuccessMessage('Personal actualizado');
    await loadData(selected.id);
  };

  const handleCreate = async () => {
    if (!merchantId || !createForm.user_id) return;
    setCreateSaving(true);
    setError(null);

    const result = await adminService.saveStaff(merchantId, createForm);

    setCreateSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }

    setModalOpen(false);
    setSuccessMessage('Personal agregado');
    await loadData(String((result.data as { id?: string } | null)?.id ?? ''));
  };

  if (!merchantId) {
    return <div>No hay comercio activo para gestionar personal.</div>;
  }

  return (
    <AdminPageFrame
      title="Personal y accesos"
      description="Operacion relacional sobre profiles, merchant_staff, merchant_staff_branches, roles y user_roles desde una sola ficha."
      breadcrumbs={[
        { label: 'Admin', to: AppRoutes.portal.admin.root },
        { label: 'Personal' },
      ]}
      contextItems={[
        { label: 'Rol', value: portal.staffAssignment?.role || 'sin rol', tone: 'info' },
        { label: 'Comercio', value: portal.merchant?.name || 'sin comercio', tone: 'neutral' },
        { label: 'Entidad', value: 'Personal', tone: 'info' },
        { label: 'Modo', value: selected ? 'Edicion' : 'Consulta', tone: dirty ? 'warning' : 'info' },
        { label: 'Estado', value: dirty ? 'Cambios pendientes' : 'Sin cambios', tone: dirty ? 'warning' : 'success' },
      ]}
      actions={
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #d1d5db', background: '#ffffff' }}
          >
            Ver roles base
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            style={{ padding: '12px 16px', borderRadius: '10px', background: '#111827', color: '#ffffff', fontWeight: 600 }}
          >
            Agregar personal
          </button>
        </div>
      }
    >
      <SectionCard
        title="Equipo interno"
        description="La tabla muestra la persona, su rol operativo, sus sucursales y el estado real de permisos."
      >
        {loading ? (
          <LoadingScreen />
        ) : (
          <AdminDataTable
            rows={records}
            getRowId={(record) => record.id}
            emptyMessage="No hay personal interno registrado todavia."
            columns={[
              {
                id: 'person',
                header: 'Persona',
                render: (record) => (
                  <div style={{ display: 'grid', gap: '6px' }}>
                    <strong>{getPersonLabel(record)}</strong>
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
                    <span>{record.role || 'Sin rol operativo'}</span>
                    <span style={{ color: '#6b7280' }}>
                      {record.branch_labels.length > 0 ? record.branch_labels.join(', ') : 'Sin sucursales'}
                    </span>
                  </div>
                ),
              },
              {
                id: 'access',
                header: 'Accesos',
                render: (record) => (
                  <div style={{ display: 'grid', gap: '6px' }}>
                    <span>Base: {record.default_role || 'sin rol base'}</span>
                    <span style={{ color: '#6b7280' }}>
                      {record.user_role_labels.length > 0 ? record.user_role_labels.join(', ') : 'Sin user_roles sincronizados'}
                    </span>
                  </div>
                ),
              },
              {
                id: 'state',
                header: 'Estado',
                render: (record) => (
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <StatusPill label={record.is_active ? 'Activo' : 'Inactivo'} tone={record.is_active ? 'success' : 'warning'} />
                    {record.user_role_ids.length === 0 ||
                    (!record.user_role_codes.includes('merchant_staff') && record.default_role !== 'merchant_staff') ? (
                      <StatusPill label="Revisar acceso" tone="warning" />
                    ) : null}
                  </div>
                ),
              },
              {
                id: 'action',
                header: 'Accion',
                align: 'right',
                width: '140px',
                render: (record) => (
                  <button type="button" onClick={() => pickRecord(record)} style={{ color: '#2563eb', fontWeight: 700 }}>
                    Editar
                  </button>
                ),
              },
            ]}
          />
        )}
      </SectionCard>

      {selected && form ? (
        <>
          <AdminTabs
            tabs={[
              { id: 'profile', label: 'Perfil' },
              { id: 'assignments', label: 'Asignaciones', badge: String(form.branch_ids.length) },
              { id: 'access', label: 'Accesos', badge: String(form.user_role_ids.length) },
            ]}
            activeTabId={activeTab}
            onChange={setActiveTab}
          />

          {activeTab === 'profile' ? (
            <AdminTabPanel>
              <SectionCard
                title="Perfil base"
                description="Aqui se sincroniza la ficha del usuario en profiles y se muestra el ultimo acceso al portal."
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  <FieldGroup label="Nombre completo">
                    <TextField value={form.full_name} onChange={(event) => setForm((current) => (current ? { ...current, full_name: event.target.value } : current))} />
                  </FieldGroup>
                  <FieldGroup label="Email de contacto">
                    <TextField value={form.email} disabled />
                  </FieldGroup>
                  <FieldGroup label="Telefono">
                    <TextField value={form.phone} onChange={(event) => setForm((current) => (current ? { ...current, phone: event.target.value } : current))} />
                  </FieldGroup>
                  <FieldGroup label="Rol base del perfil" hint="Sirve como persona principal del usuario dentro de la plataforma.">
                    <SelectField
                      value={form.default_role}
                      onChange={(event) => setForm((current) => (current ? { ...current, default_role: event.target.value } : current))}
                      options={defaultRoleOptions}
                    />
                  </FieldGroup>
                </div>
                <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <CheckboxField
                    label="Usuario activo"
                    checked={form.is_active}
                    onChange={(event) => setForm((current) => (current ? { ...current, is_active: event.target.checked } : current))}
                  />
                  <StatusPill label={`Ultimo ingreso: ${formatLastLogin(selected.last_login_at)}`} tone="neutral" />
                </div>
              </SectionCard>
            </AdminTabPanel>
          ) : null}

          {activeTab === 'assignments' ? (
            <AdminTabPanel>
              <SectionCard
                title="Asignaciones operativas"
                description="El rol operativo se guarda en merchant_staff y las sucursales en merchant_staff_branches."
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  <FieldGroup label="Rol operativo">
                    <SelectField
                      value={form.role}
                      onChange={(event) => setForm((current) => (current ? { ...current, role: event.target.value } : current))}
                      options={staffRoleOptions}
                    />
                  </FieldGroup>
                  <FieldGroup label="Sucursal principal">
                    <SelectField
                      value={form.primary_branch_id}
                      onChange={(event) => setForm((current) => (current ? { ...current, primary_branch_id: event.target.value } : current))}
                      options={availablePrimaryBranchOptions}
                    />
                  </FieldGroup>
                </div>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <strong>Sucursales asignadas</strong>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {portal.branches.map((branch) => (
                      <CheckboxField
                        key={branch.id}
                        label={branch.name}
                        checked={form.branch_ids.includes(branch.id)}
                        onChange={(event) =>
                          setForm((current) => (current ? patchBranchSelection(current, branch.id, event.target.checked) : current))
                        }
                      />
                    ))}
                  </div>
                </div>
              </SectionCard>
            </AdminTabPanel>
          ) : null}

          {activeTab === 'access' ? (
            <AdminTabPanel>
              <SectionCard
                title="Permisos del usuario"
                description="Los checks crean o actualizan user_roles, mientras que la tabla roles se expone como catalogo de referencia."
              >
                <div style={{ display: 'grid', gap: '12px' }}>
                  {roles.map((role) => (
                    <label
                      key={role.id}
                      style={{
                        display: 'grid',
                        gap: '6px',
                        padding: '14px',
                        borderRadius: '14px',
                        border: '1px solid #e5e7eb',
                        background: '#f9fafb',
                      }}
                    >
                      <CheckboxField
                        label={`${role.name} (${role.code})`}
                        checked={form.user_role_ids.includes(role.id)}
                        onChange={(event) =>
                          setForm((current) => (current ? patchRoleSelection(current, role.id, event.target.checked) : current))
                        }
                      />
                      <span style={{ color: '#6b7280', fontSize: '14px' }}>
                        {platformRoleDescriptions[role.code] || 'Rol disponible para integraciones futuras del negocio.'}
                      </span>
                    </label>
                  ))}
                </div>
              </SectionCard>
            </AdminTabPanel>
          ) : null}
        </>
      ) : (
        <SectionCard title="Editor" description="Selecciona una persona para revisar perfil, asignaciones y accesos.">
          <div style={{ color: '#6b7280' }}>Aun no hay una ficha seleccionada.</div>
        </SectionCard>
      )}

      <FormStatusBar dirty={dirty} saving={saving} error={error} successMessage={successMessage} />

      <AdminModalForm
        open={modalOpen}
        title="Agregar personal"
        description="Vincula una cuenta existente al comercio y deja listo su acceso interno."
        onClose={closeCreateModal}
        actions={
          <>
            <button type="button" onClick={closeCreateModal} style={{ padding: '12px 16px' }}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={!createDirty || !createForm.user_id || createSaving}
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                background: '#111827',
                color: '#ffffff',
                opacity: !createDirty || !createForm.user_id || createSaving ? 0.65 : 1,
              }}
            >
              {createSaving ? 'Guardando...' : 'Agregar personal'}
            </button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <FieldGroup label="Perfil existente" hint="Por ahora el alta vincula cuentas ya registradas en la plataforma.">
            <SelectField
              value={createForm.user_id}
              onChange={(event) => handleCreateProfileChange(event.target.value)}
              options={selectableProfiles}
            />
          </FieldGroup>
          <FieldGroup label="Email de contacto">
            <TextField value={createForm.email} disabled />
          </FieldGroup>
          <FieldGroup label="Nombre completo">
            <TextField
              value={createForm.full_name}
              onChange={(event) => setCreateForm((current) => ({ ...current, full_name: event.target.value }))}
            />
          </FieldGroup>
          <FieldGroup label="Telefono">
            <TextField
              value={createForm.phone}
              onChange={(event) => setCreateForm((current) => ({ ...current, phone: event.target.value }))}
            />
          </FieldGroup>
          <FieldGroup label="Rol operativo">
            <SelectField
              value={createForm.role}
              onChange={(event) => setCreateForm((current) => ({ ...current, role: event.target.value }))}
              options={staffRoleOptions}
            />
          </FieldGroup>
          <FieldGroup label="Rol base del perfil">
            <SelectField
              value={createForm.default_role}
              onChange={(event) => setCreateForm((current) => ({ ...current, default_role: event.target.value }))}
              options={defaultRoleOptions}
            />
          </FieldGroup>
          <FieldGroup label="Sucursal principal">
            <SelectField
              value={createForm.primary_branch_id}
              onChange={(event) => setCreateForm((current) => ({ ...current, primary_branch_id: event.target.value }))}
              options={availableCreatePrimaryBranchOptions}
            />
          </FieldGroup>
        </div>

        <CheckboxField
          label="Usuario activo"
          checked={createForm.is_active}
          onChange={(event) => setCreateForm((current) => ({ ...current, is_active: event.target.checked }))}
        />

        <div style={{ display: 'grid', gap: '10px' }}>
          <strong>Sucursales asignadas</strong>
          <div style={{ display: 'grid', gap: '10px' }}>
            {portal.branches.map((branch) => (
              <CheckboxField
                key={branch.id}
                label={branch.name}
                checked={createForm.branch_ids.includes(branch.id)}
                onChange={(event) =>
                  setCreateForm((current) => patchBranchSelection(current, branch.id, event.target.checked))
                }
              />
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gap: '12px' }}>
          <strong>Permisos iniciales</strong>
          {roles.map((role) => (
            <label
              key={role.id}
              style={{
                display: 'grid',
                gap: '6px',
                padding: '14px',
                borderRadius: '14px',
                border: '1px solid #e5e7eb',
                background: '#f9fafb',
              }}
            >
              <CheckboxField
                label={`${role.name} (${role.code})`}
                checked={createForm.user_role_ids.includes(role.id)}
                onChange={(event) =>
                  setCreateForm((current) => patchRoleSelection(current, role.id, event.target.checked))
                }
              />
              <span style={{ color: '#6b7280', fontSize: '14px' }}>
                {platformRoleDescriptions[role.code] || 'Rol disponible para integraciones futuras del negocio.'}
              </span>
            </label>
          ))}
        </div>

        {assignableProfiles.length === 0 ? (
          <div style={{ color: '#6b7280' }}>
            No hay perfiles disponibles para vincular. Primero se necesita una cuenta creada en la plataforma.
          </div>
        ) : null}
      </AdminModalForm>

      <AdminDrawer
        open={drawerOpen}
        title="Catalogo de roles"
        description="Referencia de la tabla roles usada por la ficha de personal para default_role y user_roles."
        onClose={() => setDrawerOpen(false)}
      >
        <div style={{ display: 'grid', gap: '12px' }}>
          {roles.map((role) => (
            <div
              key={role.id}
              style={{
                display: 'grid',
                gap: '8px',
                padding: '14px',
                borderRadius: '14px',
                border: '1px solid #e5e7eb',
                background: '#f9fafb',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <strong>{role.name}</strong>
                <StatusPill label={role.code} tone="info" />
              </div>
              <span style={{ color: '#6b7280' }}>
                {platformRoleDescriptions[role.code] || 'Rol disponible para integraciones futuras del negocio.'}
              </span>
            </div>
          ))}
        </div>
      </AdminDrawer>

      {selected && form ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <SaveActions onSave={handleSave} onCancel={resetSelectedForm} disabled={!dirty || saving} isSaving={saving} />
        </div>
      ) : null}
    </AdminPageFrame>
  );
}
