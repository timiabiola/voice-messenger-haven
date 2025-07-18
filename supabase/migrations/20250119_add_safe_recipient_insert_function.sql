-- Create the safe_recipient_insert function
-- This function allows message senders to add recipients to their messages
-- It bypasses RLS policies but includes authorization checks

CREATE OR REPLACE FUNCTION safe_recipient_insert(
  p_message_id UUID,
  p_recipient_id UUID,
  p_sender_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify that the authenticated user is the sender
  IF auth.uid() != p_sender_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only add recipients to your own messages';
  END IF;
  
  -- Verify that the message exists and belongs to the sender
  IF NOT EXISTS (
    SELECT 1 FROM voice_messages
    WHERE id = p_message_id
    AND sender_id = p_sender_id
  ) THEN
    RAISE EXCEPTION 'Message not found or you are not the sender';
  END IF;
  
  -- Check if recipient already exists to avoid duplicates
  IF EXISTS (
    SELECT 1 FROM voice_message_recipients
    WHERE voice_message_id = p_message_id
    AND recipient_id = p_recipient_id
  ) THEN
    -- Silently succeed if recipient already exists
    RETURN;
  END IF;
  
  -- Insert the recipient
  INSERT INTO voice_message_recipients (voice_message_id, recipient_id)
  VALUES (p_message_id, p_recipient_id);
  
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

-- Add comment for documentation
COMMENT ON FUNCTION safe_recipient_insert IS 'Safely insert a recipient for a voice message with proper authorization checks';

-- Also ensure we have INSERT policy for voice_messages table
-- Check if policy exists before creating
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'voice_messages' 
    AND policyname = 'Users can insert their own messages'
  ) THEN
    CREATE POLICY "Users can insert their own messages"
    ON voice_messages
    FOR INSERT
    WITH CHECK (auth.uid() = sender_id);
  END IF;
END $$;

-- Ensure RLS is enabled on voice_messages
ALTER TABLE voice_messages ENABLE ROW LEVEL SECURITY;

-- Also add UPDATE policy for voice_messages if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'voice_messages' 
    AND policyname = 'Users can update their own messages'
  ) THEN
    CREATE POLICY "Users can update their own messages"
    ON voice_messages
    FOR UPDATE
    USING (auth.uid() = sender_id)
    WITH CHECK (auth.uid() = sender_id);
  END IF;
END $$;

-- Add DELETE policy for voice_messages if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'voice_messages' 
    AND policyname = 'Users can delete their own messages'
  ) THEN
    CREATE POLICY "Users can delete their own messages"
    ON voice_messages
    FOR DELETE
    USING (auth.uid() = sender_id);
  END IF;
END $$;