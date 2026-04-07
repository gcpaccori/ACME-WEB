import { supabase } from '../../integrations/supabase/client';
import { Category, Product, ProductBranchSettings } from '../types';

export const menuService = {
  fetchCategories: async (merchantId: string) => {
    return supabase.from('categories').select('*').eq('merchant_id', merchantId).order('name');
  },

  fetchProducts: async (merchantId: string) => {
    return supabase
      .from('products')
      .select('id, name, description, price, category_id, active, merchant_id')
      .eq('merchant_id', merchantId)
      .order('name');
  },

  fetchBranchProductSettings: async (branchId: string) => {
    return supabase.from('product_branch_settings').select('*').eq('branch_id', branchId);
  },

  updateProduct: async (product: Partial<Product> & { id: string }) => {
    return supabase.from('products').update(product).eq('id', product.id).select();
  },

  toggleProductActive: async (productId: string, active: boolean) => {
    return supabase.from('products').update({ active }).eq('id', productId).select();
  },

  updateBranchProductSetting: async (settingId: string, payload: Partial<ProductBranchSettings>) => {
    return supabase.from('product_branch_settings').update(payload).eq('id', settingId).select();
  },
};
