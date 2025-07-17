-- Simple and safe approach to fix all SECURITY DEFINER functions missing search_path
-- This uses ALTER FUNCTION instead of recreating functions

DO $$
DECLARE
  func_record RECORD;
  fix_count INTEGER := 0;
  total_count INTEGER := 0;
  alter_cmd TEXT;
BEGIN
  RAISE NOTICE 'Starting search_path fix for all SECURITY DEFINER functions...';
  
  -- Count total functions that need fixing
  SELECT COUNT(*) INTO total_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname IN ('public', 'auth', 'storage')
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
  
  RAISE NOTICE 'Found % functions that need search_path fix', total_count;
  
  -- Fix each function using ALTER FUNCTION
  FOR func_record IN
    SELECT 
      n.nspname as schema_name,
      p.proname as function_name,
      pg_get_function_identity_arguments(p.oid) as arguments,
      p.oid as function_oid
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname IN ('public', 'auth', 'storage')
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
    BEGIN
      -- Build ALTER FUNCTION command
      IF func_record.schema_name = 'auth' THEN
        alter_cmd := format('ALTER FUNCTION %I.%I(%s) SET search_path = auth, public',
                           func_record.schema_name, 
                           func_record.function_name, 
                           func_record.arguments);
      ELSIF func_record.schema_name = 'storage' THEN
        alter_cmd := format('ALTER FUNCTION %I.%I(%s) SET search_path = storage, public',
                           func_record.schema_name, 
                           func_record.function_name, 
                           func_record.arguments);
      ELSE
        alter_cmd := format('ALTER FUNCTION %I.%I(%s) SET search_path = public',
                           func_record.schema_name, 
                           func_record.function_name, 
                           func_record.arguments);
      END IF;
      
      -- Execute the ALTER command
      EXECUTE alter_cmd;
      fix_count := fix_count + 1;
      RAISE NOTICE 'Fixed: %.%(%)', func_record.schema_name, func_record.function_name, func_record.arguments;
      
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to fix %.%(%): %', 
                     func_record.schema_name, 
                     func_record.function_name, 
                     func_record.arguments,
                     SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Successfully fixed % out of % functions', fix_count, total_count;
  
  -- Verify the fix
  SELECT COUNT(*) INTO total_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname IN ('public', 'auth', 'storage')
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
  
  IF total_count = 0 THEN
    RAISE NOTICE 'SUCCESS: All SECURITY DEFINER functions now have search_path set!';
  ELSE
    RAISE WARNING 'There are still % functions without search_path', total_count;
  END IF;
END $$;

-- Specifically fix some known problematic functions if they exist
-- These use specific signatures to avoid conflicts

-- Fix format_phone_e164 variants
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'format_phone_e164') THEN
    ALTER FUNCTION format_phone_e164(text) SET search_path = public;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Could not fix format_phone_e164: %', SQLERRM;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'format_phone_e164') THEN
    ALTER FUNCTION format_phone_e164(phone_input text) SET search_path = public;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Could not fix format_phone_e164(phone_input): %', SQLERRM;
END $$;

-- Final verification
DO $$
DECLARE
  remaining_count INTEGER;
  func_record RECORD;
BEGIN
  -- List any remaining functions without search_path
  FOR func_record IN
    SELECT 
      n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' as full_name
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname IN ('public', 'auth', 'storage')
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
    LIMIT 10
  LOOP
    RAISE WARNING 'Still missing search_path: %', func_record.full_name;
  END LOOP;
END $$;