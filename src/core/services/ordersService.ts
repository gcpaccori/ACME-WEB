import { supabase } from '../../integrations/supabase/client';
import { OrderDetail, OrderStatus, OrderSummary } from '../types';

export const ordersService = {
  fetchOrders: async (branchId: string, statuses: OrderStatus[] = ['new', 'accepted', 'preparing', 'ready']) => {
    const query = supabase
      .from('orders')
      .select('id, branch_id, status, total, customer_name, payment_method, created_at')
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false });

    if (statuses.length > 0) {
      query.in('status', statuses);
    }

    const result = await query;
    return result;
  },

  fetchOrderDetail: async (orderId: string, branchId: string) => {
    const result = await supabase
      .from('orders')
      .select(
        `id, branch_id, status, total, customer_name, payment_method, delivery_address, phone, created_at, items:order_items(id, product_id, name, quantity, unit_price), status_history:order_status_history(status, changed_at, note)`
      )
      .eq('id', orderId)
      .eq('branch_id', branchId)
      .maybeSingle();

    return result;
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus) => {
    const result = await supabase.from('orders').update({ status }).eq('id', orderId).select();

    if (result.error) {
      return result;
    }

    await supabase.from('order_status_history').insert({ order_id: orderId, status, changed_at: new Date().toISOString() }).then(() => {});

    return result;
  },
};
