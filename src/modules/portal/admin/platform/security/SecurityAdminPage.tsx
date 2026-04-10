import { useContext, useEffect, useMemo, useState } from 'react';
import { AdminDataTable } from '../../../../../components/admin/AdminDataTable';
import { AdminDrawer } from '../../../../../components/admin/AdminDrawer';
import { CheckboxField, FieldGroup } from '../../../../../components/admin/AdminFields';
import { AdminModalForm } from '../../../../../components/admin/AdminModalForm';
import { AdminPageFrame, FormStatusBar, SectionCard, StatusPill } from '../../../../../components/admin/AdminScaffold';
import { AdminTabPanel, AdminTabs } from '../../../../../components/admin/AdminTabs';
import { LoadingScreen } from '../../../../../components/shared/LoadingScreen';
import { TextField } from '../../../../../components/ui/TextField';
import { getPortalActorLabel, getScopeLabel } from '../../../../../core/auth/portalAccess';
import { hasDirtyState, serializeDirtyState } from '../../../../../core/admin/utils/dirtyState';
import { AppRoutes } from '../../../../../core/constants/routes';
import {
  adminSecurityService,
  SecurityAccessForm,
  SecurityAccessRecord,
  SecurityOverview,
  SecurityRoleForm,
  SecurityRoleRecord,
} from '../../../../../core/services/adminSecurityService';
import { PortalContext } from '../../../../auth/session/PortalContext';

type SecurityTab = 'access' | 'roles';

function getAccessLabel(record: SecurityAccessRecord) {
  return record.full_name || record.email || record.user_id;
}

