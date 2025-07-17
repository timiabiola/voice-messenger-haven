-- Debug script to find exact function signatures causing issues
-- This will help identify the exact functions that need fixing

-- List ALL functions in public schema with their security settings
SELECT 
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef as has_security_definer,
  CASE 
    WHEN p.proconfig IS NULL THEN 'NO CONFIG'
    WHEN array_to_string(p.proconfig, ',') LIKE '%search_path=%' THEN 'HAS search_path: ' || array_to_string(p.proconfig, ',')
    ELSE 'CONFIG WITHOUT search_path: ' || array_to_string(p.proconfig, ',')
  END as config_status,
  pg_get_functiondef(p.oid) as full_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prosecdef = true  -- Only SECURITY DEFINER functions
AND (
  p.proname IN ('notify_new_voice_message', 'update_sender_info')
  OR NOT EXISTS (
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
)
ORDER BY p.proname;

-- Also check in auth schema
SELECT 
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef as has_security_definer,
  CASE 
    WHEN p.proconfig IS NULL THEN 'NO CONFIG'
    WHEN array_to_string(p.proconfig, ',') LIKE '%search_path=%' THEN 'HAS search_path'
    ELSE 'CONFIG WITHOUT search_path'
  END as config_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'auth'
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
ORDER BY p.proname;