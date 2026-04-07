import { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppRoutes } from '../../../core/constants/routes';
import { PortalContext } from '../../../modules/auth/session/PortalContext';
import { ordersService } from '../../../core/services/ordersService';
import { OrderSummary, OrderStatus } from '../../../core/types';
import { LoadingScreen } from '../../../components/shared/LoadingScreen';
import { ORDER_STATUS_LABELS, ORDER_STATUS_TRANSITIONS } from '../../../core/utils/orderStatus';

const statuses: OrderStatus[] = ['new', 'accepted', 'preparing', 'ready'];

export function OrdersPage() {
  const portal = useContext(PortalContext);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentBranchId = portal.currentBranch?.id;

  const loadOrders = async () => {
    if (!currentBranchId) return;
    setLoading(true);
    const result = await ordersService.fetchOrders(currentBranchId, statuses);
    setLoading(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setOrders(result.data ?? []);
  };

  useEffect(() => {
    loadOrders();
  }, [currentBranchId]);

  const filteredOrders = useMemo(() => {
    return filter === 'all' ? orders : orders.filter((order) => order.status === filter);
  }, [filter, orders]);

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    setActionLoading(orderId);
    const result = await ordersService.updateOrderStatus(orderId, status);
    setActionLoading(null);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    await loadOrders();
  };

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <div>
        <h1>Pedidos</h1>
        <p style={{ color: '#6b7280' }}>Lista de pedidos asignados a tu sucursal.</p>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button onClick={() => setFilter('all')} style={{ padding: '10px 16px' }}>Todos</button>
        {statuses.map((status) => (
          <button key={status} onClick={() => setFilter(status)} style={{ padding: '10px 16px' }}>
            {ORDER_STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingScreen />
      ) : error ? (
        <div style={{ color: '#b91c1c' }}>{error}</div>
      ) : filteredOrders.length === 0 ? (
        <div>No hay pedidos con el filtro seleccionado.</div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredOrders.map((order) => (
            <div key={order.id} style={{ padding: '20px', borderRadius: '18px', background: '#ffffff', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '18px' }}>Pedido #{order.id}</div>
                  <div style={{ color: '#6b7280' }}>{ORDER_STATUS_LABELS[order.status]}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div>Total: ${order.total.toFixed(2)}</div>
                  <div>{order.payment_method || 'Método no especificado'}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gap: '10px', marginTop: '16px' }}>
                <div>Cliente: {order.customer_name || 'Desconocido'}</div>
                <Link to={`${AppRoutes.portal.orders}/${order.id}`} style={{ color: '#2563eb' }}>
                  Ver detalle
                </Link>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {ORDER_STATUS_TRANSITIONS[order.status]?.map((nextStatus) => (
                    <button
                      key={nextStatus}
                      disabled={actionLoading === order.id}
                      onClick={() => handleStatusChange(order.id, nextStatus)}
                      style={{ padding: '10px 14px' }}
                    >
                      Marcar como {ORDER_STATUS_LABELS[nextStatus]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
