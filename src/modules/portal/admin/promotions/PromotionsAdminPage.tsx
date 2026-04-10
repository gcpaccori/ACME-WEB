import { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckboxField, FieldGroup, NumberField, SelectField } from '../../../../components/admin/AdminFields';
import { AdminDataTable } from '../../../../components/admin/AdminDataTable';
import { AdminModalForm } from '../../../../components/admin/AdminModalForm';
import { AdminPageFrame, FormStatusBar, SectionCard, StatusPill } from '../../../../components/admin/AdminScaffold';
import { LoadingScreen } from '../../../../components/shared/LoadingScreen';
import { TextField } from '../../../../components/ui/TextField';
import { getPortalActorLabel, getScopeLabel } from '../../../../core/auth/portalAccess';
import { AppRoutes } from '../../../../core/constants/routes';
import { adminPromotionsService, PromotionAdminRecord, PromotionForm } from '../../../../core/services/adminPromotionsService';
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

function getPromotionTone(record: PromotionAdminRecord) {
  if (!record.is_active) return 'warning' as const;
  if (record.ends_at) {
    const endDate = new Date(record.ends_at);
    if (!Number.isNaN(endDate.getTime()) && endDate.getTime() < Date.now()) {
      return 'danger' as const;
    }
  }
  return 'success' as const;
}

function getPromotionStatusLabel(record: PromotionAdminRecord) {
  if (!record.is_active) return 'Inactiva';
  if (record.ends_at) {
    const endDate = new Date(record.ends_at);
    if (!Number.isNaN(endDate.getTime()) && endDate.getTime() < Date.now()) {
      return 'Vencida';
    }
  }
  return 'Activa';
}

function getDiscountLabel(record: Pick<PromotionAdminRecord | PromotionForm, 'discount_type' | 'discount_value'>) {
  if (record.discount_type === 'percent') return `${record.discount_value}%`;
  if (record.discount_type === 'free_delivery') return 'Envio gratis';
  return formatMoney(Number(record.discount_value ?? 0));
}

