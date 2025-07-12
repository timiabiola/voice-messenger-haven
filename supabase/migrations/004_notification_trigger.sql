-- Create a function to trigger the edge function
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_voice_message_insert ON voice_messages;
CREATE TRIGGER on_voice_message_insert
  AFTER INSERT ON voice_messages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_voice_message_notification();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION trigger_voice_message_notification() TO service_role;

-- Add comment
COMMENT ON FUNCTION trigger_voice_message_notification() IS 'Sends notification when a new voice message is created'; 