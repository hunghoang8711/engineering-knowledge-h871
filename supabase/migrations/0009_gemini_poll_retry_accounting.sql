-- 0009_gemini_poll_retry_accounting.sql
-- Polls of an already-created Gemini Interaction do not consume submission attempts.
-- Transient polling failures must requeue the same interaction even after max_attempts.

begin;

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
as $$
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
      attempt_count = case when j.gemini_interaction_id is null then j.attempt_count + 1 else j.attempt_count end,
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
$$;

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
set search_path = ''
as $$
declare
  v_job public.project_ai_analysis_jobs%rowtype;
  v_analysis_id uuid;
  v_next_job_status text;
  v_next_analysis_status text;
  v_now timestamptz := now();
begin
  if (auth.jwt() ->> 'role') is distinct from 'service_role' then
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
    if (v_job.gemini_interaction_id is not null or v_job.attempt_count < v_job.max_attempts)
       and p_retry_delay_seconds > 0 then
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

revoke all on function public.claim_project_ai_analysis_job(integer)
  from public, anon, authenticated;
grant execute on function public.claim_project_ai_analysis_job(integer)
  to service_role;

revoke all on function public.finish_project_ai_analysis_job(uuid, uuid, text, jsonb, text, text, integer)
  from public, anon, authenticated;
grant execute on function public.finish_project_ai_analysis_job(uuid, uuid, text, jsonb, text, text, integer)
  to service_role;

commit;
