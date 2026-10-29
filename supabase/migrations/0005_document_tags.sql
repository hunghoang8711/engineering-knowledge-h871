-- Add searchable, user-editable tags to each document.
-- Safe to run on the existing manually-managed schema; does not modify project tags.
alter table public.documents
  add column if not exists tags text[] not null default '{}'::text[];

create index if not exists documents_tags_gin_idx
  on public.documents using gin (tags);
