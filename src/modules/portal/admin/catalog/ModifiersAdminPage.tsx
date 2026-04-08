import { useContext, useEffect, useMemo, useState } from 'react';
import { AdminPageFrame, FormStatusBar, SaveActions, SectionCard, StatusPill } from '../../../../components/admin/AdminScaffold';
import { AdminDataTable } from '../../../../components/admin/AdminDataTable';
import { CheckboxField, FieldGroup, NumberField } from '../../../../components/admin/AdminFields';
import { AdminTabPanel, AdminTabs } from '../../../../components/admin/AdminTabs';
import { LoadingScreen } from '../../../../components/shared/LoadingScreen';
import { TextField } from '../../../../components/ui/TextField';
import { AppRoutes } from '../../../../core/constants/routes';
import { hasDirtyState, serializeDirtyState } from '../../../../core/admin/utils/dirtyState';
import { adminService, ModifierGroupAdminRecord, ModifierOptionAdminRecord } from '../../../../core/services/adminService';
import { PortalContext } from '../../../auth/session/PortalContext';

function createEmptyOption(): ModifierOptionAdminRecord {
  return {
    name: '',
    price_delta: '0',
    sort_order: '0',
    is_active: true,
  };
}

function createEmptyGroup(): ModifierGroupAdminRecord {
  return {
    name: '',
    min_select: '0',
    max_select: '1',
    is_required: false,
    is_active: true,
    options: [],
  };
}

