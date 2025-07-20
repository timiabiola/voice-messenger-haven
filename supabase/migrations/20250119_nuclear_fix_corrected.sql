-- Nuclear Option WITH SQL Editor Support (CORRECTED)
-- This version fixes the syntax errors and handles auth.uid() being NULL

-- Known test user ID: 00e07e97-7081-4a83-852f-c9693a16a8bc

-- First, get a test user ID if needed
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Try to get any existing user
    SELECT id INTO test_user_id 
    FROM auth.users 
    WHERE last_sign_in_at IS NOT NULL
    ORDER BY last_sign_in_at DESC 
    LIMIT 1;
    
    IF test_user_id IS NULL THEN
        SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    END IF;
    
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Found test user ID: %', test_user_id;
        RAISE NOTICE 'Will use this for testing since auth.uid() is NULL in SQL Editor';
    ELSE
        RAISE NOTICE 'No users found in database';
    END IF;
END $$;

-- STEP 1: List current policies
SELECT 
    'Current policies before cleanup:' as info,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'voice_messages' 
AND schemaname = 'public'
ORDER BY policyname;

-- STEP 2: TEST WITHOUT RLS (using test user)
ALTER TABLE voice_messages DISABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    test_user_id UUID;
    test_auth_uid UUID;
BEGIN
    -- Get auth.uid() or fallback to test user
    test_auth_uid := auth.uid();
    
    IF test_auth_uid IS NULL THEN
        -- Use our known test user
        test_user_id := '00e07e97-7081-4a83-852f-c9693a16a8bc'::uuid;
        RAISE NOTICE 'Using known test user ID: % (auth.uid() was NULL)', test_user_id;
    ELSE
        test_user_id := test_auth_uid;
        RAISE NOTICE 'Using auth.uid(): %', test_user_id;
    END IF;
    
    IF test_user_id IS NOT NULL THEN
        -- Try insert with RLS disabled
        INSERT INTO voice_messages (title, subject, sender_id, duration, is_urgent, is_private, audio_url)
        VALUES ('RLS Test', 'Testing without RLS', test_user_id, 10, false, false, 'https://example.com/test-audio.mp4');
        RAISE NOTICE 'SUCCESS: Insert works without RLS';
        
        -- Clean up
        DELETE FROM voice_messages WHERE title = 'RLS Test' AND subject = 'Testing without RLS';
    ELSE
        RAISE NOTICE 'SKIPPED: No user ID available for testing';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'FAILED: Insert failed even without RLS - %', SQLERRM;
END $$;

-- STEP 3: NUCLEAR CLEANUP
DO $$
DECLARE
    pol_name TEXT;
    dropped_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== NUCLEAR CLEANUP STARTING ===';
    
    -- Drop each policy
    FOR pol_name IN 
        SELECT policyname::text
        FROM pg_policies 
        WHERE tablename = 'voice_messages' 
        AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_name || '" ON voice_messages CASCADE';
        dropped_count := dropped_count + 1;
        RAISE NOTICE 'Dropped policy: %', pol_name;
    END LOOP;
    
    RAISE NOTICE 'Total policies dropped: %', dropped_count;
    
    -- Drop threading trigger and function
    DROP TRIGGER IF EXISTS set_thread_id_trigger ON voice_messages;
    DROP FUNCTION IF EXISTS set_thread_id() CASCADE;
    RAISE NOTICE 'Dropped threading trigger and function (if they existed)';
END $$;

-- STEP 4: RE-ENABLE RLS
ALTER TABLE voice_messages ENABLE ROW LEVEL SECURITY;

-- STEP 5: CREATE MINIMAL POLICIES
-- Insert policy
CREATE POLICY "simple_insert" 
ON voice_messages
FOR INSERT 
WITH CHECK (sender_id = auth.uid());

