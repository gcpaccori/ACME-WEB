import { type CSSProperties, useContext, useEffect, useMemo, useState } from 'react';
import { AdminDataTable } from '../../../../../components/admin/AdminDataTable';
import { AdminDrawer } from '../../../../../components/admin/AdminDrawer';
import { CheckboxField, FieldGroup, SelectField } from '../../../../../components/admin/AdminFields';
import { AdminModalForm } from '../../../../../components/admin/AdminModalForm';
import { AdminPageFrame, FormStatusBar, SectionCard, StatusPill } from '../../../../../components/admin/AdminScaffold';
import { LoadingScreen } from '../../../../../components/shared/LoadingScreen';
import { TextField } from '../../../../../components/ui/TextField';
import { getPortalActorLabel, getScopeLabel } from '../../../../../core/auth/portalAccess';
import { hasDirtyState, serializeDirtyState } from '../../../../../core/admin/utils/dirtyState';
import { AppRoutes } from '../../../../../core/constants/routes';
import {
  adminPlatformUsersService,
  PlatformMerchantOption,
  PlatformRoleOption,
  PlatformUserCreatePayload,
  PlatformUserRecord,
  PlatformUserUpdatePayload,
} from '../../../../../core/services/adminPlatformUsersService';
import { PortalContext } from '../../../../auth/session/PortalContext';

type AssignmentScope = 'merchant' | 'branches';

interface CreateFormState {
  email: string;
  fullName: string;
  phone: string;
  password: string;
  merchantId: string;
  assignmentScope: AssignmentScope;
  branchIds: string[];
  primaryBranchId: string;
  staffRole: string;
  roleIds: string[];
  isActive: boolean;
  mustChangePassword: boolean;
}

interface EditFormState {
  staffId: string;
  userId: string;
  fullName: string;
  phone: string;
  merchantId: string;
  assignmentScope: AssignmentScope;
  branchIds: string[];
  primaryBranchId: string;
  staffRole: string;
  roleIds: string[];
  isActive: boolean;
  password: string;
  mustChangePassword: boolean;
}

const MERCHANT_SCOPE_ROLE_VALUES = new Set(['owner', 'manager']);

function getInitialStaffRole(scope: AssignmentScope) {
  return scope === 'merchant' ? 'manager' : 'staff';
}

function adaptStaffRoleToScope(scope: AssignmentScope, currentRole: string) {
  const normalizedRole = currentRole.trim() || getInitialStaffRole(scope);
  if (scope === 'merchant' && !MERCHANT_SCOPE_ROLE_VALUES.has(normalizedRole)) {
    return 'manager';
  }
  return normalizedRole;
}

function createEmptyForm(): CreateFormState {
  return {
    email: '',
    fullName: '',
    phone: '',
    password: '',
    merchantId: '',
    assignmentScope: 'merchant',
    branchIds: [],
    primaryBranchId: '',
    staffRole: 'manager',
    roleIds: [],
    isActive: true,
    mustChangePassword: true,
  };
}

function createEditForm(record: PlatformUserRecord): EditFormState {
  const assignmentScope = record.assignment_scope || (record.branch_ids.length > 0 ? 'branches' : 'merchant');
  return {
    staffId: record.staff_id,
    userId: record.user_id,
    fullName: record.full_name,
    phone: record.phone,
    merchantId: record.merchant_id,
    assignmentScope,
    branchIds: assignmentScope === 'branches' ? record.branch_ids : [],
    primaryBranchId: assignmentScope === 'branches' ? record.primary_branch_id : '',
    staffRole: adaptStaffRoleToScope(assignmentScope, record.staff_role),
    roleIds: record.role_ids,
    isActive: record.is_active,
    password: '',
    mustChangePassword: true,
  };
}

function getUserLabel(record: PlatformUserRecord) {
  return record.full_name || record.email || record.user_id;
}

function formatLastLogin(value: string) {
  if (!value) return 'Sin ingreso';
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return value;
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsedDate);
}

function patchBranchSelection(current: string[], branchId: string, checked: boolean) {
  return checked
    ? Array.from(new Set([...current, branchId]))
    : current.filter((item) => item !== branchId);
}

