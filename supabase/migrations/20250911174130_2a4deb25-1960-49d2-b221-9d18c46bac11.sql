-- Fix profiles.client_id foreign key to reference the real tenants table
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_client_id_fkey1;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_client_id_fkey;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_client_id_fkey
  FOREIGN KEY (client_id)
  REFERENCES public.clients(id)
  ON DELETE SET NULL;

-- Recreate ensure_user_client to assign a tenant if missing
CREATE OR REPLACE FUNCTION public.ensure_user_client(p_client_name text DEFAULT NULL::text, p_google_sheet_id text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_user_id uuid;
  v_client_id uuid;
  v_name text;
BEGIN
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
  select coalesce(p_client_name, display_name, 'Client ' || left(v_user_id::text, 8))
  into v_name
  from public.profiles where user_id = v_user_id;

  -- create a new client (tenant)
  insert into public.clients (client_name, google_sheet_id)
  values (v_name, p_google_sheet_id)
  returning id into v_client_id;

  -- assign to profile
  update public.profiles set client_id = v_client_id where user_id = v_user_id;

  return v_client_id;
END;
$$;

-- Backfill: create a tenant for any existing client_admin without one
DO $$
DECLARE r record; v_client_id uuid; v_name text; BEGIN
  FOR r IN SELECT id, user_id, display_name FROM public.profiles WHERE client_id IS NULL AND role = 'client_admin' LOOP
    v_name := coalesce(r.display_name, 'Client ' || left(r.user_id::text, 8));
    INSERT INTO public.clients (client_name) VALUES (v_name) RETURNING id INTO v_client_id;
    UPDATE public.profiles SET client_id = v_client_id WHERE id = r.id;
  END LOOP;
END $$;