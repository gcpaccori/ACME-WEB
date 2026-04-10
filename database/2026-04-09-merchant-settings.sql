-- Separa configuracion global de configuracion propia del negocio.
-- No reemplaza system_settings: la complementa.

create table if not exists public.merchant_settings (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  key text not null,
  description text null,
  value_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (merchant_id, key)
);

create index if not exists merchant_settings_merchant_idx
  on public.merchant_settings (merchant_id);

create index if not exists merchant_settings_key_idx
  on public.merchant_settings (key);
