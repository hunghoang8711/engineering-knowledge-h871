-- Upgrade project Cycle Time Charts from one-per-project to multiple charts.
-- Run only after migration 0010 has already been applied.
alter table public.project_cycle_time_charts
  add column if not exists id uuid default gen_random_uuid();

update public.project_cycle_time_charts
set id = gen_random_uuid()
where id is null;

alter table public.project_cycle_time_charts
  alter column id set default gen_random_uuid(),
  alter column id set not null;

do $$
declare
  pk_name text;
  pk_definition text;
begin
  select conname, pg_get_constraintdef(oid)
    into pk_name, pk_definition
  from pg_constraint
  where conrelid = 'public.project_cycle_time_charts'::regclass
    and contype = 'p';

  if pk_name is not null and pk_definition like '%(project_id)%' then
    execute format('alter table public.project_cycle_time_charts drop constraint %I', pk_name);
    pk_name := null;
  end if;

  if pk_name is null then
    alter table public.project_cycle_time_charts
      add constraint project_cycle_time_charts_pkey primary key (id);
  end if;
end $$;

create index if not exists project_cycle_time_charts_project_id_idx
  on public.project_cycle_time_charts(project_id, updated_at desc);
