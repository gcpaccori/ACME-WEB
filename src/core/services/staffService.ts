import { supabase } from '../../integrations/supabase/client';
import { StaffMember } from '../types';

export const staffService = {
  fetchStaffForMerchant: async (merchantId: string) => {
    const result = await supabase
      .from('merchant_staff')
      .select('*')
      .eq('merchant_id', merchantId);

    if (result.error) {
      return result;
    }

    const mapped: StaffMember[] = (result.data ?? []).map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      full_name: row.full_name ?? row.name ?? '',
      email: row.email ?? undefined,
      role: row.role ?? row.staff_role ?? 'staff',
      branch_ids: Array.isArray(row.branch_ids)
        ? row.branch_ids
        : row.branch_id
          ? [row.branch_id]
          : [],
    }));

    return { data: mapped, error: null };
  },
};
