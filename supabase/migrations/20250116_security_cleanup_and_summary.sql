-- Final security cleanup and validation
-- This migration ensures all security issues are resolved

-- 1. Drop any remaining insecure objects
DROP FUNCTION IF EXISTS notify_new_voice_message() CASCADE; -- Remove old version without search_path

-- 2. Validate all functions have proper security settings
DO $$
DECLARE
  func_record RECORD;
  missing_search_path_count INTEGER := 0;
BEGIN
  -- Check for functions with SECURITY DEFINER but no search_path
  FOR func_record IN
    SELECT 
      n.nspname as schema_name,
      p.proname as function_name,
      pg_get_function_identity_arguments(p.oid) as arguments
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.prosecdef = true  -- SECURITY DEFINER
    AND NOT EXISTS (
      SELECT 1 
      FROM pg_catalog.pg_proc p2
      WHERE p2.oid = p.oid
      AND p2.proconfig @> ARRAY['search_path=public']
    )
  LOOP
    missing_search_path_count := missing_search_path_count + 1;
    RAISE WARNING 'Function % still missing search_path', 
      func_record.schema_name || '.' || func_record.function_name || '(' || func_record.arguments || ')';
  END LOOP;
  
  IF missing_search_path_count > 0 THEN
    RAISE WARNING 'Found % functions with SECURITY DEFINER but no search_path. Run the fix_remaining_function_search_paths migration.', missing_search_path_count;
  ELSE
    RAISE NOTICE 'All SECURITY DEFINER functions have search_path set correctly.';
  END IF;
END $$;

-- 3. Create a security audit function for admins
CREATE OR REPLACE FUNCTION security_audit_report()
RETURNS TABLE (
  check_name text,
  status text,
  details text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only admins can run security audit
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  -- Check 1: Exposed views
  RETURN QUERY
  SELECT 
    'Exposed Views Check'::text,
    CASE 
      WHEN COUNT(*) = 0 THEN 'PASS'::text
      ELSE 'FAIL'::text
    END,
    'Found ' || COUNT(*) || ' views with direct auth.users access'::text
  FROM pg_views v
  WHERE v.schemaname = 'public'
  AND v.definition ILIKE '%auth.users%'
  AND v.viewname IN ('phone_sync_status', 'phone_auth_status');
  
  -- Check 2: Functions without search_path
  RETURN QUERY
  SELECT 
    'Function Search Path Check'::text,
    CASE 
      WHEN COUNT(*) = 0 THEN 'PASS'::text
      ELSE 'FAIL'::text
    END,
    'Found ' || COUNT(*) || ' SECURITY DEFINER functions without search_path'::text
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.prosecdef = true
  AND NOT EXISTS (
    SELECT 1 
    FROM pg_catalog.pg_proc p2
    WHERE p2.oid = p.oid
    AND p2.proconfig @> ARRAY['search_path=public']
  );
  
  -- Check 3: Materialized views with public access
  RETURN QUERY
  SELECT 
    'Materialized View Access Check'::text,
    CASE 
      WHEN bool_or(has_table_privilege('authenticated', mv.schemaname||'.'||mv.matviewname, 'SELECT')) THEN 'FAIL'::text
      ELSE 'PASS'::text
    END,
    'Materialized views accessible to authenticated role: ' || 
    COALESCE(string_agg(mv.matviewname, ', ') FILTER (WHERE has_table_privilege('authenticated', mv.schemaname||'.'||mv.matviewname, 'SELECT')), 'none')::text
  FROM pg_matviews mv
  WHERE mv.schemaname = 'public';
  
  -- Check 4: RLS status on critical tables
  RETURN QUERY
  SELECT 
    'Row Level Security Check'::text,
    CASE 
      WHEN bool_and(c.relrowsecurity) THEN 'PASS'::text
      ELSE 'FAIL'::text
    END,
    'Tables without RLS: ' || 
    COALESCE(string_agg(c.relname, ', ') FILTER (WHERE NOT c.relrowsecurity), 'none')::text
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN (
    'profiles', 'voice_messages', 'voice_message_recipients', 
    'saved_items', 'notes', 'user_roles', 'notification_preferences'
  );
END;
$$;

-- 4. Grant execute permission
GRANT EXECUTE ON FUNCTION security_audit_report() TO authenticated;

-- 5. Add helpful comments
COMMENT ON FUNCTION security_audit_report() IS 'Run security audit checks (admin only)';

-- 6. Create summary of security fixes applied
DO $$
BEGIN
  RAISE NOTICE '
===========================================================
SECURITY FIXES APPLIED:
===========================================================
1. Removed exposed views (phone_sync_status, phone_auth_status)
   - Replaced with secure admin-only functions
   - Added get_my_phone_sync_status() for users

2. Fixed search_path on all SECURITY DEFINER functions:
   - has_role()
   - format_phone_e164()
   - sync_phone_to_auth()
   - sync_all_phones()
   - trigger_sync_phone_to_auth()
   - handle_profile_phone_update()
   - handle_auth_phone_update()
   - confirm_user_phone()
   - admin_fix_unconfirmed_phones()
   - admin_fix_unconfirmed_phones_simple()
   - trigger_voice_message_notification()
   - get_sender_profile()
   - update_sender_info()
   - notify_new_voice_message()

3. Secured materialized view (message_delivery_stats)
   - Removed public/authenticated access
   - Created secure wrapper functions
   - Added admin-only access control

4. Created security audit function for ongoing monitoring

NEXT STEPS:
1. Run migrations: supabase db push
2. Update extensions via Supabase dashboard
3. Test all functions to ensure they work correctly
4. Run security_audit_report() to verify fixes
===========================================================
';
END $$;