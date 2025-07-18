-- Complete fix for voice_messages table: function and policies
-- This ensures everything is in the correct state regardless of what was run before

-- 1. Fix the safe_recipient_insert function
DROP FUNCTION IF EXISTS safe_recipient_insert(UUID, UUID, UUID);

CREATE OR REPLACE FUNCTION safe_recipient_insert(
  message_id UUID,
  recipient_id UUID,
  sender_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify that the authenticated user is the sender
  IF auth.uid() != sender_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only add recipients to your own messages';
  END IF;
  
  -- Verify that the message exists and belongs to the sender
  IF NOT EXISTS (
    SELECT 1 FROM voice_messages vm
    WHERE vm.id = message_id
    AND vm.sender_id = sender_id
  ) THEN
    RAISE EXCEPTION 'Message not found or you are not the sender';
  END IF;
  
  -- Check if recipient already exists to avoid duplicates
  IF EXISTS (
    SELECT 1 FROM voice_message_recipients vmr
    WHERE vmr.voice_message_id = message_id
    AND vmr.recipient_id = recipient_id
  ) THEN
    -- Silently succeed if recipient already exists
    RETURN;
  END IF;
  
  -- Insert the recipient
  INSERT INTO voice_message_recipients (voice_message_id, recipient_id)
  VALUES (message_id, recipient_id);
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error (in production, you might want to log to a table)
    RAISE LOG 'Error in safe_recipient_insert: %', SQLERRM;
    -- Re-raise the exception
    RAISE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION safe_recipient_insert TO authenticated;

-- 2. Fix all policies on voice_messages to prevent recursion
-- Drop ALL existing policies
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

-- INSERT: Simple check that user is the sender
CREATE POLICY "users_insert_own_messages" 
ON voice_messages
FOR INSERT 
WITH CHECK (sender_id = auth.uid());

-- SELECT: User can see messages they sent or received
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

-- UPDATE: Only sender can update their own messages
CREATE POLICY "users_update_own_messages" 
ON voice_messages
FOR UPDATE 
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

-- DELETE: Only sender can delete their own messages
CREATE POLICY "users_delete_own_messages" 
ON voice_messages
FOR DELETE 
USING (sender_id = auth.uid());

-- Add comment
COMMENT ON TABLE voice_messages IS 'Voice messages table with non-recursive RLS policies';
COMMENT ON FUNCTION safe_recipient_insert IS 'RPC function for safely adding message recipients';