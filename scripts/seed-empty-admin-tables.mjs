import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const envPath = path.join(process.cwd(), '.env');
const envText = fs.readFileSync(envPath, 'utf8');

for (const line of envText.split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (!match) continue;
  let [, key, value] = match;
  key = key.trim();
  value = value.trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  process.env[key] = value;
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const now = new Date();
const nowIso = now.toISOString();
const marker = 'SEED_ADMIN_DEMO_2026_04_08';

const targetTables = [
  'analytics_events',
  'audit_logs',
  'branch_delivery_zones',
  'cart_item_modifiers',
  'cart_items',
  'carts',
  'cash_collections',
  'commission_rules',
  'conversation_participants',
  'conversations',
  'coupon_redemptions',
  'coupons',
  'customer_addresses',
  'customer_payment_methods',
  'delivery_zones',
  'driver_current_state',
  'driver_documents',
  'driver_locations',
  'driver_settlement_items',
  'driver_settlements',
  'driver_shifts',
  'drivers',
  'merchant_audit_logs',
  'merchant_branch_closures',
  'merchant_settlement_items',
  'merchant_settlements',
  'message_reads',
  'messages',
  'modifier_groups',
  'modifier_options',
  'notifications',
  'order_assignments',
  'order_cancellations',
  'order_delivery_details',
  'order_evidences',
  'order_incidents',
  'order_item_modifiers',
  'payment_transactions',
  'payments',
  'product_branch_settings',
  'product_modifier_groups',
  'promotion_targets',
  'promotions',
  'refunds',
  'user_roles',
  'vehicles',
];

function isoPlus(hoursOffset) {
  return new Date(now.getTime() + hoursOffset * 60 * 60 * 1000).toISOString();
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function assertData(value, message) {
  if (!value) throw new Error(message);
  return value;
}

async function failOnError(result, context) {
  const resolved = await result;
  if (resolved.error) {
    throw new Error(`${context}: ${resolved.error.message}`);
  }
  return resolved.data;
}

async function countTable(table) {
  const result = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (result.error) {
    throw new Error(`No se pudo contar ${table}: ${result.error.message}`);
  }
  return result.count ?? 0;
}

async function insertMany(table, rows) {
  if (!rows.length) return [];
  const result = await supabase.from(table).insert(rows).select();
  return failOnError(result, `No se pudo insertar en ${table}`);
}

async function updateRows(table, values, filters) {
  let query = supabase.from(table).update(values);
  for (const filter of filters) {
    query = query.eq(filter.column, filter.value);
  }
  const result = await query.select();
  return failOnError(result, `No se pudo actualizar ${table}`);
}

async function ensureAuthUser(email, password, phone) {
  const listResult = await supabase.auth.admin.listUsers();
  if (listResult.error) {
    throw new Error(`No se pudo listar auth users: ${listResult.error.message}`);
  }
  const existing = (listResult.data?.users ?? []).find((user) => user.email === email);
  if (existing) {
    return existing.id;
  }
  const createResult = await supabase.auth.admin.createUser({
    email,
    password,
    phone,
    email_confirm: true,
    user_metadata: {
      seeded: true,
      marker,
    },
  });
  if (createResult.error) {
    throw new Error(`No se pudo crear auth user ${email}: ${createResult.error.message}`);
  }
  return createResult.data.user.id;
}

async function main() {
  const emptyCounts = {};
  for (const table of targetTables) {
    emptyCounts[table] = await countTable(table);
  }

  const [merchants, branches, staffRows, customerRows, productRows, paymentMethodRows, roleRows, vehicleTypeRows, maxOrderCodeRows] =
    await Promise.all([
      failOnError(supabase.from('merchants').select('*').order('created_at', { ascending: true }).limit(1), 'No se pudo leer merchants'),
      failOnError(supabase.from('merchant_branches').select('*').order('created_at', { ascending: true }).limit(5), 'No se pudo leer merchant_branches'),
      failOnError(supabase.from('merchant_staff').select('*').order('created_at', { ascending: true }), 'No se pudo leer merchant_staff'),
      failOnError(supabase.from('customers').select('*').order('created_at', { ascending: true }).limit(4), 'No se pudo leer customers'),
      failOnError(supabase.from('products').select('*').order('created_at', { ascending: true }).limit(6), 'No se pudo leer products'),
      failOnError(supabase.from('payment_methods').select('*').order('created_at', { ascending: true }), 'No se pudo leer payment_methods'),
      failOnError(supabase.from('roles').select('*').order('created_at', { ascending: true }), 'No se pudo leer roles'),
      failOnError(supabase.from('vehicle_types').select('*').order('created_at', { ascending: true }), 'No se pudo leer vehicle_types'),
      failOnError(supabase.from('orders').select('order_code').order('order_code', { ascending: false }).limit(1), 'No se pudo leer orders'),
    ]);

  const merchant = assertData(merchants[0], 'No hay merchants para colgar el seed');
  const branch = assertData(branches.find((item) => item.merchant_id === merchant.id) ?? branches[0], 'No hay branch disponible');
  const actor = assertData(staffRows.find((item) => item.merchant_id === merchant.id) ?? staffRows[0], 'No hay staff disponible');
  const customers = customerRows.slice(0, 3);
  if (customers.length < 2) throw new Error('Se necesitan al menos 2 customers para sembrar datos demo');
  const products = productRows.slice(0, 4);
  if (products.length < 3) throw new Error('Se necesitan al menos 3 products para sembrar datos demo');

  const paymentMethodsByCode = new Map(paymentMethodRows.map((item) => [item.code, item]));
  const rolesByCode = new Map(roleRows.map((item) => [item.code, item]));
  const vehicleTypesByCode = new Map(vehicleTypeRows.map((item) => [item.code, item]));
  const maxOrderCode = Number(maxOrderCodeRows[0]?.order_code ?? 0);
  const inserted = {};

  let seedAddresses = await failOnError(
    supabase.from('addresses').select('*').ilike('reference', `${marker}%`).order('created_at', { ascending: true }),
    'No se pudo leer direcciones seed'
  );
  if (seedAddresses.length < 5) {
    seedAddresses = await insertMany('addresses', [
      {
        id: randomUUID(),
        line1: 'Av. Ferrocarril 1240',
        line2: 'Dpto 302',
        reference: `${marker} Cliente Mariana`,
        district: 'Huancayo',
        city: 'Huancayo',
        region: 'Junin',
        country: 'Peru',
        lat: -12.0652,
        lng: -75.2049,
        created_at: nowIso,
        updated_at: nowIso,
      },
      {
        id: randomUUID(),
        line1: 'Jr. Libertad 550',
        line2: null,
        reference: `${marker} Cliente Jose`,
        district: 'El Tambo',
        city: 'Huancayo',
        region: 'Junin',
        country: 'Peru',
        lat: -12.0568,
        lng: -75.2201,
        created_at: nowIso,
        updated_at: nowIso,
      },
      {
        id: randomUUID(),
        line1: 'Av. Giraldez 320',
        line2: null,
        reference: `${marker} Entrega orden A`,
        district: 'Huancayo',
        city: 'Huancayo',
        region: 'Junin',
        country: 'Peru',
        lat: -12.0671,
        lng: -75.2102,
        created_at: nowIso,
        updated_at: nowIso,
      },
      {
        id: randomUUID(),
        line1: 'Jr. Ancash 778',
        line2: null,
        reference: `${marker} Entrega orden B`,
        district: 'El Tambo',
        city: 'Huancayo',
        region: 'Junin',
        country: 'Peru',
        lat: -12.0545,
        lng: -75.2174,
        created_at: nowIso,
        updated_at: nowIso,
      },
      {
        id: randomUUID(),
        line1: 'Psj. Arequipa 145',
        line2: null,
        reference: `${marker} Entrega orden C`,
        district: 'Chilca',
        city: 'Huancayo',
        region: 'Junin',
        country: 'Peru',
        lat: -12.0792,
        lng: -75.2017,
        created_at: nowIso,
        updated_at: nowIso,
      },
    ]);
  }

  let deliveryZones = [];
  if (emptyCounts.delivery_zones === 0) {
    deliveryZones = await insertMany('delivery_zones', [
      {
        id: randomUUID(),
        name: `${marker} Centro`,
        polygon_geojson: { type: 'Polygon', coordinates: [[[-75.22, -12.05], [-75.2, -12.05], [-75.2, -12.08], [-75.22, -12.08], [-75.22, -12.05]]] },
        base_fee: 5.5,
        min_order_amount: 20,
        estimated_minutes: 28,
        is_active: true,
        created_at: nowIso,
        updated_at: nowIso,
      },
      {
        id: randomUUID(),
        name: `${marker} Chilca`,
        polygon_geojson: { type: 'Polygon', coordinates: [[[-75.21, -12.07], [-75.19, -12.07], [-75.19, -12.1], [-75.21, -12.1], [-75.21, -12.07]]] },
        base_fee: 7,
        min_order_amount: 25,
        estimated_minutes: 34,
        is_active: true,
        created_at: nowIso,
        updated_at: nowIso,
      },
    ]);
    inserted.delivery_zones = deliveryZones.length;
  } else {
    deliveryZones = await failOnError(
      supabase.from('delivery_zones').select('*').ilike('name', `${marker}%`).order('created_at', { ascending: true }),
      'No se pudo leer delivery_zones seed'
    );
  }

  if (emptyCounts.branch_delivery_zones === 0) {
    const rows = deliveryZones.map((zone, index) => ({
      id: randomUUID(),
      branch_id: branch.id,
      zone_id: zone.id,
      fee_override: index === 0 ? 6 : null,
      is_active: true,
      created_at: nowIso,
    }));
    await insertMany('branch_delivery_zones', rows);
    inserted.branch_delivery_zones = rows.length;
  }

  if (emptyCounts.merchant_branch_closures === 0) {
    const rows = [
      {
        id: randomUUID(),
        branch_id: branch.id,
        starts_at: isoPlus(24),
        ends_at: isoPlus(30),
        reason: `${marker} Mantenimiento de cocina`,
        created_by_user_id: actor.user_id,
        created_at: nowIso,
        updated_at: nowIso,
      },
    ];
    await insertMany('merchant_branch_closures', rows);
    inserted.merchant_branch_closures = rows.length;
  }

  let modifierGroups = [];
  if (emptyCounts.modifier_groups === 0) {
    modifierGroups = await insertMany('modifier_groups', [
      {
        id: randomUUID(),
        merchant_id: merchant.id,
        name: `${marker} Salsas`,
        min_select: 0,
        max_select: 2,
        is_required: false,
        is_active: true,
        created_at: nowIso,
        updated_at: nowIso,
      },
      {
        id: randomUUID(),
        merchant_id: merchant.id,
        name: `${marker} Extras`,
        min_select: 0,
        max_select: 3,
        is_required: false,
        is_active: true,
        created_at: nowIso,
        updated_at: nowIso,
      },
    ]);
    inserted.modifier_groups = modifierGroups.length;
  } else {
    modifierGroups = await failOnError(
      supabase.from('modifier_groups').select('*').ilike('name', `${marker}%`).order('created_at', { ascending: true }),
      'No se pudo leer modifier_groups seed'
    );
  }

  let modifierOptions = [];
  if (emptyCounts.modifier_options === 0) {
    modifierOptions = await insertMany('modifier_options', [
      { id: randomUUID(), group_id: modifierGroups[0].id, name: 'Aji especial', price_delta: 0, is_active: true, sort_order: 0, created_at: nowIso, updated_at: nowIso },
      { id: randomUUID(), group_id: modifierGroups[0].id, name: 'Mayonesa de casa', price_delta: 0, is_active: true, sort_order: 1, created_at: nowIso, updated_at: nowIso },
      { id: randomUUID(), group_id: modifierGroups[1].id, name: 'Papas extra', price_delta: 4, is_active: true, sort_order: 0, created_at: nowIso, updated_at: nowIso },
      { id: randomUUID(), group_id: modifierGroups[1].id, name: 'Ensalada extra', price_delta: 3.5, is_active: true, sort_order: 1, created_at: nowIso, updated_at: nowIso },
    ]);
    inserted.modifier_options = modifierOptions.length;
  } else {
    modifierOptions = await failOnError(
      supabase.from('modifier_options').select('*').in('group_id', modifierGroups.map((item) => item.id)).order('created_at', { ascending: true }),
      'No se pudo leer modifier_options seed'
    );
  }

  if (emptyCounts.product_branch_settings === 0) {
    const rows = products.map((product, index) => ({
      id: randomUUID(),
      product_id: product.id,
      branch_id: branch.id,
      price_override: index === 0 ? round2(Number(product.base_price) + 1.5) : null,
      is_available: true,
      stock_qty: index === 2 ? 12 : 20,
      created_at: nowIso,
      updated_at: nowIso,
      is_paused: false,
      pause_reason: null,
      updated_by_user_id: actor.user_id,
    }));
    await insertMany('product_branch_settings', rows);
    inserted.product_branch_settings = rows.length;
  }

  if (emptyCounts.product_modifier_groups === 0) {
    const rows = [
      { id: randomUUID(), product_id: products[0].id, group_id: modifierGroups[0].id, sort_order: 0, created_at: nowIso },
      { id: randomUUID(), product_id: products[0].id, group_id: modifierGroups[1].id, sort_order: 1, created_at: nowIso },
      { id: randomUUID(), product_id: products[1].id, group_id: modifierGroups[1].id, sort_order: 0, created_at: nowIso },
    ];
    await insertMany('product_modifier_groups', rows);
    inserted.product_modifier_groups = rows.length;
  }

  const driverUserOne = await ensureAuthUser('seed.driver.one@acme.test', 'SeedDriver#2026', '+51965000001');
  const driverUserTwo = await ensureAuthUser('seed.driver.two@acme.test', 'SeedDriver#2026', '+51965000002');
  const driverProfiles = [
    { user_id: driverUserOne, email: 'seed.driver.one@acme.test', phone: '+51965000001', full_name: 'Diego Salazar', avatar_url: null, default_role: 'driver', is_active: true, created_at: nowIso, updated_at: nowIso },
    { user_id: driverUserTwo, email: 'seed.driver.two@acme.test', phone: '+51965000002', full_name: 'Lucia Paredes', avatar_url: null, default_role: 'driver', is_active: true, created_at: nowIso, updated_at: nowIso },
  ];

  if (emptyCounts.drivers === 0) {
    const profileResult = await supabase.from('profiles').upsert(driverProfiles).select();
    await failOnError(profileResult, 'No se pudo upsert profiles para drivers seed');
    const rows = [
      {
        user_id: driverProfiles[0].user_id,
        document_number: 'SEEDDRV001',
        license_number: 'LIC-SEED-001',
        vehicle_type_id: vehicleTypesByCode.get('motorcycle').id,
        rating_avg: 4.9,
        is_verified: true,
        status: 'active',
        joined_at: isoPlus(-120),
        updated_at: nowIso,
      },
      {
        user_id: driverProfiles[1].user_id,
        document_number: 'SEEDDRV002',
        license_number: 'LIC-SEED-002',
        vehicle_type_id: vehicleTypesByCode.get('bicycle').id,
        rating_avg: 4.7,
        is_verified: true,
        status: 'active',
        joined_at: isoPlus(-96),
        updated_at: nowIso,
      },
    ];
    await insertMany('drivers', rows);
    inserted.drivers = rows.length;
  }

  if (emptyCounts.vehicles === 0) {
    const rows = [
      { id: randomUUID(), driver_id: driverProfiles[0].user_id, vehicle_type_id: vehicleTypesByCode.get('motorcycle').id, plate: 'SEED-101', brand: 'Honda', model: 'Wave', color: 'Rojo', is_active: true, created_at: nowIso, updated_at: nowIso },
      { id: randomUUID(), driver_id: driverProfiles[1].user_id, vehicle_type_id: vehicleTypesByCode.get('bicycle').id, plate: 'SEED-102', brand: 'Monark', model: 'Urbana', color: 'Azul', is_active: true, created_at: nowIso, updated_at: nowIso },
    ];
    await insertMany('vehicles', rows);
    inserted.vehicles = rows.length;
  }

  if (emptyCounts.driver_documents === 0) {
    const rows = [
      { id: randomUUID(), driver_id: driverProfiles[0].user_id, document_type: 'dni', document_number: '48111222', file_url: 'https://acme.test/seed/driver1-dni.pdf', status: 'approved', expires_at: null, created_at: nowIso, updated_at: nowIso },
      { id: randomUUID(), driver_id: driverProfiles[0].user_id, document_type: 'license', document_number: 'LIC-SEED-001', file_url: 'https://acme.test/seed/driver1-license.pdf', status: 'approved', expires_at: isoPlus(24 * 180), created_at: nowIso, updated_at: nowIso },
      { id: randomUUID(), driver_id: driverProfiles[1].user_id, document_type: 'dni', document_number: '48111333', file_url: 'https://acme.test/seed/driver2-dni.pdf', status: 'approved', expires_at: null, created_at: nowIso, updated_at: nowIso },
    ];
    await insertMany('driver_documents', rows);
    inserted.driver_documents = rows.length;
  }

  if (emptyCounts.driver_shifts === 0) {
    const rows = [
      { id: randomUUID(), driver_id: driverProfiles[0].user_id, start_at: isoPlus(-4), end_at: isoPlus(4), status: 'started', created_at: nowIso },
      { id: randomUUID(), driver_id: driverProfiles[1].user_id, start_at: isoPlus(-8), end_at: isoPlus(-1), status: 'ended', created_at: nowIso },
    ];
    await insertMany('driver_shifts', rows);
    inserted.driver_shifts = rows.length;
  }

  if (emptyCounts.driver_current_state === 0) {
    const rows = [
      { driver_id: driverProfiles[0].user_id, status: 'available', is_online: true, current_order_id: null, last_lat: -12.066, last_lng: -75.209, last_seen_at: nowIso, updated_at: nowIso },
      { driver_id: driverProfiles[1].user_id, status: 'offline', is_online: false, current_order_id: null, last_lat: -12.056, last_lng: -75.218, last_seen_at: isoPlus(-1), updated_at: nowIso },
    ];
    const result = await supabase.from('driver_current_state').upsert(rows).select();
    await failOnError(result, 'No se pudo upsert driver_current_state');
    inserted.driver_current_state = rows.length;
  }

  if (emptyCounts.user_roles === 0) {
    const rows = [
      { id: randomUUID(), user_id: actor.user_id, role_id: rolesByCode.get('admin').id, created_at: nowIso },
      { id: randomUUID(), user_id: actor.user_id, role_id: rolesByCode.get('merchant_staff').id, created_at: nowIso },
      { id: randomUUID(), user_id: customers[0].user_id, role_id: rolesByCode.get('customer').id, created_at: nowIso },
      { id: randomUUID(), user_id: customers[1].user_id, role_id: rolesByCode.get('customer').id, created_at: nowIso },
      { id: randomUUID(), user_id: driverProfiles[0].user_id, role_id: rolesByCode.get('driver').id, created_at: nowIso },
      { id: randomUUID(), user_id: driverProfiles[1].user_id, role_id: rolesByCode.get('driver').id, created_at: nowIso },
    ];
    await insertMany('user_roles', rows);
    inserted.user_roles = rows.length;
  }

  if (emptyCounts.customer_addresses === 0) {
    const rows = [
      { id: randomUUID(), customer_id: customers[0].user_id, address_id: seedAddresses[0].id, label: 'Casa', is_default: true, created_at: nowIso },
      { id: randomUUID(), customer_id: customers[1].user_id, address_id: seedAddresses[1].id, label: 'Trabajo', is_default: true, created_at: nowIso },
    ];
    await insertMany('customer_addresses', rows);
    inserted.customer_addresses = rows.length;
  }

  if (emptyCounts.customer_payment_methods === 0) {
    const rows = [
      { id: randomUUID(), customer_id: customers[0].user_id, payment_method_id: paymentMethodsByCode.get('yape').id, provider_token: `${marker}_token_yape_001`, brand: 'Yape', masked_reference: '991***111', is_default: true, status: 'active', created_at: nowIso, updated_at: nowIso },
      { id: randomUUID(), customer_id: customers[1].user_id, payment_method_id: paymentMethodsByCode.get('card_online').id, provider_token: `${marker}_token_card_002`, brand: 'Visa', masked_reference: '4111********2345', is_default: true, status: 'active', created_at: nowIso, updated_at: nowIso },
    ];
    await insertMany('customer_payment_methods', rows);
    inserted.customer_payment_methods = rows.length;
  }

  if (emptyCounts.carts === 0) {
    const cartId = randomUUID();
    const cartSubtotal = round2(Number(products[0].base_price) + Number(products[3]?.base_price ?? products[1].base_price));
    const cartDeliveryFee = 5.5;
    const cartServiceFee = 1.2;
    const cartTotal = round2(cartSubtotal + cartDeliveryFee + cartServiceFee);
    await insertMany('carts', [
      {
        id: cartId,
        customer_id: customers[0].user_id,
        merchant_id: merchant.id,
        branch_id: branch.id,
        status: 'active',
        subtotal: cartSubtotal,
        discount_total: 0,
        delivery_fee: cartDeliveryFee,
        service_fee: cartServiceFee,
        total: cartTotal,
        expires_at: isoPlus(6),
        created_at: nowIso,
        updated_at: nowIso,
      },
    ]);
    const cartItems = await insertMany('cart_items', [
      {
        id: randomUUID(),
        cart_id: cartId,
        product_id: products[0].id,
        product_name_snapshot: products[0].name,
        unit_price: products[0].base_price,
        quantity: 1,
        notes: `${marker} sin picante`,
        line_total: round2(Number(products[0].base_price)),
        created_at: nowIso,
        updated_at: nowIso,
      },
      {
        id: randomUUID(),
        cart_id: cartId,
        product_id: products[3]?.id ?? products[1].id,
        product_name_snapshot: products[3]?.name ?? products[1].name,
        unit_price: Number(products[3]?.base_price ?? products[1].base_price),
        quantity: 1,
        notes: null,
        line_total: round2(Number(products[3]?.base_price ?? products[1].base_price)),
        created_at: nowIso,
        updated_at: nowIso,
      },
    ]);
    inserted.carts = 1;
    inserted.cart_items = cartItems.length;
    if (emptyCounts.cart_item_modifiers === 0) {
      const rows = [
        { id: randomUUID(), cart_item_id: cartItems[0].id, modifier_option_id: modifierOptions[0].id, option_name_snapshot: modifierOptions[0].name, price_delta: modifierOptions[0].price_delta, quantity: 1, created_at: nowIso },
      ];
      await insertMany('cart_item_modifiers', rows);
      inserted.cart_item_modifiers = rows.length;
    }
  }

  let promotion = null;
  let coupon = null;
  const existingPromotion = await failOnError(
    supabase.from('promotions').select('*').ilike('name', `${marker}%`).limit(1),
    'No se pudo leer promotions seed'
  );
  if (existingPromotion.length) {
    promotion = existingPromotion[0];
  }
  if (emptyCounts.promotions === 0) {
    promotion = (
      await insertMany('promotions', [
        {
          id: randomUUID(),
          name: `${marker} Promo bienvenida`,
          promo_type: 'coupon',
          discount_type: 'fixed',
          discount_value: 5,
          min_order_amount: 30,
          max_discount: 5,
          starts_at: isoPlus(-24),
          ends_at: isoPlus(24 * 30),
          usage_limit_total: 100,
          usage_limit_per_user: 1,
          is_active: true,
          created_at: nowIso,
          updated_at: nowIso,
        },
      ])
    )[0];
    inserted.promotions = 1;
  }

  if (emptyCounts.promotion_targets === 0) {
    const rows = [
      { id: randomUUID(), promotion_id: promotion.id, target_type: 'merchant', target_id: merchant.id, created_at: nowIso },
      { id: randomUUID(), promotion_id: promotion.id, target_type: 'product', target_id: products[0].id, created_at: nowIso },
    ];
    await insertMany('promotion_targets', rows);
    inserted.promotion_targets = rows.length;
  }

  const existingCoupon = await failOnError(
    supabase.from('coupons').select('*').eq('code', 'SEEDWELCOME2026').limit(1),
    'No se pudo leer coupons seed'
  );
  if (existingCoupon.length) {
    coupon = existingCoupon[0];
  }
  if (emptyCounts.coupons === 0) {
    coupon = (
      await insertMany('coupons', [
        {
          id: randomUUID(),
          promotion_id: promotion.id,
          code: 'SEEDWELCOME2026',
          starts_at: isoPlus(-24),
          ends_at: isoPlus(24 * 20),
          usage_limit_total: 30,
          usage_limit_per_user: 1,
          is_active: true,
          created_at: nowIso,
          updated_at: nowIso,
        },
      ])
    )[0];
    inserted.coupons = 1;
  }

  const orderAItems = [
    { product: products[0], quantity: 1 },
    { product: products[3] ?? products[1], quantity: 1 },
  ];
  const orderBItems = [
    { product: products[1], quantity: 1 },
    { product: products[2], quantity: 1 },
  ];
  const orderCItems = [
    { product: products[2], quantity: 1 },
    { product: products[1], quantity: 1 },
  ];

  const makeTotals = (items, deliveryFee, serviceFee, discount = 0) => {
    const subtotal = round2(items.reduce((sum, item) => sum + Number(item.product.base_price) * item.quantity, 0));
    const total = round2(subtotal - discount + deliveryFee + serviceFee);
    return { subtotal, total };
  };

  const totalsA = makeTotals(orderAItems, 6, 1.5, 0);
  const totalsB = makeTotals(orderBItems, 5.5, 1.2, 0);
  const totalsC = makeTotals(orderCItems, 7, 2, 5);

  const seedOrders = await insertMany('orders', [
    {
      id: randomUUID(),
      order_code: maxOrderCode + 1,
      customer_id: customers[0].user_id,
      merchant_id: merchant.id,
      branch_id: branch.id,
      zone_id: deliveryZones[0].id,
      current_driver_id: driverProfiles[0].user_id,
      payment_method_id: paymentMethodsByCode.get('cash').id,
      coupon_id: null,
      status: 'delivered',
      payment_status: 'paid',
      fulfillment_type: 'delivery',
      scheduled_for: null,
      special_instructions: `${marker} Orden entregada con efectivo`,
      subtotal: totalsA.subtotal,
      discount_total: 0,
      coupon_discount_total: 0,
      delivery_fee: 6,
      service_fee: 1.5,
      tax_amount: 0,
      tip_amount: 0,
      cash_change_for: 80,
      total: totalsA.total,
      currency: 'PEN',
      placed_at: isoPlus(-12),
      accepted_at: isoPlus(-11.5),
      preparing_at: isoPlus(-11),
      ready_at: isoPlus(-10.4),
      picked_up_at: isoPlus(-10.1),
      delivered_at: isoPlus(-9.5),
      cancelled_at: null,
      created_at: isoPlus(-12),
      updated_at: nowIso,
    },
    {
      id: randomUUID(),
      order_code: maxOrderCode + 2,
      customer_id: customers[1].user_id,
      merchant_id: merchant.id,
      branch_id: branch.id,
      zone_id: deliveryZones[0].id,
      current_driver_id: driverProfiles[1].user_id,
      payment_method_id: paymentMethodsByCode.get('yape').id,
      coupon_id: null,
      status: 'cancelled',
      payment_status: 'refunded',
      fulfillment_type: 'delivery',
      scheduled_for: null,
      special_instructions: `${marker} Orden cancelada y refund`,
      subtotal: totalsB.subtotal,
      discount_total: 0,
      coupon_discount_total: 0,
      delivery_fee: 5.5,
      service_fee: 1.2,
      tax_amount: 0,
      tip_amount: 0,
      cash_change_for: null,
      total: totalsB.total,
      currency: 'PEN',
      placed_at: isoPlus(-8),
      accepted_at: isoPlus(-7.7),
      preparing_at: null,
      ready_at: null,
      picked_up_at: null,
      delivered_at: null,
      cancelled_at: isoPlus(-7.2),
      created_at: isoPlus(-8),
      updated_at: nowIso,
    },
    {
      id: randomUUID(),
      order_code: maxOrderCode + 3,
      customer_id: customers[0].user_id,
      merchant_id: merchant.id,
      branch_id: branch.id,
      zone_id: deliveryZones[1].id,
      current_driver_id: driverProfiles[0].user_id,
      payment_method_id: paymentMethodsByCode.get('card_online').id,
      coupon_id: coupon.id,
      status: 'on_the_way',
      payment_status: 'authorized',
      fulfillment_type: 'delivery',
      scheduled_for: null,
      special_instructions: `${marker} Orden con soporte y promo`,
      subtotal: totalsC.subtotal,
      discount_total: 5,
      coupon_discount_total: 5,
      delivery_fee: 7,
      service_fee: 2,
      tax_amount: 0,
      tip_amount: 0,
      cash_change_for: null,
      total: totalsC.total,
      currency: 'PEN',
      placed_at: isoPlus(-2),
      accepted_at: isoPlus(-1.8),
      preparing_at: isoPlus(-1.5),
      ready_at: isoPlus(-1.2),
      picked_up_at: isoPlus(-0.8),
      delivered_at: null,
      cancelled_at: null,
      created_at: isoPlus(-2),
      updated_at: nowIso,
    },
  ]);

  const [orderA, orderB, orderC] = seedOrders;
  const seedOrderItems = await insertMany(
    'order_items',
    [
      ...orderAItems.map((item) => ({
        id: randomUUID(),
        order_id: orderA.id,
        product_id: item.product.id,
        product_name_snapshot: item.product.name,
        unit_price: item.product.base_price,
        quantity: item.quantity,
        notes: null,
        line_total: round2(Number(item.product.base_price) * item.quantity),
        created_at: nowIso,
      })),
      ...orderBItems.map((item) => ({
        id: randomUUID(),
        order_id: orderB.id,
        product_id: item.product.id,
        product_name_snapshot: item.product.name,
        unit_price: item.product.base_price,
        quantity: item.quantity,
        notes: `${marker} sin aji`,
        line_total: round2(Number(item.product.base_price) * item.quantity),
        created_at: nowIso,
      })),
      ...orderCItems.map((item) => ({
        id: randomUUID(),
        order_id: orderC.id,
        product_id: item.product.id,
        product_name_snapshot: item.product.name,
        unit_price: item.product.base_price,
        quantity: item.quantity,
        notes: null,
        line_total: round2(Number(item.product.base_price) * item.quantity),
        created_at: nowIso,
      })),
    ]
  );

  if (emptyCounts.order_item_modifiers === 0) {
    const rows = [
      { id: randomUUID(), order_item_id: seedOrderItems[0].id, modifier_option_id: modifierOptions[0].id, option_name_snapshot: modifierOptions[0].name, price_delta: modifierOptions[0].price_delta, quantity: 1, created_at: nowIso },
      { id: randomUUID(), order_item_id: seedOrderItems[1].id, modifier_option_id: modifierOptions[2].id, option_name_snapshot: modifierOptions[2].name, price_delta: modifierOptions[2].price_delta, quantity: 1, created_at: nowIso },
    ];
    await insertMany('order_item_modifiers', rows);
    inserted.order_item_modifiers = rows.length;
  }

  if (emptyCounts.order_delivery_details === 0) {
    const rows = [
      { order_id: orderA.id, address_id: seedAddresses[2].id, address_snapshot: seedAddresses[2].line1, reference_snapshot: seedAddresses[2].reference, district_snapshot: seedAddresses[2].district, city_snapshot: seedAddresses[2].city, region_snapshot: seedAddresses[2].region, lat: seedAddresses[2].lat, lng: seedAddresses[2].lng, recipient_name: 'Mariana Rojas', recipient_phone: '+51987654001', estimated_distance_km: 2.4, estimated_time_min: 26, created_at: nowIso, updated_at: nowIso },
      { order_id: orderB.id, address_id: seedAddresses[3].id, address_snapshot: seedAddresses[3].line1, reference_snapshot: seedAddresses[3].reference, district_snapshot: seedAddresses[3].district, city_snapshot: seedAddresses[3].city, region_snapshot: seedAddresses[3].region, lat: seedAddresses[3].lat, lng: seedAddresses[3].lng, recipient_name: 'Jose Poma', recipient_phone: '+51987654002', estimated_distance_km: 2.8, estimated_time_min: 30, created_at: nowIso, updated_at: nowIso },
      { order_id: orderC.id, address_id: seedAddresses[4].id, address_snapshot: seedAddresses[4].line1, reference_snapshot: seedAddresses[4].reference, district_snapshot: seedAddresses[4].district, city_snapshot: seedAddresses[4].city, region_snapshot: seedAddresses[4].region, lat: seedAddresses[4].lat, lng: seedAddresses[4].lng, recipient_name: 'Mariana Rojas', recipient_phone: '+51987654001', estimated_distance_km: 3.4, estimated_time_min: 34, created_at: nowIso, updated_at: nowIso },
    ];
    await insertMany('order_delivery_details', rows);
    inserted.order_delivery_details = rows.length;
  }

  if (emptyCounts.order_assignments === 0) {
    const rows = [
      { id: randomUUID(), order_id: orderA.id, driver_id: driverProfiles[0].user_id, status: 'completed', assigned_at: isoPlus(-10.2), accepted_at: isoPlus(-10), rejected_at: null, picked_up_at: isoPlus(-9.9), completed_at: isoPlus(-9.5), reason: `${marker} entrega efectiva` },
      { id: randomUUID(), order_id: orderB.id, driver_id: driverProfiles[1].user_id, status: 'rejected', assigned_at: isoPlus(-7.8), accepted_at: null, rejected_at: isoPlus(-7.3), picked_up_at: null, completed_at: null, reason: `${marker} pedido cancelado antes de recojo` },
      { id: randomUUID(), order_id: orderC.id, driver_id: driverProfiles[0].user_id, status: 'accepted', assigned_at: isoPlus(-1.9), accepted_at: isoPlus(-1.8), rejected_at: null, picked_up_at: isoPlus(-0.8), completed_at: null, reason: `${marker} ruta activa` },
    ];
    await insertMany('order_assignments', rows);
    inserted.order_assignments = rows.length;
  }

  if (emptyCounts.payments === 0) {
    const rows = [
      { id: randomUUID(), order_id: orderA.id, customer_id: orderA.customer_id, payment_method_id: paymentMethodsByCode.get('cash').id, amount: orderA.total, currency: 'PEN', status: 'paid', provider: 'offline_cash', external_reference: `${marker}_PAY_A`, requested_at: isoPlus(-12), authorized_at: isoPlus(-9.6), captured_at: isoPlus(-9.5), failed_at: null, created_at: nowIso, updated_at: nowIso },
      { id: randomUUID(), order_id: orderB.id, customer_id: orderB.customer_id, payment_method_id: paymentMethodsByCode.get('yape').id, amount: orderB.total, currency: 'PEN', status: 'refunded', provider: 'yape', external_reference: `${marker}_PAY_B`, requested_at: isoPlus(-8), authorized_at: isoPlus(-7.8), captured_at: isoPlus(-7.7), failed_at: null, created_at: nowIso, updated_at: nowIso },
      { id: randomUUID(), order_id: orderC.id, customer_id: orderC.customer_id, payment_method_id: paymentMethodsByCode.get('card_online').id, amount: orderC.total, currency: 'PEN', status: 'authorized', provider: 'izipay', external_reference: `${marker}_PAY_C`, requested_at: isoPlus(-2), authorized_at: isoPlus(-1.9), captured_at: null, failed_at: null, created_at: nowIso, updated_at: nowIso },
    ];
    const insertedPayments = await insertMany('payments', rows);
    inserted.payments = rows.length;
    if (emptyCounts.payment_transactions === 0) {
      const txRows = [
        { id: randomUUID(), payment_id: insertedPayments[1].id, transaction_type: 'capture', amount: insertedPayments[1].amount, provider_transaction_id: `${marker}_TX_B_CAP`, status: 'paid', request_json: { provider: 'yape', action: 'capture' }, response_json: { approved: true }, created_at: isoPlus(-7.7) },
        { id: randomUUID(), payment_id: insertedPayments[2].id, transaction_type: 'authorization', amount: insertedPayments[2].amount, provider_transaction_id: `${marker}_TX_C_AUTH`, status: 'authorized', request_json: { provider: 'izipay', action: 'authorize' }, response_json: { approved: true }, created_at: isoPlus(-1.9) },
      ];
      await insertMany('payment_transactions', txRows);
      inserted.payment_transactions = txRows.length;
    }
    if (emptyCounts.refunds === 0) {
      const rowsRefund = [
        { id: randomUUID(), payment_id: insertedPayments[1].id, order_id: orderB.id, amount: orderB.total, reason: `${marker} cancelacion con reintegro`, status: 'refunded', requested_at: isoPlus(-7.2), processed_at: isoPlus(-7) },
      ];
      await insertMany('refunds', rowsRefund);
      inserted.refunds = rowsRefund.length;
    }
  }

  if (emptyCounts.order_cancellations === 0) {
    const rows = [
      { id: randomUUID(), order_id: orderB.id, cancelled_by_user_id: customers[1].user_id, actor_type: 'customer', reason_code: 'changed_mind', reason_text: `${marker} ya no necesitaba el pedido`, refund_amount: orderB.total, created_at: isoPlus(-7.2) },
    ];
    await insertMany('order_cancellations', rows);
    inserted.order_cancellations = rows.length;
  }

  if (emptyCounts.cash_collections === 0) {
    const rows = [
      { id: randomUUID(), order_id: orderA.id, driver_id: driverProfiles[0].user_id, amount_collected: orderA.total, status: 'collected', collected_at: isoPlus(-9.5), settled_at: null },
    ];
    await insertMany('cash_collections', rows);
    inserted.cash_collections = rows.length;
  }

  if (emptyCounts.order_evidences === 0) {
    const rows = [
      { id: randomUUID(), order_id: orderA.id, driver_id: driverProfiles[0].user_id, evidence_type: 'delivery_photo', file_url: 'https://acme.test/seed/evidence-order-a.jpg', note: `${marker} evidencia de entrega`, created_at: isoPlus(-9.5) },
      { id: randomUUID(), order_id: orderC.id, driver_id: driverProfiles[0].user_id, evidence_type: 'other', file_url: 'https://acme.test/seed/evidence-order-c.jpg', note: `${marker} salida de tienda`, created_at: isoPlus(-0.8) },
    ];
    await insertMany('order_evidences', rows);
    inserted.order_evidences = rows.length;
  }

  if (emptyCounts.order_incidents === 0) {
    const rows = [
      { id: randomUUID(), order_id: orderC.id, driver_id: driverProfiles[0].user_id, incident_type: 'traffic_delay', description: `${marker} trafico moderado en la ruta`, status: 'open', created_at: isoPlus(-0.5), resolved_at: null },
    ];
    await insertMany('order_incidents', rows);
    inserted.order_incidents = rows.length;
  }

  if (emptyCounts.driver_locations === 0) {
    const rows = [
      { id: randomUUID(), driver_id: driverProfiles[0].user_id, order_id: orderC.id, lat: -12.0701, lng: -75.2082, accuracy_m: 8, speed_kmh: 18, heading: 120, recorded_at: isoPlus(-0.6) },
      { id: randomUUID(), driver_id: driverProfiles[0].user_id, order_id: orderC.id, lat: -12.0738, lng: -75.2054, accuracy_m: 9, speed_kmh: 22, heading: 135, recorded_at: isoPlus(-0.45) },
      { id: randomUUID(), driver_id: driverProfiles[0].user_id, order_id: orderC.id, lat: -12.0765, lng: -75.2031, accuracy_m: 7, speed_kmh: 15, heading: 150, recorded_at: isoPlus(-0.3) },
    ];
    await insertMany('driver_locations', rows);
    inserted.driver_locations = rows.length;
    await updateRows('driver_current_state', { current_order_id: orderC.id, status: 'busy', updated_at: nowIso }, [{ column: 'driver_id', value: driverProfiles[0].user_id }]);
  }

  if (emptyCounts.coupon_redemptions === 0) {
    const rows = [
      { id: randomUUID(), coupon_id: coupon.id, customer_id: customers[0].user_id, order_id: orderC.id, discount_amount: 5, redeemed_at: isoPlus(-2) },
    ];
    await insertMany('coupon_redemptions', rows);
    inserted.coupon_redemptions = rows.length;
  }

  let conversation = null;
  const existingConversation = await failOnError(
    supabase.from('conversations').select('*').eq('order_id', orderC.id).limit(1),
    'No se pudo leer conversations seed'
  );
  if (existingConversation.length) {
    conversation = existingConversation[0];
  }

  if (emptyCounts.conversations === 0) {
    conversation = (
      await insertMany('conversations', [
        { id: randomUUID(), order_id: orderC.id, conversation_type: 'order_chat', status: 'open', created_by: actor.user_id, created_at: isoPlus(-1.7) },
      ])
    )[0];
    inserted.conversations = 1;
  }

  if (conversation && emptyCounts.conversation_participants === 0) {
    const participants = [
      { id: randomUUID(), conversation_id: conversation.id, user_id: actor.user_id, participant_role: 'staff', joined_at: isoPlus(-1.7), left_at: null },
      { id: randomUUID(), conversation_id: conversation.id, user_id: customers[0].user_id, participant_role: 'customer', joined_at: isoPlus(-1.7), left_at: null },
      { id: randomUUID(), conversation_id: conversation.id, user_id: driverProfiles[0].user_id, participant_role: 'driver', joined_at: isoPlus(-1), left_at: null },
    ];
    await insertMany('conversation_participants', participants);
    inserted.conversation_participants = participants.length;
  }

  if (conversation && emptyCounts.messages === 0) {
    const messages = await insertMany('messages', [
      { id: randomUUID(), conversation_id: conversation.id, sender_user_id: actor.user_id, message_type: 'text', body: `${marker} revisando demora en la entrega`, file_url: null, is_system: false, created_at: isoPlus(-1.6) },
      { id: randomUUID(), conversation_id: conversation.id, sender_user_id: customers[0].user_id, message_type: 'text', body: 'Estoy atento, gracias por avisar.', file_url: null, is_system: false, created_at: isoPlus(-1.4) },
      { id: randomUUID(), conversation_id: conversation.id, sender_user_id: driverProfiles[0].user_id, message_type: 'system', body: 'Llegando a la zona final.', file_url: null, is_system: true, created_at: isoPlus(-0.4) },
    ]);
    inserted.messages = messages.length;
    if (emptyCounts.message_reads === 0) {
      const readRows = [
        { id: randomUUID(), message_id: messages[0].id, user_id: customers[0].user_id, read_at: isoPlus(-1.5) },
        { id: randomUUID(), message_id: messages[0].id, user_id: actor.user_id, read_at: isoPlus(-1.6) },
        { id: randomUUID(), message_id: messages[1].id, user_id: actor.user_id, read_at: isoPlus(-1.3) },
      ];
      await insertMany('message_reads', readRows);
      inserted.message_reads = readRows.length;
    }
    if (emptyCounts.notifications === 0) {
      const rows = [
        { id: randomUUID(), user_id: customers[0].user_id, channel: 'in_app', type: 'conversation_message', title: 'Actualizacion de pedido', body: 'El comercio te escribio sobre tu pedido', entity_type: 'conversation', entity_id: conversation.id, payload_json: { order_id: orderC.id }, status: 'read', sent_at: isoPlus(-1.6), read_at: isoPlus(-1.5), created_at: isoPlus(-1.6) },
        { id: randomUUID(), user_id: driverProfiles[0].user_id, channel: 'in_app', type: 'conversation_message', title: 'Nuevo mensaje operativo', body: 'Hay una nueva nota en la conversacion del pedido', entity_type: 'conversation', entity_id: conversation.id, payload_json: { order_id: orderC.id }, status: 'queued', sent_at: null, read_at: null, created_at: isoPlus(-0.4) },
      ];
      await insertMany('notifications', rows);
      inserted.notifications = rows.length;
    }
  }

  if (emptyCounts.commission_rules === 0) {
    const rows = [
      { id: randomUUID(), scope_type: 'merchant', scope_id: merchant.id, who_pays: 'merchant', rule_type: 'percent', value: 12, starts_at: isoPlus(-24 * 10), ends_at: null, is_active: true, created_at: nowIso, updated_at: nowIso },
      { id: randomUUID(), scope_type: 'branch', scope_id: branch.id, who_pays: 'merchant', rule_type: 'amount', value: 3, starts_at: isoPlus(-24 * 10), ends_at: null, is_active: true, created_at: nowIso, updated_at: nowIso },
      { id: randomUUID(), scope_type: 'driver', scope_id: driverProfiles[0].user_id, who_pays: 'merchant', rule_type: 'percent', value: 8, starts_at: isoPlus(-24 * 10), ends_at: null, is_active: true, created_at: nowIso, updated_at: nowIso },
    ];
    await insertMany('commission_rules', rows);
    inserted.commission_rules = rows.length;
  }

  if (emptyCounts.merchant_settlements === 0) {
    const grossSales = round2(Number(orderA.total) + Number(orderC.total));
    const commissionAmount = round2(grossSales * 0.12);
    const netPayable = round2(grossSales - commissionAmount);
    const settlement = (
      await insertMany('merchant_settlements', [
        { id: randomUUID(), merchant_id: merchant.id, period_start: isoPlus(-24 * 7), period_end: nowIso, gross_sales: grossSales, commission_amount: commissionAmount, adjustments: 0, net_payable: netPayable, status: 'generated', generated_at: nowIso, paid_at: null, created_at: nowIso, updated_at: nowIso },
      ])
    )[0];
    inserted.merchant_settlements = 1;
    if (emptyCounts.merchant_settlement_items === 0) {
      const rows = [
        { id: randomUUID(), settlement_id: settlement.id, order_id: orderA.id, order_total: orderA.total, commission_amount: round2(Number(orderA.total) * 0.12), net_amount: round2(Number(orderA.total) * 0.88), created_at: nowIso },
        { id: randomUUID(), settlement_id: settlement.id, order_id: orderC.id, order_total: orderC.total, commission_amount: round2(Number(orderC.total) * 0.12), net_amount: round2(Number(orderC.total) * 0.88), created_at: nowIso },
      ];
      await insertMany('merchant_settlement_items', rows);
      inserted.merchant_settlement_items = rows.length;
    }
  }

  if (emptyCounts.driver_settlements === 0) {
    const settlement = (
      await insertMany('driver_settlements', [
        { id: randomUUID(), driver_id: driverProfiles[0].user_id, period_start: isoPlus(-24 * 7), period_end: nowIso, deliveries_count: 2, gross_earnings: 18, bonuses: 2, penalties: 0, cash_collected: Number(orderA.total), net_payable: 20, status: 'generated', generated_at: nowIso, paid_at: null, created_at: nowIso, updated_at: nowIso },
      ])
    )[0];
    inserted.driver_settlements = 1;
    if (emptyCounts.driver_settlement_items === 0) {
      const rows = [
        { id: randomUUID(), settlement_id: settlement.id, order_id: orderA.id, earning_amount: 8, bonus_amount: 1, penalty_amount: 0, net_amount: 9, created_at: nowIso },
        { id: randomUUID(), settlement_id: settlement.id, order_id: orderC.id, earning_amount: 10, bonus_amount: 1, penalty_amount: 0, net_amount: 11, created_at: nowIso },
      ];
      await insertMany('driver_settlement_items', rows);
      inserted.driver_settlement_items = rows.length;
    }
  }

  if (emptyCounts.audit_logs === 0) {
    const rows = [
      { id: randomUUID(), actor_user_id: actor.user_id, entity_type: 'promotion', entity_id: promotion.id, action: 'seed_created_promotion', old_values_json: null, new_values_json: { marker, promotion_id: promotion.id }, ip_address: '127.0.0.1', user_agent: 'seed-script', created_at: nowIso },
      { id: randomUUID(), actor_user_id: actor.user_id, entity_type: 'order_assignment', entity_id: orderC.id, action: 'seed_assigned_driver', old_values_json: null, new_values_json: { marker, driver_id: driverProfiles[0].user_id }, ip_address: '127.0.0.1', user_agent: 'seed-script', created_at: nowIso },
      { id: randomUUID(), actor_user_id: actor.user_id, entity_type: 'conversation', entity_id: orderC.id, action: 'seed_created_conversation', old_values_json: null, new_values_json: { marker }, ip_address: '127.0.0.1', user_agent: 'seed-script', created_at: nowIso },
    ];
    await insertMany('audit_logs', rows);
    inserted.audit_logs = rows.length;
  }

  if (emptyCounts.merchant_audit_logs === 0) {
    const rows = [
      { id: randomUUID(), merchant_id: merchant.id, branch_id: branch.id, user_id: actor.user_id, entity_type: 'promotion', entity_id: promotion.id, action: 'seed_created_promotion', metadata_json: { marker }, created_at: nowIso },
      { id: randomUUID(), merchant_id: merchant.id, branch_id: branch.id, user_id: actor.user_id, entity_type: 'order', entity_id: orderC.id, action: 'seed_support_conversation', metadata_json: { marker }, created_at: nowIso },
      { id: randomUUID(), merchant_id: merchant.id, branch_id: branch.id, user_id: actor.user_id, entity_type: 'settlement', entity_id: merchant.id, action: 'seed_generated_settlement', metadata_json: { marker }, created_at: nowIso },
    ];
    await insertMany('merchant_audit_logs', rows);
    inserted.merchant_audit_logs = rows.length;
  }

  if (emptyCounts.analytics_events === 0) {
    const rows = [
      { id: randomUUID(), user_id: customers[0].user_id, order_id: orderC.id, event_name: 'seed_coupon_applied', properties_json: { marker, coupon_code: coupon.code }, created_at: nowIso },
      { id: randomUUID(), user_id: actor.user_id, order_id: orderC.id, event_name: 'seed_conversation_opened', properties_json: { marker }, created_at: nowIso },
      { id: randomUUID(), user_id: driverProfiles[0].user_id, order_id: orderA.id, event_name: 'seed_cash_collected', properties_json: { marker, amount: orderA.total }, created_at: nowIso },
    ];
    await insertMany('analytics_events', rows);
    inserted.analytics_events = rows.length;
  }

  console.log('Seed completado para tablas vacias.');
  Object.entries(inserted)
    .sort((left, right) => left[0].localeCompare(right[0]))
    .forEach(([table, count]) => {
      console.log(`${table}: ${count}`);
    });
}

await main();
