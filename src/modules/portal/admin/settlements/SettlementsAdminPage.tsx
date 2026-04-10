import { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckboxField, FieldGroup, NumberField, SelectField } from '../../../../components/admin/AdminFields';
import { AdminDataTable } from '../../../../components/admin/AdminDataTable';
import { AdminModalForm } from '../../../../components/admin/AdminModalForm';
import { AdminPageFrame, FormStatusBar, SectionCard, StatusPill } from '../../../../components/admin/AdminScaffold';
import { LoadingScreen } from '../../../../components/shared/LoadingScreen';
import { TextField } from '../../../../components/ui/TextField';
import { getPortalActorLabel, getScopeLabel } from '../../../../core/auth/portalAccess';
import { AppRoutes } from '../../../../core/constants/routes';
import {
  adminSettlementsService,
  CommissionRuleForm,
  CommissionRuleRecord,
  SettlementsOverview,
} from '../../../../core/services/adminSettlementsService';
import { PortalContext } from '../../../auth/session/PortalContext';

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
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

function getStatusTone(status: string) {
  const normalized = status.trim().toLowerCase();
  if (normalized === 'paid' || normalized === 'active') return 'success' as const;
  if (normalized === 'pending' || normalized === 'draft') return 'warning' as const;
  if (normalized === 'overdue' || normalized === 'failed') return 'danger' as const;
  return 'info' as const;
}

function getRuleValueLabel(record: Pick<CommissionRuleRecord | CommissionRuleForm, 'rule_type' | 'value'>) {
  if (record.rule_type === 'percent') return `${record.value}%`;
  return formatMoney(Number(record.value ?? 0));
}

