-- Fleexa direct-buy (no wallet) schema
-- One row per purchase attempt. Payment and fulfilment live on the same row,
-- so there is never a balance to keep in sync.

create table if not exists public.sms_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- payment
  reference text not null unique,          -- korapay reference
  amount numeric(12,2) not null,           -- what the user pays (NGN, with markup)
  cost numeric(12,2),                      -- what Fleexa charges us
  currency text not null default 'NGN',
  checkout_url text,
  paid_at timestamptz,

  -- what was bought
  intent text not null default 'buy' check (intent in ('buy','reuse')),
  server text not null check (server in ('1','2','3','4')),
  country_id text,
  app_id text not null,
  app_name text,
  reuse_of uuid references public.sms_orders(id) on delete set null,

  -- fulfilment
  status text not null default 'pending'
    check (status in ('pending','paid','fulfilled','code_received','failed','refund_required','cancelled','expired')),
  fleexa_request_id text,
  phone_number text,
  sms_code text,
  sms_full_text text,
  fulfil_error text,
  fulfilled_at timestamptz,
  expires_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sms_orders_user_created_idx on public.sms_orders (user_id, created_at desc);
create index if not exists sms_orders_reference_idx on public.sms_orders (reference);
create index if not exists sms_orders_request_idx on public.sms_orders (fleexa_request_id);

grant select on public.sms_orders to authenticated;
grant all on public.sms_orders to service_role;

alter table public.sms_orders enable row level security;

-- Users may READ their own orders only. All writes go through edge functions
-- (service role), so no insert/update policy is granted to clients.
create policy "own orders readable"
  on public.sms_orders for select
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists sms_orders_touch on public.sms_orders;
create trigger sms_orders_touch before update on public.sms_orders
for each row execute function public.touch_updated_at();
