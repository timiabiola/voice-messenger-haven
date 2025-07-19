-- Debug Queries for Supabase Dashboard
-- Run these in the SQL Editor to check the current state

-- 1. Check if safe_recipient_insert function exists and its parameters
SELECT 
    p.proname as function_name,
    p.proargnames as parameter_names,
    pg_get_function_arguments(p.oid) as full_signature
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'safe_recipient_insert';

-- 2. Check all RLS policies on voice_messages
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'voice_messages' 
AND schemaname = 'public'
ORDER BY policyname;

-- 3. Check voice_messages table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'voice_messages'
ORDER BY ordinal_position;

-- 4. Check for any triggers on voice_messages
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'public'
AND event_object_table = 'voice_messages';

-- 5. Test insert directly (replace 'YOUR_USER_ID' with your actual auth.uid())
-- First get your user ID:
SELECT auth.uid();

-- Then test insert:
/*
INSERT INTO voice_messages (
    title, 
    subject, 
    sender_id, 
    duration, 
    is_urgent, 
    is_private
) VALUES (
    'Direct SQL Test', 
    'Testing from SQL Editor', 
    auth.uid(), 
    10, 
    false, 
    false
) RETURNING *;
*/

-- 6. Check if the voice-recordings storage bucket exists
SELECT 
    id,
    name,
    public,
    created_at
FROM storage.buckets
WHERE name = 'voice-recordings';

-- 7. Check storage policies for voice-recordings bucket
SELECT 
    name,
    definition,
    action
FROM storage.policies
WHERE bucket_id = 'voice-recordings';

-- 8. Check for any custom functions that might be causing recursion
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname LIKE '%voice%'
OR p.proname LIKE '%message%'
ORDER BY p.proname;

-- 9. Check if there are any RLS policies that reference voice_messages in their definitions
SELECT 
    schemaname,
    tablename,
    policyname,
    qual
FROM pg_policies
WHERE schemaname = 'public'
AND qual::text LIKE '%voice_messages%'
AND tablename != 'voice_messages';

-- 10. Temporarily disable RLS to test (BE CAREFUL - ONLY FOR TESTING)
-- ALTER TABLE voice_messages DISABLE ROW LEVEL SECURITY;
-- Run your insert test
-- ALTER TABLE voice_messages ENABLE ROW LEVEL SECURITY;