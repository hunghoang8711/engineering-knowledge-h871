-- Store End User per project-Customer relationship, not on the shared Customer profile.
-- Run this migration in the dedicated H871 Supabase project's SQL Editor.
alter table public.project_customers
  add column if not exists end_user_name text;

-- Preserve existing intermediary End User names as the initial project-specific value.
update public.project_customers pc
set end_user_name = c.end_user_name
from public.customers c
where c.id = pc.customer_id
  and pc.end_user_name is null
  and c.end_user_name is not null;

create index if not exists project_customers_end_user_lower_idx
  on public.project_customers (lower(end_user_name))
  where end_user_name is not null;
