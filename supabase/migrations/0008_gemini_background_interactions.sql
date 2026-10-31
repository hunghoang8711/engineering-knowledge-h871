-- 0008_gemini_background_interactions.sql
-- Additive migration: preserve existing analyses and queue rows.
-- A Gemini interaction is submitted once, then polled by its durable ID.

begin;

alter table public.project_ai_analysis_jobs
  add column if not exists gemini_interaction_id text,
  add column if not exists gemini_submission_started_at timestamptz,
  add column if not exists gemini_last_status text,
  add column if not exists gemini_poll_count integer not null default 0;

create unique index if not exists project_ai_analysis_jobs_gemini_interaction_uidx
  on public.project_ai_analysis_jobs(gemini_interaction_id)
  where gemini_interaction_id is not null;

-- Record the irreversible submission boundary before making the external POST.
-- If the worker disappears after this point without saving an Interaction ID,
-- the next worker must not submit the PDF again.
create or replace function public.mark_gemini_interaction_submission_started(
  p_job_id uuid,
  p_lease_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if (auth.jwt() ->> 'role') is distinct from 'service_role' then
    raise exception 'SERVICE_ROLE_REQUIRED';
  end if;

  update public.project_ai_analysis_jobs
  set gemini_submission_started_at = now(),
      updated_at = now()
  where id = p_job_id
    and status = 'processing'
    and lease_token = p_lease_token
    and lease_expires_at > now()
    and gemini_interaction_id is null
    and gemini_submission_started_at is null;

  get diagnostics v_count = row_count;
  return v_count = 1;
end;
$$;

-- Persist the Interaction ID and release the queue lease. The same job will
-- become claimable at available_at and will be polled, never resubmitted.
create or replace function public.defer_gemini_interaction_job(
  p_job_id uuid,
  p_lease_token uuid,
  p_interaction_id text,
  p_provider_status text,
  p_delay_seconds integer default 300
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job public.project_ai_analysis_jobs%rowtype;
  v_now timestamptz := now();
begin
  if (auth.jwt() ->> 'role') is distinct from 'service_role' then
    raise exception 'SERVICE_ROLE_REQUIRED';
  end if;
  if nullif(btrim(p_interaction_id), '') is null
     or length(p_interaction_id) > 500
     or p_provider_status not in ('in_progress', 'requires_action') 
     or p_delay_seconds < 30 or p_delay_seconds > 3600 then
    raise exception 'INVALID_INTERACTION_DEFER_ARGUMENTS';
  end if;

  select * into v_job
  from public.project_ai_analysis_jobs
  where id = p_job_id
  for update;

  if not found
     or v_job.status <> 'processing'
     or v_job.lease_token is distinct from p_lease_token
     or v_job.lease_expires_at is null
     or v_job.lease_expires_at <= v_now then
    raise exception 'JOB_LEASE_NOT_OWNED_OR_EXPIRED';
  end if;

  if v_job.gemini_interaction_id is not null
     and v_job.gemini_interaction_id <> p_interaction_id then
    raise exception 'GEMINI_INTERACTION_ID_CONFLICT';
  end if;

  update public.project_ai_analysis_jobs
  set gemini_interaction_id = p_interaction_id,
      gemini_last_status = p_provider_status,
      gemini_poll_count = gemini_poll_count + 1,
      status = 'queued',
      available_at = v_now + make_interval(secs => p_delay_seconds),
      lease_token = null,
      lease_expires_at = null,
      heartbeat_at = null,
      updated_at = v_now
  where id = p_job_id;

  update public.project_ai_analyses
  set status = 'queued'
  where id = v_job.analysis_id;

  return 'queued';
end;
$$;

revoke all on function public.mark_gemini_interaction_submission_started(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.defer_gemini_interaction_job(uuid, uuid, text, text, integer)
  from public, anon, authenticated;

grant execute on function public.mark_gemini_interaction_submission_started(uuid, uuid)
  to service_role;
grant execute on function public.defer_gemini_interaction_job(uuid, uuid, text, text, integer)
  to service_role;

commit;
