-- Fix the client creation issue
-- The current 'clients' table is actually more like a user profiles table
-- We need to rename it and create a proper clients table

-- First, let's rename the current clients table to avoid confusion
-- since it contains user_id and seems to be user-related data
ALTER TABLE clients RENAME TO user_client_mapping;

-- Create a proper clients table for actual client/tenant data
CREATE TABLE clients (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name text NOT NULL,
  google_sheet_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on the new clients table
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create policies for the clients table
CREATE POLICY "Client admins can view their client info" 
ON clients 
FOR SELECT 
USING (id IN (SELECT client_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Client admins can update their client info" 
ON clients 
FOR UPDATE 
USING (id IN (SELECT client_id FROM profiles WHERE user_id = auth.uid()));

-- Add triggers for timestamp updates
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON clients
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Update the ensure_user_client function to work with the new schema
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
  -- identify current user
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- ensure profile row exists
  insert into public.profiles (user_id, role)
  values (v_user_id, 'client_admin')
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