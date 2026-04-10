import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { publicCustomerService, CustomerAccountSnapshot, CustomerAddressForm } from '../../../core/services/publicCustomerService';
import { usePublicStore } from '../store/PublicStoreContext';

type AccountTab = 'profile' | 'addresses' | 'orders';
type AuthMode = 'login' | 'register';

function formatMoney(value: number, currency = 'PEN') {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDateTime(value: string) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function emptyAddress(): CustomerAddressForm {
  return {
    label: 'Casa',
    is_default: true,
    line1: '',
    line2: '',
    reference: '',
    district: '',
    city: 'Huancayo',
    region: 'Junin',
    country: 'Peru',
  };
}

function statusTone(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === 'placed' || normalized === 'pending') return '#9a3412';
  if (normalized === 'confirmed' || normalized === 'preparing' || normalized === 'ready' || normalized === 'on_the_way') return '#1d4ed8';
  if (normalized === 'delivered') return '#166534';
  if (normalized === 'cancelled' || normalized === 'rejected') return '#b91c1c';
  return '#4b5563';
}

export function AccountPage() {
  const publicStore = usePublicStore();
  const [searchParams] = useSearchParams();
  const requestedTab = (searchParams.get('tab') as AccountTab | null) ?? 'profile';
  const requestedOrderId = searchParams.get('orderId');
  const [activeTab, setActiveTab] = useState<AccountTab>(requestedTab);
  const [snapshot, setSnapshot] = useState<CustomerAccountSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({ full_name: '', email: '', phone: '' });
  const [addressForm, setAddressForm] = useState<CustomerAddressForm>(emptyAddress());
  const [saving, setSaving] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerForm, setRegisterForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(requestedOrderId);

  useEffect(() => {
    setActiveTab(requestedTab);
  }, [requestedTab]);

  const loadAccount = async () => {
    if (!publicStore.sessionUser) return;
    setLoading(true);
    setError(null);
    const result = await publicCustomerService.fetchAccountSnapshot(publicStore.sessionUser.id);
    setLoading(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setSnapshot(result.data);
    setProfileForm({
      full_name: result.data?.profile.full_name || '',
      email: result.data?.profile.email || publicStore.sessionUser.email || '',
      phone: result.data?.profile.phone || '',
    });
    if (!selectedOrderId && result.data?.orders[0]?.id) {
      setSelectedOrderId(result.data.orders[0].id);
    }
  };

  useEffect(() => {
    loadAccount();
  }, [publicStore.sessionUser]);

  useEffect(() => {
    if (requestedOrderId) {
      setSelectedOrderId(requestedOrderId);
      setActiveTab('orders');
    }
  }, [requestedOrderId]);

  const selectedOrder = useMemo(
    () => snapshot?.orders.find((order) => order.id === selectedOrderId) ?? snapshot?.orders[0] ?? null,
    [selectedOrderId, snapshot]
  );

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!publicStore.sessionUser) return;
    setSaving(true);
    setError(null);
    const result = await publicCustomerService.saveProfile(publicStore.sessionUser.id, {
      full_name: profileForm.full_name,
      email: profileForm.email,
      phone: profileForm.phone,
    });
    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    await publicStore.reloadPublicSession();
    await loadAccount();
  };

  const saveAddress = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!publicStore.sessionUser) return;
    setSaving(true);
    setError(null);
    const result = await publicCustomerService.saveAddress(publicStore.sessionUser.id, addressForm);
    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setAddressForm(emptyAddress());
    await loadAccount();
  };

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);
    setSaving(true);

    if (authMode === 'login') {
      const result = await publicStore.signInCustomer(loginEmail, loginPassword);
      setSaving(false);
      if (result.error) setAuthError(result.error.message);
      return;
    }

    const result = await publicStore.signUpCustomer(registerForm);
    setSaving(false);
    if (result.error) {
      setAuthError(result.error.message);
      return;
    }
    if (!result.data.session) {
      setAuthError('Tu cuenta fue creada. Revisa tu correo para validarla y vuelve a entrar.');
    }
  };

  if (!publicStore.sessionUser) {
    return (
      <section
        style={{
          minHeight: '100vh',
          padding: '108px 24px 56px',
          background:
            'radial-gradient(900px 320px at -10% 0%, rgba(77,20,140,.10), transparent 55%), radial-gradient(820px 360px at 105% 10%, rgba(255,98,0,.10), transparent 55%), #f7f7fb',
        }}
      >
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'grid', gap: '24px' }}>
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: '#ff6200' }}>Cuenta cliente</div>
            <h1 style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#1d1630' }}>Ingresa para guardar tu perfil y ver tus pedidos</h1>
          </div>
          <section style={{ padding: '28px', borderRadius: '30px', background: '#fff', boxShadow: '0 16px 42px rgba(17,24,39,.06)', display: 'grid', gap: '18px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { id: 'login', label: 'Ingresar' },
                { id: 'register', label: 'Crear cuenta' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setAuthMode(tab.id as AuthMode)}
                  style={{
                    flex: 1,
                    padding: '12px 14px',
                    borderRadius: '14px',
                    border: authMode === tab.id ? '1px solid rgba(77,20,140,.28)' : '1px solid #e5e7eb',
                    background: authMode === tab.id ? '#f4eeff' : '#fff',
                    color: authMode === tab.id ? '#4d148c' : '#374151',
                    fontWeight: 700,
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <form onSubmit={handleAuthSubmit} style={{ display: 'grid', gap: '12px' }}>
              {authMode === 'register' ? (
                <>
                  <input value={registerForm.full_name} onChange={(event) => setRegisterForm((current) => ({ ...current, full_name: event.target.value }))} placeholder="Nombre completo" style={{ border: '1px solid #e5e7eb', borderRadius: '14px', padding: '12px 14px' }} />
                  <input value={registerForm.phone} onChange={(event) => setRegisterForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Teléfono" style={{ border: '1px solid #e5e7eb', borderRadius: '14px', padding: '12px 14px' }} />
                  <input value={registerForm.email} onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))} placeholder="Correo" type="email" style={{ border: '1px solid #e5e7eb', borderRadius: '14px', padding: '12px 14px' }} />
                  <input value={registerForm.password} onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))} placeholder="Contraseña" type="password" style={{ border: '1px solid #e5e7eb', borderRadius: '14px', padding: '12px 14px' }} />
                </>
              ) : (
                <>
                  <input value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} placeholder="Correo" type="email" style={{ border: '1px solid #e5e7eb', borderRadius: '14px', padding: '12px 14px' }} />
                  <input value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} placeholder="Contraseña" type="password" style={{ border: '1px solid #e5e7eb', borderRadius: '14px', padding: '12px 14px' }} />
                </>
              )}
              {authError ? <div style={{ color: '#b91c1c', fontSize: '14px' }}>{authError}</div> : null}
              <button type="submit" disabled={saving} style={{ border: 'none', borderRadius: '16px', padding: '14px 18px', background: '#4d148c', color: '#fff', fontWeight: 800 }}>
                {saving ? 'Procesando...' : authMode === 'register' ? 'Crear cuenta' : 'Ingresar'}
              </button>
            </form>
          </section>
        </div>
      </section>
    );
  }

  return (
    <section
      style={{
        minHeight: '100vh',
        padding: '108px 24px 56px',
        background:
          'radial-gradient(900px 320px at -10% 0%, rgba(77,20,140,.10), transparent 55%), radial-gradient(820px 360px at 105% 10%, rgba(255,98,0,.10), transparent 55%), #f7f7fb',
      }}
    >
      <div style={{ maxWidth: '1320px', margin: '0 auto', display: 'grid', gap: '24px' }}>
        <section style={{ display: 'grid', gap: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: '#ff6200' }}>Cuenta cliente</div>
          <h1 style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#1d1630' }}>Perfil, direcciones e historial</h1>
          <p style={{ margin: 0, color: '#6b7280', lineHeight: 1.7 }}>
            Esta capa ya te deja registrarte, validar la cuenta por correo, guardar datos básicos y revisar el estado del pedido. El mapa en tiempo real quedará para la siguiente fase.
          </p>
        </section>

        {!publicStore.sessionUser.email_confirmed_at ? (
          <div style={{ padding: '18px 20px', borderRadius: '20px', background: '#fff7ed', border: '1px solid rgba(255,98,0,.18)', display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: '#9a3412' }}>
              Tu cuenta aún no aparece confirmada. Revisa tu correo o reenvía el enlace de validación.
            </span>
            <button
              type="button"
              onClick={async () => {
                if (publicStore.sessionUser?.email) {
                  await publicStore.resendVerification(publicStore.sessionUser.email);
                }
              }}
              style={{ border: 'none', borderRadius: '14px', padding: '12px 14px', background: '#ff6200', color: '#fff', fontWeight: 800 }}
            >
              Reenviar verificación
            </button>
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { id: 'profile', label: 'Perfil' },
            { id: 'addresses', label: 'Direcciones' },
            { id: 'orders', label: 'Pedidos' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as AccountTab)}
              style={{
                padding: '12px 14px',
                borderRadius: '999px',
                border: activeTab === tab.id ? '1px solid rgba(77,20,140,.28)' : '1px solid #e5e7eb',
                background: activeTab === tab.id ? '#f4eeff' : '#fff',
                color: activeTab === tab.id ? '#4d148c' : '#374151',
                fontWeight: 700,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? <div style={{ padding: '32px', borderRadius: '24px', background: '#fff' }}>Cargando tu cuenta...</div> : null}
        {error ? <div style={{ padding: '18px 20px', borderRadius: '20px', background: '#fff', color: '#b91c1c' }}>{error}</div> : null}

        {activeTab === 'profile' ? (
          <section style={{ padding: '24px', borderRadius: '28px', background: '#fff', boxShadow: '0 16px 42px rgba(17,24,39,.06)', display: 'grid', gap: '18px' }}>
            <strong style={{ fontSize: '1.15rem' }}>Perfil de cliente</strong>
            <form onSubmit={saveProfile} style={{ display: 'grid', gap: '14px', maxWidth: '680px' }}>
              <input value={profileForm.full_name} onChange={(event) => setProfileForm((current) => ({ ...current, full_name: event.target.value }))} placeholder="Nombre completo" style={{ border: '1px solid #e5e7eb', borderRadius: '14px', padding: '12px 14px' }} />
              <input value={profileForm.email} readOnly placeholder="Correo" style={{ border: '1px solid #e5e7eb', borderRadius: '14px', padding: '12px 14px', background: '#f9fafb' }} />
              <input value={profileForm.phone} onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Teléfono" style={{ border: '1px solid #e5e7eb', borderRadius: '14px', padding: '12px 14px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ color: '#6b7280' }}>Rating actual: {snapshot?.profile.rating_avg ?? 0}</span>
                <button type="submit" disabled={saving} style={{ border: 'none', borderRadius: '16px', padding: '14px 18px', background: '#4d148c', color: '#fff', fontWeight: 800 }}>
                  {saving ? 'Guardando...' : 'Guardar perfil'}
                </button>
              </div>
            </form>
          </section>
        ) : null}

        {activeTab === 'addresses' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
            <section style={{ padding: '24px', borderRadius: '28px', background: '#fff', boxShadow: '0 16px 42px rgba(17,24,39,.06)', display: 'grid', gap: '16px' }}>
              <strong style={{ fontSize: '1.15rem' }}>Direcciones guardadas</strong>
              {snapshot?.addresses.length ? (
                snapshot.addresses.map((address) => (
                  <button
                    key={address.relation_id}
                    type="button"
                    onClick={() => setAddressForm(address)}
                    style={{ textAlign: 'left', borderRadius: '18px', border: '1px solid #ecebf5', background: '#fff', padding: '16px', display: 'grid', gap: '6px' }}
                  >
                    <strong>{address.label}{address.is_default ? ' · Predeterminada' : ''}</strong>
                    <span style={{ color: '#6b7280' }}>{address.line1}</span>
                    <span style={{ color: '#6b7280', fontSize: '13px' }}>{[address.district, address.city, address.region].filter(Boolean).join(' · ')}</span>
                  </button>
                ))
              ) : (
                <span style={{ color: '#6b7280' }}>Aún no has guardado direcciones.</span>
              )}
            </section>

            <section style={{ padding: '24px', borderRadius: '28px', background: '#fff', boxShadow: '0 16px 42px rgba(17,24,39,.06)', display: 'grid', gap: '16px' }}>
              <strong style={{ fontSize: '1.15rem' }}>{addressForm.relation_id ? 'Editar dirección' : 'Nueva dirección'}</strong>
              <form onSubmit={saveAddress} style={{ display: 'grid', gap: '12px' }}>
                <input value={addressForm.label} onChange={(event) => setAddressForm((current) => ({ ...current, label: event.target.value }))} placeholder="Etiqueta" style={{ border: '1px solid #e5e7eb', borderRadius: '14px', padding: '12px 14px' }} />
                <input value={addressForm.line1} onChange={(event) => setAddressForm((current) => ({ ...current, line1: event.target.value }))} placeholder="Dirección" style={{ border: '1px solid #e5e7eb', borderRadius: '14px', padding: '12px 14px' }} />
                <input value={addressForm.reference} onChange={(event) => setAddressForm((current) => ({ ...current, reference: event.target.value }))} placeholder="Referencia" style={{ border: '1px solid #e5e7eb', borderRadius: '14px', padding: '12px 14px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
                  <input value={addressForm.district} onChange={(event) => setAddressForm((current) => ({ ...current, district: event.target.value }))} placeholder="Distrito" style={{ border: '1px solid #e5e7eb', borderRadius: '14px', padding: '12px 14px' }} />
                  <input value={addressForm.city} onChange={(event) => setAddressForm((current) => ({ ...current, city: event.target.value }))} placeholder="Ciudad" style={{ border: '1px solid #e5e7eb', borderRadius: '14px', padding: '12px 14px' }} />
                  <input value={addressForm.region} onChange={(event) => setAddressForm((current) => ({ ...current, region: event.target.value }))} placeholder="Región" style={{ border: '1px solid #e5e7eb', borderRadius: '14px', padding: '12px 14px' }} />
                </div>
                <label style={{ display: 'inline-flex', gap: '10px', alignItems: 'center', color: '#374151' }}>
                  <input type="checkbox" checked={addressForm.is_default} onChange={(event) => setAddressForm((current) => ({ ...current, is_default: event.target.checked }))} />
                  Dejar como predeterminada
                </label>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => setAddressForm(emptyAddress())} style={{ border: '1px solid #e5e7eb', borderRadius: '16px', padding: '12px 16px', background: '#fff', fontWeight: 700 }}>
                    Limpiar
                  </button>
                  <button type="submit" disabled={saving} style={{ border: 'none', borderRadius: '16px', padding: '12px 16px', background: '#ff6200', color: '#fff', fontWeight: 800 }}>
                    {saving ? 'Guardando...' : 'Guardar dirección'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        ) : null}

        {activeTab === 'orders' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '.75fr 1.25fr', gap: '20px', alignItems: 'start' }}>
            <section style={{ padding: '24px', borderRadius: '28px', background: '#fff', boxShadow: '0 16px 42px rgba(17,24,39,.06)', display: 'grid', gap: '14px' }}>
              <strong style={{ fontSize: '1.15rem' }}>Historial</strong>
              {snapshot?.orders.length ? (
                snapshot.orders.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => setSelectedOrderId(order.id)}
                    style={{
                      textAlign: 'left',
                      borderRadius: '20px',
                      border: selectedOrderId === order.id ? '1px solid rgba(77,20,140,.28)' : '1px solid #ecebf5',
                      background: selectedOrderId === order.id ? '#f4eeff' : '#fff',
                      padding: '16px',
                      display: 'grid',
                      gap: '8px',
                    }}
                  >
                    <strong>Pedido #{order.order_code}</strong>
                    <span style={{ color: '#6b7280' }}>{order.merchant_label} · {order.branch_label}</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
                      <span style={{ color: statusTone(order.status), fontWeight: 800 }}>{order.status}</span>
                      <strong>{formatMoney(order.total, order.currency)}</strong>
                    </div>
                  </button>
                ))
              ) : (
                <span style={{ color: '#6b7280' }}>Todavía no tienes pedidos en historial.</span>
              )}
            </section>

            <section style={{ padding: '24px', borderRadius: '28px', background: '#fff', boxShadow: '0 16px 42px rgba(17,24,39,.06)', display: 'grid', gap: '18px' }}>
              {selectedOrder ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'start' }}>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      <strong style={{ fontSize: '1.25rem' }}>Pedido #{selectedOrder.order_code}</strong>
                      <span style={{ color: '#6b7280' }}>{selectedOrder.merchant_label} · {selectedOrder.branch_label}</span>
                      <span style={{ color: '#6b7280' }}>{formatDateTime(selectedOrder.placed_at)}</span>
                    </div>
                    <div style={{ display: 'grid', gap: '8px', justifyItems: 'end' }}>
                      <span style={{ color: statusTone(selectedOrder.status), fontWeight: 800 }}>{selectedOrder.status}</span>
                      <strong>{formatMoney(selectedOrder.total, selectedOrder.currency)}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '10px' }}>
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} style={{ borderRadius: '18px', border: '1px solid #ecebf5', padding: '16px', display: 'grid', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                          <strong>{item.product_name_snapshot}</strong>
                          <span>{formatMoney(item.line_total, selectedOrder.currency)}</span>
                        </div>
                        <span style={{ color: '#6b7280' }}>Cantidad: {item.quantity}</span>
                        {item.modifiers.length > 0 ? <span style={{ color: '#6b7280' }}>Extras: {item.modifiers.map((modifier) => modifier.option_name_snapshot).join(', ')}</span> : null}
                        {item.notes ? <span style={{ color: '#6b7280' }}>Nota: {item.notes}</span> : null}
                      </div>
                    ))}
                  </div>

                  <div style={{ padding: '18px', borderRadius: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'grid', gap: '8px' }}>
                    <strong>Entrega y seguimiento</strong>
                    <span style={{ color: '#475569' }}>
                      {selectedOrder.fulfillment_type === 'delivery'
                        ? selectedOrder.address_snapshot || 'La dirección se registró sin snapshot detallado.'
                        : 'Este pedido fue registrado para recojo en tienda.'}
                    </span>
                    <span style={{ color: '#64748b' }}>
                      Seguimiento con mapa en tiempo real: próximamente. Esta caja queda libre para integrar Google Maps o tracking del repartidor más adelante.
                    </span>
                  </div>

                  <div style={{ display: 'grid', gap: '10px' }}>
                    <strong>Historial de estado</strong>
                    {selectedOrder.history.length ? (
                      selectedOrder.history.map((entry) => (
                        <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '12px 0', borderTop: '1px solid #f1f5f9' }}>
                          <div>
                            <strong>{entry.to_status}</strong>
                            <div style={{ color: '#6b7280', fontSize: '13px' }}>{entry.note || 'Sin nota'}</div>
                          </div>
                          <span style={{ color: '#6b7280', fontSize: '13px' }}>{formatDateTime(entry.created_at)}</span>
                        </div>
                      ))
                    ) : (
                      <span style={{ color: '#6b7280' }}>El pedido todavía no tiene más movimientos registrados.</span>
                    )}
                  </div>
                </>
              ) : (
                <span style={{ color: '#6b7280' }}>Selecciona un pedido para revisar el detalle.</span>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </section>
  );
}
