-- Function to create a client for existing users who don't have one
CREATE OR REPLACE FUNCTION create_client_for_user(
  user_email text,
  company_name text DEFAULT 'My Company'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_client_id uuid;
  user_profile_id uuid;
BEGIN
  -- Create a new client
  INSERT INTO public.clients (client_name, google_sheet_id)
  VALUES (company_name, NULL)
  RETURNING id INTO new_client_id;
  
  -- Find and update the user's profile
  UPDATE public.profiles 
  SET client_id = new_client_id
  WHERE user_id = auth.uid()
  RETURNING id INTO user_profile_id;
  
  IF user_profile_id IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  
  RETURN new_client_id;
END;
$$;