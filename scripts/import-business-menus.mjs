import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_INPUT_DIR = path.join(process.cwd(), 'data', 'menu-import');

function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    throw new Error('No se encontro .env en la raiz del proyecto.');
  }

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
}

function parseArgs(argv) {
  const options = {
    dryRun: false,
    dir: DEFAULT_INPUT_DIR,
    file: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }
    if (arg === '--dir') {
      options.dir = path.resolve(process.cwd(), argv[index + 1] ?? '');
      index += 1;
      continue;
    }
    if (arg === '--file') {
      options.file = path.resolve(process.cwd(), argv[index + 1] ?? '');
      index += 1;
      continue;
    }
    if (!arg.startsWith('--') && !options.file) {
      options.file = path.resolve(process.cwd(), arg);
      continue;
    }
    throw new Error(`Argumento no soportado: ${arg}`);
  }

  return options;
}

function listInputFiles(options) {
  if (options.file) {
    if (!fs.existsSync(options.file)) {
      throw new Error(`No existe el archivo indicado: ${options.file}`);
    }
    return [options.file];
  }

  if (!fs.existsSync(options.dir)) {
    throw new Error(`No existe el directorio de entrada: ${options.dir}`);
  }

  return fs
    .readdirSync(options.dir)
    .filter((entry) => entry.toLowerCase().endsWith('.json'))
    .sort((left, right) => left.localeCompare(right))
    .map((entry) => path.join(options.dir, entry));
}

function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function slugify(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function numberOrNull(value) {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function booleanOrDefault(value, fallback) {
  return typeof value === 'boolean' ? value : fallback;
}

function stringOrNull(value) {
  const normalized = String(value ?? '').trim();
  return normalized ? normalized : null;
}

function readManifest(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`El archivo ${path.basename(filePath)} no contiene un objeto JSON valido.`);
  }
  return parsed;
}

function resolveMerchantMatcher(manifest) {
  if (typeof manifest.merchant === 'string') {
    return { id: null, trade_name: manifest.merchant.trim() };
  }

  if (manifest.merchant && typeof manifest.merchant === 'object') {
    return {
      id: stringOrNull(manifest.merchant.id),
      trade_name: stringOrNull(manifest.merchant.trade_name),
    };
  }

  throw new Error('Cada archivo debe incluir `merchant` como texto o como objeto con `id`/`trade_name`.');
}

function resolveBranchMatcher(branchSetting) {
  return {
    id: stringOrNull(branchSetting.branch_id),
    name: stringOrNull(branchSetting.branch_name),
  };
}

function assertCategories(manifest, filePath) {
  if (!Array.isArray(manifest.categories) || manifest.categories.length === 0) {
    throw new Error(`El archivo ${path.basename(filePath)} debe incluir al menos una categoria en \`categories\`.`);
  }
}

async function failOnError(result, context) {
  const resolved = await result;
  if (resolved.error) {
    throw new Error(`${context}: ${resolved.error.message}`);
  }
  return resolved.data ?? [];
}

async function loadMerchantContext(supabase, matcher) {
  const merchants = await failOnError(
    supabase.from('merchants').select('id, trade_name, status').order('trade_name', { ascending: true }),
    'No se pudieron leer merchants'
  );

  const merchant = merchants.find((row) => {
    if (matcher.id && row.id === matcher.id) return true;
    if (matcher.trade_name && normalizeText(row.trade_name) === normalizeText(matcher.trade_name)) return true;
    return false;
  });

  if (!merchant) {
    throw new Error(`No se encontro el negocio solicitado (${matcher.id ?? matcher.trade_name ?? 'sin identificador'}).`);
  }

  const branches = await failOnError(
    supabase.from('merchant_branches').select('id, merchant_id, name').eq('merchant_id', merchant.id).order('created_at', { ascending: true }),
    `No se pudieron leer branches de ${merchant.trade_name}`
  );

  const [categories, products, branchSettings] = await Promise.all([
    failOnError(
      supabase.from('categories').select('id, merchant_id, name, sort_order, is_active').eq('merchant_id', merchant.id),
      `No se pudieron leer categories de ${merchant.trade_name}`
    ),
    failOnError(
      supabase.from('products').select('id, merchant_id, category_id, sku, name, description, base_price, image_url, is_active, sort_order').eq('merchant_id', merchant.id),
      `No se pudieron leer products de ${merchant.trade_name}`
    ),
    failOnError(
      supabase
        .from('product_branch_settings')
        .select('id, product_id, branch_id, price_override, is_available, stock_qty, is_paused, pause_reason')
        .in(
          'branch_id',
          branches.map((branch) => branch.id).length ? branches.map((branch) => branch.id) : ['00000000-0000-0000-0000-000000000000']
        ),
      `No se pudieron leer product_branch_settings de ${merchant.trade_name}`
    ),
  ]);

  return {
    merchant,
    branches,
    categories,
    products,
    branchSettings,
  };
}

