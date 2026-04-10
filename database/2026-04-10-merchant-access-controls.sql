create table if not exists public.merchant_access_accounts (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null unique references public.merchants(id) on delete cascade,
  user_id uuid unique references auth.users(id) on delete set null,
  email text not null,
  full_name text null,
  access_origin text not null default 'platform_created',
  onboarding_status text not null default 'active',
  is_active boolean not null default true,
  must_change_password boolean not null default false,
  password_changed_at timestamptz null,
  last_invited_at timestamptz null,
  activated_at timestamptz null,
  deactivated_at timestamptz null,
  invited_by_user_id uuid null references auth.users(id) on delete set null,
  approved_by_user_id uuid null references auth.users(id) on delete set null,
  notes text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint merchant_access_accounts_origin_check check (access_origin in ('platform_created', 'public_signup', 'migration')),
  constraint merchant_access_accounts_status_check check (onboarding_status in ('pending_review', 'invited', 'active', 'suspended'))
);

create index if not exists merchant_access_accounts_merchant_idx on public.merchant_access_accounts (merchant_id);
create index if not exists merchant_access_accounts_user_idx on public.merchant_access_accounts (user_id);

alter table public.merchant_access_accounts enable row level security;

drop policy if exists merchant_access_accounts_select_self on public.merchant_access_accounts;
create policy merchant_access_accounts_select_self
  on public.merchant_access_accounts
  for select
  using (auth.uid() = user_id);

insert into public.merchant_access_accounts (
  merchant_id,
  user_id,
  email,
  full_name,
  access_origin,
  onboarding_status,
  is_active,
  must_change_password,
  password_changed_at,
  activated_at,
  created_at,
  updated_at
)
select
  merchants.id as merchant_id,
  owners.user_id,
  coalesce(nullif(profiles.email, ''), nullif(merchants.email, ''), merchants.trade_name || '@pending.local') as email,
  nullif(profiles.full_name, '') as full_name,
  'migration' as access_origin,
  case
    when lower(coalesce(merchants.status, 'active')) in ('pending_review', 'invited', 'draft', 'onboarding_pending') then 'pending_review'
    when lower(coalesce(merchants.status, 'active')) in ('inactive', 'disabled', 'suspended') then 'suspended'
    else 'active'
  end as onboarding_status,
  coalesce(profiles.is_active, true) as is_active,
  false as must_change_password,
  timezone('utc', now()) as password_changed_at,
  timezone('utc', now()) as activated_at,
  timezone('utc', now()) as created_at,
  timezone('utc', now()) as updated_at
from public.merchants
left join lateral (
  select merchant_staff.user_id
  from public.merchant_staff
  where merchant_staff.merchant_id = merchants.id
  order by
    case when lower(coalesce(merchant_staff.staff_role, '')) = 'owner' then 0 else 1 end,
    merchant_staff.created_at asc
  limit 1
) owners on true
left join public.profiles on profiles.user_id = owners.user_id
on conflict (merchant_id) do update
set
  user_id = coalesce(public.merchant_access_accounts.user_id, excluded.user_id),
  email = case
    when public.merchant_access_accounts.email is null or btrim(public.merchant_access_accounts.email) = '' then excluded.email
    else public.merchant_access_accounts.email
  end,
  full_name = coalesce(public.merchant_access_accounts.full_name, excluded.full_name),
  updated_at = timezone('utc', now());
