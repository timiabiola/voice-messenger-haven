-- Comprehensive fix for ALL functions with SECURITY DEFINER but missing search_path
-- This migration finds and fixes all remaining functions dynamically

-- First, let's identify and list all functions that need fixing
DO $$
DECLARE
  func_record RECORD;
  fix_count INTEGER := 0;
  sql_command TEXT;
BEGIN
  RAISE NOTICE 'Starting comprehensive search_path fix for all SECURITY DEFINER functions...';
  
  -- Loop through all functions with SECURITY DEFINER but no search_path
  FOR func_record IN
    SELECT 
      n.nspname as schema_name,
      p.proname as function_name,
      pg_get_function_identity_arguments(p.oid) as arguments,
      pg_get_functiondef(p.oid) as function_definition,
      p.oid as function_oid
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname IN ('public', 'auth', 'storage')  -- Check multiple schemas
    AND p.prosecdef = true  -- SECURITY DEFINER
    AND NOT EXISTS (
      SELECT 1 
      FROM pg_catalog.pg_proc p2
      WHERE p2.oid = p.oid
      AND (
        p2.proconfig @> ARRAY['search_path=public'] OR
        p2.proconfig @> ARRAY['search_path=public, pg_temp'] OR
        p2.proconfig @> ARRAY['search_path=public, pg_catalog'] OR
        p2.proconfig @> ARRAY['search_path=auth, public'] OR
        p2.proconfig @> ARRAY['search_path=storage, public']
      )
    )
  LOOP
    fix_count := fix_count + 1;
    RAISE NOTICE 'Fixing function: %.%(%)', func_record.schema_name, func_record.function_name, func_record.arguments;
    
    -- Get the function definition and modify it
    sql_command := func_record.function_definition;
    
    -- Add SET search_path to the function
    IF sql_command LIKE '%SECURITY DEFINER%' AND sql_command NOT LIKE '%SET search_path%' THEN
      -- Determine appropriate search_path based on schema
      IF func_record.schema_name = 'auth' THEN
        sql_command := regexp_replace(sql_command, 
          '(SECURITY DEFINER)', 
          '\1 SET search_path = auth, public', 
          'i');
      ELSIF func_record.schema_name = 'storage' THEN
        sql_command := regexp_replace(sql_command, 
          '(SECURITY DEFINER)', 
          '\1 SET search_path = storage, public', 
          'i');
      ELSE
        sql_command := regexp_replace(sql_command, 
          '(SECURITY DEFINER)', 
          '\1 SET search_path = public', 
          'i');
      END IF;
      
      -- Execute the CREATE OR REPLACE FUNCTION
      BEGIN
        EXECUTE sql_command;
        RAISE NOTICE 'Successfully fixed: %.%', func_record.schema_name, func_record.function_name;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING 'Failed to fix %.%: %', func_record.schema_name, func_record.function_name, SQLERRM;
      END;
    END IF;
  END LOOP;
  
  IF fix_count = 0 THEN
    RAISE NOTICE 'No functions needed fixing - all SECURITY DEFINER functions already have search_path set!';
  ELSE
    RAISE NOTICE 'Fixed % functions with missing search_path', fix_count;
  END IF;
END $$;

-- Now let's specifically ensure some critical functions are fixed
-- These are functions that commonly appear in multiple migrations

-- Fix safe_recipient_insert if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'safe_recipient_insert'
  ) THEN
    ALTER FUNCTION safe_recipient_insert(uuid, uuid, uuid) SET search_path = public;
  END IF;
END $$;

-- Fix user profile update function if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'handle_updated_at'
  ) THEN
    ALTER FUNCTION handle_updated_at() SET search_path = public;
  END IF;
END $$;

-- Verify the fix worked
DO $$
DECLARE
  remaining_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO remaining_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname IN ('public', 'auth', 'storage')
  AND p.prosecdef = true
  AND NOT EXISTS (
    SELECT 1 
    FROM pg_catalog.pg_proc p2
    WHERE p2.oid = p.oid
    AND p2.proconfig IS NOT NULL
    AND array_length(p2.proconfig, 1) > 0
    AND EXISTS (
      SELECT 1 
      FROM unnest(p2.proconfig) AS config_item
      WHERE config_item LIKE 'search_path=%'
    )
  );
  
  IF remaining_count > 0 THEN
    RAISE WARNING 'Still have % functions without search_path after fix attempt', remaining_count;
  ELSE
    RAISE NOTICE 'SUCCESS: All SECURITY DEFINER functions now have search_path set!';
  END IF;
END $$;