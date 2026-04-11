import { supabase } from '../../integrations/supabase/client';
import { invokeManageMerchantAccess } from './manageMerchantAccessClient';

export interface PlatformUserRecord {
  staff_id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  default_role: string;
  staff_role: string;
  is_active: boolean;
  merchant_id: string;
  merchant_label: string;
  branch_ids: string[];
  branch_labels: string[];
  primary_branch_id: string;
  role_ids: string[];
  role_codes: string[];
  role_labels: string[];
  must_change_password: boolean;
  last_login_at: string;
}

export interface PlatformUserCreatePayload {
  email: string;
  fullName: string;
  phone: string;
  password: string;
  merchantId: string;
  branchIds: string[];
  primaryBranchId: string;
  staffRole: string;
  roleIds: string[];
  isActive: boolean;
  mustChangePassword: boolean;
}

export interface PlatformUserUpdatePayload {
  staffId: string;
  userId: string;
  fullName: string;
  phone: string;
  merchantId: string;
  branchIds: string[];
  primaryBranchId: string;
  staffRole: string;
  roleIds: string[];
  isActive: boolean;
}

export interface PlatformMerchantOption {
  id: string;
  label: string;
  branches: { id: string; name: string }[];
}

export interface PlatformRoleOption {
  id: string;
  code: string;
  name: string;
}

