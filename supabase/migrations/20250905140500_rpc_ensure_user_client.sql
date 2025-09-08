-- RPC to ensure the current authenticated user has a client assigned.
-- If none exists, create a new client row and assign it to the user's profile.
-- google_sheet_id is optional.

create or replace function public.ensure_user_client(p_client_name text default null, p_google_sheet_id text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_client_id uuid;
  v_name text;
BEGIN
  -- identify current user
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- ensure profile row exists
  insert into public.profiles (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  -- if already assigned, return it
  select client_id into v_client_id from public.profiles where user_id = v_user_id;
  if v_client_id is not null then
    return v_client_id;
  end if;

  -- compute name
  v_name := coalesce(p_client_name, 'Client ' || left(v_user_id::text, 8));

  -- create a new client
  insert into public.clients (client_name, google_sheet_id)
  values (v_name, p_google_sheet_id)
  returning id into v_client_id;

  -- assign to profile
  update public.profiles set client_id = v_client_id where user_id = v_user_id;

  return v_client_id;
END;
$$;

-- Allow authenticated users to execute the function
grant execute on function public.ensure_user_client(text, text) to authenticated;
