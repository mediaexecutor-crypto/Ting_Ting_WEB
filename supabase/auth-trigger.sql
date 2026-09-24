-- Run this once in the Supabase SQL Editor (after schema.sql).
-- Auto-creates a public.profiles row whenever a new user is added in
-- Authentication -> Users, so RLS policies that check profiles/is_admin()
-- work immediately without a separate manual step.
--
-- Defaults new users to role = 'ADMIN'. This app is used by a small
-- internal team, so this favors "new teammate can see everything" over
-- accidentally locking someone out. Adjust a user's role afterwards
-- directly in the profiles table if you want tighter access.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'ADMIN')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
