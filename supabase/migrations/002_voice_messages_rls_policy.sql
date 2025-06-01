-- Ensure users can read voice messages they have access to
CREATE POLICY IF NOT EXISTS "Users can view messages sent to them"
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