export function ModifiersAdminPage() {
  const portal = useContext(PortalContext);
  const merchantId = portal.merchant?.id;
  const [activeTab, setActiveTab] = useState('group');
  const [groups, setGroups] = useState<ModifierGroupAdminRecord[]>([]);
  const [selected, setSelected] = useState<ModifierGroupAdminRecord>(createEmptyGroup());
  const [initialState, setInitialState] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadGroups = async () => {
    if (!merchantId) return;
    setLoading(true);
    const result = await adminService.fetchModifierGroups(merchantId);
    setLoading(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setGroups(result.data ?? []);
  };

  useEffect(() => {
    loadGroups();
  }, [merchantId]);

  const dirty = useMemo(() => hasDirtyState(selected, initialState), [selected, initialState]);

  const startNew = () => {
    const next = createEmptyGroup();
    setSelected(next);
    setInitialState(serializeDirtyState(next));
    setSuccessMessage(null);
    setError(null);
    setActiveTab('group');
  };

  const editGroup = (group: ModifierGroupAdminRecord) => {
    setSelected(group);
    setInitialState(serializeDirtyState(group));
    setSuccessMessage(null);
    setError(null);
    setActiveTab('group');
  };

  const addOption = () => {
    setSelected((current) => ({
      ...current,
      options: [...current.options, createEmptyOption()],
    }));
    setSuccessMessage(null);
    setActiveTab('options');
  };

  const updateOption = (index: number, patch: Partial<ModifierOptionAdminRecord>) => {
    setSelected((current) => ({
      ...current,
      options: current.options.map((option, currentIndex) => (currentIndex === index ? { ...option, ...patch } : option)),
    }));
    setSuccessMessage(null);
  };

  const removeOption = (index: number) => {
    setSelected((current) => ({
      ...current,
      options: current.options.filter((_, currentIndex) => currentIndex !== index),
    }));
    setSuccessMessage(null);
  };

  const handleSave = async () => {
    if (!merchantId) return;
    setSaving(true);
    setError(null);
    const result = await adminService.saveModifierGroup(merchantId, selected);
    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setSuccessMessage('Guardado');
    await loadGroups();
    startNew();
  };

  const handleDelete = async () => {
    if (!selected.id) return;
    setSaving(true);
    setError(null);
    const result = await adminService.deleteModifierGroup(selected.id);
    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setSuccessMessage('Grupo eliminado');
    await loadGroups();
    startNew();
  };

  if (!merchantId) {
    return <div>No hay comercio activo para gestionar modificadores.</div>;
  }

  return (
    <AdminPageFrame
      title="Modificadores"
      description="Administra grupos y opciones reutilizables para productos del comercio."
      breadcrumbs={[
        { label: 'Admin', to: AppRoutes.portal.admin.root },
        { label: 'Catalogo' },
        { label: 'Modificadores' },
      ]}
      contextItems={[
        { label: 'Rol', value: portal.staffAssignment?.role || 'sin rol', tone: 'info' },
        { label: 'Comercio', value: portal.merchant?.name || 'sin comercio', tone: 'neutral' },
        { label: 'Entidad', value: 'Modificadores', tone: 'info' },
        { label: 'Modo', value: selected.id ? 'Edicion' : 'Creacion', tone: dirty ? 'warning' : 'info' },
        { label: 'Estado', value: dirty ? 'Cambios pendientes' : 'Sin cambios', tone: dirty ? 'warning' : 'success' },
      ]}
      actions={
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {selected.id ? (
            <button
              onClick={handleDelete}
              disabled={saving}
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid #fecaca',
                background: '#ffffff',
                color: '#b91c1c',
                opacity: saving ? 0.65 : 1,
              }}
            >
              Eliminar grupo
            </button>
          ) : null}
          <SaveActions onSave={handleSave} onCancel={startNew} disabled={!dirty || loading} isSaving={saving} />
        </div>
      }
    >
      <SectionCard title="Grupos del comercio" description="Cada grupo representa una familia de extras, tamanos o toppings.">
        {loading ? (
          <LoadingScreen />
        ) : (
          <AdminDataTable
            rows={groups}
            getRowId={(group) => group.id ?? group.name}
            emptyMessage="No hay grupos de modificadores registrados."
            columns={[
              {
                id: 'name',
                header: 'Grupo',
                render: (group) => (
                  <div style={{ display: 'grid', gap: '6px' }}>
                    <strong>{group.name}</strong>
                    <span style={{ color: '#6b7280' }}>
                      {group.is_required ? 'Obligatorio' : 'Opcional'} · Min {group.min_select} · Max {group.max_select}
                    </span>
                  </div>
                ),
              },
              {
                id: 'options',
                header: 'Opciones',
                render: (group) => group.options.length,
              },
              {
                id: 'status',
                header: 'Estado',
                render: (group) => <StatusPill label={group.is_active ? 'Activo' : 'Inactivo'} tone={group.is_active ? 'success' : 'warning'} />,
              },
              {
                id: 'action',
                header: 'Accion',
                align: 'right',
                width: '140px',
                render: (group) => (
                  <button type="button" onClick={() => editGroup(group)} style={{ color: '#2563eb', fontWeight: 700 }}>
                    Editar
                  </button>
                ),
              },
            ]}
          />
        )}
      </SectionCard>

      <AdminTabs
        tabs={[
          { id: 'group', label: 'Grupo' },
          { id: 'options', label: 'Opciones', badge: String(selected.options.length) },
        ]}
        activeTabId={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'group' ? (
        <AdminTabPanel>
          <SectionCard title={selected.id ? 'Editar grupo' : 'Nuevo grupo'} description="Cada grupo se guarda con sus opciones sin pedir claves manuales.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <FieldGroup label="Nombre del grupo">
                <TextField value={selected.name} onChange={(event) => setSelected((current) => ({ ...current, name: event.target.value }))} />
              </FieldGroup>
              <FieldGroup label="Minimo de seleccion">
                <NumberField
                  value={selected.min_select}
                  onChange={(event) => setSelected((current) => ({ ...current, min_select: event.target.value }))}
                />
              </FieldGroup>
              <FieldGroup label="Maximo de seleccion">
                <NumberField
                  value={selected.max_select}
                  onChange={(event) => setSelected((current) => ({ ...current, max_select: event.target.value }))}
                />
              </FieldGroup>
            </div>
            <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
              <CheckboxField
                label="Grupo obligatorio"
                checked={selected.is_required}
                onChange={(event) => setSelected((current) => ({ ...current, is_required: event.target.checked }))}
              />
              <CheckboxField
                label="Grupo activo"
                checked={selected.is_active}
                onChange={(event) => setSelected((current) => ({ ...current, is_active: event.target.checked }))}
              />
            </div>
          </SectionCard>
        </AdminTabPanel>
      ) : null}

      {activeTab === 'options' ? (
        <AdminTabPanel>
          <SectionCard title="Opciones del grupo" description="Las opciones se guardan en `modifier_options` y quedan listas para asignarse a productos.">
            {selected.options.length === 0 ? <div style={{ color: '#6b7280' }}>Aun no hay opciones en este grupo.</div> : null}
            <div style={{ display: 'grid', gap: '12px' }}>
              {selected.options.map((option, index) => (
                <div
                  key={option.id ?? `option-${index}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr)) auto',
                    gap: '12px',
                    padding: '14px',
                    borderRadius: '14px',
                    border: '1px solid #e5e7eb',
                    background: '#f9fafb',
                  }}
                >
                  <FieldGroup label="Nombre">
                    <TextField value={option.name} onChange={(event) => updateOption(index, { name: event.target.value })} />
                  </FieldGroup>
                  <FieldGroup label="Delta de precio">
                    <NumberField value={option.price_delta} onChange={(event) => updateOption(index, { price_delta: event.target.value })} />
                  </FieldGroup>
                  <FieldGroup label="Orden">
                    <NumberField value={option.sort_order} onChange={(event) => updateOption(index, { sort_order: event.target.value })} />
                  </FieldGroup>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'end', justifyContent: 'space-between' }}>
                    <CheckboxField
                      label="Activa"
                      checked={option.is_active}
                      onChange={(event) => updateOption(index, { is_active: event.target.checked })}
                    />
                    <button type="button" onClick={() => removeOption(index)}>
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <button type="button" onClick={addOption}>
                Agregar opcion
              </button>
            </div>
          </SectionCard>
        </AdminTabPanel>
      ) : null}

      <FormStatusBar dirty={dirty} saving={saving} error={error} successMessage={successMessage} />
    </AdminPageFrame>
  );
}
