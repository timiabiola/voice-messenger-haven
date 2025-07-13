-- Additional migration to ensure phone sync between auth.users and profiles
-- This handles the case where profiles are updated through the app

-- Create or replace function to handle profile creation/updates
CREATE OR REPLACE FUNCTION handle_profile_phone_update()
RETURNS TRIGGER AS $$
DECLARE
  formatted_phone text;
BEGIN
  -- Only process if phone field is being updated
  IF (TG_OP = 'INSERT' AND NEW.phone IS NOT NULL) OR 
     (TG_OP = 'UPDATE' AND OLD.phone IS DISTINCT FROM NEW.phone) THEN
    
    -- Format the phone number
    formatted_phone := format_phone_e164(NEW.phone);
    
    -- Update the formatted phone back to profiles table
    IF formatted_phone IS NOT NULL AND formatted_phone != NEW.phone THEN
      NEW.phone = formatted_phone;
    END IF;
    
    -- Sync to auth.users
    IF formatted_phone IS NOT NULL THEN
      UPDATE auth.users
      SET 
        phone = formatted_phone,
        phone_confirmed_at = COALESCE(phone_confirmed_at, NOW()),
        updated_at = NOW()
      WHERE id = NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS handle_profile_phone_update_trigger ON profiles;

-- Create trigger that runs BEFORE insert/update to ensure consistency
CREATE TRIGGER handle_profile_phone_update_trigger
  BEFORE INSERT OR UPDATE OF phone ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_profile_phone_update();

-- Create a function to handle auth.users updates (reverse sync)
CREATE OR REPLACE FUNCTION handle_auth_phone_update()
RETURNS TRIGGER AS $$
BEGIN
  -- When auth.users phone is updated, sync to profiles
  IF (TG_OP = 'UPDATE' AND OLD.phone IS DISTINCT FROM NEW.phone) THEN
    UPDATE profiles
    SET phone = NEW.phone
    WHERE id = NEW.id
    AND (phone IS NULL OR phone != NEW.phone);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: We cannot create triggers on auth.users directly, but we ensure
-- that all phone updates go through our functions

-- Create a helper function to verify phone and mark as confirmed
CREATE OR REPLACE FUNCTION confirm_user_phone(user_id uuid)
RETURNS void AS $$
DECLARE
  user_phone text;
BEGIN
  -- Get the phone from profiles
  SELECT phone INTO user_phone
  FROM profiles
  WHERE id = user_id;
  
  IF user_phone IS NOT NULL THEN
    -- Update auth.users to mark phone as confirmed
    UPDATE auth.users
    SET 
      phone = format_phone_e164(user_phone),
      phone_confirmed_at = NOW()
    WHERE id = user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION confirm_user_phone(uuid) TO authenticated;

-- Create an admin function to fix all unconfirmed phones (FIXED VERSION)
CREATE OR REPLACE FUNCTION admin_fix_unconfirmed_phones()
RETURNS TABLE(user_id uuid, email varchar(255), phone text, status text) AS $$
BEGIN
  RETURN QUERY
  WITH fixed_users AS (
    SELECT 
      au.id,
      au.email::varchar(255),
      p.phone,
      CASE 
        WHEN au.phone_confirmed_at IS NULL AND p.phone IS NOT NULL THEN 'fixed'
        ELSE 'skipped'
      END::text as fix_status
    FROM auth.users au
    JOIN profiles p ON au.id = p.id
    WHERE p.phone IS NOT NULL AND p.phone != ''
  )
  UPDATE auth.users au
  SET 
    phone = format_phone_e164(fu.phone),
    phone_confirmed_at = NOW()
  FROM fixed_users fu
  WHERE au.id = fu.id 
    AND au.phone_confirmed_at IS NULL
  RETURNING fu.id, fu.email::varchar(255), fu.phone, fu.fix_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alternative simpler version that avoids the type issue
CREATE OR REPLACE FUNCTION admin_fix_unconfirmed_phones_simple()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  fixed_count integer := 0;
BEGIN
  -- Loop through users needing fixes
  FOR user_record IN 
    SELECT 
      au.id,
      au.email,
      p.phone
    FROM auth.users au
    JOIN profiles p ON au.id = p.id
    WHERE p.phone IS NOT NULL 
      AND p.phone != ''
      AND au.phone_confirmed_at IS NULL
  LOOP
    -- Update this user
    UPDATE auth.users
    SET 
      phone = format_phone_e164(user_record.phone),
      phone_confirmed_at = NOW()
    WHERE id = user_record.id;
    
    fixed_count := fixed_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Fixed % unconfirmed phone numbers', fixed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the simple version to avoid type issues
SELECT admin_fix_unconfirmed_phones_simple();

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone) WHERE phone IS NOT NULL;

-- Add helpful comments
COMMENT ON FUNCTION handle_profile_phone_update() IS 'Ensures phone numbers are formatted correctly and synced to auth.users when profiles are updated';
COMMENT ON FUNCTION confirm_user_phone(uuid) IS 'Manually confirm a user''s phone number in auth.users';
COMMENT ON FUNCTION admin_fix_unconfirmed_phones() IS 'Admin function to fix all unconfirmed phone numbers in bulk (returns results)';
COMMENT ON FUNCTION admin_fix_unconfirmed_phones_simple() IS 'Admin function to fix all unconfirmed phone numbers in bulk (simple version)'; 