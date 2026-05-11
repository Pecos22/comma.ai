-- The Twelve Weeks — Supabase schema
--
-- Run this once in your Supabase project's SQL Editor.
-- It is idempotent: safe to re-run if you ever need to.
--
-- What it does:
--   1. Creates a `course_progress` table keyed by (couple_id, week_number).
--   2. Enables Row-Level Security so anonymous users see nothing.
--   3. Grants authenticated users full CRUD on the table.
--   4. Auto-updates `updated_at` on every UPDATE.
--   5. Enables realtime so each partner's edits stream live to the other.

----------------------------------------------------------------------
-- 1. Table
----------------------------------------------------------------------
create table if not exists public.course_progress (
  couple_id   text        not null,
  week_number smallint    not null check (week_number between 1 and 12),
  completed   boolean     not null default false,
  notes       text        not null default '',
  updated_at  timestamptz not null default now(),
  updated_by  uuid        references auth.users(id) on delete set null,
  primary key (couple_id, week_number)
);

----------------------------------------------------------------------
-- 2. Lock it down with RLS
----------------------------------------------------------------------
alter table public.course_progress enable row level security;

----------------------------------------------------------------------
-- 3. Policies: authenticated users only. Anon = no access.
--    For a two-person couple sharing one COUPLE_ID, "authenticated"
--    is gate enough — anyone who signs up and confirms email gets in.
--    If you ever want stricter (e.g. only specific user IDs), tighten
--    the USING / WITH CHECK clauses here.
----------------------------------------------------------------------
drop policy if exists "auth can read"   on public.course_progress;
drop policy if exists "auth can insert" on public.course_progress;
drop policy if exists "auth can update" on public.course_progress;
drop policy if exists "auth can delete" on public.course_progress;

create policy "auth can read"
  on public.course_progress for select
  to authenticated using (true);

create policy "auth can insert"
  on public.course_progress for insert
  to authenticated with check (true);

create policy "auth can update"
  on public.course_progress for update
  to authenticated using (true) with check (true);

create policy "auth can delete"
  on public.course_progress for delete
  to authenticated using (true);

----------------------------------------------------------------------
-- 4. Trigger to keep updated_at honest
----------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists course_progress_set_updated_at on public.course_progress;

create trigger course_progress_set_updated_at
  before update on public.course_progress
  for each row execute function public.set_updated_at();

----------------------------------------------------------------------
-- 5. Enable realtime on this table
--    (Wrapped in a DO block so re-running the script doesn't error.)
----------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname    = 'supabase_realtime'
      and schemaname = 'public'
      and tablename  = 'course_progress'
  ) then
    alter publication supabase_realtime add table public.course_progress;
  end if;
end
$$;
