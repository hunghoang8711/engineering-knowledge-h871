-- H871 async AI preflight: READ-ONLY diagnostics.
-- Run in Supabase SQL Editor before applying migrations 0004 or 0007.
-- This script does not create, alter, delete, or schedule anything.

-- 1) Relevant tables and actual columns/types.
select table_name, column_name, data_type, udt_name, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'projects','documents','user_roles','project_ai_analyses',
    'project_ai_analysis_jobs','project_change_history','project_customers'
  )
order by table_name, ordinal_position;

-- 2) Required role helper and AI/queue RPC signatures, if already present.
select n.nspname as schema_name, p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as arguments,
       pg_get_function_result(p.oid) as result_type,
       p.prosecdef as security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'has_hub_role','apply_main_concept','restore_project_history',
    'claim_project_ai_analysis_job','heartbeat_project_ai_analysis_job',
    'finish_project_ai_analysis_job','enqueue_project_ai_analysis_job'
  )
order by p.proname, arguments;

-- 3) Installed extensions relevant to the optional cloud scheduler.
select extname, extversion, n.nspname as extension_schema
from pg_extension e
join pg_namespace n on n.oid = e.extnamespace
where extname in ('pg_cron','pg_net','supabase_vault')
order by extname;

-- 4) RLS state and policies on relevant public tables.
select c.relname as table_name, c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as force_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'projects','documents','user_roles','project_ai_analyses',
    'project_ai_analysis_jobs','project_change_history'
  )
order by c.relname;

select schemaname, tablename, policyname, permissive, roles,
       cmd, qual, with_check
from pg_policies
where schemaname in ('public','storage')
  and tablename in (
    'projects','documents','user_roles','project_ai_analyses',
    'project_ai_analysis_jobs','project_change_history','objects'
  )
order by schemaname, tablename, policyname;

-- 5) Storage bucket metadata (no file names or contents).
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'h871-project-documents';

-- 6) Safe Cron availability check.
-- to_regclass() returns NULL when pg_cron / cron.job is not installed;
-- unlike querying cron.job directly, this never raises 42P01.
select
  exists (select 1 from pg_extension where extname = 'pg_cron') as pg_cron_installed,
  to_regclass('cron.job') as cron_job_catalog;

-- 7) Queue privilege boundary (after migration 0007 is applied).
-- Expected: anon/authenticated cannot access the queue table or execute worker RPCs;
-- service_role can. This is diagnostic only and does not alter grants.
select
  has_table_privilege('anon', 'public.project_ai_analysis_jobs', 'select') as anon_can_read_jobs,
  has_table_privilege('authenticated', 'public.project_ai_analysis_jobs', 'select') as authenticated_can_read_jobs,
  has_table_privilege('service_role', 'public.project_ai_analysis_jobs', 'select') as service_role_can_read_jobs,
  has_function_privilege('anon', 'public.claim_project_ai_analysis_job(integer)', 'execute') as anon_can_claim,
  has_function_privilege('authenticated', 'public.claim_project_ai_analysis_job(integer)', 'execute') as authenticated_can_claim,
  has_function_privilege('service_role', 'public.claim_project_ai_analysis_job(integer)', 'execute') as service_role_can_claim;

-- 8) Storage object metadata shape for the private H871 bucket.
-- Aggregates only; no object names, paths, or file contents are returned.
-- Confirms whether the worker's pre-download metadata.size guard can operate.
select
  count(*) as object_count,
  count(*) filter (where metadata ? 'size') as objects_with_size_metadata,
  count(*) filter (
    where coalesce(metadata->>'size', '') ~ '^[0-9]+(\\.[0-9]+)?$'
  ) as objects_with_numeric_size_metadata,
  max(case
    when coalesce(metadata->>'size', '') ~ '^[0-9]+(\\.[0-9]+)?$'
      then (metadata->>'size')::numeric
    else null
  end) as largest_metadata_size_bytes
from storage.objects
where bucket_id = 'h871-project-documents';
