import { useContext, useEffect, useState } from 'react';
import { PortalContext } from '../../../modules/auth/session/PortalContext';
import { menuService } from '../../../core/services/menuService';
import { Category } from '../../../core/types';
import { LoadingScreen } from '../../../components/shared/LoadingScreen';

export function CategoriesPage() {
  const portal = useContext(PortalContext);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const merchantId = portal.merchant?.id;

  useEffect(() => {
    const load = async () => {
      if (!merchantId) return;
      setLoading(true);
      const result = await menuService.fetchCategories(merchantId);
      setLoading(false);
      if (result.error) {
        setError(result.error.message);
        return;
      }
      setCategories(result.data ?? []);
    };

    load();
  }, [merchantId]);

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      <div>
        <h1>Categorías</h1>
        <p style={{ color: '#6b7280' }}>Administración básica de categorías del menú.</p>
      </div>
      {loading ? (
        <LoadingScreen />
      ) : error ? (
        <div style={{ color: '#b91c1c' }}>{error}</div>
      ) : categories.length === 0 ? (
        <div>No hay categorías registradas.</div>
      ) : (
        <div style={{ display: 'grid', gap: '14px' }}>
          {categories.map((category) => (
            <div key={category.id} style={{ padding: '18px', borderRadius: '16px', background: '#ffffff', border: '1px solid #e5e7eb' }}>
              <strong>{category.name}</strong>
              <div style={{ color: '#6b7280', marginTop: '8px' }}>ID: {category.id}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
