-- Nuclear Option: Complete reset of voice_messages RLS policies
-- This script investigates and fixes the infinite recursion issue

-- STEP 1: INVESTIGATION
-- Run these queries to understand current state

-- 1.1 List ALL current policies
SELECT 
    'Current policies:' as info,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'voice_messages' 
AND schemaname = 'public'
ORDER BY policyname;

-- 1.2 Check for triggers
SELECT 
    'Triggers on voice_messages:' as info,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'public'
AND event_object_table = 'voice_messages';

-- 1.3 Check for thread-related functions
SELECT 
    'Thread-related functions:' as info,
    proname
FROM pg_proc
WHERE proname LIKE '%thread%'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- STEP 2: TEST WITHOUT RLS
-- Temporarily disable RLS to confirm it's the issue
ALTER TABLE voice_messages DISABLE ROW LEVEL SECURITY;

-- Try a test insert
DO $$
BEGIN
    INSERT INTO voice_messages (title, subject, sender_id, duration, is_urgent, is_private)
    VALUES ('RLS Test', 'Testing without RLS', auth.uid(), 10, false, false);
    RAISE NOTICE 'SUCCESS: Insert works without RLS';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'FAILED: Insert failed even without RLS - %', SQLERRM;
END $$;

-- Clean up test record
DELETE FROM voice_messages WHERE title = 'RLS Test' AND subject = 'Testing without RLS';

-- STEP 3: NUCLEAR CLEANUP
-- Drop ALL policies with explicit naming
DO $$
DECLARE
    pol_name TEXT;
    dropped_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting nuclear cleanup of policies...';
    
    -- Drop each policy explicitly
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
END $$;

-- Drop the threading trigger and function if they exist
DROP TRIGGER IF EXISTS set_thread_id_trigger ON voice_messages;
DROP FUNCTION IF EXISTS set_thread_id() CASCADE;
RAISE NOTICE 'Dropped threading trigger and function (if they existed)';

-- STEP 4: RE-ENABLE RLS
ALTER TABLE voice_messages ENABLE ROW LEVEL SECURITY;

-- STEP 5: CREATE MINIMAL POLICIES
-- Only the absolute essentials, no threading support for now

-- Insert policy
CREATE POLICY "simple_insert" 
ON voice_messages
FOR INSERT 
WITH CHECK (sender_id = auth.uid());

-- Select policy - simplified without threading
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

-- STEP 6: VERIFY FINAL STATE
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'voice_messages' 
    AND schemaname = 'public';
    
    RAISE NOTICE 'Final policy count: %', policy_count;
    RAISE NOTICE 'Expected: 4 (insert, select, update, delete)';
END $$;

-- STEP 7: TEST WITH RLS ENABLED
DO $$
BEGIN
    INSERT INTO voice_messages (title, subject, sender_id, duration, is_urgent, is_private)
    VALUES ('RLS Test Final', 'Testing with new policies', auth.uid(), 10, false, false)
    RETURNING id;
    
    RAISE NOTICE 'SUCCESS: Insert works with new RLS policies!';
    
    -- Clean up
    DELETE FROM voice_messages WHERE title = 'RLS Test Final';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'FAILED: Insert still failing - %', SQLERRM;
        RAISE;
END $$;

-- STEP 8: FINAL VERIFICATION
SELECT 
    'Final policies on voice_messages:' as info,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'voice_messages' 
AND schemaname = 'public'
ORDER BY cmd, policyname;