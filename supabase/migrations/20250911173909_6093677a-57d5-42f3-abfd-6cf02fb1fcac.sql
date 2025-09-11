-- Create a default client for existing users without client_id
-- Insert a default client
INSERT INTO public.clients (id, client_name, google_sheet_id)
VALUES (gen_random_uuid(), 'My Company', null)
ON CONFLICT DO NOTHING;

-- Get the client ID we just created (or existing one)
DO $$ 
DECLARE
    client_uuid UUID;
BEGIN
    -- Get the client ID
    SELECT id INTO client_uuid FROM public.clients WHERE client_name = 'My Company' LIMIT 1;
    
    -- Update all profiles that don't have a client_id yet
    UPDATE public.profiles 
    SET client_id = client_uuid 
    WHERE client_id IS NULL AND role = 'client_admin';
END $$;