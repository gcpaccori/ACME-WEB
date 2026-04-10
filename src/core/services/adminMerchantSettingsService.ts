import { supabase } from '../../integrations/supabase/client';

const MERCHANT_SETTING_KEYS = new Set(['order_timeouts']);

export interface MerchantSettingRecord {
  id: string;
  merchant_id: string;
  key: string;
  description: string;
  value_json: unknown;
  created_at: string;
  updated_at: string;
}

export interface MerchantSettingAuditRecord {
  id: string;
  action: string;
  user_id: string;
  user_label: string;
  metadata_json: unknown;
  created_at: string;
}

export interface MerchantSettingsOverview {
  settings: MerchantSettingRecord[];
  audit_logs: MerchantSettingAuditRecord[];
}

export interface MerchantSettingForm {
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

async function logMerchantSettingSideEffects(params: {
  actorUserId: string;
  merchantId: string;
  entityId: string;
  action: string;
  oldValues?: unknown;
  newValues?: unknown;
}) {
  const now = new Date().toISOString();
  await Promise.allSettled([
    supabase.from('merchant_audit_logs').insert({
      merchant_id: params.merchantId,
      branch_id: null,
      user_id: params.actorUserId,
      entity_type: 'merchant_setting',
      entity_id: params.entityId,
      action: params.action,
      metadata_json: {
        old_values: params.oldValues ?? null,
        new_values: params.newValues ?? null,
      },
      created_at: now,
    }),
    supabase.from('analytics_events').insert({
      user_id: params.actorUserId,
      order_id: null,
      event_name: params.action,
      properties_json: {
        entity_type: 'merchant_setting',
        entity_id: params.entityId,
        merchant_id: params.merchantId,
      },
      created_at: now,
    }),
  ]);
}

export const adminMerchantSettingsService = {
  createEmptySettingForm: (): MerchantSettingForm => ({
    key: '',
    description: '',
    value_json_text: '{\n  \n}',
  }),

  createSettingForm: (record: MerchantSettingRecord): MerchantSettingForm => ({
    id: record.id,
    key: record.key,
    description: record.description,
    value_json_text: JSON.stringify(record.value_json ?? {}, null, 2),
  }),

  fetchOverview: async (merchantId: string) => {
    const [settingsResult, auditResult] = await Promise.all([
      supabase.from('merchant_settings').select('*').eq('merchant_id', merchantId).order('key', { ascending: true }),
      supabase
        .from('merchant_audit_logs')
        .select('id, user_id, action, metadata_json, created_at')
        .eq('merchant_id', merchantId)
        .eq('entity_type', 'merchant_setting')
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    if (settingsResult.error) {
      const settingsErrorMessage = `${settingsResult.error.message} ${String((settingsResult.error as any).details ?? '')}`.toLowerCase();
      if (!settingsErrorMessage.includes('merchant_settings')) {
        return { data: null, error: settingsResult.error };
      }

      const fallbackResult = await supabase
        .from('system_settings')
        .select('*')
        .in('key', Array.from(MERCHANT_SETTING_KEYS))
        .order('key', { ascending: true });

      if (fallbackResult.error) return { data: null, error: fallbackResult.error };
      if (auditResult.error) return { data: null, error: auditResult.error };

      const auditRows = (auditResult.data ?? []) as any[];
      const userIds = uniqueStrings(auditRows.map((row) => stringOrEmpty(row.user_id)));
      const profilesResult =
        userIds.length > 0
          ? await supabase.from('profiles').select('user_id, full_name, email').in('user_id', userIds)
          : ({ data: [], error: null } as any);

      if (profilesResult.error) return { data: null, error: profilesResult.error };

      const profileMap = new Map<string, any>(((profilesResult.data ?? []) as any[]).map((row) => [stringOrEmpty(row.user_id), row]));
      const settings: MerchantSettingRecord[] = ((fallbackResult.data ?? []) as any[]).map((row) => ({
        id: `fallback:${stringOrEmpty(row.id)}`,
        merchant_id: merchantId,
        key: stringOrEmpty(row.key),
        description: `${stringOrEmpty(row.description)} (heredado temporalmente desde system_settings)`.trim(),
        value_json: row.value_json ?? null,
        created_at: stringOrEmpty(row.created_at),
        updated_at: stringOrEmpty(row.updated_at),
      }));
      const audit_logs: MerchantSettingAuditRecord[] = auditRows.map((row) => ({
        id: stringOrEmpty(row.id),
        action: stringOrEmpty(row.action),
        user_id: stringOrEmpty(row.user_id),
        user_label:
          stringOrEmpty(profileMap.get(stringOrEmpty(row.user_id))?.full_name) ||
          stringOrEmpty(profileMap.get(stringOrEmpty(row.user_id))?.email) ||
          stringOrEmpty(row.user_id),
        metadata_json: row.metadata_json ?? null,
        created_at: stringOrEmpty(row.created_at),
      }));

      return {
        data: {
          settings,
          audit_logs,
        } satisfies MerchantSettingsOverview,
        error: null,
      };
    }
    if (auditResult.error) return { data: null, error: auditResult.error };

    const auditRows = (auditResult.data ?? []) as any[];
    const userIds = uniqueStrings(auditRows.map((row) => stringOrEmpty(row.user_id)));
    const profilesResult =
      userIds.length > 0
        ? await supabase.from('profiles').select('user_id, full_name, email').in('user_id', userIds)
        : ({ data: [], error: null } as any);

    if (profilesResult.error) return { data: null, error: profilesResult.error };

    const profileMap = new Map<string, any>(((profilesResult.data ?? []) as any[]).map((row) => [stringOrEmpty(row.user_id), row]));

    const settings: MerchantSettingRecord[] = ((settingsResult.data ?? []) as any[]).map((row) => ({
      id: stringOrEmpty(row.id),
      merchant_id: stringOrEmpty(row.merchant_id),
      key: stringOrEmpty(row.key),
      description: stringOrEmpty(row.description),
      value_json: row.value_json ?? null,
      created_at: stringOrEmpty(row.created_at),
      updated_at: stringOrEmpty(row.updated_at),
    }));

    const audit_logs: MerchantSettingAuditRecord[] = auditRows.map((row) => ({
      id: stringOrEmpty(row.id),
      action: stringOrEmpty(row.action),
      user_id: stringOrEmpty(row.user_id),
      user_label:
        stringOrEmpty(profileMap.get(stringOrEmpty(row.user_id))?.full_name) ||
        stringOrEmpty(profileMap.get(stringOrEmpty(row.user_id))?.email) ||
        stringOrEmpty(row.user_id),
      metadata_json: row.metadata_json ?? null,
      created_at: stringOrEmpty(row.created_at),
    }));

    return {
      data: {
        settings,
        audit_logs,
      } satisfies MerchantSettingsOverview,
      error: null,
    };
  },

  saveSetting: async (actorUserId: string, merchantId: string, form: MerchantSettingForm) => {
    if (String(form.id ?? '').startsWith('fallback:')) {
      return {
        data: null,
        error: new Error('La tabla merchant_settings todavia no existe en esta base. Ejecuta la migracion de Fase 9 antes de editar esta clave.'),
      };
    }

    let parsedValue: unknown;
    try {
      parsedValue = JSON.parse(form.value_json_text);
    } catch {
      return { data: null, error: new Error('El JSON de configuracion no es valido') };
    }

    const now = new Date().toISOString();
    if (form.id) {
      const existingResult = await supabase.from('merchant_settings').select('*').eq('id', form.id).eq('merchant_id', merchantId).maybeSingle();
      if (existingResult.error) return existingResult;

      const updateResult = await supabase
        .from('merchant_settings')
        .update({
          key: form.key.trim(),
          description: form.description.trim(),
          value_json: parsedValue,
          updated_at: now,
        })
        .eq('id', form.id)
        .eq('merchant_id', merchantId)
        .select('*')
        .single();

      if (updateResult.error) return updateResult;

      await logMerchantSettingSideEffects({
        actorUserId,
        merchantId,
        entityId: stringOrEmpty((updateResult.data as any)?.id),
        action: 'merchant_setting_updated',
        oldValues: existingResult.data,
        newValues: updateResult.data,
      });

      return updateResult;
    }

    const insertResult = await supabase
      .from('merchant_settings')
      .insert({
        merchant_id: merchantId,
        key: form.key.trim(),
        description: form.description.trim(),
        value_json: parsedValue,
        created_at: now,
        updated_at: now,
      })
      .select('*')
      .single();

    if (insertResult.error) return insertResult;

    await logMerchantSettingSideEffects({
      actorUserId,
      merchantId,
      entityId: stringOrEmpty((insertResult.data as any)?.id),
      action: 'merchant_setting_created',
      newValues: insertResult.data,
    });

    return insertResult;
  },
};
