import { useContext, useEffect, useMemo, useState } from 'react';
import { AdminDataTable } from '../../../../components/admin/AdminDataTable';
import { CheckboxField, FieldGroup } from '../../../../components/admin/AdminFields';
import { AdminModalForm } from '../../../../components/admin/AdminModalForm';
import { AdminPageFrame, FormStatusBar, SectionCard, StatusPill } from '../../../../components/admin/AdminScaffold';
import { AdminTabPanel, AdminTabs } from '../../../../components/admin/AdminTabs';
import { LoadingScreen } from '../../../../components/shared/LoadingScreen';
import { TextField } from '../../../../components/ui/TextField';
import { getPortalActorLabel, getScopeLabel } from '../../../../core/auth/portalAccess';
import { AppRoutes } from '../../../../core/constants/routes';
import {
  adminPaymentsService,
  PaymentMethodAdminForm,
  PlatformCashCollectionRecord,
  PlatformPaymentMethodRecord,
  PlatformPaymentsOverview,
} from '../../../../core/services/adminPaymentsService';
import { PortalContext } from '../../../auth/session/PortalContext';

type PaymentsTab = 'summary' | 'payments' | 'transactions' | 'refunds' | 'cash' | 'methods';

function formatDateTime(value: string) {
  if (!value) return 'Sin fecha';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(parsed);
}

function formatMoney(value: number, currency = 'PEN') {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency, minimumFractionDigits: 2 }).format(value);
}

function getPaymentTone(status: string) {
  const normalized = status.trim().toLowerCase();
  if (['captured', 'paid', 'settled', 'authorized'].includes(normalized)) return 'success' as const;
  if (['failed', 'rejected', 'cancelled'].includes(normalized)) return 'danger' as const;
  if (['pending', 'requested'].includes(normalized)) return 'warning' as const;
  return 'info' as const;
}

