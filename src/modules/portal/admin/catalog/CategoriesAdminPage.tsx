import { useContext, useEffect, useMemo, useState } from 'react';
import { AdminPageFrame, FormStatusBar, SectionCard, StatusPill } from '../../../../components/admin/AdminScaffold';
import { AdminDataTable } from '../../../../components/admin/AdminDataTable';
import { AdminModalForm } from '../../../../components/admin/AdminModalForm';
import { PortalContext } from '../../../auth/session/PortalContext';
import { AppRoutes } from '../../../../core/constants/routes';
import { adminService, CategoryAdminRecord } from '../../../../core/services/adminService';
import { hasDirtyState, serializeDirtyState } from '../../../../core/admin/utils/dirtyState';
import { CheckboxField, FieldGroup, NumberField } from '../../../../components/admin/AdminFields';
import { TextField } from '../../../../components/ui/TextField';
import { LoadingScreen } from '../../../../components/shared/LoadingScreen';

function createEmptyCategory(): CategoryAdminRecord {
  return {
    name: '',
    sort_order: '0',
    is_active: true,
  };
}

export function CategoriesAdminPage() {
  const portal = useContext(PortalContext);
  const merchantId = portal.merchant?.id;
  const [categories, setCategories] = useState<CategoryAdminRecord[]>([]);
  const [selected, setSelected] = useState<CategoryAdminRecord>(createEmptyCategory());
  const [modalOpen, setModalOpen] = useState(false);
  const [initialState, setInitialState] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadCategories = async () => {
    if (!merchantId) return;
    setLoading(true);
    const result = await adminService.fetchCategories(merchantId);
    setLoading(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setCategories(result.data ?? []);
  };

  useEffect(() => {
    loadCategories();
  }, [merchantId]);

  const dirty = useMemo(() => hasDirtyState(selected, initialState), [selected, initialState]);

  const startNew = () => {
    const next = createEmptyCategory();
    setSelected(next);
    setInitialState(serializeDirtyState(next));
    setModalOpen(true);
    setSuccessMessage(null);
    setError(null);
  };

  const editCategory = (category: CategoryAdminRecord) => {
    setSelected(category);
    setInitialState(serializeDirtyState(category));
    setModalOpen(true);
    setSuccessMessage(null);
    setError(null);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelected(createEmptyCategory());
    setInitialState('');
  };

  const handleSave = async () => {
    if (!merchantId) return;
    setSaving(true);
    setError(null);
    const result = await adminService.saveCategory(merchantId, selected);
    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setSuccessMessage('Guardado');
    await loadCategories();
    closeModal();
  };

  if (!merchantId) {
    return <div>No hay comercio activo para gestionar categorias.</div>;
  }

  return (
    <AdminPageFrame
      title="Categorias"
      description="Lista reusable con edicion contextual. El `merchant_id` se completa automaticamente."
      breadcrumbs={[
        { label: 'Admin', to: AppRoutes.portal.admin.root },
        { label: 'Catalogo' },
        { label: 'Categorias' },
      ]}
      contextItems={[
        { label: 'Rol', value: portal.staffAssignment?.role || 'sin rol', tone: 'info' },
        { label: 'Comercio', value: portal.merchant?.name || 'sin comercio', tone: 'neutral' },
        { label: 'Entidad', value: 'Categoria', tone: 'info' },
        { label: 'Modo', value: modalOpen ? (selected.id ? 'Edicion' : 'Creacion') : 'Consulta', tone: dirty ? 'warning' : 'info' },
        { label: 'Estado', value: dirty ? 'Cambios pendientes' : 'Sin cambios', tone: dirty ? 'warning' : 'success' },
      ]}
      actions={
        <button type="button" onClick={startNew} style={{ padding: '12px 16px', borderRadius: '10px', background: '#111827', color: '#ffffff', fontWeight: 600 }}>
          Nueva categoria
        </button>
      }
    >
      <SectionCard title="Categorias del comercio" description="La lista sirve como fuente unica de seleccion para el resto del catalogo.">
        {loading ? (
          <LoadingScreen />
        ) : (
          <AdminDataTable
            rows={categories}
            getRowId={(category) => category.id ?? category.name}
            emptyMessage="No hay categorias registradas."
            columns={[
              {
                id: 'name',
                header: 'Categoria',
                render: (category) => <strong>{category.name}</strong>,
              },
              {
                id: 'sort',
                header: 'Orden',
                render: (category) => category.sort_order,
              },
              {
                id: 'status',
                header: 'Estado',
                render: (category) => <StatusPill label={category.is_active ? 'Activa' : 'Inactiva'} tone={category.is_active ? 'success' : 'warning'} />,
              },
              {
                id: 'action',
                header: 'Accion',
                align: 'right',
                width: '140px',
                render: (category) => (
                  <button type="button" onClick={() => editCategory(category)} style={{ color: '#2563eb', fontWeight: 700 }}>
                    Editar
                  </button>
                ),
              },
            ]}
          />
        )}
      </SectionCard>

      <FormStatusBar dirty={dirty && modalOpen} saving={saving} error={error} successMessage={successMessage} />

      <AdminModalForm
        open={modalOpen}
        title={selected.id ? 'Editar categoria' : 'Nueva categoria'}
        description="Formulario corto y contextual para una entidad raiz simple del catalogo."
        onClose={closeModal}
        actions={
          <>
            <button type="button" onClick={closeModal} style={{ padding: '12px 16px' }}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || saving}
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                background: '#111827',
                color: '#ffffff',
                opacity: !dirty || saving ? 0.65 : 1,
              }}
            >
              {saving ? 'Guardando...' : 'Guardar categoria'}
            </button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <FieldGroup label="Nombre">
            <TextField value={selected.name} onChange={(event) => setSelected((current) => ({ ...current, name: event.target.value }))} />
          </FieldGroup>
          <FieldGroup label="Orden">
            <NumberField value={selected.sort_order} onChange={(event) => setSelected((current) => ({ ...current, sort_order: event.target.value }))} />
          </FieldGroup>
        </div>
        <CheckboxField
          label="Categoria activa"
          checked={selected.is_active}
          onChange={(event) => setSelected((current) => ({ ...current, is_active: event.target.checked }))}
        />
      </AdminModalForm>
    </AdminPageFrame>
  );
}
