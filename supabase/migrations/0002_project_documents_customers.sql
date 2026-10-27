-- H871 project-centric document management and customer relationships
-- Run in the dedicated H871 Supabase project only.
alter table public.customers
  add column if not exists customer_type text not null default 'end_user'
    check (customer_type in ('end_user','intermediary')),
  add column if not exists end_user_name text,
  add column if not exists description text;

alter table public.documents
  add column if not exists notes text,
  add column if not exists updated_by uuid references auth.users(id) on delete set null,
  add column if not exists created_by_name text,
  add column if not exists updated_by_name text;

create table if not exists public.project_customers (
  project_id uuid not null references public.projects(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (project_id, customer_id)
);
alter table public.project_customers enable row level security;
create policy "authenticated read project customers" on public.project_customers
  for select to authenticated using (true);
create policy "editors manage project customers" on public.project_customers
  for all to authenticated
  using (public.has_hub_role(array['admin','editor']))
  with check (public.has_hub_role(array['admin','editor']));

create index if not exists customers_name_lower_idx on public.customers (lower(name));
create index if not exists customers_end_user_lower_idx on public.customers (lower(end_user_name));
create index if not exists project_customers_customer_id_idx on public.project_customers(customer_id);

-- Private bucket: only approved Office and PDF documents are accepted by the UI.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'h871-project-documents',
  'h871-project-documents',
  false,
  52428800,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel.sheet.macroEnabled.12',
    'application/vnd.ms-word.document.macroEnabled.12'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "authenticated read H871 project documents"
on storage.objects for select to authenticated
using (bucket_id = 'h871-project-documents' and auth.uid() is not null);

create policy "editors upload H871 project documents"
on storage.objects for insert to authenticated
with check (bucket_id = 'h871-project-documents' and public.has_hub_role(array['admin','editor']));

create policy "editors update H871 project documents"
on storage.objects for update to authenticated
using (bucket_id = 'h871-project-documents' and public.has_hub_role(array['admin','editor']))
with check (bucket_id = 'h871-project-documents' and public.has_hub_role(array['admin','editor']));

create policy "editors delete H871 project documents"
on storage.objects for delete to authenticated
using (bucket_id = 'h871-project-documents' and public.has_hub_role(array['admin','editor']));
