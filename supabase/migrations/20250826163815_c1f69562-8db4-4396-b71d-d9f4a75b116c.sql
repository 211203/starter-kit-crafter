-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  google_sheet_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on clients table
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Add client_id to profiles table
ALTER TABLE public.profiles 
ADD COLUMN client_id UUID REFERENCES public.clients(id);

-- Create policies for clients table
CREATE POLICY "Users can view their own client info" 
ON public.clients 
FOR SELECT 
USING (
  id IN (
    SELECT client_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

-- Create trigger for clients table timestamps
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample client data
INSERT INTO public.clients (id, client_name, google_sheet_id) VALUES 
('11111111-1111-1111-1111-111111111111', 'Sample Client 1', '1ml9LehSGPRE7XWJMdg3HZkmVwbZVHtfYVEl-htWU3MM'),
('22222222-2222-2222-2222-222222222222', 'Sample Client 2', '1ml9LehSGPRE7XWJMdg3HZkmVwbZVHtfYVEl-htWU3MM');