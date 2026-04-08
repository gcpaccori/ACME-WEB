import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminPageFrame, SectionCard, StatusPill } from '../../../../components/admin/AdminScaffold';
import { AdminDataTable } from '../../../../components/admin/AdminDataTable';
import { LoadingScreen } from '../../../../components/shared/LoadingScreen';
import { AppRoutes } from '../../../../core/constants/routes';
import { adminService, ProductAdminSummary } from '../../../../core/services/adminService';
import { PortalContext } from '../../../auth/session/PortalContext';

export function ProductsAdminPage() {
  const portal = useContext(PortalContext);
  const merchantId = portal.merchant?.id;
  const [products, setProducts] = useState<ProductAdminSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!merchantId) return;
      setLoading(true);
      const result = await adminService.fetchProducts(merchantId);
      setLoading(false);
      if (result.error) {
        setError(result.error.message);
        return;
      }
      setProducts(result.data ?? []);
    };

    load();
  }, [merchantId]);

  if (!merchantId) {
    return <div>No hay comercio activo para gestionar productos.</div>;
  }

  return (
    <AdminPageFrame
      title="Productos"
      description="Vista base del catalogo con categoria y estado ya relacionados. Cada fila abre el editor compuesto del producto."
      breadcrumbs={[
        { label: 'Admin', to: AppRoutes.portal.admin.root },
        { label: 'Catalogo' },
        { label: 'Productos' },
      ]}
      contextItems={[
        { label: 'Rol', value: portal.staffAssignment?.role || 'sin rol', tone: 'info' },
        { label: 'Comercio', value: portal.merchant?.name || 'sin comercio', tone: 'neutral' },
        { label: 'Entidad', value: 'Producto', tone: 'info' },
        { label: 'Modo', value: 'Consulta', tone: 'success' },
        { label: 'Estado', value: 'Sin cambios', tone: 'success' },
      ]}
      actions={
        <Link
          to={AppRoutes.portal.admin.productNew}
          style={{ padding: '12px 16px', borderRadius: '10px', background: '#111827', color: '#ffffff', fontWeight: 600 }}
        >
          Nuevo producto
        </Link>
      }
    >
      <SectionCard title="Productos del comercio" description="La lista ya resume categoria, precio y estado para entrar a configuracion por local y modificadores.">
        {loading ? (
          <LoadingScreen />
        ) : error ? (
          <div style={{ color: '#b91c1c' }}>{error}</div>
        ) : (
          <AdminDataTable
            rows={products}
            getRowId={(product) => product.id}
            emptyMessage="No hay productos registrados."
            columns={[
              {
                id: 'name',
                header: 'Producto',
                render: (product) => (
                  <div style={{ display: 'grid', gap: '6px' }}>
                    <strong>{product.name}</strong>
                    <span style={{ color: '#6b7280' }}>{product.category_name}</span>
                  </div>
                ),
              },
              {
                id: 'sku',
                header: 'SKU',
                render: (product) => product.sku || 'Sin SKU',
              },
              {
                id: 'price',
                header: 'Precio base',
                render: (product) => `S/ ${product.base_price.toFixed(2)}`,
              },
              {
                id: 'status',
                header: 'Estado',
                render: (product) => <StatusPill label={product.is_active ? 'Activo' : 'Inactivo'} tone={product.is_active ? 'success' : 'warning'} />,
              },
              {
                id: 'action',
                header: 'Accion',
                align: 'right',
                width: '140px',
                render: (product) => (
                  <Link to={`/portal/admin/catalog/products/${product.id}`} style={{ color: '#2563eb', fontWeight: 700 }}>
                    Editar
                  </Link>
                ),
              },
            ]}
          />
        )}
      </SectionCard>
    </AdminPageFrame>
  );
}
