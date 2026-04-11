import { supabase } from '../../integrations/supabase/client';
import { AppRoutes } from '../constants/routes';

const PENDING_BUSINESS_REGISTRATION_KEY = 'pendingBusinessRegistration';

export interface BusinessRegistrationPayload {
  ownerName: string;
  email: string;
  phone: string;
  businessName: string;
  branchName: string;
  address: string;
  password: string;
}

interface PendingBusinessRegistration {
  ownerName: string;
  email: string;
  phone: string;
  businessName: string;
  branchName: string;
  address: string;
}

function nullableString(value: string) {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function isMissingRelationError(error: { message?: string } | null | undefined, relationName: string) {
  const message = String(error?.message ?? '').toLowerCase();
  return message.includes(relationName.toLowerCase()) && (message.includes('does not exist') || message.includes('relation') || message.includes('schema cache'));
}

function readPendingBusinessRegistration(): PendingBusinessRegistration | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(PENDING_BUSINESS_REGISTRATION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as PendingBusinessRegistration;
  } catch {
    window.localStorage.removeItem(PENDING_BUSINESS_REGISTRATION_KEY);
    return null;
  }
}

function persistPendingBusinessRegistration(payload: BusinessRegistrationPayload) {
  if (typeof window === 'undefined') return;
  const draft: PendingBusinessRegistration = {
    ownerName: payload.ownerName.trim(),
    email: payload.email.trim(),
    phone: payload.phone.trim(),
    businessName: payload.businessName.trim(),
    branchName: payload.branchName.trim(),
    address: payload.address.trim(),
  };
  window.localStorage.setItem(PENDING_BUSINESS_REGISTRATION_KEY, JSON.stringify(draft));
}

function clearPendingBusinessRegistration() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(PENDING_BUSINESS_REGISTRATION_KEY);
}

async function ensureBusinessProfile(userId: string, draft: PendingBusinessRegistration) {
  const profilePayload = {
    user_id: userId,
    full_name: draft.ownerName,
    email: draft.email,
    phone: nullableString(draft.phone),
    default_role: 'owner',
    is_active: false,
  };

  const profileResult = await supabase
    .from('profiles')
    .upsert(profilePayload, { onConflict: 'user_id' })
    .select('user_id')
    .single();

  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  return { data: profileResult.data, error: null };
}

async function syncPublicBusinessAccessRecord(userId: string, merchantId: string, draft: PendingBusinessRegistration) {
  const now = new Date().toISOString();
  const result = await supabase
    .from('merchant_access_accounts')
    .upsert(
      {
        merchant_id: merchantId,
        user_id: userId,
        email: draft.email,
        full_name: draft.ownerName,
        access_origin: 'public_signup',
        onboarding_status: 'pending_review',
        is_active: false,
        must_change_password: false,
        activated_at: null,
        deactivated_at: now,
        password_changed_at: now,
        updated_at: now,
      },
      { onConflict: 'merchant_id' }
    )
    .select('id')
    .maybeSingle();

  if (result.error && !isMissingRelationError(result.error, 'merchant_access_accounts')) {
    return { data: null, error: result.error };
  }

  return { data: result.data ?? null, error: null };
}