function createCategoryIndex(categories) {
  return new Map(categories.map((category) => [`${category.merchant_id}:${normalizeText(category.name)}`, category]));
}

function createProductIndex(products) {
  const index = new Map();
  for (const product of products) {
    if (product.sku) {
      index.set(`sku:${normalizeText(product.sku)}`, product);
    }
    index.set(`cat:${product.category_id}:${normalizeText(product.name)}`, product);
    index.set(`name:${product.merchant_id}:${normalizeText(product.name)}`, product);
  }
  return index;
}

function createBranchIndex(branches) {
  const index = new Map();
  for (const branch of branches) {
    index.set(`id:${branch.id}`, branch);
    index.set(`name:${normalizeText(branch.name)}`, branch);
  }
  return index;
}

function createBranchSettingsIndex(branchSettings) {
  return new Map(branchSettings.map((setting) => [`${setting.product_id}:${setting.branch_id}`, setting]));
}

async function upsertCategory({ supabase, dryRun, merchantId, categoryInput, existingCategory, fallbackSortOrder }) {
  const nowIso = new Date().toISOString();
  const payload = {
    merchant_id: merchantId,
    name: String(categoryInput.name ?? '').trim(),
    sort_order: Number.isFinite(Number(categoryInput.sort_order)) ? Number(categoryInput.sort_order) : fallbackSortOrder,
    is_active: booleanOrDefault(categoryInput.is_active, true),
    updated_at: nowIso,
  };

  if (!payload.name) {
    throw new Error('Cada categoria debe tener `name`.');
  }

  if (existingCategory) {
    if (!dryRun) {
      const updatedRows = await failOnError(
        supabase.from('categories').update(payload).eq('id', existingCategory.id).select(),
        `No se pudo actualizar la categoria ${payload.name}`
      );
      return updatedRows[0];
    }
    return { ...existingCategory, ...payload };
  }

  if (dryRun) {
    return { id: `dry-category-${normalizeText(payload.name)}`, ...payload, created_at: nowIso };
  }

  const insertedRows = await failOnError(
    supabase.from('categories').insert({ id: randomUUID(), ...payload, created_at: nowIso }).select(),
    `No se pudo crear la categoria ${payload.name}`
  );
  return insertedRows[0];
}

async function upsertProduct({ supabase, dryRun, merchantId, categoryId, productInput, existingProduct, fallbackSortOrder, effectiveSku }) {
  const nowIso = new Date().toISOString();
  const price = numberOrNull(productInput.base_price ?? productInput.price);
  if (price == null) {
    throw new Error(`El producto ${productInput.name ?? '(sin nombre)'} debe incluir \`base_price\` o \`price\`.`);
  }

  const payload = {
    merchant_id: merchantId,
    category_id: categoryId,
    sku: stringOrNull(effectiveSku),
    name: String(productInput.name ?? '').trim(),
    description: String(productInput.description ?? '').trim(),
    base_price: price,
    image_url: String(productInput.image_url ?? '').trim(),
    is_active: booleanOrDefault(productInput.is_active, true),
    sort_order: Number.isFinite(Number(productInput.sort_order)) ? Number(productInput.sort_order) : fallbackSortOrder,
    updated_at: nowIso,
  };

  if (!payload.name) {
    throw new Error('Cada producto debe tener `name`.');
  }

  if (existingProduct) {
    if (!dryRun) {
      const updatedRows = await failOnError(
        supabase.from('products').update(payload).eq('id', existingProduct.id).select(),
        `No se pudo actualizar el producto ${payload.name}`
      );
      return updatedRows[0];
    }
    return { ...existingProduct, ...payload };
  }

  if (dryRun) {
    return { id: `dry-product-${slugify(payload.category_id)}-${slugify(payload.name)}`, ...payload, created_at: nowIso };
  }

  const insertedRows = await failOnError(
    supabase.from('products').insert({ id: randomUUID(), ...payload, created_at: nowIso }).select(),
    `No se pudo crear el producto ${payload.name}`
  );
  return insertedRows[0];
}

