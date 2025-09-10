-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('client_admin', 'sales_rep');

-- Create sales_reps table (actual sales representatives)
CREATE TABLE public.sales_reps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  client_id UUID NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,  
  email TEXT NOT NULL,
  phone_no TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, email)
);

-- Update profiles table to include role
ALTER TABLE public.profiles ADD COLUMN role public.user_role NOT NULL DEFAULT 'client_admin';

-- Rename sales_representatives to customers (since it stores customer data)
ALTER TABLE public.sales_representatives RENAME TO customers;

-- Add sales_rep_id to customers table to link customers to their sales rep
ALTER TABLE public.customers ADD COLUMN sales_rep_id UUID;

-- Update customers table structure
ALTER TABLE public.customers RENAME COLUMN user_id TO sales_rep_user_id;
ALTER TABLE public.customers ADD COLUMN client_id UUID;

-- Enable RLS on sales_reps
ALTER TABLE public.sales_reps ENABLE ROW LEVEL SECURITY;

-- RLS policies for sales_reps
CREATE POLICY "Client admins can view their sales reps" 
ON public.sales_reps 
FOR SELECT 
USING (
  client_id IN (
    SELECT p.client_id 
    FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'client_admin'
  )
);

CREATE POLICY "Client admins can insert sales reps" 
ON public.sales_reps 
FOR INSERT 
WITH CHECK (
  client_id IN (
    SELECT p.client_id 
    FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'client_admin'
  )
);

CREATE POLICY "Client admins can update their sales reps" 
ON public.sales_reps 
FOR UPDATE 
USING (
  client_id IN (
    SELECT p.client_id 
    FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'client_admin'
  )
);

CREATE POLICY "Sales reps can view their own record" 
ON public.sales_reps 
FOR SELECT 
USING (user_id = auth.uid());

-- Update customers RLS policies
DROP POLICY IF EXISTS "Users can view their own sales clients" ON public.customers;
DROP POLICY IF EXISTS "Users can create their own sales clients" ON public.customers;
DROP POLICY IF EXISTS "Users can update their own sales clients" ON public.customers;
DROP POLICY IF EXISTS "Users can delete their own sales clients" ON public.customers;

CREATE POLICY "Sales reps can view their customers" 
ON public.customers 
FOR SELECT 
USING (sales_rep_user_id = auth.uid());

CREATE POLICY "Sales reps can create customers" 
ON public.customers 
FOR INSERT 
WITH CHECK (sales_rep_user_id = auth.uid());

CREATE POLICY "Sales reps can update their customers" 
ON public.customers 
FOR UPDATE 
USING (sales_rep_user_id = auth.uid());

CREATE POLICY "Sales reps can delete their customers" 
ON public.customers 
FOR DELETE 
USING (sales_rep_user_id = auth.uid());

-- Client admins can view all customers in their organization
CREATE POLICY "Client admins can view all customers" 
ON public.customers 
FOR SELECT 
USING (
  client_id IN (
    SELECT p.client_id 
    FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'client_admin'
  )
);

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Create function to get user's client_id
CREATE OR REPLACE FUNCTION public.get_user_client_id()
RETURNS UUID AS $$
  SELECT client_id FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Update triggers
CREATE TRIGGER update_sales_reps_updated_at
BEFORE UPDATE ON public.sales_reps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update handle_new_user function to set appropriate role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (user_id, display_name, role)
    VALUES (
      new.id, 
      new.raw_user_meta_data ->> 'display_name',
      CASE 
        WHEN new.raw_user_meta_data ->> 'role' = 'sales_rep' THEN 'sales_rep'::public.user_role
        ELSE 'client_admin'::public.user_role
      END
    )
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'handle_new_user failed for user %: %', new.id, sqlerrm;
  END;
  RETURN new;
END;
$$;