-- Soluna — extensions
-- pgcrypto: gen_random_uuid + digest helpers
-- pg_net:   async HTTP from pg_cron jobs (invoke Edge Functions)
-- pg_cron:  scheduled jobs
-- pgmq:     durable queues for async work (compute-blueprint, push fan-out)

create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_net;       -- creates the `net` schema
create extension if not exists pg_cron;      -- creates the `cron` schema
create extension if not exists pgmq;         -- creates the `pgmq` schema

-- Vault is used to store the project URL + service role + cron secret that the
-- pg_cron jobs need to call Edge Functions. (Supabase ships supabase_vault.)
create extension if not exists supabase_vault with schema vault;
