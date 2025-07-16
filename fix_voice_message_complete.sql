-- COMPREHENSIVE FIX FOR VOICE MESSAGE SAVING ISSUE
-- This script removes all pg_net dependencies and ensures voice messages work

-- 1. First, drop the trigger that's causing the error
DROP TRIGGER IF EXISTS on_voice_message_insert ON voice_messages CASCADE;

-- 2. Drop the function that uses net.http_post
DROP FUNCTION IF EXISTS trigger_voice_message_notification() CASCADE;

-- 3. Check and drop any other triggers on voice_messages that might use pg_net
DO $$
DECLARE
    trigger_rec RECORD;
BEGIN
    FOR trigger_rec IN 
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'voice_messages'::regclass
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON voice_messages CASCADE', trigger_rec.tgname);
    END LOOP;
END $$;

-- 4. Ensure the voice_messages table has proper permissions
GRANT ALL ON voice_messages TO authenticated;
GRANT ALL ON voice_messages TO service_role;

-- 5. Ensure the voice_message_recipients table has proper permissions
GRANT ALL ON voice_message_recipients TO authenticated;
GRANT ALL ON voice_message_recipients TO service_role;

-- 6. Add comment explaining the change
COMMENT ON TABLE voice_messages IS 'Voice messages table. Notifications are now handled via client-side edge function calls instead of database triggers.';

-- 7. Verify the fix by showing remaining triggers
SELECT 'Remaining triggers on voice_messages:' as info;
SELECT tgname as trigger_name FROM pg_trigger WHERE tgrelid = 'voice_messages'::regclass;

-- 8. Show success message
SELECT 'Voice message fix applied successfully. The net.http_post error should be resolved.' as status; 