export function PromotionsAdminPage() {
  const navigate = useNavigate();
  const portal = useContext(PortalContext);
  const merchantId = portal.currentMerchant?.id ?? portal.merchant?.id;
  const [query, setQuery] = useState('');
  const [records, setRecords] = useState<PromotionAdminRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<PromotionForm>(adminPromotionsService.createEmptyPromotionForm());

  const loadData = async () => {
    if (!merchantId) return;
    setLoading(true);
    setError(null);
    const result = await adminPromotionsService.fetchPromotions(merchantId);
    setLoading(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setRecords(result.data ?? []);
  };

  useEffect(() => {
    loadData();
  }, [merchantId]);

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return records;
    return records.filter((record) =>
      [record.name, record.promo_type, record.discount_type, record.scope_summary].join(' ').toLowerCase().includes(normalizedQuery)
    );
  }, [query, records]);

  const summary = useMemo(
    () => ({
      promotions: records.length,
      activePromotions: records.filter((record) => record.is_active).length,
      expiredPromotions: records.filter((record) => getPromotionStatusLabel(record) === 'Vencida').length,
      coupons: records.reduce((sum, record) => sum + record.coupon_count, 0),
      targets: records.reduce((sum, record) => sum + record.target_count, 0),
      redemptions: records.reduce((sum, record) => sum + record.redemption_count, 0),
    }),
    [records]
  );

  const resetCreateForm = () => {
    setCreateForm(adminPromotionsService.createEmptyPromotionForm());
    setCreateOpen(false);
  };

  const handleCreate = async () => {
    if (!merchantId) return;
    setSaving(true);
    setError(null);
    const result = await adminPromotionsService.savePromotion(merchantId, createForm);
    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }

    const promotionId = String((result.data as { id?: string } | null)?.id ?? '');
    setSuccessMessage('Promocion creada');
    resetCreateForm();
    await loadData();
    navigate(AppRoutes.portal.admin.promotionDetail.replace(':promotionId', promotionId));
  };

  if (!merchantId) {
    return <div>No hay comercio activo para administrar promociones.</div>;
  }

  return (
    <AdminPageFrame
      title="Promociones"
      description="Campanas, segmentacion y cupones del comercio actual en una sola experiencia comercial."
      breadcrumbs={[
        { label: 'Admin', to: AppRoutes.portal.admin.root },
        { label: 'Promociones' },
      ]}
      contextItems={[
        { label: 'Capa', value: getScopeLabel(portal.currentScopeType), tone: 'info' },
        { label: 'Actor', value: getPortalActorLabel({ roleAssignments: portal.roleAssignments, profile: portal.profile, staffAssignment: portal.staffAssignment }), tone: 'info' },
        { label: 'Comercio', value: portal.currentMerchant?.name || portal.merchant?.name || 'sin comercio', tone: 'neutral' },
        { label: 'Entidad', value: 'Promocion', tone: 'info' },
        { label: 'Modo', value: 'Comercial', tone: 'warning' },
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
          Nueva promocion
        </button>
      }
    >
      <SectionCard title="Lectura comercial" description="Panel rapido para entender si el negocio tiene campanas activas, suficiente cobertura y uso real.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          {[
            { label: 'Promociones', value: String(summary.promotions) },
            { label: 'Activas', value: String(summary.activePromotions) },
            { label: 'Vencidas', value: String(summary.expiredPromotions) },
            { label: 'Cupones', value: String(summary.coupons) },
            { label: 'Targets', value: String(summary.targets) },
            { label: 'Redenciones', value: String(summary.redemptions) },
          ].map((item) => (
            <div key={item.label} style={{ padding: '14px', borderRadius: '14px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
              <div style={{ color: '#6b7280', fontSize: '13px' }}>{item.label}</div>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Buscar promocion" description="Filtra por nombre, tipo, descuento o alcance comercial.">
        <TextField value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar promocion..." />
      </SectionCard>

      <SectionCard title="Promociones del comercio" description="Se muestran las promociones segmentadas para el comercio actual.">
        {loading ? (
          <LoadingScreen />
        ) : (
          <AdminDataTable
            rows={filteredRecords}
            getRowId={(record) => record.id}
            emptyMessage="Todavia no hay promociones configuradas para este comercio."
            columns={[
              {
                id: 'promotion',
                header: 'Promocion',
                render: (record) => (
                  <div style={{ display: 'grid', gap: '6px' }}>
                    <strong>{record.name || 'Promocion'}</strong>
                    <span style={{ color: '#6b7280' }}>{record.promo_type || 'sin tipo'} / {record.discount_type || 'sin descuento'}</span>
                  </div>
                ),
              },
              {
                id: 'discount',
                header: 'Descuento',
                render: (record) => (
                  <div style={{ display: 'grid', gap: '6px' }}>
                    <strong>{getDiscountLabel(record)}</strong>
                    <span style={{ color: '#6b7280' }}>
                      Minimo {record.min_order_amount == null ? 'sin minimo' : formatMoney(record.min_order_amount)}
                    </span>
                  </div>
                ),
              },
              {
                id: 'scope',
                header: 'Segmentacion',
                render: (record) => (
                  <div style={{ display: 'grid', gap: '6px' }}>
                    <span>{record.scope_summary || 'Sin targets'}</span>
                    <span style={{ color: '#6b7280' }}>{record.target_count} targets / {record.coupon_count} cupones</span>
                  </div>
                ),
              },
              {
                id: 'activity',
                header: 'Uso',
                render: (record) => (
                  <div style={{ display: 'grid', gap: '6px' }}>
                    <span>{record.redemption_count} redenciones</span>
                    <span style={{ color: '#6b7280' }}>
                      {record.starts_at ? formatDateTime(record.starts_at) : 'Sin inicio'} - {record.ends_at ? formatDateTime(record.ends_at) : 'Sin fin'}
                    </span>
                  </div>
                ),
              },
              {
                id: 'status',
                header: 'Estado',
                render: (record) => <StatusPill label={getPromotionStatusLabel(record)} tone={getPromotionTone(record)} />,
              },
              {
                id: 'action',
                header: 'Accion',
                align: 'right',
                width: '160px',
                render: (record) => (
                  <Link to={AppRoutes.portal.admin.promotionDetail.replace(':promotionId', record.id)} style={{ color: '#2563eb', fontWeight: 700 }}>
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
        title="Nueva promocion"
        description="Se crea la promocion y se enlaza automaticamente al comercio actual como target raiz."
        onClose={resetCreateForm}
        actions={
          <>
            <button type="button" onClick={resetCreateForm} style={{ padding: '12px 16px' }}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving || !createForm.name}
              style={{ padding: '12px 16px', borderRadius: '10px', background: '#111827', color: '#ffffff', opacity: saving || !createForm.name ? 0.65 : 1 }}
            >
              {saving ? 'Guardando...' : 'Crear promocion'}
            </button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <FieldGroup label="Nombre">
            <TextField value={createForm.name} onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))} />
          </FieldGroup>
          <FieldGroup label="Tipo de promo">
            <SelectField
              value={createForm.promo_type}
              onChange={(event) => setCreateForm((current) => ({ ...current, promo_type: event.target.value }))}
              options={[
                { value: 'automatic', label: 'Automatica' },
                { value: 'coupon', label: 'Con cupon' },
                { value: 'campaign', label: 'Campana' },
              ]}
            />
          </FieldGroup>
          <FieldGroup label="Tipo de descuento">
            <SelectField
              value={createForm.discount_type}
              onChange={(event) => setCreateForm((current) => ({ ...current, discount_type: event.target.value }))}
              options={[
                { value: 'percent', label: 'Porcentaje' },
                { value: 'fixed', label: 'Monto fijo' },
                { value: 'free_delivery', label: 'Envio gratis' },
              ]}
            />
          </FieldGroup>
          <FieldGroup label="Valor del descuento">
            <NumberField value={createForm.discount_value} onChange={(event) => setCreateForm((current) => ({ ...current, discount_value: event.target.value }))} />
          </FieldGroup>
          <FieldGroup label="Monto minimo">
            <NumberField value={createForm.min_order_amount} onChange={(event) => setCreateForm((current) => ({ ...current, min_order_amount: event.target.value }))} />
          </FieldGroup>
          <FieldGroup label="Descuento maximo">
            <NumberField value={createForm.max_discount} onChange={(event) => setCreateForm((current) => ({ ...current, max_discount: event.target.value }))} />
          </FieldGroup>
          <FieldGroup label="Inicia">
            <TextField type="datetime-local" value={createForm.starts_at} onChange={(event) => setCreateForm((current) => ({ ...current, starts_at: event.target.value }))} />
          </FieldGroup>
          <FieldGroup label="Termina">
            <TextField type="datetime-local" value={createForm.ends_at} onChange={(event) => setCreateForm((current) => ({ ...current, ends_at: event.target.value }))} />
          </FieldGroup>
          <FieldGroup label="Limite total">
            <NumberField value={createForm.usage_limit_total} onChange={(event) => setCreateForm((current) => ({ ...current, usage_limit_total: event.target.value }))} />
          </FieldGroup>
          <FieldGroup label="Limite por usuario">
            <NumberField value={createForm.usage_limit_per_user} onChange={(event) => setCreateForm((current) => ({ ...current, usage_limit_per_user: event.target.value }))} />
          </FieldGroup>
        </div>

        <CheckboxField
          label="Promocion activa"
          checked={createForm.is_active}
          onChange={(event) => setCreateForm((current) => ({ ...current, is_active: event.target.checked }))}
        />
      </AdminModalForm>
    </AdminPageFrame>
  );
}
