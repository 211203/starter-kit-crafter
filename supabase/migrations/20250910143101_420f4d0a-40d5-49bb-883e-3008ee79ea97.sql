-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role
LANGUAGE SQL
SECURITY DEFINER 
STABLE 
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_client_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER 
STABLE 
SET search_path = public
AS $$
  SELECT client_id FROM public.profiles WHERE user_id = auth.uid();
$$;