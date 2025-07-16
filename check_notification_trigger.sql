-- CHECK FOR NOTIFICATION TRIGGER AND FUNCTION

-- 1. Check if the specific notification trigger exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_trigger 
            WHERE tgname = 'on_voice_message_insert'
            AND tgrelid = 'voice_messages'::regclass
        ) 
        THEN 'YES - Notification trigger EXISTS (this is causing the error)'
        ELSE 'NO - Notification trigger does NOT exist'
    END as notification_trigger_status;

-- 2. Check if the notification function exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'trigger_voice_message_notification'
        ) 
        THEN 'YES - Notification function EXISTS (uses net.http_post)'
        ELSE 'NO - Notification function does NOT exist'
    END as notification_function_status;

-- 3. List ALL triggers on voice_messages (to see what's there)
SELECT 
    tgname as trigger_name,
    CASE 
        WHEN tgname LIKE 'RI_ConstraintTrigger%' THEN 'Foreign Key Constraint'
        WHEN tgname = 'on_voice_message_insert' THEN '*** NOTIFICATION TRIGGER (REMOVE THIS) ***'
        ELSE 'Other Trigger'
    END as trigger_purpose
FROM pg_trigger 
WHERE tgrelid = 'voice_messages'::regclass
ORDER BY trigger_purpose, trigger_name;

-- 4. Check if there's a database trigger trying to call net.http_post
SELECT 
    p.proname as function_name,
    CASE 
        WHEN pg_get_functiondef(p.oid) LIKE '%net.http_post%' 
        THEN '*** USES net.http_post - THIS IS THE PROBLEM ***'
        ELSE 'Does not use net.http_post'
    END as uses_pg_net
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname LIKE '%notification%'; 