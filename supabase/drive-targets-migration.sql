-- Run this once in the Supabase SQL Editor (after schema.sql and the
-- other migrations). Supports connecting multiple Google Drive accounts
-- and/or multiple destination folders, with exactly one marked active
-- at a time for where NEW order folders get created. Old targets are
-- never deleted automatically, so previously created folders/files stay
-- linked and viewable regardless of which target is active now.

create table if not exists public.drive_targets(
  id uuid primary key default gen_random_uuid(),
  google_account_id uuid not null references public.google_accounts(id) on delete cascade,
  label text not null,
  parent_folder_id text,
  parent_folder_url text,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.drive_targets enable row level security;
create policy "drive_targets read" on public.drive_targets for select using (auth.uid() is not null);