export function SettlementsAdminPage() {
  const portal = useContext(PortalContext);
  const merchantId = portal.currentMerchant?.id ?? portal.merchant?.id;
  const [query, setQuery] = useState('');
  const [overview, setOverview] = useState<SettlementsOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [ruleOpen, setRuleOpen] = useState(false);
  const [ruleForm, setRuleForm] = useState<CommissionRuleForm>(adminSettlementsService.createEmptyCommissionRuleForm());

  const loadData = async () => {
    if (!merchantId) return;
    setLoading(true);
    setError(null);
    const result = await adminSettlementsService.fetchSettlementsOverview(merchantId);
    setLoading(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setOverview(result.data ?? null);
  };

  useEffect(() => {
    loadData();
  }, [merchantId]);

  const filteredRules = useMemo(() => {
    const records = overview?.commission_rules ?? [];
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return records;
    return records.filter((record) =>
      [record.scope_type, record.scope_label, record.who_pays, record.rule_type].join(' ').toLowerCase().includes(normalizedQuery)
    );
  }, [overview?.commission_rules, query]);

  const filteredMerchantSettlements = useMemo(() => {
    const records = overview?.merchant_settlements ?? [];
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return records;
    return records.filter((record) =>
      [record.status, record.period_start, record.period_end].join(' ').toLowerCase().includes(normalizedQuery)
    );
  }, [overview?.merchant_settlements, query]);

  const filteredDriverSettlements = useMemo(() => {
    const records = overview?.driver_settlements ?? [];
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return records;
    return records.filter((record) =>
      [record.driver_label, record.status, record.period_start, record.period_end].join(' ').toLowerCase().includes(normalizedQuery)
    );
  }, [overview?.driver_settlements, query]);

  const scopeOptions = useMemo(() => {
    return [
      { value: 'merchant', label: 'Comercio' },
      { value: 'branch', label: 'Sucursal' },
      { value: 'driver', label: 'Repartidor' },
    ];
  }, []);

  const currentScopeOptions = useMemo(() => {
    if (!overview || !merchantId) return [{ value: '', label: 'Selecciona un alcance' }];
    if (ruleForm.scope_type === 'merchant') {
      return [{ value: merchantId, label: portal.currentMerchant?.name || portal.merchant?.name || 'Comercio actual' }];
    }
    if (ruleForm.scope_type === 'branch') {
      return [{ value: '', label: 'Selecciona una sucursal' }, ...overview.branch_options.map((item) => ({ value: item.id, label: item.label }))];
    }
    if (ruleForm.scope_type === 'driver') {
      return [{ value: '', label: 'Selecciona un repartidor' }, ...overview.driver_options.map((item) => ({ value: item.id, label: item.label }))];
    }
    return [{ value: '', label: 'Selecciona un alcance' }];
  }, [merchantId, overview, portal.currentMerchant?.name, portal.merchant?.name, ruleForm.scope_type]);

  const openRuleModal = (record?: CommissionRuleRecord) => {
    setRuleForm(record ? adminSettlementsService.createCommissionRuleForm(record) : adminSettlementsService.createEmptyCommissionRuleForm());
    setRuleOpen(true);
  };

  const handleRuleSave = async () => {
    if (!merchantId) return;
    setSaving(true);
    setError(null);
    const result = await adminSettlementsService.saveCommissionRule(merchantId, ruleForm);
    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setRuleOpen(false);
    setSuccessMessage(ruleForm.id ? 'Regla actualizada' : 'Regla creada');
    await loadData();
  };

  if (!merchantId) {
    return <div>No hay comercio activo para administrar liquidaciones.</div>;
  }

  return (
    <AdminPageFrame
      title="Liquidaciones"
      description="Reglas de comision y cierres economicos de comercio y reparto desde un solo modulo financiero."
      breadcrumbs={[
        { label: 'Admin', to: AppRoutes.portal.admin.root },
        { label: 'Liquidaciones' },
      ]}
      contextItems={[
        { label: 'Capa', value: getScopeLabel(portal.currentScopeType), tone: 'info' },
        { label: 'Actor', value: getPortalActorLabel({ roleAssignments: portal.roleAssignments, profile: portal.profile, staffAssignment: portal.staffAssignment }), tone: 'info' },
        { label: 'Comercio', value: portal.currentMerchant?.name || portal.merchant?.name || 'sin comercio', tone: 'neutral' },
        { label: 'Entidad', value: 'Liquidacion', tone: 'info' },
        { label: 'Modo', value: 'Finanzas', tone: 'warning' },
      ]}
      actions={
        <button
          type="button"
          onClick={() => {
            setSuccessMessage(null);
            openRuleModal();
          }}
          style={{ padding: '12px 16px', borderRadius: '10px', background: '#111827', color: '#ffffff', fontWeight: 700 }}
        >
          Nueva regla
        </button>
      }
    >
      <SectionCard title="Buscar" description="Filtra reglas y liquidaciones por estado, alcance o periodo.">
        <TextField value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar..." />
      </SectionCard>

      {loading ? (
        <LoadingScreen />
      ) : (
        <>
          <SectionCard title="Resumen financiero" description="Vista rapida de reglas activas y volumen de cierres visibles en el admin.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
              {[
                { label: 'Reglas', value: String(overview?.commission_rules.length ?? 0) },
                { label: 'Reglas activas', value: String((overview?.commission_rules ?? []).filter((rule) => rule.is_active).length) },
                { label: 'Liquidaciones comercio', value: String(overview?.merchant_settlements.length ?? 0) },
                { label: 'Liquidaciones reparto', value: String(overview?.driver_settlements.length ?? 0) },
                {
                  label: 'Neto comercio',
                  value: formatMoney((overview?.merchant_settlements ?? []).reduce((sum, record) => sum + record.net_payable, 0)),
                },
                {
                  label: 'Neto reparto',
                  value: formatMoney((overview?.driver_settlements ?? []).reduce((sum, record) => sum + record.net_payable, 0)),
                },
              ].map((item) => (
                <div key={item.label} style={{ padding: '14px', borderRadius: '14px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <div style={{ color: '#6b7280', fontSize: '13px' }}>{item.label}</div>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Reglas de comision" description="commission_rules se administra aqui con alcance humano por comercio, sucursal o repartidor.">
            <AdminDataTable
              rows={filteredRules}
              getRowId={(record) => record.id}
              emptyMessage="No hay reglas de comision configuradas."
              columns={[
                {
                  id: 'scope',
                  header: 'Alcance',
                  render: (record) => (
                    <div style={{ display: 'grid', gap: '6px' }}>
                      <strong>{record.scope_label || 'Sin alcance'}</strong>
                      <span style={{ color: '#6b7280' }}>{record.scope_type || 'sin tipo'}</span>
                    </div>
                  ),
                },
                { id: 'payer', header: 'Paga', render: (record) => record.who_pays || 'sin actor' },
                {
                  id: 'value',
                  header: 'Regla',
                  render: (record) => (
                    <div style={{ display: 'grid', gap: '6px' }}>
                      <strong>{getRuleValueLabel(record)}</strong>
                      <span style={{ color: '#6b7280' }}>{record.rule_type || 'sin tipo'}</span>
                    </div>
                  ),
                },
                {
                  id: 'window',
                  header: 'Vigencia',
                  render: (record) => `${record.starts_at ? formatDateTime(record.starts_at) : 'Sin inicio'} - ${record.ends_at ? formatDateTime(record.ends_at) : 'Sin fin'}`,
                },
                {
                  id: 'status',
                  header: 'Estado',
                  render: (record) => <StatusPill label={record.is_active ? 'Activa' : 'Inactiva'} tone={record.is_active ? 'success' : 'warning'} />,
                },
                {
                  id: 'action',
                  header: 'Accion',
                  align: 'right',
                  width: '140px',
                  render: (record) => (
                    <button type="button" onClick={() => openRuleModal(record)} style={{ color: '#2563eb', fontWeight: 700 }}>
                      Editar
                    </button>
                  ),
                },
              ]}
            />
          </SectionCard>

          <SectionCard title="Liquidaciones de comercio" description="merchant_settlements y merchant_settlement_items se exponen como lectura financiera del comercio actual.">
            <AdminDataTable
              rows={filteredMerchantSettlements}
              getRowId={(record) => record.id}
              emptyMessage="No hay liquidaciones de comercio registradas."
              columns={[
                {
                  id: 'period',
                  header: 'Periodo',
                  render: (record) => `${formatDateTime(record.period_start)} - ${formatDateTime(record.period_end)}`,
                },
                { id: 'gross', header: 'Bruto', render: (record) => formatMoney(record.gross_sales) },
                { id: 'commission', header: 'Comision', render: (record) => formatMoney(record.commission_amount) },
                { id: 'net', header: 'Neto', render: (record) => formatMoney(record.net_payable) },
                {
                  id: 'status',
                  header: 'Estado',
                  render: (record) => <StatusPill label={record.status || 'sin estado'} tone={getStatusTone(record.status)} />,
                },
                {
                  id: 'action',
                  header: 'Accion',
                  align: 'right',
                  width: '160px',
                  render: (record) => (
                    <Link to={AppRoutes.portal.admin.merchantSettlementDetail.replace(':settlementId', record.id)} style={{ color: '#2563eb', fontWeight: 700 }}>
                      Ver detalle
                    </Link>
                  ),
                },
              ]}
            />
          </SectionCard>

          <SectionCard title="Liquidaciones de reparto" description="driver_settlements y driver_settlement_items se exponen con contexto del repartidor.">
            <AdminDataTable
              rows={filteredDriverSettlements}
              getRowId={(record) => record.id}
              emptyMessage="No hay liquidaciones de reparto registradas."
              columns={[
                {
                  id: 'driver',
                  header: 'Repartidor',
                  render: (record) => (
                    <div style={{ display: 'grid', gap: '6px' }}>
                      <strong>{record.driver_label || 'Sin repartidor'}</strong>
                      <span style={{ color: '#6b7280' }}>{record.deliveries_count} entregas</span>
                    </div>
                  ),
                },
                {
                  id: 'period',
                  header: 'Periodo',
                  render: (record) => `${formatDateTime(record.period_start)} - ${formatDateTime(record.period_end)}`,
                },
                { id: 'gross', header: 'Bruto', render: (record) => formatMoney(record.gross_earnings) },
                { id: 'net', header: 'Neto', render: (record) => formatMoney(record.net_payable) },
                {
                  id: 'status',
                  header: 'Estado',
                  render: (record) => <StatusPill label={record.status || 'sin estado'} tone={getStatusTone(record.status)} />,
                },
                {
                  id: 'action',
                  header: 'Accion',
                  align: 'right',
                  width: '160px',
                  render: (record) => (
                    <Link to={AppRoutes.portal.admin.driverSettlementDetail.replace(':settlementId', record.id)} style={{ color: '#2563eb', fontWeight: 700 }}>
                      Ver detalle
                    </Link>
                  ),
                },
              ]}
            />
          </SectionCard>
        </>
      )}

      <FormStatusBar dirty={false} saving={saving} error={error} successMessage={successMessage} />

      <AdminModalForm
        open={ruleOpen}
        title={ruleForm.id ? 'Editar regla de comision' : 'Nueva regla de comision'}
        description="La regla se guarda con alcance contextual para evitar configuracion financiera ciega."
        onClose={() => setRuleOpen(false)}
        actions={
          <>
            <button type="button" onClick={() => setRuleOpen(false)} style={{ padding: '12px 16px' }}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleRuleSave}
              disabled={saving || !ruleForm.rule_type || !ruleForm.who_pays || !(ruleForm.scope_type === 'merchant' || ruleForm.scope_id)}
              style={{ padding: '12px 16px', borderRadius: '10px', background: '#111827', color: '#ffffff', opacity: saving || !ruleForm.rule_type || !ruleForm.who_pays || !(ruleForm.scope_type === 'merchant' || ruleForm.scope_id) ? 0.65 : 1 }}
            >
              {saving ? 'Guardando...' : 'Guardar regla'}
            </button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <FieldGroup label="Alcance">
            <SelectField
              value={ruleForm.scope_type}
              onChange={(event) =>
                setRuleForm((current) => ({
                  ...current,
                  scope_type: event.target.value,
                  scope_id: event.target.value === 'merchant' ? merchantId : '',
                }))
              }
              options={scopeOptions}
            />
          </FieldGroup>
          <FieldGroup label="Destino">
            <SelectField value={ruleForm.scope_type === 'merchant' ? merchantId : ruleForm.scope_id} onChange={(event) => setRuleForm((current) => ({ ...current, scope_id: event.target.value }))} options={currentScopeOptions} />
          </FieldGroup>
          <FieldGroup label="Paga">
            <SelectField
              value={ruleForm.who_pays}
              onChange={(event) => setRuleForm((current) => ({ ...current, who_pays: event.target.value }))}
              options={[
                { value: 'merchant', label: 'Comercio' },
                { value: 'driver', label: 'Repartidor' },
                { value: 'platform', label: 'Plataforma' },
                { value: 'customer', label: 'Cliente' },
              ]}
            />
          </FieldGroup>
          <FieldGroup label="Tipo de regla">
            <SelectField
              value={ruleForm.rule_type}
              onChange={(event) => setRuleForm((current) => ({ ...current, rule_type: event.target.value }))}
              options={[
                { value: 'percent', label: 'Porcentaje' },
                { value: 'fixed', label: 'Monto fijo' },
              ]}
            />
          </FieldGroup>
          <FieldGroup label="Valor">
            <NumberField value={ruleForm.value} onChange={(event) => setRuleForm((current) => ({ ...current, value: event.target.value }))} />
          </FieldGroup>
          <FieldGroup label="Inicia">
            <TextField type="datetime-local" value={ruleForm.starts_at} onChange={(event) => setRuleForm((current) => ({ ...current, starts_at: event.target.value }))} />
          </FieldGroup>
          <FieldGroup label="Termina">
            <TextField type="datetime-local" value={ruleForm.ends_at} onChange={(event) => setRuleForm((current) => ({ ...current, ends_at: event.target.value }))} />
          </FieldGroup>
        </div>
        <CheckboxField label="Regla activa" checked={ruleForm.is_active} onChange={(event) => setRuleForm((current) => ({ ...current, is_active: event.target.checked }))} />
      </AdminModalForm>
    </AdminPageFrame>
  );
}
