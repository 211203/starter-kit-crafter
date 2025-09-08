-- Create storage bucket for CSV imports
INSERT INTO storage.buckets (id, name, public) 
VALUES ('csv-imports', 'csv-imports', false);

-- Create policies for CSV upload bucket
CREATE POLICY "Users can upload their own CSV files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'csv-imports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own CSV files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'csv-imports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own CSV files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'csv-imports' AND auth.uid()::text = (storage.foldername(name))[1]);