function stringOrEmpty(value: unknown) {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function nullableString(value: string) {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

async function syncUserRolesForUser(userId: string, selectedRoleIds: string[]) {
  const normalizedRoleIds = uniqueStrings(selectedRoleIds);
  const existingResult = await supabase.from('user_roles').select('id, role_id').eq('user_id', userId);

  if (existingResult.error) {
    return { data: null, error: existingResult.error };
  }

  const existingRows = (existingResult.data ?? []) as any[];
  const selectedRoleIdSet = new Set(normalizedRoleIds);
  const existingRoleIdSet = new Set(existingRows.map((row) => stringOrEmpty(row.role_id)));

  const relationIdsToDelete = existingRows
    .filter((row) => !selectedRoleIdSet.has(stringOrEmpty(row.role_id)))
    .map((row) => stringOrEmpty(row.id));

  if (relationIdsToDelete.length > 0) {
    const deleteResult = await supabase.from('user_roles').delete().in('id', relationIdsToDelete);
    if (deleteResult.error) {
      return { data: null, error: deleteResult.error };
    }
  }

  const missingRoleIds = normalizedRoleIds.filter((roleId) => !existingRoleIdSet.has(roleId));
  if (missingRoleIds.length > 0) {
    const insertResult = await supabase.from('user_roles').insert(
      missingRoleIds.map((roleId) => ({
        user_id: userId,
        role_id: roleId,
      }))
    );

    if (insertResult.error) {
      return { data: null, error: insertResult.error };
    }
  }

  return { data: normalizedRoleIds, error: null };
}

async function syncStaffBranches(staffId: string, branchIds: string[], primaryBranchId: string) {
  const normalizedBranchIds = uniqueStrings(branchIds);
  const deleteResult = await supabase.from('merchant_staff_branches').delete().eq('merchant_staff_id', staffId);

  if (deleteResult.error) {
    return { data: null, error: deleteResult.error };
  }

  if (normalizedBranchIds.length === 0) {
    return { data: [], error: null };
  }

  const resolvedPrimaryBranchId = normalizedBranchIds.includes(primaryBranchId)
    ? primaryBranchId
    : normalizedBranchIds[0];

  const insertResult = await supabase.from('merchant_staff_branches').insert(
    normalizedBranchIds.map((branchId) => ({
      merchant_staff_id: staffId,
      branch_id: branchId,
      is_primary: branchId === resolvedPrimaryBranchId,
    }))
  );

  if (insertResult.error) {
    return { data: null, error: insertResult.error };
  }

  return { data: normalizedBranchIds, error: null };
}

async function updatePlatformUserDirect(payload: PlatformUserUpdatePayload) {
  const normalizedFullName = nullableString(payload.fullName);
  const normalizedPhone = nullableString(payload.phone);
  const normalizedStaffRole = stringOrEmpty(payload.staffRole).trim() || 'staff';
  const normalizedBranchIds = uniqueStrings(payload.branchIds);
  const resolvedPrimaryBranchId = normalizedBranchIds.includes(payload.primaryBranchId)
    ? payload.primaryBranchId
    : normalizedBranchIds[0] ?? '';

  const updateStaffResult = await supabase
    .from('merchant_staff')
    .update({
      staff_role: normalizedStaffRole,
      is_active: payload.isActive,
      branch_id: nullableString(resolvedPrimaryBranchId),
    })
    .eq('id', payload.staffId);

  if (updateStaffResult.error) {
    return { data: null, error: updateStaffResult.error };
  }

  const updateProfileResult = await supabase
    .from('profiles')
    .update({
      full_name: normalizedFullName,
      phone: normalizedPhone,
      is_active: payload.isActive,
    })
    .eq('user_id', payload.userId);

  if (updateProfileResult.error) {
    return { data: null, error: updateProfileResult.error };
  }

  const updateAccessResult = await supabase
    .from('merchant_access_accounts')
    .update({
      full_name: normalizedFullName,
      is_active: payload.isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', payload.userId);

  if (updateAccessResult.error) {
    return { data: null, error: updateAccessResult.error };
  }

  const branchSyncResult = await syncStaffBranches(payload.staffId, normalizedBranchIds, resolvedPrimaryBranchId);
  if (branchSyncResult.error) {
    return { data: null, error: branchSyncResult.error };
  }

  const roleSyncResult = await syncUserRolesForUser(payload.userId, payload.roleIds);
  if (roleSyncResult.error) {
    return { data: null, error: roleSyncResult.error };
  }

  return {
    data: {
      success: true,
      staff_id: payload.staffId,
      user_id: payload.userId,
    },
    error: null,
  };
}

async function deletePlatformUserDirect(staffId: string) {
  const deleteBranchesResult = await supabase.from('merchant_staff_branches').delete().eq('merchant_staff_id', staffId);
  if (deleteBranchesResult.error) {
    return { data: null, error: deleteBranchesResult.error };
  }

  const deleteStaffResult = await supabase.from('merchant_staff').delete().eq('id', staffId);
  if (deleteStaffResult.error) {
    return { data: null, error: deleteStaffResult.error };
  }

  return { data: { success: true }, error: null };
}

export const adminPlatformUsersService = {
  fetchRoles: async (): Promise<{ data: PlatformRoleOption[] | null; error: any }> => {
    const result = await supabase.from('roles').select('id, code, name').order('name', { ascending: true });
    if (result.error) return { data: null, error: result.error };
    const data: PlatformRoleOption[] = ((result.data ?? []) as any[])
      .map((row) => ({
        id: stringOrEmpty(row.id),
        code: stringOrEmpty(row.code),
        name: stringOrEmpty(row.name),
      }))
      .filter((row) => row.id && row.code);
    return { data, error: null };
  },

  fetchMerchantsWithBranches: async (): Promise<{ data: PlatformMerchantOption[] | null; error: any }> => {
    const [merchantsResult, branchesResult] = await Promise.all([
      supabase.from('merchants').select('id, trade_name, legal_name').order('trade_name', { ascending: true }),
      supabase.from('merchant_branches').select('id, merchant_id, name').order('name', { ascending: true }),
    ]);

    if (merchantsResult.error) return { data: null, error: merchantsResult.error };
    if (branchesResult.error) return { data: null, error: branchesResult.error };

    const branchRows = (branchesResult.data ?? []) as any[];
    const data: PlatformMerchantOption[] = ((merchantsResult.data ?? []) as any[]).map((row) => ({
      id: stringOrEmpty(row.id),
      label: stringOrEmpty(row.trade_name) || stringOrEmpty(row.legal_name) || stringOrEmpty(row.id),
      branches: branchRows
        .filter((branch) => stringOrEmpty(branch.merchant_id) === stringOrEmpty(row.id))
        .map((branch) => ({
          id: stringOrEmpty(branch.id),
          name: stringOrEmpty(branch.name),
        })),
    }));

    return { data, error: null };
  },

  fetchPlatformUsers: async (): Promise<{ data: PlatformUserRecord[] | null; error: any }> => {
    const [staffResult, profilesResult, merchantsResult, branchesResult, staffBranchesResult, userRolesResult, rolesResult, accessResult] =
      await Promise.all([
        supabase.from('merchant_staff').select('id, user_id, merchant_id, staff_role, is_active, branch_id, last_login_at').order('created_at', { ascending: true }),
        supabase.from('profiles').select('user_id, full_name, email, phone, default_role, is_active'),
        supabase.from('merchants').select('id, trade_name, legal_name'),
        supabase.from('merchant_branches').select('id, merchant_id, name'),
        supabase.from('merchant_staff_branches').select('id, merchant_staff_id, branch_id, is_primary'),
        supabase.from('user_roles').select('id, user_id, role_id'),
        supabase.from('roles').select('id, code, name'),
        supabase.from('merchant_access_accounts').select('user_id, must_change_password'),
      ]);

    if (staffResult.error) return { data: null, error: staffResult.error };
    if (profilesResult.error) return { data: null, error: profilesResult.error };
    if (merchantsResult.error) return { data: null, error: merchantsResult.error };
    if (branchesResult.error) return { data: null, error: branchesResult.error };
    if (staffBranchesResult.error) return { data: null, error: staffBranchesResult.error };
    if (userRolesResult.error) return { data: null, error: userRolesResult.error };
    if (rolesResult.error) return { data: null, error: rolesResult.error };

    const profileMap = new Map<string, any>(((profilesResult.data ?? []) as any[]).map((row) => [stringOrEmpty(row.user_id), row]));
    const merchantMap = new Map<string, any>(((merchantsResult.data ?? []) as any[]).map((row) => [stringOrEmpty(row.id), row]));
    const branchMap = new Map<string, any>(((branchesResult.data ?? []) as any[]).map((row) => [stringOrEmpty(row.id), row]));
    const roleMap = new Map<string, any>(((rolesResult.data ?? []) as any[]).map((row) => [stringOrEmpty(row.id), row]));
    const staffBranchRows = (staffBranchesResult.data ?? []) as any[];
    const userRoleRows = (userRolesResult.data ?? []) as any[];
    const accessRows = (accessResult.data ?? []) as any[];
    const accessMap = new Map<string, any>(accessRows.map((row) => [stringOrEmpty(row.user_id), row]));

    const data: PlatformUserRecord[] = ((staffResult.data ?? []) as any[]).map((row) => {
      const userId = stringOrEmpty(row.user_id);
      const profile = profileMap.get(userId);
      const merchant = merchantMap.get(stringOrEmpty(row.merchant_id));
      const relations = staffBranchRows.filter((item) => stringOrEmpty(item.merchant_staff_id) === stringOrEmpty(row.id));
      const branchIds = uniqueStrings(relations.map((item) => stringOrEmpty(item.branch_id)));
      const branchLabels = branchIds.map((id) => stringOrEmpty(branchMap.get(id)?.name)).filter(Boolean);
      const primaryRelation = relations.find((item) => Boolean(item.is_primary));
      const primaryBranchId = stringOrEmpty(primaryRelation?.branch_id || row.branch_id || branchIds[0]);
      const userRoles = userRoleRows.filter((item) => stringOrEmpty(item.user_id) === userId);
      const roleIds = uniqueStrings(userRoles.map((item) => stringOrEmpty(item.role_id)));
      const resolvedRoles = roleIds.map((id) => roleMap.get(id)).filter(Boolean);
      const accessRecord = accessMap.get(userId);

      return {
        staff_id: stringOrEmpty(row.id),
        user_id: userId,
        full_name: stringOrEmpty(profile?.full_name) || 'Sin nombre',
        email: stringOrEmpty(profile?.email),
        phone: stringOrEmpty(profile?.phone),
        default_role: stringOrEmpty(profile?.default_role) || 'customer',
        staff_role: stringOrEmpty(row.staff_role) || 'staff',
        is_active: Boolean(row.is_active ?? true) && Boolean(profile?.is_active ?? true),
        merchant_id: stringOrEmpty(row.merchant_id),
        merchant_label: stringOrEmpty(merchant?.trade_name) || stringOrEmpty(merchant?.legal_name) || 'Sin negocio',
        branch_ids: branchIds,
        branch_labels: branchLabels,
        primary_branch_id: primaryBranchId,
        role_ids: roleIds,
        role_codes: resolvedRoles.map((role) => stringOrEmpty(role.code)),
        role_labels: resolvedRoles.map((role) => stringOrEmpty(role.name)),
        must_change_password: Boolean(accessRecord?.must_change_password ?? false),
        last_login_at: stringOrEmpty(row.last_login_at),
      } satisfies PlatformUserRecord;
    });

    data.sort((left, right) => {
      const leftLabel = (left.full_name || left.email || left.user_id).toLowerCase();
      const rightLabel = (right.full_name || right.email || right.user_id).toLowerCase();
      return leftLabel.localeCompare(rightLabel);
    });

    return { data, error: null };
  },

  createPlatformUser: async (payload: PlatformUserCreatePayload) => {
    const result = await invokeManageMerchantAccess<{
      success?: boolean;
      staff_id?: string;
      user_id?: string;
      error?: string;
    }>({
      action: 'create_platform_user',
      payload: {
        email: payload.email,
        fullName: payload.fullName,
        phone: payload.phone,
        password: payload.password,
        merchantId: payload.merchantId,
        branchIds: payload.branchIds,
        primaryBranchId: payload.primaryBranchId,
        staffRole: payload.staffRole,
        roleIds: payload.roleIds,
        isActive: payload.isActive,
        mustChangePassword: payload.mustChangePassword,
      },
    });

    if (result.error) {
      return { data: null, error: result.error };
    }

    const responseData = result.data as any;
    if (responseData?.error) {
      return { data: null, error: new Error(responseData.error) };
    }

    return { data: responseData, error: null };
  },

  updatePlatformUser: async (payload: PlatformUserUpdatePayload) => {
    const result = await invokeManageMerchantAccess<{
      success?: boolean;
      staff_id?: string;
      user_id?: string;
      error?: string;
    }>({
      action: 'update_platform_user',
      payload,
    });

    if (!result.error) {
      return { data: result.data, error: null };
    }

    if (!import.meta.env.DEV) {
      return { data: null, error: result.error };
    }

    return updatePlatformUserDirect(payload);
  },

  deletePlatformUser: async (staffId: string) => {
    const result = await invokeManageMerchantAccess<{ success?: boolean; error?: string }>({
      action: 'delete_platform_user',
      payload: { staffId },
    });

    if (!result.error) {
      return { data: result.data, error: null };
    }

    if (!import.meta.env.DEV) {
      return { data: null, error: result.error };
    }

    return deletePlatformUserDirect(staffId);
  },
};
