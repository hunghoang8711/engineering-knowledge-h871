-- Engineering Knowledge Hub H871
-- Initial schema only. Run this in the NEW, dedicated Supabase project.
-- No existing Supabase project is modified by this file.
-- Data access: authenticated users can read; editor/admin roles can write.
-- After creating your account, grant the first admin role using the SQL note in docs/supabase-setup.md.

create extension if not exists pgcrypto;

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'editor', 'viewer')),
  created_at timestamptz not null default now()
);

create or replace function public.has_hub_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = any(allowed_roles)
  );
$$;

revoke all on function public.has_hub_role(text[]) from public;
grant execute on function public.has_hub_role(text[]) to authenticated;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'on_hold', 'completed', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  title text not null,
  original_filename text,
  file_type text,
  relative_path text,
  sha256 text,
  version_label text,
  source_kind text not null default 'local_file'
    check (source_kind in ('local_file', 'notebooklm_import', 'manual_entry', 'external_link')),
  source_uri text,
  extracted_text text,
  summary text,
  status text not null default 'pending_review'
    check (status in ('pending_review', 'approved', 'rejected', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sha256)
);

create table if not exists public.knowledge_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  title text not null,
  content text not null,
  category text,
  source_document_ids uuid[] not null default '{}',
  confidence text not null default 'unreviewed'
    check (confidence in ('unreviewed', 'verified', 'needs_check', 'conflicting')),
  review_status text not null default 'pending'
    check (review_status in ('pending', 'approved', 'rejected')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.document_tags (
  document_id uuid not null references public.documents(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (document_id, tag_id)
);

create index if not exists documents_project_id_idx on public.documents(project_id);
create index if not exists documents_customer_id_idx on public.documents(customer_id);
create index if not exists documents_status_idx on public.documents(status);
create index if not exists documents_file_type_idx on public.documents(file_type);
create index if not exists knowledge_entries_project_id_idx on public.knowledge_entries(project_id);
create index if not exists knowledge_entries_customer_id_idx on public.knowledge_entries(customer_id);
create index if not exists knowledge_entries_review_status_idx on public.knowledge_entries(review_status);
create index if not exists document_tags_tag_id_idx on public.document_tags(tag_id);

alter table public.user_roles enable row level security;
alter table public.projects enable row level security;
alter table public.customers enable row level security;
alter table public.documents enable row level security;
alter table public.knowledge_entries enable row level security;
alter table public.tags enable row level security;
alter table public.document_tags enable row level security;

-- Users can see their own role. Only an existing admin can manage role assignments.
create policy "users read own role"
  on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_hub_role(array['admin']));

create policy "admins manage roles"
  on public.user_roles for all to authenticated
  using (public.has_hub_role(array['admin']))
  with check (public.has_hub_role(array['admin']));

-- All signed-in members can read shared hub data; only editor/admin can write.
create policy "authenticated read projects" on public.projects
  for select to authenticated using (true);
create policy "editors manage projects" on public.projects
  for all to authenticated
  using (public.has_hub_role(array['admin','editor']))
  with check (public.has_hub_role(array['admin','editor']));

create policy "authenticated read customers" on public.customers
  for select to authenticated using (true);
create policy "editors manage customers" on public.customers
  for all to authenticated
  using (public.has_hub_role(array['admin','editor']))
  with check (public.has_hub_role(array['admin','editor']));

create policy "authenticated read documents" on public.documents
  for select to authenticated using (true);
create policy "editors manage documents" on public.documents
  for all to authenticated
  using (public.has_hub_role(array['admin','editor']))
  with check (public.has_hub_role(array['admin','editor']));

create policy "authenticated read knowledge" on public.knowledge_entries
  for select to authenticated using (true);
create policy "editors manage knowledge" on public.knowledge_entries
  for all to authenticated
  using (public.has_hub_role(array['admin','editor']))
  with check (public.has_hub_role(array['admin','editor']));

create policy "authenticated read tags" on public.tags
  for select to authenticated using (true);
create policy "editors manage tags" on public.tags
  for all to authenticated
  using (public.has_hub_role(array['admin','editor']))
  with check (public.has_hub_role(array['admin','editor']));

create policy "authenticated read document tags" on public.document_tags
  for select to authenticated using (true);
create policy "editors manage document tags" on public.document_tags
  for all to authenticated
  using (public.has_hub_role(array['admin','editor']))
  with check (public.has_hub_role(array['admin','editor']));
