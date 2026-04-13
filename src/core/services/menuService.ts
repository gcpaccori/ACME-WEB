import { supabase } from '../../integrations/supabase/client';
import { Category, Product, ProductBranchSettings } from '../types';

export const menuService = {
  fetchCategories: async (merchantId: string) => {
    const result = await supabase.from('categories').select('*').eq('merchant_id', merchantId);
    if (result.error) {
      return result;
    }

    const mapped: Category[] = (result.data ?? []).map((row: any) => ({
      id: row.id,
      name: row.name ?? row.title ?? 'Categoría',
      merchant_id: row.merchant_id ?? undefined,
    }));

    mapped.sort((a, b) => a.name.localeCompare(b.name));
    return { data: mapped, error: null };
  },

  fetchProducts: async (merchantId: string) => {
    const result = await supabase
      .from('products')
      .select('*')
      .eq('merchant_id', merchantId);

    if (result.error) {
      return result;
    }

    const mapped: Product[] = (result.data ?? []).map((row: any) => ({
      id: row.id,
      name: row.name ?? row.title ?? 'Producto',
      description: row.description ?? undefined,
      price: Number(row.price ?? row.base_price ?? 0),
      category_id: row.category_id ?? undefined,
      active: Boolean(row.active ?? row.is_active ?? true),
      merchant_id: row.merchant_id ?? undefined,
      image_url: row.image_url ?? undefined,
    }));

    mapped.sort((a, b) => a.name.localeCompare(b.name));
    return { data: mapped, error: null };
  },

  fetchBranchProductSettings: async (branchId: string) => {
    return supabase.from('product_branch_settings').select('*').eq('branch_id', branchId);
  },

  updateProduct: async (product: Partial<Product> & { id: string }) => {
    const payload: any = { ...product };
    if (typeof product.active === 'boolean') {
      payload.active = product.active;
      payload.is_active = product.active;
    }
    return supabase.from('products').update(payload).eq('id', product.id).select();
  },

  toggleProductActive: async (productId: string, active: boolean) => {
    let result = await supabase.from('products').update({ active }).eq('id', productId).select();
    if (result.error && /column\s+products\.active\s+does not exist/i.test(result.error.message || '')) {
      result = await supabase.from('products').update({ is_active: active }).eq('id', productId).select();
    }
    return result;
  },

  updateBranchProductSetting: async (settingId: string, payload: Partial<ProductBranchSettings>) => {
    return supabase.from('product_branch_settings').update(payload).eq('id', settingId).select();
  },
};
