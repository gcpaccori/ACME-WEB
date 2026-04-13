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

function nullableString(value: string | null | undefined) {
  const normalized = stringOrEmpty(value).trim();
  return normalized.length > 0 ? normalized : null;
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeCode(value: unknown) {
  return stringOrEmpty(value).trim().toLowerCase();
}

function hasPlatformOperatorRole(params: { roleAssignments: PortalRoleAssignment[]; profile: UserProfile | null }) {
  if (['admin', 'super_admin'].includes(normalizeCode(params.profile?.default_role))) {
    return true;
  }

  return params.roleAssignments.some((assignment) => ['admin', 'super_admin'].includes(normalizeCode(assignment.code)));
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

  updateOwnPortalProfile: async (payload: { userId: string; full_name: string; phone?: string | null }) => {
    const userId = stringOrEmpty(payload.userId);
    const fullName = stringOrEmpty(payload.full_name).trim();
    const phone = stringOrEmpty(payload.phone).trim();

    if (!userId) {
      return { data: null, error: new Error('No se encontro la sesion del usuario actual.') };
    }

    if (!fullName) {
      return { data: null, error: new Error('El nombre es obligatorio.') };
    }

    const now = new Date().toISOString();
    const [authUserResult, profileLookupResult] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from('profiles').select('user_id, email').eq('user_id', userId).maybeSingle(),
    ]);

    if (authUserResult.error) {
      return { data: null, error: authUserResult.error };
    }

    if (profileLookupResult.error) {
      return { data: null, error: profileLookupResult.error };
    }

    const email = stringOrEmpty(profileLookupResult.data?.email) || stringOrEmpty(authUserResult.data.user?.email);
    const profilePayload = {
      full_name: fullName,
      phone: nullableString(phone),
      email: email || null,
      updated_at: now,
    };

    const profileWriteResult = profileLookupResult.data
      ? await supabase
          .from('profiles')
          .update(profilePayload)
          .eq('user_id', userId)
          .select('user_id, full_name, email, phone')
          .single()
      : await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            full_name: fullName,
            phone: nullableString(phone),
            email: email || null,
            default_role: 'customer',
            is_active: true,
            created_at: now,
            updated_at: now,
          })
          .select('user_id, full_name, email, phone')
          .single();

    if (profileWriteResult.error) {
      return { data: null, error: profileWriteResult.error };
    }

    const accessUpdateResult = await supabase.from('merchant_access_accounts').update({ full_name: fullName }).eq('user_id', userId);

    if (accessUpdateResult.error && !isMissingRelationError(accessUpdateResult.error, 'merchant_access_accounts')) {
      return { data: null, error: accessUpdateResult.error };
    }

    return {
      data: {
        user_id: stringOrEmpty(profileWriteResult.data?.user_id) || userId,
        full_name: stringOrEmpty(profileWriteResult.data?.full_name) || fullName,
        email: stringOrEmpty(profileWriteResult.data?.email) || email,
        phone: stringOrEmpty(profileWriteResult.data?.phone) || phone,
      },
      error: null,
    };
  },

  requestPasswordRecovery: async (email: string, redirectTo: string) => {
    return supabase.auth.resetPasswordForEmail(email, { redirectTo });
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
    const platformOperator = hasPlatformOperatorRole({ roleAssignments, profile });

    const staffRows = Array.isArray(staffAssignmentsResult.data) ? (staffAssignmentsResult.data as any[]) : [];

    if (staffRows.length === 0 && !platformOperator) {
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
    const staffMerchantIds = Array.from(new Set(staffRows.map((row) => stringOrEmpty(row?.merchant_id)).filter(Boolean)));
    const staffIds = Array.from(new Set(staffRows.map((row) => stringOrEmpty(row?.id)).filter(Boolean)));

    const allMerchantsResult = platformOperator
      ? await supabase.from('merchants').select('*').order('trade_name', { ascending: true })
      : ({ data: [], error: null } as any);

    if (allMerchantsResult.error) {
      return { error: allMerchantsResult.error };
    }

    const allMerchantRows = Array.isArray(allMerchantsResult.data) ? (allMerchantsResult.data as any[]) : [];
    const merchantIds = uniqueStrings([
      ...staffMerchantIds,
      ...(platformOperator ? allMerchantRows.map((row) => stringOrEmpty(row?.id)) : []),
    ]);

    const [merchantsResult, branchRelationsResult, branchesResult] = await Promise.all([
      merchantIds.length > 0
        ? supabase.from('merchants').select('*').in('id', merchantIds)
        : Promise.resolve({ data: [], error: null } as any),
      staffIds.length > 0
        ? supabase.from('merchant_staff_branches').select('*').in('merchant_staff_id', staffIds)
        : Promise.resolve({ data: [], error: null } as any),
      merchantIds.length > 0
        ? supabase.from('merchant_branches').select('*').in('merchant_id', merchantIds)
        : Promise.resolve({ data: [], error: null } as any),
    ]);

    if (merchantsResult.error) {
      return { error: merchantsResult.error };
    }
    if (branchRelationsResult.error) {
      return { error: branchRelationsResult.error };
    }
    if (branchesResult.error) {
      return { error: branchesResult.error };
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
    const merchantBranchRows = Array.isArray(branchesResult.data) ? (branchesResult.data as any[]) : [];

    const branchMap = new Map<string, MerchantBranch>(
      merchantBranchRows.map((row) => [
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
    const merchantBranchesMap = new Map<string, MerchantBranch[]>();
    merchantBranchRows.forEach((row) => {
      const merchantId = stringOrEmpty(row.merchant_id);
      const branch = branchMap.get(stringOrEmpty(row.id));
      if (!merchantId || !branch) return;
      const current = merchantBranchesMap.get(merchantId) ?? [];
      current.push(branch);
      merchantBranchesMap.set(merchantId, current);
    });

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
        const merchantBranches = merchantBranchesMap.get(staffAssignment.merchant_id) ?? [];
        const staffRoleCode = stringOrEmpty(staffRow.role ?? staffRow.staff_role).trim().toLowerCase();
        const relationBranchIds = uniqueStrings([
          ...relations.map((row) => stringOrEmpty(row.branch_id)),
          stringOrEmpty(staffRow.branch_id),
        ]).filter((branchId) => merchantBranches.some((branch) => branch.id === branchId));
        const resolvedBranchIds =
          relationBranchIds.length > 0
            ? relationBranchIds
            : staffRoleCode === 'owner' || staffRoleCode === 'manager'
              ? merchantBranches.map((branch) => branch.id)
              : [];
        const requestedPrimaryBranchId =
          stringOrEmpty(relations.find((row) => Boolean(row.is_primary))?.branch_id) ||
          stringOrEmpty(staffRow.branch_id);
        const primaryBranchId = resolvedBranchIds.includes(requestedPrimaryBranchId)
          ? requestedPrimaryBranchId
          : resolvedBranchIds[0] ?? null;
        const branches = resolvedBranchIds
          .map((branchId) => branchMap.get(branchId))
          .filter(Boolean) as MerchantBranch[];

        return {
          merchant,
          staffAssignment,
          branches,
          primaryBranchId,
        } satisfies PortalBusinessAssignment;
      })
      .filter(Boolean) as PortalBusinessAssignment[];

    if (platformOperator) {
      const existingMerchantIds = new Set(businessAssignments.map((assignment) => assignment.merchant.id));

      allMerchantRows.forEach((merchantRow) => {
        const merchantId = stringOrEmpty(merchantRow?.id);
        if (!merchantId || existingMerchantIds.has(merchantId)) {
          return;
        }

        const merchant = merchantMap.get(merchantId);
        if (!merchant) {
          return;
        }

        const branches = merchantBranchesMap.get(merchantId) ?? [];
        businessAssignments.push({
          merchant,
          staffAssignment: {
            id: `platform:${merchantId}`,
            user_id: userId,
            merchant_id: merchantId,
            role: 'manager',
            merchant,
          },
          branches,
          primaryBranchId: branches[0]?.id ?? null,
        });
      });
    }

    businessAssignments.sort((left, right) => left.merchant.name.localeCompare(right.merchant.name));

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