export function SecurityAdminPage() {
  const portal = useContext(PortalContext);
  const [activeTab, setActiveTab] = useState<SecurityTab>('access');
  const [overview, setOverview] = useState<SecurityOverview | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedAccess, setSelectedAccess] = useState<SecurityAccessRecord | null>(null);
  const [accessForm, setAccessForm] = useState<SecurityAccessForm | null>(null);
  const [accessInitialState, setAccessInitialState] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleForm, setRoleForm] = useState<SecurityRoleForm>(adminSecurityService.createRoleForm());

  const loadData = async (targetUserId?: string) => {
    setLoading(true);
    setError(null);
    const result = await adminSecurityService.fetchSecurityOverview();
    setLoading(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }

    const nextOverview = result.data ?? null;
    setOverview(nextOverview);

    const nextSelected =
      (targetUserId ? nextOverview?.access_records.find((item) => item.user_id === targetUserId) : null) ||
      (selectedAccess ? nextOverview?.access_records.find((item) => item.user_id === selectedAccess.user_id) : null) ||
      null;

    if (nextSelected) {
      const nextForm = adminSecurityService.createAccessForm(nextSelected);
      setSelectedAccess(nextSelected);
      setAccessForm(nextForm);
      setAccessInitialState(serializeDirtyState(nextForm));
    } else {
      setSelectedAccess(null);
      setAccessForm(null);
      setAccessInitialState('');
    }
  };

  useEffect(() => {
    if (portal.currentScopeType === 'platform') {
      loadData();
    }
  }, [portal.currentScopeType]);

  const filteredAccessRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const rows = overview?.access_records ?? [];
    if (!normalizedQuery) return rows;
    return rows.filter((record) =>
      [
        record.full_name,
        record.email,
        record.phone,
        record.default_role,
        record.role_labels.join(' '),
        record.layers.join(' '),
        record.merchant_labels.join(' '),
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [overview?.access_records, query]);

  const filteredRoles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const rows = overview?.roles ?? [];
    if (!normalizedQuery) return rows;
    return rows.filter((record) => [record.code, record.name].join(' ').toLowerCase().includes(normalizedQuery));
  }, [overview?.roles, query]);

  const accessDirty = useMemo(() => (accessForm ? hasDirtyState(accessForm, accessInitialState) : false), [accessForm, accessInitialState]);

  const handleOpenAccess = (record: SecurityAccessRecord) => {
    const nextForm = adminSecurityService.createAccessForm(record);
    setSelectedAccess(record);
    setAccessForm(nextForm);
    setAccessInitialState(serializeDirtyState(nextForm));
    setDrawerOpen(true);
    setSuccessMessage(null);
  };

  const handleSaveAccess = async () => {
    if (!accessForm) return;
    setSaving(true);
    setError(null);
    const result = await adminSecurityService.saveAccess(accessForm);
    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setSuccessMessage('Accesos actualizados');
    setDrawerOpen(false);
    await loadData(accessForm.user_id);
  };

  const openRoleModal = (role?: SecurityRoleRecord) => {
    setRoleForm(adminSecurityService.createRoleForm(role));
    setRoleModalOpen(true);
    setSuccessMessage(null);
  };

  const handleSaveRole = async () => {
    setSaving(true);
    setError(null);
    const result = await adminSecurityService.saveRole(roleForm);
    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setRoleModalOpen(false);
    setSuccessMessage(roleForm.id ? 'Rol actualizado' : 'Rol creado');
    await loadData();
  };

  if (portal.currentScopeType !== 'platform') {
    return <div>Esta vista pertenece a la capa plataforma.</div>;
  }

  return (
    <AdminPageFrame
      title="Seguridad"
      description="Centro institucional de roles, accesos y jerarquia de plataforma."
      breadcrumbs={[
        { label: 'Admin', to: AppRoutes.portal.admin.root },
        { label: 'Seguridad' },
      ]}
      contextItems={[
        { label: 'Capa', value: getScopeLabel(portal.currentScopeType), tone: 'info' },
        { label: 'Actor', value: getPortalActorLabel({ roleAssignments: portal.roleAssignments, profile: portal.profile, staffAssignment: portal.staffAssignment }), tone: 'info' },
        { label: 'Entidad', value: 'Roles y accesos', tone: 'warning' },
        { label: 'Modo', value: 'Gobierno', tone: 'warning' },
      ]}
    >
      <SectionCard title="Buscar" description="Filtra usuarios, roles o capas de acceso por texto libre.">
        <TextField value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar usuario o rol..." />
      </SectionCard>

      <FormStatusBar dirty={accessDirty} saving={saving} error={error} successMessage={successMessage} />

      <SectionCard title="Centro de seguridad" description="roles y user_roles dejan de quedar escondidos dentro de Personal y pasan a una consola de plataforma.">
        <AdminTabs
          tabs={[
            { id: 'access', label: 'Accesos', badge: String(overview?.access_records.length ?? 0) },
            { id: 'roles', label: 'Roles', badge: String(overview?.roles.length ?? 0) },
          ]}
          activeTabId={activeTab}
          onChange={(tabId) => setActiveTab(tabId as SecurityTab)}
        />

        {loading ? <LoadingScreen /> : null}

        {activeTab === 'access' && !loading ? (
          <AdminTabPanel>
            <AdminDataTable
              rows={filteredAccessRecords}
              getRowId={(record) => record.user_id}
              emptyMessage="No hay usuarios con perfil registrados."
              columns={[
                {
                  id: 'user',
                  header: 'Usuario',
                  render: (record) => (
                    <div style={{ display: 'grid', gap: '6px' }}>
                      <strong>{getAccessLabel(record)}</strong>
                      <span style={{ color: '#6b7280' }}>{record.email || 'Sin email'}</span>
                    </div>
                  ),
                },
                {
                  id: 'layers',
                  header: 'Capas',
                  render: (record) => (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {record.layers.length > 0 ? record.layers.map((layer) => <StatusPill key={layer} label={layer} tone="info" />) : <StatusPill label="Sin capa" tone="warning" />}
                    </div>
                  ),
                },
                {
                  id: 'roles',
                  header: 'Roles',
                  render: (record) => (
                    <div style={{ display: 'grid', gap: '6px' }}>
                      <span>{record.default_role || 'Sin default_role'}</span>
                      <span style={{ color: '#6b7280' }}>{record.role_labels.join(', ') || 'Sin user_roles'}</span>
                    </div>
                  ),
                },
                {
                  id: 'scope',
                  header: 'Negocios',
                  render: (record) => record.merchant_labels.join(', ') || 'Sin negocio',
                },
                {
                  id: 'status',
                  header: 'Estado',
                  render: (record) => <StatusPill label={record.is_active ? 'Activo' : 'Inactivo'} tone={record.is_active ? 'success' : 'danger'} />,
                },
                {
                  id: 'action',
                  header: 'Accion',
                  align: 'right',
                  width: '150px',
                  render: (record) => (
                    <button type="button" onClick={() => handleOpenAccess(record)} style={{ color: '#2563eb', fontWeight: 700 }}>
                      Editar acceso
                    </button>
                  ),
                },
              ]}
            />
          </AdminTabPanel>
        ) : null}

        {activeTab === 'roles' && !loading ? (
          <AdminTabPanel>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => openRoleModal()} style={{ padding: '12px 16px', borderRadius: '10px', background: '#111827', color: '#ffffff', fontWeight: 700 }}>
                Nuevo rol
              </button>
            </div>
            <AdminDataTable
              rows={filteredRoles}
              getRowId={(record) => record.id}
              emptyMessage="No hay roles registrados."
              columns={[
                {
                  id: 'name',
                  header: 'Rol',
                  render: (record) => (
                    <div style={{ display: 'grid', gap: '6px' }}>
                      <strong>{record.name}</strong>
                      <span style={{ color: '#6b7280' }}>{record.code}</span>
                    </div>
                  ),
                },
                {
                  id: 'action',
                  header: 'Accion',
                  align: 'right',
                  width: '140px',
                  render: (record) => (
                    <button type="button" onClick={() => openRoleModal(record)} style={{ color: '#2563eb', fontWeight: 700 }}>
                      Editar
                    </button>
                  ),
                },
              ]}
            />
          </AdminTabPanel>
        ) : null}
      </SectionCard>

      <AdminDrawer
        open={drawerOpen && !!accessForm}
        title={selectedAccess ? `Editar acceso: ${getAccessLabel(selectedAccess)}` : 'Editar acceso'}
        description="Aqui se gobiernan default_role y user_roles desde plataforma."
        onClose={() => setDrawerOpen(false)}
      >
        {accessForm ? (
          <>
            <FieldGroup label="Usuario">
              <TextField value={accessForm.full_name || accessForm.email || accessForm.user_id} disabled />
            </FieldGroup>
            <FieldGroup label="Email">
              <TextField value={accessForm.email} disabled />
            </FieldGroup>
            <FieldGroup label="Rol por defecto">
              <TextField value={accessForm.default_role} onChange={(event) => setAccessForm((current) => (current ? { ...current, default_role: event.target.value } : current))} />
            </FieldGroup>
            <div style={{ display: 'grid', gap: '10px' }}>
              <strong style={{ fontSize: '13px' }}>Roles de plataforma</strong>
              {(overview?.roles ?? []).map((role) => (
                <CheckboxField
                  key={role.id}
                  label={`${role.name} (${role.code})`}
                  checked={accessForm.role_ids.includes(role.id)}
                  onChange={(event) =>
                    setAccessForm((current) =>
                      current
                        ? {
                            ...current,
                            role_ids: event.target.checked
                              ? Array.from(new Set([...current.role_ids, role.id]))
                              : current.role_ids.filter((roleId) => roleId !== role.id),
                          }
                        : current
                    )
                  }
                />
              ))}
            </div>
            <CheckboxField
              label="Usuario activo"
              checked={accessForm.is_active}
              onChange={(event) => setAccessForm((current) => (current ? { ...current, is_active: event.target.checked } : current))}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setDrawerOpen(false)} style={{ padding: '12px 16px' }}>
                Cancelar
              </button>
              <button type="button" onClick={handleSaveAccess} style={{ padding: '12px 16px', background: '#111827', color: '#ffffff', borderRadius: '10px' }}>
                {saving ? 'Guardando...' : 'Guardar acceso'}
              </button>
            </div>
          </>
        ) : null}
      </AdminDrawer>

      <AdminModalForm
        open={roleModalOpen}
        title={roleForm.id ? 'Editar rol' : 'Nuevo rol'}
        description="Catalogo institucional de la tabla roles."
        onClose={() => setRoleModalOpen(false)}
        actions={
          <>
            <button type="button" onClick={() => setRoleModalOpen(false)} style={{ padding: '12px 16px' }}>
              Cancelar
            </button>
            <button type="button" onClick={handleSaveRole} style={{ padding: '12px 16px', background: '#111827', color: '#ffffff', borderRadius: '10px' }}>
              {saving ? 'Guardando...' : 'Guardar rol'}
            </button>
          </>
        }
      >
        <FieldGroup label="Codigo">
          <TextField value={roleForm.code} onChange={(event) => setRoleForm((current) => ({ ...current, code: event.target.value }))} />
        </FieldGroup>
        <FieldGroup label="Nombre">
          <TextField value={roleForm.name} onChange={(event) => setRoleForm((current) => ({ ...current, name: event.target.value }))} />
        </FieldGroup>
      </AdminModalForm>
    </AdminPageFrame>
  );
}
