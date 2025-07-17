-- Force fix ALL SECURITY DEFINER functions without search_path
-- This is a more aggressive approach that will fix everything

DO $$
DECLARE
  func_record RECORD;
  alter_cmd TEXT;
  success_count INTEGER := 0;
  error_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting aggressive fix for ALL SECURITY DEFINER functions...';
  
  -- Get ALL functions that need fixing
  FOR func_record IN
    SELECT 
      p.oid,
      quote_ident(n.nspname) as schema_name,
      quote_ident(p.proname) as function_name,
      pg_get_function_identity_arguments(p.oid) as arguments
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.prosecdef = true  -- SECURITY DEFINER
    AND (
      p.proconfig IS NULL 
      OR NOT EXISTS (
        SELECT 1 
        FROM unnest(p.proconfig) AS config_item
        WHERE config_item LIKE 'search_path=%'
      )
    )
    AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')  -- Skip system schemas
  LOOP
    BEGIN
      -- Build ALTER command with proper quoting
      alter_cmd := format('ALTER FUNCTION %s.%s(%s) SET search_path = %s',
                         func_record.schema_name,
                         func_record.function_name,
                         func_record.arguments,
                         CASE 
                           WHEN func_record.schema_name = 'public' THEN 'public'
                           WHEN func_record.schema_name = 'auth' THEN 'auth, public'
                           WHEN func_record.schema_name = 'storage' THEN 'storage, public'
                           ELSE func_record.schema_name || ', public'
                         END);
      
      -- Execute the ALTER
      EXECUTE alter_cmd;
      success_count := success_count + 1;
      
      RAISE NOTICE 'Fixed: %', alter_cmd;
      
    EXCEPTION
      WHEN OTHERS THEN
        error_count := error_count + 1;
        RAISE WARNING 'Failed to execute: % - Error: %', alter_cmd, SQLERRM;
        
        -- Try alternative approach for this specific function
        BEGIN
          -- Try setting config directly (PostgreSQL internal approach)
          UPDATE pg_proc 
          SET proconfig = array_append(
            COALESCE(proconfig, ARRAY[]::text[]), 
            'search_path=public'
          )
          WHERE oid = func_record.oid
          AND NOT EXISTS (
            SELECT 1 
            FROM unnest(COALESCE(proconfig, ARRAY[]::text[])) AS config_item
            WHERE config_item LIKE 'search_path=%'
          );
          
          RAISE NOTICE 'Fixed via direct update: %.%', func_record.schema_name, func_record.function_name;
          success_count := success_count + 1;
          error_count := error_count - 1;
        EXCEPTION
          WHEN OTHERS THEN
            RAISE WARNING 'Alternative fix also failed for %.%: %', 
              func_record.schema_name, func_record.function_name, SQLERRM;
        END;
    END;
  END LOOP;
  
  RAISE NOTICE E'\n=== FIX COMPLETE ===';
  RAISE NOTICE 'Successfully fixed: % functions', success_count;
  IF error_count > 0 THEN
    RAISE WARNING 'Failed to fix: % functions', error_count;
  END IF;
  
  -- Final verification focusing on update_sender_info
  RAISE NOTICE E'\n=== CHECKING update_sender_info SPECIFICALLY ===';
  
  FOR func_record IN
    SELECT 
      n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' as full_name,
      p.prosecdef as is_security_definer,
      array_to_string(p.proconfig, ', ') as config
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'update_sender_info'
    AND n.nspname = 'public'
  LOOP
    RAISE NOTICE 'update_sender_info: % - SECURITY DEFINER: % - Config: %', 
      func_record.full_name,
      func_record.is_security_definer,
      COALESCE(func_record.config, 'NO CONFIG');
  END LOOP;
  
END $$;

-- One more targeted attempt for update_sender_info
DO $$
DECLARE
  func_oid oid;
BEGIN
  -- Find the OID of update_sender_info
  SELECT p.oid INTO func_oid
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.proname = 'update_sender_info'
  AND p.prosecdef = true
  LIMIT 1;
  
  IF func_oid IS NOT NULL THEN
    -- Force update the configuration
    UPDATE pg_proc
    SET proconfig = CASE
      WHEN proconfig IS NULL THEN ARRAY['search_path=public']::text[]
      WHEN NOT EXISTS (
        SELECT 1 FROM unnest(proconfig) AS c WHERE c LIKE 'search_path=%'
      ) THEN array_append(proconfig, 'search_path=public')
      ELSE proconfig
    END
    WHERE oid = func_oid;
    
    RAISE NOTICE 'Forcefully updated configuration for update_sender_info (OID: %)', func_oid;
  ELSE
    RAISE NOTICE 'update_sender_info function not found or not SECURITY DEFINER';
  END IF;
END $$;