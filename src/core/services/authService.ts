import { supabase } from '../../integrations/supabase/client';
import {
  Merchant,
  MerchantBranch,
  MerchantStaff,
  UserProfile,
} from '../types';

export const authService = {
  signIn: async (email: string, password: string) => {
    const result = await supabase.auth.signInWithPassword({ email, password });
    return result;
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },

  fetchPortalContext: async (userId: string) => {
    const profileResult = await supabase.from('profiles').select('user_id, full_name, email, phone').eq('user_id', userId).maybeSingle();
    if (profileResult.error) {
      return { error: profileResult.error };
    }

    const staffResult = await supabase
      .from('merchant_staff')
      .select(
        'id, user_id, merchant_id, role, merchant:merchant_id(id, name, slug, active)'
      )
      .eq('user_id', userId)
      .maybeSingle();

    if (staffResult.error) {
      return { error: staffResult.error };
    }

    if (!staffResult.data) {
      return { error: new Error('No se encontró asignación de staff para el usuario') };
    }

    const staffRow = staffResult.data as any;
    let merchant = staffRow?.merchant ?? null;
    if (Array.isArray(merchant)) {
      merchant = merchant[0] ?? null;
    }

    const staffAssignment: MerchantStaff = {
      id: staffRow.id,
      user_id: staffRow.user_id,
      merchant_id: staffRow.merchant_id,
      role: staffRow.role,
      merchant: merchant ?? undefined,
    };

    const branchRelationResult = await supabase
      .from('merchant_staff_branches')
      .select('id, merchant_staff_id, branch_id, role, merchant_branch:branch_id(id, name, slug, is_open, accepting_orders, merchant_id)')
      .eq('merchant_staff_id', staffRow.id);

    if (branchRelationResult.error) {
      return { error: branchRelationResult.error };
    }

    const branches: MerchantBranch[] = [];
    if (Array.isArray(branchRelationResult.data)) {
      for (const item of branchRelationResult.data as any[]) {
        if (item?.merchant_branch) {
          branches.push(item.merchant_branch as MerchantBranch);
        }
      }
    }

    const currentBranch = branches[0] ?? null;

    return {
      profile: profileResult.data
        ? { id: profileResult.data.user_id, full_name: profileResult.data.full_name, email: profileResult.data.email, phone: profileResult.data.phone }
        : null,
      staffAssignment,
      merchant: merchant ?? null,
      branches,
      currentBranch,
    };
  },
};
