import { useEffect, useMemo, useState } from 'react';
import { publicMarketplaceService, PublicMarketplaceMerchant, PublicMarketplaceProduct } from '../../../core/services/publicMarketplaceService';
import { usePublicStore } from '../store/PublicStoreContext';
import './MarketplacePage.css';

/* ─────────── helpers ─────────── */

function formatMoney(value: number, currency = 'PEN') {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency, minimumFractionDigits: 2 }).format(value);
}

function productSettingForBranch(product: PublicMarketplaceProduct, branchId: string | null) {
  if (!branchId) return null;
  return product.settings.find((s) => s.branch_id === branchId) ?? null;
}

function isProductAvailable(product: PublicMarketplaceProduct, branchId: string | null) {
  const s = productSettingForBranch(product, branchId);
  if (!s) return true;
  return s.is_available && !s.is_paused;
}

function priceForBranch(product: PublicMarketplaceProduct, branchId: string | null) {
  const s = productSettingForBranch(product, branchId);
  return s?.price ?? product.base_price;
}

const GRADIENTS = [
  'linear-gradient(135deg, rgba(255,98,0,.22), rgba(255,177,122,.38))',
  'linear-gradient(135deg, rgba(77,20,140,.22), rgba(163,117,255,.32))',
  'linear-gradient(135deg, rgba(22,163,74,.18), rgba(134,239,172,.32))',
  'linear-gradient(135deg, rgba(14,165,233,.18), rgba(125,211,252,.34))',
  'linear-gradient(135deg, rgba(234,88,12,.18), rgba(253,186,116,.32))',
  'linear-gradient(135deg, rgba(124,58,237,.18), rgba(196,181,253,.32))',
];

function gradientFor(idx: number) { return GRADIENTS[idx % GRADIENTS.length]; }

function thumbStyle(imgUrl: string | null | undefined, idx: number): React.CSSProperties {
  return imgUrl
    ? { background: `center / cover no-repeat url(${imgUrl})` }
    : { background: gradientFor(idx) };
}

/* ─────────── sub-components ─────────── */

