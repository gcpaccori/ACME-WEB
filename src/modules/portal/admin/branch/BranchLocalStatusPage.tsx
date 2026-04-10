import { useContext, useEffect, useMemo, useState } from 'react';
import { CheckboxField, FieldGroup, TextAreaField } from '../../../../components/admin/AdminFields';
import { AdminDataTable } from '../../../../components/admin/AdminDataTable';
import { AdminPageFrame, FormStatusBar, SectionCard, StatusPill } from '../../../../components/admin/AdminScaffold';
import { LoadingScreen } from '../../../../components/shared/LoadingScreen';
import { getPortalActorLabel, getScopeLabel } from '../../../../core/auth/portalAccess';
import { AppRoutes } from '../../../../core/constants/routes';
import { adminBranchOperationsService, BranchLocalStatusOverview } from '../../../../core/services/adminBranchOperationsService';
import { PortalContext } from '../../../auth/session/PortalContext';

const weekdayLabels = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

function formatDateTime(value: string) {
  if (!value) return 'Sin fecha';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(parsed);
}

export function BranchLocalStatusPage() {
  const portal = useContext(PortalContext);
  const branchId = portal.currentBranch?.id;
  const [overview, setOverview] = useState<BranchLocalStatusOverview | null>(null);
  const [form, setForm] = useState<BranchLocalStatusOverview['status'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = async () => {
    if (!branchId) return;
    setLoading(true);
    setError(null);
    const result = await adminBranchOperationsService.fetchLocalStatusOverview(branchId);
    setLoading(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setOverview(result.data ?? null);
    setForm(result.data?.status ?? null);
  };

  useEffect(() => {
    loadData();
  }, [branchId]);

  const dirty = useMemo(() => {
    if (!overview || !form) return false;
    return JSON.stringify(overview.status) !== JSON.stringify(form);
  }, [form, overview]);

  const handleSave = async () => {
    if (!branchId || !form) return;
    setSaving(true);
    setError(null);
    const result = await adminBranchOperationsService.updateBranchStatus(branchId, form);
    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setSuccessMessage('Estado del local actualizado');
    await loadData();
  };

  if (!branchId) {
    return <div>No hay sucursal activa para operar el local.</div>;
  }

  if (portal.currentScopeType !== 'branch') {
    return <div>Esta vista pertenece a la capa sucursal.</div>;
  }

  return (
    <AdminPageFrame
      title="Estado del local"
      description="Control operativo rapido de apertura, recepcion de pedidos y lectura del horario de la sucursal."
      breadcrumbs={[
        { label: 'Admin', to: AppRoutes.portal.admin.root },
        { label: 'Estado del local' },
      ]}
      contextItems={[
        { label: 'Capa', value: getScopeLabel(portal.currentScopeType), tone: 'info' },
        { label: 'Actor', value: getPortalActorLabel({ roleAssignments: portal.roleAssignments, profile: portal.profile, staffAssignment: portal.staffAssignment }), tone: 'info' },
        { label: 'Comercio', value: portal.currentMerchant?.name || 'sin comercio', tone: 'neutral' },
        { label: 'Sucursal', value: portal.currentBranch?.name || 'sin sucursal', tone: 'neutral' },
        { label: 'Modo', value: 'Operacion del local', tone: 'warning' },
      ]}
    >
      {loading ? (
        <LoadingScreen />
      ) : !overview || !form ? (
        <div>No se pudo cargar el estado del local.</div>
      ) : (
        <>
          <FormStatusBar dirty={dirty} saving={saving} error={error} successMessage={successMessage} />

          <SectionCard title="Control inmediato" description="merchant_branch_status vive aqui como panel de operacion y no como CRUD tecnico separado.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <CheckboxField label="Local abierto" checked={form.is_open} onChange={(event) => setForm((current) => (current ? { ...current, is_open: event.target.checked } : current))} />
              <CheckboxField
                label="Aceptando pedidos"
                checked={form.accepting_orders}
                onChange={(event) => setForm((current) => (current ? { ...current, accepting_orders: event.target.checked } : current))}
              />
            </div>
            <FieldGroup label="Motivo de pausa">
              <TextAreaField value={form.pause_reason} onChange={(event) => setForm((current) => (current ? { ...current, pause_reason: event.target.value } : current))} />
            </FieldGroup>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button type="button" onClick={handleSave} disabled={!dirty || saving} style={{ padding: '12px 16px', borderRadius: '10px', background: '#111827', color: '#ffffff' }}>
                {saving ? 'Guardando...' : 'Guardar estado'}
              </button>
              <StatusPill label={form.is_open ? 'Local abierto' : 'Local cerrado'} tone={form.is_open ? 'success' : 'danger'} />
              <StatusPill label={form.accepting_orders ? 'Recibiendo pedidos' : 'Recepcion pausada'} tone={form.accepting_orders ? 'info' : 'warning'} />
            </div>
          </SectionCard>

          <SectionCard title="Horario operativo" description="La sucursal ve el horario cargado para entender el turno y revisar si hay cierres programados.">
            <AdminDataTable
              rows={overview.hours}
              getRowId={(record) => record.id}
              emptyMessage="No hay horarios cargados para esta sucursal."
              columns={[
                { id: 'day', header: 'Dia', render: (record) => weekdayLabels[record.weekday] || `Dia ${record.weekday}` },
                { id: 'open', header: 'Apertura', render: (record) => record.open_time },
                { id: 'close', header: 'Cierre', render: (record) => record.close_time },
              ]}
            />
          </SectionCard>

          <SectionCard title="Cierres y cobertura" description="Lectura de cierres especiales y zonas activas para que el equipo entienda que puede operar hoy.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '14px', borderRadius: '14px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                <div style={{ color: '#6b7280', fontSize: '13px' }}>Zonas activas</div>
                <strong>{overview.coverage_count}</strong>
              </div>
              <div style={{ padding: '14px', borderRadius: '14px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                <div style={{ color: '#6b7280', fontSize: '13px' }}>Cierres programados</div>
                <strong>{overview.closures.length}</strong>
              </div>
            </div>
            <AdminDataTable
              rows={overview.closures}
              getRowId={(record) => record.id || `${record.starts_at}-${record.ends_at}`}
              emptyMessage="No hay cierres especiales registrados."
              columns={[
                { id: 'start', header: 'Desde', render: (record) => formatDateTime(record.starts_at) },
                { id: 'end', header: 'Hasta', render: (record) => formatDateTime(record.ends_at) },
                { id: 'reason', header: 'Motivo', render: (record) => record.reason || 'Sin motivo' },
              ]}
            />
          </SectionCard>
        </>
      )}
    </AdminPageFrame>
  );
}
