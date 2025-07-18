-- Add threading support to voice messages
-- This migration adds fields to support message threading/replies

-- Add parent_message_id column to voice_messages table
ALTER TABLE voice_messages 
ADD COLUMN parent_message_id UUID REFERENCES voice_messages(id) ON DELETE CASCADE;

-- Add thread_id column to group messages in the same conversation thread
ALTER TABLE voice_messages 
ADD COLUMN thread_id UUID;

-- Create index for faster thread queries
CREATE INDEX idx_voice_messages_thread_id ON voice_messages(thread_id);
CREATE INDEX idx_voice_messages_parent_message_id ON voice_messages(parent_message_id);

-- Function to automatically set thread_id when creating a message
CREATE OR REPLACE FUNCTION set_thread_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a reply (has parent_message_id)
  IF NEW.parent_message_id IS NOT NULL THEN
    -- Get the thread_id from the parent message
    SELECT thread_id INTO NEW.thread_id 
    FROM voice_messages 
    WHERE id = NEW.parent_message_id;
    
    -- If parent doesn't have a thread_id, use the parent's id as thread_id
    IF NEW.thread_id IS NULL THEN
      NEW.thread_id := NEW.parent_message_id;
    END IF;
  ELSE
    -- This is a new thread, use the message's own id as thread_id
    NEW.thread_id := NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically set thread_id
CREATE TRIGGER set_thread_id_trigger
BEFORE INSERT ON voice_messages
FOR EACH ROW
EXECUTE FUNCTION set_thread_id();

-- Update existing messages to have thread_id
UPDATE voice_messages 
SET thread_id = id 
WHERE parent_message_id IS NULL;

-- For existing replies (if any), set their thread_id
UPDATE voice_messages vm1
SET thread_id = COALESCE(
  (SELECT thread_id FROM voice_messages vm2 WHERE vm2.id = vm1.parent_message_id),
  vm1.parent_message_id
)
WHERE parent_message_id IS NOT NULL;

-- Add RLS policy for thread access
-- Users can view all messages in a thread if they have access to any message in that thread
CREATE POLICY "Users can view messages in accessible threads"
ON voice_messages
FOR SELECT
TO authenticated
USING (
  thread_id IN (
    SELECT DISTINCT vm.thread_id
    FROM voice_messages vm
    LEFT JOIN voice_message_recipients vmr ON vmr.voice_message_id = vm.id
    WHERE vm.sender_id = auth.uid() 
       OR vmr.recipient_id = auth.uid()
  )
);

-- Add function to get thread messages with proper ordering
CREATE OR REPLACE FUNCTION get_thread_messages(p_thread_id UUID)
RETURNS TABLE (
  id UUID,
  parent_message_id UUID,
  thread_id UUID,
  title TEXT,
  subject TEXT,
  audio_url TEXT,
  created_at TIMESTAMPTZ,
  is_urgent BOOLEAN,
  is_private BOOLEAN,
  sender_id UUID,
  depth INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE thread_tree AS (
    -- Base case: root message
    SELECT 
      vm.id,
      vm.parent_message_id,
      vm.thread_id,
      vm.title,
      vm.subject,
      vm.audio_url,
      vm.created_at,
      vm.is_urgent,
      vm.is_private,
      vm.sender_id,
      0 as depth
    FROM voice_messages vm
    WHERE vm.thread_id = p_thread_id AND vm.parent_message_id IS NULL
    
    UNION ALL
    
    -- Recursive case: replies
    SELECT 
      vm.id,
      vm.parent_message_id,
      vm.thread_id,
      vm.title,
      vm.subject,
      vm.audio_url,
      vm.created_at,
      vm.is_urgent,
      vm.is_private,
      vm.sender_id,
      tt.depth + 1
    FROM voice_messages vm
    INNER JOIN thread_tree tt ON vm.parent_message_id = tt.id
  )
  SELECT * FROM thread_tree
  ORDER BY created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;