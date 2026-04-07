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
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (staffResult.error) {
      return { error: staffResult.error };
    }

    if (!staffResult.data) {
      return {
        profile: profileResult.data
          ? { id: profileResult.data.user_id, full_name: profileResult.data.full_name, email: profileResult.data.email, phone: profileResult.data.phone }
          : null,
        staffAssignment: null,
        merchant: null,
        branches: [],
        currentBranch: null,
      };
    }

    const staffRow = staffResult.data as any;
    const merchantResult = staffRow?.merchant_id
      ? await supabase.from('merchants').select('*').eq('id', staffRow.merchant_id).maybeSingle()
      : { data: null, error: null };

    if (merchantResult.error) {
      return { error: merchantResult.error };
    }

    const merchantRow = merchantResult.data as any;
    const merchant: Merchant | null = merchantRow
      ? {
          id: merchantRow.id,
          name: merchantRow.name ?? merchantRow.trade_name ?? 'Comercio',
          slug: merchantRow.slug ?? undefined,
          active: merchantRow.active ?? merchantRow.is_active ?? undefined,
        }
      : null;

    const staffAssignment: MerchantStaff = {
      id: staffRow.id,
      user_id: staffRow.user_id,
      merchant_id: staffRow.merchant_id,
      role: staffRow.role ?? staffRow.staff_role ?? 'staff',
      merchant: merchant ?? undefined,
    };

    const branchRelationResult = await supabase
      .from('merchant_staff_branches')
      .select('*')
      .eq('merchant_staff_id', staffRow.id);

    if (branchRelationResult.error) {
      return { error: branchRelationResult.error };
    }

    const relationRows = Array.isArray(branchRelationResult.data) ? (branchRelationResult.data as any[]) : [];
    const branchIds = relationRows.map((row) => row?.branch_id).filter(Boolean);

    let branches: MerchantBranch[] = [];
    if (branchIds.length > 0) {
      const branchResult = await supabase
        .from('merchant_branches')
        .select('*')
        .in('id', branchIds);

      if (branchResult.error) {
        return { error: branchResult.error };
      }

      branches = (branchResult.data ?? []).map((row: any) => ({
        id: row.id,
        name: row.name ?? row.trade_name ?? 'Sucursal',
        slug: row.slug ?? undefined,
        is_open: row.is_open ?? row.open ?? undefined,
        accepting_orders: row.accepting_orders ?? undefined,
        address: row.address ?? undefined,
        merchant_id: row.merchant_id ?? undefined,
      }));
    }

    const primaryBranchId = relationRows.find((row) => row?.is_primary)?.branch_id;
    const currentBranch = branches.find((branch) => branch.id === primaryBranchId) ?? branches[0] ?? null;

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
