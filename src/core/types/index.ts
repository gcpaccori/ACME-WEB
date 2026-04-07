export type OrderStatus = 'new' | 'accepted' | 'preparing' | 'ready' | 'rejected' | 'cancelled' | 'delivered';

export interface UserProfile {
  id: string;
  full_name: string | null;
  email?: string;
  phone?: string;
}

export interface MerchantBranch {
  id: string;
  name: string;
  slug?: string;
  is_open?: boolean;
  accepting_orders?: boolean;
  address?: string;
  merchant_id?: string;
}

export interface Merchant {
  id: string;
  name: string;
  slug?: string;
  active?: boolean;
}

export interface MerchantStaffBranchRelation {
  id: string;
  branch_id: string;
  merchant_staff_id: string;
  role?: string;
  merchant_branch?: MerchantBranch;
}

export interface MerchantStaff {
  id: string;
  user_id: string;
  merchant_id: string;
  role: string;
  merchant?: Merchant;
  branches?: MerchantStaffBranchRelation[];
}

export interface PortalContextState {
  sessionUserId: string | null;
  profile: UserProfile | null;
  staffAssignment: MerchantStaff | null;
  merchant: Merchant | null;
  branches: MerchantBranch[];
  currentBranch: MerchantBranch | null;
  permissions: {
    canManageOrders: boolean;
    canManageMenu: boolean;
    canManageBranch: boolean;
    canViewStaff: boolean;
  };
  isLoading: boolean;
  error: string | null;
}

export interface OrderItem {
  id: string;
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
}

export interface OrderSummary {
  id: string;
  branch_id: string;
  status: OrderStatus;
  total: number;
  customer_name?: string;
  created_at: string;
  payment_method?: string;
}

export interface OrderDetail extends OrderSummary {
  items: OrderItem[];
  delivery_address?: string;
  phone?: string;
  status_history?: Array<{ status: OrderStatus; changed_at: string; note?: string }>;
}

export interface Category {
  id: string;
  name: string;
  merchant_id?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category_id?: string;
  active: boolean;
  merchant_id?: string;
}

export interface ProductBranchSettings {
  id: string;
  branch_id: string;
  product_id: string;
  price_override?: number;
  paused: boolean;
  active: boolean;
}

export interface BranchStatus {
  id: string;
  branch_id: string;
  is_open: boolean;
  accepting_orders: boolean;
  pause_reason?: string;
}

export interface BranchHour {
  id: string;
  branch_id: string;
  weekday: number;
  open_time: string;
  close_time: string;
}

export interface StaffMember {
  id: string;
  user_id: string;
  full_name: string;
  email?: string;
  role: string;
  branch_ids?: string[];
}
