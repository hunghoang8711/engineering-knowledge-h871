-- 0004_ai_project_intelligence.sql
-- ADDITIVE DRAFT for the existing H871 database. Review before applying.
-- Do not replay migrations 0001-0003 against a database created manually.
-- Assumes public.projects, public.documents, public.user_roles and
-- public.has_hub_role(text[]) already exist.
begin;

alter table public.projects
  add column if not exists main_concept_document_id uuid
    references public.documents(id) on delete set null,
  add column if not exists private_note text;

create index if not exists projects_main_concept_document_id_idx
  on public.projects(main_concept_document_id);

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

-- Re-runnable policy definitions if this additive draft is reviewed/re-applied.
drop policy if exists "authenticated read project AI analyses" on public.project_ai_analyses;
drop policy if exists "editors manage project AI analyses" on public.project_ai_analyses;
drop policy if exists "authenticated read project change history" on public.project_change_history;
drop policy if exists "editors manage project change history" on public.project_change_history;

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

-- Ensure Main Concept document is attached to the same project. A plain FK
-- only validates document ID, not the project/document relationship.
create or replace function public.validate_project_main_concept_document()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.main_concept_document_id is not null and not exists (
    select 1 from public.documents d
    where d.id = new.main_concept_document_id
      and d.project_id = new.id
  ) then
    raise exception 'MAIN_CONCEPT_DOCUMENT_MUST_BELONG_TO_PROJECT';
  end if;
  return new;
end;
$$;

drop trigger if exists projects_validate_main_concept_document on public.projects;
create trigger projects_validate_main_concept_document
before insert or update of main_concept_document_id on public.projects
for each row execute function public.validate_project_main_concept_document();

-- Apply the latest successful analysis for a document as one transaction:
-- update project fields and append the before/after snapshot together.
create or replace function public.apply_main_concept(
  p_project_id uuid,
  p_document_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_project public.projects%rowtype;
  v_doc public.documents%rowtype;
  v_analysis public.project_ai_analyses%rowtype;
  v_event_id uuid;
  v_event_type text;
begin
  if v_user_id is null or not public.has_hub_role(array['admin','editor']) then
    raise exception 'FORBIDDEN';
  end if;

  select * into v_project
  from public.projects where id = p_project_id for update;
  if not found then raise exception 'PROJECT_NOT_FOUND'; end if;

  select * into v_doc
  from public.documents
  where id = p_document_id and project_id = p_project_id;
  if not found then raise exception 'MAIN_CONCEPT_DOCUMENT_MUST_BELONG_TO_PROJECT'; end if;

  select * into v_analysis
  from public.project_ai_analyses
  where project_id = p_project_id
    and document_id = p_document_id
    and status = 'succeeded'
  order by completed_at desc nulls last, created_at desc
  limit 1;

  if not found then
    raise exception 'NO_SUCCESSFUL_ANALYSIS_FOR_MAIN_CONCEPT';
  end if;
  if nullif(trim(coalesce(v_analysis.summary, '')), '') is null then
    raise exception 'SUCCESSFUL_ANALYSIS_HAS_NO_SUMMARY';
  end if;

  v_event_type := case
    when v_project.main_concept_document_id is null then 'main_concept_applied'
    when v_project.main_concept_document_id <> p_document_id then 'main_concept_changed'
    else 'main_concept_applied'
  end;

  update public.projects
  set main_concept_document_id = p_document_id,
      description = v_analysis.summary,
      tags = coalesce(v_analysis.suggested_tags, '{}'::text[]),
      updated_at = now()
  where id = p_project_id;

  insert into public.project_change_history (
    project_id, event_type, source_analysis_id, source_document_id,
    source_version_label, previous_description, new_description,
    previous_tags, new_tags, previous_main_concept_document_id,
    new_main_concept_document_id, changed_by, change_note
  ) values (
    p_project_id, v_event_type, v_analysis.id, p_document_id,
    v_doc.version_label, v_project.description, v_analysis.summary,
    coalesce(v_project.tags, '{}'::text[]),
    coalesce(v_analysis.suggested_tags, '{}'::text[]),
    v_project.main_concept_document_id, p_document_id, v_user_id,
    'Applied latest successful AI analysis for Main Concept'
  ) returning id into v_event_id;

  return v_event_id;
end;
$$;

-- Restore is also atomic and append-only: old events remain untouched.
create or replace function public.restore_project_history(
  p_project_id uuid,
  p_history_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_project public.projects%rowtype;
  v_target public.project_change_history%rowtype;
  v_event_id uuid;
begin
  if v_user_id is null or not public.has_hub_role(array['admin','editor']) then
    raise exception 'FORBIDDEN';
  end if;

  select * into v_project
  from public.projects where id = p_project_id for update;
  if not found then raise exception 'PROJECT_NOT_FOUND'; end if;

  select * into v_target
  from public.project_change_history
  where id = p_history_id and project_id = p_project_id;
  if not found then raise exception 'HISTORY_ENTRY_NOT_FOUND_FOR_PROJECT'; end if;

  -- Validate restored Main Concept still points to a document in this project.
  if v_target.new_main_concept_document_id is not null and not exists (
    select 1 from public.documents d
    where d.id = v_target.new_main_concept_document_id
      and d.project_id = p_project_id
  ) then
    raise exception 'HISTORICAL_MAIN_CONCEPT_DOCUMENT_NO_LONGER_BELONGS_TO_PROJECT';
  end if;

  update public.projects
  set description = v_target.new_description,
      tags = coalesce(v_target.new_tags, '{}'::text[]),
      main_concept_document_id = v_target.new_main_concept_document_id,
      updated_at = now()
  where id = p_project_id;

  insert into public.project_change_history (
    project_id, event_type, source_analysis_id, source_document_id,
    source_version_label, previous_description, new_description,
    previous_tags, new_tags, previous_main_concept_document_id,
    new_main_concept_document_id, restored_from_history_id, changed_by, change_note
  ) values (
    p_project_id, 'restore', v_target.source_analysis_id,
    v_target.new_main_concept_document_id, v_target.source_version_label,
    v_project.description, v_target.new_description,
    coalesce(v_project.tags, '{}'::text[]), coalesce(v_target.new_tags, '{}'::text[]),
    v_project.main_concept_document_id, v_target.new_main_concept_document_id,
    v_target.id, v_user_id, 'Restored snapshot; original history preserved'
  ) returning id into v_event_id;

  return v_event_id;
end;
$$;

-- SECURITY DEFINER functions are not callable by PUBLIC by default in intent
-- alone; explicitly revoke then grant only to authenticated callers.
revoke all on function public.apply_main_concept(uuid, uuid) from public, anon;
revoke all on function public.restore_project_history(uuid, uuid) from public, anon;
grant execute on function public.apply_main_concept(uuid, uuid) to authenticated;
grant execute on function public.restore_project_history(uuid, uuid) to authenticated;

commit;
