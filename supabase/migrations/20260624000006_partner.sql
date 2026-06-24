-- Soluna — Partner / Bond system
-- Account linking between two users, referrals, and a daily two-person "Bond"
-- reading. RLS lets BOTH linked users read the shared link + bond rows.

-- ─── extend connections (manual connection can become a linked partner) ──
alter table public.connections
  add column if not exists linked_user_id uuid references auth.users(id) on delete set null,
  add column if not exists link_status text not null default 'manual'
    check (link_status in ('manual', 'invited', 'linked')),
  add column if not exists lens text;

-- ════════════════════════════════════════════════════════════════════
-- PARTNER INVITES
-- ════════════════════════════════════════════════════════════════════
create table if not exists public.partner_invites (
  id                uuid primary key default gen_random_uuid(),
  inviter_user_id   uuid not null references auth.users(id) on delete cascade,
  invite_code       text not null unique,
  lens              text not null default 'romance'
                      check (lens in ('romance', 'friendship', 'work', 'family')),
  invitee_email     text,
  status            text not null default 'pending'
                      check (status in ('pending', 'accepted', 'expired')),
  accepted_user_id  uuid references auth.users(id) on delete set null,
  reward_granted    boolean not null default false,
  created_at        timestamptz not null default now(),
  accepted_at       timestamptz
);
create index if not exists idx_partner_invites_inviter on public.partner_invites(inviter_user_id);
create index if not exists idx_partner_invites_code on public.partner_invites(invite_code);

-- ════════════════════════════════════════════════════════════════════
-- PARTNER LINKS (the two-person Bond)
-- ════════════════════════════════════════════════════════════════════
create table if not exists public.partner_links (
  id            uuid primary key default gen_random_uuid(),
  user_a        uuid not null references auth.users(id) on delete cascade,  -- inviter
  user_b        uuid not null references auth.users(id) on delete cascade,  -- accepter
  lens          text not null default 'romance'
                  check (lens in ('romance', 'friendship', 'work', 'family')),
  status        text not null default 'active' check (status in ('active', 'unlinked')),
  a_share_prefs jsonb not null default
    '{"shareSun":true,"shareMoon":true,"shareNumbers":true,"shareChinese":true,"shareHumanDesign":true}'::jsonb,
  b_share_prefs jsonb not null default
    '{"shareSun":true,"shareMoon":true,"shareNumbers":true,"shareChinese":true,"shareHumanDesign":true}'::jsonb,
  created_at    timestamptz not null default now(),
  unique (user_a, user_b)
);
create index if not exists idx_partner_links_a on public.partner_links(user_a);
create index if not exists idx_partner_links_b on public.partner_links(user_b);

-- ════════════════════════════════════════════════════════════════════
-- REFERRALS
-- ════════════════════════════════════════════════════════════════════
create table if not exists public.referrals (
  id                uuid primary key default gen_random_uuid(),
  referrer_user_id  uuid not null references auth.users(id) on delete cascade,
  referred_user_id  uuid not null references auth.users(id) on delete cascade,
  source            text not null default 'partner_invite'
                      check (source in ('partner_invite', 'share')),
  invite_id         uuid references public.partner_invites(id) on delete set null,
  created_at        timestamptz not null default now(),
  unique (referrer_user_id, referred_user_id)
);
create index if not exists idx_referrals_referrer on public.referrals(referrer_user_id);

-- ════════════════════════════════════════════════════════════════════
-- BOND READINGS (daily two-person reading, cached per link per day)
-- ════════════════════════════════════════════════════════════════════
create table if not exists public.bond_readings (
  id             uuid primary key default gen_random_uuid(),
  link_id        uuid not null references public.partner_links(id) on delete cascade,
  reading_date   date not null,
  together_text  text,
  flow_grow      jsonb,
  shared_weather jsonb,
  generated_at   timestamptz not null default now(),
  unique (link_id, reading_date)
);
create index if not exists idx_bond_readings_link on public.bond_readings(link_id, reading_date desc);

-- ─── extend compatibility_reports to support links ──────────────────
alter table public.compatibility_reports
  add column if not exists link_id uuid references public.partner_links(id) on delete cascade;
alter table public.compatibility_reports alter column connection_id drop not null;
do $$ begin
  alter table public.compatibility_reports add constraint compat_link_lens_unique unique (link_id, lens);
exception when duplicate_table or duplicate_object then null;
end $$;

-- ════════════════════════════════════════════════════════════════════
-- RLS
-- ════════════════════════════════════════════════════════════════════
alter table public.partner_invites enable row level security;
alter table public.partner_links   enable row level security;
alter table public.referrals       enable row level security;
alter table public.bond_readings   enable row level security;

-- Invites: the inviter can read their own. Accept/preview happen via the
-- service-role client inside the partner function.
create policy "invites read own" on public.partner_invites
  for select using ((select auth.uid()) = inviter_user_id);

-- Links: BOTH members may read the shared row (writes happen server-side).
create policy "links read members" on public.partner_links
  for select using (
    (select auth.uid()) = user_a or (select auth.uid()) = user_b
  );

-- Bond readings: readable by either member of the owning link.
create policy "bonds read members" on public.bond_readings
  for select using (
    link_id in (
      select id from public.partner_links
      where user_a = (select auth.uid()) or user_b = (select auth.uid())
    )
  );

-- Referrals: visible to either party.
create policy "referrals read involved" on public.referrals
  for select using (
    (select auth.uid()) = referrer_user_id or (select auth.uid()) = referred_user_id
  );

-- Compatibility reports for a link: readable by either link member (in addition
-- to the existing owner policy).
create policy "compat read link members" on public.compatibility_reports
  for select using (
    link_id is not null and link_id in (
      select id from public.partner_links
      where user_a = (select auth.uid()) or user_b = (select auth.uid())
    )
  );

-- ─── realtime: partners get the live "shared reading is ready" event ──
do $$
begin
  begin alter publication supabase_realtime add table public.bond_readings;
  exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.partner_links;
  exception when duplicate_object then null; end;
end $$;

-- ─── schedule: daily bond readings ──────────────────────────────────
do $$
begin
  begin perform cron.unschedule('soluna-bond-readings'); exception when others then null; end;
  perform cron.schedule('soluna-bond-readings', '20 0 * * *',
    $cmd$ select public.call_edge('cron-bond-readings'); $cmd$);
end $$;
