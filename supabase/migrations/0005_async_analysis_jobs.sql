-- 0005_async_analysis_jobs.sql
-- ADDITIVE DRAFT ONLY. Do not apply until the live schema is reconciled and
-- migration 0004_ai_project_intelligence.sql has been reviewed/applied.
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

drop policy if exists "authenticated read project AI analysis jobs"
  on public.project_ai_analysis_jobs;

create policy "authenticated read project AI analysis jobs"
  on public.project_ai_analysis_jobs
  for select to authenticated
  using (true);

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

commit;
