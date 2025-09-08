-- Assign all existing users to Sample Client 1 (which already has the correct Google Sheet ID)
UPDATE profiles 
SET client_id = '11111111-1111-1111-1111-111111111111'
WHERE client_id IS NULL;