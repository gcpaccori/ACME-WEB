import { useContext, useEffect, useMemo, useState } from 'react';
import { PortalContext } from '../../../modules/auth/session/PortalContext';
import { menuService } from '../../../core/services/menuService';
import { Category, Product, ProductBranchSettings } from '../../../core/types';
import { LoadingScreen } from '../../../components/shared/LoadingScreen';

export function MenuPage() {
  const portal = useContext(PortalContext);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branchSettings, setBranchSettings] = useState<ProductBranchSettings[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const merchantId = portal.merchant?.id;
  const branchId = portal.currentBranch?.id;

  useEffect(() => {
    const load = async () => {
      if (!merchantId || !branchId) return;
      setLoading(true);
      const [categoryResult, productResult, settingsResult] = await Promise.all([
        menuService.fetchCategories(merchantId),
        menuService.fetchProducts(merchantId),
        menuService.fetchBranchProductSettings(branchId),
      ]);
      setLoading(false);
      if (categoryResult.error || productResult.error || settingsResult.error) {
        setError(categoryResult.error?.message || productResult.error?.message || settingsResult.error?.message || 'Error al cargar menú');
        return;
      }
      setCategories(categoryResult.data ?? []);
      setProducts(productResult.data ?? []);
      setBranchSettings(settingsResult.data ?? []);
    };

    load();
  }, [merchantId, branchId]);

  const productWithBranchData = useMemo(() => {
    return products.map((product) => {
      const setting = branchSettings.find((item) => item.product_id === product.id);
      return {
        ...product,
        branch_price: setting?.price_override ?? product.price,
        paused: setting?.paused ?? false,
        branchSettingId: setting?.id,
      };
    });
  }, [products, branchSettings]);

  if (!merchantId || !branchId) {
    return <div>Tu sucursal no está disponible para mostrar el menú.</div>;
  }

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <div>
        <h1>Carta / Menú</h1>
        <p style={{ color: '#6b7280' }}>Lista de categorías y productos para esta sucursal.</p>
      </div>
      {loading ? (
        <LoadingScreen />
      ) : error ? (
        <div style={{ color: '#b91c1c' }}>{error}</div>
      ) : (
        <div style={{ display: 'grid', gap: '18px' }}>
          {categories.map((category) => (
            <section key={category.id} style={{ padding: '20px', borderRadius: '18px', background: '#ffffff', border: '1px solid #e5e7eb' }}>
              <h2>{category.name}</h2>
              <div style={{ marginTop: '12px', color: '#6b7280' }}>
                Productos en esta categoría
              </div>
              <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
                {productWithBranchData.filter((product) => product.category_id === category.id).map((product) => (
                  <div key={product.id} style={{ padding: '14px', borderRadius: '14px', background: '#f9fafb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                      <strong>{product.name}</strong>
                      <span>${product.branch_price.toFixed(2)}</span>
                    </div>
                    <div style={{ color: '#6b7280', marginTop: '6px' }}>{product.description || 'Sin descripción'}</div>
                    <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <span>{product.active ? 'Activo' : 'Inactivo'}</span>
                      <span>{product.paused ? 'Pausado en sucursal' : 'Disponible'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
          {categories.length === 0 && <div>No hay categorías registradas para este comercio.</div>}
        </div>
      )}
    </div>
  );
}
