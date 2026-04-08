import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AdminDataTable } from '../../../../components/admin/AdminDataTable';
import { AdminEntityHeader } from '../../../../components/admin/AdminEntityHeader';
import { CheckboxField, FieldGroup, NumberField, SelectField } from '../../../../components/admin/AdminFields';
import { AdminInlineRelationTable } from '../../../../components/admin/AdminInlineRelationTable';
import { AdminModalForm } from '../../../../components/admin/AdminModalForm';
import { AdminPageFrame, FormStatusBar, SectionCard, StatusPill } from '../../../../components/admin/AdminScaffold';
import { AdminTabPanel, AdminTabs } from '../../../../components/admin/AdminTabs';
import { LoadingScreen } from '../../../../components/shared/LoadingScreen';
import { TextField } from '../../../../components/ui/TextField';
import { AppRoutes } from '../../../../core/constants/routes';
import {
  adminCustomersService,
  CustomerAddressForm,
  CustomerAddressRecord,
  CustomerAdminDetail,
  CustomerPaymentMethodForm,
  CustomerPaymentMethodRecord,
  CustomerProfileForm,
} from '../../../../core/services/adminCustomersService';
import { PortalContext } from '../../../auth/session/PortalContext';

type CustomerDetailTab = 'summary' | 'addresses' | 'payments' | 'carts' | 'history';

