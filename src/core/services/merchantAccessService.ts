import { supabase } from '../../integrations/supabase/client';

const MERCHANT_ACCESS_FUNCTION = 'manage-merchant-access';

export interface MerchantAccessSnapshot {
  id: string | null;
  merchant_id: string;
  merchant_label: string;
  user_id: string | null;
  staff_id: string | null;
  email: string;
  full_name: string;
  is_active: boolean;
  must_change_password: boolean;
  onboarding_status: string;
  access_origin: string;
  password_changed_at: string | null;
  activated_at: string | null;
  deactivated_at: string | null;
  last_invited_at: string | null;
  has_auth_user: boolean;
  has_staff_assignment: boolean;
  source: 'managed_record' | 'legacy_owner' | 'merchant_contact' | 'empty';
}

export interface MerchantAccessUpsertPayload {
  merchantId: string;
  email: string;
  fullName: string;
  password?: string;
  isActive: boolean;
  mustChangePassword: boolean;
  onboardingStatus: 'pending_review' | 'invited' | 'active' | 'suspended';
  accessOrigin?: 'platform_created' | 'public_signup' | 'migration';
}

function normalizeFunctionError(error: unknown) {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error ?? 'No se pudo completar la operacion de acceso'));
}

async function invokeMerchantAccessFunction<T>(body: Record<string, unknown>) {
  const result = await supabase.functions.invoke(MERCHANT_ACCESS_FUNCTION, { body });
  if (result.error) {
    return { data: null, error: normalizeFunctionError(result.error) };
  }
  return { data: (result.data ?? null) as T | null, error: null };
}

export const merchantAccessService = {
  fetchMerchantAccess: async (merchantId: string) => {
    return invokeMerchantAccessFunction<MerchantAccessSnapshot>({
      action: 'get_merchant_access',
      merchantId,
    });
  },

  upsertMerchantAccess: async (payload: MerchantAccessUpsertPayload) => {
    return invokeMerchantAccessFunction<MerchantAccessSnapshot>({
      action: 'upsert_merchant_access',
      merchantId: payload.merchantId,
      payload,
    });
  },

  completeFirstAccess: async (password: string) => {
    return invokeMerchantAccessFunction<{ success: true }>({
      action: 'complete_first_access',
      payload: { password },
    });
  },
};