function renderAssignmentScopeButtons(params: {
  value: AssignmentScope;
  onChange: (scope: AssignmentScope) => void;
}) {
  const buttonStyle = (active: boolean): CSSProperties => ({
    padding: '10px 12px',
    borderRadius: '10px',
    border: `1px solid ${active ? '#111827' : '#d1d5db'}`,
    background: active ? '#111827' : '#ffffff',
    color: active ? '#ffffff' : '#374151',
    fontWeight: 700,
    cursor: 'pointer',
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
      <button type="button" onClick={() => params.onChange('merchant')} style={buttonStyle(params.value === 'merchant')}>
        Negocio completo
      </button>
      <button type="button" onClick={() => params.onChange('branches')} style={buttonStyle(params.value === 'branches')}>
        Sucursales
      </button>
    </div>
  );
}

export function PlatformUsersPage() {
  const portal = useContext(PortalContext);
  const [records, setRecords] = useState<PlatformUserRecord[]>([]);
  const [roles, setRoles] = useState<PlatformRoleOption[]>([]);
  const [merchants, setMerchants] = useState<PlatformMerchantOption[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Create modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>(createEmptyForm());
  const [createInitialState, setCreateInitialState] = useState(serializeDirtyState(createEmptyForm()));

  // Edit drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PlatformUserRecord | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [editInitialState, setEditInitialState] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const [usersResult, rolesResult, merchantsResult] = await Promise.all([
      adminPlatformUsersService.fetchPlatformUsers(),
      adminPlatformUsersService.fetchRoles(),
      adminPlatformUsersService.fetchMerchantsWithBranches(),
    ]);
    setLoading(false);

    const nextError = usersResult.error || rolesResult.error || merchantsResult.error;
    if (nextError) {
      setError(nextError.message);
      return;
    }

    setRecords(usersResult.data ?? []);
    setRoles(rolesResult.data ?? []);
    setMerchants(merchantsResult.data ?? []);
  };

  useEffect(() => {
    if (portal.currentScopeType === 'platform') {
      loadData();
    }
  }, [portal.currentScopeType]);

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return records;
    return records.filter((record) =>
      [
        record.full_name,
        record.email,
        record.phone,
        record.merchant_label,
        record.staff_role,
        record.assignment_scope === 'merchant' ? 'negocio completo' : 'sucursales',
        record.branch_labels.join(' '),
        record.role_labels.join(' '),
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [records, query]);

  const createDirty = useMemo(() => hasDirtyState(createForm, createInitialState), [createForm, createInitialState]);
  const editDirty = useMemo(() => (editForm ? hasDirtyState(editForm, editInitialState) : false), [editForm, editInitialState]);

  // Role options for the <SelectField> of staff role — hardcoded operational roles
  const staffRoleOptions = useMemo(() => [
    { value: 'owner', label: 'Owner' },
    { value: 'manager', label: 'Manager' },
    { value: 'cashier', label: 'Caja' },
    { value: 'kitchen', label: 'Cocina' },
    { value: 'operator', label: 'Operador' },
    { value: 'support', label: 'Soporte' },
    { value: 'staff', label: 'Staff' },
  ], []);

  const createStaffRoleOptions = useMemo(
    () => staffRoleOptions.filter((option) => createForm.assignmentScope === 'branches' || MERCHANT_SCOPE_ROLE_VALUES.has(option.value)),
    [createForm.assignmentScope, staffRoleOptions]
  );

  const editStaffRoleOptions = useMemo(() => {
    if (!editForm) return staffRoleOptions;
    return staffRoleOptions.filter((option) => editForm.assignmentScope === 'branches' || MERCHANT_SCOPE_ROLE_VALUES.has(option.value));
  }, [editForm, staffRoleOptions]);

  // Merchant options for the <SelectField>
  const merchantOptions = useMemo(() => {
    return [
      { value: '', label: 'Selecciona un negocio' },
      ...merchants.map((merchant) => ({ value: merchant.id, label: merchant.label })),
    ];
  }, [merchants]);

  // Branches for selected merchant in create form
  const createBranches = useMemo(() => {
    const merchant = merchants.find((m) => m.id === createForm.merchantId);
    return merchant?.branches ?? [];
  }, [merchants, createForm.merchantId]);

  // Branches for selected merchant in edit form
  const editBranches = useMemo(() => {
    if (!editForm) return [];
    const merchant = merchants.find((m) => m.id === editForm.merchantId);
    return merchant?.branches ?? [];
  }, [merchants, editForm?.merchantId]);

  // Primary branch options for create form
  const createPrimaryBranchOptions = useMemo(() => [
    { value: '', label: 'Sin principal' },
    ...createBranches
      .filter((branch) => createForm.branchIds.includes(branch.id))
      .map((branch) => ({ value: branch.id, label: branch.name })),
  ], [createBranches, createForm.branchIds]);

  // Primary branch options for edit form
  const editPrimaryBranchOptions = useMemo(() => {
    if (!editForm) return [{ value: '', label: 'Sin principal' }];
    return [
      { value: '', label: 'Sin principal' },
      ...editBranches
        .filter((branch) => editForm.branchIds.includes(branch.id))
        .map((branch) => ({ value: branch.id, label: branch.name })),
    ];
  }, [editBranches, editForm?.branchIds]);

  // --- Actions ---

  const openCreateModal = () => {
    const nextForm = createEmptyForm();
    setCreateForm(nextForm);
    setCreateInitialState(serializeDirtyState(nextForm));
    setCreateModalOpen(true);
    setError(null);
    setSuccessMessage(null);
  };

  const closeCreateModal = () => {
    setCreateModalOpen(false);
    setCreateForm(createEmptyForm());
  };

  const handleCreate = async () => {
    if (!createForm.email || !createForm.password || !createForm.merchantId) return;
    setSaving(true);
    setError(null);

    const payload: PlatformUserCreatePayload = {
      email: createForm.email,
      fullName: createForm.fullName,
      phone: createForm.phone,
      password: createForm.password,
      merchantId: createForm.merchantId,
      assignmentScope: createForm.assignmentScope,
      branchIds: createForm.assignmentScope === 'branches' ? createForm.branchIds : [],
      primaryBranchId: createForm.assignmentScope === 'branches' ? createForm.primaryBranchId : '',
      staffRole: createForm.staffRole,
      roleIds: createForm.roleIds,
      isActive: createForm.isActive,
      mustChangePassword: createForm.mustChangePassword,
    };

    const result = await adminPlatformUsersService.createPlatformUser(payload);
    setSaving(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setSuccessMessage('Usuario creado exitosamente');
    setCreateModalOpen(false);
    await loadData();
  };

  const openEditDrawer = (record: PlatformUserRecord) => {
    const nextForm = createEditForm(record);
    setSelectedRecord(record);
    setEditForm(nextForm);
    setEditInitialState(serializeDirtyState(nextForm));
    setDrawerOpen(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleSaveEdit = async () => {
    if (!editForm) return;
    setSaving(true);
    setError(null);

    const payload: PlatformUserUpdatePayload = {
      staffId: editForm.staffId,
      userId: editForm.userId,
      fullName: editForm.fullName,
      phone: editForm.phone,
      merchantId: editForm.merchantId,
      assignmentScope: editForm.assignmentScope,
      branchIds: editForm.assignmentScope === 'branches' ? editForm.branchIds : [],
      primaryBranchId: editForm.assignmentScope === 'branches' ? editForm.primaryBranchId : '',
      staffRole: editForm.staffRole,
      roleIds: editForm.roleIds,
      isActive: editForm.isActive,
      password: editForm.password,
      mustChangePassword: editForm.password.trim() ? editForm.mustChangePassword : undefined,
    };

    const result = await adminPlatformUsersService.updatePlatformUser(payload);
    setSaving(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setSuccessMessage(editForm.password.trim() ? 'Usuario actualizado y contraseña temporal reiniciada' : 'Usuario actualizado');
    setDrawerOpen(false);
    await loadData();
  };

  const handleDelete = async (staffId: string) => {
    if (!confirm('¿Desvincular al usuario de este negocio? Esto eliminara su asignacion de personal y sucursales.')) return;
    setSaving(true);
    setError(null);
    const result = await adminPlatformUsersService.deletePlatformUser(staffId);
    setSaving(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setSuccessMessage('Usuario desvinculado');
    setDrawerOpen(false);
    setSelectedRecord(null);
    setEditForm(null);
    await loadData();
  };

  // Handle merchant change in create form — reset branches
  const handleCreateMerchantChange = (merchantId: string) => {
    setCreateForm((current) => ({
      ...current,
      merchantId,
      branchIds: [],
      primaryBranchId: '',
    }));
  };

  const handleCreateScopeChange = (assignmentScope: AssignmentScope) => {
    setCreateForm((current) => ({
      ...current,
      assignmentScope,
      branchIds: assignmentScope === 'merchant' ? [] : current.branchIds,
      primaryBranchId: assignmentScope === 'merchant' ? '' : current.primaryBranchId,
      staffRole: adaptStaffRoleToScope(assignmentScope, current.staffRole),
    }));
  };

  const handleEditMerchantChange = (merchantId: string) => {
    setEditForm((current) => (
      current
        ? {
            ...current,
            merchantId,
            branchIds: [],
            primaryBranchId: '',
          }
        : current
    ));
  };

  const handleEditScopeChange = (assignmentScope: AssignmentScope) => {
    setEditForm((current) => (
      current
        ? {
            ...current,
            assignmentScope,
            branchIds: assignmentScope === 'merchant' ? [] : current.branchIds,
            primaryBranchId: assignmentScope === 'merchant' ? '' : current.primaryBranchId,
            staffRole: adaptStaffRoleToScope(assignmentScope, current.staffRole),
          }
        : current
    ));
  };

  if (portal.currentScopeType !== 'platform') {
    return <div>Esta vista pertenece a la capa plataforma.</div>;
  }

  return (
    <AdminPageFrame
      title="Usuarios"
      description="Gestion centralizada de usuarios asignados al negocio completo o a sucursales puntuales desde la capa de plataforma."
      breadcrumbs={[
        { label: 'Admin', to: AppRoutes.portal.admin.root },
        { label: 'Usuarios' },
      ]}
      contextItems={[
        { label: 'Capa', value: getScopeLabel(portal.currentScopeType), tone: 'info' },
        { label: 'Actor', value: getPortalActorLabel({ roleAssignments: portal.roleAssignments, profile: portal.profile, staffAssignment: portal.staffAssignment }), tone: 'info' },
        { label: 'Entidad', value: 'Usuarios de plataforma', tone: 'warning' },
        { label: 'Total', value: String(records.length), tone: 'info' },
      ]}
      actions={
        <button
          type="button"
          onClick={openCreateModal}
          style={{ padding: '12px 18px', borderRadius: '10px', background: '#111827', color: '#ffffff', fontWeight: 700, border: 'none', cursor: 'pointer' }}
        >
          + Agregar usuario
        </button>
      }
    >
      <SectionCard title="Buscar" description="Filtra por nombre, email, negocio, alcance, rol o sucursal.">
        <TextField value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar usuario..." />
      </SectionCard>

      <FormStatusBar dirty={editDirty || createDirty} saving={saving} error={error} successMessage={successMessage} />

      <SectionCard title="Usuarios asignados" description="Cada usuario puede quedar asignado al negocio completo o a sucursales especificas, con contraseña temporal y recuperacion por correo.">
        {loading ? (
          <LoadingScreen />
        ) : (
          <AdminDataTable
            rows={filteredRecords}
            getRowId={(record) => record.staff_id}
            emptyMessage="No hay usuarios asignados a negocios."
            columns={[
              {
                id: 'user',
                header: 'Usuario',
                render: (record) => (
                  <div style={{ display: 'grid', gap: '4px' }}>
                    <strong>{getUserLabel(record)}</strong>
                    <span style={{ color: '#6b7280', fontSize: '13px' }}>{record.email || 'Sin email'}</span>
                  </div>
                ),
              },
              {
                id: 'merchant',
                header: 'Asignacion',
                render: (record) => (
                  <div style={{ display: 'grid', gap: '6px' }}>
                    <span>{record.merchant_label}</span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <StatusPill label={record.assignment_scope === 'merchant' ? 'Negocio completo' : 'Sucursales'} tone="neutral" />
                      <span style={{ color: '#6b7280', fontSize: '13px' }}>
                        {record.assignment_scope === 'merchant'
                          ? 'Acceso a todo el negocio'
                          : record.branch_labels.length > 0
                            ? record.branch_labels.join(', ')
                            : 'Sin sucursal'}
                      </span>
                    </div>
                  </div>
                ),
              },
              {
                id: 'role',
                header: 'Rol operativo',
                render: (record) => (
                  <StatusPill label={record.staff_role || 'Sin rol'} tone="info" />
                ),
              },
              {
                id: 'platform_roles',
                header: 'Roles plataforma',
                render: (record) => (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {record.role_labels.length > 0
                      ? record.role_labels.map((label) => <StatusPill key={label} label={label} tone="neutral" />)
                      : <span style={{ color: '#9ca3af' }}>Sin roles</span>}
                  </div>
                ),
              },
              {
                id: 'status',
                header: 'Estado',
                render: (record) => (
                  <div style={{ display: 'grid', gap: '6px' }}>
                    <StatusPill label={record.is_active ? 'Activo' : 'Inactivo'} tone={record.is_active ? 'success' : 'danger'} />
                    {record.must_change_password ? <StatusPill label="Cambio pendiente" tone="warning" /> : null}
                  </div>
                ),
              },
              {
                id: 'last_login',
                header: 'Ultimo ingreso',
                render: (record) => <span style={{ color: '#6b7280', fontSize: '13px' }}>{formatLastLogin(record.last_login_at)}</span>,
              },
              {
                id: 'action',
                header: 'Accion',
                align: 'right',
                width: '150px',
                render: (record) => (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => openEditDrawer(record)} style={{ color: '#2563eb', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                      Editar
                    </button>
                    <button type="button" onClick={() => handleDelete(record.staff_id)} style={{ color: '#dc2626', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                      Quitar
                    </button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </SectionCard>

      {/* --- Create Modal --- */}
      <AdminModalForm
        open={createModalOpen}
        title="Agregar usuario a negocio"
        description="Crea o vincula un usuario con contraseña temporal, negocio, sucursales y roles. El usuario debera cambiar su contraseña en el primer acceso."
        onClose={closeCreateModal}
        actions={
          <>
            <button type="button" onClick={closeCreateModal} style={{ padding: '12px 16px' }}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={!createForm.email || !createForm.password || !createForm.merchantId || saving}
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                background: '#111827',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                cursor: 'pointer',
                opacity: !createForm.email || !createForm.password || !createForm.merchantId || saving ? 0.65 : 1,
              }}
            >
              {saving ? 'Creando...' : 'Crear usuario'}
            </button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <FieldGroup label="Email" hint="El correo con el que el usuario ingresara y recuperara su contraseña.">
            <TextField
              value={createForm.email}
              onChange={(event) => setCreateForm((c) => ({ ...c, email: event.target.value }))}
              placeholder="usuario@ejemplo.com"
            />
          </FieldGroup>
          <FieldGroup label="Nombre completo">
            <TextField
              value={createForm.fullName}
              onChange={(event) => setCreateForm((c) => ({ ...c, fullName: event.target.value }))}
              placeholder="Nombre del usuario"
            />
          </FieldGroup>
          <FieldGroup label="Telefono">
            <TextField
              value={createForm.phone}
              onChange={(event) => setCreateForm((c) => ({ ...c, phone: event.target.value }))}
              placeholder="Numero de contacto"
            />
          </FieldGroup>
          <FieldGroup label="Contraseña temporal" hint="Minimo 8 caracteres. El usuario debera cambiarla.">
            <TextField
              type="password"
              value={createForm.password}
              onChange={(event) => setCreateForm((c) => ({ ...c, password: event.target.value }))}
              placeholder="Contraseña temporal"
            />
          </FieldGroup>
          <FieldGroup label="Negocio">
            <SelectField
              value={createForm.merchantId}
              onChange={(event) => handleCreateMerchantChange(event.target.value)}
              options={merchantOptions}
            />
          </FieldGroup>
          <FieldGroup label="Alcance de trabajo" hint="Negocio completo para owner/manager; sucursales para equipos operativos.">
            {renderAssignmentScopeButtons({
              value: createForm.assignmentScope,
              onChange: handleCreateScopeChange,
            })}
          </FieldGroup>
          <FieldGroup label="Rol operativo">
            <SelectField
              value={createForm.staffRole}
              onChange={(event) => setCreateForm((c) => ({ ...c, staffRole: event.target.value }))}
              options={createStaffRoleOptions}
            />
          </FieldGroup>
          {createForm.assignmentScope === 'branches' ? (
            <FieldGroup label="Sucursal principal">
              <SelectField
                value={createForm.primaryBranchId}
                onChange={(event) => setCreateForm((c) => ({ ...c, primaryBranchId: event.target.value }))}
                options={createPrimaryBranchOptions}
              />
            </FieldGroup>
          ) : null}
        </div>

        {createForm.assignmentScope === 'merchant' ? (
          <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#f9fafb', border: '1px solid #e5e7eb', color: '#4b5563', fontSize: '13px' }}>
            Este usuario quedara asignado al negocio completo. No necesita sucursales marcadas para operar en ese alcance.
          </div>
        ) : createBranches.length > 0 ? (
          <div style={{ display: 'grid', gap: '10px' }}>
            <strong style={{ fontSize: '13px' }}>Sucursales asignadas</strong>
            <div style={{ display: 'grid', gap: '8px' }}>
              {createBranches.map((branch) => (
                <CheckboxField
                  key={branch.id}
                  label={branch.name}
                  checked={createForm.branchIds.includes(branch.id)}
                  onChange={(event) =>
                    setCreateForm((c) => ({
                      ...c,
                      branchIds: patchBranchSelection(c.branchIds, branch.id, event.target.checked),
                      primaryBranchId: !event.target.checked && c.primaryBranchId === branch.id
                        ? c.branchIds.filter((id) => id !== branch.id)[0] ?? ''
                        : c.primaryBranchId,
                    }))
                  }
                />
              ))}
            </div>
          </div>
        ) : createForm.merchantId ? (
          <div style={{ color: '#6b7280', fontSize: '13px' }}>Este negocio no tiene sucursales registradas.</div>
        ) : null}

        <div style={{ display: 'grid', gap: '10px' }}>
          <strong style={{ fontSize: '13px' }}>Permisos globales de plataforma (Opcional)</strong>
          <div style={{ display: 'grid', gap: '8px' }}>
            {roles
              .filter((r) => ['admin', 'super_admin'].includes(r.code))
              .map((role) => (
                <CheckboxField
                  key={role.id}
                  label={`${role.name} (${role.code})`}
                  checked={createForm.roleIds.includes(role.id)}
                  onChange={(event) =>
                    setCreateForm((c) => ({
                      ...c,
                      roleIds: event.target.checked
                        ? Array.from(new Set([...c.roleIds, role.id]))
                        : c.roleIds.filter((id) => id !== role.id),
                    }))
                  }
                />
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gap: '10px' }}>
          <CheckboxField
            label="Usuario activo"
            checked={createForm.isActive}
            onChange={(event) => setCreateForm((c) => ({ ...c, isActive: event.target.checked }))}
          />
          <CheckboxField
            label="Forzar cambio de contraseña en el primer ingreso"
            checked={createForm.mustChangePassword}
            onChange={(event) => setCreateForm((c) => ({ ...c, mustChangePassword: event.target.checked }))}
          />
        </div>
      </AdminModalForm>

      {/* --- Edit Drawer --- */}
      <AdminDrawer
        open={drawerOpen && !!editForm}
        title={selectedRecord ? `Editar: ${getUserLabel(selectedRecord)}` : 'Editar usuario'}
        description="Modifica negocio, alcance, sucursales, roles y reinicia una contraseña temporal si hace falta."
        onClose={() => setDrawerOpen(false)}
      >
        {editForm ? (
          <>
            <FieldGroup label="Correo">
              <TextField value={selectedRecord?.email ?? ''} readOnly />
            </FieldGroup>
            <FieldGroup label="Nombre completo">
              <TextField
                value={editForm.fullName}
                onChange={(event) => setEditForm((c) => (c ? { ...c, fullName: event.target.value } : c))}
              />
            </FieldGroup>
            <FieldGroup label="Telefono">
              <TextField
                value={editForm.phone}
                onChange={(event) => setEditForm((c) => (c ? { ...c, phone: event.target.value } : c))}
              />
            </FieldGroup>
            <FieldGroup label="Negocio">
              <SelectField
                value={editForm.merchantId}
                onChange={(event) => handleEditMerchantChange(event.target.value)}
                options={merchantOptions}
              />
            </FieldGroup>
            <FieldGroup label="Alcance de trabajo">
              {renderAssignmentScopeButtons({
                value: editForm.assignmentScope,
                onChange: handleEditScopeChange,
              })}
            </FieldGroup>
            <FieldGroup label="Rol operativo">
              <SelectField
                value={editForm.staffRole}
                onChange={(event) => setEditForm((c) => (c ? { ...c, staffRole: event.target.value } : c))}
                options={editStaffRoleOptions}
              />
            </FieldGroup>
            {editForm.assignmentScope === 'branches' ? (
              <>
                <FieldGroup label="Sucursal principal">
                  <SelectField
                    value={editForm.primaryBranchId}
                    onChange={(event) => setEditForm((c) => (c ? { ...c, primaryBranchId: event.target.value } : c))}
                    options={editPrimaryBranchOptions}
                  />
                </FieldGroup>

                {editBranches.length > 0 ? (
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <strong style={{ fontSize: '13px' }}>Sucursales asignadas</strong>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {editBranches.map((branch) => (
                        <CheckboxField
                          key={branch.id}
                          label={branch.name}
                          checked={editForm.branchIds.includes(branch.id)}
                          onChange={(event) =>
                            setEditForm((c) =>
                              c
                                ? {
                                    ...c,
                                    branchIds: patchBranchSelection(c.branchIds, branch.id, event.target.checked),
                                    primaryBranchId: !event.target.checked && c.primaryBranchId === branch.id
                                      ? c.branchIds.filter((id) => id !== branch.id)[0] ?? ''
                                      : c.primaryBranchId,
                                  }
                                : c
                            )
                          }
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#6b7280', fontSize: '13px' }}>Este negocio no tiene sucursales registradas.</div>
                )}
              </>
            ) : (
              <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#f9fafb', border: '1px solid #e5e7eb', color: '#4b5563', fontSize: '13px' }}>
                El usuario quedara amarrado al negocio completo, sin limitarse a sucursales puntuales.
              </div>
            )}

            <div style={{ display: 'grid', gap: '10px' }}>
              <strong style={{ fontSize: '13px' }}>Permisos globales de plataforma (Opcional)</strong>
              <div style={{ display: 'grid', gap: '8px' }}>
                {roles
                  .filter((r) => ['admin', 'super_admin'].includes(r.code))
                  .map((role) => (
                    <CheckboxField
                      key={role.id}
                      label={`${role.name} (${role.code})`}
                      checked={editForm.roleIds.includes(role.id)}
                      onChange={(event) =>
                        setEditForm((c) =>
                          c
                            ? {
                                ...c,
                                roleIds: event.target.checked
                                  ? Array.from(new Set([...c.roleIds, role.id]))
                                  : c.roleIds.filter((id) => id !== role.id),
                              }
                            : c
                        )
                      }
                    />
                ))}
              </div>
            </div>

            <SectionCard title="Acceso y contraseña" description="Puedes dejar la contraseña actual intacta o definir una nueva temporal para el usuario.">
              <div style={{ display: 'grid', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <StatusPill label={selectedRecord?.must_change_password ? 'Cambio pendiente' : 'Sin cambio forzado'} tone={selectedRecord?.must_change_password ? 'warning' : 'neutral'} />
                  <StatusPill label="Recuperable por correo" tone="info" />
                </div>
                <FieldGroup label="Nueva contraseña temporal" hint="Solo completa este campo si quieres resetear la contraseña actual.">
                  <TextField
                    type="password"
                    value={editForm.password}
                    onChange={(event) => setEditForm((c) => (c ? { ...c, password: event.target.value } : c))}
                    placeholder="Minimo 8 caracteres"
                  />
                </FieldGroup>
                <CheckboxField
                  label="Exigir cambio en el siguiente ingreso"
                  checked={editForm.mustChangePassword}
                  onChange={(event) => setEditForm((c) => (c ? { ...c, mustChangePassword: event.target.checked } : c))}
                  disabled={!editForm.password.trim()}
                />
                <div style={{ color: '#6b7280', fontSize: '13px' }}>
                  Si el usuario olvida su acceso, tambien podra usar la opcion de recuperacion desde la pantalla de login con su correo.
                </div>
              </div>
            </SectionCard>

            <CheckboxField
              label="Usuario activo"
              checked={editForm.isActive}
              onChange={(event) => setEditForm((c) => (c ? { ...c, isActive: event.target.checked } : c))}
            />

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '8px' }}>
              <button type="button" onClick={() => setDrawerOpen(false)} style={{ padding: '12px 16px', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={!editDirty || saving}
                style={{
                  padding: '12px 16px',
                  background: '#111827',
                  color: '#ffffff',
                  borderRadius: '10px',
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                  opacity: !editDirty || saving ? 0.65 : 1,
                }}
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </>
        ) : null}
      </AdminDrawer>
    </AdminPageFrame>
  );
}
