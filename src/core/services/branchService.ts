import { supabase } from '../../integrations/supabase/client';
import { BranchHour, BranchStatus } from '../types';

export const branchService = {
  fetchBranchStatus: async (branchId: string) => {
    return supabase.from('merchant_branch_status').select('*').eq('branch_id', branchId).maybeSingle();
  },

  updateBranchStatus: async (branchId: string, payload: Partial<BranchStatus>) => {
    return supabase.from('merchant_branch_status').update(payload).eq('branch_id', branchId).select();
  },

  fetchBranchHours: async (branchId: string) => {
    return supabase.from('merchant_branch_hours').select('*').eq('branch_id', branchId).order('weekday');
  },

  updateBranchHour: async (hourId: string, payload: Partial<BranchHour>) => {
    return supabase.from('merchant_branch_hours').update(payload).eq('id', hourId).select();
  },
};
