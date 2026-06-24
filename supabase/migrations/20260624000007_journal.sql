-- Soluna — journal enhancements: tags + a source reference (e.g. the reading or
-- insight a reflection was sparked by).
alter table public.journal_entries
  add column if not exists tags text[] not null default '{}',
  add column if not exists source_ref text;

create index if not exists idx_journal_tags on public.journal_entries using gin (tags);
