-- 0004_ai_project_intelligence.sql
-- ADDITIVE DRAFT for the existing H871 database.
-- Review first. Do not run against any other Supabase project.
-- This migration does not recreate existing tables or rewrite existing RLS policies.
-- It assumes public.projects, public.documents, public.user_roles, and
-- public.has_hub_role(text[]) already exist as confirmed by the workspace owner.

begin;

-- Main Concept points to an existing document record. The selected version is
-- the documents row itself; keep per-run analyses separately below.
alter table public.projects
  add column if not exists main_concept_document_id uuid
    references public.documents(id) on delete set null,
  add column if not exists private_note text;

create index if not exists projects_main_concept_document_id_idx
  on public.projects(main_concept_document_id);

-- Each run is immutable history for one document/version. Status and output
-- are explicit so failed/quota-limited runs never overwrite a valid project.
create table if not exists public.project_ai_analyses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  document_sha256 text,
  version_label text,
  provider text not null default 'gemini',
  model text not null,
  status text not null default 'queued'
    check (status in ('queued','processing','succeeded','failed','quota_exhausted','cancelled')),
  result jsonb,
  summary text,
  technical_scope text,
  key_equipment jsonb not null default '[]'::jsonb,
  requirements jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  open_questions jsonb not null default '[]'::jsonb,
  suggested_tags text[] not null default '{}',
  source_references jsonb not null default '[]'::jsonb,
  error_code text,
  error_message text,
  requested_by uuid references auth.users(id) on delete set null,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists project_ai_analyses_project_created_idx
  on public.project_ai_analyses(project_id, created_at desc);
create index if not exists project_ai_analyses_document_created_idx
  on public.project_ai_analyses(document_id, created_at desc);
create index if not exists project_ai_analyses_status_idx
  on public.project_ai_analyses(status);

-- Record before/after snapshots for Main Concept application and manual restore.
-- Restore is a new row; existing history must never be deleted/replaced.
create table if not exists public.project_change_history (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  event_type text not null
    check (event_type in ('main_concept_applied','main_concept_changed','manual_edit','restore')),
  source_analysis_id uuid references public.project_ai_analyses(id) on delete set null,
  source_document_id uuid references public.documents(id) on delete set null,
  source_version_label text,
  previous_description text,
  new_description text,
  previous_tags text[] not null default '{}',
  new_tags text[] not null default '{}',
  previous_main_concept_document_id uuid references public.documents(id) on delete set null,
  new_main_concept_document_id uuid references public.documents(id) on delete set null,
  restored_from_history_id uuid references public.project_change_history(id) on delete set null,
  changed_by uuid references auth.users(id) on delete set null,
  change_note text,
  created_at timestamptz not null default now()
);

create index if not exists project_change_history_project_created_idx
  on public.project_change_history(project_id, created_at desc);

alter table public.project_ai_analyses enable row level security;
alter table public.project_change_history enable row level security;

-- Shared-read policy follows the currently observed H871 projects/documents
-- policy. Only admins/editors can insert/update/delete through authenticated
-- clients; the server-side function must still validate the caller and project.
create policy "authenticated read project AI analyses"
  on public.project_ai_analyses for select to authenticated using (true);
create policy "editors manage project AI analyses"
  on public.project_ai_analyses for all to authenticated
  using (public.has_hub_role(array['admin','editor']))
  with check (public.has_hub_role(array['admin','editor']));

create policy "authenticated read project change history"
  on public.project_change_history for select to authenticated using (true);
create policy "editors manage project change history"
  on public.project_change_history for all to authenticated
  using (public.has_hub_role(array['admin','editor']))
  with check (public.has_hub_role(array['admin','editor']));

commit;
