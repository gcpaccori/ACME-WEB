import { useContext, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { CheckboxField, FieldGroup, NumberField, TextAreaField } from '../../../../components/admin/AdminFields';
import { AdminDataTable } from '../../../../components/admin/AdminDataTable';
import { AdminModalForm } from '../../../../components/admin/AdminModalForm';
import { AdminPageFrame, FormStatusBar, SectionCard, StatusPill } from '../../../../components/admin/AdminScaffold';
import { LoadingScreen } from '../../../../components/shared/LoadingScreen';
import { TextField } from '../../../../components/ui/TextField';
import { getPortalActorLabel, getScopeLabel } from '../../../../core/auth/portalAccess';
import { AppRoutes } from '../../../../core/constants/routes';
import {
  adminBranchOperationsService,
  OperationalMenuForm,
  OperationalMenuRecord,
} from '../../../../core/services/adminBranchOperationsService';
import { PortalContext } from '../../../auth/session/PortalContext';

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(value);
}

function productThumbStyle(imageUrl: string | null | undefined): CSSProperties {
  return imageUrl
    ? {
        width: '56px',
        height: '56px',
        borderRadius: '14px',
        background: `center / cover no-repeat url(${imageUrl})`,
        border: '1px solid #e5e7eb',
        flex: '0 0 auto',
      }
    : {
        width: '56px',
        height: '56px',
        borderRadius: '14px',
        background: 'linear-gradient(135deg, rgba(255,98,0,.18), rgba(255,177,122,.28))',
        border: '1px solid #e5e7eb',
        flex: '0 0 auto',
      };
}