async function upsertBranchSetting({
  supabase,
  dryRun,
  productId,
  branch,
  branchInput,
  existingSetting,
}) {
  const nowIso = new Date().toISOString();
  const priceOverride = numberOrNull(branchInput.price_override ?? branchInput.price);
  const payload = {
    product_id: productId,
    branch_id: branch.id,
    price_override: priceOverride,
    is_available: booleanOrDefault(branchInput.is_available, true),
    stock_qty: numberOrNull(branchInput.stock_qty),
    is_paused: booleanOrDefault(branchInput.is_paused, false),
    pause_reason: stringOrNull(branchInput.pause_reason),
    updated_at: nowIso,
  };

  if (existingSetting) {
    if (!dryRun) {
      const updatedRows = await failOnError(
        supabase.from('product_branch_settings').update(payload).eq('id', existingSetting.id).select(),
        `No se pudo actualizar product_branch_settings para ${branch.name}`
      );
      return updatedRows[0];
    }
    return { ...existingSetting, ...payload };
  }

  if (dryRun) {
    return { id: `dry-setting-${productId}-${branch.id}`, ...payload, created_at: nowIso };
  }

  const insertedRows = await failOnError(
    supabase.from('product_branch_settings').insert({ id: randomUUID(), ...payload, created_at: nowIso }).select(),
    `No se pudo crear product_branch_settings para ${branch.name}`
  );
  return insertedRows[0];
}

function resolveTargetBranches({ branchIndex, merchantBranches, productInput, defaults }) {
  if (Array.isArray(productInput.branch_settings) && productInput.branch_settings.length > 0) {
    return productInput.branch_settings.map((setting) => {
      const matcher = resolveBranchMatcher(setting);
      const branch =
        (matcher.id && branchIndex.get(`id:${matcher.id}`)) ||
        (matcher.name && branchIndex.get(`name:${normalizeText(matcher.name)}`)) ||
        null;
      if (!branch) {
        throw new Error(`No se encontro la sucursal indicada para el producto ${productInput.name ?? '(sin nombre)'}.`);
      }
      return { branch, branchInput: setting };
    });
  }

  const applyToAllBranches = booleanOrDefault(defaults.apply_to_all_branches, true);
  if (!applyToAllBranches) {
    return [];
  }

  return merchantBranches.map((branch) => ({
    branch,
    branchInput: {
      is_available: booleanOrDefault(defaults.is_available, true),
      is_paused: booleanOrDefault(defaults.is_paused, false),
      stock_qty: defaults.stock_qty ?? null,
      price_override: defaults.price_override ?? null,
      pause_reason: defaults.pause_reason ?? null,
    },
  }));
}

function createDuplicateProductNameSet(categories) {
  const counts = new Map();
  for (const category of categories) {
    const products = Array.isArray(category?.products) ? category.products : [];
    for (const product of products) {
      const nameKey = normalizeText(product?.name);
      if (!nameKey) continue;
      counts.set(nameKey, (counts.get(nameKey) ?? 0) + 1);
    }
  }
  return new Set(Array.from(counts.entries()).filter(([, count]) => count > 1).map(([nameKey]) => nameKey));
}

function resolveEffectiveSku(categoryName, productInput, duplicateProductNameSet) {
  const explicitSku = stringOrNull(productInput?.sku);
  if (explicitSku) {
    return explicitSku;
  }

  const normalizedName = normalizeText(productInput?.name);
  if (!normalizedName || !duplicateProductNameSet.has(normalizedName)) {
    return null;
  }

  return `${slugify(categoryName)}-${slugify(productInput?.name)}`;
}

