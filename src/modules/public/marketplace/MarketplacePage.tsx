import { useEffect, useMemo, useState } from 'react';
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
    'linear-gradient(135deg, rgba(255,98,0,.18), rgba(255,177,122,.34))',
    'linear-gradient(135deg, rgba(77,20,140,.18), rgba(163,117,255,.28))',
    'linear-gradient(135deg, rgba(22,163,74,.16), rgba(134,239,172,.28))',
    'linear-gradient(135deg, rgba(14,165,233,.16), rgba(125,211,252,.30))',
  ];
  return gradients[index % gradients.length];
}

function productThumb(product: PublicMarketplaceProduct, index: number) {
  return product.image_url
    ? `center / cover no-repeat url(${product.image_url})`
    : gradientForIndex(index);
}

export function MarketplacePage() {
  const publicStore = usePublicStore();
  const [snapshot, setSnapshot] = useState<{ merchants: PublicMarketplaceMerchant[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [activeMerchantId, setActiveMerchantId] = useState<string | null>(null);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState('all');
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
      if (merchants.length > 0) {
        setActiveMerchantId((current) => current ?? merchants[0].id);
        setActiveBranchId((current) => current ?? merchants[0].branches[0]?.id ?? null);
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
        ...merchant.products.map((product) => product.name),
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
    if (!filteredMerchants.length) {
      setActiveMerchantId(null);
      setActiveBranchId(null);
      return;
    }

    if (!activeMerchantId || !filteredMerchants.some((merchant) => merchant.id === activeMerchantId)) {
      setActiveMerchantId(filteredMerchants[0].id);
      setActiveBranchId(filteredMerchants[0].branches[0]?.id ?? null);
      setActiveCategoryId('all');
    }
  }, [activeMerchantId, filteredMerchants]);

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
      return matchesCategory && isProductAvailable(product, activeBranchId);
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
        padding: '104px 20px 56px',
        background:
          'radial-gradient(900px 320px at -10% 0%, rgba(77,20,140,.10), transparent 55%), radial-gradient(820px 360px at 105% 10%, rgba(255,98,0,.10), transparent 55%), #f7f7fb',
      }}
    >
      <div style={{ maxWidth: '1320px', margin: '0 auto', display: 'grid', gap: '24px' }}>
        <section
          style={{
            display: 'grid',
            gap: '14px',
            padding: '22px 24px',
            borderRadius: '28px',
            background: 'rgba(255,255,255,.86)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,.7)',
            boxShadow: '0 18px 42px rgba(17,24,39,.06)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'grid', gap: '4px' }}>
              <strong style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.35rem', color: '#1d1630' }}>Pide ahora</strong>
              <span style={{ color: '#6b7280' }}>Elige un local y abre su carta.</span>
            </div>
            <span
              style={{
                padding: '10px 14px',
                borderRadius: '999px',
                background: '#fff7ed',
                color: '#c2410c',
                fontSize: '13px',
                fontWeight: 800,
              }}
            >
              {filteredMerchants.length} locales
            </span>
          </div>

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar local o plato..."
            style={{
              width: '100%',
              border: '1px solid #ecebf5',
              borderRadius: '18px',
              padding: '14px 16px',
              background: '#fff',
              outline: 'none',
              fontSize: '15px',
            }}
          />
        </section>

        {loading ? (
          <div style={{ padding: '32px', borderRadius: '24px', background: '#fff' }}>Cargando locales...</div>
        ) : error ? (
          <div style={{ padding: '32px', borderRadius: '24px', background: '#fff', color: '#b91c1c' }}>{error}</div>
        ) : (
          <>
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '20px' }}>
              {filteredMerchants.map((merchant, index) => {
                const isActive = merchant.id === activeMerchant?.id;
                const previewProducts = merchant.products.slice(0, 3);

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
                      borderRadius: '28px',
                      border: isActive ? '1px solid rgba(77,20,140,.24)' : '1px solid #ebeaf5',
                      background: isActive ? 'linear-gradient(180deg, #fff, #faf7ff)' : '#fff',
                      boxShadow: isActive ? '0 24px 48px rgba(77,20,140,.12)' : '0 16px 34px rgba(17,24,39,.06)',
                      padding: '18px',
                      display: 'grid',
                      gap: '16px',
                    }}
                  >
                    <div
                      style={{
                        minHeight: '124px',
                        borderRadius: '22px',
                        padding: '18px',
                        background: merchant.logo_url
                          ? `linear-gradient(135deg, rgba(255,255,255,.12), rgba(255,255,255,.02)), center / cover no-repeat url(${merchant.logo_url})`
                          : gradientForIndex(index),
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'space-between',
                        gap: '12px',
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '78%',
                          padding: '10px 12px',
                          borderRadius: '16px',
                          background: 'rgba(255,255,255,.86)',
                          backdropFilter: 'blur(10px)',
                        }}
                      >
                        <strong style={{ display: 'block', fontFamily: "'Poppins', sans-serif", fontSize: '1.05rem', color: '#1d1630' }}>
                          {merchant.trade_name}
                        </strong>
                        <span style={{ fontSize: '13px', color: '#6b7280' }}>
                          {merchant.branches[0]?.district || 'Huancayo'}
                        </span>
                      </div>

                      <span
                        style={{
                          minWidth: '42px',
                          height: '42px',
                          borderRadius: '14px',
                          background: '#fff',
                          color: '#4d148c',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 900,
                          fontSize: '18px',
                          boxShadow: '0 10px 20px rgba(15,23,42,.10)',
                        }}
                      >
                        {merchant.products.length}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
                      {previewProducts.map((product, previewIndex) => (
                        <div key={product.id} style={{ display: 'grid', gap: '8px' }}>
                          <div
                            style={{
                              aspectRatio: '1 / 1',
                              borderRadius: '18px',
                              background: productThumb(product, previewIndex + index),
                              boxShadow: 'inset 0 -40px 60px rgba(17,24,39,.08)',
                            }}
                          />
                          <span
                            style={{
                              fontSize: '12px',
                              color: '#4b5563',
                              lineHeight: 1.3,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {product.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </section>

            {filteredMerchants.length === 0 ? (
              <div
                style={{
                  padding: '36px',
                  borderRadius: '28px',
                  background: '#fff',
                  color: '#6b7280',
                  textAlign: 'center',
                  boxShadow: '0 16px 34px rgba(17,24,39,.06)',
                }}
              >
                No encontramos locales o platos con esa búsqueda.
              </div>
            ) : null}

            {activeMerchant ? (
              <section
                style={{
                  display: 'grid',
                  gap: '18px',
                  padding: '22px',
                  borderRadius: '30px',
                  background: '#fff',
                  boxShadow: '0 18px 42px rgba(17,24,39,.07)',
                }}
              >
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ display: 'grid', gap: '4px' }}>
                      <h2 style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontSize: '1.8rem', color: '#1d1630' }}>
                        {activeMerchant.trade_name}
                      </h2>
                      <span style={{ color: '#6b7280' }}>
                        {activeBranchId
                          ? activeMerchant.branches.find((branch) => branch.id === activeBranchId)?.address_label ||
                            activeMerchant.branches.find((branch) => branch.id === activeBranchId)?.district ||
                            'Carta disponible'
                          : 'Carta disponible'}
                      </span>
                    </div>

                    {activeMerchant.branches.length > 1 ? (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {activeMerchant.branches.map((branch) => {
                          const branchActive = branch.id === activeBranchId;
                          return (
                            <button
                              key={branch.id}
                              type="button"
                              onClick={() => setActiveBranchId(branch.id)}
                              style={{
                                padding: '10px 14px',
                                borderRadius: '999px',
                                border: branchActive ? '1px solid rgba(77,20,140,.22)' : '1px solid #e5e7eb',
                                background: branchActive ? '#f4eeff' : '#fff',
                                color: branchActive ? '#4d148c' : '#374151',
                                fontWeight: 700,
                              }}
                            >
                              {branch.name}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
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
                        color: activeCategoryId === 'all' ? '#4d148c' : '#374151',
                        fontWeight: 700,
                      }}
                    >
                      Todo
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
                          color: activeCategoryId === category.id ? '#4d148c' : '#374151',
                          fontWeight: 700,
                        }}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
                  {visibleProducts.map((product, index) => {
                    const setting = productSettingForBranch(product, activeBranchId);
                    return (
                      <article
                        key={product.id}
                        style={{
                          borderRadius: '24px',
                          overflow: 'hidden',
                          background: '#fff',
                          border: '1px solid #ecebf5',
                          boxShadow: '0 12px 28px rgba(17,24,39,.06)',
                        }}
                      >
                        <div
                          style={{
                            aspectRatio: '1 / 1',
                            background: productThumb(product, index + 4),
                            padding: '14px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span
                            style={{
                              padding: '8px 12px',
                              borderRadius: '999px',
                              background: 'rgba(255,255,255,.92)',
                              color: '#4d148c',
                              fontSize: '12px',
                              fontWeight: 800,
                            }}
                          >
                            {formatMoney(priceForBranch(product, activeBranchId))}
                          </span>
                          {setting?.stock_qty != null ? (
                            <span
                              style={{
                                padding: '8px 10px',
                                borderRadius: '999px',
                                background: 'rgba(255,255,255,.92)',
                                color: '#374151',
                                fontSize: '12px',
                                fontWeight: 700,
                              }}
                            >
                              {setting.stock_qty}
                            </span>
                          ) : null}
                        </div>

                        <div style={{ padding: '16px', display: 'grid', gap: '10px' }}>
                          <div style={{ display: 'grid', gap: '6px' }}>
                            <strong style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1rem', color: '#1d1630' }}>{product.name}</strong>
                            <span
                              style={{
                                color: '#6b7280',
                                fontSize: '14px',
                                lineHeight: 1.5,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                minHeight: '42px',
                              }}
                            >
                              {product.description || 'Disponible para pedir ahora.'}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProduct(product);
                              setSelectedOptions({});
                              setProductNotes('');
                            }}
                            style={{
                              border: 'none',
                              borderRadius: '16px',
                              padding: '12px 14px',
                              background: '#ff6200',
                              color: '#fff',
                              fontWeight: 800,
                            }}
                          >
                            Agregar
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
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
                    {group.is_required ? 'Requerido' : 'Opcional'} · hasta {Math.max(1, group.max_select)} selección{Math.max(1, group.max_select) === 1 ? '' : 'es'}
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
