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
    const result = await supabase.from('merchant_branch_hours').select('*').eq('branch_id', branchId);
    if (result.error) {
      return result;
    }

    const mapped: BranchHour[] = (result.data ?? []).map((row: any) => ({
      id: row.id,
      branch_id: row.branch_id,
      weekday: Number(row.weekday ?? row.day_of_week ?? 0),
      open_time: row.open_time ?? row.opens_at ?? '09:00',
      close_time: row.close_time ?? row.closes_at ?? '18:00',
    }));

    mapped.sort((a, b) => a.weekday - b.weekday);
    return { data: mapped, error: null };
  },

  updateBranchHour: async (hourId: string, payload: Partial<BranchHour>) => {
    return supabase.from('merchant_branch_hours').update(payload).eq('id', hourId).select();
  },
};
