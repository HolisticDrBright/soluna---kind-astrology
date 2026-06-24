-- Soluna — Row Level Security
-- Principle: a signed-in user can touch ONLY their own rows. Shared content
-- (rituals, templates, transit snapshots) is read-only to authenticated users.
-- The service-role client used inside Edge Functions bypasses RLS, so all
-- privileged writes happen server-side; these policies guard direct client
-- access (anon key + user JWT) used for Realtime and direct reads.

-- ─── enable RLS everywhere ─────────────────────────────────────────
alter table public.users                  enable row level security;
alter table public.birth_profiles         enable row level security;
alter table public.blueprints             enable row level security;
alter table public.placements             enable row level security;
alter table public.daily_readings         enable row level security;
alter table public.insights               enable row level security;
alter table public.ask_conversations      enable row level security;
alter table public.ask_messages           enable row level security;
alter table public.ask_memory             enable row level security;
alter table public.connections            enable row level security;
alter table public.compatibility_reports  enable row level security;
alter table public.tarot_readings         enable row level security;
alter table public.journal_entries        enable row level security;
alter table public.rituals                enable row level security;
alter table public.saved_items            enable row level security;
alter table public.subscriptions          enable row level security;
alter table public.purchases              enable row level security;
alter table public.push_tokens            enable row level security;
alter table public.notification_prefs     enable row level security;
alter table public.content_templates      enable row level security;
alter table public.transit_snapshots      enable row level security;
alter table public.logs                   enable row level security;

-- ─── helper: a single "own row" policy macro, written out per table ─

-- users: read/update own row only
create policy "users self read"   on public.users for select using ((select auth.uid()) = id);
create policy "users self update" on public.users for update using ((select auth.uid()) = id);

-- birth_profiles
create policy "birth own" on public.birth_profiles
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- blueprints
create policy "blueprints own" on public.blueprints
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- placements (scoped through owning blueprint)
create policy "placements own" on public.placements
  for select using (
    blueprint_id in (select id from public.blueprints where user_id = (select auth.uid()))
  );

-- daily_readings
create policy "readings own" on public.daily_readings
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- insights: own rows OR the generic (user_id null) cache, read-only to clients
create policy "insights read" on public.insights
  for select using (user_id is null or (select auth.uid()) = user_id);

-- ask_conversations
create policy "ask conv own" on public.ask_conversations
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ask_messages (scoped through owning conversation)
create policy "ask msg own" on public.ask_messages
  for select using (
    conversation_id in (select id from public.ask_conversations where user_id = (select auth.uid()))
  );

-- ask_memory
create policy "ask mem own" on public.ask_memory
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- connections
create policy "connections own" on public.connections
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- compatibility_reports
create policy "compat own" on public.compatibility_reports
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- tarot_readings
create policy "tarot own" on public.tarot_readings
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- journal_entries
create policy "journal own" on public.journal_entries
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- saved_items
create policy "saved own" on public.saved_items
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- subscriptions: read-only to clients (writes only via webhook/service role)
create policy "subs read own" on public.subscriptions
  for select using ((select auth.uid()) = user_id);

-- purchases: read-only to clients
create policy "purchases read own" on public.purchases
  for select using ((select auth.uid()) = user_id);

-- push_tokens
create policy "push own" on public.push_tokens
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- notification_prefs
create policy "prefs own" on public.notification_prefs
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ─── shared content: authenticated read-only ───────────────────────
create policy "rituals read" on public.rituals
  for select to authenticated using (true);
create policy "templates read" on public.content_templates
  for select to authenticated using (true);
create policy "transits read" on public.transit_snapshots
  for select to authenticated using (true);

-- logs: no client policies => clients see nothing; service role bypasses RLS.
