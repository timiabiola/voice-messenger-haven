-- TARGETED FIX FOR VOICE MESSAGE NOTIFICATION ERROR
-- This script specifically removes only the notification trigger that uses pg_net

-- 1. First, let's see what triggers exist on voice_messages
SELECT tgname as trigger_name, 
       tgtype,
       CASE 
         WHEN tgname LIKE 'RI_ConstraintTrigger%' THEN 'System Constraint Trigger (DO NOT REMOVE)'
         ELSE 'User-defined Trigger'
       END as trigger_type
FROM pg_trigger 
WHERE tgrelid = 'voice_messages'::regclass
ORDER BY trigger_type, trigger_name;

-- 2. Drop ONLY the specific notification trigger (not constraint triggers)
DROP TRIGGER IF EXISTS on_voice_message_insert ON voice_messages;

-- 3. Drop the function that uses net.http_post
DROP FUNCTION IF EXISTS trigger_voice_message_notification() CASCADE;

-- 4. Verify the problematic trigger is gone
SELECT 'Checking if notification trigger still exists:' as status;
SELECT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_voice_message_insert'
    AND tgrelid = 'voice_messages'::regclass
) as notification_trigger_exists;

-- 5. Ensure proper permissions (without touching constraints)
GRANT SELECT, INSERT, UPDATE, DELETE ON voice_messages TO authenticated;
GRANT ALL ON voice_messages TO service_role;

-- 6. Add comment explaining the change
COMMENT ON TABLE voice_messages IS 'Voice messages table. Notifications are now handled via client-side edge function calls instead of database triggers.';

-- 7. Success message
SELECT 'Voice message notification fix applied successfully!' as status,
       'The net.http_post error should now be resolved.' as message; 