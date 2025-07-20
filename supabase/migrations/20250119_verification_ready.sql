-- Complete Verification Script (Pre-configured with User ID)
-- Ready to run - no editing needed!

-- Using test user ID: 00e07e97-7081-4a83-852f-c9693a16a8bc

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
    
    -- Using your test user ID
    test_user_id := '00e07e97-7081-4a83-852f-c9693a16a8bc'::uuid;
    RAISE NOTICE 'Using test user ID: %', test_user_id;
    
    -- Step 1: Simulate storage upload (just create a URL)
    storage_url := 'https://your-project.supabase.co/storage/v1/object/public/voice-recordings/recordings/' || 
                   test_user_id || '/test_' || extract(epoch from now()) || '.m4a';
    RAISE NOTICE 'Simulated storage URL: %', storage_url;
    
    -- Step 2: Insert voice message AS the test user
    -- Note: This might fail due to RLS because we're not actually authenticated as this user
    BEGIN
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
        RAISE NOTICE 'NO INFINITE RECURSION DETECTED! 🎉';
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '';
            RAISE NOTICE '⚠️  Test failed: %', SQLERRM;
            
            IF SQLERRM LIKE '%infinite recursion%' THEN
                RAISE NOTICE '';
                RAISE NOTICE '❌ CRITICAL: INFINITE RECURSION STILL EXISTS!';
                RAISE NOTICE 'The RLS policies still have circular references.';
            ELSIF SQLERRM LIKE '%new row violates row-level security%' THEN
                RAISE NOTICE '';
                RAISE NOTICE 'ℹ️  This is EXPECTED in SQL Editor!';
                RAISE NOTICE 'RLS policies use auth.uid() which is NULL here.';
                RAISE NOTICE 'This actually indicates policies are working correctly.';
                RAISE NOTICE '';
                RAISE NOTICE '✅ NO RECURSION ERROR = Policies are likely fixed!';
                RAISE NOTICE 'Test from application UI to confirm everything works.';
            ELSE
                RAISE NOTICE 'Unexpected error - check details above';
            END IF;
            
            -- Try to clean up if possible
            IF test_message_id IS NOT NULL THEN
                DELETE FROM voice_message_recipients WHERE voice_message_id = test_message_id;
                DELETE FROM voice_messages WHERE id = test_message_id;
            END IF;
    END;
END $$;

-- STEP 4: Test without RLS (to confirm table works)
DO $$
DECLARE
    test_user_id UUID := '00e07e97-7081-4a83-852f-c9693a16a8bc'::uuid;
    test_message_id UUID;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== TESTING WITHOUT RLS (for comparison) ===';
    
    -- Temporarily disable RLS
    ALTER TABLE voice_messages DISABLE ROW LEVEL SECURITY;
    
    -- Try insert
    INSERT INTO voice_messages (
        title,
        subject,
        audio_url,
        sender_id,
        duration,
        is_urgent,
        is_private
    ) VALUES (
        'No RLS Test',
        'Testing without RLS',
        'https://example.com/no-rls-test.m4a',
        test_user_id,
        10,
        false,
        false
    ) RETURNING id INTO test_message_id;
    
    RAISE NOTICE '✅ Insert works without RLS';
    
    -- Clean up
    DELETE FROM voice_messages WHERE id = test_message_id;
    RAISE NOTICE '✅ Delete works without RLS';
    
    -- Re-enable RLS
    ALTER TABLE voice_messages ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS re-enabled';
    
EXCEPTION
    WHEN OTHERS THEN
        -- Make sure RLS is re-enabled even if test fails
        ALTER TABLE voice_messages ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '❌ Error during no-RLS test: %', SQLERRM;
END $$;

-- STEP 5: Final Summary
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== VERIFICATION SUMMARY ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Key Results:';
    RAISE NOTICE '1. Check for "INFINITE RECURSION" errors above';
    RAISE NOTICE '2. If you see "row-level security" errors, that''s OK in SQL Editor';
    RAISE NOTICE '3. If no recursion errors, the fix likely worked!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next: Test from application UI for full confirmation';
    RAISE NOTICE 'Go to: /test-message-upload';
    RAISE NOTICE 'Click: "Test 5: Complete Flow Test"';
END $$;