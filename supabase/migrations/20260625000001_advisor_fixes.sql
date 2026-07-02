-- Soluna — post-initial hardening + advisor fixes.
-- Safe to run on a live database; every statement is idempotent.
--
-- 1) SECURITY (acceptance criterion): generated content (blueprints, daily
--    readings) must NOT be directly writable by a normal authenticated user.
--    Both tables are written only by Edge Functions using the service role
--    (blueprint-service.ts, today, generate-daily-readings), so removing the
--    owner WRITE policies leaves reads intact and blocks forgery. (This also
--    covers the existing ..._zz_harden_generated_content_policies.sql, so you
--    only need to run THIS file.)
-- 2) PERFORMANCE (advisor: unindexed_foreign_keys): add covering indexes.
-- 3) SECURITY (advisor: function_search_path_mutable): pin the trigger fn path.

begin;

-- ── 1. Generated-content hardening ─────────────────────────────────
drop policy if exists "Blueprints insertable by owner" on public.blueprints;
drop policy if exists "Blueprints updatable by owner" on public.blueprints;
drop policy if exists "Blueprints deletable by owner" on public.blueprints;

drop policy if exists "Daily readings insertable by owner" on public.daily_readings;
drop policy if exists "Daily readings updatable by owner" on public.daily_readings;
drop policy if exists "Daily readings deletable by owner" on public.daily_readings;
-- (Owner SELECT policies remain, so users can still read their own rows.)

-- ── 2. Missing foreign-key covering indexes ────────────────────────
create index if not exists focus_guidance_user_idx on public.focus_guidance (user_id);
create index if not exists focus_checkins_focus_idx on public.focus_checkins (focus_id, created_at desc);
create index if not exists focus_checkins_user_idx on public.focus_checkins (user_id);
create index if not exists compatibility_reports_user_idx on public.compatibility_reports (user_id);
create index if not exists compatibility_reports_connection_idx on public.compatibility_reports (connection_id);
create index if not exists compatibility_reports_link_idx on public.compatibility_reports (link_id);
create index if not exists connections_linked_user_idx on public.connections (linked_user_id);
create index if not exists partner_invites_inviter_idx on public.partner_invites (inviter_user_id);
create index if not exists partner_invites_accepted_idx on public.partner_invites (accepted_user_id);
create index if not exists referrals_referrer_idx on public.referrals (referrer_user_id);
create index if not exists referrals_referred_idx on public.referrals (referred_user_id);
create index if not exists referrals_invite_idx on public.referrals (invite_id);
create index if not exists purchases_user_idx on public.purchases (user_id);

-- ── 3. Pin the trigger function's search_path ──────────────────────
-- now() resolves from pg_catalog, so an empty search_path is safe and removes
-- the mutable-search_path advisory. (handle_new_user already sets search_path.)
alter function private.set_updated_at() set search_path = '';

commit;
