-- Remove the trigger that uses pg_net.http_post
DROP TRIGGER IF EXISTS on_voice_message_insert ON voice_messages;
DROP FUNCTION IF EXISTS trigger_voice_message_notification();

-- Add comment explaining the removal
COMMENT ON TABLE voice_messages IS 'Voice messages table. Notifications are now handled via client-side edge function calls instead of database triggers.';