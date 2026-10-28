-- H871 project tags for searchable, reusable classification
-- Run in the dedicated H871 Supabase project SQL Editor.
alter table public.projects
  add column if not exists tags text[] not null default '{}';

create index if not exists projects_tags_gin_idx
  on public.projects using gin (tags);
