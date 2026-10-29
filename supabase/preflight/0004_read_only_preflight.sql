-- READ-ONLY preflight for supabase/migrations/0004_ai_project_intelligence.sql
-- Run this BEFORE applying 0004 in the intended Supabase project.
-- Every statement below is SELECT-only. Do not run old migrations 0001-0003
-- against a manually provisioned database just because migration tracking is absent.

-- 1) Confirm the expected base tables and whether new feature tables already exist.
select n.nspname as schema_name, c.relname as table_name, c.relkind,
       c.relrowsecurity as rls_enabled, c.relforcerowsecurity as force_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'projects','documents','user_roles','project_ai_analyses','project_change_history'
  )
order by c.relname;

-- 2) Check required columns on the existing base tables.
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'projects' and column_name in
      ('id','description','tags','updated_at','main_concept_document_id','private_note'))
    or (table_name = 'documents' and column_name in
      ('id','project_id','version_label','sha256','file_type','relative_path'))
    or (table_name = 'user_roles' and column_name in ('user_id','role'))
  )
order by table_name, ordinal_position;

-- 3) Verify the role helper and migration history table existence.
select
  to_regprocedure('public.has_hub_role(text[])') as role_helper,
  to_regclass('supabase_migrations.schema_migrations') as migration_history_table;

-- 4) Inspect current RLS policies on the tables affected by the migration.
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('projects','documents','user_roles','project_ai_analyses','project_change_history')
order by tablename, policyname;

-- 5) Check whether the Main Concept columns or objects already exist before applying.
select
  exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='projects'
      and column_name='main_concept_document_id'
  ) as main_concept_column_exists,
  exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='projects'
      and column_name='private_note'
  ) as private_note_column_exists,
  to_regclass('public.project_ai_analyses') is not null as analyses_table_exists,
  to_regclass('public.project_change_history') is not null as history_table_exists,
  to_regclass('public.projects_validate_main_concept_document') is not null as trigger_name_relation_exists;

-- This script does not prove the migration is safe to apply by itself.
-- Compare results with 0004, investigate any partial objects/schema differences,
-- and take a backup/export before any schema-changing operation.
