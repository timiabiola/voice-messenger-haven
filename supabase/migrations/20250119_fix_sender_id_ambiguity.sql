-- Fix sender_id ambiguity in voice_message_recipients RLS policy
-- This migration resolves the "column reference 'sender_id' is ambiguous" error

-- 1. Drop the problematic policy that causes ambiguity during INSERT operations
DROP POLICY IF EXISTS "Users can view message recipients" ON voice_message_recipients;

-- 2. Create a cleaner policy without nested EXISTS that avoids ambiguity
-- This policy uses IN clauses with explicit subqueries instead of correlated subqueries
CREATE POLICY "Users can view message recipients" ON voice_message_recipients
FOR SELECT USING (
  voice_message_id IN (
    -- Messages where user is the sender
    SELECT id FROM voice_messages
    WHERE sender_id = auth.uid()
    
    UNION
    
    -- Messages where user is a recipient
    SELECT voice_message_id FROM voice_message_recipients
    WHERE recipient_id = auth.uid()
  )
);

-- 3. Update the safe_recipient_insert function with better practices
DROP FUNCTION IF EXISTS safe_recipient_insert(UUID, UUID, UUID);

CREATE OR REPLACE FUNCTION public.safe_recipient_insert(
  p_message_id UUID,
  p_recipient_id UUID,
  p_sender_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  -- Use parameter prefixes (p_) to avoid any naming conflicts
  IF auth.uid() != p_sender_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only add recipients to your own messages';
  END IF;
  
  -- Check message ownership with fully qualified table name
  IF NOT EXISTS (
    SELECT 1 FROM public.voice_messages
    WHERE id = p_message_id
    AND sender_id = p_sender_id
  ) THEN
    RAISE EXCEPTION 'Message not found or you are not the sender';
  END IF;
  
  -- Insert with fully qualified table name and ON CONFLICT to handle duplicates gracefully
  INSERT INTO public.voice_message_recipients (voice_message_id, recipient_id)
  VALUES (p_message_id, p_recipient_id)
  ON CONFLICT (voice_message_id, recipient_id) DO NOTHING;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error for debugging
    RAISE LOG 'Error in safe_recipient_insert: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    -- Re-raise with more context
    RAISE EXCEPTION 'Failed to add recipient: %', SQLERRM;
END;
$$;

-- 4. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.safe_recipient_insert TO authenticated;

-- 5. Add a comment explaining the fix
COMMENT ON POLICY "Users can view message recipients" ON voice_message_recipients IS 
'Fixed policy that avoids sender_id ambiguity by using IN clauses instead of correlated subqueries';

COMMENT ON FUNCTION public.safe_recipient_insert IS 
'Safely adds recipients to voice messages with proper authorization checks and ambiguity prevention';

-- 6. Ensure we have proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_voice_message_recipients_message_id 
ON voice_message_recipients(voice_message_id);

CREATE INDEX IF NOT EXISTS idx_voice_message_recipients_recipient_id 
ON voice_message_recipients(recipient_id);

-- 7. Add a unique constraint to prevent duplicate recipients (if not already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'voice_message_recipients_unique_message_recipient'
  ) THEN
    ALTER TABLE voice_message_recipients 
    ADD CONSTRAINT voice_message_recipients_unique_message_recipient 
    UNIQUE (voice_message_id, recipient_id);
  END IF;
END $$;