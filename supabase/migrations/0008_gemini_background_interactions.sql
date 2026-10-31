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

-- Background polling is not a new provider submission. Once an Interaction ID
-- exists, allow unlimited bounded poll claims regardless of max_attempts.
create or replace function public.claim_project_ai_analysis_job(
  p_lease_seconds integer default 180
)
returns table (
  job_id uuid,
  analysis_id uuid,
  project_id uuid,
  document_id uuid,
  attempt_count integer,
  max_attempts integer,
  lease_token uuid,
  lease_expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $
declare
  v_job public.project_ai_analysis_jobs%rowtype;
  v_now timestamptz := now();
begin
  if (auth.jwt() ->> 'role') is distinct from 'service_role' then
    raise exception 'SERVICE_ROLE_REQUIRED';
  end if;
  if p_lease_seconds is null or p_lease_seconds < 30 or p_lease_seconds > 900 then
    raise exception 'INVALID_LEASE_DURATION';
  end if;

  update public.project_ai_analysis_jobs j
  set status = 'failed',
      lease_token = null,
      lease_expires_at = null,
      heartbeat_at = null,
      last_error_code = 'WORKER_LEASE_EXPIRED_MAX_ATTEMPTS',
      last_error_message = 'Worker lease expired and maximum submission attempts were reached.',
      completed_at = v_now,
      updated_at = v_now
  where j.status = 'processing'
    and j.lease_expires_at < v_now
    and j.gemini_interaction_id is null
    and j.attempt_count >= j.max_attempts;

  update public.project_ai_analyses a
  set status = 'failed',
      error_code = 'WORKER_LEASE_EXPIRED_MAX_ATTEMPTS',
      error_message = 'Worker lease expired and maximum submission attempts were reached.',
      completed_at = v_now
  where a.id in (
    select j.analysis_id
    from public.project_ai_analysis_jobs j
    where j.status = 'failed'
      and j.last_error_code = 'WORKER_LEASE_EXPIRED_MAX_ATTEMPTS'
      and j.completed_at = v_now
  );

  select j.* into v_job
  from public.project_ai_analysis_jobs j
  where (
      j.status = 'queued'
      or (j.status = 'processing' and j.lease_expires_at < v_now)
    )
    and j.available_at <= v_now
    and (
      j.gemini_interaction_id is not null
      or j.attempt_count < j.max_attempts
    )
  order by j.available_at asc, j.created_at asc
  for update skip locked
  limit 1;

  if not found then return; end if;

  update public.project_ai_analysis_jobs j
  set status = 'processing',
      attempt_count = j.attempt_count + 1,
      lease_token = gen_random_uuid(),
      lease_expires_at = v_now + make_interval(secs => p_lease_seconds),
      heartbeat_at = v_now,
      started_at = coalesce(j.started_at, v_now),
      updated_at = v_now
  where j.id = v_job.id
  returning j.* into v_job;

  update public.project_ai_analyses
  set status = 'processing',
      started_at = coalesce(started_at, v_now),
      completed_at = null,
      error_code = null,
      error_message = null
  where id = v_job.analysis_id;

  if not found then raise exception 'ANALYSIS_RECORD_NOT_FOUND'; end if;

  return query select
    v_job.id, v_job.analysis_id, v_job.project_id, v_job.document_id,
    v_job.attempt_count, v_job.max_attempts, v_job.lease_token,
    v_job.lease_expires_at;
end;
$;

revoke all on function public.claim_project_ai_analysis_job(integer)
  from public, anon, authenticated;
grant execute on function public.claim_project_ai_analysis_job(integer)
  to service_role;

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
