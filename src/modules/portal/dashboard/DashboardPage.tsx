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
    <div style={{ display: 'grid', gap: '32px' }}>
      <div style={{ display: 'grid', gap: '8px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>Dashboard</h1>
        <p style={{ margin: 0, color: 'var(--acme-text-muted)', fontSize: '15px' }}>
          Resumen operativo de la sucursal <span style={{ color: 'var(--acme-purple)', fontWeight: 700 }}>{portal.currentBranch.name}</span>
        </p>
      </div>

      <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <div style={{ padding: '24px', background: 'var(--acme-surface)', borderRadius: 'var(--acme-radius-lg)', border: '1px solid var(--acme-border)', boxShadow: 'var(--acme-shadow-sm)' }}>
          <div style={{ color: 'var(--acme-text-muted)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pedidos nuevos</div>
          <div style={{ marginTop: '12px', fontSize: '32px', fontWeight: 800, color: 'var(--acme-purple)' }}>{summary.new}</div>
        </div>
        <div style={{ padding: '24px', background: 'var(--acme-surface)', borderRadius: 'var(--acme-radius-lg)', border: '1px solid var(--acme-border)', boxShadow: 'var(--acme-shadow-sm)' }}>
          <div style={{ color: 'var(--acme-text-muted)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>En preparación</div>
          <div style={{ marginTop: '12px', fontSize: '32px', fontWeight: 800, color: 'var(--acme-orange)' }}>{summary.preparing}</div>
        </div>
        <div style={{ padding: '24px', background: 'var(--acme-surface)', borderRadius: 'var(--acme-radius-lg)', border: '1px solid var(--acme-border)', boxShadow: 'var(--acme-shadow-sm)' }}>
          <div style={{ color: 'var(--acme-text-muted)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Listos para entrega</div>
          <div style={{ marginTop: '12px', fontSize: '32px', fontWeight: 800, color: '#10b981' }}>{summary.ready}</div>
        </div>
      </div>

      <div style={{ padding: '28px', background: 'var(--acme-surface)', borderRadius: 'var(--acme-radius-lg)', border: '1px solid var(--acme-border)', boxShadow: 'var(--acme-shadow-md)' }}>
        <h2 style={{ margin: '0 0 24px', fontSize: '18px', fontWeight: 700 }}>Pedidos recientes</h2>
        {loading ? (
          <LoadingScreen />
        ) : error ? (
          <div style={{ color: '#ef4444', padding: '16px', borderRadius: '12px', background: '#fef2f2', border: '1px solid #fee2e2' }}>{error}</div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--acme-text-muted)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📦</div>
            No hay pedidos recientes para esta sucursal.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} style={{ padding: '16px', borderRadius: '12px', background: 'var(--acme-surface-muted)', border: '1px solid var(--acme-border)', transition: 'transform 0.2s ease', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--acme-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', border: '1px solid var(--acme-border)' }}>
                      👤
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '15px' }}>{order.customer_name || 'Cliente'}</div>
                      <div style={{ color: 'var(--acme-text-muted)', fontSize: '13px', textTransform: 'capitalize' }}>{order.status}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--acme-purple)' }}>${order.total.toFixed(2)}</div>
                    <div style={{ color: 'var(--acme-text-muted)', fontSize: '11px' }}>Hace un momento</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
