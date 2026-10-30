-- 0007_async_analysis_jobs.sql
-- ADDITIVE DRAFT ONLY. Live preflight confirms the AI analysis/history tables
-- and Main Concept RPCs already exist. Review this migration against that live
-- schema before applying. Do not replay migration 0004.
-- This migration does not deploy a worker or change existing project/document RLS.

begin;

create table if not exists public.project_ai_analysis_jobs (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null unique
    references public.project_ai_analyses(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  idempotency_key text not null unique,
  status text not null default 'queued'
    check (status in ('queued','processing','succeeded','failed','quota_exhausted','cancelled')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 3 check (max_attempts between 1 and 10),
  available_at timestamptz not null default now(),
  lease_token uuid,
  lease_expires_at timestamptz,
  heartbeat_at timestamptz,
  last_error_code text,
  last_error_message text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  constraint project_ai_analysis_jobs_lease_consistency check (
    (status = 'processing' and lease_token is not null and lease_expires_at is not null)
    or
    (status <> 'processing' and lease_token is null and lease_expires_at is null)
  )
);

create index if not exists project_ai_analysis_jobs_claim_idx
  on public.project_ai_analysis_jobs(status, available_at, created_at);

create index if not exists project_ai_analysis_jobs_expired_lease_idx
  on public.project_ai_analysis_jobs(lease_expires_at)
  where status = 'processing';

alter table public.project_ai_analysis_jobs enable row level security;

-- Queue internals are server-side implementation details. The frontend polls
-- project_ai_analyses, not this table, so authenticated users need no direct
-- access to job rows. The worker uses the service_role key and bypasses RLS.
revoke all on table public.project_ai_analysis_jobs from anon, authenticated;
grant all on table public.project_ai_analysis_jobs to service_role;

-- Atomic queue claim. Only the Supabase service role may execute this function.
-- FOR UPDATE SKIP LOCKED allows multiple workers without double-claiming a job.
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
set search_path = public, pg_temp
as $$
declare
  v_job public.project_ai_analysis_jobs%rowtype;
  v_now timestamptz := now();
begin
  if current_setting('request.jwt.claim.role', true) is distinct from 'service_role' then
    raise exception 'SERVICE_ROLE_REQUIRED';
  end if;

  if p_lease_seconds is null or p_lease_seconds < 30 or p_lease_seconds > 900 then
    raise exception 'INVALID_LEASE_DURATION';
  end if;

  -- Expired jobs that exhausted their attempts become terminal failures.
  update public.project_ai_analysis_jobs j
  set status = 'failed',
      lease_token = null,
      lease_expires_at = null,
      heartbeat_at = null,
      last_error_code = 'WORKER_LEASE_EXPIRED_MAX_ATTEMPTS',
      last_error_message = 'Worker lease expired and maximum attempts were reached.',
      completed_at = v_now,
      updated_at = v_now
  where j.status = 'processing'
    and j.lease_expires_at < v_now
    and j.attempt_count >= j.max_attempts;

  -- Keep the user-visible analysis record in sync with jobs exhausted by lease expiry.
  update public.project_ai_analyses a
  set status = 'failed',
      error_code = 'WORKER_LEASE_EXPIRED_MAX_ATTEMPTS',
      error_message = 'Worker lease expired and maximum attempts were reached.',
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
    and j.attempt_count < j.max_attempts
  order by j.available_at asc, j.created_at asc
  for update skip locked
  limit 1;

  if not found then
    return;
  end if;

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

  -- Keep the browser-visible analysis run in sync with the leased job.
  -- This update is in the same transaction as the claim, so the UI never
  -- observes a processing job while its analysis row remains queued.
  update public.project_ai_analyses
  set status = 'processing',
      started_at = coalesce(started_at, v_now),
      completed_at = null,
      error_code = null,
      error_message = null
  where id = v_job.analysis_id;

  if not found then
    raise exception 'ANALYSIS_RECORD_NOT_FOUND';
  end if;

  return query select
    v_job.id,
    v_job.analysis_id,
    v_job.project_id,
    v_job.document_id,
    v_job.attempt_count,
    v_job.max_attempts,
    v_job.lease_token,
    v_job.lease_expires_at;
end;
$$;

-- Extend a lease only when the worker still owns it.
create or replace function public.heartbeat_project_ai_analysis_job(
  p_job_id uuid,
  p_lease_token uuid,
  p_lease_seconds integer default 180
)
returns timestamptz
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_expires_at timestamptz;
begin
  if current_setting('request.jwt.claim.role', true) is distinct from 'service_role' then
    raise exception 'SERVICE_ROLE_REQUIRED';
  end if;

  if p_lease_seconds is null or p_lease_seconds < 30 or p_lease_seconds > 900 then
    raise exception 'INVALID_LEASE_DURATION';
  end if;

  update public.project_ai_analysis_jobs
  set lease_expires_at = now() + make_interval(secs => p_lease_seconds),
      heartbeat_at = now(),
      updated_at = now()
  where id = p_job_id
    and status = 'processing'
    and lease_token = p_lease_token
    and lease_expires_at > now()
  returning lease_expires_at into v_expires_at;

  if v_expires_at is null then
    raise exception 'JOB_LEASE_NOT_OWNED_OR_EXPIRED';
  end if;

  return v_expires_at;
end;
$$;

revoke all on function public.claim_project_ai_analysis_job(integer)
  from public, anon, authenticated;
revoke all on function public.heartbeat_project_ai_analysis_job(uuid, uuid, integer)
  from public, anon, authenticated;

grant execute on function public.claim_project_ai_analysis_job(integer)
  to service_role;
grant execute on function public.heartbeat_project_ai_analysis_job(uuid, uuid, integer)
  to service_role;


-- Finalize only while the caller still owns an unexpired lease.
-- A positive retry delay requeues ordinary failures while attempts remain.
-- Quota exhaustion is terminal: there is deliberately no paid-provider fallback.
create or replace function public.finish_project_ai_analysis_job(
  p_job_id uuid,
  p_lease_token uuid,
  p_status text,
  p_result jsonb default null,
  p_error_code text default null,
  p_error_message text default null,
  p_retry_delay_seconds integer default 0
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job public.project_ai_analysis_jobs%rowtype;
  v_analysis_id uuid;
  v_next_job_status text;
  v_next_analysis_status text;
  v_now timestamptz := now();
begin
  if current_setting('request.jwt.claim.role', true) is distinct from 'service_role' then
    raise exception 'SERVICE_ROLE_REQUIRED';
  end if;

  if p_status is null or p_status not in ('succeeded', 'failed', 'quota_exhausted') then
    raise exception 'INVALID_FINAL_STATUS';
  end if;
  if p_retry_delay_seconds is null or p_retry_delay_seconds < 0
     or p_retry_delay_seconds > 86400 then
    raise exception 'INVALID_RETRY_DELAY';
  end if;

  select j.* into v_job
  from public.project_ai_analysis_jobs j
  where j.id = p_job_id
  for update;

  if not found
     or v_job.status <> 'processing'
     or v_job.lease_token is distinct from p_lease_token
     or v_job.lease_expires_at is null
     or v_job.lease_expires_at <= v_now then
    raise exception 'JOB_LEASE_NOT_OWNED_OR_EXPIRED';
  end if;

  if p_status = 'succeeded' then
    if p_result is null or jsonb_typeof(p_result) <> 'object'
       or nullif(btrim(p_result->>'summary'), '') is null then
      raise exception 'INVALID_ANALYSIS_RESULT';
    end if;

    if (p_result ? 'key_equipment' and jsonb_typeof(p_result->'key_equipment') is distinct from 'array')
       or (p_result ? 'requirements' and jsonb_typeof(p_result->'requirements') is distinct from 'array')
       or (p_result ? 'risks' and jsonb_typeof(p_result->'risks') is distinct from 'array')
       or (p_result ? 'open_questions' and jsonb_typeof(p_result->'open_questions') is distinct from 'array')
       or (p_result ? 'source_references' and jsonb_typeof(p_result->'source_references') is distinct from 'array')
       or (p_result ? 'suggested_tags' and jsonb_typeof(p_result->'suggested_tags') is distinct from 'array') then
      raise exception 'INVALID_ANALYSIS_RESULT_ARRAY_FIELDS';
    end if;

    update public.project_ai_analyses
    set status = 'succeeded',
        result = p_result,
        summary = p_result->>'summary',
        technical_scope = p_result->>'technical_scope',
        key_equipment = coalesce(p_result->'key_equipment', '[]'::jsonb),
        requirements = coalesce(p_result->'requirements', '[]'::jsonb),
        risks = coalesce(p_result->'risks', '[]'::jsonb),
        open_questions = coalesce(p_result->'open_questions', '[]'::jsonb),
        suggested_tags = coalesce(
          array(select jsonb_array_elements_text(coalesce(p_result->'suggested_tags','[]'::jsonb))),
          '{}'::text[]
        ),
        source_references = coalesce(p_result->'source_references', '[]'::jsonb),
        error_code = null,
        error_message = null,
        completed_at = v_now
    where id = v_job.analysis_id;

    if not found then raise exception 'ANALYSIS_RECORD_NOT_FOUND'; end if;
    v_next_job_status := 'succeeded';
    v_next_analysis_status := 'succeeded';

  elsif p_status = 'quota_exhausted' then
    update public.project_ai_analyses
    set status = 'quota_exhausted',
        error_code = left(coalesce(p_error_code, 'GEMINI_QUOTA_EXHAUSTED'), 120),
        error_message = left(coalesce(p_error_message, 'Gemini free quota or rate limit was reached.'), 2000),
        completed_at = v_now
    where id = v_job.analysis_id;

    if not found then raise exception 'ANALYSIS_RECORD_NOT_FOUND'; end if;
    v_next_job_status := 'quota_exhausted';
    v_next_analysis_status := 'quota_exhausted';

  else
    if v_job.attempt_count < v_job.max_attempts and p_retry_delay_seconds > 0 then
      v_next_job_status := 'queued';
      v_next_analysis_status := 'queued';
    else
      v_next_job_status := 'failed';
      v_next_analysis_status := 'failed';
    end if;

    update public.project_ai_analyses
    set status = v_next_analysis_status,
        error_code = left(coalesce(p_error_code, 'ANALYSIS_FAILED'), 120),
        error_message = left(coalesce(p_error_message, 'Document analysis failed.'), 2000),
        completed_at = case when v_next_analysis_status = 'failed' then v_now else null end
    where id = v_job.analysis_id;

    if not found then raise exception 'ANALYSIS_RECORD_NOT_FOUND'; end if;
  end if;

  update public.project_ai_analysis_jobs
  set status = v_next_job_status,
      available_at = case
        when v_next_job_status = 'queued'
          then v_now + make_interval(secs => p_retry_delay_seconds)
        else available_at
      end,
      lease_token = null,
      lease_expires_at = null,
      heartbeat_at = null,
      last_error_code = case when p_status = 'succeeded' then null
        else left(coalesce(p_error_code, p_status), 120) end,
      last_error_message = case when p_status = 'succeeded' then null
        else left(coalesce(p_error_message, p_status), 2000) end,
      completed_at = case when v_next_job_status in ('succeeded','failed','quota_exhausted')
        then v_now else null end,
      updated_at = v_now
  where id = p_job_id;

  return v_next_job_status;
end;
$$;

revoke all on function public.finish_project_ai_analysis_job(uuid, uuid, text, jsonb, text, text, integer)
  from public, anon, authenticated;
grant execute on function public.finish_project_ai_analysis_job(uuid, uuid, text, jsonb, text, text, integer)
  to service_role;


-- Create the analysis run and its durable queue record in one transaction.
-- The Edge Function performs user authentication/role checks before calling this
-- service-role-only RPC. Advisory locking makes duplicate requests idempotent.
create or replace function public.enqueue_project_ai_analysis_job(
  p_project_id uuid,
  p_document_id uuid,
  p_requested_by uuid,
  p_model text,
  p_idempotency_key text,
  p_max_attempts integer default 3
)
returns table (
  job_id uuid,
  analysis_id uuid,
  job_status text,
  was_created boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_existing public.project_ai_analysis_jobs%rowtype;
  v_document public.documents%rowtype;
  v_analysis_id uuid;
  v_job_id uuid;
begin
  if current_setting('request.jwt.claim.role', true) is distinct from 'service_role' then
    raise exception 'SERVICE_ROLE_REQUIRED';
  end if;
  if p_project_id is null or p_document_id is null or p_requested_by is null
     or nullif(btrim(p_model), '') is null
     or nullif(btrim(p_idempotency_key), '') is null
     or length(p_idempotency_key) > 200 then
    raise exception 'INVALID_ENQUEUE_ARGUMENTS';
  end if;
  if p_max_attempts is null or p_max_attempts < 1 or p_max_attempts > 5 then
    raise exception 'INVALID_MAX_ATTEMPTS';
  end if;
  select d.* into v_document
  from public.documents d
  where d.id = p_document_id and d.project_id = p_project_id;
  if not found then
    raise exception 'DOCUMENT_NOT_FOUND_FOR_PROJECT';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_idempotency_key, 0));

  select j.* into v_existing
  from public.project_ai_analysis_jobs j
  where j.idempotency_key = p_idempotency_key;

  if found then
    if v_existing.project_id <> p_project_id
       or v_existing.document_id <> p_document_id
       or v_existing.created_by is distinct from p_requested_by then
      raise exception 'IDEMPOTENCY_KEY_CONFLICT';
    end if;
    return query select v_existing.id, v_existing.analysis_id, v_existing.status, false;
    return;
  end if;

  -- Snapshot source revision metadata at enqueue time. The worker must not
  -- update this row outside the lease-guarded finalization transaction.
  insert into public.project_ai_analyses (
    project_id, document_id, document_sha256, version_label,
    provider, model, status, requested_by
  ) values (
    p_project_id, p_document_id, v_document.sha256, v_document.version_label,
    'gemini', p_model, 'queued', p_requested_by
  ) returning id into v_analysis_id;

  insert into public.project_ai_analysis_jobs (
    analysis_id, project_id, document_id, idempotency_key,
    status, max_attempts, created_by
  ) values (
    v_analysis_id, p_project_id, p_document_id, p_idempotency_key,
    'queued', p_max_attempts, p_requested_by
  ) returning id into v_job_id;

  return query select v_job_id, v_analysis_id, 'queued'::text, true;
end;
$$;

revoke all on function public.enqueue_project_ai_analysis_job(uuid, uuid, uuid, text, text, integer)
  from public, anon, authenticated;
grant execute on function public.enqueue_project_ai_analysis_job(uuid, uuid, uuid, text, text, integer)
  to service_role;

-- Read only the size of an object in the fixed private H871 bucket.
-- This avoids relying on the Storage schema being exposed through PostgREST.
-- SECURITY DEFINER accesses storage.objects internally; callers receive no paths
-- or metadata, and only service_role may execute this RPC.
create or replace function public.get_h871_project_document_size(p_name text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_size text;
begin
  if current_setting('request.jwt.claim.role', true) is distinct from 'service_role' then
    raise exception 'SERVICE_ROLE_REQUIRED';
  end if;
  if p_name is null or p_name = '' or left(p_name, 1) = '/'
     or position('..' in p_name) > 0 then
    raise exception 'INVALID_STORAGE_PATH';
  end if;

  select o.metadata->>'size' into v_size
  from storage.objects o
  where o.bucket_id = 'h871-project-documents'
    and o.name = p_name
  limit 1;

  if v_size is null or v_size !~ '^[0-9]+$' then
    return null;
  end if;
  return v_size::bigint;
end;
$$;

revoke all on function public.get_h871_project_document_size(text)
  from public, anon, authenticated;
grant execute on function public.get_h871_project_document_size(text)
  to service_role;


commit;
