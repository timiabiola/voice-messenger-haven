-- Check if the trigger exists
SELECT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_voice_message_insert'
) as trigger_exists;

-- Check if the function exists
SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'trigger_voice_message_notification'
) as function_exists;

-- Check if pg_net extension is installed
SELECT EXISTS (
    SELECT 1 FROM pg_extension 
    WHERE extname = 'pg_net'
) as pg_net_installed;

-- List all triggers on voice_messages table
SELECT tgname as trigger_name, 
       pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger 
WHERE tgrelid = 'voice_messages'::regclass;

-- Show the function definition if it exists
SELECT pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname = 'trigger_voice_message_notification'; 