function SkeletonCards() {
  return (
    <div className="mp-skeleton-grid">
      {[0,1,2].map((i) => (
        <div key={i} className="mp-skeleton-card">
          <div className="mp-skeleton-thumb" />
          <div className="mp-skeleton-line" />
          <div className="mp-skeleton-line mp-skeleton-line--short" />
          <div className="mp-skeleton-strip">
            <div className="mp-skeleton-mini" />
            <div className="mp-skeleton-mini" />
            <div className="mp-skeleton-mini" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────── main component ─────────── */

export function MarketplacePage() {
  const publicStore = usePublicStore();
  const [snapshot, setSnapshot] = useState<{ merchants: PublicMarketplaceMerchant[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [query, setQuery]   = useState('');
  const [activeMerchantId, setActiveMerchantId] = useState<string | null>(null);
  const [activeBranchId,   setActiveBranchId]   = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const [selectedProduct,  setSelectedProduct]  = useState<PublicMarketplaceProduct | null>(null);
  const [selectedOptions,  setSelectedOptions]  = useState<Record<string, string[]>>({});
  const [productNotes,     setProductNotes]     = useState('');
  const [justAdded,        setJustAdded]        = useState(false);

  /* load */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const result = await publicMarketplaceService.fetchSnapshot();
      setLoading(false);

      if (result.error) { setError(result.error.message); return; }

      const merchants = result.data?.merchants ?? [];
      setSnapshot({ merchants });
      if (merchants.length > 0) {
        setActiveMerchantId((c) => c ?? merchants[0].id);
        setActiveBranchId((c)   => c ?? merchants[0].branches[0]?.id ?? null);
      }
    };
    load();
  }, []);

  const merchants = snapshot?.merchants ?? [];

  const filteredMerchants = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return merchants;
    return merchants.filter((m) => {
      const hay = [m.trade_name, ...m.branches.map((b) => `${b.name} ${b.district} ${b.city}`), ...m.products.map((p) => p.name)].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [merchants, query]);

  const activeMerchant = filteredMerchants.find((m) => m.id === activeMerchantId) ?? filteredMerchants[0] ?? null;

  useEffect(() => {
    if (!filteredMerchants.length) { setActiveMerchantId(null); setActiveBranchId(null); return; }
    if (!activeMerchantId || !filteredMerchants.some((m) => m.id === activeMerchantId)) {
      setActiveMerchantId(filteredMerchants[0].id);
      setActiveBranchId(filteredMerchants[0].branches[0]?.id ?? null);
      setActiveCategoryId('all');
    }
  }, [activeMerchantId, filteredMerchants]);

  useEffect(() => {
    if (!activeMerchant) return;
    if (!activeBranchId || !activeMerchant.branches.some((b) => b.id === activeBranchId)) {
      setActiveBranchId(activeMerchant.branches[0]?.id ?? null);
    }
  }, [activeBranchId, activeMerchant]);

  const visibleProducts = useMemo(() => {
    if (!activeMerchant) return [];
    return activeMerchant.products.filter((p) => {
      const matchesCat = activeCategoryId === 'all' || p.category_id === activeCategoryId;
      return matchesCat && isProductAvailable(p, activeBranchId);
    });
  }, [activeBranchId, activeCategoryId, activeMerchant]);

  /* add to cart */
  const addSelectedProduct = () => {
    if (!selectedProduct || !activeMerchant || !activeBranchId) return;
    const modifiers = selectedProduct.modifier_groups.flatMap((g) =>
      (selectedOptions[g.id] ?? [])
        .map((oId) => g.options.find((o) => o.id === oId))
        .filter(Boolean)
        .map((o) => ({ id: o!.id, option_id: o!.id, group_id: g.id, name: o!.name, price_delta: o!.price_delta, quantity: 1 }))
    );
    publicStore.addItem({
      merchant_id:          activeMerchant.id,
      merchant_name:        activeMerchant.trade_name,
      branch_id:            activeBranchId,
      branch_name:          activeMerchant.branches.find((b) => b.id === activeBranchId)?.name || 'Sucursal',
      product_id:           selectedProduct.id,
      product_name:         selectedProduct.name,
      product_description:  selectedProduct.description,
      image_url:            selectedProduct.image_url,
      unit_price:           priceForBranch(selectedProduct, activeBranchId),
      quantity:             1,
      notes:                productNotes.trim(),
      modifiers,
    });
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
      setSelectedProduct(null);
      setSelectedOptions({});
      setProductNotes('');
    }, 900);
  };

  /* toggle modifier option */
  const toggleOption = (groupId: string, optionId: string, maxSelect: number) => {
    setSelectedOptions((cur) => {
      const sel = cur[groupId] ?? [];
      if (sel.includes(optionId)) return { ...cur, [groupId]: sel.filter((x) => x !== optionId) };
      if (sel.length >= Math.max(1, maxSelect)) return cur;
      return { ...cur, [groupId]: [...sel, optionId] };
    });
  };

  /* address label */
  const branchAddressLabel = (merchantObj: typeof activeMerchant) => {
    if (!merchantObj || !activeBranchId) return 'Carta disponible';
    const b = merchantObj.branches.find((x) => x.id === activeBranchId);
    return b?.address_label || b?.district || 'Carta disponible';
  };

  /* ────────── render ────────── */
  return (
    <section className="mp-page">
      <div className="mp-wrapper">

        {/* ── Hero Search ── */}
        <div className="mp-hero">
          <div className="mp-hero__top">
            <div className="mp-hero__heading">
              <h1 className="mp-hero__title">Pide ahora 🛵</h1>
              <p className="mp-hero__subtitle">Elige un local, explora su carta y agrega al carrito.</p>
            </div>
            <span className="mp-hero__badge">
              <span className="mp-hero__badge-dot" />
              {filteredMerchants.length} local{filteredMerchants.length !== 1 ? 'es' : ''}
            </span>
          </div>

          <div className="mp-search-wrap">
            <span className="mp-search-icon">
              {/* Search SVG */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </span>
            <input
              id="mp-search-input"
              className="mp-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar local, plato..."
            />
          </div>
        </div>

        {/* ── Loading / Error / Content ── */}
        {loading ? (
          <SkeletonCards />
        ) : error ? (
          <div className="mp-error">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        ) : (
          <>
            {/* Merchant cards */}
            <div className="mp-merchants">
              {filteredMerchants.map((merchant, idx) => {
                const isActive      = merchant.id === activeMerchant?.id;
                const previewProds  = merchant.products.slice(0, 3);
                return (
                  <button
                    key={merchant.id}
                    type="button"
                    id={`mp-merchant-${merchant.id}`}
                    className={`mp-merchant-card${isActive ? ' mp-merchant-card--active' : ''}`}
                    onClick={() => {
                      setActiveMerchantId(merchant.id);
                      setActiveBranchId(merchant.branches[0]?.id ?? null);
                      setActiveCategoryId('all');
                    }}
                  >
                    {/* Banner */}
                    <div
                      className="mp-merchant-banner"
                      style={merchant.logo_url
                        ? { backgroundImage: `url(${merchant.logo_url})` }
                        : { background: gradientFor(idx) }}
                    >
                      <div className="mp-merchant-nameplate">
                        <strong>{merchant.trade_name}</strong>
                        <span>{merchant.branches[0]?.district || 'Huancayo'}</span>
                      </div>
                      <span className="mp-merchant-count" title="Productos disponibles">
                        {merchant.products.length}
                      </span>
                    </div>

                    {/* Preview strip */}
                    {previewProds.length > 0 && (
                      <div className="mp-merchant-preview">
                        {previewProds.map((product, pi) => (
                          <div key={product.id} className="mp-preview-item">
                            <div className="mp-preview-thumb" style={thumbStyle(product.image_url, pi + idx)} />
                            <span className="mp-preview-label">{product.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Empty search */}
            {filteredMerchants.length === 0 && (
              <div className="mp-empty">
                <div className="mp-empty-icon">🔍</div>
                <p>No encontramos locales o platos con <strong>"{query}"</strong></p>
              </div>
            )}

            {/* ── Active Merchant Menu ── */}
            {activeMerchant && (
              <section className="mp-menu" id="mp-active-menu">
                {/* Header */}
                <div className="mp-menu-header">
                  <div>
                    <h2 className="mp-menu-title">{activeMerchant.trade_name}</h2>
                    <p className="mp-menu-address">
                      📍 {branchAddressLabel(activeMerchant)}
                    </p>
                  </div>
                  {activeMerchant.branches.length > 1 && (
                    <div className="mp-branch-tabs">
                      {activeMerchant.branches.map((branch) => (
                        <button
                          key={branch.id}
                          type="button"
                          id={`mp-branch-${branch.id}`}
                          className={`mp-branch-btn${branch.id === activeBranchId ? ' mp-branch-btn--active' : ''}`}
                          onClick={() => setActiveBranchId(branch.id)}
                        >
                          {branch.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Category chips */}
                <div className="mp-cats" role="tablist" aria-label="Categorías">
                  <button
                    type="button"
                    role="tab"
                    id="mp-cat-all"
                    aria-selected={activeCategoryId === 'all'}
                    className={`mp-cat-btn${activeCategoryId === 'all' ? ' mp-cat-btn--active' : ''}`}
                    onClick={() => setActiveCategoryId('all')}
                  >
                    Todo
                  </button>
                  {activeMerchant.categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      role="tab"
                      id={`mp-cat-${cat.id}`}
                      aria-selected={activeCategoryId === cat.id}
                      className={`mp-cat-btn${activeCategoryId === cat.id ? ' mp-cat-btn--active' : ''}`}
                      onClick={() => setActiveCategoryId(cat.id)}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {/* Products */}
                {visibleProducts.length === 0 ? (
                  <div className="mp-empty">
                    <div className="mp-empty-icon">🍽️</div>
                    <p>Sin productos disponibles en esta categoría.</p>
                  </div>
                ) : (
                  <div className="mp-products">
                    {visibleProducts.map((product, pi) => {
                      const setting = productSettingForBranch(product, activeBranchId);
                      return (
                        <article key={product.id} className="mp-prod-card">
                          {/* Thumbnail */}
                          <div className="mp-prod-thumb" style={thumbStyle(product.image_url, pi + 4)}>
                            <div className="mp-prod-thumb-overlay" />
                            <div className="mp-prod-badges">
                              <span className="mp-prod-price">
                                {formatMoney(priceForBranch(product, activeBranchId))}
                              </span>
                              {setting?.stock_qty != null && (
                                <span className="mp-prod-stock">
                                  {setting.stock_qty} und.
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Body */}
                          <div className="mp-prod-body">
                            <strong className="mp-prod-name">{product.name}</strong>
                            <p className="mp-prod-desc">
                              {product.description || 'Disponible para pedir ahora.'}
                            </p>
                            <button
                              id={`mp-add-${product.id}`}
                              type="button"
                              className="mp-add-btn"
                              onClick={() => {
                                setSelectedProduct(product);
                                setSelectedOptions({});
                                setProductNotes('');
                              }}
                            >
                              {/* plus icon */}
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                              </svg>
                              Agregar
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>

      {/* ════════════════════════════════════════
          PRODUCT MODAL
      ════════════════════════════════════════ */}
      {selectedProduct && activeMerchant && activeBranchId && (
        <div
          className="mp-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`Configurar ${selectedProduct.name}`}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedProduct(null); }}
        >
          <div className="mp-modal">
            {/* Optional product image */}
            {selectedProduct.image_url && (
              <div
                className="mp-modal-img-placeholder"
                style={{ backgroundImage: `url(${selectedProduct.image_url})` }}
              />
            )}

            <div className="mp-modal-body">
              {/* Header */}
              <div className="mp-modal-header">
                <div className="mp-modal-info">
                  <h3 className="mp-modal-name">{selectedProduct.name}</h3>
                  {selectedProduct.description && (
                    <p className="mp-modal-desc">{selectedProduct.description}</p>
                  )}
                  <span className="mp-modal-price">
                    💰 {formatMoney(priceForBranch(selectedProduct, activeBranchId))}
                  </span>
                </div>
                <button
                  type="button"
                  id="mp-modal-close"
                  className="mp-modal-close"
                  onClick={() => setSelectedProduct(null)}
                  aria-label="Cerrar"
                >
                  ×
                </button>
              </div>

              {/* Modifier groups */}
              {selectedProduct.modifier_groups.map((group) => (
                <div key={group.id} className="mp-modifier">
                  <div className="mp-modifier-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span className="mp-modifier-name">{group.name}</span>
                      <span className={group.is_required ? 'mp-modifier-required' : 'mp-modifier-optional'}>
                        {group.is_required ? 'Requerido' : 'Opcional'}
                      </span>
                    </div>
                    <p className="mp-modifier-meta">
                      Elige hasta {Math.max(1, group.max_select)} opción{Math.max(1, group.max_select) !== 1 ? 'es' : ''}
                    </p>
                  </div>
                  <div className="mp-options">
                    {group.options.map((option) => {
                      const sel = (selectedOptions[group.id] ?? []).includes(option.id);
                      return (
                        <button
                          key={option.id}
                          type="button"
                          id={`mp-opt-${option.id}`}
                          className={`mp-option-btn${sel ? ' mp-option-btn--selected' : ''}`}
                          onClick={() => toggleOption(group.id, option.id, group.max_select)}
                        >
                          <span>{option.name}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <strong style={{ fontSize: '13px' }}>
                              {option.price_delta > 0 ? `+${formatMoney(option.price_delta)}` : 'Incluido'}
                            </strong>
                            <span className="mp-option-check">
                              {sel && (
                                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="2,6 5,9 10,3"/>
                                </svg>
                              )}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Notes */}
              <textarea
                id="mp-notes"
                className="mp-notes"
                value={productNotes}
                onChange={(e) => setProductNotes(e.target.value)}
                placeholder="✏️  Notas para cocina (sin picante, aparte la salsa…)"
              />

              {/* Footer */}
              <div className="mp-modal-footer">
                <button
                  type="button"
                  id="mp-modal-cancel"
                  className="mp-cancel-btn"
                  onClick={() => setSelectedProduct(null)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  id="mp-modal-confirm"
                  className="mp-confirm-btn"
                  onClick={addSelectedProduct}
                  disabled={justAdded}
                >
                  {justAdded ? (
                    <>
                      {/* checkmark */}
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      ¡Agregado!
                    </>
                  ) : (
                    <>
                      {/* cart icon */}
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                      </svg>
                      Agregar al carrito
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