async function createBusinessStructure(userId: string, draft: PendingBusinessRegistration) {
  const existingStaffResult = await supabase.from('merchant_staff').select('id').eq('user_id', userId).limit(1);
  if (existingStaffResult.error) {
    return { data: null, error: existingStaffResult.error };
  }

  if ((existingStaffResult.data ?? []).length > 0) {
    clearPendingBusinessRegistration();
    return { data: { alreadyExists: true }, error: null };
  }

  const profileResult = await ensureBusinessProfile(userId, draft);
  if (profileResult.error) return profileResult;

  const addressResult = await supabase
    .from('addresses')
    .insert({
      line1: draft.address,
      line2: null,
      reference: null,
      district: null,
      city: 'Huancayo',
      region: 'Junin',
      country: 'Peru',
    })
    .select('id')
    .single();

  if (addressResult.error) {
    return { data: null, error: addressResult.error };
  }

  const merchantResult = await supabase
    .from('merchants')
    .insert({
      trade_name: draft.businessName,
      phone: nullableString(draft.phone),
      email: draft.email,
      status: 'pending_review',
    })
    .select('id')
    .single();

  if (merchantResult.error) {
    return { data: null, error: merchantResult.error };
  }

  const merchantId = String((merchantResult.data as any)?.id ?? '');
  if (!merchantId) {
    return { data: null, error: new Error('No se pudo crear el negocio.') };
  }

  const branchResult = await supabase
    .from('merchant_branches')
    .insert({
      merchant_id: merchantId,
      name: draft.branchName,
      address_id: (addressResult.data as any)?.id ?? null,
      phone: nullableString(draft.phone),
      prep_time_avg_min: 20,
      accepts_orders: false,
      status: 'pending_review',
    })
    .select('id')
    .single();

  if (branchResult.error) {
    return { data: null, error: branchResult.error };
  }

  const branchId = String((branchResult.data as any)?.id ?? '');
  if (!branchId) {
    return { data: null, error: new Error('No se pudo crear la sucursal principal.') };
  }

  const statusResult = await supabase.from('merchant_branch_status').insert({
    branch_id: branchId,
    is_open: false,
    accepting_orders: false,
    status_code: 'onboarding_pending',
    pause_reason: 'Pendiente de aprobacion de plataforma',
    updated_by_user_id: userId,
  });

  if (statusResult.error) {
    return { data: null, error: statusResult.error };
  }

  const defaultHours = Array.from({ length: 7 }, (_, day) => ({
    branch_id: branchId,
    day_of_week: day,
    open_time: '08:00:00',
    close_time: '22:00:00',
    is_closed: false,
    updated_by_user_id: userId,
  }));

  const hoursResult = await supabase.from('merchant_branch_hours').insert(defaultHours);
  if (hoursResult.error) {
    return { data: null, error: hoursResult.error };
  }

  const staffResult = await supabase
    .from('merchant_staff')
    .insert({
      user_id: userId,
      merchant_id: merchantId,
      staff_role: 'owner',
      branch_id: branchId,
      is_active: false,
    })
    .select('id')
    .single();

  if (staffResult.error) {
    return { data: null, error: staffResult.error };
  }

  const staffId = String((staffResult.data as any)?.id ?? '');
  if (!staffId) {
    return { data: null, error: new Error('No se pudo crear la asignación del negocio.') };
  }

  const staffBranchResult = await supabase.from('merchant_staff_branches').insert({
    branch_id: branchId,
    merchant_staff_id: staffId,
    is_primary: true,
  });

  if (staffBranchResult.error) {
    return { data: null, error: staffBranchResult.error };
  }

  const accessSyncResult = await syncPublicBusinessAccessRecord(userId, merchantId, draft);
  if (accessSyncResult.error) {
    return { data: null, error: accessSyncResult.error };
  }

  clearPendingBusinessRegistration();

  return {
    data: {
      merchantId,
      branchId,
      staffId,
      alreadyExists: false,
    },
    error: null,
  };
}

export const publicBusinessService = {
  readPendingBusinessRegistration,
  clearPendingBusinessRegistration,

  finalizeBusinessOnboarding: async (userId: string, data: {
    ownerName: string;
    email: string;
    phone: string;
    businessName: string;
    branchName: string;
    address: string;
  }) => {
    return createBusinessStructure(userId, data);
  },

  registerBusinessAccount: async (payload: BusinessRegistrationPayload) => {
    persistPendingBusinessRegistration(payload);

    const signUpResult = await supabase.auth.signUp({
      email: payload.email.trim(),
      password: payload.password,
      options: {
        emailRedirectTo: `${window.location.origin}${AppRoutes.public.portalLogin}`,
        data: {
          owner_name: payload.ownerName.trim(),
          business_name: payload.businessName.trim(),
          branch_name: payload.branchName.trim(),
        },
      },
    });

    if (signUpResult.error) {
      clearPendingBusinessRegistration();
      return { data: null, error: signUpResult.error };
    }

    if (!signUpResult.data.user) {
      clearPendingBusinessRegistration();
      return { data: null, error: new Error('No se pudo crear la cuenta de acceso.') };
    }

    if (!signUpResult.data.session) {
      return { data: { status: 'awaiting_confirmation' as const }, error: null };
    }

    const finalizeResult = await createBusinessStructure(signUpResult.data.user.id, readPendingBusinessRegistration() ?? {
      ownerName: payload.ownerName.trim(),
      email: payload.email.trim(),
      phone: payload.phone.trim(),
      businessName: payload.businessName.trim(),
      branchName: payload.branchName.trim(),
      address: payload.address.trim(),
    });

    if (finalizeResult.error) {
      return { data: null, error: finalizeResult.error };
    }

    return { data: { status: 'completed' as const, ...finalizeResult.data }, error: null };
  },

  finalizePendingBusinessRegistration: async (userId: string) => {
    const draft = readPendingBusinessRegistration();
    if (!draft) {
      return { data: null, error: null };
    }

    return createBusinessStructure(userId, draft);
  },
};
