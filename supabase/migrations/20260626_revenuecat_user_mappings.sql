-- RevenueCat ↔ Soluna user mapping.
-- Written by the client after RevenueCat identifies with the Supabase user id
-- (app_user_id === auth.uid()); read by the billing webhook / support tooling.
-- Idempotent and safe to run on a live database.

begin;

create table if not exists public.revenuecat_user_mappings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revenuecat_app_user_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.revenuecat_user_mappings enable row level security;

-- Owner may read + maintain their own mapping row only.
drop policy if exists "RC mapping selectable by owner" on public.revenuecat_user_mappings;
create policy "RC mapping selectable by owner" on public.revenuecat_user_mappings
for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "RC mapping insertable by owner" on public.revenuecat_user_mappings;
create policy "RC mapping insertable by owner" on public.revenuecat_user_mappings
for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "RC mapping updatable by owner" on public.revenuecat_user_mappings;
create policy "RC mapping updatable by owner" on public.revenuecat_user_mappings
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create index if not exists revenuecat_user_mappings_app_user_idx
  on public.revenuecat_user_mappings (revenuecat_app_user_id);

-- Keep updated_at fresh (private.set_updated_at exists from the initial schema).
drop trigger if exists set_revenuecat_user_mappings_updated_at on public.revenuecat_user_mappings;
create trigger set_revenuecat_user_mappings_updated_at
before update on public.revenuecat_user_mappings
for each row execute function private.set_updated_at();

grant select, insert, update on public.revenuecat_user_mappings to authenticated;

commit;
