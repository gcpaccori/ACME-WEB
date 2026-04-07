import { useContext, useEffect, useState } from 'react';
import { PortalContext } from '../../../modules/auth/session/PortalContext';
import { menuService } from '../../../core/services/menuService';
import { Product } from '../../../core/types';
import { LoadingScreen } from '../../../components/shared/LoadingScreen';

export function ProductsPage() {
  const portal = useContext(PortalContext);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const merchantId = portal.merchant?.id;

  const loadProducts = async () => {
    if (!merchantId) return;
    setLoading(true);
    const result = await menuService.fetchProducts(merchantId);
    setLoading(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setProducts(result.data ?? []);
  };

  useEffect(() => {
    loadProducts();
  }, [merchantId]);

  const toggleActive = async (product: Product) => {
    const result = await menuService.toggleProductActive(product.id, !product.active);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    await loadProducts();
  };

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      <div>
        <h1>Productos</h1>
        <p style={{ color: '#6b7280' }}>Gestión de productos básicos y estado de publicación.</p>
      </div>
      {loading ? (
        <LoadingScreen />
      ) : error ? (
        <div style={{ color: '#b91c1c' }}>{error}</div>
      ) : products.length === 0 ? (
        <div>No hay productos registrados.</div>
      ) : (
        <div style={{ display: 'grid', gap: '14px' }}>
          {products.map((product) => (
            <div key={product.id} style={{ padding: '18px', borderRadius: '16px', background: '#ffffff', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center' }}>
                <strong>{product.name}</strong>
                <button style={{ padding: '10px 14px' }} onClick={() => toggleActive(product)}>
                  {product.active ? 'Desactivar' : 'Activar'}
                </button>
              </div>
              <div style={{ color: '#6b7280', marginTop: '10px' }}>Precio base: ${product.price.toFixed(2)}</div>
              {product.description && <div style={{ marginTop: '10px' }}>{product.description}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
