-- Fix infinite recursion in voice_messages RLS policies
-- This migration drops all existing policies and recreates them cleanly

-- First, drop all existing policies on voice_messages
DROP POLICY IF EXISTS "Users can insert their own messages" ON voice_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON voice_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON voice_messages;
DROP POLICY IF EXISTS "Users can view messages sent to them" ON voice_messages;

-- Also drop any other policies that might exist
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

-- Ensure RLS is enabled
ALTER TABLE voice_messages ENABLE ROW LEVEL SECURITY;

-- Create clean, non-recursive policies

-- 1. INSERT: Simple check that user is the sender
CREATE POLICY "users_insert_own_messages" 
ON voice_messages
FOR INSERT 
WITH CHECK (sender_id = auth.uid());

-- 2. SELECT: User can see messages they sent or received
-- This avoids recursion by using a subquery instead of self-referencing
CREATE POLICY "users_view_accessible_messages" 
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

-- 3. UPDATE: Only sender can update their own messages
CREATE POLICY "users_update_own_messages" 
ON voice_messages
FOR UPDATE 
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

-- 4. DELETE: Only sender can delete their own messages
CREATE POLICY "users_delete_own_messages" 
ON voice_messages
FOR DELETE 
USING (sender_id = auth.uid());

-- Add comment explaining the fix
COMMENT ON TABLE voice_messages IS 'Voice messages table with non-recursive RLS policies to prevent infinite recursion error';