-- Soluna — async queues (pgmq) + scheduled jobs (pg_cron)
-- Async work runs through pgmq queues drained by an Edge Function; scheduled
-- jobs are pg_cron entries that POST to Edge Functions via pg_net.

-- ─── queues ────────────────────────────────────────────────────────
do $$ begin perform pgmq.create('compute_blueprint'); exception when others then null; end $$;
do $$ begin perform pgmq.create('send_push');         exception when others then null; end $$;

-- ─── invoke an Edge Function from SQL (used by pg_cron) ─────────────
-- Reads the project URL + shared cron secret from Vault. Set them once after
-- deploy (see README-backend.md):
--   select vault.create_secret('https://<ref>.supabase.co', 'project_url');
--   select vault.create_secret('<random-cron-secret>',      'cron_secret');
create or replace function public.call_edge(fn text, body jsonb default '{}'::jsonb)
returns void
language plpgsql
security definer
set search_path = public, net, vault, extensions
as $$
declare
  v_url    text;
  v_secret text;
begin
  select decrypted_secret into v_url    from vault.decrypted_secrets where name = 'project_url' limit 1;
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'cron_secret' limit 1;

  if v_url is null then
    insert into public.logs(kind, payload)
      values ('cron_error', jsonb_build_object('fn', fn, 'error', 'project_url not set in vault'));
    return;
  end if;

  perform net.http_post(
    url     := v_url || '/functions/v1/' || fn,
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'x-cron-secret', coalesce(v_secret, '')
               ),
    body    := body,
    timeout_milliseconds := 20000
  );
end;
$$;

-- ─── public wrappers over pgmq (PostgREST only exposes the public schema) ──
create or replace function public.queue_pop(p_queue text, p_qty int default 10, p_vt int default 60)
returns table(msg_id bigint, message jsonb)
language plpgsql
security definer
set search_path = public, pgmq
as $$
begin
  return query select m.msg_id, m.message from pgmq.read(p_queue, p_vt, p_qty) m;
end;
$$;

create or replace function public.queue_ack(p_queue text, p_msg_id bigint)
returns boolean
language sql
security definer
set search_path = public, pgmq
as $$
  select pgmq.delete(p_queue, p_msg_id);
$$;

create or replace function public.queue_send(p_queue text, p_msg jsonb)
returns bigint
language sql
security definer
set search_path = public, pgmq
as $$
  select pgmq.send(p_queue, p_msg);
$$;

-- ─── enqueue a blueprint recompute (called by the `me` function on birth change) ─
create or replace function public.enqueue_blueprint(p_user uuid)
returns bigint
language sql
security definer
set search_path = public, pgmq
as $$
  select pgmq.send('compute_blueprint', jsonb_build_object('user_id', p_user));
$$;

-- ─── nightly entitlement reconciliation (pure SQL, no Edge call) ───
create or replace function public.reconcile_entitlements()
returns void
language sql
security definer
set search_path = public
as $$
  update public.subscriptions
     set entitlement = 'free', status = 'expired'
   where expires_at is not null
     and expires_at < now()
     and entitlement <> 'free';
$$;

-- ─── schedules (idempotent: unschedule-if-exists, then schedule) ────
do $$
declare
  job record;
begin
  for job in
    select * from (values
      ('soluna-drain-queue',      '* * * * *',  $cmd$ select public.call_edge('cron-drain-queue'); $cmd$),
      ('soluna-daily-readings',   '0 * * * *',  $cmd$ select public.call_edge('cron-daily-readings'); $cmd$),
      ('soluna-refresh-transits', '10 0 * * *', $cmd$ select public.call_edge('cron-refresh-transits'); $cmd$),
      ('soluna-reconcile',        '0 2 * * *',  $cmd$ select public.reconcile_entitlements(); $cmd$)
    ) as t(jobname, sched, cmd)
  loop
    begin perform cron.unschedule(job.jobname); exception when others then null; end;
    perform cron.schedule(job.jobname, job.sched, job.cmd);
  end loop;
end $$;
