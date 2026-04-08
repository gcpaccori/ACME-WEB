import { supabase } from '../../integrations/supabase/client';

export interface SystemSettingRecord {
  id: string;
  key: string;
  description: string;
  value_json: unknown;
  created_at: string;
  updated_at: string;
}

export interface AuditLogRecord {
  id: string;
  actor_user_id: string;
  actor_label: string;
  entity_type: string;
  entity_id: string;
  action: string;
  old_values_json: unknown;
  new_values_json: unknown;
  created_at: string;
}

export interface MerchantAuditLogRecord {
  id: string;
  branch_id: string;
  branch_label: string;
  user_id: string;
  user_label: string;
  entity_type: string;
  entity_id: string;
  action: string;
  metadata_json: unknown;
  created_at: string;
}

export interface AnalyticsEventRecord {
  id: string;
  user_id: string;
  user_label: string;
  order_id: string;
  order_code: string;
  event_name: string;
  properties_json: unknown;
  created_at: string;
}

export interface SystemOverview {
  settings: SystemSettingRecord[];
  audit_logs: AuditLogRecord[];
  merchant_audit_logs: MerchantAuditLogRecord[];
  analytics_events: AnalyticsEventRecord[];
}

export interface SystemSettingForm {
  id?: string;
  key: string;
  description: string;
  value_json_text: string;
}

