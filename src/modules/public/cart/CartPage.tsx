import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppRoutes } from '../../../core/constants/routes';
import { CustomerAddressForm, publicCustomerService } from '../../../core/services/publicCustomerService';
import { usePublicStore } from '../store/PublicStoreContext';

type AuthMode = 'login' | 'register';
type FulfillmentType = 'delivery' | 'pickup';

function formatMoney(value: number, currency = 'PEN') {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

function createEmptyAddress(): CustomerAddressForm {
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

export function CartPage() {
  const navigate = useNavigate();
  const publicStore = usePublicStore();
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>('delivery');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [addressForm, setAddressForm] = useState<CustomerAddressForm>(createEmptyAddress());
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
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const isAccountValidated = Boolean(publicStore.sessionUser?.email_confirmed_at);

  useEffect(() => {
    if (publicStore.profile) {
      setRecipientName((current) => current || publicStore.profile?.full_name || '');
      setRecipientPhone((current) => current || publicStore.profile?.phone || '');
      setLoginEmail((current) => current || publicStore.profile?.email || '');
    }
  }, [publicStore.profile]);

  const canCheckout =
    publicStore.cartItems.length > 0 &&
    publicStore.sessionUser &&
    isAccountValidated &&
    recipientName.trim() &&
    recipientPhone.trim() &&
    (fulfillmentType === 'pickup' || (addressForm.line1.trim() && addressForm.city.trim()));

  const cartSummary = useMemo(() => {
    const subtotal = publicStore.cartSubtotal;
    return {
      subtotal,
      total: subtotal,
    };
  }, [publicStore.cartSubtotal]);

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);
    setSubmitting(true);

    if (authMode === 'login') {
      const result = await publicStore.signInCustomer(loginEmail, loginPassword);
      setSubmitting(false);
      if (result.error) {
        setAuthError(result.error.message);
      }
      return;
    }

    const result = await publicStore.signUpCustomer(registerForm);
    setSubmitting(false);
    if (result.error) {
      setAuthError(result.error.message);
      return;
    }
    if (!result.data.session) {
      setAuthError('Tu cuenta fue creada. Revisa tu correo para validarla y luego vuelve a confirmar el pedido.');
    }
  };

  const handleCheckout = async () => {
    if (!publicStore.sessionUser || publicStore.cartItems.length === 0) return;

    setSubmitting(true);
    setCheckoutError(null);

    const firstItem = publicStore.cartItems[0];
    const result = await publicCustomerService.placeOrderFromCart(publicStore.sessionUser.id, {
      merchant_id: firstItem.merchant_id,
      branch_id: firstItem.branch_id,
      fulfillment_type: fulfillmentType,
      special_instructions: specialInstructions,
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      address: addressForm,
      save_address: fulfillmentType === 'delivery',
      items: publicStore.cartItems.map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        unit_price: item.unit_price,
        quantity: item.quantity,
        notes: item.notes,
        modifiers: item.modifiers,
      })),
    });

    setSubmitting(false);
    if (result.error) {
      setCheckoutError(result.error.message);
      return;
    }

    publicStore.clearCart();
    navigate(`${AppRoutes.public.account}?tab=orders&orderId=${result.data?.order_id ?? ''}`);
  };

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
        <section style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'end', flexWrap: 'wrap' }}>
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: '#ff6200' }}>Checkout base</div>
            <h1 style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#1d1630' }}>Tu carrito y datos del pedido</h1>
            <p style={{ margin: 0, color: '#6b7280', lineHeight: 1.7, maxWidth: '760px' }}>
              Ya puedes armar el carro como visitante. El pago Yape y el tracking con mapa quedan listos para la siguiente fase; aquí registramos cuenta, datos y pedido.
            </p>
          </div>
          <Link
            to={AppRoutes.public.marketplace}
            style={{
              display: 'inline-flex',
              padding: '14px 18px',
              borderRadius: '16px',
              background: '#fff',
              border: '1px solid #e5e7eb',
              fontWeight: 700,
            }}
          >
            Seguir comprando
          </Link>
        </section>

        {publicStore.cartItems.length === 0 ? (
          <div style={{ padding: '48px', borderRadius: '30px', background: '#fff', boxShadow: '0 16px 42px rgba(17,24,39,.06)', display: 'grid', gap: '16px', textAlign: 'center' }}>
            <strong style={{ fontSize: '1.2rem' }}>Tu carrito está vacío.</strong>
            <span style={{ color: '#6b7280' }}>Explora negocios y agrega productos para continuar.</span>
            <div>
              <Link to={AppRoutes.public.marketplace} style={{ display: 'inline-flex', padding: '14px 18px', borderRadius: '16px', background: '#ff6200', color: '#fff', fontWeight: 800 }}>
                Ir a negocios
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: '20px', alignItems: 'start' }}>
            <div style={{ display: 'grid', gap: '18px' }}>
              <section style={{ padding: '24px', borderRadius: '28px', background: '#fff', boxShadow: '0 16px 42px rgba(17,24,39,.06)', display: 'grid', gap: '16px' }}>
                <strong style={{ fontSize: '1.15rem' }}>Items del carrito</strong>
                {publicStore.cartItems.map((item) => (
                  <div key={item.id} style={{ borderRadius: '22px', border: '1px solid #ecebf5', padding: '18px', display: 'grid', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'start' }}>
                      <div style={{ display: 'grid', gap: '6px' }}>
                        <strong>{item.product_name}</strong>
                        <span style={{ color: '#6b7280' }}>{item.merchant_name} · {item.branch_name}</span>
                        {item.modifiers.length > 0 ? (
                          <span style={{ color: '#6b7280', fontSize: '13px' }}>
                            {item.modifiers.map((modifier) => modifier.name).join(', ')}
                          </span>
                        ) : null}
                      </div>
                      <strong>{formatMoney((item.unit_price + item.modifiers.reduce((sum, modifier) => sum + modifier.price_delta * modifier.quantity, 0)) * item.quantity)}</strong>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: '14px', overflow: 'hidden' }}>
                        <button type="button" onClick={() => publicStore.updateItemQuantity(item.id, Math.max(1, item.quantity - 1))} style={{ border: 'none', background: '#fff', padding: '10px 14px' }}>
                          −
                        </button>
                        <strong style={{ minWidth: '44px', textAlign: 'center' }}>{item.quantity}</strong>
                        <button type="button" onClick={() => publicStore.updateItemQuantity(item.id, item.quantity + 1)} style={{ border: 'none', background: '#fff', padding: '10px 14px' }}>
                          +
                        </button>
                      </div>
                      <input
                        value={item.notes}
                        onChange={(event) => publicStore.updateItemNotes(item.id, event.target.value)}
                        placeholder="Notas para este item"
                        style={{ flex: 1, minWidth: '220px', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '10px 12px' }}
                      />
                      <button type="button" onClick={() => publicStore.removeItem(item.id)} style={{ border: '1px solid #fecaca', color: '#b91c1c', background: '#fff5f5', borderRadius: '14px', padding: '10px 14px', fontWeight: 700 }}>
                        Quitar
                      </button>
                    </div>
                  </div>
                ))}
              </section>

              <section style={{ padding: '24px', borderRadius: '28px', background: '#fff', boxShadow: '0 16px 42px rgba(17,24,39,.06)', display: 'grid', gap: '18px' }}>
                <strong style={{ fontSize: '1.15rem' }}>Entrega y contacto</strong>
                {publicStore.sessionUser && !isAccountValidated ? (
                  <div style={{ padding: '14px 16px', borderRadius: '16px', background: '#fff7ed', border: '1px solid rgba(255,98,0,.18)', color: '#9a3412', lineHeight: 1.6 }}>
                    Antes de confirmar el pedido valida tu cuenta desde el correo que te enviamos. Eso activa el historial y evita pedidos ciegos.
                  </div>
                ) : null}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'delivery', label: 'Delivery' },
                    { id: 'pickup', label: 'Recojo en tienda' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setFulfillmentType(mode.id as FulfillmentType)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '16px',
                        border: fulfillmentType === mode.id ? '1px solid rgba(77,20,140,.28)' : '1px solid #e5e7eb',
                        background: fulfillmentType === mode.id ? '#f4eeff' : '#fff',
                        color: fulfillmentType === mode.id ? '#4d148c' : '#374151',
                        fontWeight: 700,
                      }}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
                  <input value={recipientName} onChange={(event) => setRecipientName(event.target.value)} placeholder="Nombre de quien recibe" style={{ border: '1px solid #e5e7eb', borderRadius: '14px', padding: '12px 14px' }} />
                  <input value={recipientPhone} onChange={(event) => setRecipientPhone(event.target.value)} placeholder="Teléfono" style={{ border: '1px solid #e5e7eb', borderRadius: '14px', padding: '12px 14px' }} />
                </div>

                {fulfillmentType === 'delivery' ? (
                  <div style={{ display: 'grid', gap: '14px' }}>
                    <input value={addressForm.line1} onChange={(event) => setAddressForm((current) => ({ ...current, line1: event.target.value }))} placeholder="Dirección" style={{ border: '1px solid #e5e7eb', borderRadius: '14px', padding: '12px 14px' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '14px' }}>
                      <input value={addressForm.district} onChange={(event) => setAddressForm((current) => ({ ...current, district: event.target.value }))} placeholder="Distrito" style={{ border: '1px solid #e5e7eb', borderRadius: '14px', padding: '12px 14px' }} />
                      <input value={addressForm.city} onChange={(event) => setAddressForm((current) => ({ ...current, city: event.target.value }))} placeholder="Ciudad" style={{ border: '1px solid #e5e7eb', borderRadius: '14px', padding: '12px 14px' }} />
                      <input value={addressForm.region} onChange={(event) => setAddressForm((current) => ({ ...current, region: event.target.value }))} placeholder="Región" style={{ border: '1px solid #e5e7eb', borderRadius: '14px', padding: '12px 14px' }} />
                    </div>
                    <input value={addressForm.reference} onChange={(event) => setAddressForm((current) => ({ ...current, reference: event.target.value }))} placeholder="Referencia para encontrarte" style={{ border: '1px solid #e5e7eb', borderRadius: '14px', padding: '12px 14px' }} />
                  </div>
                ) : null}

                <textarea
                  value={specialInstructions}
                  onChange={(event) => setSpecialInstructions(event.target.value)}
                  placeholder="Indicaciones para el pedido"
                  style={{ minHeight: '90px', border: '1px solid #e5e7eb', borderRadius: '18px', padding: '14px 16px', resize: 'vertical' }}
                />

                <div style={{ padding: '16px', borderRadius: '18px', background: '#fff7ed', border: '1px solid rgba(255,98,0,.16)', color: '#9a3412', lineHeight: 1.7 }}>
                  El cobro digital y Yape quedarán para la siguiente fase. Aquí solo registramos el pedido, los datos del cliente y la entrega para que ya aparezca en historial y operación interna.
                </div>
              </section>
            </div>

            <aside style={{ position: 'sticky', top: '92px', display: 'grid', gap: '18px' }}>
              {!publicStore.sessionUser ? (
                <section style={{ padding: '24px', borderRadius: '28px', background: '#fff', boxShadow: '0 16px 42px rgba(17,24,39,.06)', display: 'grid', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {[
                      { id: 'login', label: 'Ingresar' },
                      { id: 'register', label: 'Registrarme' },
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
                    <button type="submit" disabled={submitting} style={{ border: 'none', borderRadius: '16px', padding: '14px 18px', background: '#4d148c', color: '#fff', fontWeight: 800 }}>
                      {submitting ? 'Procesando...' : authMode === 'register' ? 'Crear cuenta' : 'Ingresar para confirmar'}
                    </button>
                  </form>
                </section>
              ) : null}

              <section style={{ padding: '24px', borderRadius: '28px', background: '#fff', boxShadow: '0 16px 42px rgba(17,24,39,.06)', display: 'grid', gap: '14px' }}>
                <strong style={{ fontSize: '1.15rem' }}>Resumen</strong>
                <div style={{ display: 'grid', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal</span>
                    <strong>{formatMoney(cartSummary.subtotal)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Delivery</span>
                    <strong>Se define luego</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Pago</span>
                    <strong>Pendiente</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eef2f7', paddingTop: '10px', fontSize: '1.05rem' }}>
                    <span>Total base</span>
                    <strong>{formatMoney(cartSummary.total)}</strong>
                  </div>
                </div>
                {checkoutError ? <div style={{ color: '#b91c1c', fontSize: '14px' }}>{checkoutError}</div> : null}
                <button
                  type="button"
                  disabled={!canCheckout || submitting}
                  onClick={handleCheckout}
                  style={{
                    border: 'none',
                    borderRadius: '16px',
                    padding: '15px 18px',
                    background: canCheckout ? '#ff6200' : '#fed7aa',
                    color: '#fff',
                    fontWeight: 800,
                  }}
                >
                  {submitting ? 'Registrando pedido...' : 'Confirmar pedido'}
                </button>
              </section>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
