-- Fix function search path security vulnerabilities
-- All SECURITY DEFINER functions must have search_path set to prevent search path attacks

-- 1. Update has_role function (from earlier migration)
CREATE OR REPLACE FUNCTION has_role(role_to_check TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = role_to_check
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Update phone formatting function
-- First drop the existing function to avoid parameter name conflicts
DROP FUNCTION IF EXISTS format_phone_e164(text);
CREATE OR REPLACE FUNCTION format_phone_e164(phone_number text)
RETURNS text AS $$
DECLARE
  cleaned_number text;
BEGIN
  -- Remove all non-digit characters
  cleaned_number := regexp_replace(phone_number, '[^0-9]', '', 'g');
  
  -- Handle US/Canada numbers (add +1 if 10 digits)
  IF length(cleaned_number) = 10 AND substring(cleaned_number, 1, 1) IN ('2','3','4','5','6','7','8','9') THEN
    cleaned_number := '1' || cleaned_number;
  END IF;
  
  -- Add + prefix if not present
  IF substring(cleaned_number, 1, 1) != '+' THEN
    cleaned_number := '+' || cleaned_number;
  END IF;
  
  RETURN cleaned_number;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- 3. Update sync_phone_to_auth function
CREATE OR REPLACE FUNCTION sync_phone_to_auth(profile_id uuid, phone_number text)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  formatted_phone text;
BEGIN
  -- Format phone number
  formatted_phone := format_phone_e164(phone_number);
  
  -- Update auth.users phone
  UPDATE auth.users
  SET phone = formatted_phone,
      phone_confirmed_at = CASE 
        WHEN phone IS NULL OR phone != formatted_phone THEN NOW()
        ELSE phone_confirmed_at
      END
  WHERE id = profile_id;
  
  -- Update sync status in profiles
  UPDATE profiles
  SET last_sync_attempt = NOW(),
      sync_error = NULL
  WHERE id = profile_id;
  
  result := jsonb_build_object(
    'success', true,
    'profile_id', profile_id,
    'phone', formatted_phone,
    'synced_at', NOW()
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error to profiles
    UPDATE profiles
    SET last_sync_attempt = NOW(),
        sync_error = SQLERRM
    WHERE id = profile_id;
    
    result := jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Update sync_all_phones function
CREATE OR REPLACE FUNCTION sync_all_phones()
RETURNS jsonb AS $$
DECLARE
  sync_count integer := 0;
  error_count integer := 0;
  profile_record record;
  sync_result jsonb;
BEGIN
  -- Only admins can run this function
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  -- Loop through all profiles with phones that need syncing
  FOR profile_record IN 
    SELECT p.id, p.phone
    FROM profiles p
    LEFT JOIN auth.users au ON p.id = au.id
    WHERE p.phone IS NOT NULL 
    AND p.phone_verified = true
    AND (au.phone IS NULL OR au.phone != p.phone)
  LOOP
    -- Sync this phone
    sync_result := sync_phone_to_auth(profile_record.id, profile_record.phone);
    
    IF (sync_result->>'success')::boolean THEN
      sync_count := sync_count + 1;
    ELSE
      error_count := error_count + 1;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'synced_count', sync_count,
    'error_count', error_count,
    'completed_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Update trigger functions
CREATE OR REPLACE FUNCTION trigger_sync_phone_to_auth()
RETURNS trigger AS $$
BEGIN
  -- Only sync if phone is verified and changed
  IF NEW.phone_verified = true AND (OLD.phone IS DISTINCT FROM NEW.phone) THEN
    PERFORM sync_phone_to_auth(NEW.id, NEW.phone);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Update profile update handler
CREATE OR REPLACE FUNCTION handle_profile_phone_update()
RETURNS trigger AS $$
BEGIN
  -- If phone number changed and is verified, sync to auth
  IF NEW.phone IS DISTINCT FROM OLD.phone AND NEW.phone_verified = true THEN
    UPDATE auth.users
    SET phone = NEW.phone,
        phone_confirmed_at = NOW()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. Update auth phone update handler
CREATE OR REPLACE FUNCTION handle_auth_phone_update()
RETURNS trigger AS $$
BEGIN
  -- Update profile when auth phone changes
  IF NEW.phone IS DISTINCT FROM OLD.phone THEN
    UPDATE profiles
    SET phone = NEW.phone,
        phone_verified = true
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8. Update confirm user phone function
CREATE OR REPLACE FUNCTION confirm_user_phone(user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE auth.users
  SET phone_confirmed_at = NOW()
  WHERE id = user_id AND phone IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. Update admin fix functions
CREATE OR REPLACE FUNCTION admin_fix_unconfirmed_phones()
RETURNS TABLE (
  user_id uuid,
  phone text,
  action_taken text
) AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Check admin role
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  FOR user_record IN
    SELECT au.id, au.phone, au.email, p.phone as profile_phone
    FROM auth.users au
    LEFT JOIN profiles p ON p.id = au.id
    WHERE au.phone IS NOT NULL 
    AND au.phone_confirmed_at IS NULL
  LOOP
    IF user_record.profile_phone IS NULL THEN
      UPDATE profiles 
      SET phone = user_record.phone,
          phone_verified = true
      WHERE id = user_record.user_id;
      
      RETURN QUERY SELECT 
        user_record.id,
        user_record.phone,
        'Updated profile with auth phone'::text;
    END IF;
    
    UPDATE auth.users
    SET phone_confirmed_at = NOW()
    WHERE id = user_record.id;
    
    RETURN QUERY SELECT 
      user_record.id,
      user_record.phone,
      'Confirmed phone in auth.users'::text;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 10. Update simple admin fix function
CREATE OR REPLACE FUNCTION admin_fix_unconfirmed_phones_simple()
RETURNS integer AS $$
DECLARE
  updated_count integer;
BEGIN
  -- Check admin role
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  UPDATE auth.users
  SET phone_confirmed_at = NOW()
  WHERE phone IS NOT NULL 
  AND phone_confirmed_at IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 11. Update trigger_voice_message_notification function (from earlier migration)
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

-- 12. Fix get_sender_profile function
CREATE OR REPLACE FUNCTION get_sender_profile(message_id uuid)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  email text,
  avatar_url text
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.first_name, p.last_name, p.email, p.avatar_url
  FROM profiles p
  JOIN voice_messages vm ON vm.sender_id = p.id
  WHERE vm.id = message_id
  AND (
    -- User is the sender
    vm.sender_id = auth.uid()
    OR
    -- User is a recipient
    EXISTS (
      SELECT 1 FROM voice_message_recipients vmr
      WHERE vmr.voice_message_id = vm.id
      AND vmr.recipient_id = auth.uid()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 13. Fix update_sender_info function  
CREATE OR REPLACE FUNCTION update_sender_info(
  p_user_id uuid,
  p_first_name text,
  p_last_name text
)
RETURNS void AS $$
BEGIN
  -- Only allow users to update their own info
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Can only update your own information';
  END IF;
  
  UPDATE profiles
  SET 
    first_name = p_first_name,
    last_name = p_last_name,
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 14. Create or update notify_new_voice_message function (was missing)
CREATE OR REPLACE FUNCTION notify_new_voice_message()
RETURNS trigger AS $$
BEGIN
  -- This function is deprecated - notifications are now handled by edge functions
  -- Keeping it as a no-op to prevent errors if still referenced
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION format_phone_e164(text) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_phone_to_auth(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION sync_all_phones() TO authenticated;
GRANT EXECUTE ON FUNCTION get_sender_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION update_sender_info(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_user_phone(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION admin_fix_unconfirmed_phones() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_fix_unconfirmed_phones_simple() TO authenticated;

-- Add comments
COMMENT ON FUNCTION format_phone_e164(text) IS 'Format phone number to E.164 standard';
COMMENT ON FUNCTION sync_phone_to_auth(uuid, text) IS 'Sync phone from profile to auth.users';
COMMENT ON FUNCTION sync_all_phones() IS 'Admin function to sync all phones';
COMMENT ON FUNCTION get_sender_profile(uuid) IS 'Get sender profile for a voice message';
COMMENT ON FUNCTION update_sender_info(uuid, text, text) IS 'Update user profile information';
COMMENT ON FUNCTION notify_new_voice_message() IS 'Deprecated - notifications handled by edge functions';