function stringOrEmpty(value: unknown) {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

async function logSystemSideEffects(params: {
  actorUserId: string;
  merchantId: string;
  entityId: string;
  action: string;
  oldValues?: unknown;
  newValues?: unknown;
}) {
  const now = new Date().toISOString();
  await Promise.allSettled([
    supabase.from('audit_logs').insert({
      actor_user_id: params.actorUserId,
      entity_type: 'system_setting',
      entity_id: params.entityId,
      action: params.action,
      old_values_json: params.oldValues ?? null,
      new_values_json: params.newValues ?? null,
      ip_address: null,
      user_agent: null,
      created_at: now,
    }),
    supabase.from('merchant_audit_logs').insert({
      merchant_id: params.merchantId,
      branch_id: null,
      user_id: params.actorUserId,
      entity_type: 'system_setting',
      entity_id: params.entityId,
      action: params.action,
      metadata_json: params.newValues ?? null,
      created_at: now,
    }),
    supabase.from('analytics_events').insert({
      user_id: params.actorUserId,
      order_id: null,
      event_name: params.action,
      properties_json: {
        entity_type: 'system_setting',
        entity_id: params.entityId,
      },
      created_at: now,
    }),
  ]);
}

export const adminSystemService = {
  createEmptySettingForm: (): SystemSettingForm => ({
    key: '',
    description: '',
    value_json_text: '{\n  \n}',
  }),

  createSettingForm: (record: SystemSettingRecord): SystemSettingForm => ({
    id: record.id,
    key: record.key,
    description: record.description,
    value_json_text: JSON.stringify(record.value_json ?? {}, null, 2),
  }),

  fetchSystemOverview: async (merchantId: string) => {
    const [settingsResult, branchesResult, staffResult, merchantAuditResult] = await Promise.all([
      supabase.from('system_settings').select('*').order('key', { ascending: true }),
      supabase.from('merchant_branches').select('id, name').eq('merchant_id', merchantId),
      supabase.from('merchant_staff').select('user_id').eq('merchant_id', merchantId),
      supabase.from('merchant_audit_logs').select('*').eq('merchant_id', merchantId).order('created_at', { ascending: false }).limit(100),
    ]);

    if (settingsResult.error) return { data: null, error: settingsResult.error };
    if (branchesResult.error) return { data: null, error: branchesResult.error };
    if (staffResult.error) return { data: null, error: staffResult.error };
    if (merchantAuditResult.error) return { data: null, error: merchantAuditResult.error };

    const branchRows = (branchesResult.data ?? []) as any[];
    const branchMap = new Map<string, string>(branchRows.map((row) => [stringOrEmpty(row.id), stringOrEmpty(row.name) || stringOrEmpty(row.id)]));
    const staffUserIds = uniqueStrings(((staffResult.data ?? []) as any[]).map((row) => stringOrEmpty(row.user_id)));

    const orderResult = await supabase.from('orders').select('id, order_code').eq('merchant_id', merchantId).order('placed_at', { ascending: false }).limit(200);
    if (orderResult.error) return { data: null, error: orderResult.error };

    const orderRows = (orderResult.data ?? []) as any[];
    const orderIds = uniqueStrings(orderRows.map((row) => stringOrEmpty(row.id)));
    const orderMap = new Map<string, string>(orderRows.map((row) => [stringOrEmpty(row.id), stringOrEmpty(row.order_code || row.id)]));

    const [auditByActorResult, analyticsByActorResult, analyticsByOrderResult] = await Promise.all([
      staffUserIds.length > 0
        ? supabase.from('audit_logs').select('*').in('actor_user_id', staffUserIds).order('created_at', { ascending: false }).limit(100)
        : Promise.resolve({ data: [], error: null } as any),
      staffUserIds.length > 0
        ? supabase.from('analytics_events').select('*').in('user_id', staffUserIds).order('created_at', { ascending: false }).limit(100)
        : Promise.resolve({ data: [], error: null } as any),
      orderIds.length > 0
        ? supabase.from('analytics_events').select('*').in('order_id', orderIds).order('created_at', { ascending: false }).limit(100)
        : Promise.resolve({ data: [], error: null } as any),
    ]);

    if (auditByActorResult.error) return { data: null, error: auditByActorResult.error };
    if (analyticsByActorResult.error) return { data: null, error: analyticsByActorResult.error };
    if (analyticsByOrderResult.error) return { data: null, error: analyticsByOrderResult.error };

    const merchantAuditRows = (merchantAuditResult.data ?? []) as any[];
    const auditRows = (auditByActorResult.data ?? []) as any[];
    const analyticsRows = Array.from(
      new Map(
        [...((analyticsByActorResult.data ?? []) as any[]), ...((analyticsByOrderResult.data ?? []) as any[])].map((row) => [stringOrEmpty(row.id), row])
      ).values()
    );

    const profileIds = uniqueStrings([
      ...staffUserIds,
      ...merchantAuditRows.map((row) => stringOrEmpty(row.user_id)),
      ...auditRows.map((row) => stringOrEmpty(row.actor_user_id)),
      ...analyticsRows.map((row) => stringOrEmpty(row.user_id)),
    ]);

    const profilesResult =
      profileIds.length > 0
        ? await supabase.from('profiles').select('user_id, full_name, email').in('user_id', profileIds)
        : ({ data: [], error: null } as any);

    if (profilesResult.error) return { data: null, error: profilesResult.error };

    const profileMap = new Map<string, any>(((profilesResult.data ?? []) as any[]).map((row) => [stringOrEmpty(row.user_id), row]));

    const settings: SystemSettingRecord[] = ((settingsResult.data ?? []) as any[]).map((row) => ({
      id: stringOrEmpty(row.id),
      key: stringOrEmpty(row.key),
      description: stringOrEmpty(row.description),
      value_json: row.value_json ?? null,
      created_at: stringOrEmpty(row.created_at),
      updated_at: stringOrEmpty(row.updated_at),
    }));

    const auditLogs: AuditLogRecord[] = auditRows.map((row) => ({
      id: stringOrEmpty(row.id),
      actor_user_id: stringOrEmpty(row.actor_user_id),
      actor_label:
        stringOrEmpty(profileMap.get(stringOrEmpty(row.actor_user_id))?.full_name) ||
        stringOrEmpty(profileMap.get(stringOrEmpty(row.actor_user_id))?.email) ||
        stringOrEmpty(row.actor_user_id),
      entity_type: stringOrEmpty(row.entity_type),
      entity_id: stringOrEmpty(row.entity_id),
      action: stringOrEmpty(row.action),
      old_values_json: row.old_values_json ?? null,
      new_values_json: row.new_values_json ?? null,
      created_at: stringOrEmpty(row.created_at),
    }));

    const merchantAuditLogs: MerchantAuditLogRecord[] = merchantAuditRows.map((row) => ({
      id: stringOrEmpty(row.id),
      branch_id: stringOrEmpty(row.branch_id),
      branch_label: branchMap.get(stringOrEmpty(row.branch_id)) || 'Sin sucursal',
      user_id: stringOrEmpty(row.user_id),
      user_label:
        stringOrEmpty(profileMap.get(stringOrEmpty(row.user_id))?.full_name) ||
        stringOrEmpty(profileMap.get(stringOrEmpty(row.user_id))?.email) ||
        stringOrEmpty(row.user_id),
      entity_type: stringOrEmpty(row.entity_type),
      entity_id: stringOrEmpty(row.entity_id),
      action: stringOrEmpty(row.action),
      metadata_json: row.metadata_json ?? null,
      created_at: stringOrEmpty(row.created_at),
    }));

    const analyticsEvents: AnalyticsEventRecord[] = analyticsRows.map((row: any) => ({
      id: stringOrEmpty(row.id),
      user_id: stringOrEmpty(row.user_id),
      user_label:
        stringOrEmpty(profileMap.get(stringOrEmpty(row.user_id))?.full_name) ||
        stringOrEmpty(profileMap.get(stringOrEmpty(row.user_id))?.email) ||
        stringOrEmpty(row.user_id),
      order_id: stringOrEmpty(row.order_id),
      order_code: orderMap.get(stringOrEmpty(row.order_id)) || stringOrEmpty(row.order_id),
      event_name: stringOrEmpty(row.event_name),
      properties_json: row.properties_json ?? null,
      created_at: stringOrEmpty(row.created_at),
    }));

    return {
      data: {
        settings,
        audit_logs: auditLogs,
        merchant_audit_logs: merchantAuditLogs,
        analytics_events: analyticsEvents.sort((left, right) => String(right.created_at).localeCompare(String(left.created_at))),
      } satisfies SystemOverview,
      error: null,
    };
  },

  saveSetting: async (merchantId: string, actorUserId: string, form: SystemSettingForm) => {
    let parsedValue: unknown;
    try {
      parsedValue = JSON.parse(form.value_json_text);
    } catch {
      return { data: null, error: new Error('El JSON de configuracion no es valido') };
    }

    const now = new Date().toISOString();
    if (form.id) {
      const existingResult = await supabase.from('system_settings').select('*').eq('id', form.id).maybeSingle();
      if (existingResult.error) return existingResult;

      const updateResult = await supabase
        .from('system_settings')
        .update({
          key: form.key.trim(),
          description: form.description.trim(),
          value_json: parsedValue,
          updated_at: now,
        })
        .eq('id', form.id)
        .select('*')
        .single();

      if (updateResult.error) return updateResult;

      await logSystemSideEffects({
        actorUserId,
        merchantId,
        entityId: stringOrEmpty((updateResult.data as any)?.id),
        action: 'system_setting_updated',
        oldValues: existingResult.data,
        newValues: updateResult.data,
      });

      return updateResult;
    }

    const insertResult = await supabase
      .from('system_settings')
      .insert({
        key: form.key.trim(),
        description: form.description.trim(),
        value_json: parsedValue,
        created_at: now,
        updated_at: now,
      })
      .select('*')
      .single();

    if (insertResult.error) return insertResult;

    await logSystemSideEffects({
      actorUserId,
      merchantId,
      entityId: stringOrEmpty((insertResult.data as any)?.id),
      action: 'system_setting_created',
      newValues: insertResult.data,
    });

    return insertResult;
  },
};
