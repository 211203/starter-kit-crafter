-- Create sales_clients table with user association
CREATE TABLE public.sales_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_no TEXT NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.sales_clients ENABLE ROW LEVEL SECURITY;

-- Create policies for user-specific access
CREATE POLICY "Users can view their own sales clients" 
ON public.sales_clients 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sales clients" 
ON public.sales_clients 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sales clients" 
ON public.sales_clients 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sales clients" 
ON public.sales_clients 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_sales_clients_updated_at
BEFORE UPDATE ON public.sales_clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data for demonstration (these will be owned by the first user who signs up)
-- You can manually assign these to specific users later through the Supabase dashboard