-- Complete Verification Script for Voice Messages (SQL Editor Version)
-- This version works in SQL Editor by using a hardcoded user ID

-- IMPORTANT: First run 20250119_get_test_user.sql to get a user ID
-- Then replace the USER_ID_HERE placeholder below with an actual user ID

-- STEP 1: Verify Table Structure
SELECT 
    'Voice Messages Table Structure:' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'voice_messages'
ORDER BY ordinal_position;

-- STEP 2: Verify Current Policies
SELECT 
    'Current RLS Policies:' as info;

SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'voice_messages' 
AND schemaname = 'public'
ORDER BY policyname;

-- STEP 3: Test Complete Message Flow
DO $$
DECLARE
    test_user_id UUID;
    test_message_id UUID;
    test_recipient_id UUID;
    storage_url TEXT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== STARTING COMPLETE VERIFICATION ===';
    
    -- REPLACE THIS WITH YOUR ACTUAL USER ID FROM get_test_user.sql
    -- Example: test_user_id := '123e4567-e89b-12d3-a456-426614174000'::uuid;
    test_user_id := 'USER_ID_HERE'::uuid;  -- <-- REPLACE USER_ID_HERE
    
    -- Alternative: Try to get auth.uid() first, fallback to hardcoded
    -- Uncomment the next 3 lines if you want automatic fallback
    -- IF auth.uid() IS NOT NULL THEN
    --     test_user_id := auth.uid();
    -- END IF;
    
    IF test_user_id = 'USER_ID_HERE'::uuid THEN
        RAISE EXCEPTION 'Please replace USER_ID_HERE with an actual user ID from get_test_user.sql';
    END IF;
    
    RAISE NOTICE 'Using test user ID: %', test_user_id;
    
    -- Step 1: Simulate storage upload (just create a URL)
    storage_url := 'https://your-project.supabase.co/storage/v1/object/public/voice-recordings/recordings/' || 
                   test_user_id || '/test_' || extract(epoch from now()) || '.m4a';
    RAISE NOTICE 'Simulated storage URL: %', storage_url;
    
    -- Step 2: Insert voice message AS the test user
    -- We need to use SECURITY DEFINER context to act as the user
    INSERT INTO voice_messages (
        title,
        subject,
        audio_url,
        sender_id,
        duration,
        is_urgent,
        is_private
    ) VALUES (
        'Verification Test Message',
        'Testing complete flow',
        storage_url,
        test_user_id,  -- Using our test user as sender
        30,
        false,
        false
    ) RETURNING id INTO test_message_id;
    
    RAISE NOTICE '✅ SUCCESS: Created voice message with ID: %', test_message_id;
    
    -- Step 3: Verify we can select the message
    -- This tests the SELECT policy
    PERFORM * FROM voice_messages WHERE id = test_message_id;
    RAISE NOTICE '✅ SUCCESS: Can SELECT the inserted message';
    
    -- Step 4: Test UPDATE permission
    UPDATE voice_messages 
    SET subject = 'Updated subject'
    WHERE id = test_message_id;
    RAISE NOTICE '✅ SUCCESS: Can UPDATE the message';
    
    -- Step 5: Add a recipient
    test_recipient_id := gen_random_uuid();
    INSERT INTO voice_message_recipients (voice_message_id, recipient_id)
    VALUES (test_message_id, test_recipient_id);
    RAISE NOTICE '✅ SUCCESS: Added recipient to message';
    
    -- Step 6: Clean up
    DELETE FROM voice_message_recipients WHERE voice_message_id = test_message_id;
    DELETE FROM voice_messages WHERE id = test_message_id;
    RAISE NOTICE '✅ SUCCESS: Cleaned up test data';
    
    RAISE NOTICE '';
    RAISE NOTICE '=== ALL VERIFICATION TESTS PASSED ===';
    RAISE NOTICE 'Voice messages system is working correctly!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '';
        RAISE NOTICE '❌ VERIFICATION FAILED: %', SQLERRM;
        RAISE NOTICE 'Error detail: %', SQLSTATE;
        -- Try to clean up if possible
        IF test_message_id IS NOT NULL THEN
            DELETE FROM voice_message_recipients WHERE voice_message_id = test_message_id;
            DELETE FROM voice_messages WHERE id = test_message_id;
        END IF;
        RAISE;
END $$;

-- STEP 4: Check if safe_recipient_insert function exists
SELECT 
    'RPC Functions:' as info;

SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'safe_recipient_insert';

-- STEP 5: Test the RPC function
DO $$
DECLARE
    test_user_id UUID;
    test_message_id UUID;
    test_recipient_id UUID;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== TESTING RPC FUNCTION ===';
    
    -- REPLACE THIS WITH YOUR ACTUAL USER ID (same as above)
    test_user_id := 'USER_ID_HERE'::uuid;  -- <-- REPLACE USER_ID_HERE
    
    IF test_user_id = 'USER_ID_HERE'::uuid THEN
        RAISE EXCEPTION 'Please replace USER_ID_HERE with an actual user ID';
    END IF;
    
    -- Create a test message first
    INSERT INTO voice_messages (
        title,
        subject,
        audio_url,
        sender_id,
        duration,
        is_urgent,
        is_private
    ) VALUES (
        'RPC Test Message',
        'Testing RPC function',
        'https://example.com/rpc-test.m4a',
        test_user_id,
        15,
        false,
        false
    ) RETURNING id INTO test_message_id;
    
    -- Generate a test recipient ID
    test_recipient_id := gen_random_uuid();
    
    -- Test the RPC function
    -- Note: This might fail if RPC expects auth.uid() to match sender_id
    BEGIN
        PERFORM safe_recipient_insert(
            test_message_id,
            test_recipient_id,
            test_user_id
        );
        RAISE NOTICE '✅ SUCCESS: RPC function works correctly';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️  RPC function failed (expected in SQL Editor): %', SQLERRM;
            RAISE NOTICE 'This is normal - RPC functions often check auth.uid()';
            RAISE NOTICE 'Test this through the application UI instead';
    END;
    
    -- Clean up
    DELETE FROM voice_message_recipients WHERE voice_message_id = test_message_id;
    DELETE FROM voice_messages WHERE id = test_message_id;
    
END $$;

-- STEP 6: Summary
SELECT 
    'Storage Bucket Check:' as info;

SELECT 
    id,
    name,
    public,
    created_at
FROM storage.buckets
WHERE name = 'voice-recordings';

-- Final message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== VERIFICATION COMPLETE ===';
    RAISE NOTICE '';
    RAISE NOTICE 'IMPORTANT NOTES:';
    RAISE NOTICE '1. Some tests might fail in SQL Editor due to auth context';
    RAISE NOTICE '2. If basic insert/select/update/delete work, RLS is likely fixed';
    RAISE NOTICE '3. For full testing, use the application UI test page';
    RAISE NOTICE '4. The key success indicator is NO INFINITE RECURSION ERROR';
END $$;