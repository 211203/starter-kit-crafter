-- Ensure pgcrypto is available for gen_random_uuid
create extension if not exists pgcrypto with schema public;

-- Ensure profiles.id default uses gen_random_uuid
alter table if exists public.profiles
  alter column id set default gen_random_uuid();

-- Harden the handle_new_user trigger to avoid aborting user creation
create or replace function public.handle_new_user()
returns trigger 
language plpgsql 
security definer 
set search_path = public
as $$
begin
  begin
    insert into public.profiles (user_id, display_name)
    values (new.id, new.raw_user_meta_data ->> 'display_name')
    on conflict (user_id) do nothing;
  exception when others then
    -- Avoid breaking auth.users insert; log and continue
    raise warning 'handle_new_user failed for user %: %', new.id, sqlerrm;
  end;
  return new;
end;
$$;
