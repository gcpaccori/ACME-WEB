import { OrderStatus } from '../types';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Nuevo',
  accepted: 'Aceptado',
  preparing: 'En preparación',
  ready: 'Listo',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
  delivered: 'Entregado',
};

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new: ['accepted', 'rejected'],
  accepted: ['preparing', 'rejected'],
  preparing: ['ready', 'cancelled'],
  ready: [],
  rejected: [],
  cancelled: [],
  delivered: [],
};
