-- Function to sync phone numbers from profiles to auth.users
-- This is a one-time sync for existing data

-- Note: This requires using the Supabase Management API or Dashboard
-- as auth.users cannot be directly updated via SQL

-- First, let's create a view to see which users have phones in profiles but not in auth
CREATE OR REPLACE VIEW phone_sync_needed AS
SELECT 
  p.id as user_id,
  p.phone as profile_phone,
  au.phone as auth_phone,
  p.email
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE p.phone IS NOT NULL 
  AND p.phone != ''
  AND (au.phone IS NULL OR au.phone = '');

-- To view users that need phone sync:
-- SELECT * FROM phone_sync_needed;

-- For manual update via Supabase Dashboard:
-- 1. Go to Authentication > Users
-- 2. For each user in phone_sync_needed view
-- 3. Click on the user
-- 4. Add their phone number from the profiles table

-- Alternative: Create a helper function that formats phones correctly
CREATE OR REPLACE FUNCTION format_phone_e164(phone_input text)
RETURNS text AS $$
BEGIN
  -- Remove all non-digit characters
  phone_input := regexp_replace(phone_input, '[^0-9]', '', 'g');
  
  -- If already has country code (starts with 1 and has 11 digits)
  IF length(phone_input) = 11 AND substring(phone_input, 1, 1) = '1' THEN
    RETURN '+' || phone_input;
  -- If 10 digits, assume US number
  ELSIF length(phone_input) = 10 THEN
    RETURN '+1' || phone_input;
  -- If already formatted with +
  ELSIF phone_input LIKE '+%' THEN
    RETURN phone_input;
  ELSE
    -- Return as is if format is unclear
    RETURN '+' || phone_input;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Update profiles to ensure phones are in consistent format
UPDATE profiles
SET phone = format_phone_e164(phone)
WHERE phone IS NOT NULL 
  AND phone != ''
  AND phone NOT LIKE '+%';
