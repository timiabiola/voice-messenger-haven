-- Ensure users can read voice messages they have access to
-- First drop the policy if it exists
DROP POLICY IF EXISTS "Users can view messages sent to them" ON voice_messages;

-- Create the policy
CREATE POLICY "Users can view messages sent to them"
ON voice_messages
FOR SELECT
TO authenticated
USING (
  auth.uid() = sender_id
  OR
  auth.uid() IN (
    SELECT recipient_id
    FROM voice_message_recipients
    WHERE voice_message_id = voice_messages.id
  )
);
