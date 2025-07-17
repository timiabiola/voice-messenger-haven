-- Fix remaining SECURITY DEFINER functions without search_path
-- This migration updates functions from older migrations that were missing SET search_path

-- 1. Fix trigger_voice_message_notification from 004_notification_trigger.sql
-- Note: This function is already fixed in 20250116_fix_function_search_paths.sql but with different signature
-- The version in 004_notification_trigger.sql has no parameters
DROP FUNCTION IF EXISTS trigger_voice_message_notification() CASCADE;
CREATE OR REPLACE FUNCTION trigger_voice_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  request_id text;
  payload jsonb;
BEGIN
  -- Build the payload
  payload := jsonb_build_object(
    'type', 'INSERT',
    'record', row_to_json(NEW),
    'old_record', null
  );

  -- Call the edge function using net.http_post
  -- Note: This requires the pg_net extension to be enabled
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/voice-message-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key')
    ),
    body := payload::text
  ) INTO request_id;

  -- Log the request (optional)
  RAISE NOTICE 'Notification request sent with ID: %', request_id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Failed to send notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Fix functions from 20250113_phone_sync_fix.sql
-- These functions are missing SET search_path
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Fix functions from 20250113_phone_auth_profiles_sync.sql and 20250113_phone_auth_profiles_sync_fixed.sql
-- Note: These are duplicate functions, we'll use the versions from the main migration
-- The functions handle_profile_phone_update, handle_auth_phone_update, confirm_user_phone, 
-- admin_fix_unconfirmed_phones, and admin_fix_unconfirmed_phones_simple are already fixed 
-- in 20250116_fix_function_search_paths.sql

-- 4. Verify all functions now have search_path set
DO $$
DECLARE
  func_record RECORD;
  missing_count INTEGER := 0;
BEGIN
  -- Check for any remaining functions without search_path
  FOR func_record IN
    SELECT 
      n.nspname as schema_name,
      p.proname as function_name,
      pg_get_function_identity_arguments(p.oid) as arguments
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.prosecdef = true  -- SECURITY DEFINER
    AND NOT p.proconfig @> ARRAY['search_path=public']
  LOOP
    missing_count := missing_count + 1;
    RAISE WARNING 'Function % still missing search_path', 
      func_record.schema_name || '.' || func_record.function_name || '(' || func_record.arguments || ')';
  END LOOP;
  
  IF missing_count > 0 THEN
    RAISE NOTICE 'Found % functions still missing search_path. These may be system functions or need manual review.', missing_count;
  ELSE
    RAISE NOTICE 'All SECURITY DEFINER functions now have search_path set correctly.';
  END IF;
END;
$$;

-- Re-create any triggers that might have been dropped
-- Recreate trigger for voice message notifications (if it was dropped)
DROP TRIGGER IF EXISTS on_voice_message_insert ON voice_messages;
CREATE TRIGGER on_voice_message_insert
  AFTER INSERT ON voice_messages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_voice_message_notification();

-- Ensure phone sync trigger exists
DROP TRIGGER IF EXISTS sync_phone_on_profile_change ON profiles;
CREATE TRIGGER sync_phone_on_profile_change
  AFTER INSERT OR UPDATE OF phone ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_sync_phone_to_auth();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION trigger_voice_message_notification() TO service_role;
GRANT EXECUTE ON FUNCTION sync_phone_to_auth(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION sync_all_phones() TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_sync_phone_to_auth() TO service_role;

-- Add comments
COMMENT ON FUNCTION trigger_voice_message_notification() IS 'Sends notification when a new voice message is created (with proper search_path)';
COMMENT ON FUNCTION sync_phone_to_auth(uuid) IS 'Syncs phone number from profiles to auth.users for a specific user (with proper search_path)';
COMMENT ON FUNCTION sync_all_phones() IS 'Syncs phone numbers for all users from profiles to auth.users (with proper search_path)';
COMMENT ON FUNCTION trigger_sync_phone_to_auth() IS 'Trigger function to sync phone on profile changes (with proper search_path)';