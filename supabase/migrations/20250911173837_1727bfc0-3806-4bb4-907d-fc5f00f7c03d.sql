-- Fix the client setup issue and ensure existing users get proper client_id
-- First, let's create clients for existing users who don't have one

-- Create client for existing users
INSERT INTO public.clients (client_name, google_sheet_id)
SELECT 
  COALESCE(
    (auth.users() ->> 'raw_user_meta_data')::json ->> 'company_name',
    'My Company'
  ) as client_name,
  null as google_sheet_id
FROM auth.users
WHERE id IN (
  SELECT user_id FROM public.profiles WHERE client_id IS NULL AND role = 'client_admin'
)
ON CONFLICT DO NOTHING;

-- Update profiles to link to the newly created clients
UPDATE public.profiles 
SET client_id = c.id
FROM (
  SELECT 
    c.id as client_id,
    u.id as user_id
  FROM public.clients c
  CROSS JOIN auth.users u
  WHERE c.client_name = COALESCE(
    (u.raw_user_meta_data ->> 'company_name'), 
    'My Company'
  )
  AND u.id IN (
    SELECT user_id FROM public.profiles WHERE client_id IS NULL AND role = 'client_admin'
  )
) c
WHERE profiles.user_id = c.user_id AND profiles.client_id IS NULL;