function formatMoney(value: number, currency = 'PEN') {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
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

export function CustomerDetailAdminPage() {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const portal = useContext(PortalContext);
  const merchantId = portal.merchant?.id;

  const [activeTab, setActiveTab] = useState<CustomerDetailTab>('summary');
  const [detail, setDetail] = useState<CustomerAdminDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState<CustomerProfileForm>(adminCustomersService.createEmptyProfileForm());

  const [addressOpen, setAddressOpen] = useState(false);
  const [addressForm, setAddressForm] = useState<CustomerAddressForm>(adminCustomersService.createEmptyAddressForm());

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState<CustomerPaymentMethodForm>(adminCustomersService.createEmptyPaymentMethodForm());

  const loadDetail = async () => {
    if (!merchantId || !customerId) return;
    setLoading(true);
    setError(null);
    const result = await adminCustomersService.fetchCustomerDetail(customerId, merchantId);
    setLoading(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setDetail(result.data ?? null);
  };

  useEffect(() => {
    loadDetail();
  }, [merchantId, customerId]);

  const runMutation = async (handler: () => Promise<void>) => {
    try {
      setMutating(true);
      setError(null);
      await handler();
      await loadDetail();
    } catch (mutationError: any) {
      setError(mutationError?.message || 'No se pudo completar la accion');
    } finally {
      setMutating(false);
    }
  };

  const openProfileModal = () => {
    if (!detail) return;
    setProfileForm(adminCustomersService.createProfileForm(detail));
    setProfileOpen(true);
  };

  const openAddressModal = (record?: CustomerAddressRecord) => {
    setAddressForm(record ? adminCustomersService.createAddressForm(record) : adminCustomersService.createEmptyAddressForm());
    setAddressOpen(true);
  };

  const openPaymentModal = (record?: CustomerPaymentMethodRecord) => {
    setPaymentForm(record ? adminCustomersService.createPaymentMethodForm(record) : adminCustomersService.createEmptyPaymentMethodForm());
    setPaymentOpen(true);
  };

  const handleProfileSave = async () => {
    if (!customerId) return;
    await runMutation(async () => {
      const result = await adminCustomersService.saveCustomerProfile(customerId, profileForm);
      if (result.error) throw result.error;
      setProfileOpen(false);
      setSuccessMessage('Perfil del cliente actualizado');
    });
  };

  const handleAddressSave = async () => {
    if (!customerId) return;
    await runMutation(async () => {
      const result = await adminCustomersService.saveCustomerAddress(customerId, addressForm);
      if (result.error) throw result.error;
      setAddressOpen(false);
      setSuccessMessage(addressForm.relation_id ? 'Direccion actualizada' : 'Direccion agregada');
    });
  };

  const handleAddressDelete = async (relationId: string) => {
    if (!window.confirm('Eliminar esta direccion del cliente?')) return;
    await runMutation(async () => {
      const result = await adminCustomersService.deleteCustomerAddress(relationId);
      if (result.error) throw result.error;
      setSuccessMessage('Direccion eliminada');
    });
  };

  const handlePaymentSave = async () => {
    if (!customerId) return;
    await runMutation(async () => {
      const result = await adminCustomersService.saveCustomerPaymentMethod(customerId, paymentForm);
      if (result.error) throw result.error;
      setPaymentOpen(false);
      setSuccessMessage(paymentForm.id ? 'Metodo actualizado' : 'Metodo agregado');
    });
  };

  const handlePaymentDelete = async (paymentRelationId: string) => {
    if (!window.confirm('Eliminar este metodo guardado?')) return;
    await runMutation(async () => {
      const result = await adminCustomersService.deleteCustomerPaymentMethod(paymentRelationId);
      if (result.error) throw result.error;
      setSuccessMessage('Metodo eliminado');
    });
  };

  if (!merchantId) {
    return <div>No hay comercio activo para revisar clientes.</div>;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (error && !detail) {
    return <div style={{ color: '#b91c1c' }}>{error}</div>;
  }

  if (!detail) {
    return <div>No se encontro el cliente.</div>;
  }

  return (
    <AdminPageFrame
      title="Ficha de cliente"
      description="Centro comercial y operativo del cliente dentro del comercio actual."
      breadcrumbs={[
        { label: 'Admin', to: AppRoutes.portal.admin.root },
        { label: 'Clientes', to: AppRoutes.portal.admin.customers },
        { label: detail.full_name || detail.email || detail.id },
      ]}
      contextItems={[
        { label: 'Rol', value: portal.staffAssignment?.role || 'sin rol', tone: 'info' },
        { label: 'Comercio', value: portal.merchant?.name || 'sin comercio', tone: 'neutral' },
        { label: 'Entidad', value: 'Cliente', tone: 'info' },
        { label: 'Modo', value: 'Consulta y soporte', tone: 'warning' },
        { label: 'Estado', value: detail.is_active ? 'Activo' : 'Inactivo', tone: detail.is_active ? 'success' : 'warning' },
      ]}
    >
      <div>
        <button type="button" onClick={() => navigate(-1)} style={{ padding: '10px 16px' }}>
          Volver
        </button>
      </div>

      <AdminEntityHeader
        title={detail.full_name || detail.email || 'Cliente'}
        description={`${detail.email || 'Sin email'} / ${detail.phone || 'Sin telefono'} / ${detail.default_role || 'customer'}`}
        status={{ label: detail.is_active ? 'Activo' : 'Inactivo', tone: detail.is_active ? 'success' : 'warning' }}
        actions={
          <button type="button" onClick={openProfileModal} style={{ padding: '10px 14px' }}>
            Editar perfil
          </button>
        }
      />

      <AdminTabs
        tabs={[
          { id: 'summary', label: 'Resumen' },
          { id: 'addresses', label: 'Direcciones', badge: String(detail.addresses.length) },
          { id: 'payments', label: 'Metodos', badge: String(detail.payment_methods.length) },
          { id: 'carts', label: 'Carritos', badge: String(detail.carts.length) },
          { id: 'history', label: 'Historial', badge: String(detail.orders.length) },
        ]}
        activeTabId={activeTab}
        onChange={(tabId) => setActiveTab(tabId as CustomerDetailTab)}
      />

      {activeTab === 'summary' ? (
        <AdminTabPanel>
          <SectionCard title="Resumen comercial" description="Contexto general del cliente para soporte y relacion comercial.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
              {[
                { label: 'Pedidos', value: String(detail.order_count) },
                { label: 'Gastado', value: formatMoney(detail.total_spent) },
                { label: 'Carritos activos', value: String(detail.active_cart_count) },
                { label: 'Rating', value: detail.rating_avg.toFixed(1) },
                { label: 'Ultima compra', value: detail.last_order_at ? formatDateTime(detail.last_order_at) : 'Sin compras' },
                { label: 'Ultimo estado', value: detail.last_order_status || 'Sin estado' },
              ].map((item) => (
                <div key={item.label} style={{ padding: '14px', borderRadius: '14px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <div style={{ color: '#6b7280', fontSize: '13px' }}>{item.label}</div>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div style={{ padding: '14px', borderRadius: '14px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                <div style={{ color: '#6b7280', fontSize: '13px' }}>Cuenta creada</div>
                <strong>{formatDateTime(detail.created_at)}</strong>
              </div>
              <div style={{ padding: '14px', borderRadius: '14px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                <div style={{ color: '#6b7280', fontSize: '13px' }}>Ultima actualizacion</div>
                <strong>{formatDateTime(detail.updated_at)}</strong>
              </div>
              <div style={{ padding: '14px', borderRadius: '14px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                <div style={{ color: '#6b7280', fontSize: '13px' }}>Direcciones guardadas</div>
                <strong>{detail.addresses.length}</strong>
              </div>
            </div>
          </SectionCard>
        </AdminTabPanel>
      ) : null}

      {activeTab === 'addresses' ? (
        <AdminTabPanel>
          <AdminInlineRelationTable
            title="Direcciones"
            description="customer_addresses y addresses viven juntas en esta ficha para que el soporte no navegue a ciegas."
            actions={
              <button type="button" onClick={() => openAddressModal()} style={{ padding: '10px 14px' }}>
                Agregar direccion
              </button>
            }
          >
            <AdminDataTable
              rows={detail.addresses}
              getRowId={(record) => record.relation_id}
              emptyMessage="No hay direcciones guardadas."
              columns={[
                {
                  id: 'label',
                  header: 'Etiqueta',
                  render: (record) => (
                    <div style={{ display: 'grid', gap: '6px' }}>
                      <strong>{record.label || 'Direccion'}</strong>
                      {record.is_default ? <StatusPill label="Predeterminada" tone="success" /> : null}
                    </div>
                  ),
                },
                {
                  id: 'address',
                  header: 'Direccion',
                  render: (record) => (
                    <div style={{ display: 'grid', gap: '4px' }}>
                      <span>{record.line1 || 'Sin linea principal'}</span>
                      <span style={{ color: '#6b7280' }}>{[record.district, record.city, record.region].filter(Boolean).join(', ') || 'Sin detalle territorial'}</span>
                    </div>
                  ),
                },
                {
                  id: 'reference',
                  header: 'Referencia',
                  render: (record) => record.reference || 'Sin referencia',
                },
                {
                  id: 'action',
                  header: 'Accion',
                  align: 'right',
                  width: '180px',
                  render: (record) => (
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => openAddressModal(record)} style={{ color: '#2563eb', fontWeight: 700 }}>
                        Editar
                      </button>
                      <button type="button" onClick={() => handleAddressDelete(record.relation_id)} style={{ color: '#b91c1c', fontWeight: 700 }}>
                        Eliminar
                      </button>
                    </div>
                  ),
                },
              ]}
            />
          </AdminInlineRelationTable>
        </AdminTabPanel>
      ) : null}

      {activeTab === 'payments' ? (
        <AdminTabPanel>
          <AdminInlineRelationTable
            title="Metodos guardados"
            description="customer_payment_methods se expone como detalle comercial y de soporte del cliente."
            actions={
              <button type="button" onClick={() => openPaymentModal()} style={{ padding: '10px 14px' }}>
                Agregar metodo
              </button>
            }
          >
            <AdminDataTable
              rows={detail.payment_methods}
              getRowId={(record) => record.id}
              emptyMessage="No hay metodos guardados."
              columns={[
                {
                  id: 'method',
                  header: 'Metodo',
                  render: (record) => (
                    <div style={{ display: 'grid', gap: '6px' }}>
                      <strong>{record.payment_method_label}</strong>
                      <span style={{ color: '#6b7280' }}>{record.brand || 'Sin marca'} {record.masked_reference || ''}</span>
                    </div>
                  ),
                },
                { id: 'status', header: 'Estado', render: (record) => record.status || 'active' },
                {
                  id: 'default',
                  header: 'Predeterminado',
                  render: (record) => (record.is_default ? <StatusPill label="Default" tone="success" /> : 'No'),
                },
                {
                  id: 'action',
                  header: 'Accion',
                  align: 'right',
                  width: '180px',
                  render: (record) => (
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => openPaymentModal(record)} style={{ color: '#2563eb', fontWeight: 700 }}>
                        Editar
                      </button>
                      <button type="button" onClick={() => handlePaymentDelete(record.id)} style={{ color: '#b91c1c', fontWeight: 700 }}>
                        Eliminar
                      </button>
                    </div>
                  ),
                },
              ]}
            />
          </AdminInlineRelationTable>
        </AdminTabPanel>
      ) : null}

      {activeTab === 'carts' ? (
        <AdminTabPanel>
          <SectionCard title="Carritos del comercio" description="carts, cart_items y cart_item_modifiers se leen juntos para recuperar contexto comercial.">
            {detail.carts.length === 0 ? (
              <div style={{ color: '#6b7280' }}>No hay carritos del cliente en este comercio.</div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {detail.carts.map((cart) => (
                  <div key={cart.id} style={{ padding: '18px', borderRadius: '16px', border: '1px solid #e5e7eb', background: '#f9fafb', display: 'grid', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <div>
                        <strong>Carrito {cart.branch_label}</strong>
                        <div style={{ color: '#6b7280', marginTop: '6px' }}>
                          {cart.status || 'sin estado'} / {cart.expires_at ? `expira ${formatDateTime(cart.expires_at)}` : 'sin expiracion'}
                        </div>
                      </div>
                      <strong>{formatMoney(cart.total)}</strong>
                    </div>
                    <AdminDataTable
                      rows={cart.items}
                      getRowId={(item) => item.id}
                      emptyMessage="No hay items en este carrito."
                      columns={[
                        {
                          id: 'product',
                          header: 'Producto',
                          render: (item) => (
                            <div style={{ display: 'grid', gap: '6px' }}>
                              <strong>{item.product_name_snapshot}</strong>
                              {item.notes ? <span style={{ color: '#6b7280' }}>Nota: {item.notes}</span> : null}
                            </div>
                          ),
                        },
                        { id: 'qty', header: 'Cantidad', render: (item) => item.quantity },
                        { id: 'unit', header: 'Unitario', render: (item) => formatMoney(item.unit_price) },
                        {
                          id: 'mods',
                          header: 'Modificadores',
                          render: (item) =>
                            item.modifiers.length > 0 ? (
                              <div style={{ display: 'grid', gap: '6px' }}>
                                {item.modifiers.map((modifier) => (
                                  <span key={modifier.id}>
                                    {modifier.option_name_snapshot} x{modifier.quantity} ({formatMoney(modifier.price_delta)})
                                  </span>
                                ))}
                              </div>
                            ) : (
                              'Sin modificadores'
                            ),
                        },
                        { id: 'total', header: 'Total', align: 'right', render: (item) => formatMoney(item.line_total) },
                      ]}
                    />
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </AdminTabPanel>
      ) : null}

      {activeTab === 'history' ? (
        <AdminTabPanel>
          <AdminInlineRelationTable title="Pedidos" description="Historial de compras del cliente dentro del comercio actual.">
            <AdminDataTable
              rows={detail.orders}
              getRowId={(record) => record.id}
              emptyMessage="No hay pedidos del cliente en este comercio."
              columns={[
                {
                  id: 'order',
                  header: 'Pedido',
                  render: (record) => (
                    <div style={{ display: 'grid', gap: '6px' }}>
                      <strong>#{record.order_code}</strong>
                      <span style={{ color: '#6b7280' }}>{record.branch_label}</span>
                    </div>
                  ),
                },
                { id: 'status', header: 'Estado', render: (record) => record.status || 'sin estado' },
                { id: 'payment', header: 'Pago', render: (record) => record.payment_status || 'sin estado' },
                { id: 'total', header: 'Total', render: (record) => formatMoney(record.total) },
                { id: 'date', header: 'Fecha', render: (record) => formatDateTime(record.placed_at) },
                {
                  id: 'action',
                  header: 'Accion',
                  align: 'right',
                  width: '160px',
                  render: (record) => (
                    <Link to={AppRoutes.portal.admin.orderDetail.replace(':orderId', record.id)} style={{ color: '#2563eb', fontWeight: 700 }}>
                      Ver pedido
                    </Link>
                  ),
                },
              ]}
            />
          </AdminInlineRelationTable>

          <AdminInlineRelationTable title="Cupones usados" description="coupon_redemptions muestra el historial promocional del cliente en este comercio.">
            <AdminDataTable
              rows={detail.coupon_redemptions}
              getRowId={(record) => record.id}
              emptyMessage="No hay redenciones de cupon registradas."
              columns={[
                { id: 'coupon', header: 'Cupon', render: (record) => record.coupon_code || 'Sin cupon' },
                { id: 'order', header: 'Pedido', render: (record) => (record.order_code ? `#${record.order_code}` : 'Sin pedido') },
                { id: 'amount', header: 'Descuento', render: (record) => formatMoney(record.discount_amount) },
                { id: 'date', header: 'Fecha', render: (record) => formatDateTime(record.redeemed_at) },
              ]}
            />
          </AdminInlineRelationTable>
        </AdminTabPanel>
      ) : null}

      <FormStatusBar dirty={false} saving={mutating} error={error} successMessage={successMessage} />

      <AdminModalForm
        open={profileOpen}
        title="Editar perfil del cliente"
        description="Actualiza el perfil base del cliente sin salir de la ficha."
        onClose={() => setProfileOpen(false)}
        actions={
          <>
            <button type="button" onClick={() => setProfileOpen(false)} style={{ padding: '12px 16px' }}>
              Cancelar
            </button>
            <button type="button" onClick={handleProfileSave} disabled={mutating} style={{ padding: '12px 16px', borderRadius: '10px', background: '#111827', color: '#ffffff' }}>
              {mutating ? 'Guardando...' : 'Guardar perfil'}
            </button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <FieldGroup label="Nombre completo">
            <TextField value={profileForm.full_name} onChange={(event) => setProfileForm((current) => ({ ...current, full_name: event.target.value }))} />
          </FieldGroup>
          <FieldGroup label="Telefono">
            <TextField value={profileForm.phone} onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))} />
          </FieldGroup>
        </div>
        <CheckboxField
          label="Cliente activo"
          checked={profileForm.is_active}
          onChange={(event) => setProfileForm((current) => ({ ...current, is_active: event.target.checked }))}
        />
      </AdminModalForm>

      <AdminModalForm
        open={addressOpen}
        title={addressForm.relation_id ? 'Editar direccion' : 'Agregar direccion'}
        description="La direccion se guarda en addresses y su relacion en customer_addresses."
        onClose={() => setAddressOpen(false)}
        actions={
          <>
            <button type="button" onClick={() => setAddressOpen(false)} style={{ padding: '12px 16px' }}>
              Cancelar
            </button>
            <button type="button" onClick={handleAddressSave} disabled={mutating || !addressForm.line1} style={{ padding: '12px 16px', borderRadius: '10px', background: '#111827', color: '#ffffff' }}>
              {mutating ? 'Guardando...' : 'Guardar direccion'}
            </button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <FieldGroup label="Etiqueta">
            <TextField value={addressForm.label} onChange={(event) => setAddressForm((current) => ({ ...current, label: event.target.value }))} />
          </FieldGroup>
          <FieldGroup label="Linea 1">
            <TextField value={addressForm.line1} onChange={(event) => setAddressForm((current) => ({ ...current, line1: event.target.value }))} />
          </FieldGroup>
          <FieldGroup label="Linea 2">
            <TextField value={addressForm.line2} onChange={(event) => setAddressForm((current) => ({ ...current, line2: event.target.value }))} />
          </FieldGroup>
          <FieldGroup label="Referencia">
            <TextField value={addressForm.reference} onChange={(event) => setAddressForm((current) => ({ ...current, reference: event.target.value }))} />
          </FieldGroup>
          <FieldGroup label="Distrito">
            <TextField value={addressForm.district} onChange={(event) => setAddressForm((current) => ({ ...current, district: event.target.value }))} />
          </FieldGroup>
          <FieldGroup label="Ciudad">
            <TextField value={addressForm.city} onChange={(event) => setAddressForm((current) => ({ ...current, city: event.target.value }))} />
          </FieldGroup>
          <FieldGroup label="Region">
            <TextField value={addressForm.region} onChange={(event) => setAddressForm((current) => ({ ...current, region: event.target.value }))} />
          </FieldGroup>
          <FieldGroup label="Pais">
            <TextField value={addressForm.country} onChange={(event) => setAddressForm((current) => ({ ...current, country: event.target.value }))} />
          </FieldGroup>
          <FieldGroup label="Latitud">
            <NumberField value={addressForm.lat} onChange={(event) => setAddressForm((current) => ({ ...current, lat: event.target.value }))} />
          </FieldGroup>
          <FieldGroup label="Longitud">
            <NumberField value={addressForm.lng} onChange={(event) => setAddressForm((current) => ({ ...current, lng: event.target.value }))} />
          </FieldGroup>
        </div>
        <CheckboxField
          label="Direccion predeterminada"
          checked={addressForm.is_default}
          onChange={(event) => setAddressForm((current) => ({ ...current, is_default: event.target.checked }))}
        />
      </AdminModalForm>

      <AdminModalForm
        open={paymentOpen}
        title={paymentForm.id ? 'Editar metodo guardado' : 'Agregar metodo guardado'}
        description="Se administra customer_payment_methods dentro de la ficha del cliente."
        onClose={() => setPaymentOpen(false)}
        actions={
          <>
            <button type="button" onClick={() => setPaymentOpen(false)} style={{ padding: '12px 16px' }}>
              Cancelar
            </button>
            <button type="button" onClick={handlePaymentSave} disabled={mutating || !paymentForm.payment_method_id} style={{ padding: '12px 16px', borderRadius: '10px', background: '#111827', color: '#ffffff' }}>
              {mutating ? 'Guardando...' : 'Guardar metodo'}
            </button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <FieldGroup label="Metodo base">
            <SelectField
              value={paymentForm.payment_method_id}
              onChange={(event) => setPaymentForm((current) => ({ ...current, payment_method_id: event.target.value }))}
              options={[
                { value: '', label: 'Selecciona un metodo' },
                ...detail.payment_method_options.map((item) => ({ value: item.id, label: `${item.name} (${item.code})` })),
              ]}
            />
          </FieldGroup>
          <FieldGroup label="Brand">
            <TextField value={paymentForm.brand} onChange={(event) => setPaymentForm((current) => ({ ...current, brand: event.target.value }))} />
          </FieldGroup>
          <FieldGroup label="Referencia enmascarada">
            <TextField value={paymentForm.masked_reference} onChange={(event) => setPaymentForm((current) => ({ ...current, masked_reference: event.target.value }))} />
          </FieldGroup>
          <FieldGroup label="Token del provider">
            <TextField value={paymentForm.provider_token} onChange={(event) => setPaymentForm((current) => ({ ...current, provider_token: event.target.value }))} />
          </FieldGroup>
          <FieldGroup label="Estado">
            <SelectField
              value={paymentForm.status}
              onChange={(event) => setPaymentForm((current) => ({ ...current, status: event.target.value }))}
              options={[
                { value: 'active', label: 'Activo' },
                { value: 'inactive', label: 'Inactivo' },
                { value: 'expired', label: 'Expirado' },
              ]}
            />
          </FieldGroup>
        </div>
        <CheckboxField
          label="Metodo predeterminado"
          checked={paymentForm.is_default}
          onChange={(event) => setPaymentForm((current) => ({ ...current, is_default: event.target.checked }))}
        />
      </AdminModalForm>
    </AdminPageFrame>
  );
}
