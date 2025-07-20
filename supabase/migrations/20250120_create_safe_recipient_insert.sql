-- Create the safe_recipient_insert RPC function
-- This function is called from the JavaScript code to add recipients to messages

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
    -- Validate that the caller is the sender of the message
    IF NOT EXISTS (
        SELECT 1 FROM voice_messages 
        WHERE id = p_message_id 
        AND sender_id = p_sender_id
        AND sender_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized: You can only add recipients to your own messages';
    END IF;

    -- Validate that the recipient exists
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = p_recipient_id
    ) THEN
        RAISE EXCEPTION 'Recipient does not exist';
    END IF;

    -- Check if recipient is already added
    IF EXISTS (
        SELECT 1 FROM voice_message_recipients 
        WHERE voice_message_id = p_message_id 
        AND recipient_id = p_recipient_id
    ) THEN
        -- Silently succeed if already exists
        RETURN;
    END IF;

    -- Insert the recipient
    INSERT INTO voice_message_recipients (voice_message_id, recipient_id)
    VALUES (p_message_id, p_recipient_id);

    RAISE NOTICE 'Recipient % added to message %', p_recipient_id, p_message_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION safe_recipient_insert TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION safe_recipient_insert IS 'Safely adds a recipient to a voice message with proper authorization checks';

-- Test the function
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== SAFE RECIPIENT INSERT FUNCTION CREATED ===';
    RAISE NOTICE '';
    RAISE NOTICE 'This function:';
    RAISE NOTICE '1. Validates the sender owns the message';
    RAISE NOTICE '2. Validates the recipient exists';
    RAISE NOTICE '3. Prevents duplicate recipients';
    RAISE NOTICE '4. Uses SECURITY DEFINER to bypass RLS';
    RAISE NOTICE '';
    RAISE NOTICE 'Called from JavaScript as:';
    RAISE NOTICE 'supabase.rpc(''safe_recipient_insert'', {';
    RAISE NOTICE '  p_message_id: messageId,';
    RAISE NOTICE '  p_recipient_id: recipientId,';
    RAISE NOTICE '  p_sender_id: senderId';
    RAISE NOTICE '})';
END $$;