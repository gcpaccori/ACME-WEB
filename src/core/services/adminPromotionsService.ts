import { supabase } from '../../integrations/supabase/client';

export interface PromotionAdminRecord {
  id: string;
  name: string;
  promo_type: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number | null;
  max_discount: number | null;
  starts_at: string;
  ends_at: string;
  usage_limit_total: number | null;
  usage_limit_per_user: number | null;
  is_active: boolean;
  scope_summary: string;
  target_count: number;
  coupon_count: number;
  redemption_count: number;
}

export interface PromotionTargetRecord {
  id: string;
  target_type: string;
  target_id: string;
  target_label: string;
  is_locked: boolean;
}

export interface PromotionCouponRecord {
  id: string;
  code: string;
  starts_at: string;
  ends_at: string;
  usage_limit_total: number | null;
  usage_limit_per_user: number | null;
  is_active: boolean;
  redemption_count: number;
  last_redeemed_at: string;
}

export interface PromotionRedemptionRecord {
  id: string;
  coupon_id: string;
  coupon_code: string;
  customer_id: string;
  customer_label: string;
  order_id: string;
  order_code: string;
  discount_amount: number;
  redeemed_at: string;
}

export interface PromotionLookupOption {
  id: string;
  label: string;
}

export interface PromotionAdminDetail {
  id: string;
  name: string;
  promo_type: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number | null;
  max_discount: number | null;
  starts_at: string;
  ends_at: string;
  usage_limit_total: number | null;
  usage_limit_per_user: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  targets: PromotionTargetRecord[];
  coupons: PromotionCouponRecord[];
  redemptions: PromotionRedemptionRecord[];
  branch_options: PromotionLookupOption[];
  category_options: PromotionLookupOption[];
  product_options: PromotionLookupOption[];
}

export interface PromotionForm {
  id?: string;
  name: string;
  promo_type: string;
  discount_type: string;
  discount_value: string;
  min_order_amount: string;
  max_discount: string;
  starts_at: string;
  ends_at: string;
  usage_limit_total: string;
  usage_limit_per_user: string;
  is_active: boolean;
}

export interface PromotionTargetForm {
  id?: string;
  target_type: string;
  target_id: string;
}

export interface PromotionCouponForm {
  id?: string;
  code: string;
  starts_at: string;
  ends_at: string;
  usage_limit_total: string;
  usage_limit_per_user: string;
  is_active: boolean;
}

