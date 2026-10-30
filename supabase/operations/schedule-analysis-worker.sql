-- H871 queue worker scheduler (manual opt-in setup; NOT run automatically).
-- Prerequisites:
--   1) Deploy process-analysis-queue only after migrations 0004 and 0007 are reviewed/applied.
--   2) Set H871_QUEUE_WORKER_SECRET in Supabase Edge Function secrets (>=32 random chars).
--   3) Store the same secret, project URL, and anon/publishable API key in Vault.
--   4) Confirm pg_cron, pg_net and Vault are available on this project's current plan.
--
-- Store values separately in Supabase Vault (Dashboard -> SQL Editor):
-- select vault.create_secret('https://<project-ref>.supabase.co', 'h871_project_url');
-- select vault.create_secret('<anon-or-publishable-key>', 'h871_public_api_key');
-- select vault.create_secret('<same-random-worker-secret>', 'h871_worker_secret');
--
-- The worker endpoint has verify_jwt=false but performs its own high-entropy
-- x-h871-worker-secret check. Never put the worker secret in frontend code.
-- pg_net temporarily stores request headers in its queue; restrict database
-- access accordingly. Do not grant untrusted users SQL access.

do $$
begin
  if not exists (select 1 from vault.decrypted_secrets where name = 'h871_project_url') then
    raise exception 'Missing Vault secret: h871_project_url';
  end if;
  if not exists (select 1 from vault.decrypted_secrets where name = 'h871_public_api_key') then
    raise exception 'Missing Vault secret: h871_public_api_key';
  end if;
  if not exists (select 1 from vault.decrypted_secrets where name = 'h871_worker_secret') then
    raise exception 'Missing Vault secret: h871_worker_secret';
  end if;
end $$;

-- One invocation every two minutes: low idle invocation volume, with at most
-- one claimed job per worker invocation. Lease-token locking protects overlap.
select cron.unschedule(jobid)
from cron.job
where jobname = 'h871-process-analysis-queue';

select cron.schedule(
  'h871-process-analysis-queue',
  '*/2 * * * *',
  $job$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'h871_project_url')
             || '/functions/v1/process-analysis-queue',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'h871_public_api_key'),
        'x-h871-worker-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'h871_worker_secret')
      ),
      body := '{"source":"supabase-cron"}'::jsonb,
      timeout_milliseconds := 120000
    );
  $job$
);

-- Verify schedule:
-- select jobid, jobname, schedule, active from cron.job
-- where jobname = 'h871-process-analysis-queue';
--
-- Inspect recent runs:
-- select * from cron.job_run_details
-- where jobid = (select jobid from cron.job where jobname = 'h871-process-analysis-queue')
-- order by start_time desc limit 20;
--
-- Disable without deleting queue data:
-- select cron.unschedule(jobid) from cron.job
-- where jobname = 'h871-process-analysis-queue';
