import { supabase } from '../../integrations/supabase/client';
import {
  Merchant,
  MerchantBranch,
  MerchantAccessControl,
  PortalBusinessAssignment,
  MerchantStaff,
  PortalRoleAssignment,
  UserProfile,
} from '../types';

function stringOrEmpty(value: unknown) {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

function isMissingRelationError(error: { message?: string } | null | undefined, relationName: string) {
  const message = String(error?.message ?? '').toLowerCase();
  return message.includes(relationName.toLowerCase()) && (message.includes('does not exist') || message.includes('relation') || message.includes('schema cache'));
}

export const authService = {
  signIn: async (email: string, password: string) => {
    const result = await supabase.auth.signInWithPassword({ email, password });
    return result;
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },

  fetchPortalContext: async (userId: string) => {
    const [profileResult, userRolesResult, staffAssignmentsResult, accessControlResult] = await Promise.all([
      supabase.from('profiles').select('user_id, full_name, email, phone, default_role, is_active').eq('user_id', userId).maybeSingle(),
      supabase.from('user_roles').select('id, role_id, roles:roles(id, code, name)').eq('user_id', userId),
      supabase.from('merchant_staff').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      supabase
        .from('merchant_access_accounts')
        .select('id, merchant_id, email, full_name, is_active, must_change_password, onboarding_status, access_origin, password_changed_at')
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

    if (profileResult.error) {
      return { error: profileResult.error };
    }
    if (userRolesResult.error) {
      return { error: userRolesResult.error };
    }
    if (staffAssignmentsResult.error) {
      return { error: staffAssignmentsResult.error };
    }
    if (accessControlResult.error && !isMissingRelationError(accessControlResult.error, 'merchant_access_accounts')) {
      return { error: accessControlResult.error };
    }

    const roleAssignments: PortalRoleAssignment[] = ((userRolesResult.data ?? []) as any[])
      .map((row) => {
        const roleRow = row?.roles ?? null;
        return {
          id: stringOrEmpty(row?.id),
          role_id: stringOrEmpty(row?.role_id),
          code: stringOrEmpty(roleRow?.code),
          name: stringOrEmpty(roleRow?.name) || stringOrEmpty(roleRow?.code),
        } satisfies PortalRoleAssignment;
      })
      .filter((assignment) => assignment.role_id && assignment.code);

    const profile: UserProfile | null = profileResult.data
      ? {
          id: profileResult.data.user_id,
          full_name: profileResult.data.full_name,
          email: profileResult.data.email,
          phone: profileResult.data.phone,
          default_role: profileResult.data.default_role ?? undefined,
          is_active: profileResult.data.is_active ?? undefined,
        }
      : null;
    const accessControl: MerchantAccessControl | null = accessControlResult.data
      ? {
          id: stringOrEmpty(accessControlResult.data.id) || null,
          merchant_id: stringOrEmpty(accessControlResult.data.merchant_id) || null,
          email: stringOrEmpty(accessControlResult.data.email),
          full_name: stringOrEmpty(accessControlResult.data.full_name),
          is_active: Boolean(accessControlResult.data.is_active ?? true),
          must_change_password: Boolean(accessControlResult.data.must_change_password ?? false),
          onboarding_status: stringOrEmpty(accessControlResult.data.onboarding_status) || null,
          access_origin: stringOrEmpty(accessControlResult.data.access_origin) || null,
          password_changed_at: stringOrEmpty(accessControlResult.data.password_changed_at) || null,
        }
      : null;
    const isOnboardingBlocked = ['pending_review', 'suspended'].includes(stringOrEmpty(accessControl?.onboarding_status).toLowerCase());
    const isAccountActive = Boolean(profile?.is_active ?? true) && Boolean(accessControl?.is_active ?? true) && !isOnboardingBlocked;
    const mustChangePassword = Boolean(accessControl?.must_change_password ?? false);

    const staffRows = Array.isArray(staffAssignmentsResult.data) ? (staffAssignmentsResult.data as any[]) : [];

    if (staffRows.length === 0) {
      return {
        profile,
        roleAssignments,
        businessAssignments: [],
        staffAssignment: null,
        merchant: null,
        currentMerchant: null,
        branches: [],
        currentBranch: null,
        accessControl,
        isAccountActive,
        mustChangePassword,
      };
    }
    const merchantIds = Array.from(new Set(staffRows.map((row) => stringOrEmpty(row?.merchant_id)).filter(Boolean)));
    const staffIds = Array.from(new Set(staffRows.map((row) => stringOrEmpty(row?.id)).filter(Boolean)));

    const [merchantsResult, branchRelationsResult] = await Promise.all([
      merchantIds.length > 0
        ? supabase.from('merchants').select('*').in('id', merchantIds)
        : Promise.resolve({ data: [], error: null } as any),
      staffIds.length > 0
        ? supabase.from('merchant_staff_branches').select('*').in('merchant_staff_id', staffIds)
        : Promise.resolve({ data: [], error: null } as any),
    ]);

    if (merchantsResult.error) {
      return { error: merchantsResult.error };
    }
    if (branchRelationsResult.error) {
      return { error: branchRelationsResult.error };
    }

    const merchantMap = new Map<string, Merchant>(
      ((merchantsResult.data ?? []) as any[]).map((row) => [
        stringOrEmpty(row.id),
        {
          id: row.id,
          name: row.name ?? row.trade_name ?? 'Comercio',
          slug: row.slug ?? undefined,
          active: row.active ?? row.is_active ?? undefined,
        } satisfies Merchant,
      ])
    );

    const branchRelationRows = Array.isArray(branchRelationsResult.data) ? (branchRelationsResult.data as any[]) : [];
    const branchIds = Array.from(new Set(branchRelationRows.map((row) => stringOrEmpty(row?.branch_id)).filter(Boolean)));
    const branchesResult =
      branchIds.length > 0
        ? await supabase.from('merchant_branches').select('*').in('id', branchIds)
        : ({ data: [], error: null } as any);

    if (branchesResult.error) {
      return { error: branchesResult.error };
    }

    const branchMap = new Map<string, MerchantBranch>(
      ((branchesResult.data ?? []) as any[]).map((row) => [
        stringOrEmpty(row.id),
        {
          id: row.id,
          name: row.name ?? row.trade_name ?? 'Sucursal',
          slug: row.slug ?? undefined,
          is_open: row.is_open ?? row.open ?? undefined,
          accepting_orders: row.accepting_orders ?? undefined,
          address: row.address ?? undefined,
          merchant_id: row.merchant_id ?? undefined,
        } satisfies MerchantBranch,
      ])
    );

    const businessAssignments: PortalBusinessAssignment[] = staffRows
      .map((staffRow: any) => {
        const merchant = merchantMap.get(stringOrEmpty(staffRow.merchant_id));
        if (!merchant) {
          return null;
        }

        const staffAssignment: MerchantStaff = {
          id: stringOrEmpty(staffRow.id),
          user_id: stringOrEmpty(staffRow.user_id),
          merchant_id: stringOrEmpty(staffRow.merchant_id),
          role: stringOrEmpty(staffRow.role ?? staffRow.staff_role) || 'staff',
          merchant,
        };

        const relations = branchRelationRows.filter((row) => stringOrEmpty(row.merchant_staff_id) === staffAssignment.id);
        const primaryBranchId = relations.find((row) => Boolean(row.is_primary))?.branch_id
          ? stringOrEmpty(relations.find((row) => Boolean(row.is_primary))?.branch_id)
          : null;
        const branches = relations
          .map((row) => branchMap.get(stringOrEmpty(row.branch_id)))
          .filter(Boolean) as MerchantBranch[];

        return {
          merchant,
          staffAssignment,
          branches,
          primaryBranchId,
        } satisfies PortalBusinessAssignment;
      })
      .filter(Boolean) as PortalBusinessAssignment[];

    const currentAssignment = businessAssignments[0] ?? null;
    const currentBranch =
      currentAssignment?.branches.find((branch) => branch.id === currentAssignment.primaryBranchId) ??
      currentAssignment?.branches[0] ??
      null;

    return {
      profile,
      roleAssignments,
      businessAssignments,
      staffAssignment: currentAssignment?.staffAssignment ?? null,
      merchant: currentAssignment?.merchant ?? null,
      currentMerchant: currentAssignment?.merchant ?? null,
      branches: currentAssignment?.branches ?? [],
      currentBranch,
      accessControl,
      isAccountActive,
      mustChangePassword,
    };
  },
};
