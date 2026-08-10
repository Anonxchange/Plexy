-- Login throttling for password sign-in.
-- Run this in the Supabase SQL editor (or as a migration) BEFORE deploying signin.tsx.

create table if not exists public.login_attempts (
  identifier_hash text primary key,          -- md5(lower(email)); no plaintext email stored
  failed_count    integer     not null default 0,
  first_failed_at timestamptz not null default now(),
  last_attempt_at timestamptz not null default now(),
  locked_until    timestamptz
);

-- The table is reached ONLY through the SECURITY DEFINER functions below.
alter table public.login_attempts enable row level security;
revoke all on public.login_attempts from anon, authenticated;
grant all on public.login_attempts to service_role;
-- No policies on purpose: anon/authenticated must never read or write it directly.

-- Tunables -------------------------------------------------------------------
--   FREE_ATTEMPTS : failures allowed before the first lock
--   WINDOW        : failures older than this are forgiven
--   BASE_LOCK     : first lock duration, doubling on each further failure
--   MAX_LOCK      : ceiling for the lock duration
-------------------------------------------------------------------------------

create or replace function public.login_throttle_status(p_identifier text)
returns table (allowed boolean, locked_until timestamptz, attempts_left integer)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  free_attempts constant integer := 5;
  attempt_window constant interval := interval '15 minutes';
  row public.login_attempts%rowtype;
  effective_fails integer;
begin
  select * into row from public.login_attempts
   where identifier_hash = md5(lower(coalesce(p_identifier, '')));

  if row is null then
    return query select true, null::timestamptz, free_attempts;
    return;
  end if;

  if row.locked_until is not null and row.locked_until > now() then
    return query select false, row.locked_until, 0;
    return;
  end if;

  -- Failures outside the rolling window are forgiven.
  effective_fails := case when row.first_failed_at < now() - attempt_window then 0 else row.failed_count end;

  return query select true, null::timestamptz, greatest(0, free_attempts - effective_fails);
end;
$$;

create or replace function public.login_throttle_consume(p_identifier text)
returns table (allowed boolean, locked_until timestamptz, attempts_left integer)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  free_attempts constant integer := 5;
  attempt_window constant interval := interval '15 minutes';
  hash text := md5(lower(coalesce(p_identifier, '')));
  row public.login_attempts%rowtype;
begin
  if coalesce(p_identifier, '') = '' then
    return query select false, (now() + interval '1 minute'), 0;
    return;
  end if;

  insert into public.login_attempts as la (identifier_hash)
       values (hash)
  on conflict (identifier_hash) do update
          set last_attempt_at = now()
    returning * into row;

  -- Row lock via the upsert above serialises concurrent tabs/requests.
  if row.locked_until is not null and row.locked_until > now() then
    return query select false, row.locked_until, 0;
    return;
  end if;

  if row.first_failed_at < now() - attempt_window then
    update public.login_attempts
       set failed_count = 0, first_failed_at = now(), locked_until = null
     where identifier_hash = hash
     returning * into row;
  end if;

  return query select true, null::timestamptz, greatest(0, free_attempts - row.failed_count);
end;
$$;

create or replace function public.login_throttle_record_failure(p_identifier text)
returns table (allowed boolean, locked_until timestamptz, attempts_left integer)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  free_attempts constant integer := 5;
  attempt_window constant interval := interval '15 minutes';
  base_lock constant integer := 60;      -- seconds
  max_lock  constant integer := 3600;    -- seconds
  hash text := md5(lower(coalesce(p_identifier, '')));
  row public.login_attempts%rowtype;
  lock_seconds integer;
begin
  insert into public.login_attempts as la (identifier_hash, failed_count, first_failed_at, last_attempt_at)
       values (hash, 1, now(), now())
  on conflict (identifier_hash) do update
          set failed_count = case
                               when la.first_failed_at < now() - attempt_window then 1
                               else la.failed_count + 1
                             end,
              first_failed_at = case
                                  when la.first_failed_at < now() - attempt_window then now()
                                  else la.first_failed_at
                                end,
              last_attempt_at = now()
    returning * into row;

  if row.failed_count >= free_attempts then
    -- Exponential backoff: 1m, 2m, 4m, 8m ... capped at max_lock.
    lock_seconds := least(max_lock, base_lock * power(2, row.failed_count - free_attempts)::integer);
    update public.login_attempts
       set locked_until = now() + make_interval(secs => lock_seconds)
     where identifier_hash = hash
     returning * into row;

    return query select false, row.locked_until, 0;
    return;
  end if;

  return query select true, null::timestamptz, greatest(0, free_attempts - row.failed_count);
end;
$$;

create or replace function public.login_throttle_reset(p_identifier text)
returns table (allowed boolean, locked_until timestamptz, attempts_left integer)
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  delete from public.login_attempts
   where identifier_hash = md5(lower(coalesce(p_identifier, '')));
  return query select true, null::timestamptz, 5;
end;
$$;

-- The sign-in page is unauthenticated, so anon must be able to execute these.
grant execute on function public.login_throttle_status(text)         to anon, authenticated;
grant execute on function public.login_throttle_consume(text)        to anon, authenticated;
grant execute on function public.login_throttle_record_failure(text) to anon, authenticated;
grant execute on function public.login_throttle_reset(text)          to anon, authenticated;

-- Housekeeping: drop stale rows (schedule with pg_cron if available).
-- select cron.schedule('login-attempts-gc', '0 * * * *',
--   $$delete from public.login_attempts
--      where last_attempt_at < now() - interval '1 day'
--        and (locked_until is null or locked_until < now())$$);
