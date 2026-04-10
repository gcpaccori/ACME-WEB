import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppRoutes } from '../../../core/constants/routes';
import { publicMarketplaceService, PublicMarketplaceMerchant, PublicMarketplaceProduct } from '../../../core/services/publicMarketplaceService';
import { usePublicStore } from '../store/PublicStoreContext';

function formatMoney(value: number, currency = 'PEN') {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

function productSettingForBranch(product: PublicMarketplaceProduct, branchId: string | null) {
  if (!branchId) return null;
  return product.settings.find((setting) => setting.branch_id === branchId) ?? null;
}

function isProductAvailable(product: PublicMarketplaceProduct, branchId: string | null) {
  const setting = productSettingForBranch(product, branchId);
  if (!setting) return true;
  return setting.is_available && !setting.is_paused;
}

function priceForBranch(product: PublicMarketplaceProduct, branchId: string | null) {
  const setting = productSettingForBranch(product, branchId);
  return setting?.price ?? product.base_price;
}

function gradientForIndex(index: number) {
  const gradients = [
    'linear-gradient(135deg, rgba(255,98,0,.16), rgba(255,152,85,.28))',
    'linear-gradient(135deg, rgba(77,20,140,.16), rgba(111,45,189,.28))',
    'linear-gradient(135deg, rgba(22,163,74,.14), rgba(74,222,128,.28))',
    'linear-gradient(135deg, rgba(14,165,233,.14), rgba(125,211,252,.28))',
  ];
  return gradients[index % gradients.length];
}

export function MarketplacePage() {
  const publicStore = usePublicStore();
  const [snapshot, setSnapshot] = useState<{ merchants: PublicMarketplaceMerchant[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [activeMerchantId, setActiveMerchantId] = useState<string | null>(null);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<PublicMarketplaceProduct | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [productNotes, setProductNotes] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const result = await publicMarketplaceService.fetchSnapshot();
      setLoading(false);
      if (result.error) {
        setError(result.error.message);
        return;
      }

      const merchants = result.data?.merchants ?? [];
      setSnapshot({ merchants });
      if (!activeMerchantId && merchants.length > 0) {
        setActiveMerchantId(merchants[0].id);
        setActiveBranchId(merchants[0].branches[0]?.id ?? null);
      }
    };

    load();
  }, []);

  const merchants = snapshot?.merchants ?? [];
  const filteredMerchants = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return merchants;
    return merchants.filter((merchant) => {
      const haystack = [
        merchant.trade_name,
        ...merchant.branches.map((branch) => `${branch.name} ${branch.district} ${branch.city}`),
        ...merchant.featured_product_names,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [merchants, query]);

  const activeMerchant =
    filteredMerchants.find((merchant) => merchant.id === activeMerchantId) ??
    filteredMerchants[0] ??
    null;

  useEffect(() => {
    if (!activeMerchant) return;
    if (!activeBranchId || !activeMerchant.branches.some((branch) => branch.id === activeBranchId)) {
      setActiveBranchId(activeMerchant.branches[0]?.id ?? null);
    }
  }, [activeBranchId, activeMerchant]);

  const visibleProducts = useMemo(() => {
    if (!activeMerchant) return [];
    return activeMerchant.products.filter((product) => {
      const matchesCategory = activeCategoryId === 'all' || product.category_id === activeCategoryId;
      const matchesAvailability = isProductAvailable(product, activeBranchId);
      return matchesCategory && matchesAvailability;
    });
  }, [activeBranchId, activeCategoryId, activeMerchant]);

  const addSelectedProduct = () => {
    if (!selectedProduct || !activeMerchant || !activeBranchId) return;

    const modifiers = selectedProduct.modifier_groups.flatMap((group) =>
      (selectedOptions[group.id] ?? [])
        .map((optionId) => group.options.find((option) => option.id === optionId))
        .filter(Boolean)
        .map((option) => ({
          id: option!.id,
          option_id: option!.id,
          group_id: group.id,
          name: option!.name,
          price_delta: option!.price_delta,
          quantity: 1,
        }))
    );

    publicStore.addItem({
      merchant_id: activeMerchant.id,
      merchant_name: activeMerchant.trade_name,
      branch_id: activeBranchId,
      branch_name: activeMerchant.branches.find((branch) => branch.id === activeBranchId)?.name || 'Sucursal',
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      product_description: selectedProduct.description,
      image_url: selectedProduct.image_url,
      unit_price: priceForBranch(selectedProduct, activeBranchId),
      quantity: 1,
      notes: productNotes.trim(),
      modifiers,
    });

    setSelectedProduct(null);
    setSelectedOptions({});
    setProductNotes('');
  };

  return (
    <section
      style={{
        minHeight: '100vh',
        padding: '108px 24px 56px',
        background:
          'radial-gradient(1100px 420px at -10% 0%, rgba(77,20,140,.12), transparent 55%), radial-gradient(900px 360px at 110% 10%, rgba(255,98,0,.14), transparent 55%), #f7f7fb',
      }}
    >
      <div style={{ maxWidth: '1320px', margin: '0 auto', display: 'grid', gap: '24px' }}>
        <section
          style={{
            padding: '30px',
            borderRadius: '30px',
            background: 'linear-gradient(135deg, #1a0a2e 0%, #4d148c 55%, #ff6200 100%)',
            color: '#fff',
            display: 'grid',
            gridTemplateColumns: '1.3fr .9fr',
            gap: '28px',
            boxShadow: '0 22px 70px rgba(26,10,46,.24)',
          }}
        >
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.8)' }}>
              Marketplace ACME
            </div>
            <h1 style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(2rem, 4vw, 3.6rem)', lineHeight: 1.06 }}>
              Descubre negocios locales y pide desde una carta visual.
            </h1>
            <p style={{ margin: 0, maxWidth: '620px', color: 'rgba(255,255,255,.82)', lineHeight: 1.7 }}>
              Esta capa ya deja ver lo que un cliente necesita al entrar: negocios, sucursales, categorías, productos, extras y un carrito que puede empezar sin iniciar sesión.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
              <Link
                to={AppRoutes.public.cart}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px 20px',
                  borderRadius: '999px',
                  background: '#fff',
                  color: '#4d148c',
                  fontWeight: 800,
                }}
              >
                Ver carrito {publicStore.cartCount > 0 ? `(${publicStore.cartCount})` : ''}
              </Link>
              <Link
                to={AppRoutes.public.account}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '14px 20px',
                  borderRadius: '999px',
                  border: '1px solid rgba(255,255,255,.22)',
                  color: '#fff',
                  fontWeight: 700,
                  background: 'rgba(255,255,255,.08)',
                }}
              >
                {publicStore.sessionUser ? 'Mi cuenta e historial' : 'Inicia sesion para pedir'}
              </Link>
            </div>
          </div>

          <div
            style={{
              borderRadius: '24px',
              background: 'rgba(255,255,255,.12)',
              border: '1px solid rgba(255,255,255,.16)',
              padding: '20px',
              display: 'grid',
              gap: '16px',
            }}
          >
            <strong style={{ fontSize: '1.05rem' }}>Explora por negocio</strong>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Busca por negocio, sucursal o plato..."
              style={{
                width: '100%',
                border: '1px solid rgba(255,255,255,.18)',
                background: 'rgba(255,255,255,.12)',
                color: '#fff',
                borderRadius: '16px',
                padding: '14px 16px',
                outline: 'none',
              }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
              {[
                { label: 'Negocios', value: String(filteredMerchants.length) },
                { label: 'Productos', value: String(filteredMerchants.reduce((sum, merchant) => sum + merchant.products.length, 0)) },
                { label: 'En carrito', value: String(publicStore.cartCount) },
              ].map((metric) => (
                <div key={metric.label} style={{ padding: '14px', borderRadius: '18px', background: 'rgba(255,255,255,.1)' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{metric.value}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.72)' }}>{metric.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {loading ? (
          <div style={{ padding: '32px', borderRadius: '24px', background: '#fff' }}>Cargando negocios...</div>
        ) : error ? (
          <div style={{ padding: '32px', borderRadius: '24px', background: '#fff', color: '#b91c1c' }}>{error}</div>
        ) : (
          <>
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
              {filteredMerchants.map((merchant, index) => {
                const active = merchant.id === activeMerchant?.id;
                return (
                  <button
                    key={merchant.id}
                    type="button"
                    onClick={() => {
                      setActiveMerchantId(merchant.id);
                      setActiveBranchId(merchant.branches[0]?.id ?? null);
                      setActiveCategoryId('all');
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '20px',
                      borderRadius: '24px',
                      border: active ? '1px solid rgba(77,20,140,.28)' : '1px solid #ebeaf5',
                      background: active ? 'linear-gradient(180deg, #fff, #f7f3ff)' : '#fff',
                      boxShadow: active ? '0 18px 42px rgba(77,20,140,.12)' : '0 10px 26px rgba(17,24,39,.06)',
                      display: 'grid',
                      gap: '14px',
                    }}
                  >
                    <div
                      style={{
                        minHeight: '120px',
                        borderRadius: '20px',
                        padding: '16px',
                        background: gradientForIndex(index),
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'space-between',
                        gap: '12px',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: '#4d148c' }}>Negocio</div>
                        <strong style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.15rem', color: '#1f1630' }}>{merchant.trade_name}</strong>
                      </div>
                      <span
                        style={{
                          padding: '8px 10px',
                          borderRadius: '999px',
                          background: '#fff',
                          fontSize: '12px',
                          fontWeight: 800,
                          color: '#4d148c',
                        }}
                      >
                        {merchant.branches.length} sede{merchant.branches.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gap: '8px', color: '#5b5870', fontSize: '14px' }}>
                      <span>{merchant.branches[0]?.district || 'Huancayo'} · {merchant.products.length} productos</span>
                      <span>{merchant.featured_product_names.join(' · ') || 'Carta lista para explorar'}</span>
                    </div>
                  </button>
                );
              })}
            </section>

            {activeMerchant ? (
              <section style={{ display: 'grid', gridTemplateColumns: '1.45fr .55fr', gap: '20px', alignItems: 'start' }}>
                <div style={{ display: 'grid', gap: '18px' }}>
                  <div style={{ padding: '24px', borderRadius: '28px', background: '#fff', boxShadow: '0 14px 38px rgba(17,24,39,.07)', display: 'grid', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '18px', flexWrap: 'wrap', alignItems: 'start' }}>
                      <div style={{ display: 'grid', gap: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: '#ff6200' }}>Carta activa</div>
                        <h2 style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontSize: '2rem', color: '#1d1630' }}>{activeMerchant.trade_name}</h2>
                        <p style={{ margin: 0, color: '#6b7280', maxWidth: '720px', lineHeight: 1.7 }}>
                          Negocio visible en la web pública con su carta completa, precio por sucursal y productos listos para pedir.
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {activeMerchant.branches.map((branch) => {
                          const branchActive = branch.id === activeBranchId;
                          return (
                            <button
                              key={branch.id}
                              type="button"
                              onClick={() => setActiveBranchId(branch.id)}
                              style={{
                                padding: '12px 14px',
                                borderRadius: '18px',
                                border: branchActive ? '1px solid rgba(77,20,140,.22)' : '1px solid #e5e7eb',
                                background: branchActive ? '#f4eeff' : '#fff',
                                display: 'grid',
                                gap: '4px',
                                minWidth: '210px',
                                textAlign: 'left',
                              }}
                            >
                              <strong>{branch.name}</strong>
                              <span style={{ color: '#6b7280', fontSize: '13px' }}>{branch.address_label || `${branch.district} ${branch.city}`}</span>
                              <span style={{ fontSize: '12px', color: branch.accepting_orders ? '#166534' : '#9a3412', fontWeight: 700 }}>
                                {branch.accepting_orders ? 'Recibiendo pedidos' : 'No disponible'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setActiveCategoryId('all')}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '999px',
                          border: activeCategoryId === 'all' ? '1px solid rgba(77,20,140,.22)' : '1px solid #e5e7eb',
                          background: activeCategoryId === 'all' ? '#f4eeff' : '#fff',
                          fontWeight: 700,
                          color: activeCategoryId === 'all' ? '#4d148c' : '#374151',
                        }}
                      >
                        Toda la carta
                      </button>
                      {activeMerchant.categories.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => setActiveCategoryId(category.id)}
                          style={{
                            padding: '10px 14px',
                            borderRadius: '999px',
                            border: activeCategoryId === category.id ? '1px solid rgba(77,20,140,.22)' : '1px solid #e5e7eb',
                            background: activeCategoryId === category.id ? '#f4eeff' : '#fff',
                            fontWeight: 700,
                            color: activeCategoryId === category.id ? '#4d148c' : '#374151',
                          }}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '18px' }}>
                    {visibleProducts.map((product, index) => {
                      const setting = productSettingForBranch(product, activeBranchId);
                      return (
                        <article
                          key={product.id}
                          style={{
                            borderRadius: '24px',
                            border: '1px solid #ebeaf5',
                            background: '#fff',
                            overflow: 'hidden',
                            boxShadow: '0 14px 32px rgba(17,24,39,.06)',
                            display: 'grid',
                          }}
                        >
                          <div
                            style={{
                              minHeight: '170px',
                              background: product.image_url ? `center / cover no-repeat url(${product.image_url})` : gradientForIndex(index + 2),
                              padding: '18px',
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                            }}
                          >
                            <span
                              style={{
                                padding: '8px 12px',
                                borderRadius: '999px',
                                background: '#fff',
                                color: '#4d148c',
                                fontSize: '12px',
                                fontWeight: 800,
                              }}
                            >
                              {formatMoney(priceForBranch(product, activeBranchId))}
                            </span>
                            {setting?.stock_qty != null ? (
                              <span style={{ color: '#1f2937', fontSize: '12px', fontWeight: 700, background: 'rgba(255,255,255,.78)', padding: '8px 10px', borderRadius: '999px' }}>
                                Stock {setting.stock_qty}
                              </span>
                            ) : null}
                          </div>
                          <div style={{ padding: '18px', display: 'grid', gap: '12px' }}>
                            <div style={{ display: 'grid', gap: '8px' }}>
                              <strong style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.05rem' }}>{product.name}</strong>
                              <p style={{ margin: 0, color: '#6b7280', lineHeight: 1.6, minHeight: '44px' }}>
                                {product.description || 'Producto disponible en la carta pública.'}
                              </p>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
                              <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 700 }}>
                                {product.modifier_groups.length > 0 ? `${product.modifier_groups.length} grupos de extras` : 'Sin extras'}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setSelectedOptions({});
                                  setProductNotes('');
                                }}
                                style={{
                                  border: 'none',
                                  borderRadius: '14px',
                                  padding: '12px 14px',
                                  background: '#ff6200',
                                  color: '#fff',
                                  fontWeight: 800,
                                }}
                              >
                                Agregar
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>

                <aside style={{ position: 'sticky', top: '92px', display: 'grid', gap: '16px' }}>
                  <div style={{ borderRadius: '26px', background: '#fff', border: '1px solid #ebeaf5', padding: '22px', boxShadow: '0 14px 32px rgba(17,24,39,.06)' }}>
                    <div style={{ display: 'grid', gap: '10px' }}>
                      <strong style={{ fontSize: '1.1rem' }}>Carrito actual</strong>
                      <span style={{ color: '#6b7280', lineHeight: 1.6 }}>
                        Puedes armarlo sin iniciar sesión. El acceso solo se pedirá cuando confirmes tu pedido.
                      </span>
                      <div style={{ display: 'grid', gap: '8px', marginTop: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Items</span>
                          <strong>{publicStore.cartCount}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Subtotal</span>
                          <strong>{formatMoney(publicStore.cartSubtotal)}</strong>
                        </div>
                      </div>
                      <Link
                        to={AppRoutes.public.cart}
                        style={{
                          marginTop: '8px',
                          borderRadius: '16px',
                          padding: '14px 18px',
                          textAlign: 'center',
                          background: '#4d148c',
                          color: '#fff',
                          fontWeight: 800,
                        }}
                      >
                        Ir a carrito
                      </Link>
                    </div>
                  </div>

                  <div style={{ borderRadius: '26px', background: '#fff', border: '1px solid #ebeaf5', padding: '22px', boxShadow: '0 14px 32px rgba(17,24,39,.06)' }}>
                    <div style={{ display: 'grid', gap: '10px' }}>
                      <strong style={{ fontSize: '1.1rem' }}>Cuenta cliente</strong>
                      <span style={{ color: '#6b7280', lineHeight: 1.6 }}>
                        {publicStore.sessionUser
                          ? 'Ya puedes revisar historial, guardar direcciones y seguir el estado de tus pedidos.'
                          : 'Regístrate o inicia sesión para validar tu cuenta y guardar historial.'}
                      </span>
                      <Link
                        to={AppRoutes.public.account}
                        style={{
                          marginTop: '8px',
                          borderRadius: '16px',
                          padding: '14px 18px',
                          textAlign: 'center',
                          background: '#fff6f0',
                          color: '#ff6200',
                          border: '1px solid rgba(255,98,0,.16)',
                          fontWeight: 800,
                        }}
                      >
                        {publicStore.sessionUser ? 'Abrir mi cuenta' : 'Crear cuenta'}
                      </Link>
                    </div>
                  </div>
                </aside>
              </section>
            ) : null}
          </>
        )}
      </div>

      {selectedProduct && activeMerchant && activeBranchId ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.46)',
            zIndex: 120,
            display: 'grid',
            placeItems: 'center',
            padding: '24px',
          }}
        >
          <div
            style={{
              width: 'min(720px, 100%)',
              borderRadius: '28px',
              background: '#fff',
              padding: '24px',
              boxShadow: '0 28px 80px rgba(15,23,42,.24)',
              display: 'grid',
              gap: '18px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'start' }}>
              <div style={{ display: 'grid', gap: '8px' }}>
                <strong style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.4rem' }}>{selectedProduct.name}</strong>
                <span style={{ color: '#6b7280' }}>{selectedProduct.description || 'Configura este producto antes de agregarlo.'}</span>
                <span style={{ color: '#4d148c', fontWeight: 800 }}>{formatMoney(priceForBranch(selectedProduct, activeBranchId))}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                style={{ border: '1px solid #e5e7eb', background: '#fff', borderRadius: '999px', width: '40px', height: '40px', fontSize: '20px' }}
              >
                ×
              </button>
            </div>

            {selectedProduct.modifier_groups.map((group) => (
              <div key={group.id} style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', display: 'grid', gap: '12px' }}>
                <div style={{ display: 'grid', gap: '4px' }}>
                  <strong>{group.name}</strong>
                  <span style={{ color: '#6b7280', fontSize: '13px' }}>
                    {group.is_required ? 'Requerido' : 'Opcional'} · hasta {Math.max(1, group.max_select)} seleccion{Math.max(1, group.max_select) === 1 ? '' : 'es'}
                  </span>
                </div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {group.options.map((option) => {
                    const selected = (selectedOptions[group.id] ?? []).includes(option.id);
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() =>
                          setSelectedOptions((current) => {
                            const currentSelection = current[group.id] ?? [];
                            if (currentSelection.includes(option.id)) {
                              return { ...current, [group.id]: currentSelection.filter((item) => item !== option.id) };
                            }
                            if (currentSelection.length >= Math.max(1, group.max_select)) {
                              return current;
                            }
                            return { ...current, [group.id]: [...currentSelection, option.id] };
                          })
                        }
                        style={{
                          padding: '12px 14px',
                          borderRadius: '16px',
                          border: selected ? '1px solid rgba(77,20,140,.28)' : '1px solid #e5e7eb',
                          background: selected ? '#f4eeff' : '#fff',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span>{option.name}</span>
                        <strong>{option.price_delta > 0 ? `+ ${formatMoney(option.price_delta)}` : 'Incluido'}</strong>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <textarea
              value={productNotes}
              onChange={(event) => setProductNotes(event.target.value)}
              placeholder="Notas para cocina o para tu pedido"
              style={{
                minHeight: '84px',
                resize: 'vertical',
                borderRadius: '18px',
                border: '1px solid #e5e7eb',
                padding: '14px 16px',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                style={{
                  borderRadius: '16px',
                  padding: '14px 18px',
                  border: '1px solid #e5e7eb',
                  background: '#fff',
                  fontWeight: 700,
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={addSelectedProduct}
                style={{
                  borderRadius: '16px',
                  padding: '14px 18px',
                  border: 'none',
                  background: '#ff6200',
                  color: '#fff',
                  fontWeight: 800,
                }}
              >
                Agregar al carrito
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
