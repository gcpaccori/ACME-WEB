-- Fase 9
-- Separa settings globales de settings propios del negocio.

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

insert into public.merchant_settings (merchant_id, key, description, value_json, created_at, updated_at)
select
  merchants.id,
  'order_timeouts',
  'Timeouts operativos propios del negocio',
  system_settings.value_json,
  now(),
  now()
from public.merchants
cross join public.system_settings
where system_settings.key = 'order_timeouts'
on conflict (merchant_id, key) do update
set
  description = excluded.description,
  value_json = excluded.value_json,
  updated_at = now();

delete from public.system_settings
where key = 'order_timeouts';
