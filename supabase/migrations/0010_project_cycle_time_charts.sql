-- Persist one Cycle Time Builder worksheet per H871 project.
create table if not exists public.project_cycle_time_charts (
  project_id uuid primary key references public.projects(id) on delete cascade,
  title text not null default 'Cycle Time Chart',
  chart_data jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_cycle_time_charts_updated_at_idx
  on public.project_cycle_time_charts(updated_at desc);

alter table public.project_cycle_time_charts enable row level security;

create policy "authenticated read project cycle time charts"
  on public.project_cycle_time_charts for select to authenticated
  using (true);

create policy "editors manage project cycle time charts"
  on public.project_cycle_time_charts for all to authenticated
  using (public.has_hub_role(array['admin','editor']))
  with check (public.has_hub_role(array['admin','editor']));

create or replace function public.set_project_cycle_time_chart_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists project_cycle_time_charts_updated_at
  on public.project_cycle_time_charts;
create trigger project_cycle_time_charts_updated_at
  before update on public.project_cycle_time_charts
  for each row execute function public.set_project_cycle_time_chart_updated_at();
