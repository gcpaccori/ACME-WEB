export type AdminOrderStatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const ORDER_STATUS_META: Record<
  string,
  {
    label: string;
    tone: AdminOrderStatusTone;
    next: string[];
  }
> = {
  placed: {
    label: 'Recibido',
    tone: 'info',
    next: ['confirmed', 'cancelled'],
  },
  confirmed: {
    label: 'Confirmado',
    tone: 'info',
    next: ['preparing', 'cancelled'],
  },
  accepted: {
    label: 'Aceptado',
    tone: 'info',
    next: ['preparing', 'cancelled'],
  },
  preparing: {
    label: 'En preparacion',
    tone: 'warning',
    next: ['ready', 'cancelled'],
  },
  ready: {
    label: 'Listo',
    tone: 'success',
    next: ['on_the_way', 'delivered'],
  },
  on_the_way: {
    label: 'En camino',
    tone: 'warning',
    next: ['delivered'],
  },
  delivered: {
    label: 'Entregado',
    tone: 'success',
    next: [],
  },
  cancelled: {
    label: 'Cancelado',
    tone: 'danger',
    next: [],
  },
  rejected: {
    label: 'Rechazado',
    tone: 'danger',
    next: [],
  },
  pending: {
    label: 'Pendiente',
    tone: 'warning',
    next: ['confirmed', 'cancelled'],
  },
};

export function normalizeAdminOrderStatus(status: string) {
  const normalized = String(status || '').trim().toLowerCase();

  if (normalized === 'new' || normalized === 'created') return 'placed';
  if (normalized === 'accepted') return 'confirmed';
  if (normalized === 'completed') return 'delivered';
  if (normalized === 'canceled') return 'cancelled';
  return normalized || 'placed';
}

export function getAdminOrderStatusLabel(status: string) {
  const normalized = normalizeAdminOrderStatus(status);
  return ORDER_STATUS_META[normalized]?.label || normalized || 'Sin estado';
}

export function getAdminOrderStatusTone(status: string): AdminOrderStatusTone {
  const normalized = normalizeAdminOrderStatus(status);
  return ORDER_STATUS_META[normalized]?.tone || 'neutral';
}

export function getAdminOrderNextStatuses(status: string) {
  const normalized = normalizeAdminOrderStatus(status);
  return ORDER_STATUS_META[normalized]?.next ?? [];
}
