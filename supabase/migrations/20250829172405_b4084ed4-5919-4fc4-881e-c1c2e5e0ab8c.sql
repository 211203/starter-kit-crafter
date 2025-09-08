-- Only allow users to update their client's google_sheet_id when it's currently NULL
CREATE POLICY "Users can update client google_sheet_id when null" 
ON public.clients 
FOR UPDATE 
USING (
  id IN (
    SELECT profiles.client_id
    FROM profiles
    WHERE profiles.user_id = auth.uid()
  ) 
  AND google_sheet_id IS NULL
)
WITH CHECK (
  id IN (
    SELECT profiles.client_id
    FROM profiles
    WHERE profiles.user_id = auth.uid()
  )
);