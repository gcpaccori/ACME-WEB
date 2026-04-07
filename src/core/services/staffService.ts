import { supabase } from '../../integrations/supabase/client';
import { StaffMember } from '../types';

export const staffService = {
  fetchStaffForMerchant: async (merchantId: string) => {
    return supabase
      .from('merchant_staff')
      .select('id, user_id, role, full_name, email, branch_ids')
      .eq('merchant_id', merchantId)
      .order('role');
  },
};
