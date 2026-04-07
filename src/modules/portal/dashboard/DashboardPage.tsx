import { useContext, useEffect, useMemo, useState } from 'react';
import { PortalContext } from '../../../modules/auth/session/PortalContext';
import { ordersService } from '../../../core/services';
import { OrderSummary } from '../../../core/types';
import { LoadingScreen } from '../../../components/shared/LoadingScreen';

export function DashboardPage() {
  const portal = useContext(PortalContext);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!portal.currentBranch) {
        return;
      }
      setLoading(true);
      const result = await ordersService.fetchOrders(portal.currentBranch.id, ['new', 'accepted', 'preparing', 'ready']);
      setLoading(false);
      if (result.error) {
        setError(result.error.message);
        return;
      }
      setOrders(result.data ?? []);
    };

    load();
  }, [portal.currentBranch]);

  const summary = useMemo(() => {
    const counts = {
      new: 0,
      accepted: 0,
      preparing: 0,
      ready: 0,
    } as Record<string, number>;

    orders.forEach((order) => {
      counts[order.status] = (counts[order.status] ?? 0) + 1;
    });

    return counts;
  }, [orders]);

  if (!portal.currentBranch) {
    return <div>Selecciona una sucursal con acceso para ver el dashboard.</div>;
  }

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <div>
        <h1>Dashboard</h1>
        <p style={{ color: '#6b7280' }}>Resumen operativo de la sucursal {portal.currentBranch.name}.</p>
      </div>
      <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div style={{ padding: '20px', background: '#ffffff', borderRadius: '18px', border: '1px solid #e5e7eb' }}>
          <strong>Pedidos nuevos</strong>
          <div style={{ marginTop: '12px', fontSize: '28px' }}>{summary.new}</div>
        </div>
        <div style={{ padding: '20px', background: '#ffffff', borderRadius: '18px', border: '1px solid #e5e7eb' }}>
          <strong>En preparación</strong>
          <div style={{ marginTop: '12px', fontSize: '28px' }}>{summary.preparing}</div>
        </div>
        <div style={{ padding: '20px', background: '#ffffff', borderRadius: '18px', border: '1px solid #e5e7eb' }}>
          <strong>Listos</strong>
          <div style={{ marginTop: '12px', fontSize: '28px' }}>{summary.ready}</div>
        </div>
      </div>
      <div style={{ padding: '20px', background: '#ffffff', borderRadius: '18px', border: '1px solid #e5e7eb' }}>
        <h2>Pedidos recientes</h2>
        {loading ? (
          <LoadingScreen />
        ) : error ? (
          <div style={{ color: '#b91c1c' }}>{error}</div>
        ) : orders.length === 0 ? (
          <div>No hay pedidos recientes para esta sucursal.</div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} style={{ padding: '16px', borderRadius: '14px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <strong>{order.customer_name || 'Cliente'}</strong>
                    <div style={{ color: '#6b7280' }}>{order.status}</div>
                  </div>
                  <div style={{ fontWeight: 700 }}>${order.total.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
