-- Fix recipient visibility for voice messages
-- This migration updates the RLS policies to allow recipients to see messages sent to them

-- First, check what policy currently exists
DO $$
BEGIN
    RAISE NOTICE 'Current voice_messages SELECT policies:';
    FOR r IN 
        SELECT policyname, qual::text 
        FROM pg_policies 
        WHERE tablename = 'voice_messages' 
        AND cmd = 'SELECT'
    LOOP
        RAISE NOTICE '  - %: %', r.policyname, r.qual;
    END LOOP;
END $$;

-- Drop the existing SELECT policy that only allows senders
DROP POLICY IF EXISTS "ultra_simple_select" ON voice_messages;
DROP POLICY IF EXISTS "select_with_recipient_function" ON voice_messages;

-- Create new policy that uses our is_message_recipient function
-- This avoids recursion while allowing recipient access
CREATE POLICY "users_can_see_sent_and_received_messages" 
ON voice_messages
FOR SELECT 
USING (
    sender_id = auth.uid() 
    OR 
    is_message_recipient(id, auth.uid())
);

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Created new SELECT policy for voice_messages';
    RAISE NOTICE 'Users can now see:';
    RAISE NOTICE '  1. Messages they sent (sender_id = auth.uid())';
    RAISE NOTICE '  2. Messages they received (via is_message_recipient function)';
END $$;

-- Now handle voice_message_recipients table
-- Check current policies
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Current voice_message_recipients policies:';
    FOR r IN 
        SELECT policyname, cmd, qual::text 
        FROM pg_policies 
        WHERE tablename = 'voice_message_recipients'
    LOOP
        RAISE NOTICE '  - % (%): %', r.policyname, r.cmd, r.qual;
    END LOOP;
END $$;

-- Drop any existing SELECT policies on recipients table
DROP POLICY IF EXISTS "ultra_simple_select" ON voice_message_recipients;

-- Create policies for voice_message_recipients
CREATE POLICY IF NOT EXISTS "recipients_can_view_their_records" 
ON voice_message_recipients
FOR SELECT 
USING (recipient_id = auth.uid());

CREATE POLICY IF NOT EXISTS "senders_can_view_recipients" 
ON voice_message_recipients
FOR SELECT 
USING (
    voice_message_id IN (
        SELECT id FROM voice_messages WHERE sender_id = auth.uid()
    )
);

-- Ensure INSERT policy exists (via safe_recipient_insert function)
CREATE POLICY IF NOT EXISTS "insert_via_function_only" 
ON voice_message_recipients
FOR INSERT 
WITH CHECK (false); -- Direct inserts blocked, use safe_recipient_insert

-- No direct UPDATE/DELETE allowed
CREATE POLICY IF NOT EXISTS "no_direct_update" 
ON voice_message_recipients
FOR UPDATE 
USING (false);

CREATE POLICY IF NOT EXISTS "no_direct_delete" 
ON voice_message_recipients
FOR DELETE 
USING (false);

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Created policies for voice_message_recipients:';
    RAISE NOTICE '  - Recipients can view their own records';
    RAISE NOTICE '  - Senders can view who they sent messages to';
    RAISE NOTICE '  - Direct INSERT/UPDATE/DELETE blocked (use RPC functions)';
END $$;

-- Test the new policies
DO $$
DECLARE
    test_message_id UUID;
    test_recipient_id UUID;
    test_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== TESTING RECIPIENT VISIBILITY ===';
    
    -- Get a recent message with recipients
    SELECT vm.id, vmr.recipient_id 
    INTO test_message_id, test_recipient_id
    FROM voice_messages vm
    JOIN voice_message_recipients vmr ON vm.id = vmr.voice_message_id
    WHERE vm.created_at > NOW() - INTERVAL '1 day'
    LIMIT 1;
    
    IF test_message_id IS NOT NULL THEN
        RAISE NOTICE 'Test message ID: %', test_message_id;
        RAISE NOTICE 'Test recipient ID: %', test_recipient_id;
        
        -- Test the function
        IF is_message_recipient(test_message_id, test_recipient_id) THEN
            RAISE NOTICE '✅ is_message_recipient function works correctly';
        ELSE
            RAISE NOTICE '❌ is_message_recipient function failed';
        END IF;
        
        -- Count how many recipients can theoretically see this message
        SELECT COUNT(*) INTO test_count
        FROM voice_message_recipients
        WHERE voice_message_id = test_message_id;
        
        RAISE NOTICE '✅ Message has % recipient(s)', test_count;
    ELSE
        RAISE NOTICE 'No recent messages found for testing';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== MIGRATION COMPLETE ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Recipients should now be able to see messages in their inbox!';
    RAISE NOTICE '';
    RAISE NOTICE 'To verify in your app:';
    RAISE NOTICE '1. Send a message from User A to User B';
    RAISE NOTICE '2. Log in as User B';
    RAISE NOTICE '3. Check the inbox - the message should appear';
    RAISE NOTICE '4. Check browser console for any errors';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Test failed: %', SQLERRM;
END $$;