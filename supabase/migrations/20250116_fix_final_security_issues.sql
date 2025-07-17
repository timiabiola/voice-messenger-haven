-- Fix final remaining security issues
-- 1. Fix remaining functions without search_path
-- 2. Note about extension update (must be done manually)

-- Fix notify_new_voice_message function
DO $$
BEGIN
  -- Check if function exists and fix it
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'notify_new_voice_message'
  ) THEN
    ALTER FUNCTION public.notify_new_voice_message() SET search_path = public;
    RAISE NOTICE 'Fixed search_path for notify_new_voice_message()';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Could not fix notify_new_voice_message: %', SQLERRM;
END $$;

-- Fix update_sender_info function with all possible signatures
DO $$
BEGIN
  -- Try different parameter combinations that might exist
  
  -- Version 1: Three parameters (uuid, text, text)
  BEGIN
    ALTER FUNCTION public.update_sender_info(uuid, text, text) SET search_path = public;
    RAISE NOTICE 'Fixed search_path for update_sender_info(uuid, text, text)';
  EXCEPTION
    WHEN undefined_function THEN
      NULL; -- Function with this signature doesn't exist
    WHEN OTHERS THEN
      RAISE WARNING 'Could not fix update_sender_info(uuid, text, text): %', SQLERRM;
  END;
  
  -- Version 2: Different parameter names or types
  BEGIN
    ALTER FUNCTION public.update_sender_info(p_user_id uuid, p_first_name text, p_last_name text) SET search_path = public;
    RAISE NOTICE 'Fixed search_path for update_sender_info with named parameters';
  EXCEPTION
    WHEN undefined_function THEN
      NULL; -- Function with this signature doesn't exist
    WHEN OTHERS THEN
      RAISE WARNING 'Could not fix update_sender_info with named parameters: %', SQLERRM;
  END;
  
END $$;

-- List all overloads of these functions to see what signatures exist
DO $$
DECLARE
  func_record RECORD;
BEGIN
  RAISE NOTICE 'Checking all versions of target functions...';
  
  FOR func_record IN
    SELECT 
      n.nspname as schema_name,
      p.proname as function_name,
      pg_get_function_identity_arguments(p.oid) as arguments,
      p.prosecdef as is_security_definer,
      CASE 
        WHEN p.proconfig IS NULL THEN 'No config'
        WHEN array_to_string(p.proconfig, ',') LIKE '%search_path%' THEN 'Has search_path'
        ELSE 'Missing search_path'
      END as search_path_status
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname IN ('notify_new_voice_message', 'update_sender_info')
  LOOP
    RAISE NOTICE 'Found: %.%(%s) - Security Definer: % - Status: %', 
      func_record.schema_name, 
      func_record.function_name, 
      func_record.arguments,
      func_record.is_security_definer,
      func_record.search_path_status;
      
    -- If it's missing search_path and is SECURITY DEFINER, fix it
    IF func_record.is_security_definer AND func_record.search_path_status = 'Missing search_path' THEN
      BEGIN
        EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public',
                      func_record.schema_name,
                      func_record.function_name,
                      func_record.arguments);
        RAISE NOTICE 'Successfully fixed: %.%(%s)', 
          func_record.schema_name, 
          func_record.function_name, 
          func_record.arguments;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING 'Failed to fix %.%(%s): %', 
            func_record.schema_name, 
            func_record.function_name, 
            func_record.arguments,
            SQLERRM;
      END;
    END IF;
  END LOOP;
END $$;

-- Final check for any remaining functions without search_path
DO $$
DECLARE
  remaining_count INTEGER;
  func_record RECORD;
BEGIN
  SELECT COUNT(*) INTO remaining_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.prosecdef = true
  AND NOT EXISTS (
    SELECT 1 
    FROM pg_catalog.pg_proc p2
    WHERE p2.oid = p.oid
    AND p2.proconfig IS NOT NULL
    AND EXISTS (
      SELECT 1 
      FROM unnest(p2.proconfig) AS config_item
      WHERE config_item LIKE 'search_path=%'
    )
  );
  
  IF remaining_count > 0 THEN
    RAISE WARNING 'Still have % functions without search_path:', remaining_count;
    
    -- List them
    FOR func_record IN
      SELECT 
        n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' as full_name
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND NOT EXISTS (
        SELECT 1 
        FROM pg_catalog.pg_proc p2
        WHERE p2.oid = p.oid
        AND p2.proconfig IS NOT NULL
        AND EXISTS (
          SELECT 1 
          FROM unnest(p2.proconfig) AS config_item
          WHERE config_item LIKE 'search_path=%'
        )
      )
    LOOP
      RAISE WARNING '  - %', func_record.full_name;
    END LOOP;
  ELSE
    RAISE NOTICE 'SUCCESS: All SECURITY DEFINER functions in public schema now have search_path set!';
  END IF;
END $$;

-- Note about extension update
DO $$
BEGIN
  RAISE NOTICE E'\n================================================';
  RAISE NOTICE 'EXTENSION UPDATE REQUIRED:';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'pg_graphql extension needs to be updated from 1.5.9 to 1.5.11';
  RAISE NOTICE 'This must be done manually in the Supabase Dashboard:';
  RAISE NOTICE '1. Go to Database > Extensions';
  RAISE NOTICE '2. Find pg_graphql';
  RAISE NOTICE '3. Click Update to version 1.5.11';
  RAISE NOTICE '================================================';
END $$;