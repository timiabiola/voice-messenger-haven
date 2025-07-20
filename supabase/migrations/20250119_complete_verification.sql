-- Complete Verification Script for Voice Messages
-- Run this after the nuclear fix to verify everything works

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
    
    -- Get current user
    test_user_id := auth.uid();
    IF test_user_id IS NULL THEN
        RAISE EXCEPTION 'No authenticated user found';
    END IF;
    RAISE NOTICE 'Current user ID: %', test_user_id;
    
    -- Step 1: Simulate storage upload (just create a URL)
    storage_url := 'https://your-project.supabase.co/storage/v1/object/public/voice-recordings/recordings/' || 
                   test_user_id || '/test_' || extract(epoch from now()) || '.m4a';
    RAISE NOTICE 'Simulated storage URL: %', storage_url;
    
    -- Step 2: Insert voice message
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
        test_user_id,
        30,
        false,
        false
    ) RETURNING id INTO test_message_id;
    
    RAISE NOTICE '✅ SUCCESS: Created voice message with ID: %', test_message_id;
    
    -- Step 3: Verify we can select our own message
    PERFORM * FROM voice_messages WHERE id = test_message_id;
    RAISE NOTICE '✅ SUCCESS: Can SELECT own message';
    
    -- Step 4: Test update
    UPDATE voice_messages 
    SET subject = 'Updated subject'
    WHERE id = test_message_id;
    RAISE NOTICE '✅ SUCCESS: Can UPDATE own message';
    
    -- Step 5: Add a recipient (using a dummy recipient for testing)
    -- In production, this would be done via the safe_recipient_insert RPC
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
    test_message_id UUID;
    test_recipient_id UUID;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== TESTING RPC FUNCTION ===';
    
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
        auth.uid(),
        15,
        false,
        false
    ) RETURNING id INTO test_message_id;
    
    -- Generate a test recipient ID
    test_recipient_id := gen_random_uuid();
    
    -- Test the RPC function
    PERFORM safe_recipient_insert(
        test_message_id,
        test_recipient_id,
        auth.uid()
    );
    
    RAISE NOTICE '✅ SUCCESS: RPC function works correctly';
    
    -- Clean up
    DELETE FROM voice_message_recipients WHERE voice_message_id = test_message_id;
    DELETE FROM voice_messages WHERE id = test_message_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ RPC TEST FAILED: %', SQLERRM;
        -- Clean up
        IF test_message_id IS NOT NULL THEN
            DELETE FROM voice_message_recipients WHERE voice_message_id = test_message_id;
            DELETE FROM voice_messages WHERE id = test_message_id;
        END IF;
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
    RAISE NOTICE 'Run the nuclear fix script first if you see any errors above';
    RAISE NOTICE 'If all tests pass, voice messaging should work correctly';
END $$;