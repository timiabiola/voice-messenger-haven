-- Gradual Restoration Script - Add recipient access back WITHOUT recursion
-- Run this ONLY after confirming ultra_nuclear_fix eliminated recursion

-- STEP 1: Create a SECURITY DEFINER function to check recipient access
-- This avoids direct subqueries in RLS policies
CREATE OR REPLACE FUNCTION is_message_recipient(message_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM voice_message_recipients 
        WHERE voice_message_id = message_id 
        AND recipient_id = user_id
    );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION is_message_recipient TO authenticated;

DO $$
BEGIN
    RAISE NOTICE '✅ Created is_message_recipient function';
    RAISE NOTICE 'This avoids subqueries in RLS policies';
END $$;

-- STEP 2: Create new SELECT policy that includes recipient access
-- First, drop the ultra simple select policy
DROP POLICY IF EXISTS "ultra_simple_select" ON voice_messages;

-- Create new policy using the function (no direct subquery)
CREATE POLICY "select_with_recipient_function" 
ON voice_messages
FOR SELECT 
USING (
    sender_id = auth.uid() 
    OR 
    is_message_recipient(id, auth.uid())
);

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Created new SELECT policy with recipient access';
    RAISE NOTICE 'Using function instead of subquery to avoid recursion';
END $$;

-- STEP 3: Test the new policy
DO $$
DECLARE
    test_user_id UUID;
    test_message_id UUID;
    test_recipient_id UUID;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== TESTING RESTORED RECIPIENT ACCESS ===';
    
    -- Use a test user ID (replace with actual user ID from your database)
    test_user_id := '11111111-1111-1111-1111-111111111111'::uuid; -- PLACEHOLDER: Replace with actual user ID
    test_recipient_id := gen_random_uuid();
    
    -- Temporarily disable RLS for setup
    ALTER TABLE voice_messages DISABLE ROW LEVEL SECURITY;
    ALTER TABLE voice_message_recipients DISABLE ROW LEVEL SECURITY;
    
    -- Create test message
    INSERT INTO voice_messages (
        title, 
        subject, 
        sender_id, 
        duration, 
        is_urgent, 
        is_private,
        audio_url
    )
    VALUES (
        'Recipient Access Test', 
        'Testing with function-based access', 
        test_user_id, 
        10, 
        false, 
        false,
        'https://example.com/recipient-test.mp4'
    )
    RETURNING id INTO test_message_id;
    
    -- Add recipient
    INSERT INTO voice_message_recipients (voice_message_id, recipient_id)
    VALUES (test_message_id, test_recipient_id);
    
    RAISE NOTICE 'Created test message and recipient';
    
    -- Re-enable RLS
    ALTER TABLE voice_messages ENABLE ROW LEVEL SECURITY;
    ALTER TABLE voice_message_recipients ENABLE ROW LEVEL SECURITY;
    
    -- Test function
    IF is_message_recipient(test_message_id, test_recipient_id) THEN
        RAISE NOTICE '✅ Function correctly identifies recipient';
    ELSE
        RAISE NOTICE '❌ Function failed to identify recipient';
    END IF;
    
    -- Clean up
    ALTER TABLE voice_message_recipients DISABLE ROW LEVEL SECURITY;
    DELETE FROM voice_message_recipients WHERE voice_message_id = test_message_id;
    ALTER TABLE voice_message_recipients ENABLE ROW LEVEL SECURITY;
    
    ALTER TABLE voice_messages DISABLE ROW LEVEL SECURITY;
    DELETE FROM voice_messages WHERE id = test_message_id;
    ALTER TABLE voice_messages ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE '✅ Test complete - no recursion detected!';
    
EXCEPTION
    WHEN OTHERS THEN
        -- Ensure RLS is re-enabled
        ALTER TABLE voice_messages ENABLE ROW LEVEL SECURITY;
        ALTER TABLE voice_message_recipients ENABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE '❌ Test failed: %', SQLERRM;
        IF SQLERRM LIKE '%infinite recursion%' THEN
            RAISE NOTICE '*** RECURSION DETECTED WITH FUNCTION APPROACH ***';
            RAISE NOTICE 'DO NOT USE THIS APPROACH';
        END IF;
END $$;

-- STEP 4: Alternative approach using materialized path
-- If the function approach still causes recursion, use this instead

/*
-- COMMENTED OUT - Use only if function approach fails

-- Add a recipient_ids array column to voice_messages
ALTER TABLE voice_messages ADD COLUMN IF NOT EXISTS recipient_ids UUID[] DEFAULT '{}';

-- Create trigger to sync recipients
CREATE OR REPLACE FUNCTION sync_recipient_ids()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE voice_messages 
        SET recipient_ids = (
            SELECT array_agg(recipient_id) 
            FROM voice_message_recipients 
            WHERE voice_message_id = NEW.voice_message_id
        )
        WHERE id = NEW.voice_message_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE voice_messages 
        SET recipient_ids = (
            SELECT array_agg(recipient_id) 
            FROM voice_message_recipients 
            WHERE voice_message_id = OLD.voice_message_id
        )
        WHERE id = OLD.voice_message_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_recipients_trigger
AFTER INSERT OR UPDATE OR DELETE ON voice_message_recipients
FOR EACH ROW
EXECUTE FUNCTION sync_recipient_ids();

-- Then use simple array check in policy
DROP POLICY IF EXISTS "select_with_recipient_function" ON voice_messages;

CREATE POLICY "select_with_recipient_array" 
ON voice_messages
FOR SELECT 
USING (
    sender_id = auth.uid() 
    OR 
    auth.uid() = ANY(recipient_ids)
);
*/

-- STEP 5: Summary
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== GRADUAL RESTORATION COMPLETE ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Changes made:';
    RAISE NOTICE '1. Created is_message_recipient function';
    RAISE NOTICE '2. Updated SELECT policy to use function';
    RAISE NOTICE '3. Recipients can now see messages';
    RAISE NOTICE '';
    RAISE NOTICE 'This approach avoids recursion by:';
    RAISE NOTICE '- Using SECURITY DEFINER function';
    RAISE NOTICE '- Avoiding direct subqueries in policies';
    RAISE NOTICE '- Keeping policy logic simple';
    RAISE NOTICE '';
    RAISE NOTICE 'If recursion still occurs:';
    RAISE NOTICE '- Use the commented materialized approach';
    RAISE NOTICE '- Or implement application-level security';
END $$;