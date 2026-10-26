-- ============================================================================
-- Shared CricketData.org cache, quota and refresh locks.
-- Service-role (server) writes these tables. Browsers never hold the API key.
-- ============================================================================

alter table public.matches
  add column if not exists manual_override boolean not null default false;

create table if not exists public.cricketdata_cache (
  cache_key text primary key,
  dataset text not null,
  payload jsonb,
  fetched_at timestamptz,
  expires_at timestamptz,
  status text not null default 'empty',
  last_error text,
  lock_until timestamptz,
  provider_hits_today integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cricketdata_quota (
  day date primary key,
  request_count integer not null default 0,
  provider_hits_today integer,
  provider_hits_limit integer not null default 100,
  last_request_at timestamptz,
  last_error text,
  rate_limited_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.cricketdata_events (
  id uuid primary key default gen_random_uuid(),
  dataset text,
  action text not null,
  detail text,
  ok boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists cricketdata_events_created_idx
  on public.cricketdata_events (created_at desc);

alter table public.cricketdata_cache enable row level security;
alter table public.cricketdata_quota enable row level security;
alter table public.cricketdata_events enable row level security;

-- Admins may inspect cache/quota in the dashboard via the server API; no
-- browser policies grant write access, and the API key is never stored here.

drop policy if exists "cricketdata_cache_admin_read" on public.cricketdata_cache;
create policy "cricketdata_cache_admin_read" on public.cricketdata_cache
for select using (public.is_admin());

drop policy if exists "cricketdata_quota_admin_read" on public.cricketdata_quota;
create policy "cricketdata_quota_admin_read" on public.cricketdata_quota
for select using (public.is_admin());

drop policy if exists "cricketdata_events_admin_read" on public.cricketdata_events;
create policy "cricketdata_events_admin_read" on public.cricketdata_events
for select using (public.is_admin());

create or replace function public.cricketdata_try_consume(p_day date, p_limit integer)
returns table (allowed boolean, request_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
begin
  insert into public.cricketdata_quota (day, request_count, last_request_at)
  values (p_day, 0, now())
  on conflict (day) do nothing;

  update public.cricketdata_quota as q
  set request_count = q.request_count + 1,
      last_request_at = now()
  where q.day = p_day
    and q.request_count < p_limit
  returning q.request_count into current_count;

  if current_count is null then
    select q.request_count into current_count
    from public.cricketdata_quota q
    where q.day = p_day;
    return query select false, coalesce(current_count, p_limit);
  end if;

  return query select true, current_count;
end;
$$;

revoke all on function public.cricketdata_try_consume(date, integer) from public;
grant execute on function public.cricketdata_try_consume(date, integer) to service_role;
