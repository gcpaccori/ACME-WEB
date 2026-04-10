import { supabase } from '../../integrations/supabase/client';

export interface SecurityRoleRecord {
  id: string;
  code: string;
  name: string;
}

export interface SecurityRoleForm {
  id?: string;
  code: string;
  name: string;
}

export interface SecurityAccessRecord {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  default_role: string;
  is_active: boolean;
  role_ids: string[];
  role_codes: string[];
  role_labels: string[];
  layers: string[];
  merchant_labels: string[];
}

export interface SecurityAccessForm {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  default_role: string;
  is_active: boolean;
  role_ids: string[];
}

export interface SecurityOverview {
  roles: SecurityRoleRecord[];
  access_records: SecurityAccessRecord[];
}

function stringOrEmpty(value: unknown) {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function mapRoleRows(rows: any[]): SecurityRoleRecord[] {
  return rows
    .map((row) => ({
      id: stringOrEmpty(row.id),
      code: stringOrEmpty(row.code),
      name: stringOrEmpty(row.name),
    }))
    .filter((row) => row.id && row.code)
    .sort((left, right) => left.name.localeCompare(right.name));
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

export const adminSecurityService = {
  createRoleForm: (record?: SecurityRoleRecord): SecurityRoleForm => ({
    id: record?.id,
    code: record?.code ?? '',
    name: record?.name ?? '',
  }),

  createAccessForm: (record: SecurityAccessRecord): SecurityAccessForm => ({
    user_id: record.user_id,
    full_name: record.full_name,
    email: record.email,
    phone: record.phone,
    default_role: record.default_role,
    is_active: record.is_active,
    role_ids: record.role_ids,
  }),

  fetchSecurityOverview: async () => {
    const [rolesResult, profilesResult, userRolesResult, staffResult, merchantsResult, driversResult, customersResult] = await Promise.all([
      supabase.from('roles').select('id, code, name').order('name', { ascending: true }),
      supabase.from('profiles').select('user_id, full_name, email, phone, default_role, is_active').order('full_name', { ascending: true }).order('email', { ascending: true }),
      supabase.from('user_roles').select('id, user_id, role_id'),
      supabase.from('merchant_staff').select('user_id, merchant_id, staff_role, is_active'),
      supabase.from('merchants').select('id, trade_name, legal_name'),
      supabase.from('drivers').select('user_id, status'),
      supabase.from('customers').select('user_id'),
    ]);

    if (rolesResult.error) return { data: null, error: rolesResult.error };
    if (profilesResult.error) return { data: null, error: profilesResult.error };
    if (userRolesResult.error) return { data: null, error: userRolesResult.error };
    if (staffResult.error) return { data: null, error: staffResult.error };
    if (merchantsResult.error) return { data: null, error: merchantsResult.error };
    if (driversResult.error) return { data: null, error: driversResult.error };
    if (customersResult.error) return { data: null, error: customersResult.error };

    const roles = mapRoleRows((rolesResult.data ?? []) as any[]);
    const roleMap = new Map<string, SecurityRoleRecord>(roles.map((role) => [role.id, role]));
    const merchantMap = new Map<string, string>(
      ((merchantsResult.data ?? []) as any[]).map((row) => [stringOrEmpty(row.id), stringOrEmpty(row.trade_name) || stringOrEmpty(row.legal_name) || stringOrEmpty(row.id)])
    );
    const userRoleRows = (userRolesResult.data ?? []) as any[];
    const staffRows = (staffResult.data ?? []) as any[];
    const driverRows = (driversResult.data ?? []) as any[];
    const customerUserIds = new Set(((customersResult.data ?? []) as any[]).map((row) => stringOrEmpty(row.user_id)));

    const access_records: SecurityAccessRecord[] = ((profilesResult.data ?? []) as any[]).map((row) => {
      const userId = stringOrEmpty(row.user_id);
      const roleRows = userRoleRows.filter((item) => stringOrEmpty(item.user_id) === userId);
      const resolvedRoles = uniqueStrings(roleRows.map((item) => stringOrEmpty(item.role_id)))
        .map((roleId) => roleMap.get(roleId))
        .filter(Boolean) as SecurityRoleRecord[];
      const staffAssignments = staffRows.filter((item) => stringOrEmpty(item.user_id) === userId);
      const driverRow = driverRows.find((item) => stringOrEmpty(item.user_id) === userId);
      const layers = [];

      if (resolvedRoles.some((role) => ['admin', 'super_admin'].includes(role.code)) || ['admin', 'super_admin'].includes(stringOrEmpty(row.default_role))) {
        layers.push('Plataforma');
      }
      if (staffAssignments.length > 0) {
        layers.push('Negocio');
      }
      if (driverRow) {
        layers.push('Reparto');
      }
      if (customerUserIds.has(userId)) {
        layers.push('Cliente');
      }

      return {
        user_id: userId,
        full_name: stringOrEmpty(row.full_name),
        email: stringOrEmpty(row.email),
        phone: stringOrEmpty(row.phone),
        default_role: stringOrEmpty(row.default_role) || 'customer',
        is_active: Boolean(row.is_active ?? true),
        role_ids: resolvedRoles.map((role) => role.id),
        role_codes: resolvedRoles.map((role) => role.code),
        role_labels: resolvedRoles.map((role) => role.name),
        layers: uniqueStrings(layers),
        merchant_labels: uniqueStrings(staffAssignments.map((item) => merchantMap.get(stringOrEmpty(item.merchant_id)) || 'Comercio')),
      } satisfies SecurityAccessRecord;
    });

    return {
      data: {
        roles,
        access_records: access_records.sort((left, right) => {
          const leftLabel = (left.full_name || left.email || left.user_id).toLowerCase();
          const rightLabel = (right.full_name || right.email || right.user_id).toLowerCase();
          return leftLabel.localeCompare(rightLabel);
        }),
      } satisfies SecurityOverview,
      error: null,
    };
  },

  saveAccess: async (form: SecurityAccessForm) => {
    const updateProfile = await supabase
      .from('profiles')
      .update({
        default_role: form.default_role,
        is_active: form.is_active,
      })
      .eq('user_id', form.user_id)
      .select('user_id')
      .single();

    if (updateProfile.error) return { data: null, error: updateProfile.error };

    const syncRolesResult = await syncUserRolesForUser(form.user_id, form.role_ids);
    if (syncRolesResult.error) return syncRolesResult;

    return { data: { user_id: form.user_id }, error: null };
  },

  saveRole: async (form: SecurityRoleForm) => {
    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
    };

    if (form.id) {
      return supabase.from('roles').update(payload).eq('id', form.id).select('id').single();
    }

    return supabase.from('roles').insert(payload).select('id').single();
  },
};
