-- Full Diagnostic Script for Voice Messages Recursion Issue
-- Run this to understand the current state of ALL policies

-- STEP 1: Check ALL policies on voice_messages
SELECT 
    '=== POLICIES ON voice_messages ===' as section;

SELECT 
    policyname,
    cmd,
    qual,
    with_check,
    roles
FROM pg_policies 
WHERE tablename = 'voice_messages' 
AND schemaname = 'public'
ORDER BY policyname;

-- STEP 2: Check ALL policies on voice_message_recipients
SELECT 
    '=== POLICIES ON voice_message_recipients ===' as section;

SELECT 
    policyname,
    cmd,
    qual,
    with_check,
    roles
FROM pg_policies 
WHERE tablename = 'voice_message_recipients' 
AND schemaname = 'public'
ORDER BY policyname;

-- STEP 3: Check for any policies that reference other tables
SELECT 
    '=== CROSS-TABLE REFERENCES IN POLICIES ===' as section;

SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN qual::text LIKE '%voice_messages%' THEN 'References voice_messages'
        WHEN qual::text LIKE '%voice_message_recipients%' THEN 'References voice_message_recipients'
        ELSE 'No cross-reference'
    END as cross_reference
FROM pg_policies 
WHERE schemaname = 'public'
AND (tablename IN ('voice_messages', 'voice_message_recipients'))
ORDER BY tablename, policyname;

-- STEP 4: Show the EXACT policy definitions
SELECT 
    '=== EXACT POLICY DEFINITIONS ===' as section;

SELECT 
    tablename,
    policyname,
    pg_get_expr(polqual, polrelid) as qual_definition,
    pg_get_expr(polwithcheck, polrelid) as with_check_definition
FROM pg_policy pol
JOIN pg_class cls ON pol.polrelid = cls.oid
JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
WHERE nsp.nspname = 'public'
AND cls.relname IN ('voice_messages', 'voice_message_recipients')
ORDER BY cls.relname, pol.polname;

-- STEP 5: Check for any triggers that might cause issues
SELECT 
    '=== TRIGGERS ===' as section;

SELECT 
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'public'
AND event_object_table IN ('voice_messages', 'voice_message_recipients');

-- STEP 6: Check for the threading function
SELECT 
    '=== FUNCTIONS THAT MIGHT CAUSE RECURSION ===' as section;

SELECT 
    proname,
    prosrc
FROM pg_proc
WHERE proname IN ('set_thread_id', 'get_thread_messages')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- STEP 7: Summary and analysis
DO $$
DECLARE
    vm_policy_count INTEGER;
    vmr_policy_count INTEGER;
    has_thread_trigger BOOLEAN;
BEGIN
    -- Count policies
    SELECT COUNT(*) INTO vm_policy_count
    FROM pg_policies 
    WHERE tablename = 'voice_messages' AND schemaname = 'public';
    
    SELECT COUNT(*) INTO vmr_policy_count
    FROM pg_policies 
    WHERE tablename = 'voice_message_recipients' AND schemaname = 'public';
    
    -- Check for thread trigger
    SELECT EXISTS(
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'set_thread_id_trigger'
        AND event_object_table = 'voice_messages'
    ) INTO has_thread_trigger;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== DIAGNOSTIC SUMMARY ===';
    RAISE NOTICE 'Policies on voice_messages: %', vm_policy_count;
    RAISE NOTICE 'Policies on voice_message_recipients: %', vmr_policy_count;
    RAISE NOTICE 'Thread trigger exists: %', has_thread_trigger;
    RAISE NOTICE '';
    
    IF vm_policy_count > 4 THEN
        RAISE NOTICE '⚠️  WARNING: More than 4 policies on voice_messages!';
        RAISE NOTICE 'The nuclear fix may not have run properly.';
    END IF;
    
    IF vmr_policy_count > 0 THEN
        RAISE NOTICE '⚠️  WARNING: Policies exist on voice_message_recipients!';
        RAISE NOTICE 'These could cause circular references.';
    END IF;
    
    IF has_thread_trigger THEN
        RAISE NOTICE '⚠️  WARNING: Thread trigger still exists!';
        RAISE NOTICE 'This should have been dropped by nuclear fix.';
    END IF;
END $$;