-- Wallet ownership can only be written through the signature-verifying
-- Edge Function. Authenticated clients may read their own linked addresses.
alter table public.user_wallets enable row level security;

drop policy if exists "Users can view their own wallets" on public.user_wallets;
create policy "Users can view their own wallets"
  on public.user_wallets for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert/update their own wallets" on public.user_wallets;
drop policy if exists "Users can insert and update their own wallets" on public.user_wallets;
grant select on public.user_wallets to authenticated;
revoke insert, update, delete on public.user_wallets from anon, authenticated;

-- Normalize existing primary flags before enforcing one primary wallet per user.
with ranked_wallets as (
  select
    id,
    row_number() over (
      partition by user_id
      order by is_primary desc, verified_at desc, created_at asc, id
    ) as position
  from public.user_wallets
)
update public.user_wallets as wallets
set is_primary = ranked_wallets.position = 1
from ranked_wallets
where wallets.id = ranked_wallets.id
  and wallets.is_primary is distinct from (ranked_wallets.position = 1);

create unique index if not exists user_wallets_one_primary_per_user
  on public.user_wallets (user_id)
  where is_primary;

-- Nonces are server-only: RLS is enabled with no client-facing policies.
create table if not exists public.auth_nonces (
  id uuid primary key default gen_random_uuid(),
  nonce text not null unique,
  wallet_address text not null,
  purpose text not null check (purpose in ('sign-in', 'link')),
  user_id uuid references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint auth_nonces_user_scope check (
    (purpose = 'sign-in' and user_id is null)
    or (purpose = 'link' and user_id is not null)
  )
);

create index if not exists auth_nonces_expiry_idx
  on public.auth_nonces (expires_at);

create index if not exists auth_nonces_wallet_purpose_idx
  on public.auth_nonces (wallet_address, purpose, expires_at);

alter table public.auth_nonces enable row level security;
revoke all on public.auth_nonces from public, anon, authenticated;
grant all on public.auth_nonces to service_role;

-- A single transaction serializes primary-wallet changes and prevents races
-- between concurrent link requests.
create or replace function public.set_verified_user_wallet(
  p_user_id uuid,
  p_wallet_address text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user_id is null
    or p_wallet_address !~ '^0x[0-9a-f]{40}$'
  then
    raise exception 'Invalid verified wallet input';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_user_id::text, 0)
  );

  update public.user_wallets
  set is_primary = false
  where user_id = p_user_id
    and is_primary
    and wallet_address <> p_wallet_address;

  insert into public.user_wallets (
    user_id,
    wallet_address,
    chain_type,
    is_primary,
    verified_at,
    updated_at
  )
  values (
    p_user_id,
    p_wallet_address,
    'evm',
    true,
    pg_catalog.now(),
    pg_catalog.now()
  )
  on conflict (user_id, wallet_address)
  do update set
    chain_type = 'evm',
    is_primary = true,
    verified_at = pg_catalog.now(),
    updated_at = pg_catalog.now();
end;
$$;

revoke all on function public.set_verified_user_wallet(uuid, text)
  from public, anon, authenticated;
grant execute on function public.set_verified_user_wallet(uuid, text)
  to service_role;
