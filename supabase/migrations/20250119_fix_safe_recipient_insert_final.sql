-- Final fix for safe_recipient_insert function
-- This migration handles any state the function might be in

-- First, drop any existing version of the function
DROP FUNCTION IF EXISTS safe_recipient_insert(UUID, UUID, UUID);

-- Create the function with the correct parameter names that match JavaScript
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

-- Add comment for documentation
COMMENT ON FUNCTION safe_recipient_insert IS 'Safely insert a recipient for a voice message with proper authorization checks. Parameters: message_id, recipient_id, sender_id (matching JavaScript RPC call)';