export function BranchOperationalMenuPage() {
  const portal = useContext(PortalContext);
  const merchantId = portal.currentMerchant?.id;
  const branchId = portal.currentBranch?.id;

  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<OperationalMenuRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<OperationalMenuRecord | null>(null);
  const [form, setForm] = useState<OperationalMenuForm>(adminBranchOperationsService.createOperationalMenuForm());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = async () => {
    if (!merchantId || !branchId) return;
    setLoading(true);
    setError(null);
    const result = await adminBranchOperationsService.fetchOperationalMenu(merchantId, branchId);
    setLoading(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setRows(result.data ?? []);
  };

  useEffect(() => {
    loadData();
  }, [branchId, merchantId]);

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return rows;
    return rows.filter((record) =>
      [record.name, record.description, record.category_name, record.pause_reason].join(' ').toLowerCase().includes(normalized)
    );
  }, [query, rows]);

  const summary = useMemo(
    () => ({
      total: rows.length,
      active: rows.filter((record) => record.is_active).length,
      available: rows.filter((record) => record.is_active && record.is_available && !record.is_paused).length,
      paused: rows.filter((record) => record.is_paused).length,
      inactive: rows.filter((record) => !record.is_active).length,
    }),
    [rows]
  );

  const dirty = useMemo(() => {
    if (!selectedRecord) return false;
    const initial = adminBranchOperationsService.createOperationalMenuForm(selectedRecord);
    return JSON.stringify(initial) !== JSON.stringify(form);
  }, [form, selectedRecord]);

  const handleOpenModal = (record: OperationalMenuRecord) => {
    setSelectedRecord(record);
    setForm(adminBranchOperationsService.createOperationalMenuForm(record));
    setSuccessMessage(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedRecord(null);
    setForm(adminBranchOperationsService.createOperationalMenuForm());
  };

  const handleSave = async () => {
    if (!branchId || !selectedRecord) return;
    setSaving(true);
    setError(null);
    const result = await adminBranchOperationsService.saveOperationalMenu(branchId, selectedRecord.id, form);
    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setSuccessMessage('Configuracion operativa actualizada');
    handleCloseModal();
    await loadData();
  };

  if (!merchantId || !branchId) {
    return <div>No hay sucursal activa para operar el menu.</div>;
  }

  if (portal.currentScopeType !== 'branch') {
    return <div>Esta vista pertenece a la capa sucursal.</div>;
  }

  return (
    <AdminPageFrame
      title="Menu operativo"
      description="Control rapido de disponibilidad por sucursal para pausar productos, ajustar precio de turno y evitar errores en caja."
      breadcrumbs={[
        { label: 'Admin', to: AppRoutes.portal.admin.root },
        { label: 'Menu operativo' },
      ]}
      contextItems={[
        { label: 'Capa', value: getScopeLabel(portal.currentScopeType), tone: 'info' },
        {
          label: 'Actor',
          value: getPortalActorLabel({ roleAssignments: portal.roleAssignments, profile: portal.profile, staffAssignment: portal.staffAssignment }),
          tone: 'info',
        },
        { label: 'Comercio', value: portal.currentMerchant?.name || 'sin comercio', tone: 'neutral' },
        { label: 'Sucursal', value: portal.currentBranch?.name || 'sin sucursal', tone: 'neutral' },
        { label: 'Modo', value: 'Operacion del menu', tone: 'warning' },
      ]}
    >
      <SectionCard title="Lectura operativa" description="La sucursal opera products y product_branch_settings como una sola vista util, no como tablas sueltas.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          {[
            { label: 'Productos', value: String(summary.total) },
            { label: 'Activos', value: String(summary.active) },
            { label: 'Disponibles', value: String(summary.available) },
            { label: 'Pausados', value: String(summary.paused) },
            { label: 'Inactivos', value: String(summary.inactive) },
          ].map((item) => (
            <div key={item.label} style={{ padding: '14px', borderRadius: '14px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
              <div style={{ color: '#6b7280', fontSize: '13px' }}>{item.label}</div>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Buscar producto" description="Filtra por producto, categoria o motivo de pausa para operar rapido durante el turno.">
        <TextField value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar producto..." />
      </SectionCard>

      <FormStatusBar dirty={false} saving={saving} error={error} successMessage={successMessage} />

      <SectionCard title="Carta por sucursal" description="Aqui ves el estado real que usa el local para vender, pausar o ajustar disponibilidad.">
        {loading ? (
          <LoadingScreen />
        ) : (
          <AdminDataTable
            rows={filteredRows}
            getRowId={(record) => record.id}
            emptyMessage="No hay productos visibles para esta sucursal."
            columns={[
              {
                id: 'product',
                header: 'Producto',
                render: (record) => (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={productThumbStyle(record.image_url)} />
                    <div style={{ display: 'grid', gap: '6px' }}>
                      <strong>{record.name}</strong>
                      <span style={{ color: '#6b7280' }}>{record.category_name}</span>
                    </div>
                  </div>
                ),
              },
              {
                id: 'price',
                header: 'Precio',
                render: (record) => (
                  <div style={{ display: 'grid', gap: '6px' }}>
                    <span>Base: {formatMoney(record.base_price)}</span>
                    <span style={{ color: '#6b7280' }}>Sucursal: {formatMoney(record.branch_price)}</span>
                  </div>
                ),
              },
              {
                id: 'state',
                header: 'Estado',
                render: (record) => (
                  <div style={{ display: 'grid', gap: '6px' }}>
                    <StatusPill label={record.is_active ? 'Activo' : 'Inactivo'} tone={record.is_active ? 'success' : 'danger'} />
                    <StatusPill label={record.is_available ? 'Disponible' : 'No disponible'} tone={record.is_available ? 'info' : 'warning'} />
                    {record.is_paused ? <StatusPill label="Pausado" tone="warning" /> : null}
                  </div>
                ),
              },
              {
                id: 'pause_reason',
                header: 'Motivo',
                render: (record) => record.pause_reason || 'Sin pausa',
              },
              {
                id: 'action',
                header: 'Accion',
                align: 'right',
                width: '160px',
                render: (record) => (
                  <button type="button" onClick={() => handleOpenModal(record)} style={{ color: '#2563eb', fontWeight: 700 }}>
                    Configurar
                  </button>
                ),
              },
            ]}
          />
        )}
      </SectionCard>

      <AdminModalForm
        open={modalOpen && Boolean(selectedRecord)}
        title={selectedRecord ? `Configurar ${selectedRecord.name}` : 'Configurar producto'}
        description="Actualiza product_branch_settings para esta sucursal sin tocar la ficha global del producto."
        onClose={handleCloseModal}
        actions={
          <>
            <button type="button" onClick={handleCloseModal} style={{ padding: '12px 16px' }}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !dirty}
              style={{ padding: '12px 16px', borderRadius: '10px', background: '#111827', color: '#ffffff' }}
            >
              {saving ? 'Guardando...' : 'Guardar configuracion'}
            </button>
          </>
        }
      >
        {selectedRecord ? (
          <>
            <FormStatusBar dirty={dirty} saving={saving} error={error} successMessage={null} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div style={{ padding: '14px', borderRadius: '14px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <div style={{ color: '#6b7280', fontSize: '13px' }}>Producto</div>
                  <strong>{selectedRecord.name}</strong>
                  <div style={{ color: '#6b7280', marginTop: '8px' }}>{selectedRecord.category_name}</div>
                </div>
                <div style={{ padding: '14px', borderRadius: '14px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <div style={{ color: '#6b7280', fontSize: '13px' }}>Imagen</div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '10px' }}>
                    <div style={productThumbStyle(selectedRecord.image_url)} />
                    <div style={{ color: '#6b7280', fontSize: '13px' }}>
                      {selectedRecord.image_url ? 'Este plato ya tiene imagen asociada.' : 'Este plato no tiene imagen cargada.'}
                    </div>
                  </div>
                </div>
                <div style={{ padding: '14px', borderRadius: '14px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <div style={{ color: '#6b7280', fontSize: '13px' }}>Precio base</div>
                  <strong>{formatMoney(selectedRecord.base_price)}</strong>
                <div style={{ color: '#6b7280', marginTop: '8px' }}>Puedes dejar el override vacio para usar el precio global.</div>
              </div>
            </div>
            <FieldGroup label="Precio operativo">
              <NumberField
                value={form.price_override}
                onChange={(event) => setForm((current) => ({ ...current, price_override: event.target.value }))}
                placeholder={String(selectedRecord.base_price)}
              />
            </FieldGroup>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <CheckboxField
                label="Producto disponible en sucursal"
                checked={form.is_available}
                onChange={(event) => setForm((current) => ({ ...current, is_available: event.target.checked }))}
              />
              <CheckboxField
                label="Producto pausado temporalmente"
                checked={form.is_paused}
                onChange={(event) => setForm((current) => ({ ...current, is_paused: event.target.checked }))}
              />
            </div>
            <FieldGroup label="Motivo de pausa">
              <TextAreaField
                value={form.pause_reason}
                onChange={(event) => setForm((current) => ({ ...current, pause_reason: event.target.value }))}
                placeholder="Ejemplo: Sin insumo, cocina detenida, stock parcial."
              />
            </FieldGroup>
          </>
        ) : null}
      </AdminModalForm>
    </AdminPageFrame>
  );
}