async function processManifest({ supabase, filePath, dryRun, summary }) {
  const manifest = readManifest(filePath);
  assertCategories(manifest, filePath);

  const matcher = resolveMerchantMatcher(manifest);
  const defaults = manifest.defaults && typeof manifest.defaults === 'object' ? manifest.defaults : {};
  const context = await loadMerchantContext(supabase, matcher);

  const categoryIndex = createCategoryIndex(context.categories);
  const productIndex = createProductIndex(context.products);
  const branchIndex = createBranchIndex(context.branches);
  const branchSettingsIndex = createBranchSettingsIndex(context.branchSettings);
  const duplicateProductNameSet = createDuplicateProductNameSet(manifest.categories);

  console.log(`\nProcesando ${path.basename(filePath)} -> ${context.merchant.trade_name}`);

  for (let categoryPosition = 0; categoryPosition < manifest.categories.length; categoryPosition += 1) {
    const categoryInput = manifest.categories[categoryPosition];
    if (!categoryInput || typeof categoryInput !== 'object') {
      throw new Error(`Categoria invalida en ${path.basename(filePath)}.`);
    }

    const categoryName = String(categoryInput.name ?? '').trim();
    const existingCategory = categoryIndex.get(`${context.merchant.id}:${normalizeText(categoryName)}`) ?? null;
    const category = await upsertCategory({
      supabase,
      dryRun,
      merchantId: context.merchant.id,
      categoryInput,
      existingCategory,
      fallbackSortOrder: categoryPosition,
    });

    if (existingCategory) summary.categoriesUpdated += 1;
    else summary.categoriesCreated += 1;
    categoryIndex.set(`${context.merchant.id}:${normalizeText(category.name)}`, category);

    const products = Array.isArray(categoryInput.products) ? categoryInput.products : [];
    for (let productPosition = 0; productPosition < products.length; productPosition += 1) {
      const productInput = products[productPosition];
      if (!productInput || typeof productInput !== 'object') {
        throw new Error(`Producto invalido dentro de ${categoryName}.`);
      }

      const effectiveSku = resolveEffectiveSku(categoryName, productInput, duplicateProductNameSet);
      const skuKey = effectiveSku ? `sku:${normalizeText(effectiveSku)}` : null;
      const productKey = `cat:${category.id}:${normalizeText(productInput.name)}`;
      const productNameKey = `name:${context.merchant.id}:${normalizeText(productInput.name)}`;
      const existingProduct =
        (skuKey && productIndex.get(skuKey)) ||
        productIndex.get(productKey) ||
        (!effectiveSku ? productIndex.get(productNameKey) : null) ||
        null;
      const product = await upsertProduct({
        supabase,
        dryRun,
        merchantId: context.merchant.id,
        categoryId: category.id,
        productInput,
        existingProduct,
        fallbackSortOrder: productPosition,
        effectiveSku,
      });

      if (existingProduct) summary.productsUpdated += 1;
      else summary.productsCreated += 1;

      if (product.sku) {
        productIndex.set(`sku:${normalizeText(product.sku)}`, product);
      }
      productIndex.set(`cat:${product.category_id}:${normalizeText(product.name)}`, product);
      productIndex.set(`name:${context.merchant.id}:${normalizeText(product.name)}`, product);

      const targets = resolveTargetBranches({
        branchIndex,
        merchantBranches: context.branches,
        productInput,
        defaults,
      });

      for (const target of targets) {
        const settingKey = `${product.id}:${target.branch.id}`;
        const existingSetting = branchSettingsIndex.get(settingKey) ?? null;
        const setting = await upsertBranchSetting({
          supabase,
          dryRun,
          productId: product.id,
          branch: target.branch,
          branchInput: target.branchInput,
          existingSetting,
        });

        if (existingSetting) summary.branchSettingsUpdated += 1;
        else summary.branchSettingsCreated += 1;
        branchSettingsIndex.set(settingKey, setting);
      }
    }
  }
}

async function main() {
  loadEnvFile();
  const options = parseArgs(process.argv.slice(2));
  const files = listInputFiles(options);

  if (files.length === 0) {
    console.log(`No hay archivos .json en ${options.file ?? options.dir}`);
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Faltan credenciales de Supabase en .env.');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const summary = {
    categoriesCreated: 0,
    categoriesUpdated: 0,
    productsCreated: 0,
    productsUpdated: 0,
    branchSettingsCreated: 0,
    branchSettingsUpdated: 0,
  };

  console.log(options.dryRun ? 'Modo dry-run activado.' : 'Importacion real activada.');
  console.log(`Archivos a procesar: ${files.length}`);

  for (const filePath of files) {
    await processManifest({ supabase, filePath, dryRun: options.dryRun, summary });
  }

  console.log('\nResumen');
  console.log(`categories creadas: ${summary.categoriesCreated}`);
  console.log(`categories actualizadas: ${summary.categoriesUpdated}`);
  console.log(`products creados: ${summary.productsCreated}`);
  console.log(`products actualizados: ${summary.productsUpdated}`);
  console.log(`product_branch_settings creados: ${summary.branchSettingsCreated}`);
  console.log(`product_branch_settings actualizados: ${summary.branchSettingsUpdated}`);
}

await main();