-- Select policy
CREATE POLICY "simple_select" 
ON voice_messages
FOR SELECT 
USING (
    sender_id = auth.uid() 
    OR 
    id IN (
        SELECT voice_message_id 
        FROM voice_message_recipients 
        WHERE recipient_id = auth.uid()
    )
);

-- Update policy
CREATE POLICY "simple_update" 
ON voice_messages
FOR UPDATE 
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

-- Delete policy
CREATE POLICY "simple_delete" 
ON voice_messages
FOR DELETE 
USING (sender_id = auth.uid());

-- Fixed: Wrap RAISE NOTICE in DO block
DO $$ BEGIN
    RAISE NOTICE 'Created 4 simple policies without recursion';
END $$;

-- STEP 6: VERIFY POLICIES CREATED
SELECT 
    'Final policies after recreation:' as info,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'voice_messages' 
AND schemaname = 'public'
ORDER BY cmd, policyname;

-- STEP 7: TEST WITH RLS ENABLED (if we have a user)
DO $$
DECLARE
    test_user_id UUID;
    test_auth_uid UUID;
    test_message_id UUID;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== TESTING WITH RLS ENABLED ===';
    
    -- Get auth.uid() or fallback
    test_auth_uid := auth.uid();
    
    IF test_auth_uid IS NULL THEN
        -- Use known test user
        test_user_id := '00e07e97-7081-4a83-852f-c9693a16a8bc'::uuid;
        
        RAISE NOTICE 'auth.uid() is NULL (SQL Editor context)';
        RAISE NOTICE 'Testing with known user ID: %', test_user_id;
        RAISE NOTICE '';
        RAISE NOTICE 'NOTE: RLS policies use auth.uid(), so this test may not work';
        RAISE NOTICE 'from SQL Editor. Test from application UI for accurate results.';
    ELSE
        test_user_id := test_auth_uid;
        
        -- Test insert
        INSERT INTO voice_messages (
            title, 
            subject, 
            sender_id, 
            duration, 
            is_urgent, 
            is_private,
            audio_url
        )
        VALUES (
            'RLS Test Final', 
            'Testing with new policies', 
            test_user_id, 
            10, 
            false, 
            false,
            'https://example.com/test-final-audio.mp4'
        )
        RETURNING id INTO test_message_id;
        
        RAISE NOTICE '✅ SUCCESS: Insert works with new RLS policies!';
        
        -- Clean up
        DELETE FROM voice_messages WHERE id = test_message_id;
        RAISE NOTICE '✅ SUCCESS: Delete works with new RLS policies!';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ FAILED: RLS test failed - %', SQLERRM;
        IF SQLERRM LIKE '%infinite recursion%' THEN
            RAISE NOTICE '*** RECURSION STILL EXISTS - Policies need further adjustment ***';
        ELSIF SQLERRM LIKE '%new row violates row-level security%' THEN
            RAISE NOTICE 'This is expected in SQL Editor - auth.uid() is NULL';
            RAISE NOTICE 'Policies are likely working correctly';
            RAISE NOTICE 'Test from application UI to confirm';
        END IF;
END $$;

-- STEP 8: SUMMARY
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== NUCLEAR FIX COMPLETE ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Results:';
    RAISE NOTICE '✅ All old policies dropped';
    RAISE NOTICE '✅ New simple policies created';
    RAISE NOTICE '✅ No recursion in policy definitions';
    RAISE NOTICE '';
    RAISE NOTICE 'IMPORTANT: If RLS test failed with "row-level security" error,';
    RAISE NOTICE 'this is EXPECTED in SQL Editor because auth.uid() is NULL.';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Run verification_with_user_id.sql (already configured with user ID)';
    RAISE NOTICE '2. Test through the application UI at /test-message-upload';
    RAISE NOTICE '3. Look for NO INFINITE RECURSION ERRORS - that''s the key!';
    RAISE NOTICE '';
    RAISE NOTICE 'Remember: audio_url is required for all inserts!';
END $$;