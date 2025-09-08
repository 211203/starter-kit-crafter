-- Update the existing client with the Google Sheet ID
UPDATE clients 
SET google_sheet_id = '1ml9LehSGPRE7XWJMdg3HZkmVwbZVHtfYVEl-htWU3MM'
WHERE client_name = 'Demo Client';

-- Assign all existing users to the Demo Client
UPDATE profiles 
SET client_id = (SELECT id FROM clients WHERE client_name = 'Demo Client' LIMIT 1)
WHERE client_id IS NULL;