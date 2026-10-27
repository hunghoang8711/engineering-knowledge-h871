# New Supabase project setup — Engineering Knowledge Hub H871

## Create a separate project
1. Open https://supabase.com/dashboard and choose **New project**.
2. Use a distinct name such as `engineering-knowledge-h871`.
3. Choose the organization you control and a strong database password. Store it in your password manager; do not send it in chat or commit it to GitHub.
4. Verify the project name before running any SQL. Do not select the database used by another website.

## Create the schema
1. In the new project's **SQL Editor**, open a new query.
2. Copy and run `supabase/migrations/0001_initial_schema.sql`.
3. Check that the tables appear under **Table Editor** and that RLS is enabled.

## Create the first admin role
1. In **Authentication → Users**, sign up/create your own test user first.
2. Copy that user's UUID from the Users page.
3. In SQL Editor, replace `PASTE_AUTH_USER_UUID_HERE` below with that UUID and run this query:
```sql
insert into public.user_roles (user_id, role)
values ('PASTE_AUTH_USER_UUID_HERE', 'admin')
on conflict (user_id) do update set role = excluded.role;
```
Only do this in the new H871 project. Add other staff as `editor` or `viewer` later.

## Connect the frontend (next step)
In **Project Settings → API** (or **Connect**), obtain the Project URL and the publishable/anon key. These are intended for a browser app only when RLS is correctly configured. Never put the database password, service_role key, secret API key, or other privileged secret in frontend code or GitHub.
The current UI is a static prototype and is not yet connected to Supabase. Wait until the schema and access rules have been reviewed before wiring in the client.

## Data protection
- Do not upload company drawings, customer files, extracted confidential text, or real production records to this repository.
- Keep original files in an approved company folder/network share; store only the minimum metadata/relative path in the hub until company policy permits more.
- Take an independent backup before importing real records.
