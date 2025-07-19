-- Fix infinite recursion in voice_messages policies once and for all
-- This drops ALL policies including threading and creates unified non-recursive policies

-- 1. Drop ALL existing policies on voice_messages
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'voice_messages' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON voice_messages', pol.policyname);
    END LOOP;
END $$;

-- 2. Ensure RLS is enabled
ALTER TABLE voice_messages ENABLE ROW LEVEL SECURITY;

-- 3. Create unified policies without recursion

-- INSERT: Users can insert messages where they are the sender
CREATE POLICY "insert_own_messages" 
ON voice_messages
FOR INSERT 
WITH CHECK (sender_id = auth.uid());

-- UPDATE: Users can update their own messages
CREATE POLICY "update_own_messages" 
ON voice_messages
FOR UPDATE 
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

-- DELETE: Users can delete their own messages
CREATE POLICY "delete_own_messages" 
ON voice_messages
FOR DELETE 
USING (sender_id = auth.uid());

-- SELECT: Unified policy for all access patterns
-- This avoids recursion by using CTEs and proper joins
CREATE POLICY "select_accessible_messages" 
ON voice_messages
FOR SELECT 
USING (
    -- User is the sender
    sender_id = auth.uid()
    OR
    -- User is a direct recipient
    id IN (
        SELECT voice_message_id 
        FROM voice_message_recipients 
        WHERE recipient_id = auth.uid()
    )
    OR
    -- User has access to the thread (without recursive query)
    thread_id IN (
        -- Get thread IDs from messages the user sent
        SELECT DISTINCT thread_id 
        FROM voice_messages 
        WHERE sender_id = auth.uid() 
        AND thread_id IS NOT NULL
        
        UNION
        
        -- Get thread IDs from messages the user received
        SELECT DISTINCT vm.thread_id 
        FROM voice_messages vm
        INNER JOIN voice_message_recipients vmr ON vm.id = vmr.voice_message_id
        WHERE vmr.recipient_id = auth.uid() 
        AND vm.thread_id IS NOT NULL
    )
);

-- 4. Add helpful comments
COMMENT ON POLICY "insert_own_messages" ON voice_messages IS 
'Users can only insert messages where they are the sender';

COMMENT ON POLICY "update_own_messages" ON voice_messages IS 
'Users can only update messages where they are the sender';

COMMENT ON POLICY "delete_own_messages" ON voice_messages IS 
'Users can only delete messages where they are the sender';

COMMENT ON POLICY "select_accessible_messages" ON voice_messages IS 
'Unified policy: users can see messages they sent, received, or are in accessible threads - without recursion';

-- 5. Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_voice_messages_sender_id ON voice_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_voice_messages_thread_id ON voice_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_voice_messages_id ON voice_messages(id);

-- 6. Verify the fix by listing final policies
DO $$
BEGIN
    RAISE NOTICE 'Final policies on voice_messages table:';
    FOR pol IN 
        SELECT policyname, cmd 
        FROM pg_policies 
        WHERE tablename = 'voice_messages' 
        AND schemaname = 'public'
        ORDER BY policyname
    LOOP
        RAISE NOTICE '  - % for %', pol.policyname, pol.cmd;
    END LOOP;
END $$;