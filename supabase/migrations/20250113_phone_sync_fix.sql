-- Migration to fix phone authentication issues
-- This migration syncs phone numbers between profiles and auth.users tables
-- and ensures proper phone confirmation status

-- First, create a function to format phone numbers to E.164
CREATE OR REPLACE FUNCTION format_phone_e164(phone_input text)
RETURNS text AS $$
BEGIN
  IF phone_input IS NULL OR phone_input = '' THEN
    RETURN NULL;
  END IF;
  
  -- Remove all non-digit characters
  phone_input := regexp_replace(phone_input, '[^0-9]', '', 'g');
  
  -- If already has country code (starts with 1 and has 11 digits for US/Canada)
  IF length(phone_input) = 11 AND substring(phone_input, 1, 1) = '1' THEN
    RETURN '+' || phone_input;
  -- If 10 digits, assume US/Canada number
  ELSIF length(phone_input) = 10 THEN
    RETURN '+1' || phone_input;
  -- If already formatted with +
  ELSIF phone_input LIKE '+%' THEN
    RETURN phone_input;
  -- If it's longer than 11 digits and doesn't start with +, add +
  ELSIF length(phone_input) > 11 THEN
    RETURN '+' || phone_input;
  ELSE
    -- Return with + prefix if not already present
    RETURN CASE WHEN phone_input LIKE '+%' THEN phone_input ELSE '+' || phone_input END;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a function to sync phone from profiles to auth.users
CREATE OR REPLACE FUNCTION sync_phone_to_auth(user_id uuid)
RETURNS void AS $$
DECLARE
  profile_phone text;
  formatted_phone text;
BEGIN
  -- Get the phone from profiles table
  SELECT phone INTO profile_phone
  FROM profiles
  WHERE id = user_id;
  
  -- Format the phone number
  formatted_phone := format_phone_e164(profile_phone);
  
  -- Update auth.users if phone exists and is different
  IF formatted_phone IS NOT NULL THEN
    UPDATE auth.users
    SET phone = formatted_phone,
        phone_confirmed_at = CASE 
          WHEN phone_confirmed_at IS NULL THEN NOW() 
          ELSE phone_confirmed_at 
        END,
        updated_at = NOW()
    WHERE id = user_id
    AND (phone IS NULL OR phone != formatted_phone OR phone_confirmed_at IS NULL);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to sync all existing users
CREATE OR REPLACE FUNCTION sync_all_phones()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  sync_count integer := 0;
BEGIN
  -- Loop through all users with phones in profiles but not in auth.users
  FOR user_record IN 
    SELECT p.id, p.phone as profile_phone, au.phone as auth_phone, au.phone_confirmed_at
    FROM profiles p
    JOIN auth.users au ON p.id = au.id
    WHERE p.phone IS NOT NULL 
      AND p.phone != ''
      AND (au.phone IS NULL OR au.phone = '' OR au.phone_confirmed_at IS NULL)
  LOOP
    -- Sync this user's phone
    PERFORM sync_phone_to_auth(user_record.id);
    sync_count := sync_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Synced % phone numbers', sync_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically sync phone on profile updates
CREATE OR REPLACE FUNCTION trigger_sync_phone_to_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- If phone was updated
  IF (TG_OP = 'UPDATE' AND OLD.phone IS DISTINCT FROM NEW.phone) OR 
     (TG_OP = 'INSERT' AND NEW.phone IS NOT NULL) THEN
    PERFORM sync_phone_to_auth(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sync_phone_on_profile_change ON profiles;

-- Create the trigger
CREATE TRIGGER sync_phone_on_profile_change
  AFTER INSERT OR UPDATE OF phone ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_sync_phone_to_auth();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION format_phone_e164(text) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_phone_to_auth(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_all_phones() TO authenticated;

-- Run the sync for all existing users
SELECT sync_all_phones();

-- Create a view to help monitor phone sync status
CREATE OR REPLACE VIEW phone_sync_status AS
SELECT 
  p.id as user_id,
  p.email,
  p.phone as profile_phone,
  au.phone as auth_phone,
  au.phone_confirmed_at,
  CASE 
    WHEN p.phone IS NULL OR p.phone = '' THEN 'No phone in profile'
    WHEN au.phone IS NULL OR au.phone = '' THEN 'Phone not synced to auth'
    WHEN au.phone_confirmed_at IS NULL THEN 'Phone not confirmed'
    WHEN format_phone_e164(p.phone) != au.phone THEN 'Phone format mismatch'
    ELSE 'Synced and confirmed'
  END as sync_status
FROM profiles p
JOIN auth.users au ON p.id = au.id
ORDER BY sync_status, p.email;

-- Grant read access to the view
GRANT SELECT ON phone_sync_status TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION sync_phone_to_auth(uuid) IS 'Syncs phone number from profiles to auth.users for a specific user';
COMMENT ON FUNCTION sync_all_phones() IS 'Syncs phone numbers for all users from profiles to auth.users';
COMMENT ON VIEW phone_sync_status IS 'Shows the current phone sync status between profiles and auth.users tables'; 