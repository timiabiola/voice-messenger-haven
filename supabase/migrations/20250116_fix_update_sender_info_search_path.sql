-- Fix update_sender_info function search_path issue
-- This script will find and fix ALL versions of update_sender_info

DO $$
DECLARE
  func_record RECORD;
  fix_count INTEGER := 0;
  alter_command TEXT;
BEGIN
  RAISE NOTICE 'Looking for all versions of update_sender_info function...';
  
  -- Find ALL versions of update_sender_info regardless of parameters
  FOR func_record IN
    SELECT 
      p.oid,
      n.nspname as schema_name,
      p.proname as function_name,
      pg_get_function_identity_arguments(p.oid) as arguments,
      p.prosecdef as is_security_definer,
      p.proconfig as current_config,
      CASE 
        WHEN p.proconfig IS NULL THEN false
        WHEN array_to_string(p.proconfig, ',') LIKE '%search_path=%' THEN true
        ELSE false
      END as has_search_path
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'update_sender_info'
  LOOP
    RAISE NOTICE 'Found: %.%(%) - SECURITY DEFINER: % - Has search_path: %', 
      func_record.schema_name, 
      func_record.function_name, 
      func_record.arguments,
      func_record.is_security_definer,
      func_record.has_search_path;
    
    -- Fix it if it doesn't have search_path
    IF NOT func_record.has_search_path THEN
      BEGIN
        -- Build the ALTER command
        alter_command := format('ALTER FUNCTION %I.%I(%s) SET search_path = public',
                               func_record.schema_name,
                               func_record.function_name,
                               func_record.arguments);
        
        RAISE NOTICE 'Executing: %', alter_command;
        EXECUTE alter_command;
        
        fix_count := fix_count + 1;
        RAISE NOTICE 'Successfully fixed search_path for %.%(%)!', 
          func_record.schema_name, 
          func_record.function_name, 
          func_record.arguments;
          
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING 'Failed to fix %.%(%): %', 
            func_record.schema_name, 
            func_record.function_name, 
            func_record.arguments,
            SQLERRM;
      END;
    END IF;
  END LOOP;
  
  IF fix_count = 0 THEN
    RAISE NOTICE 'No update_sender_info functions needed fixing.';
  ELSE
    RAISE NOTICE 'Fixed % update_sender_info function(s).', fix_count;
  END IF;
  
  -- Double-check by looking for the function again
  RAISE NOTICE E'\nVerifying fix...';
  
  FOR func_record IN
    SELECT 
      n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' as full_name,
      p.proconfig as config
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'update_sender_info'
  LOOP
    RAISE NOTICE 'Function: % - Config: %', 
      func_record.full_name,
      COALESCE(array_to_string(func_record.config, ', '), 'NO CONFIG');
  END LOOP;
  
END $$;

-- Also try a direct ALTER for common signatures
-- This covers cases where the function might have been created with specific parameter names

-- Try version 1: Basic signature
DO $$
BEGIN
  ALTER FUNCTION public.update_sender_info(uuid, text, text) SET search_path = public;
  RAISE NOTICE 'Fixed update_sender_info(uuid, text, text) directly';
EXCEPTION
  WHEN undefined_function THEN
    RAISE NOTICE 'update_sender_info(uuid, text, text) not found';
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter update_sender_info(uuid, text, text): %', SQLERRM;
END $$;

-- Try version 2: With parameter names
DO $$
BEGIN
  ALTER FUNCTION public.update_sender_info(p_user_id uuid, p_first_name text, p_last_name text) SET search_path = public;
  RAISE NOTICE 'Fixed update_sender_info with named parameters directly';
EXCEPTION
  WHEN undefined_function THEN
    RAISE NOTICE 'update_sender_info with named parameters not found';
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter update_sender_info with named parameters: %', SQLERRM;
END $$;

-- Final comprehensive check for ANY remaining SECURITY DEFINER functions without search_path
DO $$
DECLARE
  remaining_count INTEGER;
  func_record RECORD;
BEGIN
  RAISE NOTICE E'\n=== FINAL SECURITY CHECK ===';
  
  -- Count remaining issues
  SELECT COUNT(*) INTO remaining_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.prosecdef = true  -- SECURITY DEFINER
  AND (
    p.proconfig IS NULL 
    OR NOT EXISTS (
      SELECT 1 
      FROM unnest(p.proconfig) AS config_item
      WHERE config_item LIKE 'search_path=%'
    )
  );
  
  IF remaining_count = 0 THEN
    RAISE NOTICE 'SUCCESS: All SECURITY DEFINER functions now have search_path set!';
  ELSE
    RAISE WARNING 'ATTENTION: Still have % SECURITY DEFINER functions without search_path:', remaining_count;
    
    -- List them with full details
    FOR func_record IN
      SELECT 
        n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' as full_name,
        pg_get_functiondef(p.oid) as definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND (
        p.proconfig IS NULL 
        OR NOT EXISTS (
          SELECT 1 
          FROM unnest(p.proconfig) AS config_item
          WHERE config_item LIKE 'search_path=%'
        )
      )
      LIMIT 5
    LOOP
      RAISE WARNING E'\nFunction: %\nDefinition preview: %', 
        func_record.full_name,
        left(func_record.definition, 200) || '...';
    END LOOP;
  END IF;
END $$;