function stringOrEmpty(value: unknown) {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

function nullableString(value: string) {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function numberOrZero(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function stringNumberOrNull(value: string) {
  const normalized = value.trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function isTargetRelevant(targetType: string, targetId: string, merchantId: string, branchIds: Set<string>, categoryIds: Set<string>, productIds: Set<string>) {
  if (!targetId) return false;
  const normalized = targetType.trim().toLowerCase();
  if (normalized === 'merchant') return targetId === merchantId;
  if (normalized === 'branch') return branchIds.has(targetId);
  if (normalized === 'category') return categoryIds.has(targetId);
  if (normalized === 'product') return productIds.has(targetId);
  return false;
}

function resolveTargetLabel(
  targetType: string,
  targetId: string,
  merchantId: string,
  branchMap: Map<string, string>,
  categoryMap: Map<string, string>,
  productMap: Map<string, string>
) {
  const normalized = targetType.trim().toLowerCase();
  if (normalized === 'merchant') {
    return targetId === merchantId ? 'Comercio actual' : 'Otro comercio';
  }
  if (normalized === 'branch') {
    return branchMap.get(targetId) || 'Sucursal no encontrada';
  }
  if (normalized === 'category') {
    return categoryMap.get(targetId) || 'Categoria no encontrada';
  }
  if (normalized === 'product') {
    return productMap.get(targetId) || 'Producto no encontrado';
  }
  return targetId || 'Sin destino';
}

async function fetchPromotionLookups(merchantId: string) {
  const [branchesResult, categoriesResult, productsResult] = await Promise.all([
    supabase.from('merchant_branches').select('id, name').eq('merchant_id', merchantId).order('name', { ascending: true }),
    supabase.from('categories').select('id, name').eq('merchant_id', merchantId).order('name', { ascending: true }),
    supabase.from('products').select('id, name').eq('merchant_id', merchantId).order('name', { ascending: true }),
  ]);

  if (branchesResult.error) return { data: null, error: branchesResult.error };
  if (categoriesResult.error) return { data: null, error: categoriesResult.error };
  if (productsResult.error) return { data: null, error: productsResult.error };

  const branchOptions: PromotionLookupOption[] = ((branchesResult.data ?? []) as any[]).map((row) => ({
    id: String(row.id),
    label: stringOrEmpty(row.name) || String(row.id),
  }));

  const categoryOptions: PromotionLookupOption[] = ((categoriesResult.data ?? []) as any[]).map((row) => ({
    id: String(row.id),
    label: stringOrEmpty(row.name) || String(row.id),
  }));

  const productOptions: PromotionLookupOption[] = ((productsResult.data ?? []) as any[]).map((row) => ({
    id: String(row.id),
    label: stringOrEmpty(row.name) || String(row.id),
  }));

  return {
    data: {
      branchOptions,
      categoryOptions,
      productOptions,
      branchMap: new Map<string, string>(branchOptions.map((item) => [item.id, item.label])),
      categoryMap: new Map<string, string>(categoryOptions.map((item) => [item.id, item.label])),
      productMap: new Map<string, string>(productOptions.map((item) => [item.id, item.label])),
    },
    error: null,
  };
}

export const adminPromotionsService = {
  createEmptyPromotionForm: (): PromotionForm => ({
    name: '',
    promo_type: 'automatic',
    discount_type: 'percent',
    discount_value: '0',
    min_order_amount: '',
    max_discount: '',
    starts_at: '',
    ends_at: '',
    usage_limit_total: '',
    usage_limit_per_user: '',
    is_active: true,
  }),

  createEmptyTargetForm: (): PromotionTargetForm => ({
    target_type: 'branch',
    target_id: '',
  }),

  createEmptyCouponForm: (): PromotionCouponForm => ({
    code: '',
    starts_at: '',
    ends_at: '',
    usage_limit_total: '',
    usage_limit_per_user: '',
    is_active: true,
  }),

  createPromotionForm: (detail: PromotionAdminDetail): PromotionForm => ({
    id: detail.id,
    name: detail.name,
    promo_type: detail.promo_type,
    discount_type: detail.discount_type,
    discount_value: String(detail.discount_value ?? 0),
    min_order_amount: detail.min_order_amount == null ? '' : String(detail.min_order_amount),
    max_discount: detail.max_discount == null ? '' : String(detail.max_discount),
    starts_at: detail.starts_at,
    ends_at: detail.ends_at,
    usage_limit_total: detail.usage_limit_total == null ? '' : String(detail.usage_limit_total),
    usage_limit_per_user: detail.usage_limit_per_user == null ? '' : String(detail.usage_limit_per_user),
    is_active: detail.is_active,
  }),

  createTargetForm: (record: PromotionTargetRecord): PromotionTargetForm => ({
    id: record.id,
    target_type: record.target_type,
    target_id: record.target_id,
  }),

  createCouponForm: (record: PromotionCouponRecord): PromotionCouponForm => ({
    id: record.id,
    code: record.code,
    starts_at: record.starts_at,
    ends_at: record.ends_at,
    usage_limit_total: record.usage_limit_total == null ? '' : String(record.usage_limit_total),
    usage_limit_per_user: record.usage_limit_per_user == null ? '' : String(record.usage_limit_per_user),
    is_active: record.is_active,
  }),

  fetchPromotions: async (merchantId: string) => {
    const lookupsResult = await fetchPromotionLookups(merchantId);
    if (lookupsResult.error) return { data: null, error: lookupsResult.error };

    const { branchOptions, categoryOptions, productOptions, branchMap, categoryMap, productMap } = lookupsResult.data!;
    const branchIds = new Set(branchOptions.map((item) => item.id));
    const categoryIds = new Set(categoryOptions.map((item) => item.id));
    const productIds = new Set(productOptions.map((item) => item.id));

    const [promotionsResult, targetsResult, couponsResult, redemptionsResult] = await Promise.all([
      supabase.from('promotions').select('*').order('created_at', { ascending: false }),
      supabase.from('promotion_targets').select('*').order('created_at', { ascending: true }),
      supabase.from('coupons').select('*').order('created_at', { ascending: false }),
      supabase.from('coupon_redemptions').select('id, coupon_id'),
    ]);

    if (promotionsResult.error) return { data: null, error: promotionsResult.error };
    if (targetsResult.error) return { data: null, error: targetsResult.error };
    if (couponsResult.error) return { data: null, error: couponsResult.error };
    if (redemptionsResult.error) return { data: null, error: redemptionsResult.error };

    const targetRows = (targetsResult.data ?? []) as any[];
    const relevantTargetRows = targetRows.filter((row) =>
      isTargetRelevant(stringOrEmpty(row.target_type), stringOrEmpty(row.target_id), merchantId, branchIds, categoryIds, productIds)
    );
    const relevantPromotionIds = new Set(relevantTargetRows.map((row) => String(row.promotion_id)));

    const couponRows = (couponsResult.data ?? []) as any[];
    const redemptionsRows = (redemptionsResult.data ?? []) as any[];

    const data: PromotionAdminRecord[] = ((promotionsResult.data ?? []) as any[])
      .filter((row) => relevantPromotionIds.has(String(row.id)))
      .map((row) => {
        const promotionId = String(row.id);
        const promotionTargets = relevantTargetRows.filter((target) => String(target.promotion_id) === promotionId);
        const promotionCoupons = couponRows.filter((coupon) => String(coupon.promotion_id) === promotionId);
        const couponIdSet = new Set(promotionCoupons.map((coupon) => String(coupon.id)));
        const redemptionCount = redemptionsRows.filter((redemption) => couponIdSet.has(String(redemption.coupon_id))).length;
        const scopeSummary = promotionTargets
          .slice(0, 2)
          .map((target) =>
            resolveTargetLabel(
              stringOrEmpty(target.target_type),
              stringOrEmpty(target.target_id),
              merchantId,
              branchMap,
              categoryMap,
              productMap
            )
          )
          .join(', ');

        return {
          id: promotionId,
          name: stringOrEmpty(row.name) || 'Promocion',
          promo_type: stringOrEmpty(row.promo_type),
          discount_type: stringOrEmpty(row.discount_type),
          discount_value: numberOrZero(row.discount_value),
          min_order_amount: row.min_order_amount == null ? null : numberOrZero(row.min_order_amount),
          max_discount: row.max_discount == null ? null : numberOrZero(row.max_discount),
          starts_at: stringOrEmpty(row.starts_at),
          ends_at: stringOrEmpty(row.ends_at),
          usage_limit_total: row.usage_limit_total == null ? null : numberOrZero(row.usage_limit_total),
          usage_limit_per_user: row.usage_limit_per_user == null ? null : numberOrZero(row.usage_limit_per_user),
          is_active: Boolean(row.is_active ?? false),
          scope_summary: scopeSummary || 'Sin segmentacion visible',
          target_count: promotionTargets.length,
          coupon_count: promotionCoupons.length,
          redemption_count: redemptionCount,
        };
      });

    return { data, error: null };
  },

  fetchPromotionDetail: async (merchantId: string, promotionId: string) => {
    const lookupsResult = await fetchPromotionLookups(merchantId);
    if (lookupsResult.error) return { data: null, error: lookupsResult.error };

    const { branchOptions, categoryOptions, productOptions, branchMap, categoryMap, productMap } = lookupsResult.data!;
    const branchIds = new Set(branchOptions.map((item) => item.id));
    const categoryIds = new Set(categoryOptions.map((item) => item.id));
    const productIds = new Set(productOptions.map((item) => item.id));

    const [promotionResult, targetsResult, couponsResult] = await Promise.all([
      supabase.from('promotions').select('*').eq('id', promotionId).maybeSingle(),
      supabase.from('promotion_targets').select('*').eq('promotion_id', promotionId).order('created_at', { ascending: true }),
      supabase.from('coupons').select('*').eq('promotion_id', promotionId).order('created_at', { ascending: false }),
    ]);

    if (promotionResult.error) return { data: null, error: promotionResult.error };
    if (targetsResult.error) return { data: null, error: targetsResult.error };
    if (couponsResult.error) return { data: null, error: couponsResult.error };
    if (!promotionResult.data) return { data: null, error: null };

    const targetRows = (targetsResult.data ?? []) as any[];
    const couponRows = (couponsResult.data ?? []) as any[];
    const hasRelevantTarget = targetRows.some((row) =>
      isTargetRelevant(stringOrEmpty(row.target_type), stringOrEmpty(row.target_id), merchantId, branchIds, categoryIds, productIds)
    );

    if (targetRows.length > 0 && !hasRelevantTarget) {
      return { data: null, error: null };
    }

    const couponIds = uniqueStrings(couponRows.map((row) => String(row.id)).filter(Boolean));
    const redemptionsResult =
      couponIds.length > 0
        ? await supabase.from('coupon_redemptions').select('*').in('coupon_id', couponIds).order('redeemed_at', { ascending: false })
        : ({ data: [], error: null } as any);

    if (redemptionsResult.error) return { data: null, error: redemptionsResult.error };

    const redemptionsRows = (redemptionsResult.data ?? []) as any[];
    const customerIds = uniqueStrings(redemptionsRows.map((row) => String(row.customer_id)).filter(Boolean));
    const orderIds = uniqueStrings(redemptionsRows.map((row) => String(row.order_id)).filter(Boolean));

    const [profilesResult, ordersResult] = await Promise.all([
      customerIds.length > 0
        ? supabase.from('profiles').select('user_id, full_name, email').in('user_id', customerIds)
        : Promise.resolve({ data: [], error: null } as any),
      orderIds.length > 0
        ? supabase.from('orders').select('id, order_code').in('id', orderIds)
        : Promise.resolve({ data: [], error: null } as any),
    ]);

    if (profilesResult.error) return { data: null, error: profilesResult.error };
    if (ordersResult.error) return { data: null, error: ordersResult.error };

    const profileMap = new Map<string, any>(((profilesResult.data ?? []) as any[]).map((row) => [String(row.user_id), row]));
    const orderMap = new Map<string, string>(((ordersResult.data ?? []) as any[]).map((row) => [String(row.id), stringOrEmpty(row.order_code || row.id)]));

    const targets: PromotionTargetRecord[] = targetRows.map((row) => ({
      id: String(row.id),
      target_type: stringOrEmpty(row.target_type),
      target_id: stringOrEmpty(row.target_id),
      target_label: resolveTargetLabel(stringOrEmpty(row.target_type), stringOrEmpty(row.target_id), merchantId, branchMap, categoryMap, productMap),
      is_locked: stringOrEmpty(row.target_type).trim().toLowerCase() === 'merchant' && stringOrEmpty(row.target_id) === merchantId,
    }));

    const coupons: PromotionCouponRecord[] = couponRows.map((row) => {
      const redemptions = redemptionsRows.filter((redemption) => String(redemption.coupon_id) === String(row.id));
      return {
        id: String(row.id),
        code: stringOrEmpty(row.code),
        starts_at: stringOrEmpty(row.starts_at),
        ends_at: stringOrEmpty(row.ends_at),
        usage_limit_total: row.usage_limit_total == null ? null : numberOrZero(row.usage_limit_total),
        usage_limit_per_user: row.usage_limit_per_user == null ? null : numberOrZero(row.usage_limit_per_user),
        is_active: Boolean(row.is_active ?? false),
        redemption_count: redemptions.length,
        last_redeemed_at: stringOrEmpty(redemptions[0]?.redeemed_at),
      };
    });

    const couponCodeMap = new Map<string, string>(coupons.map((coupon) => [coupon.id, coupon.code]));

    const redemptions: PromotionRedemptionRecord[] = redemptionsRows.map((row) => {
      const profile = profileMap.get(String(row.customer_id));
      return {
        id: String(row.id),
        coupon_id: stringOrEmpty(row.coupon_id),
        coupon_code: couponCodeMap.get(String(row.coupon_id)) || 'Sin cupon',
        customer_id: stringOrEmpty(row.customer_id),
        customer_label: stringOrEmpty(profile?.full_name) || stringOrEmpty(profile?.email) || stringOrEmpty(row.customer_id),
        order_id: stringOrEmpty(row.order_id),
        order_code: orderMap.get(String(row.order_id)) || '',
        discount_amount: numberOrZero(row.discount_amount),
        redeemed_at: stringOrEmpty(row.redeemed_at),
      };
    });

    const promotion: any = promotionResult.data;
    const detail: PromotionAdminDetail = {
      id: String(promotion.id),
      name: stringOrEmpty(promotion.name) || 'Promocion',
      promo_type: stringOrEmpty(promotion.promo_type),
      discount_type: stringOrEmpty(promotion.discount_type),
      discount_value: numberOrZero(promotion.discount_value),
      min_order_amount: promotion.min_order_amount == null ? null : numberOrZero(promotion.min_order_amount),
      max_discount: promotion.max_discount == null ? null : numberOrZero(promotion.max_discount),
      starts_at: stringOrEmpty(promotion.starts_at),
      ends_at: stringOrEmpty(promotion.ends_at),
      usage_limit_total: promotion.usage_limit_total == null ? null : numberOrZero(promotion.usage_limit_total),
      usage_limit_per_user: promotion.usage_limit_per_user == null ? null : numberOrZero(promotion.usage_limit_per_user),
      is_active: Boolean(promotion.is_active ?? false),
      created_at: stringOrEmpty(promotion.created_at),
      updated_at: stringOrEmpty(promotion.updated_at),
      targets,
      coupons,
      redemptions,
      branch_options: branchOptions,
      category_options: categoryOptions,
      product_options: productOptions,
    };

    return { data: detail, error: null };
  },

  savePromotion: async (merchantId: string, form: PromotionForm) => {
    const now = new Date().toISOString();
    const payload = {
      name: form.name.trim(),
      promo_type: form.promo_type.trim(),
      discount_type: form.discount_type.trim(),
      discount_value: numberOrZero(form.discount_value),
      min_order_amount: stringNumberOrNull(form.min_order_amount),
      max_discount: stringNumberOrNull(form.max_discount),
      starts_at: nullableString(form.starts_at),
      ends_at: nullableString(form.ends_at),
      usage_limit_total: stringNumberOrNull(form.usage_limit_total),
      usage_limit_per_user: stringNumberOrNull(form.usage_limit_per_user),
      is_active: form.is_active,
      updated_at: now,
    };

    if (form.id) {
      return supabase.from('promotions').update(payload).eq('id', form.id).select('id').single();
    }

    const insertPromotion = await supabase
      .from('promotions')
      .insert({
        ...payload,
        created_at: now,
      })
      .select('id')
      .single();

    if (insertPromotion.error) return insertPromotion;

    const promotionId = String((insertPromotion.data as any)?.id ?? '');
    const ownerTarget = await supabase
      .from('promotion_targets')
      .insert({
        promotion_id: promotionId,
        target_type: 'merchant',
        target_id: merchantId,
        created_at: now,
      })
      .select('id')
      .single();

    if (ownerTarget.error) return ownerTarget;
    return insertPromotion;
  },

  savePromotionTarget: async (merchantId: string, promotionId: string, form: PromotionTargetForm) => {
    const now = new Date().toISOString();
    const payload = {
      promotion_id: promotionId,
      target_type: form.target_type.trim(),
      target_id: form.target_type.trim().toLowerCase() === 'merchant' ? merchantId : form.target_id,
    };

    if (form.id) {
      return supabase.from('promotion_targets').update(payload).eq('id', form.id).select('id').single();
    }

    const existing = await supabase
      .from('promotion_targets')
      .select('id')
      .eq('promotion_id', promotionId)
      .eq('target_type', payload.target_type)
      .eq('target_id', payload.target_id)
      .maybeSingle();

    if (existing.error) return existing;
    if (existing.data) return { data: existing.data, error: null };

    return supabase
      .from('promotion_targets')
      .insert({
        ...payload,
        created_at: now,
      })
      .select('id')
      .single();
  },

  deletePromotionTarget: async (targetId: string) => {
    return supabase.from('promotion_targets').delete().eq('id', targetId);
  },

  saveCoupon: async (promotionId: string, form: PromotionCouponForm) => {
    const now = new Date().toISOString();
    const payload = {
      promotion_id: promotionId,
      code: form.code.trim().toUpperCase(),
      starts_at: nullableString(form.starts_at),
      ends_at: nullableString(form.ends_at),
      usage_limit_total: stringNumberOrNull(form.usage_limit_total),
      usage_limit_per_user: stringNumberOrNull(form.usage_limit_per_user),
      is_active: form.is_active,
      updated_at: now,
    };

    if (form.id) {
      return supabase.from('coupons').update(payload).eq('id', form.id).select('id').single();
    }

    const existing = await supabase.from('coupons').select('id').eq('promotion_id', promotionId).eq('code', payload.code).maybeSingle();
    if (existing.error) return existing;
    if (existing.data) {
      return supabase.from('coupons').update(payload).eq('id', (existing.data as any).id).select('id').single();
    }

    return supabase
      .from('coupons')
      .insert({
        ...payload,
        created_at: now,
      })
      .select('id')
      .single();
  },
};
