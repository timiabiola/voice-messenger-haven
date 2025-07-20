-- Verification Queries for Recipient Access Fix
-- Run these in your Supabase SQL editor after applying migrations

-- 1. Check if the required functions exist
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('safe_recipient_insert', 'is_message_recipient')
ORDER BY p.proname;

-- Expected output:
-- function_name         | arguments
-- is_message_recipient  | message_id uuid, user_id uuid
-- safe_recipient_insert | p_message_id uuid, p_recipient_id uuid, p_sender_id uuid

-- 2. Check current RLS policies on voice_messages
SELECT 
    policyname,
    cmd,
    qual::text as policy_condition
FROM pg_policies
WHERE tablename = 'voice_messages'
AND schemaname = 'public'
ORDER BY policyname;

-- You should see a policy that allows both sender access and recipient access

-- 3. Check recent messages and their recipients
SELECT 
    vm.id,
    vm.title,
    vm.created_at,
    p.email as sender_email,
    COUNT(vmr.recipient_id) as recipient_count
FROM voice_messages vm
JOIN profiles p ON vm.sender_id = p.id
LEFT JOIN voice_message_recipients vmr ON vm.id = vmr.voice_message_id
WHERE vm.created_at > NOW() - INTERVAL '7 days'
GROUP BY vm.id, vm.title, vm.created_at, p.email
ORDER BY vm.created_at DESC
LIMIT 10;

-- 4. Test the is_message_recipient function
-- Replace these UUIDs with actual values from your database
SELECT is_message_recipient(
    '00000000-0000-0000-0000-000000000000'::uuid,  -- message_id
    '00000000-0000-0000-0000-000000000001'::uuid   -- user_id
);

-- 5. Check if real-time is enabled on the recipients table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('voice_messages', 'voice_message_recipients')
AND schemaname = 'public';

-- Both tables should have rowsecurity = true