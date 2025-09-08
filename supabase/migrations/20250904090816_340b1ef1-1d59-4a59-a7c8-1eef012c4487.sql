-- Update the handle_new_user function to create client automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_client_id uuid;
  company_name text;
BEGIN
  -- Get company name from metadata, default to 'My Company'
  company_name := COALESCE(NEW.raw_user_meta_data ->> 'company_name', 'My Company');
  
  -- Create a new client for this user
  INSERT INTO public.clients (client_name, google_sheet_id)
  VALUES (company_name, NULL)
  RETURNING id INTO new_client_id;
  
  -- Create the user profile and link to the client
  INSERT INTO public.profiles (user_id, display_name, client_id)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name', new_client_id);
  
  RETURN NEW;
END;
$$;