export function PaymentsAdminPage() {
  const portal = useContext(PortalContext);
  const merchantId = portal.currentMerchant?.id ?? portal.merchant?.id ?? null;
  const isPlatformScope = portal.currentScopeType === 'platform';
  const isBusinessScope = portal.currentScopeType === 'business';
  const [activeTab, setActiveTab] = useState<PaymentsTab>('summary');
  const [overview, setOverview] = useState<PlatformPaymentsOverview | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [methodOpen, setMethodOpen] = useState(false);
  const [methodForm, setMethodForm] = useState<PaymentMethodAdminForm>(adminPaymentsService.createEmptyPaymentMethodForm());

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const result = await adminPaymentsService.fetchOverview({ scopeType: portal.currentScopeType, merchantId });
    setLoading(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setOverview(result.data ?? null);
  };

  useEffect(() => {
    if (isPlatformScope || (isBusinessScope && merchantId)) {
      loadData();
    }
  }, [isBusinessScope, isPlatformScope, merchantId, portal.currentScopeType]);

  useEffect(() => {
    if (!isPlatformScope && activeTab === 'methods') {
      setActiveTab('summary');
    }
  }, [activeTab, isPlatformScope]);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredPayments = useMemo(() => {
    const rows = overview?.payments ?? [];
    if (!normalizedQuery) return rows;
    return rows.filter((row) =>
      [
        row.order_code,
        row.merchant_label,
        row.branch_label,
        row.customer_label,
        row.payment_method_label,
        row.status,
        row.provider,
        row.external_reference,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [overview?.payments, normalizedQuery]);

  const filteredTransactions = useMemo(() => {
    const rows = overview?.transactions ?? [];
    if (!normalizedQuery) return rows;
    return rows.filter((row) =>
      [row.payment_label, row.merchant_label, row.transaction_type, row.status, row.provider_transaction_id]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [overview?.transactions, normalizedQuery]);

  const filteredRefunds = useMemo(() => {
    const rows = overview?.refunds ?? [];
    if (!normalizedQuery) return rows;
    return rows.filter((row) =>
      [row.payment_label, row.merchant_label, row.reason, row.status].join(' ').toLowerCase().includes(normalizedQuery)
    );
  }, [overview?.refunds, normalizedQuery]);

  const filteredMethods = useMemo(() => {
    const rows = overview?.payment_methods ?? [];
    if (!normalizedQuery) return rows;
    return rows.filter((row) => [row.code, row.name].join(' ').toLowerCase().includes(normalizedQuery));
  }, [overview?.payment_methods, normalizedQuery]);

  const filteredCashCollections = useMemo(() => {
    const rows = overview?.cash_collections ?? [];
    if (!normalizedQuery) return rows;
    return rows.filter((row) =>
      [row.order_code, row.merchant_label, row.branch_label, row.driver_label, row.status].join(' ').toLowerCase().includes(normalizedQuery)
    );
  }, [overview?.cash_collections, normalizedQuery]);

  const openMethodModal = (record?: PlatformPaymentMethodRecord) => {
    setSuccessMessage(null);
    setMethodForm(record ? adminPaymentsService.createPaymentMethodForm(record) : adminPaymentsService.createEmptyPaymentMethodForm());
    setMethodOpen(true);
  };

  const handleMethodSave = async () => {
    if (!methodForm.code.trim() || !methodForm.name.trim()) return;
    setSaving(true);
    setError(null);
    const result = await adminPaymentsService.savePaymentMethod(methodForm);
    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setMethodOpen(false);
    setSuccessMessage(methodForm.id ? 'Metodo actualizado' : 'Metodo creado');
    await loadData();
  };

  if (!isPlatformScope && !isBusinessScope) {
    return <div>Esta vista pertenece a plataforma o negocio.</div>;
  }

  if (isBusinessScope && !merchantId) {
    return <div>No hay comercio activo para administrar pagos y caja.</div>;
  }

  return (
    <AdminPageFrame
      title={isPlatformScope ? 'Pagos' : 'Pagos y caja'}
      description={
        isPlatformScope
          ? 'Consola global de cobros, transacciones, refunds, metodos y caja para toda la plataforma.'
          : 'Centro financiero del negocio con cobros, refunds y caja operativa ligada a los pedidos del comercio actual.'
      }
      breadcrumbs={[
        { label: 'Admin', to: AppRoutes.portal.admin.root },
        { label: isPlatformScope ? 'Pagos' : 'Pagos y caja' },
      ]}
      contextItems={[
        { label: 'Capa', value: getScopeLabel(portal.currentScopeType), tone: 'info' },
        { label: 'Actor', value: getPortalActorLabel({ roleAssignments: portal.roleAssignments, profile: portal.profile, staffAssignment: portal.staffAssignment }), tone: 'info' },
        ...(isBusinessScope ? [{ label: 'Comercio', value: portal.currentMerchant?.name || 'sin comercio', tone: 'neutral' as const }] : []),
        { label: 'Entidad', value: isPlatformScope ? 'Cobros globales' : 'Finanzas del negocio', tone: 'warning' },
        { label: 'Modo', value: isPlatformScope ? 'Supervision financiera' : 'Control financiero', tone: 'warning' },
      ]}
      actions={
        isPlatformScope ? (
          <button type="button" onClick={() => openMethodModal()} style={{ padding: '12px 16px', borderRadius: '10px', background: '#111827', color: '#ffffff', fontWeight: 700 }}>
            Nuevo metodo
          </button>
        ) : undefined
      }
    >
      <SectionCard title="Buscar" description="Filtra por pedido, comercio, metodo, provider, referencia, caja o estado.">
        <TextField value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar pagos..." />
      </SectionCard>

      <FormStatusBar dirty={false} saving={saving} error={error} successMessage={successMessage} />

      {loading ? (
        <LoadingScreen />
      ) : (
        <SectionCard
          title="Centro financiero"
          description={
            isPlatformScope
              ? 'Desde plataforma se ve el movimiento de cobros completo, refunds, caja y el catalogo de payment_methods que alimenta a los negocios.'
              : 'Desde negocio se ve el movimiento de cobros propio, los refunds y la caja cobrada por reparto.'
          }
        >
          <AdminTabs
            tabs={[
              { id: 'summary', label: 'Resumen' },
              { id: 'payments', label: 'Cobros', badge: String(overview?.summary.payments ?? 0) },
              { id: 'transactions', label: 'Transacciones', badge: String(overview?.summary.transactions ?? 0) },
              { id: 'refunds', label: 'Refunds', badge: String(overview?.summary.refunds ?? 0) },
              { id: 'cash', label: 'Caja', badge: String(overview?.summary.cash_collections ?? 0) },
              ...(isPlatformScope ? [{ id: 'methods', label: 'Metodos', badge: String(overview?.payment_methods.length ?? 0) }] : []),
            ]}
            activeTabId={activeTab}
            onChange={(tabId) => setActiveTab(tabId as PaymentsTab)}
          />

          {activeTab === 'summary' ? (
            <AdminTabPanel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                {[
                  { label: 'Cobros', value: String(overview?.summary.payments ?? 0) },
                  { label: 'Transacciones', value: String(overview?.summary.transactions ?? 0) },
                  { label: 'Refunds', value: String(overview?.summary.refunds ?? 0) },
                  { label: 'Caja', value: String(overview?.summary.cash_collections ?? 0) },
                  { label: 'Metodos activos', value: String(overview?.summary.active_methods ?? 0) },
                  { label: 'Volumen cobrado', value: formatMoney(overview?.summary.gross_amount ?? 0) },
                  { label: 'Volumen refund', value: formatMoney(overview?.summary.refunded_amount ?? 0) },
                  { label: 'Caja pendiente', value: formatMoney(overview?.summary.pending_cash_amount ?? 0) },
                  { label: 'Caja liquidada', value: formatMoney(overview?.summary.settled_cash_amount ?? 0) },
                ].map((item) => (
                  <div key={item.label} style={{ padding: '14px', borderRadius: '14px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                    <div style={{ color: '#6b7280', fontSize: '13px' }}>{item.label}</div>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </AdminTabPanel>
          ) : null}

          {activeTab === 'payments' ? (
            <AdminTabPanel>
              <AdminDataTable
                rows={filteredPayments}
                getRowId={(record) => record.id}
                emptyMessage="No hay cobros visibles en la base."
                columns={[
                  {
                    id: 'payment',
                    header: 'Cobro',
                    render: (record) => (
                      <div style={{ display: 'grid', gap: '6px' }}>
                        <strong>{record.payment_method_label}</strong>
                        <span style={{ color: '#6b7280' }}>{record.order_code ? `Pedido #${record.order_code}` : 'Sin pedido'}</span>
                      </div>
                    ),
                  },
                  {
                    id: 'scope',
                    header: 'Negocio',
                    render: (record) => (
                      <div style={{ display: 'grid', gap: '6px' }}>
                        <span>{record.merchant_label}</span>
                        <span style={{ color: '#6b7280' }}>{record.branch_label}</span>
                      </div>
                    ),
                  },
                  { id: 'customer', header: 'Cliente', render: (record) => record.customer_label || 'Sin cliente' },
                  { id: 'amount', header: 'Monto', align: 'right', render: (record) => formatMoney(record.amount, record.currency) },
                  { id: 'status', header: 'Estado', render: (record) => <StatusPill label={record.status || 'pending'} tone={getPaymentTone(record.status)} /> },
                  { id: 'date', header: 'Solicitado', render: (record) => formatDateTime(record.requested_at) },
                ]}
              />
            </AdminTabPanel>
          ) : null}

          {activeTab === 'transactions' ? (
            <AdminTabPanel>
              <AdminDataTable
                rows={filteredTransactions}
                getRowId={(record) => record.id}
                emptyMessage="No hay transacciones registradas."
                columns={[
                  {
                    id: 'payment',
                    header: 'Pago',
                    render: (record) => (
                      <div style={{ display: 'grid', gap: '6px' }}>
                        <strong>{record.payment_label}</strong>
                        <span style={{ color: '#6b7280' }}>{record.merchant_label}</span>
                      </div>
                    ),
                  },
                  { id: 'type', header: 'Tipo', render: (record) => record.transaction_type || 'sin tipo' },
                  { id: 'amount', header: 'Monto', align: 'right', render: (record) => formatMoney(record.amount) },
                  { id: 'status', header: 'Estado', render: (record) => <StatusPill label={record.status || 'pending'} tone={getPaymentTone(record.status)} /> },
                  { id: 'provider', header: 'Provider ref', render: (record) => record.provider_transaction_id || 'Sin referencia' },
                  { id: 'created', header: 'Fecha', render: (record) => formatDateTime(record.created_at) },
                ]}
              />
            </AdminTabPanel>
          ) : null}

          {activeTab === 'refunds' ? (
            <AdminTabPanel>
              <AdminDataTable
                rows={filteredRefunds}
                getRowId={(record) => record.id}
                emptyMessage="No hay refunds registrados."
                columns={[
                  {
                    id: 'payment',
                    header: 'Pago',
                    render: (record) => (
                      <div style={{ display: 'grid', gap: '6px' }}>
                        <strong>{record.payment_label}</strong>
                        <span style={{ color: '#6b7280' }}>{record.merchant_label}</span>
                      </div>
                    ),
                  },
                  { id: 'amount', header: 'Monto', align: 'right', render: (record) => formatMoney(record.amount) },
                  { id: 'reason', header: 'Motivo', render: (record) => record.reason || 'Sin motivo' },
                  { id: 'status', header: 'Estado', render: (record) => <StatusPill label={record.status || 'requested'} tone={getPaymentTone(record.status)} /> },
                  { id: 'date', header: 'Solicitado', render: (record) => formatDateTime(record.requested_at) },
                ]}
              />
            </AdminTabPanel>
          ) : null}

          {activeTab === 'cash' ? (
            <AdminTabPanel>
              <AdminDataTable
                rows={filteredCashCollections}
                getRowId={(record) => record.id}
                emptyMessage="No hay movimientos de caja registrados."
                columns={[
                  {
                    id: 'order',
                    header: 'Pedido',
                    render: (record: PlatformCashCollectionRecord) => (
                      <div style={{ display: 'grid', gap: '6px' }}>
                        <strong>{record.order_code ? `#${record.order_code}` : 'Sin pedido'}</strong>
                        <span style={{ color: '#6b7280' }}>{record.driver_label || 'Sin repartidor'}</span>
                      </div>
                    ),
                  },
                  {
                    id: 'scope',
                    header: 'Alcance',
                    render: (record: PlatformCashCollectionRecord) => (
                      <div style={{ display: 'grid', gap: '6px' }}>
                        <span>{record.merchant_label}</span>
                        <span style={{ color: '#6b7280' }}>{record.branch_label}</span>
                      </div>
                    ),
                  },
                  { id: 'amount', header: 'Monto', align: 'right', render: (record: PlatformCashCollectionRecord) => formatMoney(record.amount_collected) },
                  { id: 'status', header: 'Estado', render: (record: PlatformCashCollectionRecord) => <StatusPill label={record.status || 'pending'} tone={getPaymentTone(record.status)} /> },
                  { id: 'collected', header: 'Cobrado', render: (record: PlatformCashCollectionRecord) => formatDateTime(record.collected_at) },
                  { id: 'settled', header: 'Liquidado', render: (record: PlatformCashCollectionRecord) => (record.settled_at ? formatDateTime(record.settled_at) : 'Pendiente') },
                ]}
              />
            </AdminTabPanel>
          ) : null}

          {activeTab === 'methods' && isPlatformScope ? (
            <AdminTabPanel>
              <AdminDataTable
                rows={filteredMethods}
                getRowId={(record) => record.id}
                emptyMessage="No hay payment_methods disponibles."
                columns={[
                  {
                    id: 'method',
                    header: 'Metodo',
                    render: (record) => (
                      <div style={{ display: 'grid', gap: '6px' }}>
                        <strong>{record.name}</strong>
                        <span style={{ color: '#6b7280' }}>{record.code}</span>
                      </div>
                    ),
                  },
                  {
                    id: 'flags',
                    header: 'Canal',
                    render: (record) => (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <StatusPill label={record.is_online ? 'Online' : 'Offline'} tone={record.is_online ? 'info' : 'neutral'} />
                        <StatusPill label={record.is_active ? 'Activo' : 'Inactivo'} tone={record.is_active ? 'success' : 'warning'} />
                      </div>
                    ),
                  },
                  {
                    id: 'usage',
                    header: 'Uso',
                    render: (record) => (
                      <div style={{ display: 'grid', gap: '6px' }}>
                        <span>{record.payments_count} cobros</span>
                        <span style={{ color: '#6b7280' }}>
                          {record.transactions_count} transacciones / {record.refunds_count} refunds
                        </span>
                      </div>
                    ),
                  },
                  {
                    id: 'action',
                    header: 'Accion',
                    align: 'right',
                    width: '140px',
                    render: (record) => (
                      <button type="button" onClick={() => openMethodModal(record)} style={{ color: '#2563eb', fontWeight: 700 }}>
                        Editar
                      </button>
                    ),
                  },
                ]}
              />
            </AdminTabPanel>
          ) : null}
        </SectionCard>
      )}

      <AdminModalForm
        open={methodOpen}
        title={methodForm.id ? 'Editar metodo de pago' : 'Nuevo metodo de pago'}
        description="payment_methods se gobierna desde plataforma porque alimenta la operacion de todos los negocios."
        onClose={() => setMethodOpen(false)}
        actions={
          <>
            <button type="button" onClick={() => setMethodOpen(false)} style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #d1d5db', background: '#ffffff' }}>
              Cancelar
            </button>
            <button type="button" onClick={handleMethodSave} disabled={saving || !methodForm.code.trim() || !methodForm.name.trim()} style={{ padding: '12px 16px', borderRadius: '10px', background: '#111827', color: '#ffffff' }}>
              {saving ? 'Guardando...' : 'Guardar metodo'}
            </button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: '16px' }}>
          <FieldGroup label="Codigo">
            <TextField value={methodForm.code} onChange={(event) => setMethodForm((current) => ({ ...current, code: event.target.value }))} />
          </FieldGroup>
          <FieldGroup label="Nombre">
            <TextField value={methodForm.name} onChange={(event) => setMethodForm((current) => ({ ...current, name: event.target.value }))} />
          </FieldGroup>
          <CheckboxField label="Disponible online" checked={methodForm.is_online} onChange={(event) => setMethodForm((current) => ({ ...current, is_online: event.target.checked }))} />
          <CheckboxField label="Activo en plataforma" checked={methodForm.is_active} onChange={(event) => setMethodForm((current) => ({ ...current, is_active: event.target.checked }))} />
        </div>
      </AdminModalForm>
    </AdminPageFrame>
  );
}
